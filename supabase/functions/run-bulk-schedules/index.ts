// Edge function: run-bulk-schedules
// Called by cron to find schedules due for execution,
// then dispatches queueBulkCommand on the VPS via direct API call.
//
// Schedule matching logic:
// - time_utc stores LOCAL time (in the schedule's timezone, despite column name)
// - We convert current UTC time to each schedule's timezone to compare
// - every_day=true matches any day; otherwise day_of_week must match
// - After execution, we compute and store next_run_at

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Block SSRF: reject private/loopback/link-local/metadata IPs */
function isBlockedHost(hostname: string): boolean {
  if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.|169\.254\.)/.test(hostname)) return true;
  if (/^(::1|fc|fd|fe80)/i.test(hostname)) return true;
  if (/^::ffff:(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.|169\.254\.)/i.test(hostname)) return true;
  if (hostname === "metadata.google.internal" || hostname === "metadata") return true;
  if (hostname === "localhost") return true;
  return false;
}

/** Get current day-of-week and HH:MM in a given timezone */
function getNowInTz(tz: string): { dayOfWeek: number; timeHHMM: string; isoString: string } {
  const now = new Date();
  // Use Intl to get parts in the target timezone
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const dayStr = parts.find(p => p.type === "weekday")?.value ?? "";
  const hourStr = parts.find(p => p.type === "hour")?.value ?? "00";
  const minuteStr = parts.find(p => p.type === "minute")?.value ?? "00";

  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayOfWeek = dayMap[dayStr] ?? now.getUTCDay();
  const hh = hourStr.padStart(2, "0");
  const mm = minuteStr.padStart(2, "0");

  return { dayOfWeek, timeHHMM: `${hh}:${mm}`, isoString: now.toISOString() };
}

/** Compute next_run_at for a schedule */
function computeNextRunAt(everyDay: boolean, dayOfWeek: number, timeLocal: string, tz: string): string {
  const [hh, mm] = timeLocal.split(":").map(Number);
  
  // Get current time in target timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value ?? "0");
  
  const nowYear = get("year");
  const nowMonth = get("month") - 1;
  const nowDay = get("day");
  const nowHour = get("hour");
  const nowMinute = get("minute");
  
  // Build a reference date in the tz
  // We'll work with simple day offsets
  const nowTotalMinutes = nowHour * 60 + nowMinute;
  const targetMinutes = (hh || 0) * 60 + (mm || 0);
  
  let daysAhead = 0;
  
  if (everyDay) {
    daysAhead = targetMinutes > nowTotalMinutes ? 0 : 1;
  } else {
    // Get current day of week in tz
    const dayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" });
    const dayStr = dayFormatter.format(now);
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const currentDow = dayMap[dayStr] ?? 0;
    
    daysAhead = dayOfWeek - currentDow;
    if (daysAhead < 0 || (daysAhead === 0 && targetMinutes <= nowTotalMinutes)) {
      daysAhead += 7;
    }
  }
  
  // Build the target date
  const target = new Date(now.getTime() + daysAhead * 86400000);
  // Format target date in tz to get the correct date parts
  const targetParts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour12: false,
  }).formatToParts(target);
  const tGet = (t: string) => parseInt(targetParts.find(p => p.type === t)?.value ?? "0");
  
  // Create an ISO string approximation - create date string in tz then parse
  const dateStr = `${tGet("year")}-${String(tGet("month")).padStart(2, "0")}-${String(tGet("day")).padStart(2, "0")}T${String(hh || 0).padStart(2, "0")}:${String(mm || 0).padStart(2, "0")}:00`;
  
  // We need to convert from tz local to UTC. Use the offset.
  const tempDate = new Date(dateStr + "Z"); // treat as UTC first
  const inTz = new Date(tempDate.toLocaleString("en-US", { timeZone: tz }));
  const offsetMs = tempDate.getTime() - inTz.getTime();
  // Actual UTC = local time + offset (reverse of what toLocaleString does)
  // Actually: if we format tempDate in tz and get inTz, offset = tempDate - inTz
  // So to get UTC from a local time: utc = local + offset
  const utcTime = new Date(tempDate.getTime() + offsetMs);
  
  return utcTime.toISOString();
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (bearer !== SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const now = new Date();
    const cutoff = new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString();

    // Fetch ALL active schedules — we filter by timezone-aware matching below
    const { data: allSchedules, error: fetchErr } = await supabase
      .from("gm_bulk_schedules")
      .select("*")
      .eq("is_active", true);

    if (fetchErr) {
      console.error("Failed to fetch schedules:", fetchErr);
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dueSchedules: typeof allSchedules = [];

    for (const s of allSchedules || []) {
      // Skip recently run
      if (s.last_run_at && new Date(s.last_run_at).toISOString() >= cutoff) continue;

      const tz = s.timezone || "America/Sao_Paulo";
      const { dayOfWeek: nowDow, timeHHMM: nowTime } = getNowInTz(tz);
      const isDaily = s.every_day || (s.selection as Record<string, unknown>)?.every_day === true;

      // Check day match
      if (!isDaily && s.day_of_week !== nowDow) continue;

      // Check time match (exact minute)
      if (s.time_utc !== nowTime) continue;

      dueSchedules.push(s);
    }

    const results: Array<{ schedule_id: string; status: string; job_id?: string; error?: string }> = [];

    for (const schedule of dueSchedules) {
      try {
        const [{ data: tenantInfo, error: tenantInfoErr }, { data: tenantSecret }] = await Promise.all([
          supabase.from("tenants").select("pw_api_base_url").eq("id", schedule.tenant_id).single(),
          supabase.from("tenant_secrets").select("pw_api_secret").eq("tenant_id", schedule.tenant_id).maybeSingle(),
        ]);
        const pw_api_base_url = tenantInfo?.pw_api_base_url;
        const pw_api_secret = tenantSecret?.pw_api_secret;

        if (tenantInfoErr || !pw_api_base_url || !pw_api_secret) {
          const errMsg = tenantInfoErr?.message || "Tenant sem API configurada";
          const tz = schedule.timezone || "America/Sao_Paulo";
          const isDaily = schedule.every_day || (schedule.selection as Record<string, unknown>)?.every_day === true;
          const nextRun = computeNextRunAt(isDaily, schedule.day_of_week, schedule.time_utc, tz);
          await supabase.from("gm_bulk_schedules").update({
            last_run_at: now.toISOString(),
            last_run_status: "error",
            last_error: errMsg,
            next_run_at: nextRun,
          }).eq("id", schedule.id);
          results.push({ schedule_id: schedule.id, status: "error", error: errMsg });
          continue;
        }

        let parsedUrl: URL;
        try {
          parsedUrl = new URL(pw_api_base_url);
        } catch {
          const errMsg = "Invalid pw_api_base_url";
          await supabase.from("gm_bulk_schedules").update({ last_run_at: now.toISOString(), last_run_status: "error", last_error: errMsg }).eq("id", schedule.id);
          results.push({ schedule_id: schedule.id, status: "error", error: errMsg });
          continue;
        }
        if (isBlockedHost(parsedUrl.hostname)) {
          const errMsg = "Blocked: private/internal URL not allowed";
          await supabase.from("gm_bulk_schedules").update({ last_run_at: now.toISOString(), last_run_status: "error", last_error: errMsg }).eq("id", schedule.id);
          results.push({ schedule_id: schedule.id, status: "error", error: errMsg });
          continue;
        }

        const apiUrl = `${pw_api_base_url.replace(/\/$/, "")}/api_cls.php?action=queueBulkCommand`;
        const payload: Record<string, unknown> = {
          command_key: schedule.command_key,
          ...(typeof schedule.selection === "object" ? schedule.selection : {}),
          ...(typeof schedule.command_payload === "object" ? schedule.command_payload : {}),
          actor: `scheduler:${schedule.id}`,
        };
        if (schedule.command_key === "grantMallCash") {
          payload.confirm = "GRANT_MALL_CASH";
        }

        const vpsResp = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-sync-secret": pw_api_secret,
          },
          body: JSON.stringify(payload),
        });

        const vpsBody = await vpsResp.json();
        const tz = schedule.timezone || "America/Sao_Paulo";
        const isDaily = schedule.every_day || (schedule.selection as Record<string, unknown>)?.every_day === true;
        const nextRun = computeNextRunAt(isDaily, schedule.day_of_week, schedule.time_utc, tz);

        if (vpsBody.success && vpsBody.job?.id) {
          await supabase.from("gm_bulk_schedules").update({
            last_run_at: now.toISOString(),
            last_run_status: "ok",
            last_run_job_id: vpsBody.job.id,
            last_error: null,
            next_run_at: nextRun,
          }).eq("id", schedule.id);
          results.push({ schedule_id: schedule.id, status: "ok", job_id: vpsBody.job.id });
        } else {
          const errMsg = vpsBody.error || "VPS returned failure";
          await supabase.from("gm_bulk_schedules").update({
            last_run_at: now.toISOString(),
            last_run_status: "error",
            last_error: errMsg,
            next_run_at: nextRun,
          }).eq("id", schedule.id);
          results.push({ schedule_id: schedule.id, status: "error", error: errMsg });
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        await supabase.from("gm_bulk_schedules").update({
          last_run_at: now.toISOString(),
          last_run_status: "error",
          last_error: errMsg,
        }).eq("id", schedule.id);
        results.push({ schedule_id: schedule.id, status: "error", error: errMsg });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked_at: now.toISOString(),
        due_count: dueSchedules.length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("run-bulk-schedules error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

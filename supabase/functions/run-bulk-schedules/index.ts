// Edge function: run-bulk-schedules
// Called by cron (pg_cron via pg_net) to find schedules due for execution,
// then dispatches queueBulkCommand on the VPS via clsconfig-proxy.
//
// Flow:
// 1. Query gm_bulk_schedules where is_active=true and day_of_week matches and time_utc is due
// 2. For each due schedule, call the VPS queueBulkCommand via the tenant's API
// 3. Update last_run_at, last_run_status, last_run_job_id

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

/** Block SSRF: reject private/loopback/link-local/metadata IPs */
function isBlockedHost(hostname: string): boolean {
  // IPv4 patterns
  if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.|169\.254\.)/.test(hostname)) return true;
  // IPv6 loopback, link-local, unique-local
  if (/^(::1|fc|fd|fe80)/i.test(hostname)) return true;
  // IPv4-mapped IPv6
  if (/^::ffff:(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.|169\.254\.)/i.test(hostname)) return true;
  // Common metadata endpoints
  if (hostname === "metadata.google.internal" || hostname === "metadata") return true;
  if (hostname === "localhost") return true;
  return false;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth: only allow cron (service-role bearer)
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

    // Get current UTC day-of-week and time
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sunday
    const currentHH = String(now.getUTCHours()).padStart(2, "0");
    const currentMM = String(now.getUTCMinutes()).padStart(2, "0");
    const currentTimeUtc = `${currentHH}:${currentMM}`;

    // Find schedules due: active, matching day, time within 5 min window,
    // and not already run in the last 23 hours
    const cutoff = new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString();

    const { data: schedules, error: fetchErr } = await supabase
      .from("gm_bulk_schedules")
      .select("*")
      .eq("is_active", true)
      .eq("day_of_week", dayOfWeek)
      .eq("time_utc", currentTimeUtc);

    if (fetchErr) {
      console.error("Failed to fetch schedules:", fetchErr);
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter out schedules that already ran recently
    const dueSchedules = (schedules || []).filter((s) => {
      if (!s.last_run_at) return true;
      return new Date(s.last_run_at).toISOString() < cutoff;
    });

    const results: Array<{ schedule_id: string; status: string; job_id?: string; error?: string }> = [];

    for (const schedule of dueSchedules) {
      try {
        // Get the tenant's API config
        const { data: tenant, error: tenantErr } = await supabase
          .from("tenants")
          .select("pw_api_base_url, pw_api_secret")
          .eq("id", schedule.tenant_id)
          .single();

        if (tenantErr || !tenant?.pw_api_base_url || !tenant?.pw_api_secret) {
          const errMsg = tenantErr?.message || "Tenant sem API configurada";
          await supabase
            .from("gm_bulk_schedules")
            .update({
              last_run_at: now.toISOString(),
              last_run_status: "error",
              last_error: errMsg,
            })
            .eq("id", schedule.id);
          results.push({ schedule_id: schedule.id, status: "error", error: errMsg });
          continue;
        }

        // SSRF check: block private/internal URLs
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(tenant.pw_api_base_url);
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

        // Call the VPS queueBulkCommand directly
        const apiUrl = `${tenant.pw_api_base_url.replace(/\/$/, "")}/api_cls.php?action=queueBulkCommand`;
        const payload: Record<string, unknown> = {
          command_key: schedule.command_key,
          ...(typeof schedule.selection === "object" ? schedule.selection : {}),
          ...(typeof schedule.command_payload === "object" ? schedule.command_payload : {}),
          actor: `scheduler:${schedule.id}`,
        };
        // Auto-inject confirmation token for grantMallCash
        if (schedule.command_key === "grantMallCash") {
          payload.confirm = "GRANT_MALL_CASH";
        }

        const vpsResp = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-sync-secret": tenant.pw_api_secret,
          },
          body: JSON.stringify(payload),
        });

        const vpsBody = await vpsResp.json();

        if (vpsBody.success && vpsBody.job?.id) {
          await supabase
            .from("gm_bulk_schedules")
            .update({
              last_run_at: now.toISOString(),
              last_run_status: "ok",
              last_run_job_id: vpsBody.job.id,
              last_error: null,
            })
            .eq("id", schedule.id);
          results.push({ schedule_id: schedule.id, status: "ok", job_id: vpsBody.job.id });
        } else {
          const errMsg = vpsBody.error || "VPS returned failure";
          await supabase
            .from("gm_bulk_schedules")
            .update({
              last_run_at: now.toISOString(),
              last_run_status: "error",
              last_error: errMsg,
            })
            .eq("id", schedule.id);
          results.push({ schedule_id: schedule.id, status: "error", error: errMsg });
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        await supabase
          .from("gm_bulk_schedules")
          .update({
            last_run_at: now.toISOString(),
            last_run_status: "error",
            last_error: errMsg,
          })
          .eq("id", schedule.id);
        results.push({ schedule_id: schedule.id, status: "error", error: errMsg });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked_at: now.toISOString(),
        day_of_week: dayOfWeek,
        time_utc: currentTimeUtc,
        due_count: dueSchedules.length,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("run-bulk-schedules error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

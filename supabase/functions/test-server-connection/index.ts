// Edge Function: test-server-connection
// Testa se uma URL+secret de uma VPS PW responde corretamente.
// Aceita { url, secret } no body OU { tenant_id } (lê do banco com RLS).
// Sempre valida JWT do caller. Grava resultado em tenants quando tenant_id é passado.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface TestBody {
  url?: string;
  secret?: string;
  tenant_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SR_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userRes, error: userErr } = await userClient.auth.getUser(
    authHeader.slice(7).trim(),
  );
  if (userErr || !userRes?.user) {
    return jsonResponse({ success: false, error: "Token inválido ou expirado" }, 401);
  }
  const userId = userRes.user.id;

  let body: TestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "Body inválido" }, 400);
  }

  const admin = createClient(SUPABASE_URL, SR_KEY, { auth: { persistSession: false } });

  let url = (body.url ?? "").trim().replace(/\/+$/, "");
  let secret = body.secret ?? "";
  let tenantId = body.tenant_id ?? null;

  // Modo "testar tenant existente": lê credenciais do banco (sem expor pro client).
  if (tenantId && (!url || !secret)) {
    const { data: t, error: tErr } = await admin
      .from("tenants")
      .select("owner_id, pw_api_base_url, pw_api_secret")
      .eq("id", tenantId)
      .maybeSingle();
    if (tErr || !t) return jsonResponse({ success: false, error: "Servidor não encontrado" }, 404);
    // Aceita owner OU membro do servidor (convidado aceito).
    let allowed = t.owner_id === userId;
    if (!allowed) {
      const { data: m } = await admin
        .from("server_members")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .maybeSingle();
      allowed = !!m;
    }
    if (!allowed) return jsonResponse({ success: false, error: "Acesso negado" }, 403);
    url = (t.pw_api_base_url ?? "").replace(/\/+$/, "");
    secret = t.pw_api_secret ?? "";
  }

  if (!url || !secret) {
    return jsonResponse({ success: false, error: "URL e secret são obrigatórios" }, 400);
  }
  if (!/^https?:\/\//i.test(url)) {
    return jsonResponse({ success: false, error: "URL precisa começar com http:// ou https://" }, 400);
  }

  const endpoint = url.endsWith(".php") ? url : `${url}/apicls/api_cls.php`;
  const target = `${endpoint}?action=getClsconfig`;

  const startedAt = Date.now();
  let httpStatus = 0;
  let upstreamOk = false;
  let upstreamMessage = "";
  let upstreamSuccess = false;
  let entriesCount: number | null = null;

  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 15_000);
    const res = await fetch(target, {
      method: "GET",
      headers: { Accept: "application/json", "x-sync-secret": secret },
      signal: ctrl.signal,
    });
    clearTimeout(timeout);
    httpStatus = res.status;
    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      upstreamMessage = `Resposta não-JSON (${text.slice(0, 200)})`;
    }
    if (parsed && typeof parsed === "object") {
      const p = parsed as Record<string, unknown>;
      upstreamSuccess = p.success === true;
      if (Array.isArray(p.entries)) entriesCount = p.entries.length;
      if (typeof p.error === "string") upstreamMessage = p.error;
    }
    upstreamOk = res.ok && upstreamSuccess;
  } catch (e) {
    upstreamMessage = e instanceof Error ? e.message : String(e);
  }

  const elapsedMs = Date.now() - startedAt;
  const status = upstreamOk ? "ok" : "error";
  const errorText = upstreamOk
    ? null
    : upstreamMessage || `HTTP ${httpStatus || "0"} sem corpo válido`;

  // Persiste resultado no tenant se foi um teste sobre tenant existente.
  if (tenantId) {
    await admin
      .from("tenants")
      .update({
        connection_status: status,
        connection_tested_at: new Date().toISOString(),
        connection_error: errorText,
      })
      .eq("id", tenantId);
  }

  // Audit log.
  await admin.from("audit_logs").insert({
    user_id: userId,
    tenant_id: tenantId,
    action: "test_connection",
    target: endpoint,
    status,
    http_status: httpStatus || null,
    error: errorText,
    metadata: { elapsed_ms: elapsedMs, entries: entriesCount },
  });

  return jsonResponse({
    success: upstreamOk,
    http_status: httpStatus,
    elapsed_ms: elapsedMs,
    entries: entriesCount,
    endpoint,
    error: errorText,
  });
});

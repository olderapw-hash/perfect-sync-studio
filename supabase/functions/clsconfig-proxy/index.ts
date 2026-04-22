// Edge Function: clsconfig-proxy
// Proxies requests to the external PW API so the secret is never exposed to the browser.
// Routes:
//   GET  /clsconfig                          -> action=getClsconfig
//   POST /clsconfig                          -> action=saveClsconfigTemplate (com roleid)
//   GET  /clsconfig-proxy/action/<name>      -> ?action=<name>&<query passthrough>
//   POST /clsconfig-proxy/action/<name>      -> ?action=<name> com body JSON
//
// Whitelist de actions extras (Lote 3): getItemCatalog, listBackups,
// restoreBackup, saveRoleEditable. Tudo fora da whitelist é rejeitado.
//
// AUTH: o config.toml ainda usa verify_jwt = false porque precisamos
// devolver erros customizados (CORS, JSON), então validamos o JWT em
// código + checamos o papel `admin` em `user_roles` antes de qualquer
// chamada upstream. Sem admin → 401/403, sem segredo vazado.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-server-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const ALLOWED_ACTIONS = new Set([
  "getItemCatalog",
  "listBackups",
  "restoreBackup",
  "getRoleEditable",
  "saveRoleEditable",
]);

function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

/**
 * Valida o JWT do chamador e exige `admin` em `public.user_roles`.
 * Retorna `{ userId }` se autorizado, ou uma `Response` de erro caso contrário.
 */
async function requireAdmin(req: Request): Promise<Response | { userId: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonError("Unauthorized: missing bearer token (sessão expirou? faça login novamente)", 401);
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return jsonError("Unauthorized: empty token", 401);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return jsonError("Auth misconfigured", 500);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userRes?.user) {
    console.warn("[clsconfig-proxy] getUser failed:", userErr?.message);
    return jsonError("Unauthorized: token inválido ou expirado", 401);
  }

  // Aceita admin OU superadmin — superadmin é estritamente mais permissivo.
  const { data: roleRows, error: roleErr } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userRes.user.id)
    .in("role", ["admin", "superadmin"]);
  if (roleErr) {
    console.error("[clsconfig-proxy] role lookup error", roleErr.message);
    return jsonError("Forbidden", 403);
  }
  if (!roleRows || roleRows.length === 0) {
    return jsonError("Forbidden: admin role required", 403);
  }

  return { userId: userRes.user.id };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ⚠️ Auth GLOBAL: nenhuma rota desta função pode rodar sem admin.
  // Agora também devolvemos o user.id pra ler o tenant correto.
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;
  const callerUserId = authResult.userId;

  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const route = segments[segments.length - 1] || "";

  // Header opcional: usuário pode escolher um tenant específico (mesmo que não seja o ativo).
  // Validamos ownership antes de usar.
  const requestedServerId = req.headers.get("x-server-id");

  // Resolução de credenciais por tenant (multi-servidor):
  // 1. Se x-server-id veio E pertence ao user → usa esse tenant.
  // 2. Senão lê o tenant ATIVO do user (is_active=true).
  // 3. Senão (superadmin sem tenant) → cai pro app_settings global.
  // 4. Último fallback: env vars.
  let PW_API_BASE_URL = Deno.env.get("PW_API_BASE_URL") ?? "";
  let PW_API_SECRET = Deno.env.get("PW_API_SECRET") ?? "";
  let credSource: "tenant_explicit" | "tenant_active" | "app_settings" | "env" = "env";
  let resolvedTenantId: string | null = null;
  const SR_URL = Deno.env.get("SUPABASE_URL");
  const SR_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const admin =
    SR_URL && SR_KEY
      ? createClient(SR_URL, SR_KEY, { auth: { persistSession: false } })
      : null;

  try {
    if (admin) {
      // 1) Tenant explícito via header (validar ownership)
      if (requestedServerId) {
        const { data: tRow } = await admin
          .from("tenants")
          .select("id, owner_id, pw_api_base_url, pw_api_secret")
          .eq("id", requestedServerId)
          .maybeSingle();
        if (tRow && tRow.owner_id === callerUserId) {
          PW_API_BASE_URL = tRow.pw_api_base_url ?? "";
          PW_API_SECRET = tRow.pw_api_secret ?? "";
          resolvedTenantId = tRow.id;
          credSource = "tenant_explicit";
        }
      }

      // 2) Tenant ativo do user
      if (credSource === "env") {
        const { data: tenantRow } = await admin
          .from("tenants")
          .select("id, pw_api_base_url, pw_api_secret")
          .eq("owner_id", callerUserId)
          .eq("is_active", true)
          .maybeSingle();
        if (tenantRow?.pw_api_base_url && tenantRow?.pw_api_secret) {
          PW_API_BASE_URL = tenantRow.pw_api_base_url;
          PW_API_SECRET = tenantRow.pw_api_secret;
          resolvedTenantId = tenantRow.id;
          credSource = "tenant_active";
        } else {
          // 3) Fallback global (superadmin sem tenant)
          const { data: cfg } = await admin
            .from("app_settings")
            .select("pw_api_base_url, pw_api_secret")
            .eq("id", 1)
            .maybeSingle();
          if (cfg?.pw_api_base_url) PW_API_BASE_URL = cfg.pw_api_base_url;
          if (cfg?.pw_api_secret) PW_API_SECRET = cfg.pw_api_secret;
          if (cfg?.pw_api_base_url || cfg?.pw_api_secret) credSource = "app_settings";
        }
      }
    }
  } catch (e) {
    console.warn("[clsconfig-proxy] settings lookup failed, using env vars", e);
  }
  console.log("[clsconfig-proxy] cred source:", credSource, "user:", callerUserId, "tenant:", resolvedTenantId);

  // Helper para gravar audit log de cada ação proxied (não-bloqueante).
  const logAction = async (action: string, target: string, ok: boolean, httpStatus: number, error?: string) => {
    if (!admin) return;
    try {
      await admin.from("audit_logs").insert({
        user_id: callerUserId,
        tenant_id: resolvedTenantId,
        action,
        target,
        status: ok ? "ok" : "error",
        http_status: httpStatus || null,
        error: error ?? null,
        metadata: { cred_source: credSource },
      });
    } catch (e) {
      console.warn("[clsconfig-proxy] audit log failed:", e);
    }
  };

  if (!PW_API_BASE_URL || !PW_API_SECRET) {
    return new Response(
      JSON.stringify({ success: false, error: "Nenhum servidor configurado. Cadastre um servidor em 'Meus Servidores'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const base = PW_API_BASE_URL.replace(/\/+$/, "");

  if (!/^https?:\/\//i.test(base)) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          "PW_API_BASE_URL inválida. Deve ser o domínio/base do servidor (ex.: https://seusite.com). Valor recebido: " +
          base.slice(0, 80),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const endpoint = base.endsWith(".php") ? base : `${base}/apicls/api_cls.php`;

  // Detecta rota /action/<name>
  const actionIdx = segments.indexOf("action");
  const isActionRoute = actionIdx !== -1 && segments[actionIdx + 1];
  const isClsRoute = !isActionRoute && (route === "clsconfig" || route === "clsconfig-proxy");

  try {
    // ----- Rotas legadas /clsconfig (mantidas para compat) -----
    if (req.method === "GET" && isClsRoute) {
      const target = `${endpoint}?action=getClsconfig`;
      const upstream = await fetch(target, {
        method: "GET",
        headers: { Accept: "application/json", "x-sync-secret": PW_API_SECRET },
      });
      const out = await relay(upstream);
      void logAction("getClsconfig", target, out.status === 200, upstream.status);
      return out;
    }

    if (req.method === "POST" && isClsRoute) {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return new Response(
          JSON.stringify({ success: false, error: "Body inválido (esperado JSON)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const b = (body ?? {}) as Record<string, unknown>;
      const hasRoleid = Object.prototype.hasOwnProperty.call(b, "roleid") && b.roleid != null;
      const hasFull = Object.prototype.hasOwnProperty.call(b, "template") &&
        Object.prototype.hasOwnProperty.call(b, "key_hex");
      const hasStatus = Object.prototype.hasOwnProperty.call(b, "status");
      const hasInventory = Object.prototype.hasOwnProperty.call(b, "inventory");
      if (!hasRoleid || (!hasFull && !hasStatus && !hasInventory)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Payload incompleto: requer roleid e (template+key_hex) ou status ou inventory",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const roleidParam = encodeURIComponent(String(b.roleid));
      const target = `${endpoint}?action=saveClsconfigTemplate&roleid=${roleidParam}`;
      console.log("[clsconfig-proxy] POST →", target, "roleid:", String(b.roleid));
      const upstream = await fetch(target, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-sync-secret": PW_API_SECRET,
        },
        body: JSON.stringify(body),
      });
      const cloned = upstream.clone();
      const preview = (await cloned.text()).slice(0, 500);
      console.log("[clsconfig-proxy] upstream status:", upstream.status, "body:", preview);
      const out = await relay(upstream);
      void logAction(
        hasFull ? "saveClsconfigTemplate" : hasStatus ? "saveStatus" : "saveInventory",
        `${target} roleid=${String(b.roleid)}`,
        out.status === 200,
        upstream.status,
      );
      return out;
    }

    // ----- Nova rota /action/<name> com whitelist -----
    if (isActionRoute) {
      const action = segments[actionIdx + 1];
      if (!ALLOWED_ACTIONS.has(action)) {
        return new Response(
          JSON.stringify({ success: false, error: `Action não permitida: ${action}` }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Passthrough da querystring (filtramos chaves perigosas).
      const qs = new URLSearchParams();
      qs.set("action", action);
      for (const [k, v] of url.searchParams.entries()) {
        if (k === "action") continue;
        qs.append(k, v);
      }
      const target = `${endpoint}?${qs.toString()}`;

      const init: RequestInit = {
        method: req.method,
        headers: {
          Accept: "application/json",
          "x-sync-secret": PW_API_SECRET,
        },
      };
      if (req.method === "POST") {
        const text = await req.text();
        init.body = text;
        (init.headers as Record<string, string>)["Content-Type"] = "application/json";
      }

      console.log("[clsconfig-proxy] action →", action, "method:", req.method);
      const upstream = await fetch(target, init);
      console.log("[clsconfig-proxy] action status:", upstream.status);
      const out = await relay(upstream);
      void logAction(action, target, out.status === 200, upstream.status);
      return out;
    }

    return new Response(
      JSON.stringify({ success: false, error: "Not found", path: url.pathname, method: req.method }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    void logAction("error", url.pathname, false, 0, message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function relay(upstream: Response): Promise<Response> {
  const text = await upstream.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Upstream returned non-JSON",
        status: upstream.status,
        body: text.slice(0, 2000),
      }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  return new Response(JSON.stringify(json), {
    status: upstream.ok ? 200 : upstream.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

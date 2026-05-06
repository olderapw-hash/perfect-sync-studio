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
// PERMISSÕES POR MÓDULO: cada action exige uma permissão específica
// (ver ACTION_PERMISSION). Owner do tenant tem tudo. Outros membros
// passam por has_server_permission(tenant, user, perm).
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
  "getClsconfig",
  "getItemCatalog",
  "listBackups",
  "restoreBackup",
  "getRoleEditable",
  "saveRoleEditable",
  "saveClsconfigTemplate",
  "getBackupContent",
  "sendMailItem",
  "sendMailGold",
  // Operação do Servidor v1 — apenas leitura/export, sem ações destrutivas.
  "getServiceStatus",
  "getServerLogs",
  "exportClsconfig",
  // Segurança v1 — moderação (kick/ban/unban + histórico).
  "kickRole",
  "banAccount",
  "unbanAccount",
  "listSecurityHistory",
  // Server Ops v2 — operação real (mensagem global + manutenção).
  "sendSystemMessage",
  "getMaintenanceMode",
  "setMaintenanceMode",
  // Server Ops v3 — controle real de servicos.
  "getManageableServices",
  "startService",
  "stopService",
  "restartService",
  // Server Ops v4 — controle do servidor inteiro (autostart-aware).
  // startServer/restartServer usam autostart por padrão quando `instances`
  // não é enviado (ver INSTANCE_CONTROL_V1_FRONTEND_CONTRACT.md).
  "startServer",
  "stopServer",
  "restartServer",
  // Server Ops v3 — polling de progresso de operações longas.
  "getServerOperationStatus",
  "getServerOperationsHistory",
  // Instance Control v1 — listagem + auto-start + start/stop/restart por instância.
  "getManageableInstances",
  "setInstanceAutoStart",
  "startInstance",
  "startInstances",
  "stopInstance",
  "stopInstances",
  "restartInstance",
  "restartInstances",
  // Control Center v1 — snapshot operacional + backups panel-level + watchdog.
  "getControlCenterSnapshot",
  "backupNow",
  "getWatchdogStatus",
  "getWatchdogHistory",
  "saveWatchdogConfig",
  "enableWatchdog",
  "disableWatchdog",
  "runWatchdogCheckNow",
  // GM Commander v1 — catálogo + histórico + mall cash + mutes.
  "getGmCommandCatalog",
  "getGmActionHistory",
  "getMallCashBalance",
  "grantMallCash",
  "muteAccount",
  "muteRole",
  // GM Commander v2 — permissões GM granulares (espelha pwadmin).
  "getGmPermissionCatalog",
  "getGmPermissionState",
  "grantGmPermission",
  "revokeGmPermission",
  // GM Commander — moderação extra.
  "clearRolePk",
  // GM Commander v2 — Bulk Commands (Phase A).
  "searchPlayerDirectory",
  "getPlayerTargetProfile",
  "resolveBulkTargets",
  "previewBulkTargets",
  "queueBulkCommand",
  "getBulkCommandJob",
  "getBulkCommandJobs",
]);

// Mapa Action → permissão exigida (deve refletir src/lib/serverPermissions.ts).
const ACTION_PERMISSION: Record<string, string> = {
  getClsconfig: "view",
  getItemCatalog: "view",
  listBackups: "view",
  getRoleEditable: "view",
  getBackupContent: "view",
  saveClsconfigTemplate: "save_templates",
  saveRoleEditable: "save_real_roles",
  restoreBackup: "restore_backup",
  sendMailItem: "save_real_roles",
  sendMailGold: "save_real_roles",
  // Server Ops: leitura → "view"; exportClsconfig é gating-equivalente
  // a salvar template (regrava clsconfig.data) → "save_templates".
  getServiceStatus: "view",
  getServerLogs: "view_audit",
  exportClsconfig: "save_templates",
  // Segurança v1: moderação exige manage_security; leitura do histórico
  // segue view_audit (mesmo padrão de auditoria).
  kickRole: "manage_security",
  banAccount: "manage_security",
  unbanAccount: "manage_security",
  listSecurityHistory: "view_audit",
  // Server Ops v2: mensagem global usa o mesmo gating de save_templates;
  // manutenção (set/get) é estado operacional do servidor → manage_servers
  // para escrita; leitura cai em "view".
  sendSystemMessage: "save_templates",
  getMaintenanceMode: "view",
  setMaintenanceMode: "manage_servers",
  // Server Ops v3 — leitura é "view"; ações destrutivas exigem manage_servers.
  getManageableServices: "view",
  startService: "manage_servers",
  stopService: "manage_servers",
  restartService: "manage_servers",
  // Server Ops v4 — controle do servidor inteiro.
  startServer: "manage_servers",
  stopServer: "manage_servers",
  restartServer: "manage_servers",
  // Polling de status de operações é leitura.
  getServerOperationStatus: "view",
  getServerOperationsHistory: "view_audit",
  // Instance Control v1: leitura é "view"; toggles e ações exigem manage_servers.
  getManageableInstances: "view",
  setInstanceAutoStart: "manage_servers",
  startInstance: "manage_servers",
  startInstances: "manage_servers",
  stopInstance: "manage_servers",
  stopInstances: "manage_servers",
  restartInstance: "manage_servers",
  restartInstances: "manage_servers",
  // Control Center v1 — snapshot é leitura; backup manual e watchdog write exigem manage_servers.
  getControlCenterSnapshot: "view",
  backupNow: "manage_servers",
  getWatchdogStatus: "view",
  getWatchdogHistory: "view_audit",
  saveWatchdogConfig: "manage_servers",
  enableWatchdog: "manage_servers",
  disableWatchdog: "manage_servers",
  runWatchdogCheckNow: "manage_servers",
  // GM Commander v1 — leitura "view"; ações sensíveis exigem manage_security.
  getGmCommandCatalog: "view",
  getGmActionHistory: "view_audit",
  getMallCashBalance: "view",
  grantMallCash: "manage_security",
  muteAccount: "manage_security",
  muteRole: "manage_security",
  // GM Permissions: leitura "view"; grant/revoke exigem manage_security.
  getGmPermissionCatalog: "view",
  getGmPermissionState: "view",
  grantGmPermission: "manage_security",
  revokeGmPermission: "manage_security",
  // GM Commander — moderação extra.
  clearRolePk: "manage_security",
  // GM Commander v2 — Bulk Commands (Phase A).
  searchPlayerDirectory: "view",
  getPlayerTargetProfile: "view",
  resolveBulkTargets: "manage_security",
  previewBulkTargets: "manage_security",
  queueBulkCommand: "manage_security",
  getBulkCommandJob: "view_audit",
  getBulkCommandJobs: "view_audit",
};

function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

/**
 * Valida o JWT do chamador e exige acesso mínimo:
 *   - role global `admin`/`superadmin` em `public.user_roles`, OU
 *   - ser membro de pelo menos um servidor (`server_members`).
 *
 * A checagem fina (qual permissão dentro do servidor) acontece adiante
 * via `has_server_permission` para a action específica.
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

  const userId = userRes.user.id;

  // 1) Tenta admin/superadmin global.
  const { data: roleRows, error: roleErr } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "superadmin"]);
  if (roleErr) {
    console.error("[clsconfig-proxy] role lookup error", roleErr.message);
    return jsonError("Forbidden", 403);
  }
  if (roleRows && roleRows.length > 0) {
    return { userId };
  }

  // 2) Senão, aceita se for membro de algum servidor.
  const { data: memberRows, error: memberErr } = await supabase
    .from("server_members")
    .select("id")
    .eq("user_id", userId)
    .limit(1);
  if (memberErr) {
    console.error("[clsconfig-proxy] member lookup error", memberErr.message);
    return jsonError("Forbidden", 403);
  }
  if (!memberRows || memberRows.length === 0) {
    return jsonError("Forbidden: você não tem acesso a nenhum servidor", 403);
  }

  return { userId };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ⚠️ Auth GLOBAL: nenhuma rota desta função pode rodar sem admin.
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;
  const callerUserId = authResult.userId;

  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const route = segments[segments.length - 1] || "";

  // Header opcional: usuário pode escolher um tenant específico (mesmo que não seja o ativo).
  // Validamos ownership/membership antes de usar.
  const requestedServerId = req.headers.get("x-server-id");

  // Resolução de credenciais por tenant (multi-servidor):
  // 1. Se x-server-id veio E user é membro → usa esse tenant.
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

  /** Checa permissão pro tenant resolvido. Owner ou superadmin global → true. */
  async function callerHasPermission(perm: string): Promise<boolean> {
    if (!admin || !resolvedTenantId) {
      // Sem tenant resolvido só rola se for fallback global (app_settings/env).
      // Nesse caso usamos a checagem de superadmin como gate (já validamos admin acima).
      const { data: rows } = await admin!
        .from("user_roles")
        .select("role")
        .eq("user_id", callerUserId)
        .eq("role", "superadmin");
      return (rows?.length ?? 0) > 0;
    }
    const { data, error } = await admin.rpc("has_server_permission", {
      _tenant_id: resolvedTenantId,
      _user_id: callerUserId,
      _permission: perm,
    });
    if (error) {
      console.warn("[clsconfig-proxy] has_server_permission error:", error.message);
      return false;
    }
    return data === true;
  }

  try {
    if (admin) {
      // 1) Tenant explícito via header (validar membership)
      if (requestedServerId) {
        const { data: tRow } = await admin
          .from("tenants")
          .select("id, owner_id, pw_api_base_url, pw_api_secret")
          .eq("id", requestedServerId)
          .maybeSingle();
        if (tRow) {
          // owner direto OU membro via server_members
          const isOwner = tRow.owner_id === callerUserId;
          let isMember = isOwner;
          if (!isOwner) {
            const { data: m } = await admin
              .from("server_members")
              .select("id")
              .eq("tenant_id", tRow.id)
              .eq("user_id", callerUserId)
              .maybeSingle();
            isMember = !!m;
          }
          if (isMember) {
            PW_API_BASE_URL = tRow.pw_api_base_url ?? "";
            PW_API_SECRET = tRow.pw_api_secret ?? "";
            resolvedTenantId = tRow.id;
            credSource = "tenant_explicit";
          }
        }
      }

      // 2) Tenant ativo do user (como owner)
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
        }
      }

      // 2.5) Convidado: nenhum tenant próprio. Pega via server_members.
      // Se for membro de exatamente 1 servidor, usa ele direto. Se for múltiplos,
      // pega o mais recente (cliente deveria mandar x-server-id pra ser explícito).
      if (credSource === "env") {
        const { data: memberships } = await admin
          .from("server_members")
          .select("tenant_id, created_at, tenants:tenant_id(id, pw_api_base_url, pw_api_secret)")
          .eq("user_id", callerUserId)
          .order("created_at", { ascending: false });
        type TenantCreds = { id: string; pw_api_base_url: string | null; pw_api_secret: string | null };
        const pickTenant = (m: unknown): TenantCreds | null => {
          const raw = (m as { tenants: TenantCreds | TenantCreds[] | null }).tenants;
          if (!raw) return null;
          return Array.isArray(raw) ? (raw[0] ?? null) : raw;
        };
        const firstWithCreds = (memberships ?? [])
          .map(pickTenant)
          .find((t): t is TenantCreds & { pw_api_base_url: string; pw_api_secret: string } =>
            !!(t?.pw_api_base_url && t?.pw_api_secret),
          );
        if (firstWithCreds) {
          PW_API_BASE_URL = firstWithCreds.pw_api_base_url;
          PW_API_SECRET = firstWithCreds.pw_api_secret;
          resolvedTenantId = firstWithCreds.id;
          credSource = "tenant_active";
        }
      }

      // 3) Fallback global (superadmin sem tenant nenhum)
      if (credSource === "env") {
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
        error: "PW_API_BASE_URL inválida. Deve começar com http:// ou https://.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // SSRF protection: block private/loopback/link-local/metadata hosts
  const _isBlockedHost = (h: string): boolean => {
    if (!h) return true;
    if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;
     if (h === "::1" || h === "[::1]") return true;
     if (h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
     // IPv4-mapped IPv6 (e.g. ::ffff:10.0.0.1)
     const mapped = h.replace(/^\[?/, "").replace(/\]?$/, "");
     if (/^::ffff:/i.test(mapped)) return true;
    const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (m) {
      const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
      if (a === 10) return true;
      if (a === 127) return true;
      if (a === 0) return true;
      if (a === 169 && b === 254) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
      if (a >= 224) return true;
    }
    return false;
  };

  try {
    const parsedBase = new URL(base);
    if (_isBlockedHost(parsedBase.hostname.toLowerCase())) {
      return jsonError("Host não permitido (endereço interno/privado)", 400);
    }
  } catch {
    return jsonError("PW_API_BASE_URL inválida", 400);
  }

  const endpoint = base.endsWith(".php") ? base : `${base}/apicls/api_cls.php`;

  // Detecta rota /action/<name>
  const actionIdx = segments.indexOf("action");
  const isActionRoute = actionIdx !== -1 && segments[actionIdx + 1];
  const isClsRoute = !isActionRoute && (route === "clsconfig" || route === "clsconfig-proxy");

  /** Bloqueia se a permissão não for atendida. */
  async function ensurePermission(action: string): Promise<Response | null> {
    const perm = ACTION_PERMISSION[action];
    if (!perm) return null; // action sem permissão mapeada → mantém comportamento atual
    const ok = await callerHasPermission(perm);
    if (!ok) {
      void logAction(action, `permission_denied:${perm}`, false, 403, `Missing permission: ${perm}`);
      return jsonError(`Permissão negada: ${perm}`, 403);
    }
    return null;
  }

  try {
    // ----- Rotas legadas /clsconfig (mantidas para compat) -----
    if (req.method === "GET" && isClsRoute) {
      const denied = await ensurePermission("getClsconfig");
      if (denied) return denied;
      const target = `${endpoint}?action=getClsconfig`;
      const upstream = await fetch(target, {
        method: "GET",
        headers: { Accept: "application/json", "x-sync-secret": PW_API_SECRET },
      });
      const out = await relay(upstream, undefined, { softFail: true, context: "getClsconfig" });
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

      // Permissão depende do tipo de payload:
      //   - template completo → save_templates
      //   - status/inventory de role real → save_real_roles
      const requiredPerm = hasFull ? "save_templates" : "save_real_roles";
      const ok = await callerHasPermission(requiredPerm);
      if (!ok) {
        void logAction(
          hasFull ? "saveClsconfigTemplate" : hasStatus ? "saveStatus" : "saveInventory",
          `permission_denied:${requiredPerm}`,
          false,
          403,
          `Missing permission: ${requiredPerm}`,
        );
        return jsonError(`Permissão negada: ${requiredPerm}`, 403);
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
      const out = await relay(upstream, undefined, { softFail: true, context: "saveClsconfigTemplate" });
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

      const denied = await ensurePermission(action);
      if (denied) return denied;

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
      const out = await relay(upstream, action, { softFail: true, context: action });
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

// Actions adicionadas em fases mais novas. Quando o api_cls.php da VPS
// é antigo, ele costuma responder 500 com body vazio (ou HTML do Apache)
// em vez do JSON {error:"Acao invalida"}. Tratamos esse caso como
// endpoint_missing para o frontend mostrar a notice amigável.
const NEW_ACTIONS_FALLBACK_MISSING = new Set([
  "getServiceStatus",
  "getServerLogs",
  "exportClsconfig",
  "sendMailItem",
  "sendMailGold",
  "getBackupContent",
  "kickRole",
  "banAccount",
  "unbanAccount",
  "listSecurityHistory",
  "sendSystemMessage",
  "getMaintenanceMode",
  "setMaintenanceMode",
  "getManageableServices",
  "startService",
  "stopService",
  "restartService",
  "startServer",
  "stopServer",
  "restartServer",
  "getServerOperationStatus",
]);

async function relay(
  upstream: Response,
  action?: string,
  options?: { softFail?: boolean; context?: string },
): Promise<Response> {
  const text = await upstream.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    if (action && NEW_ACTIONS_FALLBACK_MISSING.has(action)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Acao ${action} nao disponivel nesta VPS (resposta nao-JSON, status ${upstream.status})`,
          endpoint_missing: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({
        success: false,
        error: "Upstream returned non-JSON",
        context: options?.context ?? action ?? null,
        status: upstream.status,
        body: text.slice(0, 2000),
        fallback: options?.softFail === true,
      }),
      {
        status: options?.softFail ? 200 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Detecta "Acao invalida" (action ainda não implementada na VPS) e
  // converte para uma resposta 200 com shape conhecido. O frontend
  // (pwApiActions.callAction) já detecta esse padrão e lança
  // EndpointMissingError, que é tratado pelo mailSend/orquestrador.
  if (upstream.status === 400 && json && typeof json === "object") {
    const errMsg = String((json as { error?: unknown }).error ?? "");
    if (/acao\s+invalida|a[cç][aã]o\s+inv[aá]lida|unknown\s+action/i.test(errMsg)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: errMsg || "Acao invalida (endpoint ausente nesta VPS)",
          endpoint_missing: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  if (!upstream.ok && options?.softFail) {
    const base = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
    return new Response(
      JSON.stringify({
        ...base,
        success: false,
        context: options.context ?? action ?? null,
        upstream_status: upstream.status,
        fallback: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify(json), {
    status: upstream.ok ? 200 : upstream.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

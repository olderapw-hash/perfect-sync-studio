// Edge function: superadmin deleta um usuário inteiro.
// Faz purge dos dados via RPC e depois remove a conta de auth.users
// com a service role (única forma de mexer em auth.users).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing authorization" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    // Cliente SERVICE → usado pra validar JWT (getClaims), checar role e mutar.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1) Valida JWT do caller via getClaims (sem depender de sessão).
    const { data: claimsData, error: claimsErr } = await admin.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return json({ error: "Invalid session" }, 401);
    }
    const callerId = claimsData.claims.sub as string;

    // 2) Confirma que o caller é superadmin.
    const { data: isSuper, error: roleErr } = await admin.rpc("has_role", {
      _user_id: callerId,
      _role: "superadmin",
    });
    if (roleErr) return json({ error: roleErr.message }, 403);
    if (!isSuper) return json({ error: "Superadmin only" }, 403);

    const body = await req.json();
    const targetId: string | undefined = body?.target_user_id;
    if (!targetId) return json({ error: "Missing target_user_id" }, 400);
    if (targetId === callerId) return json({ error: "Cannot delete yourself" }, 400);

    // 3) Purge dos dados de aplicação. A RPC checa superadmin via auth.uid(),
    // então precisamos chamar com o JWT do caller.
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { error: purgeErr } = await userClient.rpc("admin_purge_user_data", {
      target_user_id: targetId,
    });
    if (purgeErr) return json({ error: `purge failed: ${purgeErr.message}` }, 400);

    // 4) Remove conta de login.
    const { error: delErr } = await admin.auth.admin.deleteUser(targetId);
    if (delErr) return json({ error: `auth delete failed: ${delErr.message}` }, 400);

    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

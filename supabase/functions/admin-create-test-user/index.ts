// Edge function: superadmin cria um usuário de teste descartável.
// Gera email + senha aleatórios, cria conta confirmada, registra plano e
// data de expiração. O cleanup é feito por outra função em cron.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Plan = "free" | "pro" | "ultimate";

function rand(len: number, alphabet: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

function genEmail() {
  const slug = rand(10, "abcdefghijkmnpqrstuvwxyz23456789");
  return `teste.${slug}@orpheacore.test`;
}

function genPassword() {
  // 16 chars com letras/números + 2 especiais (atende qualquer policy razoável).
  const base = rand(14, "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789");
  const special = rand(2, "!@#$%&*?");
  return base + special;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing authorization" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // 1) Valida JWT do caller.
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData.user) {
      return json({ error: "Invalid session" }, 401);
    }
    const callerId = userData.user.id;

    // 2) Confirma superadmin.
    const { data: isSuper } = await admin.rpc("has_role", {
      _user_id: callerId,
      _role: "superadmin",
    });
    if (!isSuper) return json({ error: "Superadmin only" }, 403);

    // 3) Lê parâmetros.
    const body = await req.json().catch(() => ({}));
    const plan: Plan = (body?.plan ?? "ultimate") as Plan;
    const rawHours = Number(body?.duration_hours ?? 24);
    const isUnlimited = rawHours === 0;
    const durationHours = isUnlimited ? 0 : Math.max(1, Math.min(24 * 60, rawHours));
    if (!["free", "pro", "ultimate"].includes(plan)) {
      return json({ error: "Invalid plan" }, 400);
    }

    const email = genEmail();
    const password = genPassword();
    const expiresAt = isUnlimited ? null : new Date(Date.now() + durationHours * 60 * 60 * 1000);

    // 4) Cria usuário no auth (já confirmado).
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { test_user: true, created_by: callerId },
    });
    if (createErr || !created.user) {
      return json({ error: `create failed: ${createErr?.message ?? "unknown"}` }, 400);
    }

    // 5) Registra metadados + aplica plano.
    // Usa o userClient (JWT do caller) porque a RPC e a admin_set_user_plan
    // checam superadmin via auth.uid() — com service role auth.uid() é NULL.
    const { error: regErr } = await userClient.rpc("admin_register_test_user", {
      _user_id: created.user.id,
      _email: email,
      _plan: plan,
      _expires_at: expiresAt ? expiresAt.toISOString() : null,
      _created_by: callerId,
    });
    if (regErr) {
      // Rollback: remove a conta se falhou ao registrar.
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: `register failed: ${regErr.message}` }, 400);
    }

    return json({
      ok: true,
      user_id: created.user.id,
      email,
      password,
      plan,
      expires_at: expiresAt ? expiresAt.toISOString() : null,
    });
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

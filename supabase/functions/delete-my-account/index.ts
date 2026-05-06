import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = userData.user.id;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  try {
    // Use the existing admin_purge_user_data function to clean all data,
    // but we call it with a service-role impersonation of the user's context.
    // Since admin_purge_user_data requires superadmin, we do the cleanup manually here.

    // 1. Delete all tenants owned by user (cascades related data)
    const { data: tenants } = await admin
      .from("tenants")
      .select("id")
      .eq("owner_id", userId);

    for (const t of tenants ?? []) {
      // Delete tenant-scoped data
      await admin.from("attendance_reward_deliveries").delete().eq("tenant_id", t.id);
      await admin.from("attendance_claims").delete().eq("tenant_id", t.id);
      await admin.from("attendance_events").delete().eq("tenant_id", t.id);
      await admin.from("ingame_reward_deliveries").delete().eq("tenant_id", t.id);
      await admin.from("ingame_winners").delete().eq("tenant_id", t.id);
      await admin.from("ingame_participations").delete().eq("tenant_id", t.id);
      await admin.from("ingame_events").delete().eq("tenant_id", t.id);
      await admin.from("initial_kits").delete().eq("tenant_id", t.id);
      await admin.from("mail_send_log").delete().eq("tenant_id", t.id);
      await admin.from("mail_templates").delete().eq("tenant_id", t.id);
      await admin.from("item_favorites").delete().eq("tenant_id", t.id);
      await admin.from("server_invites").delete().eq("tenant_id", t.id);
      await admin.from("server_members").delete().eq("tenant_id", t.id);
      await admin.from("audit_logs").delete().eq("tenant_id", t.id);
      await admin.from("tenants").delete().eq("id", t.id);
    }

    // 2. Delete user-scoped data
    await admin.from("server_members").delete().eq("user_id", userId);
    await admin.from("server_invites").delete().eq("invited_by", userId);
    await admin.from("subscriptions").delete().eq("user_id", userId);
    await admin.from("user_roles").delete().eq("user_id", userId);
    await admin.from("audit_logs").delete().eq("user_id", userId);
    await admin.from("item_favorites").delete().eq("user_id", userId);

    // 3. Delete the auth user
    const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
    if (deleteErr) {
      console.error("Failed to delete auth user:", deleteErr);
      throw deleteErr;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Delete account error:", err);
    return new Response(
      JSON.stringify({ error: "Erro ao deletar conta. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { activation_token, fingerprint, ip, hostname } = body;

    if (
      !activation_token ||
      typeof activation_token !== "string" ||
      activation_token.length > 200
    ) {
      return new Response(
        JSON.stringify({ valid: false, reason: "invalid_token" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (
      !fingerprint ||
      typeof fingerprint !== "string" ||
      fingerprint.length > 500
    ) {
      return new Response(
        JSON.stringify({ valid: false, reason: "invalid_fingerprint" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.rpc("validate_vps_activation", {
      _token: activation_token,
      _fingerprint: fingerprint,
      _ip: typeof ip === "string" ? ip.substring(0, 45) : null,
      _hostname: typeof hostname === "string" ? hostname.substring(0, 255) : null,
    });

    if (error) {
      console.error("validate_vps_activation error:", error);
      return new Response(
        JSON.stringify({ valid: false, reason: "server_error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(
      JSON.stringify({ valid: false, reason: "server_error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

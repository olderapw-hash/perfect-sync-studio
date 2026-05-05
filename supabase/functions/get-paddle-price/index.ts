import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { gatewayFetch, type PaddleEnv } from '../_shared/paddle.ts';

const responseHeaders = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, responseHeaders);
  }

  // Auth check — require authenticated user
  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!bearer) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      ...responseHeaders,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data: userData, error: userErr } = await supabase.auth.getUser(bearer);
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      ...responseHeaders,
    });
  }

  const { priceId, environment } = await req.json();
  if (!priceId) {
    return new Response(JSON.stringify({ error: "priceId required" }), {
      status: 400,
      ...responseHeaders,
    });
  }

  // Validate environment parameter
  if (environment && !["sandbox", "live"].includes(environment)) {
    return new Response(JSON.stringify({ error: "Invalid environment" }), {
      status: 400,
      ...responseHeaders,
    });
  }

  const response = await gatewayFetch(
    (environment || "live") as PaddleEnv,
    `/prices?external_id=${encodeURIComponent(priceId)}`
  );
  const data = await response.json();

  if (!data.data?.length) {
    return new Response(JSON.stringify({ error: "Price not found" }), {
      status: 404,
      ...responseHeaders,
    });
  }

  return new Response(JSON.stringify({ paddleId: data.data[0].id }), responseHeaders);
});

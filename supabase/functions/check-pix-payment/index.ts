import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  pixPaymentId: z.string().uuid(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    if (!mpToken) {
      return new Response(
        JSON.stringify({ error: "Mercado Pago not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { pixPaymentId } = parsed.data;

    // Get the pix payment record
    const { data: pixPayment, error: fetchError } = await supabase
      .from("pix_payments")
      .select("*")
      .eq("id", pixPaymentId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !pixPayment) {
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Already processed
    if (pixPayment.status === "approved") {
      return new Response(
        JSON.stringify({ status: "approved", paid_at: pixPayment.paid_at }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check with Mercado Pago
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${pixPayment.mp_payment_id}`,
      {
        headers: { Authorization: `Bearer ${mpToken}` },
      }
    );

    if (!mpResponse.ok) {
      return new Response(
        JSON.stringify({ status: pixPayment.status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mpData = await mpResponse.json();

    if (mpData.status === "approved" && pixPayment.status !== "approved") {
      const now = new Date().toISOString();
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Update pix payment status
      await supabase
        .from("pix_payments")
        .update({ status: "approved", paid_at: now })
        .eq("id", pixPaymentId);

      // Create or update subscription (30 days)
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("environment", pixPayment.environment)
        .maybeSingle();

      if (existingSub) {
        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            is_trial: false,
            product_id: pixPayment.product_id,
            price_id: pixPayment.price_id,
            current_period_start: now,
            current_period_end: periodEnd,
            paddle_subscription_id: null,
            paddle_customer_id: null,
          })
          .eq("id", existingSub.id);
      } else {
        await supabase.from("subscriptions").insert({
          user_id: user.id,
          environment: pixPayment.environment,
          status: "active",
          is_trial: false,
          product_id: pixPayment.product_id,
          price_id: pixPayment.price_id,
          paddle_subscription_id: null,
          paddle_customer_id: null,
          current_period_start: now,
          current_period_end: periodEnd,
        });
      }

      return new Response(
        JSON.stringify({ status: "approved", paid_at: now }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status if changed (expired, cancelled, etc.)
    if (mpData.status !== pixPayment.status) {
      await supabase
        .from("pix_payments")
        .update({ status: mpData.status })
        .eq("id", pixPaymentId);
    }

    return new Response(
      JSON.stringify({ status: mpData.status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

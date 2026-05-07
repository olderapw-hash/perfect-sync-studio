import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Canonical server-side price catalogue — client-supplied amounts are rejected
 *  if they don't match. Keys = productId, values = amount in centavos (BRL). */
const PRICE_CATALOGUE: Record<string, number> = {
  pw_admin_iniciante: 2500,   // R$ 25,00
  pw_admin_pro: 15000,        // R$ 150,00
  pw_admin_ultimate: 30000,   // R$ 300,00
};

const BodySchema = z.object({
  priceId: z.string().min(1),
  productId: z.string().min(1),
  amountCents: z.number().int().min(100),
  environment: z.enum(["sandbox", "live"]),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth
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
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate body
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { priceId, productId, amountCents, environment } = parsed.data;

    // Generate external reference
    const externalRef = `pix_${user.id}_${Date.now()}`;

    // Create Mercado Pago payment
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpToken}`,
        "X-Idempotency-Key": externalRef,
      },
      body: JSON.stringify({
        transaction_amount: amountCents / 100,
        description: `Orphea Core - Plano ${productId}`,
        payment_method_id: "pix",
        payer: {
          email: user.email,
        },
        external_reference: externalRef,
      }),
    });

    if (!mpResponse.ok) {
      const mpError = await mpResponse.text();
      console.error("Mercado Pago error:", mpError);
      return new Response(
        JSON.stringify({ error: "Failed to create Pix payment" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mpData = await mpResponse.json();
    const pixInfo = mpData.point_of_interaction?.transaction_data;

    // Store in database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: pixPayment, error: insertError } = await supabase
      .from("pix_payments")
      .insert({
        user_id: user.id,
        environment,
        status: "pending",
        amount_cents: amountCents,
        product_id: productId,
        price_id: priceId,
        mp_payment_id: String(mpData.id),
        mp_external_reference: externalRef,
        qr_code: pixInfo?.qr_code || null,
        qr_code_base64: pixInfo?.qr_code_base64 || null,
        ticket_url: pixInfo?.ticket_url || null,
        expires_at: mpData.date_of_expiration || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save payment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        id: pixPayment.id,
        qr_code: pixInfo?.qr_code,
        qr_code_base64: pixInfo?.qr_code_base64,
        ticket_url: pixInfo?.ticket_url,
        expires_at: pixPayment.expires_at,
        mp_payment_id: mpData.id,
      }),
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

import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook, EventName, type PaddleEnv } from '../_shared/paddle.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const env = (url.searchParams.get('env') || 'sandbox') as PaddleEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log('Received event:', event.eventType, 'env:', env);

    switch (event.eventType) {
      case EventName.SubscriptionCreated:
        await handleSubscriptionCreated(event.data, env);
        break;
      case EventName.SubscriptionUpdated:
        await handleSubscriptionUpdated(event.data, env);
        break;
      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(event.data, env);
        break;
      case EventName.TransactionCompleted:
        console.log('Transaction completed:', event.data.id, 'env:', env);
        break;
      case EventName.TransactionPaymentFailed:
        console.log('Payment failed:', event.data.id, 'env:', env);
        break;
      default:
        console.log('Unhandled event:', event.eventType);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response('Webhook error', { status: 400 });
  }
});

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;

  const userId = customData?.userId;
  if (!userId) {
    console.error('No userId in customData');
    return;
  }

  const item = items[0];
  const priceId = item.price.importMeta?.externalId || item.price.id;
  const productId = item.product.importMeta?.externalId || item.product.id;

  // Upsert subscription
  await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      paddle_subscription_id: id,
      paddle_customer_id: customerId,
      product_id: productId,
      price_id: priceId,
      status: status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,environment' }
  );

  // Auto-create tenant for the new paying customer if it doesn't exist yet
  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  if (!existingTenant) {
    await supabase.from('tenants').insert({
      owner_id: userId,
      server_name: 'Meu Servidor PW',
      onboarding_completed: false,
    });
  }

  // Auto-create license with VPS activation token for paid plans
  const planName = productId || 'pro';
  const customerEmail = customData?.email || null;
  const customerName = customData?.clientName || customData?.email || 'Cliente Paddle';

  const { data: existingLicense } = await supabase
    .from('licenses')
    .select('id')
    .eq('created_by', userId)
    .maybeSingle();

  if (!existingLicense) {
    // Get the first superadmin to be the license creator (system-created)
    const { data: superadminRole } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'superadmin')
      .limit(1)
      .maybeSingle();

    const creatorId = superadminRole?.user_id || userId;

    const { error: licError } = await supabase.from('licenses').insert({
      client_name: customerName,
      client_email: customerEmail,
      plan: planName.includes('ultimate') ? 'ultimate' : 'pro',
      status: 'active',
      created_by: creatorId,
      payment_method: 'paddle',
      notes: `Auto-criado via Paddle. Subscription: ${id}`,
    });

    if (licError) {
      console.error('Failed to auto-create license:', licError);
    } else {
      console.log('Auto-created license with VPS activation token for user:', userId);
    }
  }
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange } = data;

  await supabase
    .from('subscriptions')
    .update({
      status: status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      cancel_at_period_end: scheduledChange?.action === 'cancel',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', id)
    .eq('environment', env);
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .eq('environment', env);
}

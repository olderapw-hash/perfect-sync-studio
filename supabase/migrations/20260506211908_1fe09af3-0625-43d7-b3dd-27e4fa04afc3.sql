INSERT INTO public.subscriptions (user_id, environment, status, is_trial, product_id, price_id, paddle_subscription_id, paddle_customer_id, current_period_start, current_period_end)
VALUES (
  '476c29ff-7228-4b10-ac3e-631d8c24bfa8',
  'live',
  'active',
  false,
  'pw_admin_iniciante',
  'pw_admin_iniciante_monthly',
  NULL,
  NULL,
  now(),
  now() + interval '30 days'
);
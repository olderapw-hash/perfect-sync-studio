ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_paddle_required_when_not_trial;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_paddle_required_when_not_trial
  CHECK (
    is_trial = true
    OR (
      paddle_subscription_id IS NOT NULL
      AND paddle_customer_id IS NOT NULL
    )
    OR price_id LIKE '%_admin_override'
  );

CREATE OR REPLACE FUNCTION public.admin_set_user_plan(
  target_user_id uuid,
  new_plan text,
  expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone,
  env text DEFAULT 'live'::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _product_id text;
  _e text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: superadmin only';
  END IF;
  IF new_plan NOT IN ('free','pro','ultimate') THEN
    RAISE EXCEPTION 'Invalid plan: %', new_plan;
  END IF;

  IF new_plan = 'free' THEN
    DELETE FROM public.subscriptions WHERE user_id = target_user_id;
    RETURN;
  END IF;

  _product_id := CASE new_plan
    WHEN 'ultimate' THEN 'pw_admin_ultimate'
    WHEN 'pro' THEN 'pw_admin_pro'
  END;

  DELETE FROM public.subscriptions WHERE user_id = target_user_id;

  FOREACH _e IN ARRAY ARRAY['sandbox','live'] LOOP
    INSERT INTO public.subscriptions (
      user_id,
      environment,
      status,
      is_trial,
      product_id,
      price_id,
      paddle_subscription_id,
      paddle_customer_id,
      current_period_start,
      current_period_end
    ) VALUES (
      target_user_id,
      _e,
      'active',
      false,
      _product_id,
      _product_id || '_admin_override',
      NULL,
      NULL,
      now(),
      expires_at
    );
  END LOOP;
END;
$function$;

UPDATE public.subscriptions
SET is_trial = false,
    status = CASE WHEN status = 'trialing' THEN 'active' ELSE status END,
    updated_at = now()
WHERE price_id LIKE '%_admin_override'
  AND product_id IN ('pw_admin_pro', 'pw_admin_ultimate')
  AND COALESCE(is_trial, false) = true;
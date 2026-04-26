CREATE OR REPLACE FUNCTION public.admin_set_user_plan(target_user_id uuid, new_plan text, expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone, env text DEFAULT 'live'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _product_id text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: superadmin only';
  END IF;
  IF new_plan NOT IN ('free','pro','ultimate') THEN
    RAISE EXCEPTION 'Invalid plan: %', new_plan;
  END IF;
  IF env NOT IN ('sandbox','live') THEN
    RAISE EXCEPTION 'Invalid environment: %', env;
  END IF;

  IF new_plan = 'free' THEN
    DELETE FROM public.subscriptions
     WHERE user_id = target_user_id AND environment = env;
    RETURN;
  END IF;

  _product_id := CASE new_plan
    WHEN 'ultimate' THEN 'pw_admin_ultimate'
    WHEN 'pro'      THEN 'pw_admin_pro'
  END;

  DELETE FROM public.subscriptions
   WHERE user_id = target_user_id AND environment = env;

  -- is_trial=true para satisfazer subscriptions_paddle_required_when_not_trial
  -- (overrides administrativos não têm paddle_subscription_id/customer_id).
  INSERT INTO public.subscriptions (
    user_id, environment, status, is_trial,
    product_id, price_id,
    paddle_subscription_id, paddle_customer_id,
    current_period_start, current_period_end
  ) VALUES (
    target_user_id, env, 'active', true,
    _product_id, _product_id || '_admin_override',
    NULL, NULL,
    now(), expires_at
  );
END;
$function$;
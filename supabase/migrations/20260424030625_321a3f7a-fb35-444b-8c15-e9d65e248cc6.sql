ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS is_trial boolean NOT NULL DEFAULT false;

ALTER TABLE public.subscriptions
  ALTER COLUMN paddle_subscription_id DROP NOT NULL;
ALTER TABLE public.subscriptions
  ALTER COLUMN paddle_customer_id DROP NOT NULL;

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_paddle_required_when_not_trial;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_paddle_required_when_not_trial
  CHECK (
    is_trial = true
    OR (paddle_subscription_id IS NOT NULL AND paddle_customer_id IS NOT NULL)
  );

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live'::text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND environment = check_env
      AND (
        (status IN ('active','trialing') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public.start_free_trial(_environment text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _existing uuid;
  _new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _environment NOT IN ('sandbox','live') THEN
    RAISE EXCEPTION 'Invalid environment: %', _environment;
  END IF;

  SELECT id INTO _existing
    FROM public.subscriptions
   WHERE user_id = auth.uid()
     AND environment = _environment
   ORDER BY created_at DESC
   LIMIT 1;
  IF _existing IS NOT NULL THEN
    RETURN _existing;
  END IF;

  INSERT INTO public.subscriptions (
    user_id, environment, status, is_trial,
    product_id, price_id,
    paddle_subscription_id, paddle_customer_id,
    current_period_start, current_period_end
  ) VALUES (
    auth.uid(), _environment, 'trialing', true,
    'pw_admin_trial', 'pw_admin_trial',
    NULL, NULL,
    now(), NULL
  )
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$function$;
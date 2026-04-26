-- Drop old admin_list_users (return type is changing)
DROP FUNCTION IF EXISTS public.admin_list_users();

CREATE FUNCTION public.admin_list_users()
 RETURNS TABLE(
   user_id uuid,
   email text,
   created_at timestamp with time zone,
   is_admin boolean,
   is_superadmin boolean,
   has_subscription boolean,
   tenant_server_name text,
   onboarding_completed boolean,
   current_plan text,
   plan_expires_at timestamp with time zone,
   tenants_count integer
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: superadmin only';
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::text,
    u.created_at,
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin'::app_role) AS is_admin,
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'superadmin'::app_role) AS is_superadmin,
    public.has_active_subscription(u.id, 'live') OR public.has_active_subscription(u.id, 'sandbox') AS has_subscription,
    t.server_name AS tenant_server_name,
    COALESCE(t.onboarding_completed, false) AS onboarding_completed,
    COALESCE(
      (SELECT
         CASE
           WHEN s.is_trial THEN 'trial'
           WHEN s.product_id = 'pw_admin_ultimate' THEN 'ultimate'
           WHEN s.product_id IN ('pw_admin_pro','pw_admin') THEN 'pro'
           ELSE 'free'
         END
       FROM public.subscriptions s
       WHERE s.user_id = u.id
         AND s.status IN ('active','trialing')
         AND (s.current_period_end IS NULL OR s.current_period_end > now())
       ORDER BY s.created_at DESC
       LIMIT 1),
      'free'
    ) AS current_plan,
    (SELECT s.current_period_end
       FROM public.subscriptions s
      WHERE s.user_id = u.id
        AND s.status IN ('active','trialing')
      ORDER BY s.created_at DESC
      LIMIT 1) AS plan_expires_at,
    (SELECT COUNT(*)::int FROM public.tenants tt WHERE tt.owner_id = u.id) AS tenants_count
  FROM auth.users u
  LEFT JOIN public.tenants t ON t.owner_id = u.id AND t.is_active = true
  ORDER BY u.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_list_user_tenants(target_user_id uuid)
 RETURNS TABLE(
   id uuid,
   server_name text,
   is_active boolean,
   onboarding_completed boolean,
   created_at timestamp with time zone,
   members_count integer
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: superadmin only';
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.server_name,
    t.is_active,
    t.onboarding_completed,
    t.created_at,
    (SELECT COUNT(*)::int FROM public.server_members sm WHERE sm.tenant_id = t.id) AS members_count
  FROM public.tenants t
  WHERE t.owner_id = target_user_id
  ORDER BY t.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_user_plan(
  target_user_id uuid,
  new_plan text,
  expires_at timestamp with time zone DEFAULT NULL,
  env text DEFAULT 'live'
)
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

  INSERT INTO public.subscriptions (
    user_id, environment, status, is_trial,
    product_id, price_id,
    paddle_subscription_id, paddle_customer_id,
    current_period_start, current_period_end
  ) VALUES (
    target_user_id, env, 'active', false,
    _product_id, _product_id || '_admin_override',
    NULL, NULL,
    now(), expires_at
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_delete_tenant(target_tenant_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: superadmin only';
  END IF;

  DELETE FROM public.attendance_reward_deliveries WHERE tenant_id = target_tenant_id;
  DELETE FROM public.attendance_claims            WHERE tenant_id = target_tenant_id;
  DELETE FROM public.attendance_events            WHERE tenant_id = target_tenant_id;
  DELETE FROM public.ingame_reward_deliveries     WHERE tenant_id = target_tenant_id;
  DELETE FROM public.ingame_winners               WHERE tenant_id = target_tenant_id;
  DELETE FROM public.ingame_participations        WHERE tenant_id = target_tenant_id;
  DELETE FROM public.ingame_events                WHERE tenant_id = target_tenant_id;
  DELETE FROM public.initial_kits                 WHERE tenant_id = target_tenant_id;
  DELETE FROM public.mail_send_log                WHERE tenant_id = target_tenant_id;
  DELETE FROM public.mail_templates               WHERE tenant_id = target_tenant_id;
  DELETE FROM public.item_favorites               WHERE tenant_id = target_tenant_id;
  DELETE FROM public.server_invites               WHERE tenant_id = target_tenant_id;
  DELETE FROM public.server_members               WHERE tenant_id = target_tenant_id;
  DELETE FROM public.audit_logs                   WHERE tenant_id = target_tenant_id;
  DELETE FROM public.tenants                      WHERE id        = target_tenant_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_purge_user_data(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _tid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: superadmin only';
  END IF;
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete yourself';
  END IF;
  IF public.has_role(target_user_id, 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Cannot delete a superadmin';
  END IF;

  FOR _tid IN SELECT id FROM public.tenants WHERE owner_id = target_user_id LOOP
    PERFORM public.admin_delete_tenant(_tid);
  END LOOP;

  DELETE FROM public.server_members WHERE user_id = target_user_id;
  DELETE FROM public.server_invites WHERE invited_by = target_user_id OR accepted_by = target_user_id;
  DELETE FROM public.subscriptions  WHERE user_id = target_user_id;
  DELETE FROM public.user_roles     WHERE user_id = target_user_id;
  DELETE FROM public.audit_logs     WHERE user_id = target_user_id;
  DELETE FROM public.item_favorites WHERE user_id = target_user_id;
END;
$function$;
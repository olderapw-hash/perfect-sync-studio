CREATE OR REPLACE FUNCTION public.admin_register_test_user(_user_id uuid, _email text, _plan text, _expires_at timestamp with time zone, _created_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: superadmin only';
  END IF;

  INSERT INTO public.test_users (user_id, email, plan, expires_at, created_by)
  VALUES (_user_id, _email, _plan, _expires_at, _created_by);

  IF _plan IN ('pro','ultimate') THEN
    PERFORM public.admin_set_user_plan(_user_id, _plan, _expires_at, 'live');
  END IF;
END;
$function$;
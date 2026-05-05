-- Revoke direct SELECT on pw_api_secret column from anon and authenticated roles.
-- The secret is accessed only via SECURITY DEFINER RPCs (get_my_tenant_secret, get_tenant_secret).
REVOKE SELECT (pw_api_secret) ON public.tenants FROM anon, authenticated;

-- Also revoke on app_settings.pw_api_secret (same pattern)
REVOKE SELECT (pw_api_secret) ON public.app_settings FROM anon, authenticated;
-- 1. Revoke column-level SELECT on pw_api_secret from anon and authenticated.
-- The secret is only accessed via SECURITY DEFINER functions (get_my_tenant_secret, get_tenant_secret)
-- which bypass column grants. This prevents members from reading the secret directly.
REVOKE SELECT (pw_api_secret) ON public.tenants FROM anon, authenticated;

-- 2. Add UPDATE policy on storage.objects for admin-files bucket (superadmin only)
CREATE POLICY "Superadmin can update admin files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'admin-files' AND has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (bucket_id = 'admin-files' AND has_role(auth.uid(), 'superadmin'::app_role));
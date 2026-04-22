-- 1) app_settings: restrict SELECT to superadmin only (table contains pw_api_secret)
DROP POLICY IF EXISTS "Admins can read settings" ON public.app_settings;

CREATE POLICY "Superadmin can read settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- 2) user_roles: only superadmin can insert/delete roles (block admin self-escalation)
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Superadmin can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmin can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- 3) Storage: drop broad bucket-wide public read, keep only photos/ folder public read
DROP POLICY IF EXISTS "pw-assets public read individual files" ON storage.objects;

-- Also drop the duplicate admin write policies (keep one of each)
DROP POLICY IF EXISTS "Admins can delete pw-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update pw-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload pw-assets" ON storage.objects;

-- Ensure catalog files (icons + .tab) under non-photos paths are still publicly readable.
-- The app needs unauthenticated read access to icons/ and tabs/ for the catalog UI.
CREATE POLICY "pw-assets icons public read"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'pw-assets'
  AND (
    (storage.foldername(name))[1] = 'icons'
    OR (storage.foldername(name))[1] = 'tabs'
  )
);
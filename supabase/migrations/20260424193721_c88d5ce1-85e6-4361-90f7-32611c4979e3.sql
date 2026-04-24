-- Restore SELECT policies on storage.objects for the buckets used by the
-- admin uploaders. Without these, upsert uploads fail with
-- "new row violates row-level security policy" because storage needs to
-- check whether the object already exists before deciding INSERT vs UPDATE.
--
-- We scope these to the same roles allowed to upload, so we don't reopen
-- the public enumeration that the previous hardening migration removed.

CREATE POLICY "Superadmins can view branding"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'branding'
    AND public.has_role(auth.uid(), 'superadmin'::public.app_role)
  );

CREATE POLICY "Admins can view pw-assets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'pw-assets'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Restrict the public SELECT policy to the specific prefixes actually used by
-- the app (class/character photos), so anonymous clients cannot enumerate the
-- entire bucket via list operations. Direct public URLs continue to work
-- because the bucket is still marked public.

DROP POLICY IF EXISTS "pw_assets_public_select" ON storage.objects;

CREATE POLICY "pw_assets_public_select_photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'pw-assets'
  AND (
    name LIKE 'photos/class/%'
    OR name LIKE 'photos/character/%'
  )
);
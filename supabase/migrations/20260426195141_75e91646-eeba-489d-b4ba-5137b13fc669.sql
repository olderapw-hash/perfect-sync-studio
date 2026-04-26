-- Align RLS SELECT policy on storage.objects for the 'pw-assets' bucket with
-- the bucket's actual visibility. The bucket is intentionally PUBLIC so that
-- class/character photos can be served via <img src={public_url}> without
-- signed URLs. The previous admin-only SELECT policy was misleading because
-- the public bucket bypasses RLS for reads anyway.
--
-- Write/update/delete policies remain admin-only (unchanged).

DROP POLICY IF EXISTS "pw-assets admin read" ON storage.objects;
DROP POLICY IF EXISTS "pw-assets read" ON storage.objects;
DROP POLICY IF EXISTS "pw_assets_admin_select" ON storage.objects;
DROP POLICY IF EXISTS "pw_assets_select" ON storage.objects;

CREATE POLICY "pw_assets_public_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'pw-assets');
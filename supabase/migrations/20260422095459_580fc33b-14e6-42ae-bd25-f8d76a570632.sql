
DROP POLICY IF EXISTS "pw-assets photos public read" ON storage.objects;

CREATE POLICY "pw-assets photos public read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pw-assets'
    AND (storage.foldername(name))[1] = 'photos'
  );

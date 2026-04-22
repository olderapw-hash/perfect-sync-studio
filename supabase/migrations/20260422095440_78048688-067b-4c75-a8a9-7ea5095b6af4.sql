
-- Tabela de fotos por classe (cls)
CREATE TABLE public.class_photos (
  cls INTEGER PRIMARY KEY,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.class_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_photos public read"
  ON public.class_photos FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert class photos"
  ON public.class_photos FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update class photos"
  ON public.class_photos FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete class photos"
  ON public.class_photos FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Tabela de fotos por personagem (override por roleid)
CREATE TABLE public.character_photos (
  roleid BIGINT PRIMARY KEY,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.character_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "character_photos public read"
  ON public.character_photos FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert character photos"
  ON public.character_photos FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update character photos"
  ON public.character_photos FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete character photos"
  ON public.character_photos FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies para o bucket público pw-assets (pasta photos/)
CREATE POLICY "pw-assets photos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pw-assets');

CREATE POLICY "Admins can upload photos to pw-assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pw-assets'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update photos in pw-assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pw-assets'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete photos in pw-assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pw-assets'
    AND public.has_role(auth.uid(), 'admin')
  );

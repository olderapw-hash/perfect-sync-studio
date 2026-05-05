-- Table for admin file metadata
CREATE TABLE public.admin_files (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name text NOT NULL,
  description text,
  storage_path text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can view admin files"
  ON public.admin_files FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmin can insert admin files"
  ON public.admin_files FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'::app_role) AND uploaded_by = auth.uid());

CREATE POLICY "Superadmin can delete admin files"
  ON public.admin_files FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'::app_role));

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('admin-files', 'admin-files', false);

-- Storage policies for superadmin
CREATE POLICY "Superadmin can upload admin files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'admin-files' AND public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmin can read admin files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'admin-files' AND public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmin can delete admin files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'admin-files' AND public.has_role(auth.uid(), 'superadmin'::app_role));
-- Tabela singleton de configurações
CREATE TABLE public.app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  server_name TEXT NOT NULL DEFAULT 'Perfect World Admin',
  pw_api_base_url TEXT,
  icon_base_url TEXT NOT NULL DEFAULT 'http://93.127.143.77/',
  pw_api_secret TEXT,
  logo_url TEXT,
  primary_color TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  CONSTRAINT singleton CHECK (id = 1)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Admin (e superadmin) podem ler configs SEM o secret (controle no app/edge)
CREATE POLICY "Admins can read settings"
ON public.app_settings FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'superadmin'::app_role)
);

-- Apenas superadmin pode gravar
CREATE POLICY "Superadmin can update settings"
ON public.app_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmin can insert settings"
ON public.app_settings FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'superadmin'::app_role));

-- Linha inicial
INSERT INTO public.app_settings (id, server_name, icon_base_url)
VALUES (1, 'Perfect World Admin', 'http://93.127.143.77/')
ON CONFLICT (id) DO NOTHING;

-- Função pública pra branding (nome/logo/cor) — sem auth
CREATE OR REPLACE FUNCTION public.get_public_branding()
RETURNS TABLE(server_name TEXT, logo_url TEXT, primary_color TEXT)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT server_name, logo_url, primary_color FROM public.app_settings WHERE id = 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_branding() TO anon, authenticated;

-- Promove o admin mais antigo a superadmin
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'superadmin'::app_role
FROM public.user_roles
WHERE role = 'admin'::app_role
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT DO NOTHING;
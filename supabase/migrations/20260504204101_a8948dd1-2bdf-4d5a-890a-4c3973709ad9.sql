
-- Enum para status da licença
CREATE TYPE public.license_status AS ENUM ('active', 'expired', 'revoked', 'suspended');

-- Tabela de licenças
CREATE TABLE public.licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(20), 'hex') UNIQUE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  plan TEXT NOT NULL DEFAULT 'pro',
  status license_status NOT NULL DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE,
  activated_at TIMESTAMP WITH TIME ZONE,
  vps_ip TEXT,
  notes TEXT,
  price_paid NUMERIC(10,2),
  payment_method TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "Superadmin can view licenses"
  ON public.licenses FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmin can create licenses"
  ON public.licenses FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'::app_role) AND created_by = auth.uid());

CREATE POLICY "Superadmin can update licenses"
  ON public.licenses FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmin can delete licenses"
  ON public.licenses FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'::app_role));

-- Função pública para validar licença (chamada pela VPS)
CREATE OR REPLACE FUNCTION public.validate_license(_key TEXT)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lic RECORD;
BEGIN
  SELECT * INTO _lic FROM public.licenses WHERE license_key = _key;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;
  
  IF _lic.status = 'revoked' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'revoked');
  END IF;
  
  IF _lic.status = 'suspended' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'suspended');
  END IF;
  
  IF _lic.expires_at IS NOT NULL AND _lic.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired', 'expired_at', _lic.expires_at);
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'plan', _lic.plan,
    'client_name', _lic.client_name,
    'expires_at', _lic.expires_at,
    'activated_at', _lic.activated_at
  );
END;
$$;

-- Trigger para updated_at
CREATE TRIGGER set_licenses_updated_at
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

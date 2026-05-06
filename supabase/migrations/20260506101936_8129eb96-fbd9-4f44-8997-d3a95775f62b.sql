
-- 1. Utility trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Enum (idempotent via IF NOT EXISTS workaround)
DO $$ BEGIN
    CREATE TYPE public.vps_activation_status AS ENUM ('active', 'revoked', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Table
CREATE TABLE IF NOT EXISTS public.vps_activations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    activation_token TEXT NOT NULL UNIQUE,
    hardware_fingerprint TEXT,
    server_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL,
    status public.vps_activation_status NOT NULL DEFAULT 'active',
    activated_at TIMESTAMPTZ,
    last_validated_at TIMESTAMPTZ,
    ip_address TEXT,
    hostname TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vps_activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can view all activations"
ON public.vps_activations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can insert activations"
ON public.vps_activations FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can update activations"
ON public.vps_activations FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can delete activations"
ON public.vps_activations FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE INDEX IF NOT EXISTS idx_vps_activations_token ON public.vps_activations(activation_token);

-- 4. Updated_at trigger
CREATE TRIGGER update_vps_activations_updated_at
BEFORE UPDATE ON public.vps_activations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Validation function
CREATE OR REPLACE FUNCTION public.validate_vps_activation(
    _token TEXT,
    _fingerprint TEXT,
    _ip TEXT DEFAULT NULL,
    _hostname TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _row public.vps_activations%ROWTYPE;
BEGIN
    SELECT * INTO _row FROM public.vps_activations WHERE activation_token = _token;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
    END IF;
    IF _row.status = 'revoked' THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'revoked');
    END IF;
    IF _row.status = 'suspended' THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'suspended');
    END IF;
    IF _row.hardware_fingerprint IS NULL THEN
        UPDATE public.vps_activations
        SET hardware_fingerprint = _fingerprint, activated_at = now(),
            last_validated_at = now(), ip_address = _ip, hostname = _hostname
        WHERE id = _row.id;
        RETURN jsonb_build_object('valid', true, 'status', 'activated', 'message', 'Token ativado e vinculado a esta VPS.');
    END IF;
    IF _row.hardware_fingerprint <> _fingerprint THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'fingerprint_mismatch',
            'message', 'Este token ja esta vinculado a outra VPS.');
    END IF;
    UPDATE public.vps_activations
    SET last_validated_at = now(),
        ip_address = COALESCE(_ip, ip_address),
        hostname = COALESCE(_hostname, hostname)
    WHERE id = _row.id;
    RETURN jsonb_build_object('valid', true, 'status', 'validated');
END;
$$;

-- 6. Add activation token column to licenses
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS vps_activation_token TEXT UNIQUE DEFAULT encode(extensions.gen_random_bytes(24), 'hex');

-- 7. Auto-create vps_activation on license insert
CREATE OR REPLACE FUNCTION public.auto_create_vps_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.vps_activations (activation_token, owner_id, status, notes)
    VALUES (NEW.vps_activation_token, NEW.created_by, 'active',
            'Auto-criado pela licenca: ' || NEW.client_name);
    RETURN NEW;
END;
$$;

CREATE TRIGGER licenses_auto_create_vps_activation
AFTER INSERT ON public.licenses
FOR EACH ROW
WHEN (NEW.vps_activation_token IS NOT NULL)
EXECUTE FUNCTION public.auto_create_vps_activation();

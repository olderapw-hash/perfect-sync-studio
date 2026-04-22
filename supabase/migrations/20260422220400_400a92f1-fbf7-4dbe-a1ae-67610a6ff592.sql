-- ============================================================
-- Multi-servidor por usuário + audit logs
-- ============================================================

-- 1) Remove a unicidade implícita que vinha do upsert(onConflict: owner_id).
--    Como nunca houve UNIQUE constraint nomeada na coluna, não há nada para dropar;
--    apenas garantimos que o índice `idx_tenants_owner_active` funcione bem.

-- 2) Coluna is_active: marca o servidor "selecionado" do usuário.
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS connection_status text NULL,
  ADD COLUMN IF NOT EXISTS connection_tested_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS connection_error text NULL;

-- 3) Garante exatamente 1 servidor ativo por owner_id.
--    UNIQUE parcial: só impede duplicidade quando is_active = true.
CREATE UNIQUE INDEX IF NOT EXISTS tenants_owner_one_active_idx
  ON public.tenants (owner_id)
  WHERE is_active = true;

-- 4) Índice geral por owner pra acelerar listagens.
CREATE INDEX IF NOT EXISTS tenants_owner_idx ON public.tenants (owner_id);

-- 5) Trigger: quando um tenant é marcado is_active=true, desativa os outros do mesmo owner.
CREATE OR REPLACE FUNCTION public.tenants_enforce_single_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.tenants
       SET is_active = false
     WHERE owner_id = NEW.owner_id
       AND id <> NEW.id
       AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenants_enforce_single_active_trg ON public.tenants;
CREATE TRIGGER tenants_enforce_single_active_trg
AFTER INSERT OR UPDATE OF is_active ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.tenants_enforce_single_active();

-- 6) Atualiza o RPC get_my_tenant_secret para retornar o secret do tenant ATIVO.
CREATE OR REPLACE FUNCTION public.get_my_tenant_secret()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pw_api_secret
  FROM public.tenants
  WHERE owner_id = auth.uid()
    AND is_active = true
  ORDER BY updated_at DESC
  LIMIT 1;
$$;

-- 7) Novo RPC: troca o servidor ativo do user (validação de ownership).
CREATE OR REPLACE FUNCTION public.set_active_tenant(target_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid;
BEGIN
  SELECT owner_id INTO _owner
    FROM public.tenants WHERE id = target_tenant_id;

  IF _owner IS NULL THEN
    RAISE EXCEPTION 'Servidor não encontrado';
  END IF;
  IF _owner <> auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  UPDATE public.tenants
     SET is_active = (id = target_tenant_id)
   WHERE owner_id = auth.uid();
END;
$$;

-- 8) Tabela de logs de auditoria (item 4 — logs de ação por usuário).
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid NULL,
  action text NOT NULL,
  target text NULL,
  status text NOT NULL DEFAULT 'ok',
  http_status int NULL,
  error text NULL,
  metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_idx ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_tenant_idx ON public.audit_logs (tenant_id, created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Usuário só vê os próprios logs.
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Superadmin vê tudo.
DROP POLICY IF EXISTS "Superadmin can view all audit logs" ON public.audit_logs;
CREATE POLICY "Superadmin can view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'::app_role));

-- Apenas service_role insere (edge function).
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs
FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role');

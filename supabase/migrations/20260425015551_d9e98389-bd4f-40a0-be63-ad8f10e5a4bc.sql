-- =============================================================
-- 1. DROP do módulo Sorteios web (substituído por Eventos Ingame)
-- =============================================================
DROP TABLE IF EXISTS public.raffle_reward_deliveries CASCADE;
DROP TABLE IF EXISTS public.raffle_winners CASCADE;
DROP TABLE IF EXISTS public.raffle_participants CASCADE;
DROP TABLE IF EXISTS public.raffle_events CASCADE;

DROP TYPE IF EXISTS public.raffle_delivery_status;
DROP TYPE IF EXISTS public.raffle_participant_source;
DROP TYPE IF EXISTS public.raffle_status;

-- =============================================================
-- 2. Enums do módulo Eventos Ingame
-- =============================================================
CREATE TYPE public.ingame_event_status AS ENUM ('draft', 'active', 'closed');
CREATE TYPE public.ingame_event_type AS ENUM ('ingame_generic');
CREATE TYPE public.ingame_reward_mode AS ENUM ('all_participants', 'raffle_winners');
CREATE TYPE public.ingame_participation_source AS ENUM ('npc', 'manual', 'import');
CREATE TYPE public.ingame_delivery_status AS ENUM ('pending', 'sent', 'error', 'duplicate_blocked');

-- =============================================================
-- 3. Tabela ingame_events
-- =============================================================
CREATE TABLE public.ingame_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  event_type public.ingame_event_type NOT NULL DEFAULT 'ingame_generic',
  status public.ingame_event_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  reward_mode public.ingame_reward_mode NOT NULL DEFAULT 'all_participants',
  winners_count INT NOT NULL DEFAULT 1 CHECK (winners_count >= 1),
  reward_title TEXT,
  reward_message TEXT,
  reward_payload_json JSONB NOT NULL DEFAULT '{"items":[],"gold":0}'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ingame_events_tenant_id_idx ON public.ingame_events (tenant_id);
CREATE INDEX ingame_events_tenant_status_idx ON public.ingame_events (tenant_id, status);

CREATE TRIGGER ingame_events_set_updated_at
  BEFORE UPDATE ON public.ingame_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ingame_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view ingame events"
  ON public.ingame_events FOR SELECT TO authenticated
  USING (is_server_member(tenant_id, auth.uid()));

CREATE POLICY "Manage kits can create ingame events"
  ON public.ingame_events FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND has_server_permission(tenant_id, auth.uid(), 'manage_kits'));

CREATE POLICY "Manage kits can update ingame events"
  ON public.ingame_events FOR UPDATE TO authenticated
  USING (has_server_permission(tenant_id, auth.uid(), 'manage_kits'))
  WITH CHECK (has_server_permission(tenant_id, auth.uid(), 'manage_kits'));

CREATE POLICY "Manage kits can delete ingame events"
  ON public.ingame_events FOR DELETE TO authenticated
  USING (has_server_permission(tenant_id, auth.uid(), 'manage_kits'));

-- =============================================================
-- 4. Tabela ingame_participations
-- =============================================================
CREATE TABLE public.ingame_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.ingame_events(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  roleid BIGINT NOT NULL,
  role_name TEXT,
  userid BIGINT,
  source public.ingame_participation_source NOT NULL DEFAULT 'npc',
  /** quem registrou: NULL para 'npc' (vem da VPS via service_role) */
  added_by UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ingame_participations_unique_per_event UNIQUE (event_id, roleid)
);

CREATE INDEX ingame_participations_event_idx ON public.ingame_participations (event_id);
CREATE INDEX ingame_participations_tenant_idx ON public.ingame_participations (tenant_id);

ALTER TABLE public.ingame_participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view ingame participations"
  ON public.ingame_participations FOR SELECT TO authenticated
  USING (is_server_member(tenant_id, auth.uid()));

CREATE POLICY "Manage kits can add manual participation"
  ON public.ingame_participations FOR INSERT TO authenticated
  WITH CHECK (
    added_by = auth.uid()
    AND source IN ('manual', 'import')
    AND has_server_permission(tenant_id, auth.uid(), 'manage_kits')
  );

CREATE POLICY "Manage kits can delete participation"
  ON public.ingame_participations FOR DELETE TO authenticated
  USING (has_server_permission(tenant_id, auth.uid(), 'manage_kits'));

-- =============================================================
-- 5. Tabela ingame_winners
-- =============================================================
CREATE TABLE public.ingame_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.ingame_events(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  roleid BIGINT NOT NULL,
  role_name TEXT,
  userid BIGINT,
  drawn_by UUID NOT NULL,
  drawn_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ingame_winners_event_idx ON public.ingame_winners (event_id);
CREATE INDEX ingame_winners_tenant_idx ON public.ingame_winners (tenant_id);

ALTER TABLE public.ingame_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view ingame winners"
  ON public.ingame_winners FOR SELECT TO authenticated
  USING (is_server_member(tenant_id, auth.uid()));

CREATE POLICY "Manage kits can insert ingame winners"
  ON public.ingame_winners FOR INSERT TO authenticated
  WITH CHECK (drawn_by = auth.uid() AND has_server_permission(tenant_id, auth.uid(), 'manage_kits'));

CREATE POLICY "Manage kits can delete ingame winners"
  ON public.ingame_winners FOR DELETE TO authenticated
  USING (has_server_permission(tenant_id, auth.uid(), 'manage_kits'));

-- =============================================================
-- 6. Tabela ingame_reward_deliveries
-- =============================================================
CREATE TABLE public.ingame_reward_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.ingame_events(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  roleid BIGINT NOT NULL,
  role_name TEXT,
  userid BIGINT,
  reward_payload_json JSONB NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  status public.ingame_delivery_status NOT NULL DEFAULT 'pending',
  mail_log_ids UUID[] NOT NULL DEFAULT ARRAY[]::uuid[],
  response_json JSONB,
  error_message TEXT,
  sent_by UUID NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ingame_deliveries_event_idx ON public.ingame_reward_deliveries (event_id);
CREATE INDEX ingame_deliveries_tenant_idx ON public.ingame_reward_deliveries (tenant_id);

CREATE TRIGGER ingame_deliveries_set_updated_at
  BEFORE UPDATE ON public.ingame_reward_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ingame_reward_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view ingame deliveries"
  ON public.ingame_reward_deliveries FOR SELECT TO authenticated
  USING (is_server_member(tenant_id, auth.uid()));

CREATE POLICY "Save real roles can insert ingame deliveries"
  ON public.ingame_reward_deliveries FOR INSERT TO authenticated
  WITH CHECK (sent_by = auth.uid() AND has_server_permission(tenant_id, auth.uid(), 'save_real_roles'));

CREATE POLICY "Save real roles can update ingame deliveries"
  ON public.ingame_reward_deliveries FOR UPDATE TO authenticated
  USING (has_server_permission(tenant_id, auth.uid(), 'save_real_roles'))
  WITH CHECK (has_server_permission(tenant_id, auth.uid(), 'save_real_roles'));

-- =============================================================
-- 7. RPC para registrar participação ingame (chamada pela VPS)
-- =============================================================
-- A VPS recebe a chamada do NPC, valida o secret do tenant e chama esta
-- função usando o service_role do Supabase. Devolve o id da participação
-- criada (ou existente, em caso de duplicidade).
CREATE OR REPLACE FUNCTION public.register_ingame_participation(
  _event_id UUID,
  _tenant_id UUID,
  _roleid BIGINT,
  _role_name TEXT DEFAULT NULL,
  _userid BIGINT DEFAULT NULL,
  _metadata JSONB DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _event RECORD;
  _existing UUID;
  _new_id UUID;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Only service_role can call this function';
  END IF;

  SELECT id, tenant_id, status, starts_at, ends_at
    INTO _event
    FROM public.ingame_events
   WHERE id = _event_id AND tenant_id = _tenant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found for tenant';
  END IF;

  IF _event.status <> 'active' THEN
    RAISE EXCEPTION 'Event is not active (status=%)', _event.status;
  END IF;

  IF _event.starts_at IS NOT NULL AND now() < _event.starts_at THEN
    RAISE EXCEPTION 'Event has not started yet';
  END IF;
  IF _event.ends_at IS NOT NULL AND now() > _event.ends_at THEN
    RAISE EXCEPTION 'Event already ended';
  END IF;

  SELECT id INTO _existing
    FROM public.ingame_participations
   WHERE event_id = _event_id AND roleid = _roleid;

  IF _existing IS NOT NULL THEN
    RETURN jsonb_build_object('id', _existing, 'duplicate', true);
  END IF;

  INSERT INTO public.ingame_participations (
    event_id, tenant_id, roleid, role_name, userid, source, added_by, metadata
  )
  VALUES (
    _event_id, _tenant_id, _roleid, _role_name, _userid, 'npc', NULL, _metadata
  )
  RETURNING id INTO _new_id;

  RETURN jsonb_build_object('id', _new_id, 'duplicate', false);
END;
$$;

REVOKE ALL ON FUNCTION public.register_ingame_participation FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_ingame_participation FROM authenticated;
REVOKE ALL ON FUNCTION public.register_ingame_participation FROM anon;
GRANT EXECUTE ON FUNCTION public.register_ingame_participation TO service_role;
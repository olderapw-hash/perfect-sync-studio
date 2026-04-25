-- Status do sorteio
CREATE TYPE public.raffle_status AS ENUM ('draft', 'active', 'closed');

-- Status de entrega de prêmio (reaproveita semântica do mail/attendance)
CREATE TYPE public.raffle_delivery_status AS ENUM ('pending', 'sent', 'error', 'duplicate_blocked');

-- Origem do participante (manual / import / etc.)
CREATE TYPE public.raffle_participant_source AS ENUM ('manual', 'import', 'auto');

-- ============================================================================
-- raffle_events
-- ============================================================================
CREATE TABLE public.raffle_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status public.raffle_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  winners_count INTEGER NOT NULL DEFAULT 1 CHECK (winners_count > 0),
  reward_title TEXT,
  reward_message TEXT,
  reward_payload_json JSONB NOT NULL DEFAULT '{"items": [], "gold": 0}'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_raffle_events_tenant ON public.raffle_events(tenant_id);
CREATE INDEX idx_raffle_events_status ON public.raffle_events(tenant_id, status);

ALTER TABLE public.raffle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view raffle events"
  ON public.raffle_events FOR SELECT TO authenticated
  USING (public.is_server_member(tenant_id, auth.uid()));

CREATE POLICY "Manage kits can create raffle events"
  ON public.raffle_events FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.has_server_permission(tenant_id, auth.uid(), 'manage_kits')
  );

CREATE POLICY "Manage kits can update raffle events"
  ON public.raffle_events FOR UPDATE TO authenticated
  USING (public.has_server_permission(tenant_id, auth.uid(), 'manage_kits'))
  WITH CHECK (public.has_server_permission(tenant_id, auth.uid(), 'manage_kits'));

CREATE POLICY "Manage kits can delete raffle events"
  ON public.raffle_events FOR DELETE TO authenticated
  USING (public.has_server_permission(tenant_id, auth.uid(), 'manage_kits'));

CREATE TRIGGER raffle_events_set_updated_at
  BEFORE UPDATE ON public.raffle_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- raffle_participants
-- ============================================================================
CREATE TABLE public.raffle_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raffle_id UUID NOT NULL REFERENCES public.raffle_events(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  roleid BIGINT NOT NULL,
  role_name TEXT,
  userid BIGINT,
  source public.raffle_participant_source NOT NULL DEFAULT 'manual',
  added_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (raffle_id, roleid)
);

CREATE INDEX idx_raffle_participants_raffle ON public.raffle_participants(raffle_id);
CREATE INDEX idx_raffle_participants_tenant ON public.raffle_participants(tenant_id);

ALTER TABLE public.raffle_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view raffle participants"
  ON public.raffle_participants FOR SELECT TO authenticated
  USING (public.is_server_member(tenant_id, auth.uid()));

CREATE POLICY "Manage kits can add raffle participants"
  ON public.raffle_participants FOR INSERT TO authenticated
  WITH CHECK (
    added_by = auth.uid()
    AND public.has_server_permission(tenant_id, auth.uid(), 'manage_kits')
  );

CREATE POLICY "Manage kits can delete raffle participants"
  ON public.raffle_participants FOR DELETE TO authenticated
  USING (public.has_server_permission(tenant_id, auth.uid(), 'manage_kits'));

-- ============================================================================
-- raffle_winners
-- ============================================================================
CREATE TABLE public.raffle_winners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raffle_id UUID NOT NULL REFERENCES public.raffle_events(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  roleid BIGINT NOT NULL,
  role_name TEXT,
  userid BIGINT,
  drawn_by UUID NOT NULL,
  drawn_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (raffle_id, roleid)
);

CREATE INDEX idx_raffle_winners_raffle ON public.raffle_winners(raffle_id);
CREATE INDEX idx_raffle_winners_tenant ON public.raffle_winners(tenant_id);

ALTER TABLE public.raffle_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view raffle winners"
  ON public.raffle_winners FOR SELECT TO authenticated
  USING (public.is_server_member(tenant_id, auth.uid()));

CREATE POLICY "Manage kits can insert raffle winners"
  ON public.raffle_winners FOR INSERT TO authenticated
  WITH CHECK (
    drawn_by = auth.uid()
    AND public.has_server_permission(tenant_id, auth.uid(), 'manage_kits')
  );

CREATE POLICY "Manage kits can delete raffle winners"
  ON public.raffle_winners FOR DELETE TO authenticated
  USING (public.has_server_permission(tenant_id, auth.uid(), 'manage_kits'));

-- ============================================================================
-- raffle_reward_deliveries
-- ============================================================================
CREATE TABLE public.raffle_reward_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raffle_id UUID NOT NULL REFERENCES public.raffle_events(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  roleid BIGINT NOT NULL,
  role_name TEXT,
  userid BIGINT,
  reward_payload_json JSONB NOT NULL,
  idempotency_key TEXT NOT NULL,
  status public.raffle_delivery_status NOT NULL DEFAULT 'pending',
  mail_log_ids UUID[] NOT NULL DEFAULT ARRAY[]::uuid[],
  response_json JSONB,
  error_message TEXT,
  sent_by UUID NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (raffle_id, idempotency_key)
);

CREATE INDEX idx_raffle_deliveries_raffle ON public.raffle_reward_deliveries(raffle_id);
CREATE INDEX idx_raffle_deliveries_tenant ON public.raffle_reward_deliveries(tenant_id);
CREATE INDEX idx_raffle_deliveries_status ON public.raffle_reward_deliveries(tenant_id, status);

ALTER TABLE public.raffle_reward_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view raffle deliveries"
  ON public.raffle_reward_deliveries FOR SELECT TO authenticated
  USING (public.is_server_member(tenant_id, auth.uid()));

CREATE POLICY "Save real roles can insert raffle deliveries"
  ON public.raffle_reward_deliveries FOR INSERT TO authenticated
  WITH CHECK (
    sent_by = auth.uid()
    AND public.has_server_permission(tenant_id, auth.uid(), 'save_real_roles')
  );

CREATE POLICY "Save real roles can update raffle deliveries"
  ON public.raffle_reward_deliveries FOR UPDATE TO authenticated
  USING (public.has_server_permission(tenant_id, auth.uid(), 'save_real_roles'))
  WITH CHECK (public.has_server_permission(tenant_id, auth.uid(), 'save_real_roles'));

CREATE TRIGGER raffle_deliveries_set_updated_at
  BEFORE UPDATE ON public.raffle_reward_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
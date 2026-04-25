-- Phase 4B2: ensure no duplicate participant per raffle
ALTER TABLE public.raffle_participants
  ADD CONSTRAINT raffle_participants_unique_per_raffle UNIQUE (raffle_id, roleid);

-- Index to speed up listing winners by raffle
CREATE INDEX IF NOT EXISTS raffle_winners_raffle_id_idx
  ON public.raffle_winners (raffle_id);

CREATE INDEX IF NOT EXISTS raffle_participants_raffle_id_idx
  ON public.raffle_participants (raffle_id);
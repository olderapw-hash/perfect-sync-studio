
ALTER TABLE public.gm_bulk_schedules
  ADD COLUMN IF NOT EXISTS every_day boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS next_run_at timestamptz;

-- Populate every_day from selection JSON for existing rows
UPDATE public.gm_bulk_schedules
  SET every_day = true
  WHERE (selection->>'every_day')::boolean = true;

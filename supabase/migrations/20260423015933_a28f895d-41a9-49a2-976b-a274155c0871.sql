-- Tabela de favoritos de itens (por usuário + tenant)
CREATE TABLE public.item_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  item_id integer NOT NULL,
  name text,
  icon_path text,
  max_count integer,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT item_favorites_unique UNIQUE (user_id, tenant_id, item_id)
);

CREATE INDEX idx_item_favorites_user_tenant
  ON public.item_favorites (user_id, tenant_id, created_at DESC);

ALTER TABLE public.item_favorites ENABLE ROW LEVEL SECURITY;

-- Apenas o próprio usuário enxerga seus favoritos
CREATE POLICY "Users view own favorites"
  ON public.item_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insere apenas para si mesmo, e o tenant deve existir (RLS de tenants ainda gate via FK)
CREATE POLICY "Users insert own favorites"
  ON public.item_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own favorites"
  ON public.item_favorites
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own favorites"
  ON public.item_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
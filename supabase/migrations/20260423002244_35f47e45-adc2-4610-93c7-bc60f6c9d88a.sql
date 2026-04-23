-- 1. Tabela
CREATE TABLE public.initial_kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_cls INTEGER,
  visibility TEXT NOT NULL DEFAULT 'server' CHECK (visibility IN ('private', 'server')),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_initial_kits_tenant ON public.initial_kits(tenant_id);
CREATE INDEX idx_initial_kits_created_by ON public.initial_kits(created_by);

-- 2. Trigger updated_at
CREATE TRIGGER initial_kits_set_updated_at
BEFORE UPDATE ON public.initial_kits
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 3. RLS
ALTER TABLE public.initial_kits ENABLE ROW LEVEL SECURITY;

-- SELECT: server visibility para qualquer membro; private só o criador
CREATE POLICY "Members can view server kits"
ON public.initial_kits
FOR SELECT
TO authenticated
USING (
  public.is_server_member(tenant_id, auth.uid())
  AND (
    visibility = 'server'
    OR (visibility = 'private' AND created_by = auth.uid())
  )
);

-- INSERT: precisa ser membro com save_templates e ser o criador
CREATE POLICY "Save templates can create kits"
ON public.initial_kits
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND public.has_server_permission(tenant_id, auth.uid(), 'save_templates')
);

-- UPDATE: criador OU quem tem save_templates no servidor
CREATE POLICY "Save templates or owner can update kits"
ON public.initial_kits
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_server_permission(tenant_id, auth.uid(), 'save_templates')
)
WITH CHECK (
  created_by = auth.uid()
  OR public.has_server_permission(tenant_id, auth.uid(), 'save_templates')
);

-- DELETE: criador OU quem tem save_templates
CREATE POLICY "Save templates or owner can delete kits"
ON public.initial_kits
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_server_permission(tenant_id, auth.uid(), 'save_templates')
);

-- 4. Atualiza default_permissions_for_role para incluir manage_kits (futuro)
CREATE OR REPLACE FUNCTION public.default_permissions_for_role(_role server_role)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE _role
    WHEN 'owner' THEN jsonb_build_object(
      'view', true,
      'save_templates', true,
      'save_real_roles', true,
      'restore_backup', true,
      'compare_backup', true,
      'clear_sections', true,
      'bulk_apply', true,
      'manage_servers', true,
      'view_audit', true,
      'manage_members', true,
      'manage_kits', true
    )
    WHEN 'admin' THEN jsonb_build_object(
      'view', true,
      'save_templates', true,
      'save_real_roles', true,
      'restore_backup', true,
      'compare_backup', true,
      'clear_sections', true,
      'bulk_apply', true,
      'manage_servers', false,
      'view_audit', true,
      'manage_members', false,
      'manage_kits', true
    )
    WHEN 'editor' THEN jsonb_build_object(
      'view', true,
      'save_templates', true,
      'save_real_roles', false,
      'restore_backup', false,
      'compare_backup', true,
      'clear_sections', true,
      'bulk_apply', false,
      'manage_servers', false,
      'view_audit', true,
      'manage_members', false,
      'manage_kits', true
    )
    WHEN 'readonly' THEN jsonb_build_object(
      'view', true,
      'save_templates', false,
      'save_real_roles', false,
      'restore_backup', false,
      'compare_backup', true,
      'clear_sections', false,
      'bulk_apply', false,
      'manage_servers', false,
      'view_audit', false,
      'manage_members', false,
      'manage_kits', false
    )
  END;
$function$;
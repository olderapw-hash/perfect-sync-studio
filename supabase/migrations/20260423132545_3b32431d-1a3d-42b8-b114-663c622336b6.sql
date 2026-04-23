CREATE OR REPLACE FUNCTION public.get_tenant_secret(_tenant_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT pw_api_secret
  FROM public.tenants
  WHERE id = _tenant_id
    AND owner_id = auth.uid()
  LIMIT 1;
$$;
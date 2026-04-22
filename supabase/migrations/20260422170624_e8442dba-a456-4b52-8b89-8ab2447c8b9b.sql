
-- ============================================================
-- 1) Hide tenants.pw_api_secret from regular SELECT queries
-- ============================================================
-- Replace the broad owner-read policy with one that excludes the secret
-- column from the default SELECT surface. The secret is still fetched
-- on demand via the get_my_tenant_secret() RPC below.

-- Revoke broad column access and grant only non-secret columns
REVOKE SELECT ON public.tenants FROM authenticated, anon;

GRANT SELECT
  (id, owner_id, server_name, pw_api_base_url, icon_base_url,
   logo_url, primary_color, onboarding_completed, created_at, updated_at)
  ON public.tenants
  TO authenticated;

-- Service role keeps full access (it bypasses RLS / column grants anyway,
-- but be explicit for clarity).
GRANT SELECT ON public.tenants TO service_role;

-- Writes (INSERT/UPDATE) still need to include pw_api_secret so the user
-- can save/rotate it.
GRANT INSERT, UPDATE ON public.tenants TO authenticated;

-- Dedicated, auditable surface for reading the caller's own secret.
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
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_tenant_secret() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_tenant_secret() TO authenticated;

-- ============================================================
-- 2) Prevent superadmin role escalation via user_roles INSERT
-- ============================================================
-- Superadmin can still grant 'admin' or 'user' but never 'superadmin'.
DROP POLICY IF EXISTS "Superadmin can insert roles" ON public.user_roles;

CREATE POLICY "Superadmin can insert non-superadmin roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role)
  AND role <> 'superadmin'::app_role
);

-- Mirror the protection for DELETE: superadmins should not be able to
-- delete other superadmins (prevents lockout / hostile takedown).
DROP POLICY IF EXISTS "Superadmin can delete roles" ON public.user_roles;

CREATE POLICY "Superadmin can delete non-superadmin roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role)
  AND role <> 'superadmin'::app_role
);

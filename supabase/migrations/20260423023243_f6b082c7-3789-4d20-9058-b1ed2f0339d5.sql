-- 1) Restrict pw_api_secret column-level access on tenants.
-- Owners read it via the SECURITY DEFINER RPC get_my_tenant_secret().
-- Members can still SELECT the tenant row, but the secret column will return NULL
-- for any role lacking column privilege.
REVOKE SELECT (pw_api_secret) ON public.tenants FROM authenticated;
REVOKE SELECT (pw_api_secret) ON public.tenants FROM anon;

-- 2) Prevent privilege escalation: members with manage_members cannot edit their own row,
--    and cannot promote anyone to 'owner'.
DROP POLICY IF EXISTS "Manage members can update" ON public.server_members;
CREATE POLICY "Manage members can update"
ON public.server_members
FOR UPDATE
TO authenticated
USING (
  has_server_permission(tenant_id, auth.uid(), 'manage_members'::text)
  AND user_id <> auth.uid()
  AND role <> 'owner'::server_role
)
WITH CHECK (
  has_server_permission(tenant_id, auth.uid(), 'manage_members'::text)
  AND user_id <> auth.uid()
  AND role <> 'owner'::server_role
);

-- Same guard on DELETE (already excludes owner role; also block self-delete to keep symmetry)
DROP POLICY IF EXISTS "Manage members can delete" ON public.server_members;
CREATE POLICY "Manage members can delete"
ON public.server_members
FOR DELETE
TO authenticated
USING (
  has_server_permission(tenant_id, auth.uid(), 'manage_members'::text)
  AND role <> 'owner'::server_role
  AND user_id <> auth.uid()
);

-- 3) Limit server_invites manager visibility to non-stale invites:
--    only pending invites that are still within their expiration window.
--    Accepted / revoked / expired invites' emails are no longer exposed via SELECT.
DROP POLICY IF EXISTS "Manage members can read invites" ON public.server_invites;
CREATE POLICY "Manage members can read invites"
ON public.server_invites
FOR SELECT
TO authenticated
USING (
  has_server_permission(tenant_id, auth.uid(), 'manage_members'::text)
  AND status = 'pending'::invite_status
  AND expires_at > now()
);
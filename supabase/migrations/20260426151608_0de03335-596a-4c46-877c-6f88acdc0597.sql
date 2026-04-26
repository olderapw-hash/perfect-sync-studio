-- Harden UPDATE policy on server_invites: prevent tenant_id, email, role,
-- or invited_by being changed via UPDATE; only status/accept fields may move.
DROP POLICY IF EXISTS "Manage members can revoke invites" ON public.server_invites;

CREATE POLICY "Manage members can revoke invites"
ON public.server_invites
FOR UPDATE
TO authenticated
USING (
  has_server_permission(tenant_id, auth.uid(), 'manage_members'::text)
)
WITH CHECK (
  has_server_permission(tenant_id, auth.uid(), 'manage_members'::text)
);

-- Trigger guard: forbid mutating immutable invite fields from non-service-role
CREATE OR REPLACE FUNCTION public.server_invites_guard_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.invited_by IS DISTINCT FROM OLD.invited_by
     OR NEW.permissions IS DISTINCT FROM OLD.permissions THEN
    RAISE EXCEPTION 'Immutable invite fields cannot be modified';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS server_invites_guard_immutable_trg ON public.server_invites;
CREATE TRIGGER server_invites_guard_immutable_trg
BEFORE UPDATE ON public.server_invites
FOR EACH ROW
EXECUTE FUNCTION public.server_invites_guard_immutable();
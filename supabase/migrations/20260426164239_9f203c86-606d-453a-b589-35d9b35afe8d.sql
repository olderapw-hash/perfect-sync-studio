-- Fix privilege escalation: prevent manage_members from inserting owner role
-- or assigning a role to themselves via INSERT (matches UPDATE/DELETE policy intent).
DROP POLICY IF EXISTS "Manage members can insert" ON public.server_members;

CREATE POLICY "Manage members can insert"
ON public.server_members
FOR INSERT
TO authenticated
WITH CHECK (
  has_server_permission(tenant_id, auth.uid(), 'manage_members'::text)
  AND role <> 'owner'::server_role
  AND user_id <> auth.uid()
);
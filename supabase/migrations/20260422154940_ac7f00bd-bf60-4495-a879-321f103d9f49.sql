-- Tighten user_roles SELECT: only the user themselves and superadmins can see roles.
-- Regular admins do not need to enumerate other users' roles (superadmin uses
-- admin_list_users() SECURITY DEFINER for the user-management UI).
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Superadmin can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'::app_role));
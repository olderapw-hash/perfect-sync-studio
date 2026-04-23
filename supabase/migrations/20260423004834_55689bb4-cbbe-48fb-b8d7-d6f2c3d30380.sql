GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT SELECT ON public.tenants TO anon;
GRANT ALL ON public.tenants TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.server_members TO authenticated;
GRANT ALL ON public.server_members TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.server_invites TO authenticated;
GRANT ALL ON public.server_invites TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.initial_kits TO authenticated;
GRANT ALL ON public.initial_kits TO service_role;
-- Permitir que membros de servidor (server_members) também leiam o tenant correspondente,
-- não apenas o owner. Isso é necessário pra que convidados aceitos enxerguem o servidor
-- na tela /servers e o painel saiba qual tenant ativar.
CREATE POLICY "Members can view tenant"
ON public.tenants
FOR SELECT
TO authenticated
USING (public.is_server_member(id, auth.uid()));
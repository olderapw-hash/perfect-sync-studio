// Hook para gerenciar múltiplos servidores (tenants) por usuário.
// O servidor "ativo" é o que a edge function clsconfig-proxy usa.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Server {
  id: string;
  owner_id: string;
  server_name: string;
  pw_api_base_url: string | null;
  icon_base_url: string | null;
  is_active: boolean;
  connection_status: string | null;
  connection_tested_at: string | null;
  connection_error: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

const COLUMNS =
  "id, owner_id, server_name, pw_api_base_url, icon_base_url, is_active, connection_status, connection_tested_at, connection_error, onboarding_completed, created_at, updated_at";

export function useServers() {
  const { session } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!session?.user) {
      setServers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Traz tenants em que o usuário é dono OU membro convidado.
    // A RLS já filtra: "Users can view own tenant" + "Members can view tenant".
    const [{ data: owned }, { data: memberships }] = await Promise.all([
      supabase
        .from("tenants")
        .select(COLUMNS)
        .eq("owner_id", session.user.id),
      supabase
        .from("server_members")
        .select(`tenant:tenants(${COLUMNS})`)
        .eq("user_id", session.user.id),
    ]);
    const fromMemberships = ((memberships ?? [])
      .map((m: { tenant: Server | null }) => m.tenant)
      .filter(Boolean)) as Server[];
    // Dedup por id (owner também aparece em server_members como 'owner').
    const map = new Map<string, Server>();
    for (const s of [...(owned ?? []), ...fromMemberships] as Server[]) {
      map.set(s.id, s);
    }
    const all = Array.from(map.values()).sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    );
    setServers(all);
    setLoading(false);
  }, [session?.user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const active = servers.find((s) => s.is_active) ?? null;

  /** Define qual servidor está ativo (o usado pela edge function). */
  const setActive = useCallback(
    async (id: string) => {
      const { error } = await supabase.rpc("set_active_tenant", { target_tenant_id: id });
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  return { servers, active, loading, refetch, setActive };
}

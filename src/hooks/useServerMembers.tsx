// CRUD de membros e convites para um servidor.
// As policies já barram tudo no banco — esses helpers só não escondem
// erros, expõem refetch consistente e centralizam o shape.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ServerRole, PermissionMap } from "@/hooks/useServerPermissions";

export interface ServerMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: ServerRole;
  permissions: PermissionMap;
  created_at: string;
  updated_at: string;
}

export interface ServerInvite {
  id: string;
  tenant_id: string;
  email: string;
  role: ServerRole;
  permissions: PermissionMap;
  status: "pending" | "accepted" | "revoked" | "expired";
  invited_by: string;
  invited_at: string;
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
}

export function useServerMembers(tenantId: string | null) {
  const [members, setMembers] = useState<ServerMember[]>([]);
  const [invites, setInvites] = useState<ServerInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!tenantId) {
      setMembers([]);
      setInvites([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: m }, { data: i }] = await Promise.all([
      supabase
        .from("server_members")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true }),
      supabase
        .from("server_invites")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("status", "pending")
        .order("invited_at", { ascending: false }),
    ]);
    setMembers((m ?? []) as ServerMember[]);
    setInvites((i ?? []) as ServerInvite[]);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { members, invites, loading, refetch };
}

/** Convites pendentes para o e-mail do usuário logado (visíveis em qualquer tela). */
export function useMyPendingInvites() {
  const [invites, setInvites] = useState<ServerInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("server_invites")
      .select("*")
      .eq("status", "pending")
      .order("invited_at", { ascending: false });
    setInvites((data ?? []) as ServerInvite[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { invites, loading, refetch };
}

// Hook que expõe as permissões efetivas do usuário no servidor ATIVO.
//
// Lê via RPC `get_my_server_permissions(tenant_id)` que já respeita
// owner implícito + jsonb override. Retorna defaults conservadores
// (tudo false) enquanto carrega ou se não houver servidor ativo —
// assim a UI nunca "vaza" um botão antes da checagem.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";

export type ServerPermissionKey =
  | "view"
  | "save_templates"
  | "save_real_roles"
  | "restore_backup"
  | "compare_backup"
  | "clear_sections"
  | "bulk_apply"
  | "manage_servers"
  | "view_audit"
  | "manage_members";

export type ServerRole = "owner" | "admin" | "editor" | "readonly";

export type PermissionMap = Record<ServerPermissionKey, boolean>;

const ALL_PERMISSION_KEYS: ServerPermissionKey[] = [
  "view",
  "save_templates",
  "save_real_roles",
  "restore_backup",
  "compare_backup",
  "clear_sections",
  "bulk_apply",
  "manage_servers",
  "view_audit",
  "manage_members",
];

const FALSE_MAP: PermissionMap = ALL_PERMISSION_KEYS.reduce((acc, k) => {
  acc[k] = false;
  return acc;
}, {} as PermissionMap);

const TRUE_MAP: PermissionMap = ALL_PERMISSION_KEYS.reduce((acc, k) => {
  acc[k] = true;
  return acc;
}, {} as PermissionMap);

function normalize(input: unknown): PermissionMap {
  if (!input || typeof input !== "object") return { ...FALSE_MAP };
  const src = input as Record<string, unknown>;
  const out: PermissionMap = { ...FALSE_MAP };
  for (const k of ALL_PERMISSION_KEYS) {
    out[k] = src[k] === true;
  }
  return out;
}

interface CtxValue {
  loading: boolean;
  tenantId: string | null;
  role: ServerRole | null;
  permissions: PermissionMap;
  /** Atalho prático: `can("save_templates")`. */
  can: (perm: ServerPermissionKey) => boolean;
  refetch: () => Promise<void>;
}

const Ctx = createContext<CtxValue>({
  loading: true,
  tenantId: null,
  role: null,
  permissions: { ...FALSE_MAP },
  can: () => false,
  refetch: async () => {},
});

export const ServerPermissionsProvider = ({ children }: { children: ReactNode }) => {
  const { session, isSuperadmin } = useAuth();
  const { active, loading: serversLoading } = useServers();
  const [permissions, setPermissions] = useState<PermissionMap>({ ...FALSE_MAP });
  const [role, setRole] = useState<ServerRole | null>(null);
  const [loading, setLoading] = useState(true);

  const tenantId = active?.id ?? null;

  const fetchPermissions = async () => {
    if (!session?.user) {
      setRole(null);
      setPermissions({ ...FALSE_MAP });
      setLoading(false);
      return;
    }

    // Superadmin global do app → tudo true (mesmo sem tenant ativo).
    if (isSuperadmin && !tenantId) {
      setRole("owner");
      setPermissions({ ...TRUE_MAP });
      setLoading(false);
      return;
    }

    if (!tenantId) {
      setRole(null);
      setPermissions({ ...FALSE_MAP });
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc("get_my_server_permissions", {
      _tenant_id: tenantId,
    });
    if (error || !data) {
      setRole(null);
      setPermissions({ ...FALSE_MAP });
    } else {
      const obj = data as { role?: ServerRole; permissions?: unknown };
      setRole(obj.role ?? null);
      setPermissions(normalize(obj.permissions));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (serversLoading) return;
    void fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, tenantId, isSuperadmin, serversLoading]);

  const value = useMemo<CtxValue>(
    () => ({
      loading,
      tenantId,
      role,
      permissions,
      can: (perm) => permissions[perm] === true,
      refetch: fetchPermissions,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, tenantId, role, permissions],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useServerPermissions = () => useContext(Ctx);

/** Componente helper: renderiza children só se a permissão for true. */
export const Can = ({
  perm,
  children,
  fallback = null,
}: {
  perm: ServerPermissionKey;
  children: ReactNode;
  fallback?: ReactNode;
}) => {
  const { can, loading } = useServerPermissions();
  if (loading) return null;
  return can(perm) ? <>{children}</> : <>{fallback}</>;
};

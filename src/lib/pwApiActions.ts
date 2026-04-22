// Cliente tipado para as actions extras da VPS (Lote 3).
// Roteia via Edge Function `clsconfig-proxy` que injeta o `x-sync-secret`.
// Cada action tem o contrato documentado em docs/api-contract.md.
import { supabase } from "@/integrations/supabase/client";

export interface CatalogItem {
  id: number;
  name: string;
  icon_path?: string;
  tier?: number;
  stack_max?: number;
  type?: string;
}

export interface ItemCatalogResponse {
  success: boolean;
  count: number;
  items: CatalogItem[];
  error?: string;
}

export interface BackupRecord {
  roleid: number;
  type: "role_json" | "clsconfig_file";
  file: string;
  /** epoch seconds */
  created_at?: number;
  size?: number;
}

export interface ListBackupsResponse {
  success: boolean;
  backups: BackupRecord[];
  error?: string;
}

export interface RestoreBackupResponse {
  success: boolean;
  roleid?: number;
  restored?: { role_json?: boolean; clsconfig_file?: boolean };
  verified?: boolean;
  pre_restore_backups?: {
    role_json?: { file: string };
    clsconfig_file?: { file: string };
  };
  error?: string;
}

export interface SaveRoleEditablePayload {
  roleid: number;
  status?: Record<string, number | string>;
  inventory?: unknown;
  equipment?: unknown;
  storehouse?: unknown;
}

export interface SaveRoleEditableResponse {
  success: boolean;
  roleid?: number;
  online?: boolean;
  applied?: string[];
  verified?: boolean;
  backups?: { role_json?: { file: string } };
  error?: string;
}

/** Erro padronizado quando o endpoint da VPS ainda não existe (404). */
export class EndpointMissingError extends Error {
  constructor(public action: string) {
    super(`Endpoint ?action=${action} ainda não implementado na VPS`);
    this.name = "EndpointMissingError";
  }
}

async function callAction<T>(
  action: string,
  opts: { method: "GET" | "POST"; query?: Record<string, string | number>; body?: unknown },
): Promise<T> {
  const qs = new URLSearchParams();
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) qs.set(k, String(v));
  }
  const path = `clsconfig-proxy/action/${action}${qs.toString() ? "?" + qs.toString() : ""}`;
  const { data, error } = await supabase.functions.invoke(path, {
    method: opts.method,
    body: opts.method === "POST" ? (opts.body ?? {}) : undefined,
  });
  if (error) {
    const ctx = (error as unknown as { context?: Response }).context;
    let extra = "";
    let status = 0;
    if (ctx) {
      status = ctx.status ?? 0;
      try { extra = await ctx.text(); } catch { /* ignore */ }
    }
    if (status === 404) throw new EndpointMissingError(action);
    throw new Error(extra ? `${error.message}\n\n${extra}` : error.message);
  }
  if (data && typeof data === "object" && (data as { success?: boolean }).success === false) {
    const err = (data as { error?: string }).error ?? "";
    if (/not\s+found|unknown\s+action|n[ãa]o\s+encontrad/i.test(err)) {
      throw new EndpointMissingError(action);
    }
  }
  return data as T;
}

export const pwApi = {
  getItemCatalog(params: { q?: string; limit?: number; offset?: number } = {}) {
    const query: Record<string, string | number> = {};
    if (params.q) query.q = params.q;
    if (params.limit != null) query.limit = params.limit;
    if (params.offset != null) query.offset = params.offset;
    return callAction<ItemCatalogResponse>("getItemCatalog", { method: "GET", query });
  },
  listBackups(params: { roleid?: number } = {}) {
    const query: Record<string, string | number> = {};
    if (params.roleid != null) query.roleid = params.roleid;
    return callAction<ListBackupsResponse>("listBackups", { method: "GET", query });
  },
  restoreBackup(body: {
    roleid: number;
    backup_role_json?: string;
    backup_clsconfig_file?: string;
  }) {
    return callAction<RestoreBackupResponse>("restoreBackup", { method: "POST", body });
  },
  saveRoleEditable(body: SaveRoleEditablePayload) {
    return callAction<SaveRoleEditableResponse>("saveRoleEditable", { method: "POST", body });
  },
};

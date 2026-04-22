// Cliente tipado para as actions extras da VPS (Lote 3).
// Roteia via Edge Function `clsconfig-proxy` que injeta o `x-sync-secret`.
// Cada action tem o contrato documentado em docs/api-contract.md.
import { supabase } from "@/integrations/supabase/client";

export interface CatalogItemDefaults {
  count?: number;
  max_count?: number;
  proctype?: number;
  expire_date?: number;
  guid1?: number;
  guid2?: number;
  mask?: number;
  data?: string;
  [k: string]: unknown;
}

export interface CatalogItem {
  id: number;
  name: string;
  icon_path?: string;
  tier?: number;
  stack_max?: number;
  max_count?: number;
  type?: string;
  /** Marca quando o PHP devolveu o item via fallback de ID (sem metadados completos). */
  source?: "catalog" | "fallback_id" | string;
  defaults?: CatalogItemDefaults;
}

export interface ItemCatalogResponse {
  success: boolean;
  count: number;
  items: CatalogItem[];
  error?: string;
}

/** Tipo de backup retornado pela VPS. `export_log` é o log do exportClsconfig. */
export type BackupKind = "role_json" | "clsconfig_file" | "export_log";

export interface BackupRecord {
  type: BackupKind;
  file: string;
  /** basename amigável retornado pelo PHP. */
  name?: string;
  /** roleid pode não vir em alguns logs de export — opcional/null. */
  roleid?: number | null;
  /** Tamanho em bytes (PHP retorna `bytes`). */
  bytes?: number;
  /** epoch seconds (PHP retorna `mtime`). */
  mtime?: number;
  /** ISO string (PHP retorna `created_at` como string). */
  created_at?: string;
  sha1?: string;
}

/**
 * Resposta REAL do endpoint na VPS:
 * {
 *   success: true,
 *   backups: {
 *     role_json: BackupRecord[],
 *     clsconfig_files: BackupRecord[],
 *     export_logs: BackupRecord[],
 *     all: BackupRecord[]   // união ordenada por created_at desc
 *   }
 * }
 */
export interface ListBackupsResponse {
  success: boolean;
  backups: {
    role_json?: BackupRecord[];
    clsconfig_files?: BackupRecord[];
    export_logs?: BackupRecord[];
    all?: BackupRecord[];
  };
  error?: string;
}


/**
 * Contrato real do PHP (abr/2026):
 *
 * Request:
 *   { type:"role_json", name:"<basename>", confirm:"RESTORE_ROLE_JSON" }
 *   ou para dry-run:
 *   { type:"role_json", name:"<basename>", dry_run:true }
 *
 * Response (dry_run):
 *   { success:true, dry_run:true, roleid:31, source:{...}, target:{...} }
 *
 * Response (real):
 *   {
 *     success:true,
 *     roleid:31,
 *     restored:{
 *       saved:{
 *         verified:boolean,
 *         backups:{
 *           role_json:{ file:string },
 *           clsconfig_file:{ file:string }
 *         },
 *         export?:{ log_file?:string }
 *       }
 *     }
 *   }
 */
export interface RestoreSavedBlock {
  verified?: boolean;
  backups?: {
    role_json?: { file: string };
    clsconfig_file?: { file: string };
  };
  export?: { log_file?: string };
}

export interface RestoreBackupResponse {
  success: boolean;
  dry_run?: boolean;
  roleid?: number;
  source?: Record<string, unknown>;
  target?: Record<string, unknown>;
  restored?: {
    saved?: RestoreSavedBlock;
    // tolerância pra shapes antigos
    role_json?: boolean;
    clsconfig_file?: boolean;
  };
  verified?: boolean;
  error?: string;
}

export interface RestoreBackupRequest {
  type: "role_json";
  name: string;
  confirm?: "RESTORE_ROLE_JSON";
  dry_run?: boolean;
}

/**
 * Resposta de `getRoleEditable` — espelha o shape de uma entry do
 * getClsconfig, mas vinda do registro REAL do personagem no gamedbd.
 *
 * `template` segue o mesmo schema usado em ClsTemplate (status/inventory/
 * equipment/storehouse/base/summary), permitindo reusar o ClsconfigEditor
 * sem tradução adicional.
 */
export interface GetRoleEditableResponse {
  success: boolean;
  /** True se o personagem está logado (kick antes de editar). */
  online?: boolean;
  /** Snapshot atual do role no gamedbd, no mesmo schema do clsconfig. */
  template?: unknown;
  /** Wrapper opcional usado em algumas versões do PHP. */
  role?: unknown;
  error?: string;
}

/**
 * Payload de `saveRoleEditable`. Aceita tanto o modo "patch parcial"
 * (status/inventory soltos) quanto o modo "template completo" (mesmo
 * shape de saveClsconfigTemplate, porém roteado para o gamedbd real).
 *
 * `export` é opt-in: por padrão NÃO disparamos exportclsconfig em
 * personagens reais (só faz sentido quando o usuário marca a opção
 * avançada na UI).
 */
export interface SaveRoleEditablePayload {
  roleid: number;
  status?: Record<string, number | string>;
  inventory?: unknown;
  equipment?: unknown;
  storehouse?: unknown;
  /** Template completo no shape de ClsTemplate (sem decoded/cultivation/summary/class_info). */
  template?: unknown;
  /** Quando true, pede ao PHP para agendar exportclsconfig após o save. Default: false. */
  export?: boolean;
}

export interface SaveRoleEditableResponse {
  success: boolean;
  roleid?: number;
  online?: boolean;
  applied?: string[];
  verified?: boolean;
  /** Shape antigo / direto. */
  backups?: { role_json?: { file: string } };
  /** Shape "saved.*" usado pela API atualizada. */
  saved?: {
    verified?: boolean;
    backup?: { file?: string };
    backups?: {
      role_json?: { file?: string };
      clsconfig_file?: { file?: string };
    };
    export?: { log_file?: string; scheduled?: boolean };
    role?: unknown;
  };
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
    // VPS retorna 400 com {"error":"Acao invalida. Use: ..."} quando a action
    // não existe no PHP. Detectamos isso e convertemos pra EndpointMissingError.
    if (status === 400 && /acao\s+invalida|a[cç][aã]o\s+inv[aá]lida|unknown\s+action/i.test(extra)) {
      throw new EndpointMissingError(action);
    }
    throw new Error(extra ? `${error.message}\n\n${extra}` : error.message);
  }
  // Resposta 2xx mas com {error:"..."} no corpo (sem success:false).
  if (data && typeof data === "object") {
    const d = data as { success?: boolean; error?: string };
    const err = d.error ?? "";
    const explicitFail = d.success === false;
    const looksMissing = /not\s+found|unknown\s+action|n[ãa]o\s+encontrad|acao\s+invalida|a[cç][aã]o\s+inv[aá]lida/i.test(err);
    if ((explicitFail || err) && looksMissing) {
      throw new EndpointMissingError(action);
    }
  }
  return data as T;
}

export const pwApi = {
  getItemCatalog(params: { q?: string; id?: number | string; limit?: number; offset?: number } = {}) {
    const query: Record<string, string | number> = {};
    if (params.id != null && params.id !== "") query.id = params.id;
    if (params.q) query.q = params.q;
    if (params.limit != null) query.limit = params.limit;
    if (params.offset != null) query.offset = params.offset;
    return callAction<ItemCatalogResponse>("getItemCatalog", { method: "GET", query });
  },
  listBackups(params: { roleid?: number; limit?: number } = {}) {
    const query: Record<string, string | number> = {};
    if (params.roleid != null) query.roleid = params.roleid;
    if (params.limit != null) query.limit = params.limit;
    return callAction<ListBackupsResponse>("listBackups", { method: "GET", query });
  },
  restoreBackup(body: RestoreBackupRequest) {
    return callAction<RestoreBackupResponse>("restoreBackup", { method: "POST", body });
  },
  getRoleEditable(roleid: number) {
    return callAction<GetRoleEditableResponse>("getRoleEditable", {
      method: "GET",
      query: { roleid },
    });
  },
  saveRoleEditable(body: SaveRoleEditablePayload) {
    return callAction<SaveRoleEditableResponse>("saveRoleEditable", { method: "POST", body });
  },
};

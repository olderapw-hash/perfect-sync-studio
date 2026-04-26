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

/**
 * Erro de ação que falhou na VPS (HTTP 4xx/5xx) MAS o corpo de resposta
 * ainda traz dados estruturados úteis — ex.: Server Ops devolve
 * `operation.id` mesmo quando uma etapa falha (exit != 0). O caller pode
 * inspecionar `payload.operation` pra abrir o drawer de progresso e
 * mostrar o log_file.
 */
export class PwApiActionError<T = unknown> extends Error {
  constructor(
    public action: string,
    message: string,
    public status: number,
    public payload: T,
  ) {
    super(message);
    this.name = "PwApiActionError";
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
  const { invokeClsconfigProxy } = await import("@/lib/clsconfigInvoke");
  const { data, error, status, rawBody } = await invokeClsconfigProxy<T>(path, {
    method: opts.method,
    body: opts.method === "POST" ? (opts.body ?? {}) : undefined,
  });
  if (error) {
    if (status === 404) throw new EndpointMissingError(action);
    if (status === 400 && /acao\s+invalida|a[cç][aã]o\s+inv[aá]lida|unknown\s+action/i.test(rawBody)) {
      throw new EndpointMissingError(action);
    }
    // VPS antiga responde 500 com body vazio para actions novas →
    // proxy converte para 502 "Upstream returned non-JSON". Tratamos
    // como endpoint ausente para a UI mostrar a notice amigável.
    if ((status === 502 || status === 500) && /upstream\s+returned\s+non-json|endpoint\s+not\s+implemented/i.test(rawBody)) {
      throw new EndpointMissingError(action);
    }
    // Tenta extrair payload JSON estruturado do erro pra preservar campos
    // úteis (ex.: operation.id em Server Ops).
    let parsed: unknown = null;
    try {
      parsed = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      parsed = null;
    }
    if (parsed && typeof parsed === "object") {
      const p = parsed as { error?: string };
      throw new PwApiActionError(
        action,
        p.error ?? error.message,
        status ?? 0,
        parsed,
      );
    }
    throw new Error(rawBody ? `${error.message}\n\n${rawBody}` : error.message);
  }
  // Resposta 2xx mas com {error:"..."} no corpo (sem success:false).
  if (data && typeof data === "object") {
    const d = data as { success?: boolean; error?: string; endpoint_missing?: boolean };
    if (d.endpoint_missing === true) {
      throw new EndpointMissingError(action);
    }
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
  /**
   * Lê o conteúdo bruto de um backup role_json.
   * Endpoint dedicado (preferencial). VPS espera POST JSON:
   *   { type: "role_json", name: "<basename>" }
   * Resposta:
   *   { success: true, backup: { template, requested_payload, ... } }
   * Se a VPS ainda não implementou, lança EndpointMissingError —
   * o caller pode tentar dry_run como fallback.
   */
  getBackupContent(name: string, type: BackupKind = "role_json") {
    return callAction<GetBackupContentResponse>("getBackupContent", {
      method: "POST",
      body: { type, name },
    });
  },
  /**
   * Envia um correio com item anexado para o personagem alvo.
   * Contrato em docs/api-contract.md §4. Se 404 → EndpointMissingError.
   */
  sendMailItem(body: SendMailItemPayload) {
    return callAction<SendMailResponse>("sendMailItem", { method: "POST", body });
  },
  /**
   * Envia um correio com moedas/gold anexadas. Contrato em §5.
   */
  sendMailGold(body: SendMailGoldPayload) {
    return callAction<SendMailResponse>("sendMailGold", { method: "POST", body });
  },
  /* ─────────── Operação do Servidor v1 ─────────── */
  /**
   * Lê o status atual dos daemons do PW (gamedbd, gdeliveryd, etc).
   * Se o endpoint ainda não existe na VPS, lança EndpointMissingError —
   * a UI exibe "não implementado nesta VPS".
   */
  getServiceStatus() {
    return callAction<ServiceStatusResponse>("getServiceStatus", { method: "GET" });
  },
  /**
   * Lê últimas linhas dos logs principais do servidor. `source` filtra
   * por origem; `lines` controla o tail (default 200).
   */
  getServerLogs(params: { source?: ServerLogSource; lines?: number; q?: string } = {}) {
    const query: Record<string, string | number> = {};
    if (params.source) query.source = params.source;
    if (params.lines != null) query.lines = params.lines;
    if (params.q) query.q = params.q;
    return callAction<ServerLogsResponse>("getServerLogs", { method: "GET", query });
  },
  /**
   * Dispara `exportclsconfig` na VPS. Operação NÃO destrutiva (apenas
   * regrava o `clsconfig.data` a partir do gamedbd) — mas exige
   * permissão `save_templates` por escrever em arquivo do servidor.
   */
  exportClsconfig() {
    return callAction<ExportClsconfigResponse>("exportClsconfig", { method: "POST", body: {} });
  },
  /**
   * Envia uma mensagem global/system para todos os jogadores online
   * via wrapper sudo dedicado na VPS. Suporta `dry_run` para validar
   * o payload sem entregar de fato.
   */
  sendSystemMessage(body: SendSystemMessagePayload) {
    return callAction<SendSystemMessageResponse>("sendSystemMessage", {
      method: "POST",
      body,
    });
  },
  /**
   * Lê o estado atual de manutenção persistido na VPS.
   * Operação leve (apenas lê o state.json local). Sempre devolve um
   * estado bem-formado mesmo quando o arquivo ainda não existe.
   */
  getMaintenanceMode() {
    return callAction<GetMaintenanceModeResponse>("getMaintenanceMode", {
      method: "GET",
    });
  },
  /**
   * Liga/desliga o modo manutenção do servidor. Quando `broadcast=true`
   * (default), uma mensagem global de alta prioridade é disparada
   * automaticamente — mas a manutenção persiste mesmo se o broadcast falhar.
   * `dry_run` valida sem persistir/enviar.
   */
  setMaintenanceMode(body: SetMaintenanceModePayload) {
    return callAction<SetMaintenanceModeResponse>("setMaintenanceMode", {
      method: "POST",
      body,
    });
  },
  /* ─────────── Segurança v1 (kick / ban / unban) ─────────── */
  /**
   * Desconecta um personagem online (kick). Não bane — apenas força a
   * saída. Útil pra liberar slot ou interromper exploit em andamento.
   */
  kickRole(body: KickRolePayload) {
    return callAction<SecurityActionResponse>("kickRole", { method: "POST", body });
  },
  /**
   * Bane uma conta. Quando `duration_seconds` é informado e > 0, é um
   * ban temporário; ausente / 0 = ban permanente. `reason` obrigatório
   * para auditoria.
   */
  banAccount(body: BanAccountPayload) {
    return callAction<SecurityActionResponse>("banAccount", { method: "POST", body });
  },
  /**
   * Remove o ban de uma conta. `reason` recomendado pra trilha.
   */
  unbanAccount(body: UnbanAccountPayload) {
    return callAction<SecurityActionResponse>("unbanAccount", { method: "POST", body });
  },
  /**
   * Lista as últimas N ações de segurança registradas na VPS (kick/ban/
   * unban). O front mantém uma trilha paralela em `audit_logs` — esse
   * endpoint é a "fonte da verdade" do servidor.
   */
  listSecurityHistory(params: { limit?: number; account?: string; roleid?: number } = {}) {
    const query: Record<string, string | number> = {};
    if (params.limit != null) query.limit = params.limit;
    if (params.account) query.account = params.account;
    if (params.roleid != null) query.roleid = params.roleid;
    return callAction<SecurityHistoryResponse>("listSecurityHistory", { method: "GET", query });
  },
  /* ─────────── Server Ops v3 — controle real de servicos ─────────── */
  getManageableServices() {
    return callAction<ManageableServicesResponse>("getManageableServices", { method: "GET" });
  },
  startService(body: ServiceControlPayload) {
    return callAction<ServiceControlResponse>("startService", { method: "POST", body });
  },
  stopService(body: ServiceControlPayload) {
    return callAction<ServiceControlResponse>("stopService", { method: "POST", body });
  },
  restartService(body: ServiceControlPayload) {
    return callAction<ServiceControlResponse>("restartService", { method: "POST", body });
  },
  /**
   * Polling do progresso de operações longas (start/stop/restart server).
   * `operation_id` é o id retornado em ServiceControlResponse.operation.id.
   * Quando omitido, a VPS devolve a operação mais recente do tipo informado.
   */
  getServerOperationStatus(params: { operation_id?: string; type?: string } = {}) {
    const query: Record<string, string> = {};
    if (params.operation_id) query.operation_id = params.operation_id;
    if (params.type) query.type = params.type;
    return callAction<ServerOperationStatusResponse>("getServerOperationStatus", {
      method: "GET",
      query,
    });
  },
};

/* ─────────── Server Ops v3 — controle real de servicos ─────────── */

export interface ManageableService {
  key: string;
  label?: string;
  process_name?: string;
  state: ServiceState;
  pid?: number | null;
  process_count?: number;
  pids?: number[];
  port?: number | null;
  systemd_state?: string | null;
  listening?: boolean | null;
  aliases?: string[];
  supported_actions?: Array<"start" | "stop" | "restart">;
  selectable?: boolean;
  message?: string | null;
}

export interface ManageableServicesResponse {
  success: boolean;
  count?: number;
  collected_at?: string | number;
  services: ManageableService[];
  error?: string;
}

export interface ServiceControlPayload {
  /** Lote (preferencial). */
  services?: string[];
  /** Single (alternativa). */
  service?: string;
  verify?: boolean;
  dry_run?: boolean;
}

export interface ServiceControlResultEntry {
  success: boolean;
  service: string;
  action: "start" | "stop" | "restart";
  method?: string;
  message?: string;
  error?: string;
  exit?: number;
  post_state?: ServiceState;
  post_pid?: number | null;
  post_process_count?: number;
}

export interface ServiceControlResponse {
  success: boolean;
  dry_run?: boolean;
  action?: "start" | "stop" | "restart";
  services?: string[];
  verify?: boolean;
  results?: ServiceControlResultEntry[];
  log_file?: string | null;
  message?: string;
  error?: string;
  /** Quando a VPS dispara operação assíncrona (start/stop/restart server completo). */
  operation?: ServerOperationStatus;
}

/* ─────────── Server Ops — progresso assíncrono ─────────── */

export type ServerOperationStage =
  | "queued"
  | "broadcast"
  | "countdown"
  | "backup"
  | "stop"
  | "start"
  | "restart"
  | "verify"
  | "completed"
  | "failed"
  | "unknown"
  | string;

export type ServerOperationSuccessState = "running" | "success" | "failed" | "error" | string;

export interface ServerOperationStatus {
  id: string;
  type:
    | "startServer"
    | "stopServer"
    | "restartServer"
    | "startService"
    | "stopService"
    | "restartService"
    | string;
  stage: ServerOperationStage;
  running: boolean;
  success_state: ServerOperationSuccessState;
  success: boolean;
  created_at?: string | number | null;
  completed_at?: string | number | null;
  reason?: string | null;
  dry_run?: boolean;
  log_file?: string | null;
  countdown?: Array<{ seconds_left?: number; message?: string; sent_at?: string | number }> | null;
  backup?: {
    success?: boolean;
    path?: string | null;
    started_at?: string | number;
    completed_at?: string | number;
    error?: string | null;
  } | null;
  restart?: Record<string, unknown> | null;
  verification?: {
    success?: boolean;
    services?: Array<{ key: string; state: ServiceState; ok?: boolean; message?: string }>;
    started_at?: string | number;
    completed_at?: string | number;
  } | null;
  error?: string | null;
  services?: string[];
}

export interface ServerOperationStatusResponse {
  success: boolean;
  operation?: ServerOperationStatus;
  error?: string;
  endpoint_missing?: boolean;
}

/* ─────────── Operação do Servidor v1 ─────────── */

export type ServiceState = "online" | "offline" | "unknown";

export interface ServiceInfo {
  /** Identificador curto vindo da VPS (gamedbd, gdeliveryd, mysql, httpd...). */
  key: string;
  /** Rótulo amigável para exibir na UI. */
  label?: string;
  /** Nome real do processo no sistema (ex.: "gamedbd", "mysqld"). */
  process_name?: string;
  state: ServiceState;
  /** PID principal quando aplicável. */
  pid?: number | null;
  /** Quantidade total de processos vivos com esse nome. */
  process_count?: number;
  /** Lista completa de PIDs (quando há múltiplos). */
  pids?: number[];
  /** Porta TCP/UDP principal quando faz sentido. */
  port?: number | null;
  /** Estado reportado pelo systemd (active/inactive/unknown). */
  systemd_state?: string;
  /** True quando a porta está em LISTEN. */
  listening?: boolean;
  /** Mensagem livre (ex.: "PID file ausente"). */
  message?: string;
}

export interface ServiceStatusResponse {
  success: boolean;
  /** ISO string OU epoch seconds da coleta no PHP. */
  collected_at?: string | number;
  services: ServiceInfo[];
  error?: string;
}

export type ServerLogSource =
  | "gamedbd"
  | "exportclsconfig"
  | "httpd"
  | "mail"
  | "apicls";

export interface ServerLogEntry {
  /** ISO 8601 ou epoch — depende da origem. */
  ts?: string;
  /** Linha bruta. */
  line: string;
  /** Severidade adivinhada (best-effort). */
  level?: "info" | "warn" | "error" | "debug";
}

export interface ServerLogsResponse {
  success: boolean;
  source: ServerLogSource;
  /** Caminho do arquivo lido (informativo). */
  file?: string;
  /** Quantas linhas vieram. */
  count?: number;
  entries: ServerLogEntry[];
  /** Mensagem amigável quando o arquivo não existe / sem permissão. */
  warning?: string;
  error?: string;
}

export interface ExportClsconfigResponse {
  success: boolean;
  /** Caminho do log gerado pelo exportclsconfig.sh. */
  log_file?: string;
  /** Saída resumida do comando (best-effort). */
  output?: string;
  /** Backup do gamedbd gerado antes do export, quando aplicável. */
  gamedbd_backup?: { file?: string; bytes?: number };
  error?: string;
}

/* ─────────── Mensagem de Sistema (Server Ops v2) ─────────── */

export type SystemMessageKind = "system" | "broadcast" | "tip" | "world";
export type SystemMessagePriority = "low" | "normal" | "high";

export interface SendSystemMessagePayload {
  /** Texto da mensagem (1..200 chars por default). */
  message: string;
  /** Tipo de canal. Default: system. */
  kind?: SystemMessageKind;
  /** Prioridade visual/sonora repassada ao wrapper. Default: normal. */
  priority?: SystemMessagePriority;
  /** Quando true, valida sem entregar. */
  dry_run?: boolean;
}

export interface SendSystemMessageResponse {
  success: boolean;
  /** Eco do dry_run quando aplicável. */
  dry_run?: boolean;
  /** Eco do que foi enviado/validado. */
  message?: string;
  kind?: SystemMessageKind;
  priority?: SystemMessagePriority;
  /** Tamanho em chars (UTF-8) reportado pelo PHP. */
  length?: number;
  /** True quando o gdeliveryd entregou; false = enfileirado/queue. */
  delivered?: boolean;
  /** Mecanismo usado: lua_console, custom, no_native_handler... */
  method?: string;
  /** Caminho do log JSON gerado em backups/sysmsg-logs. */
  log_file?: string;
  /** Saída bruta quando o handler não retorna JSON. */
  raw?: string;
  /** Mensagem amigável quando ficou em queue. */
  note?: string;
  error?: string;
}

/* ─────────── Maintenance Mode (Server Ops v2) ─────────── */

export interface MaintenanceState {
  enabled: boolean;
  reason: string | null;
  eta_minutes: number | null;
  /** ISO 8601 UTC quando entrou em manutenção (mantido em ON consecutivos). */
  started_at: string | null;
  /** ISO 8601 UTC = started_at + eta_minutes (best-effort). */
  ends_at: string | null;
  /** IP/identificador do chamador no PHP (best-effort). */
  updated_by: string | null;
  /** ISO 8601 UTC do último update. */
  updated_at: string | null;
}

export interface SetMaintenanceModePayload {
  enabled: boolean;
  reason?: string;
  /** Tempo previsto em minutos (>=0, teto de 1440). */
  eta_minutes?: number | null;
  /** Quando true, dispara sendSystemMessage automaticamente. Default true. */
  broadcast?: boolean;
  dry_run?: boolean;
}

export interface MaintenanceBroadcastResult {
  attempted: boolean;
  result?: SendSystemMessageResponse;
  error?: string;
  skipped_reason?: string;
  planned?: boolean;
}

export interface SetMaintenanceModeResponse {
  success: boolean;
  dry_run?: boolean;
  /** Estado já persistido após a operação (em dry_run vem em `next`). */
  maintenance?: MaintenanceState;
  next?: MaintenanceState;
  previous?: MaintenanceState;
  broadcast?: MaintenanceBroadcastResult;
  error?: string;
}

export interface GetMaintenanceModeResponse {
  success: boolean;
  maintenance: MaintenanceState;
  error?: string;
}

export interface MailItemAttachment {
  item_id: number;
  count: number;
  max_count?: number;
  proctype?: number;
  expire_date?: number;
  mask?: number;
  guid1?: number;
  guid2?: number;
  data?: string;
}

export interface SendMailItemPayload {
  roleid: number;
  subject?: string;
  body?: string;
  item: MailItemAttachment;
}

export interface SendMailGoldPayload {
  roleid: number;
  subject?: string;
  body?: string;
  /** Inteiro > 0, no menor denominador (PW armazena em "moedas de cobre"). */
  amount: number;
}

export interface SendMailResponse {
  success: boolean;
  roleid?: number;
  mail_id?: number;
  delivered?: boolean;
  error?: string;
}

/**
 * Resposta de `getBackupContent` — devolve o template completo do role
 * que foi salvo no backup, no mesmo shape de ClsTemplate (porém vinda
 * do snapshot do gamedbd no momento do save, não do clsconfig).
 *
 * Shape REAL retornado pela VPS (abr/2026):
 *   {
 *     success: true,
 *     backup: {
 *       template: {...},            // shape de ClsTemplate
 *       requested_payload: {...},   // payload enviado no saveRoleEditable que originou o backup
 *       roleid?: number,
 *       name?: string,
 *       ...
 *     }
 *   }
 *
 * Campos legados `template`/`role` no nível raiz são mantidos para
 * compatibilidade com versões antigas do PHP.
 */
export interface BackupContent {
  template?: unknown;
  requested_payload?: unknown;
  roleid?: number;
  name?: string;
  [k: string]: unknown;
}

export interface GetBackupContentResponse {
  success: boolean;
  /** Wrapper preferencial (PHP atual). */
  backup?: BackupContent;
  /** Legado: alguns deploys antigos devolviam estes campos no topo. */
  roleid?: number;
  name?: string;
  template?: unknown;
  role?: unknown;
  error?: string;
}

/* ─────────── Segurança v1 (kick / ban / unban) ─────────── */

export interface KickRolePayload {
  /** roleid do personagem alvo (obrigatório). */
  roleid: number;
  /** Motivo curto (auditoria). Obrigatório no front. */
  reason: string;
}

export interface BanAccountPayload {
  /** Identificador da conta. Pode ser nome de login OU userid. */
  account?: string;
  userid?: number;
  /** Quando informado, a VPS resolve a conta a partir do roleid. */
  roleid?: number;
  /** Duração em segundos. Obrigatório para ban temporário. */
  duration_seconds?: number;
  /** true = ban permanente (não envia duration_seconds). */
  permanent?: boolean;
  reason: string;
  /** Quando true, a VPS valida sem aplicar. */
  dry_run?: boolean;
}

export interface UnbanAccountPayload {
  account?: string;
  userid?: number;
  roleid?: number;
  /** Recomendado mas não obrigatório (auditoria). */
  reason?: string;
  dry_run?: boolean;
}

export interface SecurityActionResponse {
  success: boolean;
  /** Eco da action executada (kick/ban/unban). */
  action?: string;
  /** roleid envolvido (kickRole sempre devolve). */
  roleid?: number;
  /** Conta envolvida quando aplicável. */
  account?: string;
  userid?: number;
  /** Duração efetiva do ban em segundos (ban temporário). */
  seconds?: number;
  /** Eco do motivo enviado. */
  reason?: string;
  /** Caminho do log gerado pelo script da VPS. */
  log_file?: string;
  /** epoch seconds em que o ban expira (ban temporário). */
  ban_until?: number | null;
  /** Estado pós-ação. */
  state?: "online" | "offline" | "banned" | "unbanned";
  /** Echo de dry_run quando aplicável. */
  dry_run?: boolean;
  message?: string;
  error?: string;
}

export type SecurityHistoryAction = "kick" | "ban" | "unban";

export interface SecurityHistoryEntry {
  ts: number;
  action: SecurityHistoryAction;
  roleid?: number | null;
  account?: string | null;
  userid?: number | null;
  reason?: string | null;
  duration_seconds?: number | null;
  by?: string | null;
}

export interface SecurityHistoryResponse {
  success: boolean;
  count?: number;
  entries: SecurityHistoryEntry[];
  warning?: string;
  error?: string;
}


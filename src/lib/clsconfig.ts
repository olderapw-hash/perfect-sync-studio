// Helpers to normalize the upstream payload and rebuild a save payload.
import type {
  ApiClass,
  ClsEntry,
  ClsItem,
  ClsTemplate,
  ClsconfigResponse,
} from "@/types/clsconfig";

const emptyItem = (pos: number): ClsItem => ({
  id: 0,
  pos,
  count: 0,
  max_count: 0,
  data: "",
  proctype: 0,
  expire_date: 0,
  guid1: 0,
  guid2: 0,
  mask: 0,
});

const num = (v: unknown, d = 0): number => {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
};

const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : v == null ? d : String(v));

const normItem = (raw: unknown, fallbackPos: number): ClsItem => {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: num(r.id),
    pos: num(r.pos, fallbackPos),
    count: num(r.count),
    max_count: num(r.max_count),
    data: str(r.data),
    proctype: num(r.proctype),
    expire_date: num(r.expire_date),
    guid1: num(r.guid1),
    guid2: num(r.guid2),
    mask: num(r.mask),
  };
};

const normItems = (raw: unknown): ClsItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((it, i) => normItem(it, i));
};

const normTemplate = (raw: unknown): ClsTemplate => {
  const t = (raw ?? {}) as Record<string, any>;
  const base = (t.base ?? {}) as Record<string, any>;
  const status = (t.status ?? {}) as Record<string, any>;
  const inv = (t.inventory ?? {}) as Record<string, any>;
  const eq = (t.equipment ?? {}) as Record<string, any>;
  const sh = (t.storehouse ?? {}) as Record<string, any>;
  const summary = (t.summary ?? {}) as Record<string, any>;

  return {
    roleid: num(t.roleid),
    summary: {
      name: str(summary.name),
      cls: num(summary.cls),
      race: num(summary.race),
      gender: num(summary.gender),
      level: num(summary.level),
      level2: num(summary.level2),
      cultivation: num(summary.cultivation),
      reputation: num(summary.reputation),
      inventory_money: num(summary.inventory_money),
      inventory_items: num(summary.inventory_items),
      equipment_items: num(summary.equipment_items),
      storehouse_items: num(summary.storehouse_items),
      class_name: summary.class_name != null ? str(summary.class_name) : undefined,
      class_icon_path: summary.class_icon_path != null ? str(summary.class_icon_path) : undefined,
    },
    base: {
      id: num(base.id),
      name: str(base.name),
      race: num(base.race),
      cls: num(base.cls),
      gender: num(base.gender),
      custom_data: str(base.custom_data),
      config_data: str(base.config_data),
      custom_stamp: num(base.custom_stamp),
      status: num(base.status),
      delete_time: num(base.delete_time),
      create_time: num(base.create_time),
      lastlogin_time: num(base.lastlogin_time),
      spouse: num(base.spouse),
      userid: num(base.userid),
      cross_data: str(base.cross_data),
    },
    status: {
      level: num(status.level),
      level2: num(status.level2),
      cultivation: num(status.cultivation),
      exp: num(status.exp),
      sp: num(status.sp),
      pp: num(status.pp),
      hp: num(status.hp),
      mp: num(status.mp),
      worldtag: num(status.worldtag),
      reputation: num(status.reputation),
      posx: num(status.posx),
      posy: num(status.posy),
      posz: num(status.posz),
      storesize: num(status.storesize),
      custom_status: str(status.custom_status),
      filter_data: str(status.filter_data),
      charactermode: num(status.charactermode),
      instancekeylist: str(status.instancekeylist),
      dbltime_expire: num(status.dbltime_expire),
      dbltime_mode: num(status.dbltime_mode),
      dbltime_begin: num(status.dbltime_begin),
      dbltime_used: num(status.dbltime_used),
      dbltime_max: num(status.dbltime_max),
      time_used: num(status.time_used),
      petcorral: str(status.petcorral),
      property: str(status.property),
      var_data: str(status.var_data),
      skills: str(status.skills),
      storehousepasswd: str(status.storehousepasswd),
      waypointlist: str(status.waypointlist),
      coolingtime: str(status.coolingtime),
      npc_relation: str(status.npc_relation),
      multi_exp_ctrl: str(status.multi_exp_ctrl),
      storage_task: str(status.storage_task),
      faction_contrib: str(status.faction_contrib),
      force_data: str(status.force_data),
      online_award: str(status.online_award),
      profit_time_data: str(status.profit_time_data),
      country_data: str(status.country_data),
      king_data: str(status.king_data),
      meridian_data: str(status.meridian_data),
      extraprop: str(status.extraprop),
      title_data: str(status.title_data),
      reincarnation_data: str(status.reincarnation_data),
      realm_data: str(status.realm_data),
      decoded: status.decoded ?? undefined,
    },
    inventory: {
      capacity: num(inv.capacity),
      timestamp: num(inv.timestamp),
      money: num(inv.money),
      items: normItems(inv.items),
    },
    equipment: {
      items: normItems(eq.items),
    },
    storehouse: {
      capacity: num(sh.capacity),
      money: num(sh.money),
      items: normItems(sh.items),
      dress: normItems(sh.dress),
      material: normItems(sh.material),
      generalcard: normItems(sh.generalcard),
    },
  };
};

const normApiClass = (raw: unknown): ApiClass => {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: num(r.id),
    name: str(r.name),
    icon_path: str(r.icon_path),
    race: str(r.race),
    gender: r.gender != null ? num(r.gender) : undefined,
  };
};

/** Aceita used_classes como array de números OU array de objetos {id,...}. */
const normUsedClasses = (raw: unknown): number[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => {
      if (typeof v === "number") return v;
      if (v && typeof v === "object" && "id" in v) return num((v as { id: unknown }).id);
      return num(v);
    })
    .filter((n) => Number.isFinite(n));
};

import { CLS_TO_ROLEID } from "./clsRoleidMap";

/** Roleids válidos derivados do mapa cls → roleid (fonte única da verdade). */
export const ALLOWED_ROLEIDS: ReadonlySet<number> = new Set(Object.values(CLS_TO_ROLEID));

export function normalizeClsconfigResponse(raw: unknown): ClsconfigResponse {
  const r = (raw ?? {}) as Record<string, any>;
  // Mantemos TODOS os entries retornados em response.entries — sem filtro restritivo.
  // Se o template não tiver roleid próprio, derivamos a partir do cls usando CLS_TO_ROLEID.
  const entries: ClsEntry[] = Array.isArray(r.entries)
    ? r.entries.map((e: any) => {
        const tpl = normTemplate(e?.template);
        if (!tpl.roleid && tpl.summary?.cls != null) {
          const fallback = CLS_TO_ROLEID[tpl.summary.cls];
          if (fallback) tpl.roleid = fallback;
        }
        return {
          source: str(e?.source),
          key_hex: str(e?.key_hex),
          version: num(e?.version),
          template: tpl,
        };
      })
    : [];

  const classes: ApiClass[] = Array.isArray(r.classes)
    ? r.classes.map(normApiClass)
    : [];

  // used_classes agora deriva apenas dos entries filtrados — ignora o que a API mandou.
  const used_classes = Array.from(new Set(entries.map((e) => e.template.summary.cls)));

  return {
    success: Boolean(r.success),
    count: entries.length,
    entries,
    classes,
    used_classes,
  };
}

export interface SavePayload {
  source: string;
  key_hex: string;
  version: number;
  /** Sempre o roleid do template (NÃO usar cls como chave). Ex.: Sacerdote (cls 7) = roleid 31. */
  roleid: number;
  template: ClsTemplate;
}

/**
 * Resolve o roleid canônico a partir do entry/template.
 * 0 NÃO é considerado válido aqui (a VPS não tem roleid 0).
 * Usa fallback via CLS_TO_ROLEID apenas se necessário — checagem explícita,
 * nunca truthy genérico (porque 0 é valor válido em outros campos).
 */
function resolveRoleid(entry: ClsEntry, template: ClsTemplate): number {
  const candidates: Array<number | undefined> = [
    template.roleid,
    entry.template.roleid,
    CLS_TO_ROLEID[template.summary?.cls],
    CLS_TO_ROLEID[template.base?.cls],
  ];
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c) && c > 0) return c;
  }
  return 0;
}

/**
 * Campos que a VPS (gamedbd) gerencia/transforma internamente e NÃO devem
 * ser sobrescritos pelo client no save completo. Ex.: `cultivation` é
 * armazenado como string nomeada ("Leal") no gamedbd, mas a API expõe como
 * número no GET — re-enviar o número causa divergência no roundtrip.
 */
const VPS_MANAGED_STATUS_FIELDS = ["cultivation", "npc_relation"] as const;

export function buildSavePayload(entry: ClsEntry, template: ClsTemplate): SavePayload {
  const roleid = resolveRoleid(entry, template);
  // Coerção explícita — Number(0) === 0 (válido). Nunca usar `if (value)`.
  const reputation = Number(template.status.reputation);

  // Preserva campos que a VPS gerencia internamente — usa o valor original
  // do entry (como veio da VPS) em vez do normalizado em memória.
  const preservedStatus = { ...template.status, reputation } as ClsTemplate["status"];
  const statusBag = preservedStatus as unknown as Record<string, unknown>;
  const originalBag = entry.template.status as unknown as Record<string, unknown>;
  for (const f of VPS_MANAGED_STATUS_FIELDS) {
    if (originalBag[f] !== undefined) statusBag[f] = originalBag[f];
  }

  // Recompute summary counters from the edited template so they stay in sync.
  const synced: ClsTemplate = {
    ...template,
    roleid,
    summary: {
      ...template.summary,
      name: template.base.name,
      cls: template.base.cls,
      race: template.base.race,
      gender: template.base.gender,
      level: template.status.level,
      level2: template.status.level2,
      cultivation: template.status.cultivation,
      reputation,
      inventory_money: template.inventory.money,
      inventory_items: template.inventory.items.filter((i) => i.id > 0).length,
      equipment_items: template.equipment.items.filter((i) => i.id > 0).length,
      storehouse_items:
        template.storehouse.items.filter((i) => i.id > 0).length +
        template.storehouse.dress.filter((i) => i.id > 0).length +
        template.storehouse.material.filter((i) => i.id > 0).length +
        template.storehouse.generalcard.filter((i) => i.id > 0).length,
    },
    status: preservedStatus,
  };
  return {
    source: entry.source,
    key_hex: entry.key_hex,
    version: entry.version,
    roleid,
    template: synced,
  };
}

/**
 * Lista canônica de campos simples de status que podem ser persistidos
 * via payload parcial. Aplica a mesma lógica de fama: 0 é válido,
 * coerção explícita com Number(), nunca `if (value)`.
 */
export const SIMPLE_STATUS_FIELDS = [
  "level",
  "level2",
  "exp",
  "sp",
  "pp",
  "hp",
  "mp",
  "reputation",
] as const;

export type SimpleStatusField = (typeof SIMPLE_STATUS_FIELDS)[number];

/**
 * Payload mínimo para salvar SOMENTE campos simples de status. Estrutura:
 *   { roleid: entry.template.roleid, status: { <field>: Number(form.status.<field>), ... } }
 *
 * 0 é valor válido — usamos hasOwnProperty + checagem explícita, nunca truthy.
 */
export interface StatusPayload {
  roleid: number;
  status: Partial<Record<SimpleStatusField, number>>;
}

export function buildStatusPayload(
  entry: ClsEntry,
  patch: Partial<Record<SimpleStatusField, number | string>>,
): StatusPayload {
  const roleid = resolveRoleid(entry, entry.template);
  const status: Partial<Record<SimpleStatusField, number>> = {};

  for (const field of SIMPLE_STATUS_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(patch, field)) continue;
    const raw = patch[field];
    // undefined/null/"" → ignorar (não foi enviado). 0 PASSA.
    if (raw === undefined || raw === null || raw === "") continue;
    const num = Number(raw);
    if (!Number.isFinite(num)) {
      throw new Error(`status.${field} inválido: ${String(raw)}`);
    }
    status[field] = num;
  }

  if (Object.keys(status).length === 0) {
    throw new Error("Nenhum campo de status válido para salvar");
  }
  return { roleid, status };
}

/**
 * Payload mínimo para salvar SOMENTE o inventário. NÃO inclui:
 *   - status.cultivation (label calculada — não editável)
 *   - status.decoded
 *   - base.class_info / base.class_name / base.class_icon / base.class_icon_path
 *   - summary
 *   - class_info
 * Se precisar enviar cultivo, enviar apenas status.level2 como número.
 */
export interface InventoryPayload {
  roleid: number;
  inventory: {
    capacity: number;
    timestamp: number;
    money: number;
    reserved6: number;
    reserved7: number;
    items: Array<{
      id: number;
      pos: number;
      count: number;
      max_count: number;
      data: string;
      proctype: number;
      expire_date: number;
      guid1: number;
      guid2: number;
      mask: number;
    }>;
  };
}

export function buildInventoryPayload(
  entry: ClsEntry,
  inventory: ClsTemplate["inventory"],
): InventoryPayload {
  const roleid = resolveRoleid(entry, entry.template);
  const inv = inventory as ClsTemplate["inventory"] & { reserved6?: number; reserved7?: number };
  return {
    roleid,
    inventory: {
      capacity: Number(inv.capacity),
      timestamp: Number(inv.timestamp ?? 0),
      money: Number(inv.money ?? 0),
      reserved6: Number(inv.reserved6 ?? 0),
      reserved7: Number(inv.reserved7 ?? 0),
      items: inv.items.map((item) => ({
        id: Number(item.id),
        pos: Number(item.pos),
        count: Number(item.count),
        max_count: Number(item.max_count),
        data: String(item.data ?? ""),
        proctype: Number(item.proctype ?? 0),
        expire_date: Number(item.expire_date ?? 0),
        guid1: Number(item.guid1 ?? 0),
        guid2: Number(item.guid2 ?? 0),
        mask: Number(item.mask ?? 0),
      })),
    },
  };
}

/** True se a única diferença entre original e current está em template.inventory. */
export function onlyInventoryChanged(
  original: ClsTemplate,
  current: ClsTemplate,
): boolean {
  const strip = (t: ClsTemplate) => ({ ...t, inventory: null });
  return JSON.stringify(strip(original)) === JSON.stringify(strip(current));
}

/** Mantido por compatibilidade. Equivalente a buildStatusPayload(entry, { reputation }). */
export interface ReputationPayload {
  roleid: number;
  status: { reputation: number };
}

export function buildReputationPayload(
  entry: ClsEntry,
  reputation: number | string,
): ReputationPayload {
  return buildStatusPayload(entry, { reputation }) as ReputationPayload;
}

/**
 * Retorna apenas os campos simples (SIMPLE_STATUS_FIELDS) que diferem.
 * Comparação estrita — 0 vs 0 não conta como mudança; 0 vs 1 conta.
 */
export function diffSimpleStatus(
  original: ClsTemplate,
  current: ClsTemplate,
): Partial<Record<SimpleStatusField, number>> {
  const out: Partial<Record<SimpleStatusField, number>> = {};
  for (const field of SIMPLE_STATUS_FIELDS) {
    const a = original.status[field];
    const b = current.status[field];
    if (a !== b) out[field] = Number(b);
  }
  return out;
}

/** True se a única diferença está em SIMPLE_STATUS_FIELDS (qualquer subconjunto). */
export function onlySimpleStatusChanged(
  original: ClsTemplate,
  current: ClsTemplate,
): boolean {
  const stripStatus = (t: ClsTemplate) => {
    const stripped: Record<string, unknown> = { ...t.status } as unknown as Record<string, unknown>;
    for (const f of SIMPLE_STATUS_FIELDS) stripped[f] = 0;
    return { ...t, status: stripped };
  };
  return JSON.stringify(stripStatus(original)) === JSON.stringify(stripStatus(current));
}

export const newEmptyItem = emptyItem;

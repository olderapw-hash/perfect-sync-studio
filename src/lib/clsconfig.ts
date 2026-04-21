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
    race: num(r.race),
    gender: num(r.gender),
  };
};

export function normalizeClsconfigResponse(raw: unknown): ClsconfigResponse {
  const r = (raw ?? {}) as Record<string, any>;
  const entries: ClsEntry[] = Array.isArray(r.entries)
    ? r.entries.map((e: any) => ({
        source: str(e?.source),
        key_hex: str(e?.key_hex),
        version: num(e?.version),
        template: normTemplate(e?.template),
      }))
    : [];

  const classes: ApiClass[] = Array.isArray(r.classes)
    ? r.classes.map(normApiClass)
    : [];

  const used_classes: number[] = Array.isArray(r.used_classes)
    ? r.used_classes.map((v: unknown) => num(v))
    : Array.from(new Set(entries.map((e) => e.template.summary.cls)));

  return {
    success: Boolean(r.success),
    count: num(r.count, entries.length),
    entries,
    classes,
    used_classes,
  };
}

export interface SavePayload {
  source: string;
  key_hex: string;
  version: number;
  template: ClsTemplate;
}

export function buildSavePayload(entry: ClsEntry, template: ClsTemplate): SavePayload {
  // Recompute summary counters from the edited template so they stay in sync.
  const synced: ClsTemplate = {
    ...template,
    summary: {
      ...template.summary,
      name: template.base.name,
      cls: template.base.cls,
      race: template.base.race,
      gender: template.base.gender,
      level: template.status.level,
      level2: template.status.level2,
      cultivation: template.status.cultivation,
      reputation: template.status.reputation,
      inventory_money: template.inventory.money,
      inventory_items: template.inventory.items.filter((i) => i.id > 0).length,
      equipment_items: template.equipment.items.filter((i) => i.id > 0).length,
      storehouse_items:
        template.storehouse.items.filter((i) => i.id > 0).length +
        template.storehouse.dress.filter((i) => i.id > 0).length +
        template.storehouse.material.filter((i) => i.id > 0).length +
        template.storehouse.generalcard.filter((i) => i.id > 0).length,
    },
  };
  return {
    source: entry.source,
    key_hex: entry.key_hex,
    version: entry.version,
    template: synced,
  };
}

export const newEmptyItem = emptyItem;

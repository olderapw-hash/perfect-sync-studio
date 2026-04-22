// Kits Iniciais por Classe — fase 1 (localStorage).
//
// Captura APENAS bens (inventory.items, equipment.items, storehouse.*,
// task.task_inventory). NUNCA captura base/status/task_data/task_complete/
// task_finishtime — isso é identidade do personagem e não deve ser tocado
// por kit inicial.
//
// Persistência: localStorage key "pw_initial_kits_v1".
import type { ClsItem, ClsTemplate } from "@/types/clsconfig";

export const KITS_STORAGE_KEY = "pw_initial_kits_v1";
export const KITS_SCHEMA_VERSION = 1;

export interface KitIncludes {
  inventory_money: boolean;
  storehouse_money: boolean;
  task_inventory: boolean;
}

export interface InitialKit {
  id: string;
  name: string;
  description: string;
  /** Classe sugerida — null = qualquer classe. */
  target_cls: number | null;
  created_at: string;
  updated_at: string;
  includes: KitIncludes;
  inventory: {
    money?: number;
    items: ClsItem[];
  };
  equipment: {
    items: ClsItem[];
  };
  storehouse: {
    money?: number;
    items: ClsItem[];
    dress: ClsItem[];
    material: ClsItem[];
    generalcard: ClsItem[];
  };
  task?: {
    task_inventory: ClsItem[];
  };
}

/** Modo de aplicação do kit ao template. */
export type ApplyMode =
  | "replace_section" // substitui a seção inteira pelo conteúdo do kit
  | "merge_empty"     // só preenche slots vazios (id=0) do template
  | "replace_conflict"; // mantém slots existentes, exceto onde houver pos conflitante (kit vence)

// ─────────────────────────── helpers ───────────────────────────

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

const newId = () =>
  `kit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const isItem = (v: unknown): v is ClsItem => {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "number" &&
    typeof o.pos === "number" &&
    typeof o.count === "number"
  );
};

const sanitizeItems = (raw: unknown): ClsItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isItem).map((it) => clone(it));
};

/** Conta itens preenchidos (id > 0) num kit. */
export function countKitItems(kit: InitialKit): number {
  let n = 0;
  n += kit.inventory.items.filter((i) => i.id > 0).length;
  n += kit.equipment.items.filter((i) => i.id > 0).length;
  n += kit.storehouse.items.filter((i) => i.id > 0).length;
  n += kit.storehouse.dress.filter((i) => i.id > 0).length;
  n += kit.storehouse.material.filter((i) => i.id > 0).length;
  n += kit.storehouse.generalcard.filter((i) => i.id > 0).length;
  if (kit.task) {
    n += kit.task.task_inventory.filter((i) => i.id > 0).length;
  }
  return n;
}

// ─────────────────────────── store ───────────────────────────

function readAll(): InitialKit[] {
  try {
    const raw = localStorage.getItem(KITS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidKit);
  } catch {
    return [];
  }
}

function writeAll(list: InitialKit[]) {
  try {
    localStorage.setItem(KITS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("[initialKits] failed to write", e);
  }
}

/** Valida o shape mínimo de um objeto recebido (storage ou import). */
export function isValidKit(v: unknown): v is InitialKit {
  if (!v || typeof v !== "object") return false;
  const k = v as Partial<InitialKit>;
  if (typeof k.id !== "string" || !k.id) return false;
  if (typeof k.name !== "string") return false;
  if (k.target_cls !== null && typeof k.target_cls !== "number") return false;
  if (!k.includes || typeof k.includes !== "object") return false;
  if (!k.inventory || !Array.isArray(k.inventory.items)) return false;
  if (!k.equipment || !Array.isArray(k.equipment.items)) return false;
  if (!k.storehouse) return false;
  const sh = k.storehouse;
  if (
    !Array.isArray(sh.items) ||
    !Array.isArray(sh.dress) ||
    !Array.isArray(sh.material) ||
    !Array.isArray(sh.generalcard)
  ) {
    return false;
  }
  return true;
}

export const kitStore = {
  list(): InitialKit[] {
    return readAll();
  },

  get(id: string): InitialKit | null {
    return readAll().find((k) => k.id === id) ?? null;
  },

  save(kit: InitialKit) {
    const list = readAll();
    const idx = list.findIndex((k) => k.id === kit.id);
    if (idx >= 0) list[idx] = kit;
    else list.unshift(kit);
    writeAll(list);
  },

  remove(id: string) {
    writeAll(readAll().filter((k) => k.id !== id));
  },

  duplicate(id: string): InitialKit | null {
    const orig = readAll().find((k) => k.id === id);
    if (!orig) return null;
    const copy: InitialKit = {
      ...clone(orig),
      id: newId(),
      name: `${orig.name} (cópia)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const list = readAll();
    list.unshift(copy);
    writeAll(list);
    return copy;
  },
};

// ─────────────────────────── criação ───────────────────────────

export interface CreateKitInput {
  name: string;
  description: string;
  target_cls: number | null;
  includes: KitIncludes;
  template: ClsTemplate;
}

export function createKitFromTemplate(input: CreateKitInput): InitialKit {
  const { template, includes } = input;
  const now = new Date().toISOString();

  const taskInv =
    includes.task_inventory && template.task?.task_inventory
      ? clone(template.task.task_inventory)
      : null;

  const kit: InitialKit = {
    id: newId(),
    name: input.name.trim() || `Kit ${new Date().toLocaleString()}`,
    description: input.description.trim(),
    target_cls: input.target_cls,
    created_at: now,
    updated_at: now,
    includes: { ...includes },
    inventory: {
      items: clone(template.inventory.items),
      ...(includes.inventory_money
        ? { money: Number(template.inventory.money) || 0 }
        : {}),
    },
    equipment: {
      items: clone(template.equipment.items),
    },
    storehouse: {
      items: clone(template.storehouse.items),
      dress: clone(template.storehouse.dress),
      material: clone(template.storehouse.material),
      generalcard: clone(template.storehouse.generalcard),
      ...(includes.storehouse_money
        ? { money: Number(template.storehouse.money) || 0 }
        : {}),
    },
    ...(taskInv ? { task: { task_inventory: taskInv } } : {}),
  };

  return kit;
}

// ─────────────────────────── apply ───────────────────────────

/**
 * Mescla duas listas de itens conforme o modo escolhido.
 *
 * - replace_section: ignora `target`, retorna `kit` clonado.
 * - merge_empty: parte de `target`; para cada item do kit, só substitui se
 *   o slot na mesma `pos` no target estiver vazio (id=0) ou ausente.
 * - replace_conflict: parte de `target`; para cada item do kit, sobrescreve
 *   o slot na mesma `pos` independente do conteúdo (kit vence em conflitos),
 *   mas mantém slots do target em posições não tocadas pelo kit.
 */
function mergeItems(target: ClsItem[], kit: ClsItem[], mode: ApplyMode): ClsItem[] {
  if (mode === "replace_section") return clone(kit);

  const out: ClsItem[] = clone(target);
  const byPos = new Map<number, number>(); // pos → index in out
  out.forEach((it, idx) => byPos.set(it.pos, idx));

  for (const kitItem of kit) {
    if (kitItem.id === 0) continue; // kit slot vazio — ignora
    const existingIdx = byPos.get(kitItem.pos);
    if (existingIdx === undefined) {
      out.push(clone(kitItem));
      byPos.set(kitItem.pos, out.length - 1);
      continue;
    }
    const existing = out[existingIdx];
    if (mode === "merge_empty") {
      if (existing.id === 0) {
        out[existingIdx] = clone(kitItem);
      }
    } else if (mode === "replace_conflict") {
      out[existingIdx] = clone(kitItem);
    }
  }

  // Mantém ordem por pos (estável).
  out.sort((a, b) => a.pos - b.pos);
  return out;
}

export interface ApplyKitOptions {
  mode: ApplyMode;
}

/**
 * Aplica um kit a um template, devolvendo um NOVO template. Não muta `target`.
 *
 * Identidade preservada (NUNCA tocada): roleid, base, status, summary cls/race/
 * gender, task.task_data, task.task_complete, task.task_finishtime.
 *
 * Atualiza `summary.inventory_money` e `summary.inventory_items` para refletir
 * o novo estado pós-apply (mantém consistência visual).
 */
export function applyKitToTemplate(
  target: ClsTemplate,
  kit: InitialKit,
  opts: ApplyKitOptions,
): ClsTemplate {
  const next: ClsTemplate = clone(target);

  next.inventory.items = mergeItems(target.inventory.items, kit.inventory.items, opts.mode);
  next.equipment.items = mergeItems(target.equipment.items, kit.equipment.items, opts.mode);
  next.storehouse.items = mergeItems(target.storehouse.items, kit.storehouse.items, opts.mode);
  next.storehouse.dress = mergeItems(target.storehouse.dress, kit.storehouse.dress, opts.mode);
  next.storehouse.material = mergeItems(
    target.storehouse.material,
    kit.storehouse.material,
    opts.mode,
  );
  next.storehouse.generalcard = mergeItems(
    target.storehouse.generalcard,
    kit.storehouse.generalcard,
    opts.mode,
  );

  if (kit.includes.inventory_money && typeof kit.inventory.money === "number") {
    next.inventory.money = kit.inventory.money;
  }
  if (kit.includes.storehouse_money && typeof kit.storehouse.money === "number") {
    next.storehouse.money = kit.storehouse.money;
  }

  if (kit.includes.task_inventory && kit.task?.task_inventory) {
    if (!next.task) {
      // Cria bloco mínimo só com task_inventory; campos opacos ficam vazios.
      next.task = {
        task_data: target.task?.task_data ?? "",
        task_complete: target.task?.task_complete ?? "",
        task_finishtime: target.task?.task_finishtime ?? "",
        task_inventory: [],
      };
    }
    next.task.task_inventory = mergeItems(
      next.task.task_inventory,
      kit.task.task_inventory,
      opts.mode,
    );
  }

  // Sync de contadores no summary (mesma convenção do buildSavePayload).
  next.summary = {
    ...next.summary,
    inventory_money: next.inventory.money,
    inventory_items: next.inventory.items.filter((i) => i.id > 0).length,
    equipment_items: next.equipment.items.filter((i) => i.id > 0).length,
    storehouse_items:
      next.storehouse.items.filter((i) => i.id > 0).length +
      next.storehouse.dress.filter((i) => i.id > 0).length +
      next.storehouse.material.filter((i) => i.id > 0).length +
      next.storehouse.generalcard.filter((i) => i.id > 0).length,
  };

  return next;
}

// ─────────────────────────── bulk apply payload ───────────────────────────

/**
 * Payload mínimo para aplicar um kit num roleid sem enviar base/status.
 *
 * Inclui APENAS as seções afetadas pelo kit. `inventory.money` e
 * `storehouse.money` só vão se o kit declarar inclusão. `task.task_inventory`
 * só vai se incluído. Dessa forma a VPS não toca em base/status nem nos
 * blobs opacos task_data/task_complete/task_finishtime.
 */
export interface KitBulkPayload {
  roleid: number;
  inventory: {
    items: ClsItem[];
    money?: number;
  };
  equipment: {
    items: ClsItem[];
  };
  storehouse: {
    items: ClsItem[];
    dress: ClsItem[];
    material: ClsItem[];
    generalcard: ClsItem[];
    money?: number;
  };
  task?: {
    task_inventory: ClsItem[];
  };
}

/**
 * Constrói o payload mínimo a ser enviado para `clsconfig-proxy/clsconfig`
 * a partir de um template já com o kit aplicado.
 *
 * Importante: o template recebido aqui DEVE ser o resultado de
 * `applyKitToTemplate(target, kit, opts)` — assim a função simplesmente
 * extrai as seções relevantes em formato cru.
 */
export function buildKitBulkPayload(
  roleid: number,
  appliedTemplate: ClsTemplate,
  kit: InitialKit,
): KitBulkPayload {
  const out: KitBulkPayload = {
    roleid,
    inventory: {
      items: clone(appliedTemplate.inventory.items),
    },
    equipment: {
      items: clone(appliedTemplate.equipment.items),
    },
    storehouse: {
      items: clone(appliedTemplate.storehouse.items),
      dress: clone(appliedTemplate.storehouse.dress),
      material: clone(appliedTemplate.storehouse.material),
      generalcard: clone(appliedTemplate.storehouse.generalcard),
    },
  };
  if (kit.includes.inventory_money) {
    out.inventory.money = Number(appliedTemplate.inventory.money) || 0;
  }
  if (kit.includes.storehouse_money) {
    out.storehouse.money = Number(appliedTemplate.storehouse.money) || 0;
  }
  if (kit.includes.task_inventory && appliedTemplate.task?.task_inventory) {
    out.task = {
      task_inventory: clone(appliedTemplate.task.task_inventory),
    };
  }
  return out;
}

// ─────────────────────────── import / export ───────────────────────────

export interface KitExportFile {
  schema: "pw_initial_kit";
  version: number;
  exported_at: string;
  kit: InitialKit;
}

export function exportKitToJson(kit: InitialKit): string {
  const file: KitExportFile = {
    schema: "pw_initial_kit",
    version: KITS_SCHEMA_VERSION,
    exported_at: new Date().toISOString(),
    kit,
  };
  return JSON.stringify(file, null, 2);
}

/**
 * Lê um JSON exportado OU um kit cru. Sempre retorna um novo `id` para evitar
 * duplicatas. Lança Error com mensagem amigável se o schema for inválido.
 */
export function parseKitFromJson(raw: string): InitialKit {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("JSON inválido");
  }

  // Aceita tanto { schema, version, kit } quanto kit cru.
  let kitRaw: unknown = parsed;
  if (
    parsed &&
    typeof parsed === "object" &&
    "kit" in (parsed as Record<string, unknown>)
  ) {
    kitRaw = (parsed as { kit: unknown }).kit;
  }

  if (!isValidKit(kitRaw)) {
    throw new Error("Arquivo não contém um kit válido (schema mínimo não confere)");
  }

  // Sanitiza listas + força novo id pra evitar colisão.
  const cleaned: InitialKit = {
    ...kitRaw,
    id: newId(),
    name: kitRaw.name?.trim() || "Kit importado",
    description: typeof kitRaw.description === "string" ? kitRaw.description : "",
    target_cls:
      kitRaw.target_cls === null || typeof kitRaw.target_cls === "number"
        ? kitRaw.target_cls
        : null,
    created_at: kitRaw.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    includes: {
      inventory_money: Boolean(kitRaw.includes?.inventory_money),
      storehouse_money: Boolean(kitRaw.includes?.storehouse_money),
      task_inventory: Boolean(kitRaw.includes?.task_inventory),
    },
    inventory: {
      items: sanitizeItems(kitRaw.inventory?.items),
      ...(typeof kitRaw.inventory?.money === "number"
        ? { money: kitRaw.inventory.money }
        : {}),
    },
    equipment: {
      items: sanitizeItems(kitRaw.equipment?.items),
    },
    storehouse: {
      items: sanitizeItems(kitRaw.storehouse?.items),
      dress: sanitizeItems(kitRaw.storehouse?.dress),
      material: sanitizeItems(kitRaw.storehouse?.material),
      generalcard: sanitizeItems(kitRaw.storehouse?.generalcard),
      ...(typeof kitRaw.storehouse?.money === "number"
        ? { money: kitRaw.storehouse.money }
        : {}),
    },
    ...(kitRaw.task?.task_inventory
      ? { task: { task_inventory: sanitizeItems(kitRaw.task.task_inventory) } }
      : {}),
  };

  return cleaned;
}

/** Dispara download de um kit como arquivo .json no navegador. */
export function downloadKitJson(kit: InitialKit) {
  const json = exportKitToJson(kit);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = kit.name.replace(/[^a-z0-9_-]+/gi, "_").slice(0, 60) || "kit";
  a.href = url;
  a.download = `${safeName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

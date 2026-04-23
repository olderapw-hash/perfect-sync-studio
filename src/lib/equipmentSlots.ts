// Mapeamento real dos slots de equipamento do Perfect World.
//
// Essa tabela é usada APENAS para UX/validação (label, ícone, ordenação).
// O payload salvo continua sendo apenas { pos, id, count, ... } — não
// persistimos `key`/`label`/`category`. Se um slot vier com pos desconhecido,
// a UI mostra "Slot desconhecido (pos X)" sem quebrar.
//
// Importante: a numeração dos slots aqui segue a configuração padrão do PW BR
// fornecida pelo produto. Servidores customizados podem ter outro layout —
// nesse caso, é só editar este arquivo (fonte única de verdade).

export type EquipmentSlotCategory =
  | "weapon"
  | "armor"
  | "accessory"
  | "consumable"
  | "special";

export type EquipmentSlotDef = {
  pos: number;
  key: string;
  label: string;
  shortLabel: string;
  category: EquipmentSlotCategory;
  /** True quando o slot é considerado obrigatório no equip básico. */
  required?: boolean;
  /** Categorias de item que o slot aceita (livre — pra futuras validações). */
  accepts?: string[];
};

export const PW_EQUIPMENT_SLOTS: EquipmentSlotDef[] = [
  { pos: 0,  key: "weapon",     label: "Arma",            shortLabel: "Arma",     category: "weapon",     required: true },
  { pos: 1,  key: "helmet",     label: "Elmo",            shortLabel: "Elmo",     category: "armor" },
  { pos: 2,  key: "cape",       label: "Manto",           shortLabel: "Manto",    category: "armor" },
  { pos: 3,  key: "necklace",   label: "Colar",           shortLabel: "Colar",    category: "accessory" },
  { pos: 4,  key: "armor",      label: "Armadura",        shortLabel: "Armadura", category: "armor",      required: true },
  { pos: 5,  key: "belt",       label: "Cinto",           shortLabel: "Cinto",    category: "accessory" },
  { pos: 6,  key: "pants",      label: "Calças",          shortLabel: "Calças",   category: "armor" },
  { pos: 7,  key: "boots",      label: "Botas",           shortLabel: "Botas",    category: "armor" },
  { pos: 8,  key: "bracers",    label: "Braçadeiras",     shortLabel: "Braç.",    category: "armor" },
  { pos: 9,  key: "ring_left",  label: "Anel Esq.",       shortLabel: "Anel E.",  category: "accessory" },
  { pos: 10, key: "ring_right", label: "Anel Dir.",       shortLabel: "Anel D.",  category: "accessory" },
  { pos: 11, key: "ammo",       label: "Munição",         shortLabel: "Munição",  category: "consumable" },
  { pos: 12, key: "flyer",      label: "Voo/Montaria",    shortLabel: "Voo",      category: "special" },
  { pos: 13, key: "hp_charm",   label: "Hierograma HP",   shortLabel: "Hiero HP", category: "consumable" },
  { pos: 14, key: "mp_charm",   label: "Hierograma MP",   shortLabel: "Hiero MP", category: "consumable" },
  { pos: 15, key: "tome",       label: "Tomo",            shortLabel: "Tomo",     category: "special" },
  { pos: 16, key: "rune",       label: "Runa",            shortLabel: "Runa",     category: "special" },
  { pos: 17, key: "class_item", label: "Classe",          shortLabel: "Classe",   category: "special" },
  { pos: 18, key: "amulet",     label: "Amuleto",         shortLabel: "Amuleto",  category: "accessory" },
];

const BY_POS = new Map<number, EquipmentSlotDef>(
  PW_EQUIPMENT_SLOTS.map((s) => [s.pos, s]),
);
const BY_KEY = new Map<string, EquipmentSlotDef>(
  PW_EQUIPMENT_SLOTS.map((s) => [s.key, s]),
);

/** Devolve a definição completa do slot, ou undefined se a pos não é mapeada. */
export function getEquipmentSlotDef(pos: number): EquipmentSlotDef | undefined {
  if (!Number.isFinite(pos)) return undefined;
  return BY_POS.get(pos);
}

export function getEquipmentSlotDefByKey(key: string): EquipmentSlotDef | undefined {
  return BY_KEY.get(key);
}

/**
 * Devolve o label legível do slot. Se a pos não tem mapeamento, devolve
 * "Slot desconhecido (pos X)" — nunca lança/quebra a UI.
 */
export function getEquipmentSlotLabel(pos: number, opts?: { short?: boolean }): string {
  const def = getEquipmentSlotDef(pos);
  if (!def) return `Slot desconhecido (pos ${Number.isFinite(pos) ? pos : "?"})`;
  return opts?.short ? def.shortLabel : def.label;
}

/**
 * Ordena uma lista de itens de equipamento pela ordem definida em
 * PW_EQUIPMENT_SLOTS. Itens com pos desconhecido vão pro final, mantendo
 * estabilidade (ordem original entre desconhecidos).
 */
export function sortEquipmentBySlot<T extends { pos: number }>(items: T[]): T[] {
  const orderIndex = new Map<number, number>(
    PW_EQUIPMENT_SLOTS.map((s, i) => [s.pos, i]),
  );
  return [...items]
    .map((it, idx) => ({ it, idx }))
    .sort((a, b) => {
      const ai = orderIndex.get(a.it.pos);
      const bi = orderIndex.get(b.it.pos);
      if (ai != null && bi != null) return ai - bi;
      if (ai != null) return -1;
      if (bi != null) return 1;
      // ambos desconhecidos → mantém ordem original e desempata por pos
      const byPos = (a.it.pos || 0) - (b.it.pos || 0);
      return byPos !== 0 ? byPos : a.idx - b.idx;
    })
    .map(({ it }) => it);
}

/**
 * Garante que cada item recebido tenha pos íntegro. Não cria slots vazios
 * automaticamente — só normaliza pos para número e remove duplicatas
 * mantendo o primeiro ocorrente (último vence quando pos repete e o segundo
 * tem id>0 e o primeiro tem id==0).
 */
export function normalizeEquipmentSlots<T extends { pos: number; id: number }>(
  items: T[],
): T[] {
  const out = new Map<number, T>();
  for (const raw of items) {
    const pos = Number.isFinite(raw?.pos) ? Math.trunc(raw.pos) : -1;
    if (pos < 0) continue;
    const next = { ...raw, pos };
    const prev = out.get(pos);
    if (!prev) {
      out.set(pos, next);
      continue;
    }
    // Conflito de pos: prefere o que tem id > 0 (slot real ocupado).
    const prevHasItem = (prev.id ?? 0) > 0;
    const nextHasItem = (next.id ?? 0) > 0;
    if (!prevHasItem && nextHasItem) out.set(pos, next);
  }
  return Array.from(out.values()).sort((a, b) => a.pos - b.pos);
}

/** Helper: lista de pos conhecidas. Útil pra dropdowns/autocomplete. */
export const KNOWN_EQUIPMENT_POS: number[] = PW_EQUIPMENT_SLOTS.map((s) => s.pos);

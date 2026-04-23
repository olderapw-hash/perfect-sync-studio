// Mapeamento real dos slots de equipamento do Perfect World.
//
// Fonte única para UX/validação: cada slot tem label, ordem visual e
// categoria. O payload salvo NÃO usa `key`/`label`/`category` — só a `pos`
// numérica é persistida. Slots com `pos` desconhecida nunca são apagados:
// a UI mostra "Slot desconhecido (pos X)" e o validator emite warning.
//
// Importante: a numeração aqui segue o roleid 1024 full-equipado da
// referência interna. Servidores customizados podem ter outro layout —
// nesse caso, basta editar este arquivo (fonte única de verdade).

export type EquipmentSlotCategory =
  | "weapon"
  | "armor"
  | "accessory"
  | "consumable"
  | "special"
  | "avatar";

export type EquipmentSlotDef = {
  pos: number;
  key: string;
  label: string;
  shortLabel: string;
  category: EquipmentSlotCategory;
  /** Ordem visual no paper-doll/lists. Não é igual a `pos`. */
  visualOrder: number;
  /** Observação opcional (ex: "slot especial detectado em servidor X"). */
  note?: string;
};

export const PW_EQUIPMENT_SLOTS: EquipmentSlotDef[] = [
  { pos: 0,  key: "weapon",     label: "Arma",            shortLabel: "Arma",     category: "weapon",     visualOrder: 10 },
  { pos: 1,  key: "helmet",     label: "Elmo",            shortLabel: "Elmo",     category: "armor",      visualOrder: 1 },
  { pos: 2,  key: "necklace",   label: "Colar",           shortLabel: "Colar",    category: "accessory",  visualOrder: 4 },
  { pos: 3,  key: "cape",       label: "Manto",           shortLabel: "Manto",    category: "armor",      visualOrder: 2 },
  { pos: 4,  key: "armor",      label: "Armadura",        shortLabel: "Armad.",   category: "armor",      visualOrder: 3 },
  { pos: 5,  key: "belt",       label: "Cinto",           shortLabel: "Cinto",    category: "accessory",  visualOrder: 11 },
  { pos: 6,  key: "pants",      label: "Calças",          shortLabel: "Calças",   category: "armor",      visualOrder: 12 },
  { pos: 7,  key: "boots",      label: "Botas",           shortLabel: "Botas",    category: "armor",      visualOrder: 13 },
  { pos: 8,  key: "bracers",    label: "Braçadeiras",     shortLabel: "Braç.",    category: "armor",      visualOrder: 8 },
  { pos: 9,  key: "ring_left",  label: "Anel Esq.",       shortLabel: "Anel E.",  category: "accessory",  visualOrder: 7 },
  { pos: 10, key: "ring_right", label: "Anel Dir.",       shortLabel: "Anel D.",  category: "accessory",  visualOrder: 14 },
  { pos: 11, key: "ammo",       label: "Munição",         shortLabel: "Munição",  category: "consumable", visualOrder: 18 },
  { pos: 12, key: "flyer",      label: "Voo / Montaria",  shortLabel: "Voo",      category: "special",    visualOrder: 19 },
  { pos: 13, key: "hp_charm",   label: "Amuleto HP",      shortLabel: "Amul. HP", category: "consumable", visualOrder: 20 },
  { pos: 14, key: "mp_charm",   label: "Amuleto MP",      shortLabel: "Amul. MP", category: "consumable", visualOrder: 21 },
  { pos: 15, key: "tome",       label: "Tomo",            shortLabel: "Tomo",     category: "special",    visualOrder: 17 },
  { pos: 19, key: "fashion_1",  label: "Roupa 1",         shortLabel: "Roupa 1",  category: "avatar",     visualOrder: 22 },
  { pos: 20, key: "fashion_2",  label: "Roupa 2",         shortLabel: "Roupa 2",  category: "avatar",     visualOrder: 23 },
  { pos: 26, key: "special_26", label: "Especial 26",     shortLabel: "Esp. 26",  category: "special",    visualOrder: 26, note: "Slot especial — preservado mas sem nome canônico." },
  { pos: 29, key: "special_29", label: "Especial 29",     shortLabel: "Esp. 29",  category: "special",    visualOrder: 29, note: "Slot especial — preservado mas sem nome canônico." },
  { pos: 32, key: "avatar_1",   label: "Carta / Avatar 1",shortLabel: "Avatar 1", category: "avatar",     visualOrder: 32 },
  { pos: 33, key: "avatar_2",   label: "Carta / Avatar 2",shortLabel: "Avatar 2", category: "avatar",     visualOrder: 33 },
];

const BY_POS = new Map<number, EquipmentSlotDef>(
  PW_EQUIPMENT_SLOTS.map((s) => [s.pos, s]),
);
const BY_KEY = new Map<string, EquipmentSlotDef>(
  PW_EQUIPMENT_SLOTS.map((s) => [s.key, s]),
);

/** Devolve a definição completa do slot, ou undefined se a pos não é mapeada. */
export function getEquipmentSlotDef(pos: number): EquipmentSlotDef | undefined {
  const n = Number(pos);
  if (!Number.isFinite(n)) return undefined;
  return BY_POS.get(n);
}

export function getEquipmentSlotDefByKey(key: string): EquipmentSlotDef | undefined {
  return BY_KEY.get(key);
}

/**
 * Devolve o label legível do slot. Se a pos não tem mapeamento, devolve
 * "Slot desconhecido (pos X)" — nunca lança/quebra a UI.
 */
export function getEquipmentSlotLabel(
  pos: number,
  opts?: { short?: boolean },
): string {
  const def = getEquipmentSlotDef(pos);
  if (!def) {
    const display = Number.isFinite(pos) ? pos : "?";
    return `Slot desconhecido (pos ${display})`;
  }
  return opts?.short ? def.shortLabel : def.label;
}

/**
 * Ordena uma lista de itens por `visualOrder` do slot. Itens com pos
 * desconhecida vão pro final, mantendo estabilidade (ordem original
 * preservada entre desconhecidos).
 */
export function sortEquipmentBySlot<T extends { pos?: number }>(items: T[]): T[] {
  return [...items]
    .map((it, idx) => ({ it, idx }))
    .sort((a, b) => {
      const aDef = getEquipmentSlotDef(Number(a.it.pos));
      const bDef = getEquipmentSlotDef(Number(b.it.pos));
      const ao = aDef?.visualOrder ?? Number(a.it.pos ?? 9999) + 9999;
      const bo = bDef?.visualOrder ?? Number(b.it.pos ?? 9999) + 9999;
      if (ao !== bo) return ao - bo;
      return a.idx - b.idx;
    })
    .map(({ it }) => it);
}

/**
 * Garante que cada item recebido tenha pos íntegro. Não cria slots vazios
 * automaticamente — só normaliza pos para número e remove duplicatas
 * mantendo o que tem id>0. NUNCA descarta slots com pos desconhecida.
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
    const prevHasItem = (prev.id ?? 0) > 0;
    const nextHasItem = (next.id ?? 0) > 0;
    if (!prevHasItem && nextHasItem) out.set(pos, next);
  }
  return Array.from(out.values()).sort((a, b) => a.pos - b.pos);
}

/** Lista de pos conhecidas. Útil pra dropdowns/autocomplete. */
export function getKnownEquipmentPositions(): number[] {
  return PW_EQUIPMENT_SLOTS.map((s) => s.pos);
}

/** Backwards-compat: alias de `getKnownEquipmentPositions()`. */
export const KNOWN_EQUIPMENT_POS: number[] = getKnownEquipmentPositions();

/** True se a pos faz parte do mapeamento canônico. */
export function isKnownEquipmentPos(pos: number): boolean {
  return BY_POS.has(Number(pos));
}

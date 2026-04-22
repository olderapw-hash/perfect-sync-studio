// Helpers puros para "Limpar Seção" — não tocam no payload final, só
// transformam estado local. O salvamento real (e o backup automático)
// continua acontecendo no fluxo normal de Save.
import type { ClsItem } from "@/types/clsconfig";

export type SectionKey =
  | "inventory.items"
  | "equipment.items"
  | "storehouse.items"
  | "storehouse.dress"
  | "storehouse.material"
  | "storehouse.generalcard"
  | "task.task_inventory";

export const SECTION_LABELS: Record<SectionKey, string> = {
  "inventory.items": "Inventário",
  "equipment.items": "Equipamentos",
  "storehouse.items": "Baú · Itens",
  "storehouse.dress": "Baú · Roupas",
  "storehouse.material": "Baú · Material",
  "storehouse.generalcard": "Baú · Cartas",
  "task.task_inventory": "Task · Inventário",
};

/** Seções que possuem dinheiro associado (campo `money`). */
export const SECTIONS_WITH_MONEY: SectionKey[] = ["inventory.items", "storehouse.items"];

export interface SectionPreview {
  /** Quantos slots têm item (id > 0). */
  filledSlots: number;
  /** Quantos slots existem no array (limit visual). */
  totalSlots: number;
  /** Capacidade declarada (preservada). 0 quando não aplicável. */
  capacity: number;
  /** Dinheiro atual (0 quando seção não tem dinheiro). */
  money: number;
  /** Se a seção possui campo de dinheiro. */
  hasMoney: boolean;
}

export function summarizeSection(
  items: ClsItem[],
  opts: { capacity?: number; money?: number; hasMoney: boolean },
): SectionPreview {
  const filledSlots = items.reduce((n, it) => (it.id > 0 ? n + 1 : n), 0);
  return {
    filledSlots,
    totalSlots: items.length,
    capacity: opts.capacity ?? 0,
    money: opts.money ?? 0,
    hasMoney: opts.hasMoney,
  };
}

/**
 * Esvazia todos os slots, preservando apenas a `pos` original. Os campos
 * seguem exatamente o "slot vazio" descrito pelo PHP (id=0, count=0, etc).
 */
export function clearItems(items: ClsItem[]): ClsItem[] {
  return items.map((it) => ({
    id: 0,
    pos: it.pos,
    count: 0,
    max_count: 0,
    data: "",
    proctype: 0,
    expire_date: 0,
    guid1: 0,
    guid2: 0,
    mask: 0,
  }));
}

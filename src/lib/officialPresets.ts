// Biblioteca de presets oficiais para Kits Iniciais.
//
// Read-only. Não pertencem a tenant nenhum. Não podem ser aplicados
// diretamente — o usuário precisa duplicar para o servidor (ou privado),
// e a partir daí editar/aplicar como qualquer kit normal.
//
// Payload mínimo e seguro: APENAS bens (inventory, equipment, storehouse,
// task.task_inventory). NUNCA inclui base/status/cls/race/gender/name/
// roleid/task_data/task_complete/task_finishtime.
//
// Os IDs de item usados são placeholders (id=0 = slot vazio reservado)
// para garantir que o preset seja "estrutural": o usuário materializa,
// duplica para o servidor dele e personaliza com IDs reais do catálogo.

import type { ClsItem } from "@/types/clsconfig";
import type { InitialKit, KitIncludes } from "./initialKits";

/** Foco/categoria do preset, usado pra colorir badge e filtrar. */
export type PresetFocus = "leveling" | "farm" | "pvp" | "clear";

export interface OfficialPreset {
  /** Id estável (slug) — não é UUID, não persiste em banco. */
  id: string;
  name: string;
  description: string;
  focus: PresetFocus;
  /** Classe alvo sugerida (null = qualquer). */
  target_cls: number | null;
  includes: KitIncludes;
  inventory: { money?: number; items: ClsItem[] };
  equipment: { items: ClsItem[] };
  storehouse: {
    money?: number;
    items: ClsItem[];
    dress: ClsItem[];
    material: ClsItem[];
    generalcard: ClsItem[];
  };
  task?: { task_inventory: ClsItem[] };
}

/** Helper pra montar um item placeholder. id=0 = slot reservado vazio. */
const slot = (pos: number, id = 0, count = 0): ClsItem => ({
  id,
  pos,
  count,
  max_count: 0,
  data: "",
  proctype: 0,
  expire_date: 0,
  guid1: 0,
  guid2: 0,
  mask: 0,
});

/** Gera N slots vazios sequenciais. */
const emptySlots = (n: number): ClsItem[] =>
  Array.from({ length: n }, (_, i) => slot(i));

const NO_INCLUDES: KitIncludes = {
  inventory_money: false,
  storehouse_money: false,
  task_inventory: false,
};

const MONEY_INV: KitIncludes = {
  inventory_money: true,
  storehouse_money: false,
  task_inventory: false,
};

// ─────────────────────────── presets ───────────────────────────

export const OFFICIAL_PRESETS: OfficialPreset[] = [
  {
    id: "level-1-basico",
    name: "Level 1 Básico",
    description:
      "Kit inicial mínimo para personagens recém-criados. Reserva slots de inventário e equipamento, com pequena quantia de dinheiro inicial.",
    focus: "leveling",
    target_cls: null,
    includes: { ...MONEY_INV },
    inventory: {
      money: 100000, // 10 silver
      items: emptySlots(32),
    },
    equipment: { items: emptySlots(20) },
    storehouse: {
      items: emptySlots(16),
      dress: emptySlots(8),
      material: emptySlots(8),
      generalcard: emptySlots(8),
    },
  },
  {
    id: "level-105-basico",
    name: "Level 105 Básico",
    description:
      "Estrutura para personagem de nível 105 — mais slots reservados, dinheiro intermediário, baú expandido. Use como base e adicione equipamentos da sua build.",
    focus: "leveling",
    target_cls: null,
    includes: { ...MONEY_INV, storehouse_money: true },
    inventory: {
      money: 5000000, // 5 gold
      items: emptySlots(48),
    },
    equipment: { items: emptySlots(20) },
    storehouse: {
      money: 10000000,
      items: emptySlots(32),
      dress: emptySlots(16),
      material: emptySlots(16),
      generalcard: emptySlots(16),
    },
  },
  {
    id: "starter-farm",
    name: "Starter Farm",
    description:
      "Setup voltado para farm contínuo: muitos slots de inventário e baú/material para acumular drops. Sem foco em equip top-tier.",
    focus: "farm",
    target_cls: null,
    includes: { ...MONEY_INV, storehouse_money: true },
    inventory: {
      money: 2000000,
      items: emptySlots(64),
    },
    equipment: { items: emptySlots(20) },
    storehouse: {
      money: 5000000,
      items: emptySlots(48),
      dress: emptySlots(8),
      material: emptySlots(48),
      generalcard: emptySlots(16),
    },
  },
  {
    id: "starter-pvp",
    name: "Starter PvP",
    description:
      "Estrutura voltada para PvP: slots de equipamento todos reservados, inventário com espaço para consumíveis, baú compacto.",
    focus: "pvp",
    target_cls: null,
    includes: { ...MONEY_INV },
    inventory: {
      money: 3000000,
      items: emptySlots(48),
    },
    equipment: { items: emptySlots(20) },
    storehouse: {
      items: emptySlots(16),
      dress: emptySlots(16),
      material: emptySlots(8),
      generalcard: emptySlots(8),
    },
  },
  {
    id: "inventario-limpo",
    name: "Inventário Limpo",
    description:
      "Reseta apenas o inventário (todos slots vazios). Aplique com modo 'Substituir seções inteiras' para limpar inventário sem mexer em equip/baú.",
    focus: "clear",
    target_cls: null,
    includes: NO_INCLUDES,
    inventory: { items: emptySlots(64) },
    equipment: { items: [] },
    storehouse: {
      items: [],
      dress: [],
      material: [],
      generalcard: [],
    },
  },
  {
    id: "equipamentos-limpos",
    name: "Equipamentos Limpos",
    description:
      "Reseta apenas os equipamentos (todos slots vazios). Aplique com modo 'Substituir seções inteiras' para desequipar tudo.",
    focus: "clear",
    target_cls: null,
    includes: NO_INCLUDES,
    inventory: { items: [] },
    equipment: { items: emptySlots(20) },
    storehouse: {
      items: [],
      dress: [],
      material: [],
      generalcard: [],
    },
  },
  {
    id: "bau-limpo",
    name: "Baú Limpo",
    description:
      "Reseta apenas o baú (items, dress, material, generalcard). Aplique com modo 'Substituir seções inteiras' para esvaziar o baú.",
    focus: "clear",
    target_cls: null,
    includes: NO_INCLUDES,
    inventory: { items: [] },
    equipment: { items: [] },
    storehouse: {
      items: emptySlots(64),
      dress: emptySlots(16),
      material: emptySlots(16),
      generalcard: emptySlots(16),
    },
  },
];

/** Conta itens preenchidos (id > 0) num preset — coerente com countKitItems. */
export function countPresetItems(p: OfficialPreset): number {
  let n = 0;
  n += p.inventory.items.filter((i) => i.id > 0).length;
  n += p.equipment.items.filter((i) => i.id > 0).length;
  n += p.storehouse.items.filter((i) => i.id > 0).length;
  n += p.storehouse.dress.filter((i) => i.id > 0).length;
  n += p.storehouse.material.filter((i) => i.id > 0).length;
  n += p.storehouse.generalcard.filter((i) => i.id > 0).length;
  if (p.task) n += p.task.task_inventory.filter((i) => i.id > 0).length;
  return n;
}

/** Total de slots reservados (id=0 contam) — útil pra mostrar capacidade. */
export function countPresetSlots(p: OfficialPreset): {
  inv: number;
  eq: number;
  sh: number;
} {
  return {
    inv: p.inventory.items.length,
    eq: p.equipment.items.length,
    sh:
      p.storehouse.items.length +
      p.storehouse.dress.length +
      p.storehouse.material.length +
      p.storehouse.generalcard.length,
  };
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/**
 * Materializa um preset oficial em um InitialKit pronto pra ser inserido
 * via useInitialKits.createKit(). Gera um id temporário; o id real virá do
 * banco depois do INSERT.
 *
 * Não toca em base/status/identity — o preset por construção já não tem.
 */
export function presetToKit(preset: OfficialPreset, name?: string): InitialKit {
  const now = new Date().toISOString();
  return {
    id: `tmp_preset_${preset.id}_${Date.now()}`,
    name: (name ?? preset.name).trim() || preset.name,
    description: preset.description,
    target_cls: preset.target_cls,
    created_at: now,
    updated_at: now,
    includes: { ...preset.includes },
    inventory: {
      items: clone(preset.inventory.items),
      ...(preset.includes.inventory_money && typeof preset.inventory.money === "number"
        ? { money: preset.inventory.money }
        : {}),
    },
    equipment: { items: clone(preset.equipment.items) },
    storehouse: {
      items: clone(preset.storehouse.items),
      dress: clone(preset.storehouse.dress),
      material: clone(preset.storehouse.material),
      generalcard: clone(preset.storehouse.generalcard),
      ...(preset.includes.storehouse_money && typeof preset.storehouse.money === "number"
        ? { money: preset.storehouse.money }
        : {}),
    },
    ...(preset.task ? { task: { task_inventory: clone(preset.task.task_inventory) } } : {}),
  };
}

export const FOCUS_LABEL: Record<PresetFocus, string> = {
  leveling: "Leveling",
  farm: "Farm",
  pvp: "PvP",
  clear: "Reset/Limpar",
};

// Helpers puros para a ação "Limpar inventário em massa" (modo Template).
//
// Regras importantes:
// - Preserva `capacity`, `timestamp`, `reserved6`, `reserved7`, `money`
//   (a menos que `clearMoney=true`).
// - Garante slots `0..capacity-1`. Se faltar slot, cria vazio.
// - Itens com `pos >= capacity`: por padrão preservados FORA da capacidade
//   (id=0, mas mantém a `pos` original). Se `removeOutOfCapacity=true`,
//   são descartados do payload final.
// - Sempre retorna items ordenados por pos ASC.
// - NÃO altera equipment, storehouse, task, status ou base — apenas
//   monta o payload mínimo `{ roleid, inventory: {...} }`.
import type { ClsItem, ClsTemplate } from "@/types/clsconfig";

export interface BuildClearInventoryOptions {
  clearMoney: boolean;
  /** Default false → preserva slots fora da capacidade (zerados). */
  removeOutOfCapacity?: boolean;
}

export interface ClearInventoryPayload {
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

const emptyAt = (pos: number): ClsItem => ({
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

/**
 * Monta o payload mínimo para limpar o inventário de UM roleid.
 * Não chama API. Não altera o template em memória.
 */
export function buildClearInventoryPayload(
  template: ClsTemplate,
  opts: BuildClearInventoryOptions,
): ClearInventoryPayload {
  const inv = template.inventory as ClsTemplate["inventory"] & {
    reserved6?: number;
    reserved7?: number;
  };
  const capacity = Math.max(0, Number(inv.capacity) || 0);
  const removeOOC = Boolean(opts.removeOutOfCapacity);

  // Indexar pos existentes para descobrir os "fora da capacidade".
  const byPos = new Map<number, ClsItem>();
  for (const it of inv.items ?? []) {
    const pos = Number(it.pos);
    if (!Number.isFinite(pos) || pos < 0) continue;
    byPos.set(pos, it);
  }

  const out: ClsItem[] = [];

  // 1) Slots dentro da capacidade — sempre presentes, sempre vazios.
  for (let p = 0; p < capacity; p++) {
    out.push(emptyAt(p));
  }

  // 2) Slots fora da capacidade existentes — preservar (vazios) por segurança.
  if (!removeOOC) {
    for (const pos of byPos.keys()) {
      if (pos >= capacity) out.push(emptyAt(pos));
    }
  }

  out.sort((a, b) => a.pos - b.pos);

  return {
    roleid: Number(template.roleid),
    inventory: {
      capacity,
      timestamp: Number(inv.timestamp ?? 0),
      money: opts.clearMoney ? 0 : Number(inv.money ?? 0),
      reserved6: Number(inv.reserved6 ?? 0),
      reserved7: Number(inv.reserved7 ?? 0),
      items: out.map((it) => ({
        id: it.id,
        pos: it.pos,
        count: it.count,
        max_count: it.max_count,
        data: it.data,
        proctype: it.proctype,
        expire_date: it.expire_date,
        guid1: it.guid1,
        guid2: it.guid2,
        mask: it.mask,
      })),
    },
  };
}

/** Conta quantos itens (id>0) existem hoje no inventário. */
export function countFilledInventory(template: ClsTemplate): number {
  return (template.inventory.items ?? []).filter((i) => i.id > 0).length;
}

/** Conta itens fora da capacidade declarada. */
export function countOutOfCapacity(template: ClsTemplate): number {
  const cap = Math.max(0, Number(template.inventory.capacity) || 0);
  return (template.inventory.items ?? []).filter((i) => Number(i.pos) >= cap).length;
}

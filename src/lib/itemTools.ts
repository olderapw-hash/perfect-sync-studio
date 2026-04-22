// Ferramentas rápidas para slots de item — operações puras sobre ClsItem(s).
// Toda manipulação UI deve passar por aqui pra garantir consistência:
//   - clearSlot   → vira slot vazio mantendo `pos`
//   - normalize   → coage tipos numéricos, limpa data, zera campos quando vazio
//   - duplicate   → copia item para outro pos (ajusta apenas pos)
//   - move        → muda pos do item (sem cópia)
//   - applyToList → upsert/swap/replace numa lista de items (sort por pos)
//   - parseItemJson → valida JSON colado e devolve item normalizado
//
// IMPORTANTE: todas funções são puras. Não mutam o array de entrada.

import type { ClsItem } from "@/types/clsconfig";

const HEX_RE = /^[0-9a-fA-F]*$/;

/** Slot vazio canônico — mesma forma usada em clsconfig.ts. */
export const emptySlot = (pos: number): ClsItem => ({
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

/** True quando o item é "logicamente vazio" (id=0 e count=0). */
export const isEmptySlot = (it: ClsItem | undefined | null): boolean =>
  !it || (Number(it.id) === 0 && Number(it.count) === 0);

const toNum = (v: unknown): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Normaliza um item:
 *  - todos os campos numéricos viram Number(...) (≥ 0)
 *  - `data` vira string sem espaços (e em lowercase quando hex)
 *  - se id=0 e count=0, zera os demais campos (slot vazio canônico)
 */
export const normalizeItem = (raw: ClsItem): ClsItem => {
  const id = Math.max(0, Math.trunc(toNum(raw.id)));
  const pos = Math.max(0, Math.trunc(toNum(raw.pos)));
  const count = Math.max(0, Math.trunc(toNum(raw.count)));
  const dataStr = String(raw.data ?? "").replace(/\s+/g, "");
  const dataNorm = HEX_RE.test(dataStr) ? dataStr.toLowerCase() : dataStr;

  if (id === 0 && count === 0) {
    return emptySlot(pos);
  }

  return {
    id,
    pos,
    count,
    max_count: Math.max(0, Math.trunc(toNum(raw.max_count))),
    data: dataNorm,
    proctype: Math.max(0, Math.trunc(toNum(raw.proctype))),
    expire_date: Math.max(0, Math.trunc(toNum(raw.expire_date))),
    guid1: Math.max(0, Math.trunc(toNum(raw.guid1))),
    guid2: Math.max(0, Math.trunc(toNum(raw.guid2))),
    mask: Math.max(0, Math.trunc(toNum(raw.mask))),
  };
};

/** Clear → slot vazio mantendo a mesma `pos`. */
export const clearSlot = (it: ClsItem): ClsItem => emptySlot(Number(it.pos) || 0);

/** Duplicar → mesma payload, troca apenas `pos`. */
export const duplicateToPos = (src: ClsItem, destPos: number): ClsItem => ({
  ...src,
  pos: Math.max(0, Math.trunc(toNum(destPos))),
});

/** Mover → idêntico a duplicar (mas semanticamente representa "move"). */
export const moveToPos = duplicateToPos;

/** Resultado da operação aplicada a uma lista (upsert / swap / replace). */
export interface ApplyResult {
  next: ClsItem[];
  /** True quando o destino estava ocupado e exigiu substituição/swap. */
  collided: boolean;
}

/**
 * Aplica `incoming` na lista, com `pos` definindo o slot alvo.
 *
 * Modos:
 *   - "upsert"  → se destino ocupado, substitui o conteúdo (perde o antigo)
 *   - "swap"    → se destino ocupado, troca pos do antigo com `swapBackPos`
 *   - "replace" → idêntico ao upsert (alias mais explícito pra UI)
 *
 * Sempre retorna a lista ordenada por pos. Não muta `list`.
 */
export const applyToList = (
  list: ClsItem[],
  incoming: ClsItem,
  opts: { mode?: "upsert" | "swap" | "replace"; swapBackPos?: number } = {},
): ApplyResult => {
  const mode = opts.mode ?? "upsert";
  const destPos = Number(incoming.pos);
  const occupied = list.find((it) => it.pos === destPos);
  const collided = !!occupied && !isEmptySlot(occupied);

  // Remove o antigo no destino
  let next = list.filter((it) => it.pos !== destPos);

  if (collided && mode === "swap" && opts.swapBackPos != null) {
    // Move o ocupante antigo para a posição "de volta" (origem do move)
    const back = Math.max(0, Math.trunc(toNum(opts.swapBackPos)));
    next = next.filter((it) => it.pos !== back);
    next.push({ ...occupied!, pos: back });
  }

  next.push(incoming);
  next.sort((a, b) => a.pos - b.pos);
  return { next, collided };
};

/**
 * Parseia JSON colado e devolve um ClsItem normalizado.
 * Lança Error com mensagem amigável se JSON inválido ou shape inesperado.
 *
 * Aceita:
 *   - JSON com todos os campos do ClsItem
 *   - JSON parcial (campos faltantes viram 0/"")
 *
 * Sempre força `pos` para `targetPos` (slot atual onde o paste foi disparado).
 */
export const parseItemJson = (raw: string, targetPos: number): ClsItem => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error("JSON inválido — verifique a sintaxe");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSON deve ser um objeto com campos do item (id, count, data, ...)");
  }
  const obj = parsed as Record<string, unknown>;
  const candidate: ClsItem = {
    id: toNum(obj.id),
    pos: targetPos, // sempre o slot atual
    count: toNum(obj.count),
    max_count: toNum(obj.max_count),
    data: typeof obj.data === "string" ? obj.data : "",
    proctype: toNum(obj.proctype),
    expire_date: toNum(obj.expire_date),
    guid1: toNum(obj.guid1),
    guid2: toNum(obj.guid2),
    mask: toNum(obj.mask),
  };
  return normalizeItem(candidate);
};

/** Serializa item para JSON legível (clipboard). */
export const stringifyItem = (it: ClsItem): string =>
  JSON.stringify(it, null, 2);

/**
 * Tenta copiar texto para o clipboard. Retorna true em sucesso.
 * Faz fallback pra textarea selection quando navigator.clipboard indisponível.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallthrough */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
};

/** Lê o clipboard. Retorna null se indisponível ou negado. */
export const readFromClipboard = async (): Promise<string | null> => {
  try {
    if (navigator?.clipboard?.readText) {
      return await navigator.clipboard.readText();
    }
  } catch {
    /* ignore */
  }
  return null;
};

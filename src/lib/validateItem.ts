// Validações de item (inventário/equipamento/baú/task) ANTES de chamar a API.
//
// Regras (numeração espelha o spec do produto):
//   1.  id deve ser número >= 0
//   2.  pos deve ser número >= 0
//   3.  count deve ser número >= 0
//   4.  max_count deve ser número >= 0
//   5.  count não pode ser maior que max_count quando max_count > 0
//   6.  proctype, expire_date, guid1, guid2, mask devem ser números >= 0
//   7.  data deve ser hex válido e com tamanho par
//   8.  Não permitir pos duplicado dentro da mesma seção
//   9.  pos deve estar dentro da capacidade quando a seção tiver capacity
//   10. id=0 e count=0 → slot vazio (OK, sem erro)
//   11. id=0 e count>0 → ERRO
//   12. id>0 e count=0 → AVISO
//   13. equipment com pos duplicado → ERRO CRÍTICO
//   14. inventory/storehouse com pos >= capacity → ERRO CRÍTICO
//
// Saída inclui severidade ("error" | "critical" | "warning") e contexto
// suficiente para o painel de validação abrir o slot correspondente.
import type { ClsItem, ClsTemplate } from "@/types/clsconfig";
import { getEquipmentSlotLabel, isUnknownEquipmentPos } from "@/lib/equipmentSlots";

/** Identifica em qual lista o erro foi gerado. Usado pela UI pra abrir a tab certa. */
export type ItemSection =
  | "inventory.items"
  | "equipment.items"
  | "storehouse.items"
  | "storehouse.dress"
  | "storehouse.material"
  | "storehouse.generalcard"
  | "task.task_inventory";

export type IssueSeverity = "warning" | "error" | "critical";

export interface ItemIssue {
  section: ItemSection;
  /** Tab UI sugerida pra abrir o slot. */
  tab: "inventory" | "equipment" | "storehouse" | "status" | "task";
  /** Index dentro do array da seção (não confundir com `pos`). */
  index: number;
  /** Posição reportada pelo item. Pode ser NaN se inválida. */
  pos: number;
  /** Campo que falhou (ex: "id", "count", "max_count", "pos", "data"). */
  field: string;
  severity: IssueSeverity;
  /** Mensagem amigável pra UI. */
  message: string;
}

const HEX_RE = /^[0-9a-fA-F]+$/;

const isFiniteNumber = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

/** Regra 7: hex válido E com tamanho par. String vazia é aceita (slot sem payload). */
const isValidHexData = (s: unknown): boolean => {
  if (s == null) return true;
  const str = String(s);
  if (str.length === 0) return true;
  if (!HEX_RE.test(str)) return false;
  return str.length % 2 === 0;
};

export interface ValidateOptions {
  /** Capacidade da seção. Use Infinity quando não houver limite real. */
  capacity: number;
  /** Identificador da seção pra mapeamento na UI. */
  section: ItemSection;
  /** Tab sugerida pra abrir o slot. */
  tab: ItemIssue["tab"];
  /** Rótulo legível pra mensagens (ex: "Inventário", "Baú · Material"). */
  label: string;
  /**
   * Se true, slot duplicado em equipamento é tratado como CRÍTICO (regra 13).
   * Caso contrário, é apenas ERRO.
   */
  duplicateIsCritical?: boolean;
  /**
   * Se true, pos fora de capacity é tratado como CRÍTICO (regra 14).
   * Caso contrário, é apenas ERRO.
   */
  outOfCapacityIsCritical?: boolean;
}

export function validateItems(
  items: ClsItem[] | undefined | null,
  opts: ValidateOptions,
): ItemIssue[] {
  const issues: ItemIssue[] = [];
  if (!Array.isArray(items)) return issues;
  const seenPos = new Map<number, number>(); // pos → primeiro index visto

  items.forEach((it, idx) => {
    const pos = isFiniteNumber(it?.pos) ? it.pos : NaN;
    const id = isFiniteNumber(it?.id) ? it.id : NaN;
    const count = isFiniteNumber(it?.count) ? it.count : NaN;
    const maxCount = isFiniteNumber(it?.max_count) ? it.max_count : NaN;

    const push = (
      severity: IssueSeverity,
      field: string,
      message: string,
    ) => {
      issues.push({
        section: opts.section,
        tab: opts.tab,
        index: idx,
        pos,
        field,
        severity,
        message: `${opts.label} · pos ${Number.isFinite(pos) ? pos : "?"}: ${message}`,
      });
    };

    // Regra 1: id >= 0
    if (!isFiniteNumber(id) || id < 0) {
      push("error", "id", "id deve ser número ≥ 0");
    }
    // Regra 2: pos >= 0
    if (!isFiniteNumber(pos) || pos < 0) {
      push("error", "pos", "pos deve ser número ≥ 0");
    }
    // Regra 3: count >= 0
    if (!isFiniteNumber(count) || count < 0) {
      push("error", "count", "count deve ser número ≥ 0");
    }
    // Regra 4: max_count >= 0
    if (!isFiniteNumber(maxCount) || maxCount < 0) {
      push("error", "max_count", "max_count deve ser número ≥ 0");
    }

    // Slot vazio (regra 10): id=0 e count=0 → tudo OK, pula validações específicas.
    const looksEmpty = id === 0 && count === 0;

    if (!looksEmpty) {
      // Regra 11: id=0 e count>0 → ERRO
      if (id === 0 && isFiniteNumber(count) && count > 0) {
        push("error", "id", "id=0 com count>0 é inválido (slot vazio não pode ter quantidade)");
      }
      // Regra 12: id>0 e count=0 → AVISO
      if (isFiniteNumber(id) && id > 0 && count === 0) {
        push("warning", "count", "id>0 com count=0 — item provavelmente vazio/perdido");
      }
      // Regra 5: count <= max_count quando max_count > 0
      if (
        isFiniteNumber(count) &&
        isFiniteNumber(maxCount) &&
        maxCount > 0 &&
        count > maxCount
      ) {
        push(
          "error",
          "max_count",
          `count (${count}) não pode ser maior que max_count (${maxCount})`,
        );
      }
    }

    // Regra 9 + 14: pos dentro da capacity
    if (
      isFiniteNumber(pos) &&
      pos >= 0 &&
      Number.isFinite(opts.capacity) &&
      pos >= opts.capacity
    ) {
      push(
        opts.outOfCapacityIsCritical ? "critical" : "error",
        "pos",
        `pos ${pos} fora da capacidade (0..${opts.capacity - 1})`,
      );
    }

    // Regra 8 + 13: pos duplicado
    if (isFiniteNumber(pos)) {
      if (seenPos.has(pos)) {
        // Para equipamento, usa o nome real do slot na mensagem.
        const isEquipment = opts.section === "equipment.items";
        const slotName = isEquipment ? getEquipmentSlotLabel(pos) : null;
        const dupMsg = isEquipment
          ? `${opts.label} duplicado no slot ${slotName} (pos ${pos}) — também no índice ${seenPos.get(pos)}`
          : `${opts.label} · pos ${pos}: duplicada (também no slot índice ${seenPos.get(pos)})`;
        issues.push({
          section: opts.section,
          tab: opts.tab,
          index: idx,
          pos,
          field: "pos",
          severity: opts.duplicateIsCritical ? "critical" : "error",
          message: dupMsg,
        });
      } else {
        seenPos.set(pos, idx);
      }
    }

    // Equipamento: pos desconhecida com item válido → AVISO (não erro).
    // Slot é preservado; só sinaliza pra UX que o painel não tem layout pra ele.
    if (
      opts.section === "equipment.items" &&
      isFiniteNumber(pos) &&
      pos >= 0 &&
      isFiniteNumber(id) &&
      id > 0 &&
      isUnknownEquipmentPos(pos)
    ) {
      issues.push({
        section: opts.section,
        tab: opts.tab,
        index: idx,
        pos,
        field: "pos",
        severity: "warning",
        message: `Slot especial/desconhecido detectado (pos ${pos}). Será preservado.`,
      });
    }

    // Regra 7: data hex par
    if (!isValidHexData(it?.data)) {
      push("error", "data", "data deve ser HEX válido com tamanho par");
    }

    // Regra 6: opcionais numéricos >= 0
    for (const f of ["proctype", "expire_date", "guid1", "guid2", "mask"] as const) {
      const v = (it as unknown as Record<string, unknown>)?.[f];
      if (!isFiniteNumber(v) || (v as number) < 0) {
        push("error", f, `${f} deve ser número ≥ 0`);
      }
    }
  });

  return issues;
}

/**
 * Valida todas as listas de itens de um template e devolve issues com severidade.
 * Inclui task.task_inventory quando presente (lido de forma defensiva — o tipo
 * `ClsTemplate` não declara o campo, mas ele aparece no payload da VPS).
 */
export function validateAllItems(template: ClsTemplate): ItemIssue[] {
  const out: ItemIssue[] = [];

  // Inventário — pos fora de capacity é CRÍTICO (regra 14).
  out.push(
    ...validateItems(template.inventory?.items, {
      section: "inventory.items",
      tab: "inventory",
      label: "Inventário",
      capacity: Math.max(template.inventory?.capacity || 0, 1),
      outOfCapacityIsCritical: true,
    }),
  );

  // Equipamento — duplicado é CRÍTICO (regra 13). Sem capacity rígida.
  const eqCap = Math.max(
    ...(template.equipment?.items?.map((i) => (Number.isFinite(i?.pos) ? i.pos + 1 : 0)) ?? [0]),
    32,
  );
  out.push(
    ...validateItems(template.equipment?.items, {
      section: "equipment.items",
      tab: "equipment",
      label: "Equipamento",
      capacity: eqCap,
      duplicateIsCritical: true,
    }),
  );

  // Baú — pos fora de capacity é CRÍTICO (regra 14, mesma família do inventário).
  out.push(
    ...validateItems(template.storehouse?.items, {
      section: "storehouse.items",
      tab: "storehouse",
      label: "Baú · Itens",
      capacity: Math.max(template.storehouse?.capacity || 0, 1),
      outOfCapacityIsCritical: true,
    }),
  );
  out.push(
    ...validateItems(template.storehouse?.dress, {
      section: "storehouse.dress",
      tab: "storehouse",
      label: "Baú · Dress",
      capacity: Math.max(template.storehouse?.dress?.length ?? 0, 16),
    }),
  );
  out.push(
    ...validateItems(template.storehouse?.material, {
      section: "storehouse.material",
      tab: "storehouse",
      label: "Baú · Material",
      capacity: Math.max(template.storehouse?.material?.length ?? 0, 16),
    }),
  );
  out.push(
    ...validateItems(template.storehouse?.generalcard, {
      section: "storehouse.generalcard",
      tab: "storehouse",
      label: "Baú · General card",
      capacity: Math.max(template.storehouse?.generalcard?.length ?? 0, 16),
    }),
  );

  // task.task_inventory — opcional, lido de forma defensiva.
  const tplAny = template as unknown as Record<string, unknown>;
  const taskRaw =
    (tplAny.task as Record<string, unknown> | undefined) ??
    (tplAny.status as Record<string, unknown> | undefined);
  const taskInv = taskRaw?.task_inventory as ClsItem[] | undefined;
  if (Array.isArray(taskInv)) {
    out.push(
      ...validateItems(taskInv, {
        section: "task.task_inventory",
        tab: "task",
        label: "Task · Inventário",
        capacity: Math.max(taskInv.length, 1),
      }),
    );
  }

  return out;
}

export interface ValidationSummary {
  issues: ItemIssue[];
  errors: ItemIssue[];
  warnings: ItemIssue[];
  criticals: ItemIssue[];
  /** True quando há ao menos um erro de severidade `error` ou `critical`. */
  hasBlocking: boolean;
}

export function summarizeIssues(issues: ItemIssue[]): ValidationSummary {
  const errors: ItemIssue[] = [];
  const warnings: ItemIssue[] = [];
  const criticals: ItemIssue[] = [];
  for (const i of issues) {
    if (i.severity === "warning") warnings.push(i);
    else if (i.severity === "critical") criticals.push(i);
    else errors.push(i);
  }
  return {
    issues,
    errors,
    warnings,
    criticals,
    hasBlocking: errors.length + criticals.length > 0,
  };
}

// ───────────────────────── Compat com chamadas antigas ─────────────────────────
// Mantém a API anterior pra não quebrar callers existentes que esperavam apenas
// uma lista de erros (sem severidade). Internamente delega pro novo validador
// e devolve apenas itens "error"/"critical".

export interface ItemValidationError {
  pos: number;
  field: string;
  message: string;
}

export function validateTemplateItems(template: ClsTemplate): ItemValidationError[] {
  const summary = summarizeIssues(validateAllItems(template));
  return [...summary.criticals, ...summary.errors].map((i) => ({
    pos: i.pos,
    field: i.field,
    message: i.message,
  }));
}

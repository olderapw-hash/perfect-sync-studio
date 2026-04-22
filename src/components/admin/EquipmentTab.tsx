import type { ClsItem, ClsTemplate } from "@/types/clsconfig";
import { newEmptyItem } from "@/lib/clsconfig";
import { ItemSlot } from "./ItemSlot";
import { ItemEditor } from "./ItemEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  template: ClsTemplate;
  onChange: (next: ClsTemplate) => void;
}

/**
 * Layout paper-doll do PW (versão BR — bate com o cliente nacional).
 * Cada entrada define a `pos` do slot no array equipment.items e onde aparece
 * no grid 5x6. Rótulos em PT-BR.
 */
const SLOTS: { pos: number; label: string; col: number; row: number }[] = [
  { pos: 12, label: "Voadora",  col: 1, row: 1 }, // canto sup. esquerdo
  { pos: 0,  label: "Capacete", col: 3, row: 1 }, // topo central
  { pos: 10, label: "Capa",     col: 5, row: 1 }, // canto sup. direito
  { pos: 1,  label: "Colar",    col: 1, row: 2 },
  { pos: 2,  label: "Armadura", col: 3, row: 3 }, // peito central
  { pos: 13, label: "Talismã",  col: 5, row: 2 },
  { pos: 8,  label: "Arma",     col: 1, row: 3 },
  { pos: 9,  label: "Sub-arma", col: 5, row: 3 },
  { pos: 6,  label: "Anel E",   col: 1, row: 4 },
  { pos: 3,  label: "Cinto",    col: 3, row: 4 },
  { pos: 7,  label: "Anel D",   col: 5, row: 4 },
  { pos: 11, label: "Pet",      col: 1, row: 5 },
  { pos: 4,  label: "Calça",    col: 3, row: 5 },
  { pos: 14, label: "Marca",    col: 5, row: 5 }, // extra (se existir)
  { pos: 5,  label: "Botas",    col: 3, row: 6 },
];

/** Slots dos "Líderes" (cards de facção/contribuição) — estilo PW BR. */
const LEADER_SLOTS: { pos: number; idx: number }[] = [
  { pos: 20, idx: 0 },
  { pos: 21, idx: 1 },
  { pos: 22, idx: 2 },
  { pos: 23, idx: 3 },
  { pos: 24, idx: 4 },
  { pos: 25, idx: 5 },
];

const LEADER_POSITIONS = new Set(LEADER_SLOTS.map((s) => s.pos));

export const EquipmentTab = ({ template, onChange }: Props) => {
  const items = template.equipment.items;
  const [editingPos, setEditingPos] = useState<number | null>(null);
  // Demanda de "líderes necessários" — local apenas (não persistido na VPS).
  const [leadersNeeded, setLeadersNeeded] = useState<number>(10);
  const [sBonus, setSBonus] = useState<boolean>(false);

  const byPos = new Map<number, ClsItem>();
  items.forEach((it) => byPos.set(it.pos, it));

  const upsertAt = (pos: number, next: ClsItem) => {
    const exists = items.some((it) => it.pos === pos);
    const nextItems = exists
      ? items.map((it) => (it.pos === pos ? next : it))
      : [...items, next].sort((a, b) => a.pos - b.pos);
    onChange({ ...template, equipment: { items: nextItems } });
  };

  const removeAt = (pos: number) => {
    onChange({
      ...template,
      equipment: { items: items.filter((it) => it.pos !== pos) },
    });
    setEditingPos(null);
  };

  const openSlot = (pos: number) => {
    if (!byPos.has(pos)) upsertAt(pos, newEmptyItem(pos));
    setEditingPos(pos);
  };

  const editing =
    editingPos != null ? byPos.get(editingPos) ?? newEmptyItem(editingPos) : null;

  const dollPositions = new Set(SLOTS.map((s) => s.pos));
  // "Slots extras" exclui o paper-doll e os líderes (que têm seu próprio bloco).
  const extras = items.filter(
    (it) => !dollPositions.has(it.pos) && !LEADER_POSITIONS.has(it.pos) && it.id > 0,
  );

  // Progresso do topo: % de slots equipados do paper-doll.
  const equippedCount = SLOTS.reduce(
    (n, s) => (byPos.get(s.pos)?.id ?? 0) > 0 ? n + 1 : n,
    0,
  );
  const progress = Math.round((equippedCount / SLOTS.length) * 100);

  const editingLabel =
    editingPos == null
      ? ""
      : SLOTS.find((s) => s.pos === editingPos)?.label
        ?? (LEADER_POSITIONS.has(editingPos) ? "Líder" : "extra");

  // Grid de slots extras (sempre mostra ao menos 32 caixas, no estilo da imagem)
  const EXTRA_GRID_SIZE = 32;
  const extrasByPos = new Map<number, ClsItem>();
  extras.forEach((it) => extrasByPos.set(it.pos, it));

  return (
    <div className="space-y-3">
      {/* Painel principal estilo cliente PW BR */}
      <div className="mx-auto w-full max-w-[420px]">
        {/* Cantoneiras + barra de progresso superior */}
        <div
          className="relative rounded-md p-3 pt-5"
          style={{
            background:
              "linear-gradient(180deg, hsl(195 30% 12%) 0%, hsl(205 35% 7%) 100%)",
            boxShadow:
              "inset 0 0 0 1px hsl(195 60% 35%), 0 0 0 1px hsl(0 0% 0%), inset 0 0 24px hsl(0 0% 0% / 0.6)",
          }}
        >
          {/* Barra de progresso topo */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
            <div
              className="flex h-5 w-44 items-center justify-center rounded-full px-3"
              style={{
                background:
                  "linear-gradient(180deg, hsl(40 35% 92%) 0%, hsl(40 25% 70%) 100%)",
                boxShadow:
                  "inset 0 0 0 1px hsl(40 60% 30%), 0 1px 3px hsl(0 0% 0% / 0.6)",
              }}
            >
              <span className="font-mono text-[11px] font-bold text-amber-950">
                {progress.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Paper-doll */}
          <div
            className="relative mt-2 grid w-full gap-2 rounded-sm p-3"
            style={{
              gridTemplateColumns: "repeat(5, 1fr)",
              gridTemplateRows: "repeat(6, auto)",
              background:
                "radial-gradient(ellipse at center, hsl(35 18% 22%) 0%, hsl(20 15% 8%) 80%)",
              boxShadow:
                "inset 0 0 0 1px hsl(40 50% 35%), inset 0 0 32px hsl(0 0% 0% / 0.85)",
            }}
          >
            {/* Silhueta de fundo */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <svg
                viewBox="0 0 100 200"
                className="h-[88%] w-auto opacity-[0.18]"
                fill="hsl(40 40% 50%)"
              >
                <circle cx="50" cy="22" r="14" />
                <path d="M30 40 L70 40 L78 100 L66 130 L60 180 L40 180 L34 130 L22 100 Z" />
                <path d="M22 100 L8 60 L4 70 L18 110 Z" />
                <path d="M78 100 L92 60 L96 70 L82 110 Z" />
              </svg>
            </div>

            {SLOTS.map((s) => {
              const it = byPos.get(s.pos) ?? newEmptyItem(s.pos);
              return (
                <div
                  key={s.pos}
                  style={{ gridColumn: s.col, gridRow: s.row }}
                  className="relative z-10 flex items-center justify-center"
                >
                  <ItemSlot
                    item={it}
                    onClick={() => openSlot(s.pos)}
                    size={48}
                    emptyLabel={s.label}
                  />
                </div>
              );
            })}
          </div>

          {/* Bloco "Líderes" — 6 cards com nv. 0 + linha de necessários e S+ bônus */}
          <section className="mt-3">
            <div className="grid grid-cols-6 gap-2">
              {LEADER_SLOTS.map((ls) => {
                const it = byPos.get(ls.pos) ?? newEmptyItem(ls.pos);
                return (
                  <div key={ls.pos} className="flex flex-col items-center gap-1">
                    <ItemSlot
                      item={it}
                      onClick={() => openSlot(ls.pos)}
                      size={42}
                      emptyLabel="Líder"
                    />
                    <div className="flex items-baseline gap-1 text-[11px]">
                      <span className="text-amber-200/70">nv.</span>
                      <span className="font-mono font-bold text-amber-100">
                        {it.id > 0 ? it.count || 1 : 0}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <label className="flex items-center gap-2 text-amber-200/80">
                Líderes necessários
                <input
                  type="number"
                  min={0}
                  value={leadersNeeded}
                  onChange={(e) =>
                    setLeadersNeeded(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  className="w-12 border-b border-amber-200/40 bg-transparent px-1 text-center font-mono font-bold text-amber-100 outline-none focus:border-amber-300"
                />
                <span className="font-mono text-emerald-400/90">
                  ({equippedCount})
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-amber-200/80">
                <span>S+ bônus</span>
                <input
                  type="checkbox"
                  checked={sBonus}
                  onChange={(e) => setSBonus(e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer rounded-sm border border-amber-700/60 bg-black/40 accent-amber-400"
                />
              </label>
            </div>
          </section>

          {/* Slots extras — grid 8x4 estilo bag do cliente */}
          <section className="mt-3">
            <div
              className="grid grid-cols-8 gap-[3px] rounded-sm p-2"
              style={{
                background:
                  "linear-gradient(180deg, hsl(200 20% 10%), hsl(205 30% 6%))",
                boxShadow:
                  "inset 0 0 0 1px hsl(195 55% 35%), inset 0 0 16px hsl(0 0% 0% / 0.85)",
              }}
            >
              {Array.from({ length: EXTRA_GRID_SIZE }).map((_, i) => {
                // pos virtual sequencial a partir de 100 para extras editáveis
                const virtualPos = 100 + i;
                const real = extras[i];
                const it = real ?? newEmptyItem(virtualPos);
                return (
                  <ItemSlot
                    key={i}
                    item={it}
                    size={36}
                    onClick={() => openSlot(it.pos)}
                  />
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <Dialog open={editingPos != null} onOpenChange={(o) => !o && setEditingPos(null)}>
        <DialogContent className="max-w-xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <span>
                Editar slot — pos {editingPos}
                {editingPos != null && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({editingLabel})
                  </span>
                )}
              </span>
              {editing && editing.id > 0 && (
                <button
                  type="button"
                  onClick={() => removeAt(editing.pos)}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-2 py-1 text-xs text-destructive transition-smooth hover:border-destructive/50"
                >
                  <X className="h-3 w-3" />
                  Esvaziar
                </button>
              )}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <ItemEditor
              item={editing}
              onChange={(next) => upsertAt(next.pos, next)}
              onRemove={() => removeAt(editing.pos)}
            />
          )}
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setEditingPos(null)}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-4 py-2 text-sm transition-smooth hover:border-primary/50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setEditingPos(null)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
            >
              Salvar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

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
 * Layout paper-doll do PW (versão 1.5.x — bate com o MyPers).
 * Cada entrada define a `pos` do slot no array equipment.items e onde ele aparece.
 */
const SLOTS: { pos: number; label: string; col: number; row: number }[] = [
  { pos: 0,  label: "Helm",    col: 3, row: 1 }, // Capacete (topo)
  { pos: 1,  label: "Neck",    col: 4, row: 1 }, // Colar
  { pos: 10, label: "Cape",    col: 2, row: 1 }, // Capa
  { pos: 12, label: "Wing",    col: 5, row: 1 }, // Asa/Voadora
  { pos: 8,  label: "Weapon",  col: 1, row: 3 }, // Arma principal
  { pos: 2,  label: "Chest",   col: 3, row: 3 }, // Armadura
  { pos: 9,  label: "Off",     col: 5, row: 3 }, // Sub-arma/Escudo
  { pos: 6,  label: "Ring L",  col: 1, row: 4 }, // Anel esquerdo
  { pos: 3,  label: "Belt",    col: 3, row: 4 }, // Cinto
  { pos: 7,  label: "Ring R",  col: 5, row: 4 }, // Anel direito
  { pos: 11, label: "Pet",     col: 1, row: 5 }, // Pet
  { pos: 4,  label: "Pants",   col: 3, row: 5 }, // Calça
  { pos: 13, label: "Token",   col: 5, row: 5 }, // Token/extra
  { pos: 5,  label: "Boots",   col: 3, row: 6 }, // Botas
];

export const EquipmentTab = ({ template, onChange }: Props) => {
  const items = template.equipment.items;
  const [editingPos, setEditingPos] = useState<number | null>(null);

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

  // Slots usados pelo paper-doll
  const dollPositions = new Set(SLOTS.map((s) => s.pos));
  // Quaisquer slots vindos do servidor que estejam fora do mapa do paper-doll
  const extras = items.filter((it) => !dollPositions.has(it.pos) && it.id > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div
          className="relative grid w-full max-w-[420px] gap-2 rounded-sm p-4"
          style={{
            gridTemplateColumns: "repeat(5, 1fr)",
            gridTemplateRows: "repeat(6, auto)",
            background:
              "radial-gradient(ellipse at center, hsl(30 25% 14%) 0%, hsl(20 25% 6%) 75%)",
            boxShadow:
              "inset 0 0 0 1px hsl(40 50% 35%), inset 0 0 24px hsl(0 0% 0% / 0.8)",
          }}
        >
          {/* Silhueta de fundo */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <svg
              viewBox="0 0 100 200"
              className="h-[85%] w-auto opacity-[0.08]"
              fill="hsl(40 60% 70%)"
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
      </div>

      {extras.length > 0 && (
        <section>
          <header className="mb-2 flex items-baseline gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-200/70">
              Slots extras
            </h4>
            <span className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {extras.length}
            </span>
          </header>
          <div
            className="grid grid-cols-8 gap-[3px] rounded-sm p-2"
            style={{
              background: "linear-gradient(180deg, hsl(30 20% 10%), hsl(20 25% 6%))",
              boxShadow:
                "inset 0 0 0 1px hsl(40 50% 35%), inset 0 0 12px hsl(0 0% 0% / 0.8)",
            }}
          >
            {extras.map((it) => (
              <ItemSlot key={it.pos} item={it} onClick={() => openSlot(it.pos)} />
            ))}
          </div>
        </section>
      )}

      <Dialog open={editingPos != null} onOpenChange={(o) => !o && setEditingPos(null)}>
        <DialogContent className="max-w-xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <span>
                Editar slot — pos {editingPos}
                {editingPos != null && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({SLOTS.find((s) => s.pos === editingPos)?.label ?? "extra"})
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

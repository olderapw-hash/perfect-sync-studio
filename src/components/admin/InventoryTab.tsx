import { useMemo, useState } from "react";
import { Coins, Eraser } from "lucide-react";
import { toast } from "sonner";
import type { ClsItem, ClsTemplate } from "@/types/clsconfig";
import { newEmptyItem } from "@/lib/clsconfig";
import { ItemSlot } from "./ItemSlot";
import { ItemEditor } from "./ItemEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { clearItems, summarizeSection } from "@/lib/clearSection";
import { ClearSectionDialog } from "./ClearSectionDialog";

interface Props {
  template: ClsTemplate;
  onChange: (next: ClsTemplate) => void;
}

/**
 * Layout do inventário inspirado no client PW BR:
 * - Moldura dourada com cantos
 * - Título "JANELA DE INVENTÁRIO" / "INVENTÁRIO" + badge "MOCHILA"
 * - Grid 8 colunas
 * - Card "MOEDAS EM BOLSA" com OURO embaixo
 */
export const InventoryTab = ({ template, onChange }: Props) => {
  const inv = template.inventory;
  const [editingPos, setEditingPos] = useState<number | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  const totalSlots = Math.max(inv.capacity || 0, inv.items.length, 48);
  const filledCount = inv.items.filter((i) => i.id > 0).length;

  const byPos = useMemo(() => {
    const m = new Map<number, ClsItem>();
    inv.items.forEach((it) => m.set(it.pos, it));
    return m;
  }, [inv.items]);

  const setItems = (items: ClsItem[]) =>
    onChange({ ...template, inventory: { ...inv, items } });

  const upsertAt = (pos: number, next: ClsItem) => {
    const exists = inv.items.some((it) => it.pos === pos);
    if (exists) {
      setItems(inv.items.map((it) => (it.pos === pos ? next : it)));
    } else {
      setItems([...inv.items, next].sort((a, b) => a.pos - b.pos));
    }
  };

  const removeAt = (pos: number) => {
    setItems(inv.items.filter((it) => it.pos !== pos));
    setEditingPos(null);
  };

  const openSlot = (pos: number) => {
    if (!byPos.has(pos)) upsertAt(pos, newEmptyItem(pos));
    setEditingPos(pos);
  };

  const editing =
    editingPos != null ? byPos.get(editingPos) ?? newEmptyItem(editingPos) : null;

  return (
    <div className="space-y-5">
      {/* Controles compactos no topo */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Num
          label="Capacidade"
          value={inv.capacity}
          onChange={(v) => onChange({ ...template, inventory: { ...inv, capacity: v } })}
        />
        <Num
          label="Dinheiro"
          value={inv.money}
          onChange={(v) => onChange({ ...template, inventory: { ...inv, money: v } })}
        />
        <Num
          label="Timestamp"
          value={inv.timestamp}
          onChange={(v) => onChange({ ...template, inventory: { ...inv, timestamp: v } })}
        />
      </div>

      {/* MOLDURA DOURADA — Janela de inventário */}
      <div
        className="relative rounded-[10px] p-[2px]"
        style={{
          background:
            "linear-gradient(180deg, hsl(40 60% 50%), hsl(35 70% 35%) 40%, hsl(25 50% 20%))",
          boxShadow:
            "0 0 0 1px hsl(0 0% 0%), 0 8px 24px hsl(0 0% 0% / 0.6), inset 0 0 0 1px hsl(45 80% 60% / 0.3)",
        }}
      >
        <div
          className="rounded-[8px] p-4 sm:p-6"
          style={{
            background:
              "radial-gradient(ellipse at top, hsl(30 25% 12%), hsl(20 30% 6%) 70%)",
          }}
        >
          {/* Header tipográfico */}
          <div className="mb-4 text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-200/60">
              Janela de Inventário
            </div>
            <h3
              className="mt-1 font-serif text-2xl font-bold uppercase tracking-[0.18em]"
              style={{
                color: "hsl(45 90% 75%)",
                textShadow:
                  "0 0 12px hsl(40 80% 50% / 0.5), 0 2px 4px hsl(0 0% 0% / 0.8)",
              }}
            >
              Inventário
            </h3>
            {/* Linha decorativa dourada */}
            <div className="mx-auto mt-2 flex items-center justify-center gap-2">
              <span className="h-px w-16 bg-gradient-to-r from-transparent to-amber-500/60" />
              <span className="h-1.5 w-1.5 rotate-45 bg-amber-400/70" />
              <span className="h-px w-16 bg-gradient-to-l from-transparent to-amber-500/60" />
            </div>
          </div>

          {/* Badge MOCHILA */}
          <div className="mb-4 flex justify-center">
            <span
              className="inline-flex items-center rounded-full px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{
                background:
                  "linear-gradient(180deg, hsl(40 70% 45%), hsl(30 70% 30%))",
                color: "hsl(40 30% 12%)",
                boxShadow:
                  "0 0 0 1px hsl(45 80% 60%), 0 2px 6px hsl(0 0% 0% / 0.5), inset 0 1px 0 hsl(50 90% 70% / 0.6)",
              }}
            >
              Mochila
            </span>
          </div>

          {/* Grid de slots */}
          <div
            className="rounded-md p-2"
            style={{
              background:
                "linear-gradient(180deg, hsl(20 25% 5%), hsl(25 30% 9%))",
              boxShadow:
                "inset 0 0 0 1px hsl(40 50% 30%), inset 0 2px 12px hsl(0 0% 0% / 0.8)",
            }}
          >
            <div className="grid grid-cols-8 gap-[3px]">
              {Array.from({ length: totalSlots }, (_, pos) => {
                const it = byPos.get(pos) ?? newEmptyItem(pos);
                return <ItemSlot key={pos} item={it} onClick={() => openSlot(pos)} />;
              })}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-amber-100/40">
            <span className="font-mono">
              {filledCount}/{totalSlots} slots preenchidos
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setClearOpen(true)}
                disabled={filledCount === 0 && (inv.money ?? 0) === 0}
                className="inline-flex items-center gap-1 rounded border border-destructive/40 bg-black/40 px-2 py-0.5 font-semibold uppercase tracking-wider text-destructive transition-smooth hover:border-destructive hover:text-destructive disabled:opacity-40"
                title="Esvazia todos os slots do inventário"
              >
                <Eraser className="h-3 w-3" />
                Limpar seção
              </button>
              <button
                type="button"
                onClick={() => upsertAt(totalSlots, newEmptyItem(totalSlots))}
                className="rounded border border-amber-700/40 bg-black/40 px-2 py-0.5 font-semibold uppercase tracking-wider text-amber-200/70 transition-smooth hover:border-amber-500 hover:text-amber-200"
              >
                + Slot
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MOEDAS EM BOLSA */}
      <div
        className="rounded-[8px] p-[1px]"
        style={{
          background:
            "linear-gradient(180deg, hsl(40 50% 35%), hsl(25 40% 18%))",
        }}
      >
        <div
          className="rounded-[7px] p-4"
          style={{
            background:
              "linear-gradient(180deg, hsl(25 25% 10%), hsl(20 30% 6%))",
          }}
        >
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/60">
            Moedas em Bolsa
          </div>
          <div
            className="flex items-center gap-3 rounded-md p-3"
            style={{
              background:
                "linear-gradient(180deg, hsl(30 25% 8%), hsl(20 30% 5%))",
              boxShadow: "inset 0 0 0 1px hsl(40 50% 30%)",
            }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, hsl(50 95% 65%), hsl(35 90% 40%) 70%, hsl(25 80% 25%))",
                boxShadow:
                  "0 0 0 1px hsl(40 80% 30%), 0 0 8px hsl(40 90% 50% / 0.5)",
              }}
            >
              <Coins className="h-5 w-5 text-amber-950" />
            </div>
            <div className="flex flex-1 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/70">
                Ouro
              </span>
              <input
                type="number"
                value={Number.isFinite(inv.money) ? inv.money : 0}
                onChange={(e) =>
                  onChange({
                    ...template,
                    inventory: { ...inv, money: parseInt(e.target.value, 10) || 0 },
                  })
                }
                className="w-full bg-transparent font-mono text-lg font-bold text-amber-100 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Editor de item */}
      <Dialog open={editingPos != null} onOpenChange={(o) => !o && setEditingPos(null)}>
        <DialogContent className="max-w-xl border-border bg-card">
          <DialogHeader>
            <DialogTitle>Editar slot — pos {editingPos}</DialogTitle>
          </DialogHeader>
          {editing && (
            <ItemEditor
              item={editing}
              onChange={(next) => upsertAt(next.pos, next)}
              onRemove={() => removeAt(editing.pos)}
              peerItems={inv.items}
              onSlotsChange={setItems}
              capacity={totalSlots}
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

      {/* Limpar seção (preview + confirmação forte) */}
      <ClearSectionDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        section="inventory.items"
        preview={summarizeSection(inv.items, {
          capacity: inv.capacity,
          money: inv.money,
          hasMoney: true,
        })}
        onConfirm={({ clearMoney }) => {
          const cleared = clearItems(inv.items);
          onChange({
            ...template,
            inventory: { ...inv, items: cleared, money: clearMoney ? 0 : inv.money },
          });
          toast.success(`Inventário limpo${clearMoney ? " (incluindo dinheiro)" : ""}`);
        }}
      />
    </div>
  );
};

const Num = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) => (
  <label className="block">
    <span className="uppercase-label mb-1.5 block">{label}</span>
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-sm outline-none transition-smooth focus:border-primary"
    />
  </label>
);

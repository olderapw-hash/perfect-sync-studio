import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import type { ClsItem } from "@/types/clsconfig";
import { newEmptyItem } from "@/lib/clsconfig";
import { ItemSlot } from "./ItemSlot";
import { ItemEditor } from "./ItemEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  title: string;
  items: ClsItem[];
  onChange: (next: ClsItem[]) => void;
  /** Tamanho do grid visual (slots). Default: max(items.length, 32). */
  gridSize?: number;
}

/** Grid visual estilo PWOld — slots fixos, ícones do catálogo .tab, edição em modal. */
export const InventoryGrid = ({ title, items, onChange, gridSize }: Props) => {
  const [editingPos, setEditingPos] = useState<number | null>(null);

  const totalSlots = gridSize ?? Math.max(items.length, 32);
  const filledCount = items.filter((i) => i.id > 0).length;

  // Indexa items por pos pra renderizar a grade contínua
  const byPos = useMemo(() => {
    const m = new Map<number, ClsItem>();
    items.forEach((it) => m.set(it.pos, it));
    return m;
  }, [items]);

  const upsertAt = (pos: number, next: ClsItem) => {
    const exists = items.some((it) => it.pos === pos);
    if (exists) {
      onChange(items.map((it) => (it.pos === pos ? next : it)));
    } else {
      onChange([...items, next].sort((a, b) => a.pos - b.pos));
    }
  };

  const removeAt = (pos: number) => {
    onChange(items.filter((it) => it.pos !== pos));
    setEditingPos(null);
  };

  const openSlot = (pos: number) => {
    if (!byPos.has(pos)) {
      // cria slot vazio editável
      upsertAt(pos, newEmptyItem(pos));
    }
    setEditingPos(pos);
  };

  const editing = editingPos != null ? byPos.get(editingPos) ?? newEmptyItem(editingPos) : null;

  const addSlot = () => {
    const nextPos = totalSlots; // adiciona um slot além do atual
    upsertAt(nextPos, newEmptyItem(nextPos));
  };

  return (
    <section>
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h4 className="uppercase-label">{title}</h4>
          <span className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {filledCount}/{totalSlots}
          </span>
        </div>
        <button
          type="button"
          onClick={addSlot}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1.5 text-xs font-semibold text-foreground transition-smooth hover:border-primary/50 hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          Slot
        </button>
      </header>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-1.5 rounded-xl border border-border/60 bg-background/30 p-3">
        {Array.from({ length: totalSlots }, (_, pos) => {
          const it = byPos.get(pos) ?? newEmptyItem(pos);
          return <ItemSlot key={pos} item={it} onClick={() => openSlot(pos)} />;
        })}
      </div>

      <Dialog open={editingPos != null} onOpenChange={(o) => !o && setEditingPos(null)}>
        <DialogContent className="max-w-xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <span>Editar slot — pos {editingPos}</span>
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
    </section>
  );
};

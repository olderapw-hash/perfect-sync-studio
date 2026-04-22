import { useMemo, useState } from "react";
import { Eraser, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { ClsItem } from "@/types/clsconfig";
import { newEmptyItem } from "@/lib/clsconfig";
import { ItemSlot } from "./ItemSlot";
import { ItemEditor } from "./ItemEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  clearItems,
  summarizeSection,
  type SectionKey,
} from "@/lib/clearSection";
import { ClearSectionDialog } from "./ClearSectionDialog";

interface Props {
  title: string;
  items: ClsItem[];
  onChange: (next: ClsItem[]) => void;
  /** Tamanho do grid visual (slots). Default: max(items.length, 32). */
  gridSize?: number;
  /** Identifica a seção para o "Limpar Seção". Sem isso, o botão não aparece. */
  sectionKey?: SectionKey;
  /** Capacidade declarada (mostrada como "preservada" no preview). */
  capacity?: number;
  /** Dinheiro associado à seção (apenas para seções com money). */
  money?: number;
  /** Callback para zerar money quando o usuário marca "limpar dinheiro". */
  onClearMoney?: () => void;
}

/** Grid visual estilo PWOld — slots fixos, ícones do catálogo .tab, edição em modal. */
export const InventoryGrid = ({
  title,
  items,
  onChange,
  gridSize,
  sectionKey,
  capacity,
  money,
  onClearMoney,
}: Props) => {
  const [editingPos, setEditingPos] = useState<number | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

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

  const handleClearConfirmed = ({ clearMoney }: { clearMoney: boolean }) => {
    onChange(clearItems(items));
    if (clearMoney && onClearMoney) onClearMoney();
    toast.success(`${title} limpo${clearMoney ? " (incluindo dinheiro)" : ""}`);
  };

  const preview = summarizeSection(items, {
    capacity,
    money,
    hasMoney: money != null && !!onClearMoney,
  });

  return (
    <section>
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h4 className="uppercase-label">{title}</h4>
          <span className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {filledCount}/{totalSlots}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {sectionKey && (
            <button
              type="button"
              onClick={() => setClearOpen(true)}
              disabled={filledCount === 0 && (money ?? 0) === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1.5 text-xs font-semibold text-destructive transition-smooth hover:border-destructive/50 disabled:opacity-40 disabled:hover:border-border"
              title="Esvazia todos os slots desta seção"
            >
              <Eraser className="h-3.5 w-3.5" />
              Limpar seção
            </button>
          )}
          <button
            type="button"
            onClick={addSlot}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1.5 text-xs font-semibold text-foreground transition-smooth hover:border-primary/50 hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            Slot
          </button>
        </div>
      </header>

      {sectionKey && (
        <ClearSectionDialog
          open={clearOpen}
          onOpenChange={setClearOpen}
          section={sectionKey}
          preview={preview}
          onConfirm={handleClearConfirmed}
        />
      )}

      <div
        className="grid grid-cols-8 gap-[3px] rounded-sm p-2"
        style={{
          background: "linear-gradient(180deg, hsl(30 20% 10%), hsl(20 25% 6%))",
          boxShadow: "inset 0 0 0 1px hsl(40 50% 35%), inset 0 0 12px hsl(0 0% 0% / 0.8)",
        }}
      >
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
              peerItems={items}
              onSlotsChange={onChange}
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
    </section>
  );
};

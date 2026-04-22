import { Plus } from "lucide-react";
import type { ClsItem } from "@/types/clsconfig";
import { newEmptyItem } from "@/lib/clsconfig";
import { ItemEditor } from "./ItemEditor";

interface Props {
  title: string;
  items: ClsItem[];
  onChange: (next: ClsItem[]) => void;
}

export const ItemList = ({ title, items, onChange }: Props) => {
  const filledCount = items.filter((i) => i.id > 0).length;

  const updateAt = (idx: number, next: ClsItem) =>
    onChange(items.map((it, i) => (i === idx ? next : it)));
  const removeAt = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const add = () => {
    const nextPos = items.reduce((m, it) => Math.max(m, it.pos), -1) + 1;
    onChange([...items, newEmptyItem(nextPos)]);
  };

  return (
    <section>
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h4 className="uppercase-label">{title}</h4>
          <span className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {filledCount}/{items.length}
          </span>
        </div>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1.5 text-xs font-semibold text-foreground transition-smooth hover:border-primary/50 hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar
        </button>
      </header>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-background/30 p-6 text-center text-xs text-muted-foreground">
          Sem itens nesta lista.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {items.map((it, i) => (
            <ItemEditor
              key={`${it.pos}-${i}`}
              item={it}
              onChange={(next) => updateAt(i, next)}
              onRemove={() => removeAt(i)}
              peerItems={items}
              onSlotsChange={onChange}
            />
          ))}
        </div>
      )}
    </section>
  );
};

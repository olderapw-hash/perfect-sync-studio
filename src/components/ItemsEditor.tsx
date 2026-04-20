import { useState, KeyboardEvent } from "react";
import { X, Plus, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ItemsEditorProps {
  items: number[];
  onChange: (items: number[]) => void;
}

export const ItemsEditor = ({ items, onChange }: ItemsEditorProps) => {
  const [draft, setDraft] = useState("");

  const addItem = () => {
    const n = parseInt(draft, 10);
    if (!Number.isFinite(n) || n <= 0) return;
    onChange([...items, n]);
    setDraft("");
  };

  const removeAt = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 uppercase-label">
          <Package className="h-3 w-3" />
          Itens iniciais
        </label>
        <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-bold text-primary">
          {items.length}
        </span>
      </div>
      <div
        className={cn(
          "flex min-h-[48px] flex-wrap gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-2",
          "transition-smooth focus-within:border-primary focus-within:bg-white/[0.06]"
        )}
      >
        {items.map((id, idx) => (
          <span
            key={`${id}-${idx}`}
            className="group inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm font-bold"
          >
            <span className="font-mono text-primary">#{id}</span>
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="rounded-sm p-0.5 text-muted-foreground opacity-70 transition-smooth hover:bg-destructive/20 hover:text-destructive hover:opacity-100"
              aria-label={`Remover item ${id}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="flex flex-1 items-center gap-1 min-w-[120px]">
          <input
            type="number"
            inputMode="numeric"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            placeholder="ID do item"
            className="flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground/50"
          />
          <button
            type="button"
            onClick={addItem}
            disabled={!draft}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary transition-smooth hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
            aria-label="Adicionar item"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Digite o ID e pressione Enter.
      </p>
    </div>
  );
};

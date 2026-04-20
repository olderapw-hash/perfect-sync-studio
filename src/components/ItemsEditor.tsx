import { useState, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
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
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Itens iniciais
      </label>
      <div
        className={cn(
          "flex min-h-[44px] flex-wrap gap-1.5 rounded-md border border-border bg-input/60 p-2",
          "focus-within:border-primary/60 focus-within:shadow-glow transition-smooth"
        )}
      >
        {items.map((id, idx) => (
          <span
            key={`${id}-${idx}`}
            className="group inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm font-medium text-secondary-foreground ring-1 ring-border"
          >
            <span className="font-mono text-accent">#{id}</span>
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
            className="flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground/60"
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
        Digite o ID do item e pressione Enter para adicionar.
      </p>
    </div>
  );
};

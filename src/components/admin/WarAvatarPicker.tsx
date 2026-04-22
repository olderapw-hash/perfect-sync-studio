import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useItemCatalog } from "@/context/ItemCatalogContext";
import type { ItemMeta } from "@/lib/itemTab";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Chamada quando o usuário escolhe um item do catálogo. */
  onPick: (meta: ItemMeta) => void;
  /** Slot/contexto sendo editado — exibido no header. */
  contextLabel?: string;
}

/**
 * Seletor visual de "War Avatars" do catálogo .tab.
 *
 * Heurística de filtragem (sem categoria explícita no .tab):
 *   - nome OU descrição contém "avatar" (case-insensitive), OU
 *   - nome contém "war avatar" / "guerra"
 * Caixa de busca refina por nome/id digitado.
 */
export const WarAvatarPicker = ({ open, onClose, onPick, contextLabel }: Props) => {
  const { items, iconUrlFor, catalog, loading } = useItemCatalog();
  const [query, setQuery] = useState("");

  // Lista base: tudo que parece War Avatar / Avatar.
  const baseList = useMemo(() => {
    const out: ItemMeta[] = [];
    for (const meta of items.values()) {
      const name = (meta.name || "").toLowerCase();
      const desc = (meta.descriptionRaw || "").toLowerCase();
      if (
        name.includes("avatar") ||
        desc.includes("war avatar") ||
        name.includes("war avatar")
      ) {
        out.push(meta);
      }
    }
    // Ordena por nome para visualização estável.
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  // Filtro do input.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return baseList;
    const asId = parseInt(q, 10);
    return baseList.filter((m) => {
      if (Number.isFinite(asId) && m.id === asId) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.descriptionRaw || "").toLowerCase().includes(q)
      );
    });
  }, [baseList, query]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl border-border bg-card p-0">
        <DialogHeader className="border-b border-border px-5 py-3">
          <DialogTitle className="flex items-center justify-between gap-3">
            <span className="flex items-baseline gap-2">
              <span>Escolher War Avatar</span>
              {contextLabel && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({contextLabel})
                </span>
              )}
            </span>
            <span className="rounded-full bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              {filtered.length} / {baseList.length}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 border-b border-border px-5 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou ID…"
            className="w-full bg-transparent py-1 text-sm outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Carregando catálogo…
            </p>
          ) : !catalog ? (
            <p className="py-12 text-center text-sm text-amber-300">
              Nenhum catálogo .tab ativo. Importe um em Catálogo de itens.
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhum War Avatar encontrado{query ? ` para "${query}"` : ""}.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {filtered.slice(0, 200).map((meta) => (
                <li key={meta.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick(meta);
                      onClose();
                    }}
                    className="group flex w-full items-center gap-3 rounded-md border border-transparent bg-background/40 px-2 py-2 text-left transition-smooth hover:border-primary/50 hover:bg-background/70"
                  >
                    <div
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-[3px]"
                      style={{
                        backgroundImage:
                          "linear-gradient(145deg, hsl(0 0% 6%), hsl(0 0% 12%))",
                        boxShadow: `inset 0 0 0 1px ${meta.color || "hsl(40 55% 45%)"}, 0 0 0 1px hsl(0 0% 0%)`,
                      }}
                    >
                      <img
                        src={iconUrlFor(meta.id)}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                        }}
                        className="h-[88%] w-[88%] object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-sm font-semibold"
                        style={{ color: meta.color || "hsl(45 90% 75%)" }}
                        title={meta.name}
                      >
                        {meta.name || `Item ${meta.id}`}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        id {meta.id}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {filtered.length > 200 && (
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Mostrando os primeiros 200. Refine a busca para ver mais.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

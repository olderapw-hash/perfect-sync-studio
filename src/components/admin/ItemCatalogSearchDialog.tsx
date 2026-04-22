import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, AlertCircle, Package, Database, Cloud } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pwApi, EndpointMissingError, type CatalogItem } from "@/lib/pwApiActions";
import { useItemCatalog } from "@/context/ItemCatalogContext";
import type { ItemMeta } from "@/lib/itemTab";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Quando o usuário escolhe um item, devolve o id (e meta) para o caller. */
  onPick?: (item: CatalogItem) => void;
}

/** Origem do match exibido na lista. */
type ResultSource = "tab" | "vps" | "fallback_id";

interface ResultItem extends CatalogItem {
  /** Origem do dado para UI/aviso. */
  __source: ResultSource;
}

const TAB_LIMIT = 30;

/** Converte um ItemMeta da .tab no shape CatalogItem usado pelo caller. */
function metaToCatalogItem(meta: ItemMeta): ResultItem {
  return {
    id: meta.id,
    name: meta.name || `Item ${meta.id}`,
    // .tab atual não traz max_count/proctype/etc — caller usa fallbacks (1/0/"")
    __source: "tab",
  };
}

export const ItemCatalogSearchDialog = ({ open, onOpenChange, onPick }: Props) => {
  const { items: tabItems, catalog, loading: catalogLoading } = useItemCatalog();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [endpointMissing, setEndpointMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedFromVps, setSearchedFromVps] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setError(null);
      setEndpointMissing(false);
      setSearchedFromVps(false);
    }
  }, [open]);

  // Busca: primeiro .tab, fallback VPS apenas para ID exato.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setSearchedFromVps(false);
      return;
    }
    const isIdOnly = /^\d+$/.test(q);
    if (!isIdOnly && q.length < 2) {
      setResults([]);
      setSearchedFromVps(false);
      return;
    }

    const t = setTimeout(async () => {
      setError(null);
      setSearchedFromVps(false);

      // 1) Busca local na .tab importada.
      const local: ResultItem[] = [];
      if (isIdOnly) {
        const id = parseInt(q, 10);
        const meta = tabItems.get(id);
        if (meta) local.push(metaToCatalogItem(meta));
      } else {
        const needle = q.toLowerCase();
        for (const meta of tabItems.values()) {
          if ((meta.name || "").toLowerCase().includes(needle)) {
            local.push(metaToCatalogItem(meta));
            if (local.length >= TAB_LIMIT) break;
          }
        }
        // ordena por nome para visualização estável
        local.sort((a, b) => a.name.localeCompare(b.name));
      }

      if (local.length > 0) {
        setResults(local);
        return;
      }

      // 2) Sem match local. Fallback VPS só para ID exato (evita visibleid match parcial).
      if (!isIdOnly) {
        setResults([]);
        return;
      }
      if (endpointMissing) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await pwApi.getItemCatalog({ id: q, limit: 1 });
        const fetched = Array.isArray(res?.items) ? res.items : [];
        setSearchedFromVps(true);
        setResults(
          fetched.map<ResultItem>((it) => ({
            ...it,
            __source: it.source === "fallback_id" ? "fallback_id" : "vps",
          })),
        );
      } catch (e) {
        if (e instanceof EndpointMissingError) {
          setEndpointMissing(true);
          setResults([]);
        } else {
          setError(e instanceof Error ? e.message : String(e));
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, open, endpointMissing, tabItems]);

  const handlePick = (item: ResultItem) => {
    // Remove campo interno antes de devolver ao caller.
    const { __source, ...clean } = item;
    onPick?.(clean);

    if (__source === "fallback_id") {
      toast.warning(
        `Item ${item.id} encontrado apenas por ID; dados avançados não vieram da tabela.`,
      );
    } else {
      toast.success(`Item selecionado: ${item.name} (id ${item.id})`);
    }
    onOpenChange(false);
  };

  const placeholder = useMemo(() => {
    if (catalogLoading) return "Carregando catálogo .tab…";
    if (!catalog) return "Sem .tab ativa — só ID exato (fallback VPS)";
    return "Digite ID exato (números) ou nome (mín. 2 chars)";
  }, [catalog, catalogLoading]);

  const queryTrim = query.trim();
  const isIdOnly = /^\d+$/.test(queryTrim);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Buscar Item
          </DialogTitle>
          <DialogDescription>
            Pesquisa primeiro no <code className="font-mono">elements.data .tab</code>{" "}
            importado; quando não houver match, faz fallback por ID na VPS
            (<code className="font-mono">getItemCatalog</code>).
          </DialogDescription>
        </DialogHeader>

        {!catalog && !catalogLoading && (
          <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground">
            <div className="flex items-center gap-2 font-semibold text-warning">
              <AlertCircle className="h-3.5 w-3.5" />
              Nenhum catálogo .tab ativo
            </div>
            <p className="mt-1 text-muted-foreground">
              Importe o <code className="font-mono">elements.data .tab</code> em{" "}
              <em>Catálogo de itens</em> para habilitar busca por nome. Sem ele só ID
              exato funciona (via fallback VPS).
            </p>
          </div>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-9"
            autoFocus
          />
          {(loading || catalogLoading) && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {endpointMissing && (
          <div className="rounded-md border border-warning/40 bg-warning/10 p-2 text-[11px] text-warning-foreground">
            Fallback VPS indisponível (<code className="font-mono">getItemCatalog</code>{" "}
            não respondeu). Apenas itens da .tab estão acessíveis.
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {catalog
              ? `${tabItems.size.toLocaleString("pt-BR")} itens na .tab ativa`
              : "Sem .tab ativa"}
          </span>
          {searchedFromVps && results.length > 0 && (
            <span className="inline-flex items-center gap-1 text-warning">
              <Cloud className="h-3 w-3" /> resultado da VPS
            </span>
          )}
          {!searchedFromVps && results.length > 0 && (
            <span className="inline-flex items-center gap-1 text-primary">
              <Database className="h-3 w-3" /> resultado da .tab
            </span>
          )}
        </div>

        <div className="max-h-[50vh] overflow-y-auto rounded-md border border-border">
          {results.length === 0 && !loading ? (
            <p className="p-4 text-center text-xs text-muted-foreground">
              {queryTrim.length === 0
                ? "Digite um ID ou parte do nome."
                : !isIdOnly && queryTrim.length < 2
                  ? "Digite pelo menos 2 caracteres."
                  : "Nenhum item encontrado."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {results.map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(it)}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted font-mono text-[11px]">
                      {it.id}
                    </span>
                    <span className="flex-1 truncate">{it.name}</span>
                    {it.__source === "fallback_id" && (
                      <span
                        title="Item encontrado apenas por ID; dados avançados não vieram da tabela."
                        className="rounded border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-warning"
                      >
                        fallback
                      </span>
                    )}
                    {it.__source === "vps" && (
                      <span
                        title="Resultado vindo da VPS (não estava na .tab)."
                        className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
                      >
                        vps
                      </span>
                    )}
                    {it.tier != null && it.tier > 0 && (
                      <span className="text-[11px] text-muted-foreground">tier {it.tier}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

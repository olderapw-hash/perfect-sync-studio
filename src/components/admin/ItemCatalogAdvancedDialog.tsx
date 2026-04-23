// Catálogo de Itens Avançado.
//
// Substitui ItemCatalogSearchDialog. Características:
//   - 3 abas: Buscar / Favoritos / Recentes
//   - Busca por id (numérico) ou nome (texto), debounce 300ms
//   - Resultado mostra: ícone, nome, id, max_count (quando disponível),
//     origem (.tab / VPS / fallback) e botões: Favoritar (estrela) e Adicionar
//   - Clicar em "Adicionar" abre o ItemInsertModal — caller decide o que
//     fazer com o resultado (atualizar template em memória, atualizar kit, ...)
//
// IMPORTANTE: este componente NUNCA dispara save automático.
// O caller é quem aplica o item ao estado e o usuário salva pelo fluxo normal.
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Cloud,
  Database,
  Loader2,
  Package,
  Plus,
  Search,
  Star,
  History,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useItemCatalog } from "@/context/ItemCatalogContext";
import { useItemFavorites } from "@/hooks/useItemFavorites";
import { useItemRecents } from "@/hooks/useItemRecents";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { pwApi, EndpointMissingError, type CatalogItem } from "@/lib/pwApiActions";
import type { ItemMeta } from "@/lib/itemTab";
import {
  ItemInsertModal,
  type InsertContextMap,
  type InsertDestination,
  type InsertResult,
} from "./ItemInsertModal";

type ResultSource = "tab" | "vps" | "fallback_id";

interface ResultItem extends CatalogItem {
  __source: ResultSource;
}

const TAB_LIMIT = 30;

function metaToCatalog(meta: ItemMeta): ResultItem {
  return {
    id: meta.id,
    name: meta.name || `Item ${meta.id}`,
    __source: "tab",
  };
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /**
   * Contextos (seções) onde o item pode ser inserido. Vazio → modo
   * "browse only" (sem botão adicionar — só busca + favoritar).
   */
  contexts?: InsertContextMap;
  /** Destino default (primeiro habilitado se não informado). */
  defaultDestination?: InsertDestination;
  /**
   * Callback chamado com o pedido de inserção. O caller é responsável
   * por aplicar ao seu estado (template/kit/role). Se não fornecido,
   * o botão "Adicionar" fica desabilitado.
   */
  onInsert?: (result: InsertResult) => void;
}

export const ItemCatalogAdvancedDialog = ({
  open,
  onOpenChange,
  contexts,
  defaultDestination,
  onInsert,
}: Props) => {
  const { items: tabItems, catalog, loading: catalogLoading, iconUrlFor } = useItemCatalog();
  const { tenantId } = useServerPermissions();
  const favs = useItemFavorites(tenantId);
  const recents = useItemRecents(tenantId);

  const [tab, setTab] = useState<"search" | "favs" | "recents">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [endpointMissing, setEndpointMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedFromVps, setSearchedFromVps] = useState(false);

  const [insertSource, setInsertSource] = useState<CatalogItem | null>(null);
  const [insertOpen, setInsertOpen] = useState(false);

  const hasContexts = !!contexts && Object.values(contexts).some(Boolean);
  const canInsert = hasContexts && !!onInsert;

  // Reset on open
  useEffect(() => {
    if (open) {
      setTab("search");
      setQuery("");
      setResults([]);
      setError(null);
      setEndpointMissing(false);
      setSearchedFromVps(false);
    }
  }, [open]);

  // Debounced search (300ms) — .tab primeiro, fallback VPS por id exato.
  useEffect(() => {
    if (!open || tab !== "search") return;
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

      // 1) Local na .tab
      const local: ResultItem[] = [];
      if (isIdOnly) {
        const id = parseInt(q, 10);
        const meta = tabItems.get(id);
        if (meta) local.push(metaToCatalog(meta));
      } else {
        const needle = q.toLowerCase();
        for (const meta of tabItems.values()) {
          if ((meta.name || "").toLowerCase().includes(needle)) {
            local.push(metaToCatalog(meta));
            if (local.length >= TAB_LIMIT) break;
          }
        }
        local.sort((a, b) => a.name.localeCompare(b.name));
      }
      if (local.length > 0) {
        setResults(local);
        return;
      }

      // 2) Fallback VPS — só por ID exato
      if (!isIdOnly || endpointMissing) {
        setResults([]);
        return;
      }
      setSearching(true);
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
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, open, tab, endpointMissing, tabItems]);

  const queryTrim = query.trim();
  const isIdOnly = /^\d+$/.test(queryTrim);

  const placeholder = useMemo(() => {
    if (catalogLoading) return "Carregando catálogo .tab…";
    if (!catalog) return "Sem .tab ativa — só ID exato (fallback VPS)";
    return "Digite ID exato (números) ou nome (mín. 2 chars)";
  }, [catalog, catalogLoading]);

  const handleAdd = (item: CatalogItem) => {
    if (!canInsert) {
      toast.warning("Sem destino para adicionar — abra o catálogo de dentro do editor.");
      return;
    }
    setInsertSource(item);
    setInsertOpen(true);
  };

  const handleInsertConfirm = (res: InsertResult) => {
    onInsert?.(res);
    // Recentes
    recents.push({
      id: res.item.id,
      name: insertSource?.name ?? `Item ${res.item.id}`,
      iconPath: insertSource?.icon_path,
      maxCount: insertSource?.max_count ?? insertSource?.stack_max,
    });
    toast.success(`Item ${res.item.id} adicionado em pos ${res.item.pos}`);
    setInsertSource(null);
  };

  const handleToggleFav = async (item: CatalogItem) => {
    try {
      await favs.toggle({
        itemId: item.id,
        name: item.name,
        iconPath: item.icon_path,
        maxCount: item.max_count ?? item.stack_max,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao favoritar");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Catálogo de Itens
            </DialogTitle>
            <DialogDescription>
              Busca primeiro no <code className="font-mono">elements.data .tab</code>;
              fallback VPS por ID exato. Favorite itens para acesso rápido.
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
                <em>Catálogo de itens</em> para habilitar busca por nome.
              </p>
            </div>
          )}

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search">
                <Search className="mr-1.5 h-3.5 w-3.5" /> Buscar
              </TabsTrigger>
              <TabsTrigger value="favs">
                <Star className="mr-1.5 h-3.5 w-3.5" />
                Favoritos {favs.items.length > 0 && `(${favs.items.length})`}
              </TabsTrigger>
              <TabsTrigger value="recents">
                <History className="mr-1.5 h-3.5 w-3.5" />
                Recentes {recents.items.length > 0 && `(${recents.items.length})`}
              </TabsTrigger>
            </TabsList>

            {/* ───────────── BUSCAR ───────────── */}
            <TabsContent value="search" className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="pl-9"
                  autoFocus
                />
                {(searching || catalogLoading) && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>

              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                  {error}
                </div>
              )}
              {endpointMissing && (
                <div className="rounded-md border border-warning/40 bg-warning/10 p-2 text-[11px] text-warning-foreground">
                  Fallback VPS indisponível. Apenas itens da .tab estão acessíveis.
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {catalog
                    ? `${tabItems.size.toLocaleString("pt-BR")} itens na .tab`
                    : "Sem .tab ativa"}
                </span>
                {results.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    {searchedFromVps ? (
                      <>
                        <Cloud className="h-3 w-3 text-warning" /> resultado da VPS
                      </>
                    ) : (
                      <>
                        <Database className="h-3 w-3 text-primary" /> resultado da .tab
                      </>
                    )}
                  </span>
                )}
              </div>

              <ResultList
                items={results}
                emptyText={
                  queryTrim.length === 0
                    ? "Digite um ID ou parte do nome."
                    : !isIdOnly && queryTrim.length < 2
                      ? "Digite pelo menos 2 caracteres."
                      : "Nenhum item encontrado."
                }
                isFavorite={favs.isFavorite}
                onToggleFav={handleToggleFav}
                onAdd={handleAdd}
                canInsert={canInsert}
                iconUrlFor={iconUrlFor}
              />
            </TabsContent>

            {/* ───────────── FAVORITOS ───────────── */}
            <TabsContent value="favs" className="space-y-2">
              {!tenantId ? (
                <p className="rounded-md border border-border bg-background/40 p-3 text-center text-xs text-muted-foreground">
                  Selecione um servidor para usar favoritos.
                </p>
              ) : favs.loading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : favs.error ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                  {favs.error}
                </div>
              ) : (
                <ResultList
                  items={favs.items.map<ResultItem>((f) => ({
                    id: f.item_id,
                    name: f.name ?? `Item ${f.item_id}`,
                    icon_path: f.icon_path ?? undefined,
                    max_count: f.max_count ?? undefined,
                    __source: "tab",
                  }))}
                  emptyText="Nenhum favorito ainda. Clique na estrela ao buscar para adicionar."
                  isFavorite={favs.isFavorite}
                  onToggleFav={handleToggleFav}
                  onAdd={handleAdd}
                  canInsert={canInsert}
                  iconUrlFor={iconUrlFor}
                />
              )}
            </TabsContent>

            {/* ───────────── RECENTES ───────────── */}
            <TabsContent value="recents" className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  Últimos {recents.items.length} itens adicionados (local).
                </span>
                {recents.items.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={recents.clear}>
                    <Trash2 className="h-3 w-3" /> limpar
                  </Button>
                )}
              </div>
              <ResultList
                items={recents.items.map<ResultItem>((r) => ({
                  id: r.id,
                  name: r.name,
                  icon_path: r.iconPath,
                  max_count: r.maxCount,
                  __source: "tab",
                }))}
                emptyText="Nenhum item recente. Adicione algo para começar."
                isFavorite={favs.isFavorite}
                onToggleFav={handleToggleFav}
                onAdd={handleAdd}
                canInsert={canInsert}
                iconUrlFor={iconUrlFor}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-3.5 w-3.5" /> Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ItemInsertModal
        open={insertOpen}
        onOpenChange={(v) => {
          setInsertOpen(v);
          if (!v) setInsertSource(null);
        }}
        source={insertSource}
        contexts={contexts ?? {}}
        defaultDestination={defaultDestination}
        onInsert={handleInsertConfirm}
      />
    </>
  );
};

// ────────────────────────────────────────────────────────────
// Subcomponente: lista de resultados (compartilhada entre as 3 abas)
// ────────────────────────────────────────────────────────────

interface ResultListProps {
  items: ResultItem[];
  emptyText: string;
  isFavorite: (id: number) => boolean;
  onToggleFav: (it: CatalogItem) => void;
  onAdd: (it: CatalogItem) => void;
  canInsert: boolean;
  iconUrlFor: (id: number) => string;
}

const ResultList = ({
  items,
  emptyText,
  isFavorite,
  onToggleFav,
  onAdd,
  canInsert,
  iconUrlFor,
}: ResultListProps) => {
  if (items.length === 0) {
    return (
      <p className="p-4 text-center text-xs text-muted-foreground">{emptyText}</p>
    );
  }
  return (
    <ul className="max-h-[40vh] divide-y divide-border overflow-y-auto rounded-md border border-border">
      {items.map((it) => {
        const fav = isFavorite(it.id);
        const iconUrl = it.icon_path ? undefined : iconUrlFor(it.id);
        return (
          <li
            key={it.id}
            className="flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-accent/40"
          >
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded bg-muted">
              <img
                src={iconUrl}
                alt=""
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                }}
                className="h-full w-full object-contain"
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-muted-foreground">
                {it.id}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-foreground">{it.name}</div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="font-mono">id {it.id}</span>
                {(it.max_count ?? it.stack_max) != null && (
                  <span>max {it.max_count ?? it.stack_max}</span>
                )}
                {it.type && <span className="rounded bg-muted px-1">{it.type}</span>}
                {it.__source === "fallback_id" && (
                  <span className="rounded border border-warning/40 bg-warning/10 px-1 text-warning">
                    fallback
                  </span>
                )}
                {it.__source === "vps" && (
                  <span className="rounded border border-border bg-muted px-1">vps</span>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onToggleFav(it)}
              title={fav ? "Remover dos favoritos" : "Favoritar"}
            >
              <Star
                className={`h-3.5 w-3.5 ${fav ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
              />
            </Button>
            <Button
              size="sm"
              onClick={() => onAdd(it)}
              disabled={!canInsert}
              title={canInsert ? "Adicionar item" : "Abra de dentro do editor para adicionar"}
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </Button>
          </li>
        );
      })}
    </ul>
  );
};

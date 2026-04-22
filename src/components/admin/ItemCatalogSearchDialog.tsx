import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, AlertCircle, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pwApi, EndpointMissingError, type CatalogItem } from "@/lib/pwApiActions";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Quando o usuário escolhe um item, devolve o id (e meta) para o caller. */
  onPick?: (item: CatalogItem) => void;
}

export const ItemCatalogSearchDialog = ({ open, onOpenChange, onPick }: Props) => {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [endpointMissing, setEndpointMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setItems([]);
      setError(null);
      setEndpointMissing(false);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open || endpointMissing) return;
    const q = query.trim();
    if (q.length < 1) {
      setItems([]);
      return;
    }
    // ID puro → busca exata por id; senão busca textual (mín. 2 chars).
    const isIdOnly = /^\d+$/.test(q);
    if (!isIdOnly && q.length < 2) {
      setItems([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = isIdOnly
          ? await pwApi.getItemCatalog({ id: q, limit: 1 })
          : await pwApi.getItemCatalog({ q, limit: 20 });
        setItems(Array.isArray(res?.items) ? res.items : []);
      } catch (e) {
        if (e instanceof EndpointMissingError) {
          setEndpointMissing(true);
          setItems([]);
        } else {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query, open, endpointMissing]);

  const handlePick = (item: CatalogItem) => {
    onPick?.(item);
    if (item.source === "fallback_id") {
      toast.warning(
        `Item ${item.id} encontrado por fallback; nome/dados avançados não vieram do catálogo.`,
      );
    } else {
      toast.success(`Item selecionado: ${item.name} (id ${item.id})`);
    }
    onOpenChange(false);
  };

  const placeholder = useMemo(
    () => (endpointMissing ? "Catálogo desabilitado" : "Digite ID exato (números) ou nome (mín. 2 chars)"),
    [endpointMissing],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Buscar Item
          </DialogTitle>
          <DialogDescription>
            Consulta o catálogo de itens do servidor (action <code className="font-mono">getItemCatalog</code>).
          </DialogDescription>
        </DialogHeader>

        {endpointMissing ? (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
            <div className="flex items-center gap-2 font-semibold text-warning">
              <AlertCircle className="h-4 w-4" />
              Catálogo de itens ainda não conectado à VPS
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              O endpoint <code className="font-mono">?action=getItemCatalog</code> precisa ser
              implementado no <code className="font-mono">apicls/api_cls.php</code>. Contrato em{" "}
              <code className="font-mono">docs/api-contract.md</code>. Enquanto isso, edite os itens
              digitando o ID manualmente nas abas de Inventário/Equipamento/Baú.
            </p>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="pl-9"
                autoFocus
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            )}

            <div className="max-h-[50vh] overflow-y-auto rounded-md border border-border">
              {items.length === 0 && !loading ? (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  {query.trim().length === 0
                    ? "Digite um ID ou parte do nome."
                    : !/^\d+$/.test(query.trim()) && query.trim().length < 2
                      ? "Digite pelo menos 2 caracteres."
                      : "Nenhum item encontrado."}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((it) => (
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
                        {it.source === "fallback_id" && (
                          <span
                            title="ID encontrado por fallback; nome/dados avançados não vieram do catálogo."
                            className="rounded border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-warning"
                          >
                            fallback
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
          </>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// /admin/templates — Editor de templates iniciais (CLS).
// Renderiza a lista de classes como uma COLUNA INTERNA da página
// (não como uma Sidebar shadcn — isso entraria em conflito com a
// AdminSidebar do AdminLayout, que já controla o SidebarProvider).
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Archive,
  Database,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { useClsconfig } from "@/hooks/useClsconfig";
import { ClsconfigEditor } from "@/components/admin/ClsconfigEditor";
import { ClsconfigList } from "@/components/admin/ClsconfigList";
import { HistoryDrawer } from "@/components/admin/HistoryDrawer";
import { BackupsDialog } from "@/components/admin/BackupsDialog";
import { ItemCatalogAdvancedDialog } from "@/components/admin/ItemCatalogAdvancedDialog";
import { ItemCatalogManager } from "@/components/admin/ItemCatalogManager";

const TemplatesPage = () => {
  const { data, raw, loading, error, reload } = useClsconfig();
  const [selected, setSelected] = useState<string | null>(null);
  const [backupsOpen, setBackupsOpen] = useState(false);
  const [searchItemOpen, setSearchItemOpen] = useState(false);

  useEffect(() => {
    if (data?.entries.length && !selected) {
      setSelected(data.entries[0].key_hex);
    }
  }, [data, selected]);

  const entry = data?.entries.find((e) => e.key_hex === selected) ?? null;
  const isEmpty = !loading && !error && data && data.entries.length === 0;

  return (
    <div className="flex h-full w-full">
      {/* Coluna interna: lista de classes/templates */}
      <aside className="flex w-[300px] shrink-0 flex-col border-r border-border bg-card/40 backdrop-blur-md">
        <div className="flex h-10 items-center gap-2 border-b border-border px-3 text-xs font-extrabold uppercase tracking-wider text-foreground">
          <Search className="h-3.5 w-3.5 text-primary" />
          Templates CLS
        </div>
        <div className="flex-1 overflow-y-auto">
          <ClsconfigList
            entries={data?.entries ?? []}
            classes={data?.classes ?? []}
            usedClasses={data?.used_classes ?? []}
            selectedKey={selected}
            onSelect={setSelected}
            loading={loading}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Toolbar interna da página */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card/40 px-4 py-2">
          <h2 className="mr-2 text-xs font-extrabold uppercase tracking-wider text-foreground">
            Editor de Templates
          </h2>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSearchItemOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs transition-smooth hover:border-primary/50"
              title="Buscar item no catálogo"
            >
              <Search className="h-3.5 w-3.5" />
              Item
            </button>
            <button
              onClick={() => setBackupsOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs transition-smooth hover:border-primary/50"
              title="Listar backups"
            >
              <Archive className="h-3.5 w-3.5" />
              Backups
            </button>
            <ItemCatalogManager />
            <HistoryDrawer />
            <button
              onClick={reload}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs transition-smooth hover:border-primary/50 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Recarregar
            </button>
          </div>
        </div>

        <section className="flex-1 overflow-hidden">
          {error ? (
            <div className="m-6 overflow-auto rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4" />
                Erro ao carregar clsconfig
              </div>
              <pre className="mt-2 whitespace-pre-wrap break-all rounded-md bg-background/40 p-3 text-xs text-destructive/90">
                {error}
              </pre>
            </div>
          ) : loading && !data ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : isEmpty ? (
            <div className="m-6 overflow-auto rounded-xl border border-border bg-card/40 p-6 text-sm">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Database className="h-4 w-4 text-primary" />
                Nenhum template retornado (count = 0)
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                O endpoint{" "}
                <code className="font-mono">
                  /apicls/api_cls.php?action=getClsconfig
                </code>{" "}
                respondeu com sucesso, mas{" "}
                <code className="font-mono">entries</code> está vazio.
              </p>
              <pre className="mt-4 max-h-[60vh] overflow-auto rounded-md bg-background/60 p-3 font-mono text-[11px] text-foreground/80">
                {JSON.stringify(raw, null, 2)}
              </pre>
            </div>
          ) : entry ? (
            <ClsconfigEditor
              entry={entry}
              allEntries={data?.entries ?? []}
              onReload={reload}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Selecione um template à esquerda para editar.
            </div>
          )}
        </section>
      </div>

      <BackupsDialog
        open={backupsOpen}
        onOpenChange={setBackupsOpen}
        onRestored={reload}
      />
      <ItemCatalogAdvancedDialog
        open={searchItemOpen}
        onOpenChange={setSearchItemOpen}
      />
    </div>
  );
};

export default TemplatesPage;

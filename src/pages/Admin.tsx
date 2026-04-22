import { useEffect, useState } from "react";
import { AlertCircle, Database, Loader2, LogOut, RefreshCw, Shield } from "lucide-react";
import { useClsconfig } from "@/hooks/useClsconfig";
import { useAuth } from "@/hooks/useAuth";
import { ClsconfigEditor } from "@/components/admin/ClsconfigEditor";
import { ItemCatalogManager } from "@/components/admin/ItemCatalogManager";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { HistoryDrawer } from "@/components/admin/HistoryDrawer";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const Admin = () => {
  const { data, raw, loading, error, reload } = useClsconfig();
  const { user, signOut } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (data?.entries.length && !selected) {
      setSelected(data.entries[0].key_hex);
    }
  }, [data, selected]);

  const entry = data?.entries.find((e) => e.key_hex === selected) ?? null;
  const isEmpty = !loading && !error && data && data.entries.length === 0;

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full bg-hero">
        <AdminSidebar
          entries={data?.entries ?? []}
          classes={data?.classes ?? []}
          usedClasses={data?.used_classes ?? []}
          selectedKey={selected}
          onSelect={setSelected}
          loading={loading}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="flex items-center gap-3 border-b border-border bg-card/60 px-5 py-3 backdrop-blur-md">
            <SidebarTrigger className="-ml-1" />
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
                Admin · clsconfig
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Editor de templates iniciais — Perfect World
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="rounded-full bg-success/15 px-3 py-1 text-[11px] font-medium text-success">
                Edge proxy ativo
              </span>
              <ItemCatalogManager />
              <HistoryDrawer />
              <button
                onClick={reload}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-xs transition-smooth hover:border-primary/50 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Recarregar
              </button>
              {user && (
                <span className="hidden text-[11px] text-muted-foreground sm:inline" title={user.email ?? ""}>
                  {user.email}
                </span>
              )}
              <button
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-xs transition-smooth hover:border-destructive/50 hover:text-destructive"
                title="Sair"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </div>
          </header>

          {/* Editor */}
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
                <p className="mt-3 text-xs text-destructive/70">
                  Endpoint: <code className="font-mono">/apicls/api_cls.php?action=getClsconfig</code>{" "}
                  — secret enviado server-side via header{" "}
                  <code className="font-mono">x-sync-secret</code>. Confirme{" "}
                  <code className="font-mono">PW_API_BASE_URL</code> (domínio/base) e{" "}
                  <code className="font-mono">PW_API_SECRET</code> nas configurações do backend.
                </p>
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
                  O endpoint <code className="font-mono">/apicls/api_cls.php?action=getClsconfig</code>{" "}
                  respondeu com sucesso, mas <code className="font-mono">entries</code> está vazio.
                </p>
                <div className="mt-4">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    JSON bruto (debug)
                  </div>
                  <pre className="max-h-[60vh] overflow-auto rounded-md bg-background/60 p-3 font-mono text-[11px] text-foreground/80">
                    {JSON.stringify(raw, null, 2)}
                  </pre>
                </div>
              </div>
            ) : entry ? (
              <ClsconfigEditor entry={entry} allEntries={data?.entries ?? []} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Selecione um template à esquerda para editar.
              </div>
            )}
          </section>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;

// Card mostrando a release atual publicada pelo superadmin no topo da
// página /install — permite o usuário baixar o pacote oficial mais recente.
import { useEffect } from "react";
import { Download, Package, Sparkles } from "lucide-react";
import { useInstallerRelease } from "@/hooks/useInstallerRelease";

const formatBytes = (n: number | null) => {
  if (!n) return "";
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

export const CurrentReleaseCard = () => {
  const { current, hasUpdate, markSeen } = useInstallerRelease();

  // Marca como visto ao abrir a página (já que o usuário está vendo o release).
  useEffect(() => {
    if (current) markSeen(current.version);
  }, [current, markSeen]);

  if (!current) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      <div className="flex flex-wrap items-start gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/20">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-foreground">
              Pacote oficial do installer
            </h2>
            <span className="rounded-md bg-primary/20 px-2 py-0.5 font-mono text-xs font-bold text-primary">
              v{current.version}
            </span>
            {hasUpdate && (
              <span className="inline-flex items-center gap-1 rounded-md bg-success/20 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
                <Sparkles className="h-3 w-3" /> Novo
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Publicado em {new Date(current.published_at).toLocaleString()}
            {current.file_size_bytes ? ` · ${formatBytes(current.file_size_bytes)}` : ""}
          </p>
          {current.changelog && (
            <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-border/60 bg-card/40 p-3 text-[11px] text-muted-foreground">
              {current.changelog}
            </pre>
          )}
        </div>
        <a
          href={current.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-primary/50 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Download className="h-4 w-4" />
          Baixar pacote
        </a>
      </div>
    </div>
  );
};

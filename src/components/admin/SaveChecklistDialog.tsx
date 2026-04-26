import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, X, Copy } from "lucide-react";
import { toast } from "sonner";

export interface SaveChecklistResult {
  /** response.success do POST inicial */
  saved: boolean;
  /** GET pós-save bateu com o que foi enviado */
  verified: boolean;
  /** caminhos extraídos da response (saved.backups.role_json.file etc.) */
  backupRoleJson?: string;
  backupClsconfigFile?: string;
  exportLogFile?: string;
  /** True se saved.export.scheduled === true ou existe export.log_file. */
  exportScheduled?: boolean;
  /** mensagem de erro principal (se houver) */
  error?: string;
  /** opcional: status do export consultado após delay */
  exportLogStatus?: "pending" | "ok" | "error" | "unknown";
  /**
   * Resultado do `pwApi.exportClsconfig()` disparado automaticamente pelo
   * front após o save (toggle Auto-export). Diferente de `exportScheduled`,
   * que reflete o que o PHP do save já agendou internamente.
   */
  autoExport?: {
    /** Disparado pelo front (toggle ON). */
    triggered: boolean;
    /** Sucesso da chamada exportClsconfig. */
    ok?: boolean;
    /** Caminho do log gerado (quando disponível). */
    logFile?: string;
    /** Mensagem de erro (quando ok=false). */
    error?: string;
    /** True quando o endpoint não existe na VPS (fallback amigável). */
    endpointMissing?: boolean;
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  result: SaveChecklistResult | null;
}

export const SaveChecklistDialog = ({ open, onClose, result }: Props) => {
  if (!result) return null;

  const copy = (s?: string) => {
    if (!s) return;
    navigator.clipboard.writeText(s).then(
      () => toast.success("Caminho copiado"),
      () => toast.error("Falha ao copiar"),
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl border-border bg-card">
        <DialogHeader>
          <DialogTitle>Resultado do save</DialogTitle>
        </DialogHeader>

        <ul className="space-y-2 text-sm">
          <Item ok={result.saved} label="Salvo no gamedbd (response.success)" />
          <Item ok={result.verified} label="Verificado após releitura (getClsconfig)" />
          <Item
            ok={Boolean(result.backupRoleJson)}
            label="Backup JSON criado"
            extra={
              result.backupRoleJson ? (
                <PathRow path={result.backupRoleJson} onCopy={() => copy(result.backupRoleJson)} />
              ) : null
            }
          />
          <Item
            ok={Boolean(result.backupClsconfigFile)}
            label="Backup clsconfig criado"
            extra={
              result.backupClsconfigFile ? (
                <PathRow path={result.backupClsconfigFile} onCopy={() => copy(result.backupClsconfigFile)} />
              ) : null
            }
          />
          <Item
            ok={Boolean(result.exportScheduled ?? result.exportLogFile)}
            label="Export agendado pelo backend"
            extra={
              <>
                {result.exportLogFile && (
                  <PathRow path={result.exportLogFile} onCopy={() => copy(result.exportLogFile)} />
                )}
                {result.exportLogStatus && (
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Status do export: <span className="font-mono">{result.exportLogStatus}</span>
                  </div>
                )}
              </>
            }
          />
          {result.autoExport?.triggered && (
            <Item
              ok={Boolean(result.autoExport.ok)}
              label={
                result.autoExport.endpointMissing
                  ? "Auto-export não disponível nesta VPS"
                  : result.autoExport.ok
                    ? "Auto-export executado (exportclsconfig)"
                    : "Auto-export falhou"
              }
              extra={
                <>
                  {result.autoExport.logFile && (
                    <PathRow
                      path={result.autoExport.logFile}
                      onCopy={() => copy(result.autoExport?.logFile)}
                    />
                  )}
                  {result.autoExport.error && (
                    <div className="mt-1 rounded bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
                      {result.autoExport.error}
                    </div>
                  )}
                </>
              }
            />
          )}
        </ul>

        {result.error && (
          <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {result.error}
          </div>
        )}

        <DialogFooter className="border-t border-border pt-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
          >
            Fechar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Item = ({ ok, label, extra }: { ok: boolean; label: string; extra?: React.ReactNode }) => (
  <li className="rounded-md border border-border bg-background/40 p-2">
    <div className="flex items-center gap-2">
      {ok ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <X className="h-4 w-4 text-destructive" />
      )}
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
    {extra}
  </li>
);

const PathRow = ({ path, onCopy }: { path: string; onCopy: () => void }) => (
  <div className="mt-1 flex items-center gap-2 rounded bg-background/60 px-2 py-1">
    <code className="flex-1 truncate font-mono text-[11px] text-foreground/80" title={path}>
      {path}
    </code>
    <button
      type="button"
      onClick={onCopy}
      className="rounded border border-border px-1.5 py-0.5 text-[10px] hover:border-primary/50"
      title="Copiar caminho"
    >
      <Copy className="h-3 w-3" />
    </button>
  </div>
);

// /admin/server/actions — Export clsconfig + reloads disponíveis.
//
// Sem ações destrutivas (start/stop/kill ficam pra próxima fase).
// Botões exigem confirmação forte e são gated por permissão.
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Loader2,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import {
  EndpointMissingError,
  pwApi,
  type ExportClsconfigResponse,
} from "@/lib/pwApiActions";
import { logAuditEvent } from "@/lib/auditLog";
import { EndpointMissingNotice } from "./ServerOpsPage";
import { SystemMessageCard } from "@/components/admin/SystemMessageCard";
import { MaintenanceModeCard } from "@/components/admin/MaintenanceModeCard";

interface ExportState {
  loading: boolean;
  result: ExportClsconfigResponse | null;
  error: string | null;
  endpointMissing: boolean;
}

export default function ServerActionsPage() {
  const { isSuperadmin } = useAuth();
  const { active } = useServers();
  const { can } = useServerPermissions();
  const canExport = isSuperadmin || can("save_templates");

  const [state, setState] = useState<ExportState>({
    loading: false,
    result: null,
    error: null,
    endpointMissing: false,
  });

  const runExport = async () => {
    setState((s) => ({ ...s, loading: true, error: null, endpointMissing: false }));
    try {
      const res = await pwApi.exportClsconfig();
      setState({ loading: false, result: res, error: null, endpointMissing: false });
      toast.success("Export do clsconfig concluído", {
        description: res.log_file ? `Log: ${res.log_file}` : undefined,
      });
      void logAuditEvent({
        action: "server_ops.export_clsconfig",
        tenantId: active?.id ?? null,
        target: "exportClsconfig",
        status: "ok",
        metadata: { log_file: res.log_file ?? null },
      });
    } catch (e) {
      const missing = e instanceof EndpointMissingError;
      setState({
        loading: false,
        result: null,
        error: missing ? null : e instanceof Error ? e.message : String(e),
        endpointMissing: missing,
      });
      if (!missing) {
        toast.error("Falha ao executar export", {
          description: e instanceof Error ? e.message : String(e),
        });
      }
      void logAuditEvent({
        action: "server_ops.export_clsconfig",
        tenantId: active?.id ?? null,
        target: "exportClsconfig",
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
          Operação do servidor
        </h2>
        <p className="text-xs text-muted-foreground">
          Mensagem de sistema, export e reloads — todas auditadas.
        </p>
      </div>

      {/* Send System Message — v2 */}
      <SystemMessageCard />

      {/* Maintenance Mode — v2 */}
      <MaintenanceModeCard />

      {/* Export clsconfig */}
      <section className="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-md">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <Database className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground">
              Exportar clsconfig
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Regrava <code className="font-mono">clsconfig.data</code> a partir
              do snapshot atual do <code className="font-mono">gamedbd</code>.
              Faz backup automático antes de escrever. Operação idempotente.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {canExport ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" disabled={state.loading}>
                      {state.loading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <PlayCircle className="h-3.5 w-3.5" />
                      )}
                      Executar export
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar export do clsconfig?</AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-2 text-xs">
                          <p>
                            Esta ação roda{" "}
                            <code className="font-mono">exportclsconfig</code>{" "}
                            no servidor:
                          </p>
                          <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
                            <li>Cria backup do <code className="font-mono">gamedbd</code> antes.</li>
                            <li>Regrava <code className="font-mono">clsconfig.data</code> com o estado atual.</li>
                            <li>Não afeta jogadores online.</li>
                            <li>Será registrada na auditoria.</li>
                          </ul>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={runExport}>
                        Executar agora
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-500">
                  <ShieldCheck className="h-3 w-3" />
                  Requer permissão save_templates
                </span>
              )}
            </div>

            {state.endpointMissing && (
              <div className="mt-3">
                <EndpointMissingNotice action="exportClsconfig" />
              </div>
            )}

            {state.error && (
              <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                {state.error}
              </div>
            )}

            {state.result && (
              <div className="mt-3 rounded-md border border-success/40 bg-success/10 p-3 text-xs text-success">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Export concluído
                </div>
                {state.result.log_file && (
                  <p className="mt-1 break-all font-mono text-[10px] text-success/80">
                    Log: {state.result.log_file}
                  </p>
                )}
                {state.result.gamedbd_backup?.file && (
                  <p className="mt-0.5 break-all font-mono text-[10px] text-success/80">
                    Backup gamedbd: {state.result.gamedbd_backup.file}
                  </p>
                )}
                {state.result.output && (
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-background/40 p-2 font-mono text-[10px] text-foreground/80">
                    {state.result.output.slice(0, 2000)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Reloads conhecidos — placeholder Fase 2 */}
      <section className="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-md">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background/40 text-muted-foreground">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground">
              Reload de daemons
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Reload soft (SIGHUP) de configurações específicas. Será habilitado
              quando o endpoint correspondente estiver disponível na VPS.
            </p>
            <div className="mt-3">
              <EndpointMissingNotice action="reloadService" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

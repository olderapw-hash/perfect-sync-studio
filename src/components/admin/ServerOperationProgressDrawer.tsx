// Drawer premium pra acompanhar progresso de uma Server Op em tempo real.
// Recebe operationId (vem de ServiceControlResponse.operation.id) e plugga
// no useOperationStatusPolling. Mostra stage, badge, backup, verification,
// countdown e erro, com fallback amigável quando o endpoint não existe.

import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  ShieldCheck,
  AlertTriangle,
  X,
} from "lucide-react";
import { useOperationStatusPolling } from "@/hooks/useOperationStatusPolling";
import type {
  ServerOperationStatus,
  ServerOperationStage,
} from "@/lib/pwApiActions";
import { cn } from "@/lib/utils";

export interface ServerOperationProgressDrawerProps {
  open: boolean;
  operationId: string | null;
  /** Tipo da operação (startServer/stopServer/...). Usado apenas quando id é null. */
  type?: string;
  /** Fechar drawer (só habilita botão Fechar quando running=false). */
  onClose: () => void;
}

const STAGE_LABEL: Record<string, string> = {
  queued: "Na fila",
  broadcast: "Broadcast",
  countdown: "Contagem regressiva",
  backup: "Backup",
  stop: "Parando serviços",
  start: "Iniciando serviços",
  restart: "Reiniciando",
  verify: "Verificando",
  completed: "Concluído",
  failed: "Falhou",
  unknown: "—",
};

const STAGE_ORDER = [
  "queued",
  "broadcast",
  "countdown",
  "backup",
  "stop",
  "start",
  "restart",
  "verify",
  "completed",
] as const;

function normalizeStage(stage: ServerOperationStage | null | undefined) {
  if (!stage) return "unknown";
  if (stage in STAGE_LABEL) return stage;
  if (stage.startsWith("stop_")) return "stop";
  if (stage.startsWith("start_")) return "start";
  if (stage.startsWith("restart_")) return "restart";
  if (stage.startsWith("verify_")) return "verify";
  if (stage.startsWith("backup_")) return "backup";
  return "unknown";
}

function StatusBadge({ op }: { op: ServerOperationStatus }) {
  if (op.running) {
    return (
      <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-500">
        <Loader2 className="h-3 w-3 animate-spin" /> Em andamento
      </Badge>
    );
  }
  if (op.success_state === "success" || op.success) {
    return (
      <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-500">
        <CheckCircle2 className="h-3 w-3" /> Concluído
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 border-destructive/50 text-destructive">
      <XCircle className="h-3 w-3" /> Falhou
    </Badge>
  );
}

function StageStepper({ stage }: { stage: ServerOperationStage }) {
  const normalizedStage = normalizeStage(stage);
  const idx = STAGE_ORDER.indexOf(normalizedStage as (typeof STAGE_ORDER)[number]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {STAGE_ORDER.map((s, i) => {
        const active = i === idx;
        const done = idx >= 0 && i < idx;
        return (
          <span
            key={s}
            className={cn(
              "rounded-md border px-2 py-0.5 text-[10px] font-medium",
              active && "border-primary bg-primary/10 text-primary",
              done && "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
              !active && !done && "border-border text-muted-foreground",
            )}
          >
            {STAGE_LABEL[s] ?? s}
          </span>
        );
      })}
      {stage && !(stage in STAGE_LABEL) && (
        <span className="rounded-md border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {stage}
        </span>
      )}
    </div>
  );
}

export function ServerOperationProgressDrawer({
  open,
  operationId,
  type,
  onClose,
}: ServerOperationProgressDrawerProps) {
  const { status, loading, error, missing, refresh } = useOperationStatusPolling({
    operationId,
    type,
    intervalMs: 2500,
    paused: !open,
  });

  const canClose = !status || !status.running;

  const lastCountdown = useMemo(() => {
    if (!status?.countdown || status.countdown.length === 0) return null;
    return status.countdown[status.countdown.length - 1];
  }, [status]);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o && canClose) onClose();
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Progresso da operação
          </SheetTitle>
          <SheetDescription>
            Acompanhamento em tempo real (poll a cada 2.5s).
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="my-4 h-[calc(100vh-13rem)] pr-3">
          <div className="space-y-4 text-xs">
            {missing ? (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-amber-700 dark:text-amber-400">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-semibold">Status em tempo real indisponível</p>
                    <p className="text-[11px] opacity-80">
                      A API desta VPS ainda não expõe <code>getServerOperationStatus</code>.
                      Acompanhe pelos logs ou tente novamente após atualizar o
                      <code> api_cls.php</code>.
                    </p>
                  </div>
                </div>
              </div>
            ) : !status && loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Buscando status...
              </div>
            ) : !status ? (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-muted-foreground">
                {error ?? "Sem dados ainda. Aguarde o próximo poll."}
              </div>
            ) : (
              <>
                {/* Header de status */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {status.id}
                    </p>
                    <p className="font-semibold text-foreground">{status.type}</p>
                  </div>
                  <StatusBadge op={status} />
                </div>

                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                    Etapa atual
                  </p>
                  <StageStepper stage={status.stage} />
                </div>

                {status.reason && (
                  <div className="rounded-md border border-border bg-muted/30 p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Motivo</p>
                    <p className="text-foreground">{status.reason}</p>
                  </div>
                )}

                {status.dry_run && (
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 text-amber-500"
                  >
                    DRY-RUN
                  </Badge>
                )}

                {lastCountdown && (
                  <div className="rounded-md border border-border bg-muted/30 p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">
                      Contagem regressiva
                    </p>
                    <p className="text-foreground">
                      {lastCountdown.message ??
                        (typeof lastCountdown.seconds_left === "number"
                          ? `${lastCountdown.seconds_left}s restantes`
                          : "—")}
                    </p>
                  </div>
                )}

                {status.backup && (
                  <div className="rounded-md border border-border bg-muted/30 p-2">
                    <div className="mb-1 flex items-center gap-1.5">
                      <Database className="h-3 w-3" />
                      <p className="text-[10px] uppercase text-muted-foreground">
                        Backup
                      </p>
                      {status.backup.success === true && (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      )}
                      {status.backup.success === false && (
                        <XCircle className="h-3 w-3 text-destructive" />
                      )}
                    </div>
                    {status.backup.path && (
                      <p className="break-all font-mono text-[10px] text-foreground">
                        {status.backup.path}
                      </p>
                    )}
                    {status.backup.error && (
                      <p className="text-destructive">{status.backup.error}</p>
                    )}
                  </div>
                )}

                {status.verification && (
                  <div className="rounded-md border border-border bg-muted/30 p-2">
                    <div className="mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3" />
                      <p className="text-[10px] uppercase text-muted-foreground">
                        Verificação
                      </p>
                      {status.verification.success === true && (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      )}
                      {status.verification.success === false && (
                        <XCircle className="h-3 w-3 text-destructive" />
                      )}
                    </div>
                    {status.verification.services &&
                      status.verification.services.length > 0 && (
                        <ul className="space-y-0.5">
                          {status.verification.services.map((s) => (
                            <li
                              key={s.key}
                              className="flex items-center justify-between font-mono text-[10px]"
                            >
                              <span>{s.key}</span>
                              <span
                                className={cn(
                                  s.ok === true && "text-emerald-500",
                                  s.ok === false && "text-destructive",
                                  s.ok == null && "text-muted-foreground",
                                )}
                              >
                                {s.state}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>
                )}

                {status.error && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/5 p-2 text-destructive">
                    <p className="text-[10px] uppercase">Erro</p>
                    <p>{status.error}</p>
                  </div>
                )}

                {status.log_file && (
                  <div className="rounded-md border border-border bg-muted/30 p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">
                      Log
                    </p>
                    <p className="break-all font-mono text-[10px] text-foreground">
                      {status.log_file}
                    </p>
                  </div>
                )}

                <Separator />
                <p className="text-[10px] text-muted-foreground">
                  {status.completed_at
                    ? `Finalizado em ${String(status.completed_at)}`
                    : status.created_at
                      ? `Iniciado em ${String(status.created_at)}`
                      : ""}
                </p>
              </>
            )}

            {error && status && !missing && (
              <p className="text-[10px] text-destructive">{error}</p>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refresh()}
            disabled={loading || missing}
            className="gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Atualizar agora
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onClose}
            disabled={!canClose}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            {canClose ? "Fechar" : "Aguarde..."}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

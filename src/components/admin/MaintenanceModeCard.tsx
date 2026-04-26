// Server Ops v2 — Maintenance Mode.
// Card premium dentro de /admin/server/actions. Liga/desliga modo
// manutenção do servidor com confirmação forte, broadcast opcional
// (via sendSystemMessage), dry_run e auditoria em sucesso/erro.
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Power,
  PowerOff,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import {
  EndpointMissingError,
  pwApi,
  type MaintenanceState,
  type SetMaintenanceModeResponse,
} from "@/lib/pwApiActions";
import { logAuditEvent } from "@/lib/auditLog";
import { EndpointMissingNotice } from "@/pages/admin/ServerOpsPage";

const MAX_REASON = 240;
const MAX_ETA = 24 * 60;

const EMPTY_STATE: MaintenanceState = {
  enabled: false,
  reason: null,
  eta_minutes: null,
  started_at: null,
  ends_at: null,
  updated_by: null,
  updated_at: null,
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function MaintenanceModeCard() {
  const { isSuperadmin } = useAuth();
  const { active } = useServers();
  const { can } = useServerPermissions();
  const canToggle = isSuperadmin || can("manage_servers");

  const [state, setState] = useState<MaintenanceState>(EMPTY_STATE);
  const [loadingState, setLoadingState] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [endpointMissing, setEndpointMissing] = useState(false);

  const [reason, setReason] = useState("");
  const [etaStr, setEtaStr] = useState("");
  const [broadcast, setBroadcast] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingEnabled, setPendingEnabled] = useState<boolean | null>(null);
  const [lastResult, setLastResult] = useState<SetMaintenanceModeResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const refresh = async () => {
    setLoadingState(true);
    setStatusError(null);
    setEndpointMissing(false);
    try {
      const res = await pwApi.getMaintenanceMode();
      setState(res.maintenance ?? EMPTY_STATE);
      // Pré-preenche form com o estado atual quando ligado.
      if (res.maintenance?.enabled) {
        setReason(res.maintenance.reason ?? "");
        setEtaStr(
          res.maintenance.eta_minutes != null
            ? String(res.maintenance.eta_minutes)
            : "",
        );
      }
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        setEndpointMissing(true);
      } else {
        setStatusError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  const etaNum = etaStr.trim() === "" ? null : Number(etaStr);
  const etaInvalid =
    etaNum !== null && (Number.isNaN(etaNum) || etaNum < 0 || etaNum > MAX_ETA);
  const reasonTooLong = reason.length > MAX_REASON;

  const submit = async (enabled: boolean, dryRun: boolean) => {
    if (etaInvalid || reasonTooLong) return;
    setSubmitting(true);
    setSubmitError(null);
    setLastResult(null);
    try {
      const res = await pwApi.setMaintenanceMode({
        enabled,
        reason: reason.trim() || undefined,
        eta_minutes: etaNum ?? undefined,
        broadcast,
        dry_run: dryRun,
      });
      setLastResult(res);
      const next = res.maintenance ?? res.next ?? null;
      if (next) setState(next);

      if (dryRun) {
        toast.success("Validação OK (dry-run)", {
          description: "Payload aceito — nada foi persistido nem enviado.",
        });
      } else {
        toast.success(
          enabled ? "Modo manutenção ATIVADO" : "Modo manutenção DESATIVADO",
          {
            description:
              res.broadcast?.attempted && !res.broadcast.error
                ? "Broadcast disparado para os jogadores."
                : res.broadcast?.error
                  ? `Broadcast falhou: ${res.broadcast.error}`
                  : undefined,
          },
        );
      }
      void logAuditEvent({
        action: dryRun
          ? "server_ops.maintenance.dry_run"
          : enabled
            ? "server_ops.maintenance.enable"
            : "server_ops.maintenance.disable",
        tenantId: active?.id ?? null,
        target: "setMaintenanceMode",
        status: "ok",
        metadata: {
          reason: reason.trim() || null,
          eta_minutes: etaNum,
          broadcast,
          broadcast_attempted: res.broadcast?.attempted ?? false,
          broadcast_error: res.broadcast?.error ?? null,
        },
      });
    } catch (e) {
      const missing = e instanceof EndpointMissingError;
      if (missing) {
        setEndpointMissing(true);
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        setSubmitError(msg);
        toast.error("Falha na operação de manutenção", { description: msg });
      }
      void logAuditEvent({
        action: dryRun
          ? "server_ops.maintenance.dry_run"
          : enabled
            ? "server_ops.maintenance.enable"
            : "server_ops.maintenance.disable",
        tenantId: active?.id ?? null,
        target: "setMaintenanceMode",
        status: "error",
        error: e instanceof Error ? e.message : String(e),
        metadata: {
          reason: reason.trim() || null,
          eta_minutes: etaNum,
          broadcast,
        },
      });
    } finally {
      setSubmitting(false);
      setPendingEnabled(null);
    }
  };

  const isOn = state.enabled === true;

  return (
    <section
      className={`relative rounded-xl border p-5 backdrop-blur-md transition-colors ${
        isOn
          ? "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/30"
          : "border-border bg-card/40"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
            isOn
              ? "border-amber-500/50 bg-amber-500/15 text-amber-500"
              : "border-primary/30 bg-primary/10 text-primary"
          }`}
        >
          <Wrench className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
              <Sparkles className="h-3 w-3" />
              v2 · operação real
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                Modo manutenção
              </h3>
              {loadingState ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  carregando
                </span>
              ) : isOn ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500">
                  <Power className="h-3 w-3" />
                  ATIVO
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                  <PowerOff className="h-3 w-3" />
                  desligado
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Estado operacional persistido na VPS, base para restart seguro.
              Quando ativado, dispara mensagem global de alta prioridade.
            </p>
          </div>

          {!canToggle && (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-500">
              <ShieldCheck className="h-3 w-3" />
              Requer permissão manage_servers
            </span>
          )}

          {endpointMissing && (
            <EndpointMissingNotice action="setMaintenanceMode" />
          )}

          {statusError && !endpointMissing && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              <AlertTriangle className="mr-1 inline h-3 w-3" />
              {statusError}
            </div>
          )}

          {/* Estado atual */}
          {!endpointMissing && (
            <div className="rounded-lg border border-border/70 bg-background/40 p-3 text-xs">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Estado
                  </div>
                  <div className="font-semibold text-foreground">
                    {isOn ? "Em manutenção" : "Operacional"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Atualizado em
                  </div>
                  <div className="font-mono text-[11px] text-foreground">
                    {formatTime(state.updated_at)}
                  </div>
                </div>
                {state.reason && (
                  <div className="sm:col-span-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Motivo
                    </div>
                    <div className="text-foreground">{state.reason}</div>
                  </div>
                )}
                {isOn && state.started_at && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Iniciado em
                    </div>
                    <div className="font-mono text-[11px] text-foreground">
                      {formatTime(state.started_at)}
                    </div>
                  </div>
                )}
                {isOn && state.ends_at && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Previsão fim
                    </div>
                    <div className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-500">
                      <Clock className="h-3 w-3" />
                      {formatTime(state.ends_at)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          {!endpointMissing && (
            <div className="space-y-3 border-t border-border/60 pt-3">
              <div>
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Motivo (opcional, vai no broadcast)
                </Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex.: Reinício programado para aplicar atualização de segurança."
                  rows={2}
                  maxLength={MAX_REASON + 50}
                  disabled={!canToggle || submitting}
                  className="mt-1 font-medium"
                />
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span
                    className={
                      reasonTooLong
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }
                  >
                    {reason.length}/{MAX_REASON}
                  </span>
                  {reasonTooLong && (
                    <span className="text-destructive">Acima do limite</span>
                  )}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Tempo previsto (minutos)
                  </Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={MAX_ETA}
                    value={etaStr}
                    onChange={(e) => setEtaStr(e.target.value)}
                    placeholder="ex: 5"
                    disabled={!canToggle || submitting}
                    className="mt-1 font-mono"
                  />
                  {etaInvalid && (
                    <p className="mt-1 text-[10px] text-destructive">
                      Use um valor entre 0 e {MAX_ETA}.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-md border border-border/70 bg-background/40 px-3 py-2">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Disparar broadcast
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Envia uma mensagem global automática.
                    </div>
                  </div>
                  <Switch
                    checked={broadcast}
                    onCheckedChange={setBroadcast}
                    disabled={!canToggle || submitting}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void submit(!isOn, true)}
                  disabled={
                    !canToggle || submitting || etaInvalid || reasonTooLong
                  }
                >
                  {submitting && pendingEnabled === null ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Validar (dry-run)
                </Button>

                {!isOn ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={
                      !canToggle || submitting || etaInvalid || reasonTooLong
                    }
                    onClick={() => setPendingEnabled(true)}
                  >
                    <Power className="h-3.5 w-3.5" />
                    Ativar manutenção
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={!canToggle || submitting}
                    onClick={() => setPendingEnabled(false)}
                  >
                    <PowerOff className="h-3.5 w-3.5" />
                    Encerrar manutenção
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void refresh()}
                  disabled={loadingState}
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${loadingState ? "animate-spin" : ""}`}
                  />
                  Atualizar
                </Button>
              </div>
            </div>
          )}

          {submitError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
              {submitError}
            </div>
          )}

          {lastResult && (
            <div className="rounded-md border border-success/40 bg-success/10 p-3 text-xs text-success">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {lastResult.dry_run
                  ? "Dry-run validado"
                  : (lastResult.maintenance ?? lastResult.next)?.enabled
                    ? "Manutenção ativada"
                    : "Manutenção encerrada"}
              </div>
              {lastResult.broadcast?.attempted && !lastResult.broadcast.error && (
                <p className="mt-1 text-[10px] text-success/80">
                  Broadcast disparado com sucesso.
                </p>
              )}
              {lastResult.broadcast?.error && (
                <p className="mt-1 text-[10px] text-amber-500">
                  Manutenção persistida, mas broadcast falhou:{" "}
                  {lastResult.broadcast.error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={pendingEnabled !== null}
        onOpenChange={(open) => {
          if (!open) setPendingEnabled(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingEnabled
                ? "Confirmar ativação do modo manutenção?"
                : "Confirmar encerramento da manutenção?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-xs">
                <p>
                  {pendingEnabled ? (
                    <>
                      O servidor entrará em modo manutenção. Operações sensíveis
                      podem ser bloqueadas e os jogadores serão avisados.
                    </>
                  ) : (
                    <>
                      O modo manutenção será encerrado e o servidor voltará ao
                      estado operacional.
                    </>
                  )}
                </p>
                <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
                  {reason.trim() && <li>Motivo: {reason.trim()}</li>}
                  {etaNum != null && etaNum > 0 && (
                    <li>Tempo previsto: {etaNum} min</li>
                  )}
                  <li>
                    Broadcast: {broadcast ? "será disparado" : "não será enviado"}
                  </li>
                  <li>Será registrado na auditoria.</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingEnabled !== null)
                  void submit(pendingEnabled, false);
              }}
              disabled={submitting}
            >
              {submitting && (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              )}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

// /admin/server/instances — Instance Control v1.
//
// Reaproveita o padrão visual e UX do ServerOpsPage (Status tab):
//  - Lista DINÂMICA via getManageableInstances
//  - Multi-select com ações em lote (start/stop/restart/auto-start toggle)
//  - Drawer de progresso reusando ServerOperationProgressDrawer
//  - Auto-start toggle por linha via setInstanceAutoStart
//
// Todo gating segue manage_servers. Endpoint ausente → notice amigável.
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircuitBoard,
  Loader2,
  Play,
  Power,
  PowerOff,
  RefreshCw,
  RotateCcw,
  Square,
  XCircle,
  Zap,
  ZapOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import {
  EndpointMissingError,
  PwApiActionError,
  pwApi,
  type InstanceControlResponse,
  type ManageableInstance,
} from "@/lib/pwApiActions";
import { logAuditEvent } from "@/lib/auditLog";
import { EndpointMissingNotice } from "@/components/admin/EndpointMissingNotice";
import { ServerOperationProgressDrawer } from "@/components/admin/ServerOperationProgressDrawer";
import { cn } from "@/lib/utils";

type InstanceAction = "start" | "stop" | "restart";

interface PendingConfirm {
  scope: "row" | "selection";
  action: InstanceAction;
  codes: string[];
}

function labelForAction(a: InstanceAction): string {
  return a === "start" ? "Iniciar" : a === "stop" ? "Parar" : "Reiniciar";
}

function formatCollectedAt(v: string | number): string {
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleString();
  }
  const ms = v < 1e12 ? v * 1000 : v;
  return new Date(ms).toLocaleString();
}

export default function InstancesPage() {
  const { active } = useServers();
  const { isSuperadmin } = useAuth();
  const { can } = useServerPermissions();

  const [instances, setInstances] = useState<ManageableInstance[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpointMissing, setEndpointMissing] = useState(false);
  const [collectedAt, setCollectedAt] = useState<string | number | null>(null);
  const [runningCount, setRunningCount] = useState<number>(0);
  const [autoStartCount, setAutoStartCount] = useState<number>(0);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dryRun, setDryRun] = useState(false);
  const [acting, setActing] = useState(false);
  const [autoStartBusy, setAutoStartBusy] = useState<Set<string>>(new Set());
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [trackedOp, setTrackedOp] = useState<{ id: string; type?: string } | null>(null);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [startSelected, setStartSelected] = useState<Set<string>>(new Set());

  const canManage = isSuperadmin || can("manage_servers");
  const allowed = isSuperadmin || can("view");

  const load = async () => {
    setLoading(true);
    setError(null);
    setEndpointMissing(false);
    try {
      const res = await pwApi.getManageableInstances();
      const list = res.instances ?? [];
      setInstances(list);
      setCollectedAt(res.collected_at ?? Date.now());
      setRunningCount(res.running_count ?? list.filter((i) => i.running).length);
      setAutoStartCount(
        res.auto_start_count ?? list.filter((i) => i.auto_start).length,
      );
      // Limpa seleção de instâncias que sumiram da lista.
      setSelected((prev) => {
        const valid = new Set(list.map((i) => i.code));
        const next = new Set<string>();
        for (const k of prev) if (valid.has(k)) next.add(k);
        return next;
      });
      void logAuditEvent({
        action: "instance_control.view",
        tenantId: active?.id ?? null,
        target: "getManageableInstances",
        status: "ok",
        metadata: { count: list.length },
      });
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        setEndpointMissing(true);
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
      void logAuditEvent({
        action: "instance_control.view",
        tenantId: active?.id ?? null,
        target: "getManageableInstances",
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allowed) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, allowed]);

  const list = instances ?? [];
  // Apenas instâncias rodando (visíveis por padrão na tabela principal)
  const selectableCodes = useMemo(
    () =>
      list
        .filter((i) => i.running === true && i.selectable !== false)
        .map((i) => i.code),
    [list],
  );
  const allSelected =
    selectableCodes.length > 0 && selectableCodes.every((k) => selected.has(k));
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectableCodes));
  }

  function toggleOne(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function requestAction(scope: "row" | "selection", action: InstanceAction, codes: string[]) {
    if (!canManage) {
      toast.error("Sem permissão (manage_servers).");
      return;
    }
    if (codes.length === 0) {
      toast.error("Selecione ao menos uma instância.");
      return;
    }
    // start sem dry-run: dispensa confirmação (não é destrutivo)
    if (action === "start" && !dryRun) {
      void runAction(scope, action, codes);
      return;
    }
    setPendingConfirm({ scope, action, codes });
  }

  async function runAction(
    scope: "row" | "selection",
    action: InstanceAction,
    codes: string[],
  ) {
    setActing(true);
    setPendingConfirm(null);
    const isBatch = codes.length > 1 || scope === "selection";
    const fn = isBatch
      ? action === "start"
        ? pwApi.startInstances
        : action === "stop"
          ? pwApi.stopInstances
          : pwApi.restartInstances
      : action === "start"
        ? pwApi.startInstance
        : action === "stop"
          ? pwApi.stopInstance
          : pwApi.restartInstance;

    const auditAction = `instance_control.${isBatch ? "batch_" : ""}${action}`;
    try {
      const res: InstanceControlResponse = isBatch
        ? await (fn as typeof pwApi.startInstances)({
            codes,
            verify: true,
            dry_run: dryRun,
          })
        : await (fn as typeof pwApi.startInstance)({
            code: codes[0],
            verify: true,
            dry_run: dryRun,
          });

      toast.success(
        `${labelForAction(action)}${dryRun ? " (dry-run)" : ""}: ${codes.length} instância(s) processada(s)`,
      );
      // Operação assíncrona → drawer de progresso (não em dry-run).
      if (!dryRun && res.operation?.id) {
        setTrackedOp({ id: res.operation.id, type: res.operation.type });
      }
      void logAuditEvent({
        action: auditAction,
        tenantId: active?.id ?? null,
        target: codes.join(","),
        status: "ok",
        metadata: {
          dry_run: dryRun,
          codes,
          operation_id: res.operation?.id ?? null,
        },
      });
      if (!dryRun) {
        // Pequena espera pra processos subirem/cairem antes do refresh.
        setTimeout(() => void load(), 800);
      }
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        setEndpointMissing(true);
        toast.error(`Endpoint ${action}Instance${isBatch ? "s" : ""} ausente nesta VPS.`);
        void logAuditEvent({
          action: auditAction,
          tenantId: active?.id ?? null,
          target: codes.join(","),
          status: "error",
          error: "endpoint_missing",
        });
        return;
      }
      let shortMsg = e instanceof Error ? e.message : String(e);
      if (!dryRun && e instanceof PwApiActionError) {
        const payloadObj = e.payload as {
          error?: string;
          operation?: { id?: string; type?: string };
        };
        if (payloadObj?.operation?.id) {
          setTrackedOp({
            id: payloadObj.operation.id,
            type: payloadObj.operation.type,
          });
        }
        if (payloadObj?.error) shortMsg = payloadObj.error;
      }
      toast.error(`${labelForAction(action)} falhou: ${shortMsg}`, { duration: 8000 });
      void logAuditEvent({
        action: auditAction,
        tenantId: active?.id ?? null,
        target: codes.join(","),
        status: "error",
        error: shortMsg,
      });
    } finally {
      setActing(false);
    }
  }

  async function toggleAutoStart(code: string, enabled: boolean) {
    if (!canManage) {
      toast.error("Sem permissão (manage_servers).");
      return;
    }
    setAutoStartBusy((prev) => {
      const next = new Set(prev);
      next.add(code);
      return next;
    });
    try {
      const res = await pwApi.setInstanceAutoStart({ code, enabled });
      toast.success(
        `Auto-start ${enabled ? "habilitado" : "desabilitado"}${
          res.changed === false ? " (sem mudança)" : ""
        }`,
      );
      // Atualiza estado local sem precisar recarregar tudo.
      const codes = new Set(res.auto_start_codes ?? []);
      setInstances((prev) =>
        prev
          ? prev.map((i) => ({ ...i, auto_start: codes.has(i.code) }))
          : prev,
      );
      setAutoStartCount(res.auto_start_count ?? codes.size);
      void logAuditEvent({
        action: "instance_control.auto_start_toggle",
        tenantId: active?.id ?? null,
        target: code,
        status: "ok",
        metadata: { enabled, auto_start_codes: res.auto_start_codes ?? [] },
      });
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        setEndpointMissing(true);
        toast.error("Endpoint setInstanceAutoStart ausente nesta VPS.");
        return;
      }
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Falha ao atualizar auto-start: ${msg}`);
      void logAuditEvent({
        action: "instance_control.auto_start_toggle",
        tenantId: active?.id ?? null,
        target: code,
        status: "error",
        error: msg,
      });
    } finally {
      setAutoStartBusy((prev) => {
        const next = new Set(prev);
        next.delete(code);
        return next;
      });
    }
  }

  async function bulkAutoStart(enabled: boolean) {
    if (!canManage) {
      toast.error("Sem permissão (manage_servers).");
      return;
    }
    if (selected.size === 0) {
      toast.error("Selecione ao menos uma instância.");
      return;
    }
    // Constrói lista completa baseado no estado atual + alteração:
    // - se enabled=true: adiciona seleção
    // - se enabled=false: remove seleção
    const currentAuto = new Set(list.filter((i) => i.auto_start).map((i) => i.code));
    if (enabled) {
      for (const c of selected) currentAuto.add(c);
    } else {
      for (const c of selected) currentAuto.delete(c);
    }
    const codes = Array.from(currentAuto);
    try {
      const res = await pwApi.setInstanceAutoStart({ codes });
      toast.success(
        `Auto-start ${enabled ? "habilitado" : "desabilitado"} em ${selected.size} instância(s)`,
      );
      const setCodes = new Set(res.auto_start_codes ?? codes);
      setInstances((prev) =>
        prev ? prev.map((i) => ({ ...i, auto_start: setCodes.has(i.code) })) : prev,
      );
      setAutoStartCount(res.auto_start_count ?? setCodes.size);
      void logAuditEvent({
        action: "instance_control.auto_start_bulk",
        tenantId: active?.id ?? null,
        target: Array.from(selected).join(","),
        status: "ok",
        metadata: { enabled, count: selected.size, total_codes: codes.length },
      });
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        setEndpointMissing(true);
        toast.error("Endpoint setInstanceAutoStart ausente nesta VPS.");
        return;
      }
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Falha ao atualizar auto-start em lote: ${msg}`);
    }
  }

  const offlineCount = list.length - runningCount;
  const runningList = useMemo(() => list.filter((i) => i.running === true), [list]);
  const stoppedList = useMemo(() => list.filter((i) => i.running !== true), [list]);
  const startableList = useMemo(
    () =>
      stoppedList.filter(
        (i) => i.selectable !== false && (i.supported_actions ?? []).includes("start"),
      ),
    [stoppedList],
  );

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-center text-sm text-muted-foreground">
        Você precisa da permissão <strong>view</strong> para acessar Instance Control.
      </div>
    );
  }

  const allStartSelected =
    startableList.length > 0 && startableList.every((i) => startSelected.has(i.code));

  function toggleStartAll() {
    setStartSelected(
      allStartSelected ? new Set() : new Set(startableList.map((i) => i.code)),
    );
  }

  function toggleStartOne(code: string) {
    setStartSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function openStartDialog() {
    setStartSelected(new Set());
    setStartDialogOpen(true);
  }

  function confirmStartFromDialog() {
    const codes = Array.from(startSelected);
    if (codes.length === 0) {
      toast.error("Selecione ao menos uma instância para iniciar.");
      return;
    }
    setStartDialogOpen(false);
    requestAction("selection", "start", codes);
  }

  return (
    <div className="space-y-4">
      {/* ─── KPIs ─── */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          icon={<CircuitBoard className="h-4 w-4" />}
          label="Total"
          value={list.length}
          tone="neutral"
        />
        <KpiCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Em execução"
          value={runningCount}
          tone="success"
        />
        <KpiCard
          icon={<Zap className="h-4 w-4" />}
          label="Auto-start"
          value={autoStartCount}
          tone="primary"
        />
      </div>

      {/* ─── Lista de instâncias ─── */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-primary px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-foreground">
              Instâncias gerenciáveis
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {collectedAt ? (
                <>
                  Última coleta:{" "}
                  <span className="font-mono font-semibold text-success">
                    {formatCollectedAt(collectedAt)}
                  </span>
                </>
              ) : loading ? (
                "Coletando..."
              ) : (
                "Nenhuma coleta ainda."
              )}
              {!loading && instances && (
                <>
                  {" "}·{" "}
                  <span className="text-success font-semibold">
                    {runningCount} rodando
                  </span>
                  {offlineCount > 0 && (
                    <>
                      {" "}·{" "}
                      <span className="text-destructive font-semibold">
                        {offlineCount} parada(s)
                      </span>
                    </>
                  )}
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-3 py-1.5">
              <Switch
                id="instances-dry-run"
                checked={dryRun}
                onCheckedChange={setDryRun}
                disabled={acting}
              />
              <Label
                htmlFor="instances-dry-run"
                className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Dry-run
              </Label>
            </div>
            <Button
              size="sm"
              variant="default"
              onClick={openStartDialog}
              disabled={loading || acting || !canManage || startableList.length === 0}
              title={
                startableList.length === 0
                  ? "Nenhuma instância parada disponível"
                  : `${startableList.length} parada(s) disponível(is)`
              }
            >
              <Play className="h-3.5 w-3.5" />
              Iniciar instâncias
              {startableList.length > 0 && (
                <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 py-0 text-[10px] font-bold">
                  {startableList.length}
                </span>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Toolbar de seleção */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-primary/5 px-5 py-3">
            <span className="text-xs font-semibold text-foreground">
              {selected.size} instância(s) selecionada(s)
              {dryRun && (
                <span className="ml-2 rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-500">
                  dry-run
                </span>
              )}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelected(new Set())}
                disabled={acting}
              >
                Limpar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  requestAction("selection", "restart", Array.from(selected))
                }
                disabled={acting || !canManage}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reiniciar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  requestAction("selection", "stop", Array.from(selected))
                }
                disabled={acting || !canManage}
              >
                <Square className="h-3.5 w-3.5" />
                Parar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void bulkAutoStart(true)}
                disabled={acting || !canManage}
              >
                <Zap className="h-3.5 w-3.5" />
                Auto-start ON
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void bulkAutoStart(false)}
                disabled={acting || !canManage}
              >
                <ZapOff className="h-3.5 w-3.5" />
                Auto-start OFF
              </Button>
            </div>
          </div>
        )}

        {endpointMissing && (
          <div className="px-5 pb-4 pt-2">
            <EndpointMissingNotice action="getManageableInstances" />
          </div>
        )}

        {error && (
          <div className="mx-5 mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            <strong>Erro ao consultar instâncias:</strong> {error}
          </div>
        )}

        <div className="border-t border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="h-10 w-10 pl-4">
                  <Checkbox
                    checked={
                      allSelected ? true : someSelected ? "indeterminate" : false
                    }
                    onCheckedChange={toggleAll}
                    disabled={selectableCodes.length === 0 || acting}
                    aria-label="Selecionar todas"
                  />
                </TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Instância
                </TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Categoria
                </TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Scope
                </TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Estado
                </TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Auto-start
                </TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Porta
                </TableHead>
                <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground pr-4">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && runningList.length === 0 && !endpointMissing && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                    {list.length === 0 ? (
                      "Nenhuma instância retornada pela API."
                    ) : (
                      <>
                        Nenhuma instância em execução.
                        {startableList.length > 0 && (
                          <>
                            {" "}Use{" "}
                            <button
                              type="button"
                              className="font-semibold text-primary underline-offset-2 hover:underline"
                              onClick={openStartDialog}
                              disabled={!canManage}
                            >
                              Iniciar instâncias
                            </button>{" "}
                            para ligar uma das {startableList.length} disponível(is).
                          </>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              )}
              {loading && runningList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                    <Loader2 className="inline h-4 w-4 animate-spin" /> Coletando instâncias...
                  </TableCell>
                </TableRow>
              )}
              {runningList.map((inst) => (
                <InstanceRow
                  key={inst.code}
                  inst={inst}
                  selected={selected.has(inst.code)}
                  onToggle={() => toggleOne(inst.code)}
                  onAction={(a) => requestAction("row", a, [inst.code])}
                  onAutoStart={(en) => void toggleAutoStart(inst.code, en)}
                  acting={acting}
                  autoStartBusy={autoStartBusy.has(inst.code)}
                  canManage={canManage}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ─── Confirmação ─── */}
      <AlertDialog
        open={pendingConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setPendingConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar {pendingConfirm ? labelForAction(pendingConfirm.action) : ""}
              {dryRun && (
                <span className="ml-2 rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-500">
                  dry-run
                </span>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-xs">
                <p>Esta operação será aplicada às instâncias:</p>
                <ul className="list-disc pl-5 font-mono text-foreground max-h-40 overflow-auto">
                  {(pendingConfirm?.codes ?? []).map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                {!dryRun && pendingConfirm?.action === "stop" && (
                  <p className="text-destructive">
                    ⚠ Parar a instância pode desconectar jogadores ativos.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingConfirm) return;
                void runAction(
                  pendingConfirm.scope,
                  pendingConfirm.action,
                  pendingConfirm.codes,
                );
              }}
              disabled={acting}
              className={cn(
                pendingConfirm?.action === "stop" &&
                  !dryRun &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              )}
            >
              {acting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Executando...
                </>
              ) : (
                <>Confirmar</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Drawer de progresso ─── */}
      <ServerOperationProgressDrawer
        open={trackedOp !== null}
        operationId={trackedOp?.id ?? null}
        type={trackedOp?.type}
        onClose={() => {
          setTrackedOp(null);
          // Refresh ao fechar para refletir o estado final.
          void load();
        }}
      />

      {/* ─── Dialog: Iniciar instâncias paradas ─── */}
      <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-success" />
              Iniciar instâncias
              {dryRun && (
                <span className="ml-2 rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-500">
                  dry-run
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Selecione abaixo quais instâncias paradas você deseja iniciar.
            </DialogDescription>
          </DialogHeader>

          {startableList.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              Nenhuma instância parada disponível para iniciar.
            </div>
          ) : (
            <div className="max-h-[50vh] overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="h-9 w-10 pl-4">
                      <Checkbox
                        checked={
                          allStartSelected
                            ? true
                            : startSelected.size > 0
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={toggleStartAll}
                        aria-label="Selecionar todas as paradas"
                      />
                    </TableHead>
                    <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Instância
                    </TableHead>
                    <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Categoria
                    </TableHead>
                    <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Scope
                    </TableHead>
                    <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Porta
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {startableList.map((inst) => {
                    const checked = startSelected.has(inst.code);
                    return (
                      <TableRow
                        key={inst.code}
                        className={cn(
                          "cursor-pointer border-border/60 hover:bg-muted/20",
                          checked && "bg-primary/5",
                        )}
                        onClick={() => toggleStartOne(inst.code)}
                      >
                        <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleStartOne(inst.code)}
                            aria-label={`Selecionar ${inst.code}`}
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <p className="text-sm font-semibold text-foreground">
                            {inst.name || inst.code}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {inst.code}
                          </p>
                        </TableCell>
                        <TableCell className="py-2 font-mono text-[11px] text-muted-foreground">
                          {inst.category || "—"}
                        </TableCell>
                        <TableCell className="py-2 font-mono text-[11px] text-muted-foreground">
                          {inst.scope || "—"}
                        </TableCell>
                        <TableCell className="py-2 font-mono text-[11px] text-foreground">
                          {inst.listen_port > 0 ? `:${inst.listen_port}` : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setStartDialogOpen(false)}
              disabled={acting}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmStartFromDialog}
              disabled={acting || !canManage || startSelected.size === 0}
            >
              <Play className="h-3.5 w-3.5" />
              Iniciar {startSelected.size > 0 ? `(${startSelected.size})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "neutral" | "success" | "primary";
}) {
  const toneCls =
    tone === "success"
      ? "border-success/30 bg-success/5 text-success"
      : tone === "primary"
        ? "border-primary/30 bg-primary/5 text-primary"
        : "border-border bg-muted/20 text-muted-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border",
            toneCls,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-extrabold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InstanceRow({
  inst,
  selected,
  onToggle,
  onAction,
  onAutoStart,
  acting,
  autoStartBusy,
  canManage,
}: {
  inst: ManageableInstance;
  selected: boolean;
  onToggle: () => void;
  onAction: (a: InstanceAction) => void;
  onAutoStart: (enabled: boolean) => void;
  acting: boolean;
  autoStartBusy: boolean;
  canManage: boolean;
}) {
  const isRunning = inst.running === true;
  const supported = inst.supported_actions ?? [];
  const selectable = inst.selectable !== false;
  const canAutoStart = inst.configured && selectable && canManage;

  const stateTone = isRunning
    ? "border-success/50 bg-success/10 text-success"
    : "border-destructive/50 bg-destructive/10 text-destructive";
  const dot = isRunning ? "bg-success" : "bg-destructive";

  return (
    <TableRow
      className={cn(
        "border-border/60 hover:bg-muted/20",
        selected && "bg-primary/5",
      )}
    >
      <TableCell className="pl-4">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          disabled={!selectable || acting}
          aria-label={`Selecionar ${inst.code}`}
        />
      </TableCell>

      <TableCell className="py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {inst.name || inst.code}
          </p>
          <p className="truncate font-mono text-[10px] text-muted-foreground">
            {inst.code}
            {inst.section_type && <> · {inst.section_type}</>}
          </p>
        </div>
      </TableCell>

      <TableCell className="py-3">
        <span className="font-mono text-[11px] text-muted-foreground">
          {inst.category || "—"}
        </span>
      </TableCell>

      <TableCell className="py-3">
        <span className="font-mono text-[11px] text-muted-foreground">
          {inst.scope || "—"}
        </span>
      </TableCell>

      <TableCell className="py-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
            stateTone,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
          {inst.state || (isRunning ? "running" : "stopped")}
        </span>
        {inst.pid != null && (
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            PID {inst.pid}
          </p>
        )}
      </TableCell>

      <TableCell className="py-3">
        <div className="flex items-center gap-2">
          {autoStartBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              checked={inst.auto_start}
              onCheckedChange={(v) => onAutoStart(v)}
              disabled={!canAutoStart || acting}
              aria-label={`Auto-start ${inst.code}`}
            />
          )}
          {inst.auto_start && inst.auto_start_order != null && (
            <span className="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary">
              #{inst.auto_start_order}
            </span>
          )}
        </div>
      </TableCell>

      <TableCell className="py-3">
        {inst.listen_port > 0 ? (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-foreground">
              :{inst.listen_port}
            </span>
            {inst.listening ? (
              <span className="rounded-full border border-success/40 bg-success/10 px-1.5 py-0 text-[9px] font-bold uppercase text-success">
                listen
              </span>
            ) : (
              <span className="rounded-full border border-muted-foreground/30 bg-muted/20 px-1.5 py-0 text-[9px] font-bold uppercase text-muted-foreground">
                idle
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell className="py-3 pr-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {!isRunning && supported.includes("start") && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onAction("start")}
              disabled={acting || !canManage}
              title="Iniciar"
            >
              <Power className="h-3.5 w-3.5 text-success" />
            </Button>
          )}
          {isRunning && supported.includes("restart") && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onAction("restart")}
              disabled={acting || !canManage}
              title="Reiniciar"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
          {isRunning && supported.includes("stop") && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onAction("stop")}
              disabled={acting || !canManage}
              title="Parar"
            >
              <PowerOff className="h-3.5 w-3.5 text-destructive" />
            </Button>
          )}
          {!isRunning && !supported.includes("start") && (
            <span className="text-[10px] text-muted-foreground">—</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// /admin/server — Operação do Servidor v3.
//
// Foco em operação real + observabilidade premium:
//  - Tab Status: lista DINÂMICA via getManageableServices (sem hardcode),
//    com seleção múltipla, ações em lote (start/stop/restart) e operação
//    geral do servidor.
//  - Tab Logs: tail de logs por origem.
//  - Tab Ações: exportClsconfig + manutenção + system message.
//
// Tudo gated por permissão (manage_servers para destrutivos) e auditado
// via log_audit_event. Confirmação forte para stop/restart, dry-run opt-in.
import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CircuitBoard,
  Database,
  Fingerprint,
  FileText,
  Globe,
  History as HistoryIcon,
  Link2,
  Loader2,
  Play,
  PlayCircle,
  Power,
  PowerOff,
  RefreshCw,
  RotateCcw,
  Server as ServerIcon,
  Shield,
  ShieldOff,
  Sparkles,
  Square,
  Truck,
  User as UserIcon,
  Wrench,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { NoActiveServerState } from "@/components/admin/NoActiveServerState";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "status", label: "Status", icon: Activity, path: "/admin/server" },
  { value: "logs", label: "Logs", icon: FileText, path: "/admin/server/logs" },
  { value: "actions", label: "Export & Reload", icon: Wrench, path: "/admin/server/actions" },
  { value: "history", label: "Histórico", icon: HistoryIcon, path: "/admin/server/history" },
] as const;

const ServerOpsPage = () => {
  const { isSuperadmin } = useAuth();
  const { active } = useServers();
  const { can, loading } = useServerPermissions();
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = useMemo(() => {
    if (location.pathname.startsWith("/admin/server/logs")) return "logs";
    if (location.pathname.startsWith("/admin/server/actions")) return "actions";
    if (location.pathname.startsWith("/admin/server/history")) return "history";
    return "status";
  }, [location.pathname]);

  const allowed = isSuperadmin || can("view");

  if (!active) return <NoActiveServerState />;

  if (!loading && !allowed) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/20 text-destructive">
            <ShieldOff className="h-6 w-6" />
          </div>
          <h2 className="text-base font-extrabold uppercase tracking-wider text-foreground">
            Sem permissão
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Você precisa da permissão <strong>view</strong> neste servidor para
            acessar a Operação do Servidor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="border-b border-border bg-card/60 px-6 py-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <ServerIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
              <Sparkles className="h-3 w-3" />
              v3 · controle real
            </div>
            <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground">
              Operação do Servidor
            </h1>
            <p className="text-xs text-muted-foreground">
              Start/stop/restart em lote, progresso em tempo real e logs
              auditados — gated por permissão <code>manage_servers</code>.
            </p>
          </div>
        </div>

        <Tabs
          value={currentTab}
          onValueChange={(v) => {
            const t = TABS.find((x) => x.value === v);
            if (t) navigate(t.path);
          }}
          className="mt-4"
        >
          <TabsList className="bg-background/40">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger key={t.value} value={t.value} className="gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
        {/* index → renderiza Status inline */}
        {currentTab === "status" && location.pathname === "/admin/server" && (
          <ServerStatusTab />
        )}
      </main>
    </div>
  );
};

export default ServerOpsPage;

/* -------------------------------------------------------------------------- */
/* Status Tab (default — renderizada quando o path é /admin/server)           */
/* Server Ops v3 — lista DINÂMICA via getManageableServices + ações em lote.  */
/* -------------------------------------------------------------------------- */

import {
  pwApi,
  EndpointMissingError,
  PwApiActionError,
  type ManageableService,
  type ServiceControlPayload,
  type ServiceControlResponse,
} from "@/lib/pwApiActions";
import { logAuditEvent } from "@/lib/auditLog";
import { toast } from "sonner";
import { ServerOperationProgressDrawer } from "@/components/admin/ServerOperationProgressDrawer";

/** Ícones temáticos por chave conhecida (apenas visual — a lista vem da API). */
const SERVICE_ICONS: Record<string, typeof Database> = {
  gamedbd: Database,
  gdeliveryd: Truck,
  gacd: UserIcon,
  glink: Link2,
  glinkd: Link2,
  authd: Shield,
  uniquenamed: Fingerprint,
  mysql: Database,
  mariadb: Database,
  httpd: Globe,
  apache: Globe,
  nginx: Globe,
};

type ServerWideAction = "start" | "stop" | "restart";

interface PendingConfirm {
  scope: "selection" | "server";
  action: ServerWideAction;
  services?: string[];
}

function ServerStatusTab() {
  const { active } = useServers();
  const { can } = useServerPermissions();
  const { isSuperadmin } = useAuth();

  const [services, setServices] = useState<ManageableService[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [collectedAt, setCollectedAt] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [endpointMissing, setEndpointMissing] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dryRun, setDryRun] = useState(false);
  const [acting, setActing] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  // Operação async em andamento (start/stop/restart). Quando preenchido,
  // abre o drawer de progresso e dispara polling de getServerOperationStatus.
  const [trackedOp, setTrackedOp] = useState<{ id: string | null; type?: string } | null>(null);

  const canManage = isSuperadmin || can("manage_servers");

  const load = async () => {
    setLoading(true);
    setError(null);
    setEndpointMissing(false);
    try {
      const res = await pwApi.getManageableServices();
      setServices(res.services ?? []);
      setCollectedAt(res.collected_at ?? Date.now());
      // Limpa seleção de serviços que sumiram da lista.
      setSelected((prev) => {
        const valid = new Set((res.services ?? []).map((s) => s.key));
        const next = new Set<string>();
        for (const k of prev) if (valid.has(k)) next.add(k);
        return next;
      });
      void logAuditEvent({
        action: "server_ops.manageable_view",
        tenantId: active?.id ?? null,
        target: "getManageableServices",
        status: "ok",
        metadata: { count: res.services?.length ?? 0 },
      });
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        setEndpointMissing(true);
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
      void logAuditEvent({
        action: "server_ops.manageable_view",
        tenantId: active?.id ?? null,
        target: "getManageableServices",
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  const list = services ?? [];
  const onlineCount = list.filter((s) => s.state === "online").length;
  const offlineCount = list.filter((s) => s.state === "offline").length;
  const selectableKeys = useMemo(
    () => list.filter((s) => s.selectable !== false).map((s) => s.key),
    [list],
  );
  const allSelected =
    selectableKeys.length > 0 && selectableKeys.every((k) => selected.has(k));
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectableKeys));
  }

  function toggleOne(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function requestAction(scope: "selection" | "server", action: ServerWideAction) {
    if (!canManage) {
      toast.error("Sem permissão (manage_servers).");
      return;
    }
    if (scope === "selection" && selected.size === 0) {
      toast.error("Selecione ao menos um serviço.");
      return;
    }
    // start em lote dispensa confirmação forte; stop/restart sempre confirma.
    if (scope === "selection" && action === "start" && !dryRun) {
      void runAction(scope, action);
      return;
    }
    setPendingConfirm({
      scope,
      action,
      services: scope === "selection" ? Array.from(selected) : undefined,
    });
  }

  async function runAction(
    scope: "selection" | "server",
    action: ServerWideAction,
    explicitServices?: string[],
  ) {
    setActing(true);
    setPendingConfirm(null);
    const payload: ServiceControlPayload = {
      verify: true,
      dry_run: dryRun,
    };
    if (scope === "selection") {
      payload.services = explicitServices ?? Array.from(selected);
    } else {
      // "server" scope: a API exige a lista explícita de serviços.
      // Mandamos todos os serviços selecionáveis carregados do getManageableServices.
      payload.services = (services ?? [])
        .filter((s) => s.selectable !== false)
        .map((s) => s.key);
    }
    if (!payload.services || payload.services.length === 0) {
      toast.error("Nenhum serviço disponível para esta ação.");
      setActing(false);
      return;
    }
    const fn =
      action === "start"
        ? pwApi.startService
        : action === "stop"
          ? pwApi.stopService
          : pwApi.restartService;
    const auditAction = `server_ops.${scope}_${action}`;
    try {
      const res: ServiceControlResponse = await fn(payload);
      const okCount = (res.results ?? []).filter((r) => r.success).length;
      const failCount = (res.results ?? []).filter((r) => !r.success).length;
      const summary = res.results
        ? `${okCount} ok${failCount > 0 ? ` · ${failCount} falha(s)` : ""}`
        : res.message ?? "Concluído";
      if (failCount > 0) {
        toast.warning(
          `${labelForAction(action)} parcial${dryRun ? " (dry-run)" : ""}: ${summary}`,
        );
      } else {
        toast.success(
          `${labelForAction(action)}${dryRun ? " (dry-run)" : ""}: ${summary}`,
        );
      }
      // Operação assíncrona disparada pela VPS → abre drawer de progresso.
      // Em dry-run não faz sentido pollar (não muda estado).
      if (!dryRun && res.operation?.id) {
        setTrackedOp({ id: res.operation.id, type: res.operation.type });
      }
      void logAuditEvent({
        action: auditAction,
        tenantId: active?.id ?? null,
        target: payload.services?.join(",") ?? "server",
        status: failCount > 0 ? "error" : "ok",
        metadata: {
          dry_run: dryRun,
          ok: okCount,
          fail: failCount,
          log_file: res.log_file ?? null,
          results: res.results ?? null,
          operation_id: res.operation?.id ?? null,
        },
      });
      // Recarrega estado pós-ação (exceto dry-run, que não muda nada).
      if (!dryRun) {
        // Pequena espera pra serviços terminarem subir/cair antes do refresh.
        setTimeout(() => void load(), 800);
      }
    } catch (e) {
      // 1) Endpoint não existe nesta VPS → notice amigável.
      if (e instanceof EndpointMissingError) {
        setEndpointMissing(true);
        toast.error(`Endpoint ${action}Service ausente nesta VPS.`);
        void logAuditEvent({
          action: auditAction,
          tenantId: active?.id ?? null,
          target: payload.services?.join(",") ?? "server",
          status: "error",
          error: "endpoint_missing",
        });
        return;
      }

      // 2) Falha estruturada (ex.: stop_logservice exit 15) — VPS já devolveu
      //    operation.id. Abrimos o drawer ANTES do toast pra garantir UX e
      //    extraímos a mensagem curta do payload.
      let shortMsg = e instanceof Error ? e.message : String(e);
      if (!dryRun && e instanceof PwApiActionError) {
        const payloadObj = e.payload as {
          error?: string;
          operation?: { id?: string; type?: string; stage?: string };
        };
        if (payloadObj?.operation?.id) {
          setTrackedOp({
            id: payloadObj.operation.id,
            type: payloadObj.operation.type,
          });
        }
        if (payloadObj?.error) shortMsg = payloadObj.error;
      }
      toast.error(`${labelForAction(action)} falhou: ${shortMsg}`, {
        duration: 8000,
      });
      void logAuditEvent({
        action: auditAction,
        tenantId: active?.id ?? null,
        target: payload.services?.join(",") ?? "server",
        status: "error",
        error: shortMsg,
      });
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* ─── Painel de operação geral ─── */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-primary px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-foreground">
              Operação geral
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Ações sobre todo o conjunto de serviços do servidor PW.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-3 py-1.5">
              <Switch
                id="dry-run"
                checked={dryRun}
                onCheckedChange={setDryRun}
                disabled={acting}
              />
              <Label
                htmlFor="dry-run"
                className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Dry-run
              </Label>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => requestAction("server", "start")}
              disabled={acting || !canManage || endpointMissing}
            >
              <Power className="h-3.5 w-3.5" />
              Iniciar servidor
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => requestAction("server", "restart")}
              disabled={acting || !canManage || endpointMissing}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar servidor
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => requestAction("server", "stop")}
              disabled={acting || !canManage || endpointMissing}
            >
              <PowerOff className="h-3.5 w-3.5" />
              Parar servidor
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Lista de instâncias ─── */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-primary px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-foreground">
              Instâncias do servidor
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
              {!loading && services && (
                <>
                  {" "}·{" "}
                  <span className="text-success font-semibold">
                    {onlineCount} online
                  </span>
                  {offlineCount > 0 && (
                    <>
                      {" "}·{" "}
                      <span className="text-destructive font-semibold">
                        {offlineCount} offline
                      </span>
                    </>
                  )}
                  {selected.size > 0 && (
                    <>
                      {" "}·{" "}
                      <span className="text-primary font-semibold">
                        {selected.size} selecionado(s)
                      </span>
                    </>
                  )}
                </>
              )}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={load}
            disabled={loading}
            className="shrink-0"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* Toolbar de seleção */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-primary/5 px-5 py-3">
            <span className="text-xs font-semibold text-foreground">
              {selected.size} serviço(s) selecionado(s)
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
                onClick={() => requestAction("selection", "start")}
                disabled={acting || !canManage}
              >
                <Play className="h-3.5 w-3.5" />
                Iniciar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => requestAction("selection", "restart")}
                disabled={acting || !canManage}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reiniciar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => requestAction("selection", "stop")}
                disabled={acting || !canManage}
              >
                <Square className="h-3.5 w-3.5" />
                Parar
              </Button>
            </div>
          </div>
        )}

        {endpointMissing && (
          <div className="px-5 pb-4 pt-2">
            <EndpointMissingNotice action="getManageableServices" />
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
                      allSelected
                        ? true
                        : someSelected
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={toggleAll}
                    disabled={selectableKeys.length === 0 || acting}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Serviço
                </TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Processos
                </TableHead>
                <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Detalhes
                </TableHead>
                <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground pr-4">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && list.length === 0 && !endpointMissing && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                    Nenhum serviço retornado pela API.
                  </TableCell>
                </TableRow>
              )}
              {loading && list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                    <Loader2 className="inline h-4 w-4 animate-spin" /> Coletando instâncias...
                  </TableCell>
                </TableRow>
              )}
              {list.map((svc) => (
                <ServiceRow
                  key={svc.key}
                  service={svc}
                  selected={selected.has(svc.key)}
                  onToggle={() => toggleOne(svc.key)}
                  onAction={(a) => {
                    if (!canManage) {
                      toast.error("Sem permissão (manage_servers).");
                      return;
                    }
                    if (a === "start" && !dryRun) {
                      void runAction("selection", a, [svc.key]);
                      return;
                    }
                    setPendingConfirm({
                      scope: "selection",
                      action: a,
                      services: [svc.key],
                    });
                  }}
                  acting={acting}
                  canManage={canManage}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ─── Confirmação forte ─── */}
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
                {pendingConfirm?.scope === "server" ? (
                  <p>
                    Esta operação afeta <strong>todo o servidor PW</strong>. Tem
                    certeza?
                  </p>
                ) : (
                  <>
                    <p>
                      Esta operação será aplicada aos serviços abaixo:
                    </p>
                    <ul className="list-disc pl-5 font-mono text-foreground">
                      {(pendingConfirm?.services ?? []).map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </>
                )}
                {!dryRun && pendingConfirm?.action !== "start" && (
                  <p className="text-destructive">
                    ⚠ Esta ação interrompe processos em execução. Jogadores podem ser
                    desconectados.
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
                  pendingConfirm.services,
                );
              }}
              disabled={acting}
              className={cn(
                pendingConfirm?.action !== "start" &&
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

      {/* ─── Drawer de progresso da operação async ─── */}
      <ServerOperationProgressDrawer
        open={trackedOp !== null}
        operationId={trackedOp?.id ?? null}
        type={trackedOp?.type}
        onClose={() => {
          setTrackedOp(null);
          // Refresh ao fechar pra refletir o estado final.
          void load();
        }}
      />
    </div>
  );
}

function labelForAction(a: ServerWideAction): string {
  return a === "start" ? "Iniciar" : a === "stop" ? "Parar" : "Reiniciar";
}

function ServiceRow({
  service,
  selected,
  onToggle,
  onAction,
  acting,
  canManage,
}: {
  service: ManageableService;
  selected: boolean;
  onToggle: () => void;
  onAction: (action: ServerWideAction) => void;
  acting: boolean;
  canManage: boolean;
}) {
  const Icon = SERVICE_ICONS[service.key] ?? CircuitBoard;
  const isOnline = service.state === "online";
  const isOffline = service.state === "offline";
  const supported = service.supported_actions ?? ["start", "stop", "restart"];
  const selectable = service.selectable !== false;

  const statusTone = isOnline
    ? "border-success/50 bg-success/10 text-success"
    : isOffline
      ? "border-destructive/50 bg-destructive/10 text-destructive"
      : "border-border bg-muted/30 text-muted-foreground";

  const dot = isOnline
    ? "bg-success"
    : isOffline
      ? "bg-destructive"
      : "bg-muted-foreground";

  const procTone = isOnline
    ? "border-success/50 bg-success/15 text-success"
    : isOffline
      ? "border-destructive/50 bg-destructive/15 text-destructive"
      : "border-border bg-muted/30 text-muted-foreground";

  const iconTone = isOnline
    ? "border-success/30 bg-success/5 text-success"
    : isOffline
      ? "border-destructive/30 bg-destructive/5 text-destructive"
      : "border-border bg-muted/20 text-muted-foreground";

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
          aria-label={`Selecionar ${service.key}`}
        />
      </TableCell>

      <TableCell className="py-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border",
              iconTone,
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {service.label || service.key}
            </p>
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              {service.process_name ?? service.key}
              {service.port != null && <> · :{service.port}</>}
            </p>
            {service.aliases && service.aliases.length > 0 && (
              <p className="mt-0.5 truncate font-mono text-[9px] text-muted-foreground/80">
                aliases: {service.aliases.join(", ")}
              </p>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell className="py-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
            statusTone,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
          {service.state}
        </span>
      </TableCell>

      <TableCell className="py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              procTone,
            )}
          >
            {isOnline ? "ON" : isOffline ? "OFF" : "—"}
          </span>
          <span className="font-mono text-sm font-semibold text-foreground">
            {service.process_count ?? "—"}
          </span>
        </div>
      </TableCell>

      <TableCell className="py-3 text-right">
        <div className="flex flex-col items-end gap-0.5 text-[10px] text-muted-foreground">
          {service.pid != null && (
            <span>
              PID <span className="font-mono text-foreground">{service.pid}</span>
            </span>
          )}
          {service.systemd_state && (
            <span>
              systemd{" "}
              <span className="font-mono text-foreground">{service.systemd_state}</span>
            </span>
          )}
          {service.listening != null && (
            <span>
              porta{" "}
              <span
                className={cn(
                  "font-mono",
                  service.listening ? "text-success" : "text-destructive",
                )}
              >
                {service.listening ? "LISTEN" : "fechada"}
              </span>
            </span>
          )}
          {service.pid == null &&
            !service.systemd_state &&
            service.listening == null && <span>—</span>}
        </div>
      </TableCell>

      <TableCell className="py-3 pr-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {supported.includes("start") && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onAction("start")}
              disabled={acting || !canManage || isOnline}
              title="Iniciar"
            >
              <Play className="h-3.5 w-3.5 text-success" />
            </Button>
          )}
          {supported.includes("restart") && (
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
          {supported.includes("stop") && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onAction("stop")}
              disabled={acting || !canManage || !isOnline}
              title="Parar"
            >
              <Square className="h-3.5 w-3.5 text-destructive" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}


/** Aceita ISO string OU epoch (segundos/ms). */
function formatCollectedAt(v: string | number): string {
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleTimeString();
  }
  // epoch: <1e12 = segundos, senão milissegundos.
  const ms = v < 1e12 ? v * 1000 : v;
  return new Date(ms).toLocaleTimeString();
}

/* -------------------------------------------------------------------------- */
/* Helpers compartilhados                                                     */
/* -------------------------------------------------------------------------- */

export function EndpointMissingNotice({ action }: { action: string }) {
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-amber-500">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="text-xs font-bold uppercase tracking-wider">
            Não implementado nesta VPS
          </p>
          <p className="mt-1 text-xs text-amber-500/90">
            O endpoint <code className="font-mono">?action={action}</code> ainda
            não foi instalado neste servidor. Atualize o{" "}
            <code className="font-mono">api_cls.php</code> via{" "}
            <a href="/install" className="underline">
              /install
            </a>{" "}
            para habilitar este recurso.
          </p>
        </div>
      </div>
    </div>
  );
}

// Re-export para subpáginas evitarem import circular.
export { CircuitBoard, PlayCircle };

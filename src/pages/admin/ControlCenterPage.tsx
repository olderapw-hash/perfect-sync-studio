// /admin/server/control — Central de Controle (NOC).
//
// Dashboard operacional premium baseado no snapshot único
// `getControlCenterSnapshot`, com tabs auxiliares para Logs,
// Backups e Watchdog.
//
// Direção visual: control-center / NOC. Cores de estado bem
// claras, leitura rápida, foco em monitoramento e ação.
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronRight,
  CircuitBoard,
  Clock,
  Cpu,
  Database,
  FileText,
  Gauge,
  HardDrive,
  History as HistoryIcon,
  Loader2,
  MemoryStick,
  PauseCircle,
  PlayCircle,
  Power,
  RefreshCw,
  RotateCcw,
  Server as ServerIcon,
  ShieldAlert,
  ShieldCheck,
  Square,
  Wifi,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { NoActiveServerState } from "@/components/admin/NoActiveServerState";
import { EndpointMissingNotice } from "@/components/admin/EndpointMissingNotice";

import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import {
  EndpointMissingError,
  pwApi,
  type ControlCenterSnapshot,
  type ManageableInstance,
  type ManageableService,
  type PanelBackupKind,
  type PanelBackupRecord,
  type ServerLogEntry,
  type ServerLogSource,
  type WatchdogConfig,
  type WatchdogHistoryEntry,
  type WatchdogStatusBlock,
} from "@/lib/pwApiActions";
import { logAuditEvent } from "@/lib/auditLog";
import { cn } from "@/lib/utils";

const POLL_MS = 15_000;

const LOG_SOURCES: ServerLogSource[] = [
  "apicls",
  "authd",
  "exportclsconfig",
  "gacd",
  "gamedbd",
  "gdeliveryd",
  "gfactiond",
  "glinkd",
  "gs01",
  "httpd",
  "logservice",
  "mail",
  "mysql",
  "uniquenamed",
  "world2",
  "world2.formatlog",
];

const BACKUP_TYPES: PanelBackupKind[] = [
  "gamedbd",
  "clsconfig",
  "mysql",
  "uniquenamed",
  "panel",
  "full",
];

/* -------------------------------------------------------------------------- */
/* Página principal                                                            */
/* -------------------------------------------------------------------------- */

export default function ControlCenterPage() {
  const { active } = useServers();
  const { isSuperadmin } = useAuth();
  const { can, loading: permLoading } = useServerPermissions();
  const [tab, setTab] = useState<"dashboard" | "logs" | "backups" | "watchdog">("dashboard");

  if (!active) return <NoActiveServerState />;
  const allowed = isSuperadmin || can("view");
  if (!permLoading && !allowed) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center">
          <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h2 className="text-base font-extrabold uppercase tracking-wider text-foreground">
            Sem permissão
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Permissão <strong>view</strong> obrigatória para a Central de Controle.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <header className="border-b border-border bg-gradient-to-r from-card/80 via-card/60 to-card/80 px-6 py-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <Gauge className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
              <Zap className="h-3 w-3" />
              NOC · v1
            </div>
            <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground">
              Central de Controle
            </h1>
            <p className="text-xs text-muted-foreground">
              Saúde do host, serviços, instâncias, manutenção, watchdog e
              alertas em uma só tela.
            </p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-4">
          <TabsList className="bg-background/40">
            <TabsTrigger value="dashboard" className="gap-2">
              <Activity className="h-3.5 w-3.5" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <FileText className="h-3.5 w-3.5" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="backups" className="gap-2">
              <Archive className="h-3.5 w-3.5" />
              Backups
            </TabsTrigger>
            <TabsTrigger value="watchdog" className="gap-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              Watchdog
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {tab === "dashboard" && <DashboardTab />}
        {tab === "logs" && <LogsTab />}
        {tab === "backups" && <BackupsTab />}
        {tab === "watchdog" && <WatchdogTab />}
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                   */
/* -------------------------------------------------------------------------- */

function DashboardTab() {
  const { active } = useServers();
  const [snapshot, setSnapshot] = useState<ControlCenterSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpointMissing, setEndpointMissing] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setEndpointMissing(false);
    try {
      const res = await pwApi.getControlCenterSnapshot();
      setSnapshot(res.snapshot ?? null);
      setRefreshedAt(Date.now());
      void logAuditEvent({
        action: "control_center.snapshot",
        tenantId: active?.id ?? null,
        target: "getControlCenterSnapshot",
        status: "ok",
      });
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        setEndpointMissing(true);
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setLoading(false);
    }
  }, [active?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [autoRefresh, load]);

  if (endpointMissing) return <EndpointMissingNotice action="getControlCenterSnapshot" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>
            {refreshedAt
              ? `Atualizado ${new Date(refreshedAt).toLocaleTimeString()}`
              : "Carregando snapshot..."}
          </span>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card/40 px-2 py-1">
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} id="auto-refresh" />
            <Label htmlFor="auto-refresh" className="text-[10px] font-bold uppercase tracking-wider">
              Auto · 15s
            </Label>
          </div>
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <MaintenanceBanner snapshot={snapshot} />
      <AlertsBanner alerts={snapshot?.alerts} />

      <ServerWideOpsPanel onChange={() => void load()} />
      <HostHealthGrid snapshot={snapshot} loading={loading && !snapshot} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ServicesSummaryPanel snapshot={snapshot} loading={loading && !snapshot} />
        </div>
        <WatchdogMiniPanel watchdog={snapshot?.watchdog} loading={loading && !snapshot} />
      </div>

      <InstancesPanel snapshot={snapshot} loading={loading && !snapshot} />

      <RecentOperationsPanel snapshot={snapshot} loading={loading && !snapshot} />
    </div>
  );
}

/* ---- Maintenance / Alerts banners ---- */

function MaintenanceBanner({ snapshot }: { snapshot: ControlCenterSnapshot | null }) {
  const m = snapshot?.maintenance;
  if (!m?.enabled) return null;
  const tooltip = [
    m.reason && `Motivo: ${m.reason}`,
    m.started_at && `Início: ${fmtDate(m.started_at)}`,
    m.ends_at && `Fim previsto: ${fmtDate(m.ends_at)}`,
    m.updated_by && `Por: ${m.updated_by}`,
  ]
    .filter(Boolean)
    .join("\n");
  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-500"
      title={tooltip || undefined}
    >
      <Wrench className="h-3.5 w-3.5 shrink-0" />
      <span className="font-extrabold uppercase tracking-widest">Manutenção ativa</span>
      {m.eta_minutes != null && (
        <Badge variant="outline" className="border-amber-500/60 text-amber-500">
          ETA {m.eta_minutes} min
        </Badge>
      )}
      {m.reason && (
        <span className="truncate text-foreground/80">— {m.reason}</span>
      )}
      <a
        href="/admin/server/messages"
        className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 hover:underline"
      >
        Gerenciar <ChevronRight className="h-3 w-3" />
      </a>
    </div>
  );
}

function AlertsBanner({ alerts }: { alerts?: ControlCenterSnapshot["alerts"] }) {
  if (!alerts || alerts.length === 0) return null;
  const order: Record<string, number> = { critical: 3, error: 3, warn: 2, warning: 2, info: 1 };
  const sorted = [...alerts].sort(
    (a, b) =>
      (order[(b.severity ?? "info").toLowerCase()] ?? 0) -
      (order[(a.severity ?? "info").toLowerCase()] ?? 0),
  );
  const worst = (sorted[0]?.severity ?? "info").toLowerCase();
  const tone =
    worst === "critical" || worst === "error"
      ? "border-destructive/50 bg-destructive/10 text-destructive"
      : worst.startsWith("warn")
        ? "border-amber-500/50 bg-amber-500/10 text-amber-500"
        : "border-primary/40 bg-primary/10 text-primary";
  const Icon =
    worst === "critical" || worst === "error"
      ? XCircle
      : worst.startsWith("warn")
        ? AlertTriangle
        : AlertCircle;
  const visible = sorted.slice(0, 3);
  const extra = sorted.length - visible.length;

  return (
    <div className={cn("rounded-md border p-2.5 text-xs", tone)}>
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest">
          {sorted.length} alerta{sorted.length > 1 ? "s" : ""}
        </span>
        <span className="opacity-70">· pior: {worst}</span>
      </div>
      <ul className="mt-1.5 space-y-0.5">
        {visible.map((a, i) => (
          <li key={a.id ?? i} className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="font-semibold text-foreground">{a.title ?? a.message ?? "—"}</span>
            {a.source && <span className="font-mono text-[10px] opacity-70">[{a.source}]</span>}
            {a.created_at && (
              <span className="ml-auto text-[10px] opacity-60">{fmtDate(a.created_at)}</span>
            )}
          </li>
        ))}
        {extra > 0 && <li className="text-[10px] opacity-70">+{extra} alerta(s)…</li>}
      </ul>
    </div>
  );
}

/* ---- Host health ---- */

function HostHealthGrid({
  snapshot,
  loading,
}: {
  snapshot: ControlCenterSnapshot | null;
  loading: boolean;
}) {
  const h = snapshot?.host;
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Saúde do host
        </h2>
        {h?.hostname && (
          <span className="font-mono text-[10px] text-muted-foreground">
            {h.hostname}
            {h.ip ? ` · ${h.ip}` : ""}
          </span>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          icon={Cpu}
          label="CPU"
          value={h?.cpu_percent != null ? `${h.cpu_percent.toFixed(0)}%` : "—"}
          sub={h?.cpu_cores ? `${h.cpu_cores} cores` : undefined}
          progress={h?.cpu_percent ?? null}
          tone={toneFor(h?.cpu_percent, 75, 90)}
        />
        <MetricCard
          icon={MemoryStick}
          label="RAM"
          value={h?.memory?.percent != null ? `${h.memory.percent.toFixed(0)}%` : "—"}
          sub={
            h?.memory?.used_mb != null && h?.memory?.total_mb != null
              ? `${fmtMb(h.memory.used_mb)} / ${fmtMb(h.memory.total_mb)}`
              : undefined
          }
          progress={h?.memory?.percent ?? null}
          tone={toneFor(h?.memory?.percent, 75, 90)}
        />
        <MetricCard
          icon={HardDrive}
          label="Disco"
          value={h?.disk?.percent != null ? `${h.disk.percent.toFixed(0)}%` : "—"}
          sub={
            h?.disk?.used_gb != null && h?.disk?.total_gb != null
              ? `${h.disk.used_gb.toFixed(0)} / ${h.disk.total_gb.toFixed(0)} GB`
              : h?.disk?.mountpoint
          }
          progress={h?.disk?.percent ?? null}
          tone={toneFor(h?.disk?.percent, 80, 92)}
        />
        <MetricCard
          icon={Clock}
          label="Uptime"
          value={h?.uptime_human ?? (h?.uptime_seconds ? fmtDuration(h.uptime_seconds) : "—")}
          tone="ok"
        />
        <MetricCard
          icon={Activity}
          label="Load avg"
          value={
            Array.isArray(h?.load_average) && h.load_average.length > 0
              ? h.load_average
                  .slice(0, 3)
                  .map((v) => Number(v).toFixed(2))
                  .join(" · ")
              : "—"
          }
          sub="1m · 5m · 15m"
          tone={toneFor(h?.load_average?.[0], h?.cpu_cores ?? 4, (h?.cpu_cores ?? 4) * 1.5)}
        />
        <MetricCard
          icon={Wifi}
          label="Latência"
          value={h?.ping_ms != null ? `${h.ping_ms.toFixed(0)} ms` : "—"}
          sub={h?.response_time_ms != null ? `resposta ${h.response_time_ms.toFixed(0)} ms` : undefined}
          tone={toneFor(h?.ping_ms ?? undefined, 100, 250)}
        />
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  progress,
  tone = "ok",
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
  sub?: string;
  progress?: number | null;
  tone?: "ok" | "warn" | "danger" | "muted";
}) {
  const ring =
    tone === "danger"
      ? "border-destructive/50 bg-destructive/5"
      : tone === "warn"
        ? "border-amber-500/40 bg-amber-500/5"
        : tone === "muted"
          ? "border-border bg-card/40"
          : "border-emerald-500/30 bg-emerald-500/5";
  const accent =
    tone === "danger"
      ? "text-destructive"
      : tone === "warn"
        ? "text-amber-500"
        : tone === "muted"
          ? "text-muted-foreground"
          : "text-emerald-500";
  return (
    <div className={cn("rounded-xl border p-4 backdrop-blur-md transition-colors", ring)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <Icon className={cn("h-4 w-4", accent)} />
      </div>
      <div className="mt-2 font-mono text-xl font-bold text-foreground">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
      {progress != null && Number.isFinite(progress) && (
        <Progress
          value={Math.max(0, Math.min(100, progress))}
          className={cn("mt-3 h-1.5", tone === "danger" && "[&>div]:bg-destructive", tone === "warn" && "[&>div]:bg-amber-500")}
        />
      )}
    </div>
  );
}

/* ---- Services ---- */

function ServerWideOpsPanel({ onChange }: { onChange: () => void }) {
  const { isSuperadmin } = useAuth();
  const { can } = useServerPermissions();
  const canManage = isSuperadmin || can("manage_servers");
  const [dryRun, setDryRun] = useState(false);
  const [busy, setBusy] = useState<"start" | "stop" | "restart" | null>(null);
  const [confirm, setConfirm] = useState<"stop" | "restart" | null>(null);
  const [reason, setReason] = useState("");

  const run = async (action: "start" | "stop" | "restart", reasonText?: string) => {
    if (!canManage) {
      toast.error("Sem permissão (manage_servers).");
      return;
    }
    setBusy(action);
    setConfirm(null);
    const trimmed = (reasonText ?? "").trim();
    const payload = {
      verify: true,
      dry_run: dryRun,
      ...(trimmed.length >= 3 ? { reason: trimmed } : {}),
    };
    try {
      const fn =
        action === "start"
          ? pwApi.startServer
          : action === "stop"
            ? pwApi.stopServer
            : pwApi.restartServer;
      const res = await fn(payload);
      const okCount = (res.results ?? []).filter((r) => r.success).length;
      const failCount = (res.results ?? []).filter((r) => !r.success).length;
      const summary = res.results
        ? `${okCount} ok${failCount > 0 ? ` · ${failCount} falha(s)` : ""}`
        : res.message ?? "Concluído";
      if (failCount > 0) {
        toast.warning(`${action}${dryRun ? " (dry-run)" : ""}: ${summary}`);
      } else {
        toast.success(`${action}${dryRun ? " (dry-run)" : ""}: ${summary}`);
      }
      if (!dryRun) setTimeout(onChange, 800);
    } catch (e) {
      toast.error(`${action} falhou: ${e instanceof Error ? e.message : String(e)}`, {
        duration: 8000,
      });
    } finally {
      setBusy(null);
      setReason("");
    }
  };

  return (
    <>
      <Card className="border-border bg-card/60 backdrop-blur-md">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-primary p-5">
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-foreground">
              Operação geral
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Ações sobre todo o conjunto de serviços do servidor PW.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-3 py-1.5">
              <Switch
                id="noc-dry-run"
                checked={dryRun}
                onCheckedChange={setDryRun}
                disabled={!canManage || busy != null}
              />
              <Label
                htmlFor="noc-dry-run"
                className="cursor-pointer text-[10px] font-bold uppercase tracking-wider"
              >
                Dry-run
              </Label>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={!canManage || busy != null}
              onClick={() => void run("start")}
              className="gap-1.5"
            >
              {busy === "start" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Power className="h-3.5 w-3.5 text-emerald-500" />
              )}
              Iniciar servidor
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!canManage || busy != null}
              onClick={() => setConfirm("restart")}
              className="gap-1.5"
            >
              {busy === "restart" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5 text-amber-500" />
              )}
              Reiniciar servidor
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={!canManage || busy != null}
              onClick={() => setConfirm("stop")}
              className="gap-1.5"
            >
              {busy === "stop" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PauseCircle className="h-3.5 w-3.5" />
              )}
              Parar servidor
            </Button>
          </div>
        </CardContent>
      </Card>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground">
              Confirmar {confirm === "stop" ? "parada" : "reinício"} do servidor
            </h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Esta ação afeta o servidor inteiro e todos os jogadores conectados.
              {dryRun && " (dry-run ativo — nada será executado de verdade.)"}
            </p>
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="noc-reason" className="text-[10px] font-bold uppercase tracking-wider">
                Motivo (mínimo 3 caracteres)
              </Label>
              <Input
                id="noc-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: manutenção emergencial"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirm(null)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                variant={confirm === "stop" ? "destructive" : "default"}
                disabled={reason.trim().length < 3}
                onClick={() => void run(confirm, reason)}
              >
                Confirmar {confirm === "stop" ? "parada" : "reinício"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ServicesSummaryPanel({
  snapshot,
  loading,
}: {
  snapshot: ControlCenterSnapshot | null;
  loading: boolean;
}) {
  // Tabela ÚNICA de serviços. Preferimos `manageable` quando vier (é o
  // superconjunto operável); caímos pra `all` quando o backend só envia
  // a listagem genérica. Nunca renderizamos as duas listas separadas.
  const services = useMemo(() => {
    const m = snapshot?.services?.manageable ?? [];
    const a = snapshot?.services?.all ?? [];
    if (m.length > 0 && a.length > 0) {
      const seen = new Set(m.map((s) => s.key));
      return [...m, ...a.filter((s) => !seen.has(s.key))];
    }
    return m.length > 0 ? m : a;
  }, [snapshot]);
  const summary = snapshot?.services?.summary;

  // Ordena: críticos offline → offline → online (estável dentro de cada grupo).
  const ordered = useMemo(() => {
    const rank = (s: ManageableService) => {
      if (s.state === "offline" && CRITICAL_SERVICES.has(s.key)) return 0;
      if (s.state === "offline") return 1;
      if (s.state === "online") return 3;
      return 2;
    };
    return [...services].sort((a, b) => rank(a) - rank(b));
  }, [services]);

  return (
    <Card className="border-border bg-card/60 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-sm font-extrabold uppercase tracking-widest text-foreground">
            Serviços
          </CardTitle>
          {summary && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              <span className="text-emerald-500">● {summary.online ?? 0} online</span>
              {" · "}
              <span className="text-destructive">● {summary.offline ?? 0} offline</span>
              {summary.critical_offline ? (
                <>
                  {" · "}
                  <span className="font-bold text-destructive">
                    {summary.critical_offline} críticos!
                  </span>
                </>
              ) : null}
            </p>
          )}
        </div>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <a href="/admin/server">
            Operação
            <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading && ordered.length === 0 ? (
          <Skeleton className="m-4 h-20 rounded-lg" />
        ) : ordered.length === 0 ? (
          <div className="p-4">
            <EmptyHint icon={Database}>Nenhum serviço reportado.</EmptyHint>
          </div>
        ) : (
          <div className="max-h-[360px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
                <tr className="border-b border-border/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <th className="w-6 py-2 pl-4" />
                  <th className="py-2 text-left">Serviço</th>
                  <th className="py-2 text-left">Detalhes</th>
                  <th className="py-2 pr-4 text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((svc) => {
                  const offline = svc.state === "offline";
                  const critical = offline && CRITICAL_SERVICES.has(svc.key);
                  return (
                    <tr
                      key={svc.key}
                      className={cn(
                        "border-b border-border/30 last:border-0",
                        critical && "bg-destructive/5",
                        offline && !critical && "bg-amber-500/5",
                      )}
                    >
                      <td className="py-1.5 pl-4">
                        <StateDot state={svc.state} pulse={critical} />
                      </td>
                      <td className="py-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-foreground">{svc.key}</span>
                          {critical && (
                            <Badge
                              variant="outline"
                              className="border-destructive/60 px-1 py-0 text-[9px] text-destructive"
                            >
                              CRÍT
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="truncate py-1.5 text-[11px] text-muted-foreground">
                        {svc.label ?? svc.process_name ?? "—"}
                        {svc.pid ? ` · pid ${svc.pid}` : ""}
                        {svc.port ? ` · :${svc.port}` : ""}
                      </td>
                      <td className="py-1.5 pr-4 text-right">
                        <span
                          className={cn(
                            "font-mono text-[10px] uppercase",
                            svc.state === "online"
                              ? "text-emerald-500"
                              : svc.state === "offline"
                                ? "text-destructive"
                                : "text-muted-foreground",
                          )}
                        >
                          {svc.state ?? "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const CRITICAL_SERVICES = new Set([
  "gamedbd",
  "gdeliveryd",
  "authd",
  "uniquenamed",
  "gacd",
  "glinkd",
  "mysql",
  "mariadb",
]);

/* ---- Instances ---- */

function InstancesPanel({
  snapshot,
  loading,
}: {
  snapshot: ControlCenterSnapshot | null;
  loading: boolean;
  /** Mantido por compatibilidade — o painel é read-only agora. */
  onChange?: () => void;
}) {
  const items = snapshot?.instances?.items ?? [];
  const summary = snapshot?.instances?.summary;
  const groups = useMemo(() => {
    const g = new Map<string, ManageableInstance[]>();
    for (const i of items) {
      const cat = i.category ?? "outras";
      if (!g.has(cat)) g.set(cat, []);
      g.get(cat)!.push(i);
    }
    return Array.from(g.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  return (
    <Card className="border-border bg-card/60 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-sm font-extrabold uppercase tracking-widest text-foreground">
            Instâncias
          </CardTitle>
          {summary && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              <span className="text-emerald-500">● {summary.running ?? 0} rodando</span>
              {" · "}
              <span className="text-muted-foreground">● {summary.stopped ?? 0} paradas</span>
              {summary.auto_start != null && ` · ${summary.auto_start} auto-start`}
            </p>
          )}
        </div>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <a href="/admin/server/instances">
            Gerenciar
            <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </Button>
      </CardHeader>
      <CardContent>
        {loading && items.length === 0 ? (
          <Skeleton className="h-24 rounded-lg" />
        ) : items.length === 0 ? (
          <EmptyHint icon={CircuitBoard}>Nenhuma instância configurada.</EmptyHint>
        ) : (
          <div className="space-y-3">
            {groups.map(([cat, list]) => {
              const running = list.filter((i) => i.running || i.state === "running").length;
              return (
                <div key={cat}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                      {cat}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      <span className="text-emerald-500">{running}</span>/{list.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {list.map((i) => {
                      const isRunning = i.running || i.state === "running";
                      return (
                        <div
                          key={i.code}
                          title={[
                            i.name && `Nome: ${i.name}`,
                            i.listen_port && `Porta: ${i.listen_port}`,
                            i.pid && `PID: ${i.pid}`,
                            i.auto_start && "Auto-start",
                          ]
                            .filter(Boolean)
                            .join("\n")}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px]",
                            isRunning
                              ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                              : "border-border bg-background/40 text-muted-foreground",
                          )}
                        >
                          <StateDot state={isRunning ? "online" : "offline"} />
                          <span className="font-bold">{i.code}</span>
                          {i.auto_start && (
                            <span className="text-[9px] uppercase text-primary">auto</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---- Recent operations ---- */

function RecentOperationsPanel({
  snapshot,
  loading,
}: {
  snapshot: ControlCenterSnapshot | null;
  loading: boolean;
}) {
  const allOps = snapshot?.operations?.recent ?? [];
  const ops = allOps.slice(0, 6);
  const extra = allOps.length - ops.length;
  return (
    <Card className="border-border bg-card/60 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-extrabold uppercase tracking-widest text-foreground">
          Operações recentes
        </CardTitle>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <a href="/admin/server/history">
            Histórico
            <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </Button>
      </CardHeader>
      <CardContent>
        {loading && ops.length === 0 ? (
          <Skeleton className="h-24 rounded-lg" />
        ) : ops.length === 0 ? (
          <EmptyHint icon={HistoryIcon}>Sem operações registradas.</EmptyHint>
        ) : (
          <div className="space-y-1.5">
            {ops.map((op, i) => {
              const ok = op.success === true || op.success_state === "success";
              const failed = op.success === false || op.success_state === "failed" || op.success_state === "error";
              const running = op.success_state === "running";
              const items = [...(op.services ?? []), ...(op.instances ?? [])];
              return (
                <div
                  key={op.id ?? i}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-border/60 bg-background/40 px-3 py-2"
                >
                  {running ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  ) : ok ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : failed ? (
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                  ) : (
                    <PauseCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="font-mono text-xs font-bold text-foreground">{op.type}</span>
                  {op.stage && (
                    <Badge variant="outline" className="border-border text-[9px] uppercase">
                      {op.stage}
                    </Badge>
                  )}
                  {items.length > 0 && (
                    <span className="truncate font-mono text-[10px] text-muted-foreground">
                      {items.slice(0, 3).join(", ")}
                      {items.length > 3 ? ` +${items.length - 3}` : ""}
                    </span>
                  )}
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {fmtDate(op.completed_at ?? op.created_at)}
                  </span>
                </div>
              );
            })}
            {extra > 0 && (
              <a
                href="/admin/server/history"
                className="block pt-1 text-center text-[10px] text-muted-foreground hover:text-primary"
              >
                +{extra} operação(ões) — ver histórico completo
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---- Watchdog mini panel (in dashboard) ---- */

function WatchdogMiniPanel({
  watchdog,
  loading,
}: {
  watchdog?: WatchdogStatusBlock;
  loading: boolean;
}) {
  const enabled = watchdog?.enabled ?? false;
  const result = watchdog?.last_result;
  const failure = watchdog?.critical_failure;
  const tone = !enabled
    ? "muted"
    : failure || result === "failed"
      ? "danger"
      : result === "degraded"
        ? "warn"
        : "ok";
  const ring =
    tone === "danger"
      ? "border-destructive/50 bg-destructive/10"
      : tone === "warn"
        ? "border-amber-500/40 bg-amber-500/10"
        : tone === "muted"
          ? "border-border bg-card/40"
          : "border-emerald-500/30 bg-emerald-500/10";
  return (
    <Card className={cn("backdrop-blur-md", ring)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-extrabold uppercase tracking-widest text-foreground">
          Watchdog
        </CardTitle>
        {enabled ? (
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
        ) : (
          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        {loading && !watchdog ? (
          <Skeleton className="h-16 rounded-lg" />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estado</span>
              <Badge
                variant="outline"
                className={cn(
                  enabled ? "border-emerald-500/40 text-emerald-500" : "border-border text-muted-foreground",
                )}
              >
                {enabled ? "ATIVO" : "DESATIVADO"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Último resultado</span>
              <ResultBadge result={result} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Última checagem</span>
              <span className="font-mono text-[11px]">{fmtDate(watchdog?.last_check_at)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Cooldown</span>
              <span className="font-mono text-[11px]">
                {watchdog?.cooldown_seconds ? `${watchdog.cooldown_seconds}s` : "—"}
              </span>
            </div>
            {watchdog?.unhealthy_services && watchdog.unhealthy_services.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Não saudáveis
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {watchdog.unhealthy_services.map((s) => (
                    <Badge
                      key={s}
                      variant="outline"
                      className="border-destructive/50 font-mono text-[10px] text-destructive"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <a
          href="/admin/control-center?tab=watchdog"
          className="block pt-1 text-right text-[10px] text-muted-foreground hover:text-primary"
        >
          Configurar →
        </a>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Logs Tab                                                                    */
/* -------------------------------------------------------------------------- */

function LogsTab() {
  const [source, setSource] = useState<ServerLogSource>("gamedbd");
  const [lines, setLines] = useState(20);
  const [data, setData] = useState<ServerLogEntry[]>([]);
  const [file, setFile] = useState<string | undefined>();
  const [warning, setWarning] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [endpointMissing, setEndpointMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setEndpointMissing(false);
    try {
      const res = await pwApi.getServerLogs({ source, lines });
      setData(res.entries ?? []);
      setFile(res.file);
      setWarning(res.warning);
    } catch (e) {
      if (e instanceof EndpointMissingError) setEndpointMissing(true);
      else setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [source, lines]);

  useEffect(() => {
    void load();
  }, [load]);

  if (endpointMissing) return <EndpointMissingNotice action="getServerLogs" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Fonte
          </Label>
          <Select value={source} onValueChange={(v) => setSource(v as ServerLogSource)}>
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOG_SOURCES.map((s) => (
                <SelectItem key={s} value={s} className="font-mono text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Linhas
          </Label>
          <Input
            type="number"
            min={1}
            max={500}
            value={lines}
            onChange={(e) => setLines(Math.max(1, Math.min(500, Number(e.target.value) || 20)))}
            className="h-9 w-[100px]"
          />
        </div>
        <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Atualizar
        </Button>
        {file && (
          <span className="ml-auto truncate font-mono text-[10px] text-muted-foreground">
            {file}
          </span>
        )}
      </div>

      {warning && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
          {warning}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-black/40 p-1 backdrop-blur-md">
        <ScrollArea className="h-[60vh] w-full">
          {loading && data.length === 0 ? (
            <div className="flex items-center justify-center gap-2 p-6 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Carregando...
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center gap-2 p-6 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Nenhuma linha disponível.
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-words p-3 font-mono text-[11px] leading-relaxed text-foreground/90">
              {data
                .map((e) => (e.ts ? `[${e.ts}] ${e.line}` : e.line))
                .join("\n")}
            </pre>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Backups Tab                                                                 */
/* -------------------------------------------------------------------------- */

function BackupsTab() {
  const { isSuperadmin } = useAuth();
  const { can } = useServerPermissions();
  const canAct = isSuperadmin || can("manage_servers");
  const [filter, setFilter] = useState<PanelBackupKind | "all">("all");
  const [items, setItems] = useState<PanelBackupRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<PanelBackupKind | null>(null);
  const [endpointMissing, setEndpointMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setEndpointMissing(false);
    try {
      const res = await pwApi.listPanelBackups({
        limit: 20,
        type: filter === "all" ? undefined : filter,
      });
      let list = res.backups ?? [];
      if ((!list || list.length === 0) && res.grouped) {
        list = Object.values(res.grouped).flat();
      }
      list = list.sort((a, b) => {
        const ta = typeof a.created_at === "number" ? a.created_at : Date.parse(String(a.created_at)) / 1000;
        const tb = typeof b.created_at === "number" ? b.created_at : Date.parse(String(b.created_at)) / 1000;
        return (tb || 0) - (ta || 0);
      });
      setItems(list);
    } catch (e) {
      if (e instanceof EndpointMissingError) setEndpointMissing(true);
      else setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (type: PanelBackupKind) => {
    if (!canAct) return;
    setCreating(type);
    try {
      await pwApi.backupNow({ type });
      toast.success(`Backup ${type} disparado`);
      void load();
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        toast.error(`backupNow ainda não implementado nesta VPS`);
      } else {
        toast.error(`Backup ${type}: ${e instanceof Error ? e.message : String(e)}`);
      }
    } finally {
      setCreating(null);
    }
  };

  if (endpointMissing) return <EndpointMissingNotice action="listBackups" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {BACKUP_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="font-mono text-xs">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Atualizar
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Disparar backup:
          </span>
          {BACKUP_TYPES.map((t) => (
            <Button
              key={t}
              size="sm"
              variant="secondary"
              disabled={!canAct || creating != null}
              onClick={() => create(t)}
              className="h-8 font-mono text-xs"
            >
              {creating === t ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Archive className="h-3.5 w-3.5" />
              )}
              {t}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <Card className="border-border bg-card/60 backdrop-blur-md">
        <CardContent className="p-0">
          {loading && items.length === 0 ? (
            <div className="p-6">
              <Skeleton className="h-32 rounded-lg" />
            </div>
          ) : items.length === 0 ? (
            <EmptyHint icon={Archive} className="p-8">
              Nenhum backup encontrado.
            </EmptyHint>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((b, i) => {
                const size = b.bytes ?? b.size;
                return (
                  <li
                    key={b.id ?? b.file ?? `${b.name}-${i}`}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-accent/30"
                  >
                    <Archive className="h-4 w-4 text-primary" />
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                      {b.type ?? "?"}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs text-foreground">
                        {b.name ?? b.file ?? "—"}
                      </p>
                      {b.file && b.name && (
                        <p className="truncate font-mono text-[10px] text-muted-foreground">{b.file}</p>
                      )}
                    </div>
                    {size != null && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {fmtBytes(size)}
                      </span>
                    )}
                    {b.status && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] uppercase",
                          b.status === "ok"
                            ? "border-emerald-500/40 text-emerald-500"
                            : b.status === "failed"
                              ? "border-destructive/50 text-destructive"
                              : "border-amber-500/40 text-amber-500",
                        )}
                      >
                        {b.status}
                      </Badge>
                    )}
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {fmtDate(b.created_at ?? b.mtime)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Watchdog Tab                                                                */
/* -------------------------------------------------------------------------- */

function WatchdogTab() {
  const { isSuperadmin } = useAuth();
  const { can } = useServerPermissions();
  const canAct = isSuperadmin || can("manage_servers");
  const [status, setStatus] = useState<WatchdogStatusBlock | undefined>();
  const [config, setConfig] = useState<WatchdogConfig | undefined>();
  const [history, setHistory] = useState<WatchdogHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [endpointMissing, setEndpointMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // editable config
  const [criticalText, setCriticalText] = useState("");
  const [cooldown, setCooldown] = useState<number>(60);
  const [autoRestart, setAutoRestart] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setEndpointMissing(false);
    try {
      const [s, h] = await Promise.all([
        pwApi.getWatchdogStatus(),
        pwApi.getWatchdogHistory({ limit: 20 }).catch(() => ({ success: false, entries: [] }) as never),
      ]);
      setStatus(s.status);
      setConfig(s.config);
      setCriticalText((s.config?.critical_services ?? []).join(", "));
      if (s.config?.cooldown_seconds != null) setCooldown(s.config.cooldown_seconds);
      if (s.config?.auto_restart != null) setAutoRestart(s.config.auto_restart);
      setHistory((h as WatchdogHistoryEntry[] extends never ? never : { entries?: WatchdogHistoryEntry[] }).entries ?? []);
    } catch (e) {
      if (e instanceof EndpointMissingError) setEndpointMissing(true);
      else setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (enable: boolean) => {
    if (!canAct) return;
    setActing(enable ? "enable" : "disable");
    try {
      const r = enable ? await pwApi.enableWatchdog() : await pwApi.disableWatchdog();
      setStatus(r.status);
      setConfig(r.config);
      toast.success(enable ? "Watchdog ativado" : "Watchdog desativado");
    } catch (e) {
      toast.error(`${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setActing(null);
    }
  };

  const runNow = async () => {
    if (!canAct) return;
    setActing("run");
    try {
      const r = await pwApi.runWatchdogCheckNow();
      if (r.status) setStatus(r.status);
      toast.success(`Checagem: ${r.result ?? "ok"}`);
      void load();
    } catch (e) {
      toast.error(`${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setActing(null);
    }
  };

  const saveConfig = async () => {
    if (!canAct) return;
    setActing("save");
    try {
      const critical_services = criticalText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const r = await pwApi.saveWatchdogConfig({
        critical_services,
        cooldown_seconds: cooldown,
        auto_restart: autoRestart,
      });
      setConfig(r.config);
      if (r.status) setStatus(r.status);
      toast.success("Configuração salva");
    } catch (e) {
      toast.error(`${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setActing(null);
    }
  };

  if (endpointMissing) return <EndpointMissingNotice action="getWatchdogStatus" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-extrabold uppercase tracking-widest text-foreground">
              Estado atual
            </CardTitle>
            {status?.enabled ? (
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {loading && !status ? (
              <Skeleton className="h-32 rounded-lg" />
            ) : (
              <>
                <Field label="Habilitado" value={status?.enabled ? "SIM" : "NÃO"} />
                <Field label="Último resultado" valueNode={<ResultBadge result={status?.last_result} />} />
                <Field label="Última checagem" value={fmtDate(status?.last_check_at)} />
                <Field
                  label="Cooldown"
                  value={
                    status?.cooldown_seconds != null
                      ? `${status.cooldown_seconds}s${status.cooldown_remaining ? ` (${status.cooldown_remaining}s restantes)` : ""}`
                      : "—"
                  }
                />
                <Field label="Falha crítica" value={status?.critical_failure ? "SIM" : "não"} />
                {status?.unhealthy_services && status.unhealthy_services.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Não saudáveis
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {status.unhealthy_services.map((s) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="border-destructive/50 font-mono text-[10px] text-destructive"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" disabled={!canAct || acting != null} onClick={runNow} variant="default">
                    {acting === "run" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Activity className="h-3.5 w-3.5" />
                    )}
                    Rodar checagem agora
                  </Button>
                  {status?.enabled ? (
                    <Button
                      size="sm"
                      disabled={!canAct || acting != null}
                      onClick={() => toggle(false)}
                      variant="destructive"
                    >
                      {acting === "disable" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Power className="h-3.5 w-3.5" />
                      )}
                      Desativar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={!canAct || acting != null}
                      onClick={() => toggle(true)}
                      className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                    >
                      {acting === "enable" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      )}
                      Ativar
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-extrabold uppercase tracking-widest text-foreground">
              Configuração
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Serviços críticos (separados por vírgula)
              </Label>
              <Input
                value={criticalText}
                onChange={(e) => setCriticalText(e.target.value)}
                className="font-mono"
                placeholder="gamedbd, gdeliveryd, authd, mysql"
                disabled={!canAct}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Cooldown (s)
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={cooldown}
                  onChange={(e) => setCooldown(Math.max(0, Number(e.target.value) || 0))}
                  className="font-mono"
                  disabled={!canAct}
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={autoRestart} onCheckedChange={setAutoRestart} disabled={!canAct} id="autoR" />
                <Label htmlFor="autoR" className="text-xs">
                  Auto-restart
                </Label>
              </div>
            </div>
            <Button size="sm" disabled={!canAct || acting != null} onClick={saveConfig}>
              {acting === "save" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
              Salvar configuração
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card/60 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-extrabold uppercase tracking-widest text-foreground">
            Histórico recente
          </CardTitle>
          <HistoryIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading && history.length === 0 ? (
            <Skeleton className="h-24 rounded-lg" />
          ) : history.length === 0 ? (
            <EmptyHint icon={HistoryIcon}>Sem histórico de checagens.</EmptyHint>
          ) : (
            <div className="space-y-1.5">
              {history.map((h, i) => (
                <div
                  key={h.id ?? i}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-border/60 bg-background/40 px-3 py-2 text-xs"
                >
                  <ResultBadge result={h.result} />
                  <span className="font-mono text-[10px] text-muted-foreground">{fmtDate(h.ts)}</span>
                  {h.duration_ms != null && (
                    <span className="font-mono text-[10px] text-muted-foreground">{h.duration_ms}ms</span>
                  )}
                  {h.unhealthy_services && h.unhealthy_services.length > 0 && (
                    <span className="truncate font-mono text-[10px] text-destructive">
                      {h.unhealthy_services.join(", ")}
                    </span>
                  )}
                  {h.actions && h.actions.length > 0 && (
                    <span className="ml-auto truncate font-mono text-[10px] text-amber-500">
                      → {h.actions.join(", ")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function StateDot({ state, pulse }: { state?: string; pulse?: boolean }) {
  const color =
    state === "online" || state === "running"
      ? "bg-emerald-500"
      : state === "offline" || state === "stopped"
        ? "bg-destructive"
        : "bg-muted-foreground";
  return (
    <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
      {pulse && (
        <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", color)} />
      )}
      <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", color)} />
    </span>
  );
}

function ResultBadge({ result }: { result?: string | null }) {
  if (!result)
    return (
      <Badge variant="outline" className="text-[10px] uppercase text-muted-foreground">
        —
      </Badge>
    );
  const tone =
    result === "ok"
      ? "border-emerald-500/40 text-emerald-500"
      : result === "degraded"
        ? "border-amber-500/40 text-amber-500"
        : result === "failed"
          ? "border-destructive/50 text-destructive"
          : "border-border text-muted-foreground";
  return (
    <Badge variant="outline" className={cn("text-[10px] uppercase", tone)}>
      {result}
    </Badge>
  );
}

function Field({
  label,
  value,
  valueNode,
}: {
  label: string;
  value?: string | number | null;
  valueNode?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {valueNode ?? <span className="font-mono text-[11px] text-foreground">{value ?? "—"}</span>}
    </div>
  );
}

function EmptyHint({
  icon: Icon,
  children,
  className,
}: {
  icon: typeof FileText;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 p-6 text-xs text-muted-foreground",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

function toneFor(value: number | undefined | null, warn: number, danger: number): "ok" | "warn" | "danger" | "muted" {
  if (value == null || !Number.isFinite(value)) return "muted";
  if (value >= danger) return "danger";
  if (value >= warn) return "warn";
  return "ok";
}

function fmtDate(d?: string | number | null): string {
  if (d == null || d === "") return "—";
  let date: Date;
  if (typeof d === "number") {
    date = new Date(d < 1e12 ? d * 1000 : d);
  } else {
    const n = Number(d);
    date = Number.isFinite(n) ? new Date(n < 1e12 ? n * 1000 : n) : new Date(d);
  }
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleString();
}

function fmtMb(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(0)} MB`;
}

function fmtBytes(b: number): string {
  if (b >= 1024 * 1024 * 1024) return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (b >= 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${b} B`;
}

function fmtDuration(s: number): string {
  if (!Number.isFinite(s) || s <= 0) return "—";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

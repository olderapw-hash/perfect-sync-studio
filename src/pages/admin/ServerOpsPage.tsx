// /admin/server — Operação do Servidor v1.
//
// Foco em observabilidade + export/reload seguro:
//  - Tab Status: cards dos daemons principais (gamedbd, gdeliveryd, gacd,
//    glink, authd, uniquenamed, mysql, httpd) lidos de getServiceStatus.
//  - Tab Logs: tail de logs por origem (gamedbd, exportclsconfig, httpd, mail, apicls).
//  - Tab Ações: exportClsconfig + reloads conhecidos (placeholder p/ Fase 2).
//
// Nenhuma ação destrutiva (sem start/stop/kill/kick) — esta v1 só lê,
// faz tail e roda exportClsconfig (idempotente). Tudo gated por
// permissão e auditado via log_audit_event.
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
  Link2,
  PlayCircle,
  RefreshCw,
  Server as ServerIcon,
  Shield,
  ShieldOff,
  Sparkles,
  Truck,
  User as UserIcon,
  Wrench,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { NoActiveServerState } from "@/components/admin/NoActiveServerState";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "status", label: "Status", icon: Activity, path: "/admin/server" },
  { value: "logs", label: "Logs", icon: FileText, path: "/admin/server/logs" },
  { value: "actions", label: "Export & Reload", icon: Wrench, path: "/admin/server/actions" },
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
              v1 · observabilidade
            </div>
            <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground">
              Operação do Servidor
            </h1>
            <p className="text-xs text-muted-foreground">
              Status dos daemons, logs recentes e export do clsconfig — sem
              ações destrutivas nesta fase.
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
/* -------------------------------------------------------------------------- */

import { pwApi, EndpointMissingError, type ServiceInfo } from "@/lib/pwApiActions";
import { logAuditEvent } from "@/lib/auditLog";
import { toast } from "sonner";

const KNOWN_SERVICES: { key: string; label: string; port?: number; icon: typeof Database }[] = [
  { key: "gamedbd", label: "Game DB Daemon", port: 29400, icon: Database },
  { key: "gdeliveryd", label: "Delivery Daemon", port: 29100, icon: Truck },
  { key: "gacd", label: "Account Daemon", port: 29000, icon: UserIcon },
  { key: "glink", label: "Game Link", port: 29200, icon: Link2 },
  { key: "authd", label: "Auth Daemon", port: 29300, icon: Shield },
  { key: "uniquenamed", label: "Unique Name", port: 29500, icon: Fingerprint },
  { key: "mysql", label: "MySQL/MariaDB", port: 3306, icon: Database },
  { key: "httpd", label: "Web (Apache/httpd)", port: 80, icon: Globe },
];

const ICON_BY_KEY = new Map(KNOWN_SERVICES.map((s) => [s.key, s.icon]));

function ServerStatusTab() {
  const { active } = useServers();
  const [services, setServices] = useState<ServiceInfo[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [collectedAt, setCollectedAt] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [endpointMissing, setEndpointMissing] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    setEndpointMissing(false);
    try {
      const res = await pwApi.getServiceStatus();
      setServices(res.services ?? []);
      setCollectedAt(res.collected_at ?? Date.now());
      void logAuditEvent({
        action: "server_ops.status_view",
        tenantId: active?.id ?? null,
        target: "getServiceStatus",
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
        action: "server_ops.status_view",
        tenantId: active?.id ?? null,
        target: "getServiceStatus",
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

  // Mescla a lista conhecida com o que veio da VPS (preserva ordem amigável).
  const merged = useMemo<ServiceInfo[]>(() => {
    const byKey = new Map<string, ServiceInfo>();
    for (const s of services ?? []) {
      // VPS responde com `key`; mantém compat se algum dia vier `name`.
      const k = s?.key ?? (s as unknown as { name?: string })?.name;
      if (!k) continue;
      byKey.set(k.toLowerCase(), { ...s, key: k });
    }
    const result: ServiceInfo[] = [];
    for (const known of KNOWN_SERVICES) {
      const found = byKey.get(known.key);
      result.push(
        found ?? {
          key: known.key,
          label: known.label,
          state: "unknown",
          port: known.port ?? null,
        },
      );
      byKey.delete(known.key);
    }
    // Quaisquer extras que a VPS reportar e não estão na lista padrão.
    for (const extra of byKey.values()) result.push(extra);
    return result;
  }, [services]);

  const onlineCount = merged.filter((s) => s.state === "online").length;
  const offlineCount = merged.filter((s) => s.state === "offline").length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-l-2 border-primary px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-foreground">
              Status dos serviços
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
                  {" "}· <span className="text-success font-semibold">{onlineCount} online</span>
                  {offlineCount > 0 && (
                    <> · <span className="text-destructive font-semibold">{offlineCount} offline</span></>
                  )}
                </>
              )}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={load} disabled={loading} className="shrink-0">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {endpointMissing && (
          <div className="px-5 pb-4">
            <EndpointMissingNotice action="getServiceStatus" />
          </div>
        )}

        {error && (
          <div className="mx-5 mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            <strong>Erro ao consultar status:</strong> {error}
          </div>
        )}

        <div className="border-t border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {merged.map((svc) => (
                <ServiceRow
                  key={svc.key}
                  service={svc}
                  loading={loading && !services}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function ServiceRow({
  service,
  loading,
}: {
  service: ServiceInfo;
  loading?: boolean;
}) {
  const Icon = ICON_BY_KEY.get(service.key) ?? CircuitBoard;
  const isOnline = service.state === "online";
  const isOffline = service.state === "offline";

  const statusTone = isOnline
    ? "border-success/50 bg-success/10 text-success"
    : isOffline
      ? "border-destructive/50 bg-destructive/10 text-destructive"
      : "border-border bg-muted/30 text-muted-foreground";

  const dot = isOnline ? "bg-success" : isOffline ? "bg-destructive" : "bg-muted-foreground";

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
    <TableRow className="border-border/60 hover:bg-muted/20">
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
          <span className={cn("h-1.5 w-1.5 rounded-full", dot, loading && "animate-pulse")} />
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
              systemd <span className="font-mono text-foreground">{service.systemd_state}</span>
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

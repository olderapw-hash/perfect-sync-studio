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
  FileText,
  PlayCircle,
  RefreshCw,
  Server as ServerIcon,
  ShieldOff,
  Sparkles,
  Wrench,
} from "lucide-react";
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

const KNOWN_SERVICES: { key: string; label: string; port?: number }[] = [
  { key: "gamedbd", label: "Game DB Daemon", port: 29400 },
  { key: "gdeliveryd", label: "Delivery Daemon", port: 29100 },
  { key: "gacd", label: "Account Daemon", port: 29000 },
  { key: "glink", label: "Game Link", port: 29200 },
  { key: "authd", label: "Auth Daemon", port: 29300 },
  { key: "uniquenamed", label: "Unique Name", port: 29500 },
  { key: "mysql", label: "MySQL/MariaDB", port: 3306 },
  { key: "httpd", label: "Web (Apache/httpd)", port: 80 },
];

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
            Status dos serviços
          </h2>
          <p className="text-xs text-muted-foreground">
            {collectedAt
              ? `Última coleta: ${formatCollectedAt(collectedAt)}`
              : loading
                ? "Coletando..."
                : "Nenhuma coleta ainda."}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {endpointMissing && <EndpointMissingNotice action="getServiceStatus" />}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          <strong>Erro ao consultar status:</strong> {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {merged.map((svc) => (
          <ServiceCard key={svc.key} service={svc} loading={loading && !services} />
        ))}
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  loading,
}: {
  service: ServiceInfo;
  loading?: boolean;
}) {
  const tone =
    service.state === "online"
      ? "border-success/40 bg-success/5"
      : service.state === "offline"
        ? "border-destructive/40 bg-destructive/5"
        : "border-border bg-card/40";
  const dot =
    service.state === "online"
      ? "bg-success"
      : service.state === "offline"
        ? "bg-destructive"
        : "bg-muted-foreground";

  return (
    <div
      className={cn(
        "rounded-xl border p-4 backdrop-blur-md transition-smooth",
        tone,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", dot, loading && "animate-pulse")} />
            <h3 className="truncate text-sm font-bold text-foreground">
              {service.label || service.key}
            </h3>
          </div>
          <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
            {service.process_name ?? service.key}
            {service.port != null && <span> · :{service.port}</span>}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            service.state === "online" && "bg-success/15 text-success",
            service.state === "offline" && "bg-destructive/15 text-destructive",
            service.state === "unknown" && "bg-muted text-muted-foreground",
          )}
        >
          {service.state}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <dt className="text-muted-foreground">PID</dt>
          <dd className="font-mono text-foreground">
            {service.pid != null ? service.pid : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Processos</dt>
          <dd className="font-mono text-foreground">
            {service.process_count ?? "—"}
          </dd>
        </div>
      </dl>

      {(service.systemd_state || service.listening != null) && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          {service.systemd_state && <>systemd: <span className="font-mono">{service.systemd_state}</span></>}
          {service.systemd_state && service.listening != null && " · "}
          {service.listening != null && (
            <>porta: <span className="font-mono">{service.listening ? "LISTEN" : "fechada"}</span></>
          )}
        </p>
      )}

      {service.message && (
        <p className="mt-3 rounded-md border border-border/60 bg-background/40 px-2 py-1 text-[10px] text-muted-foreground">
          {service.message}
        </p>
      )}
    </div>
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

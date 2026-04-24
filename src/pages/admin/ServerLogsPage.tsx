// /admin/server/logs — Tail dos logs principais do servidor.
//
// Tabs por origem: gamedbd, exportclsconfig, httpd, mail, apicls.
// Busca textual local + refresh manual. Tratamento amigável quando o
// arquivo não existe / sem permissão (vem como `warning` do PHP).
import { useEffect, useMemo, useState } from "react";
import { FileText, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useServers } from "@/hooks/useServers";
import {
  EndpointMissingError,
  pwApi,
  type ServerLogEntry,
  type ServerLogSource,
  type ServerLogsResponse,
} from "@/lib/pwApiActions";
import { logAuditEvent } from "@/lib/auditLog";
import { EndpointMissingNotice } from "./ServerOpsPage";
import { cn } from "@/lib/utils";

const SOURCES: { value: ServerLogSource; label: string }[] = [
  { value: "gamedbd", label: "gamedbd" },
  { value: "exportclsconfig", label: "Export clsconfig" },
  { value: "httpd", label: "Web/httpd" },
  { value: "mail", label: "Correio/Recompensas" },
  { value: "apicls", label: "api_cls.php" },
];

export default function ServerLogsPage() {
  const { active } = useServers();
  const [source, setSource] = useState<ServerLogSource>("gamedbd");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<ServerLogsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpointMissing, setEndpointMissing] = useState(false);

  const load = async (src: ServerLogSource = source) => {
    setLoading(true);
    setError(null);
    setEndpointMissing(false);
    try {
      const res = await pwApi.getServerLogs({ source: src, lines: 300 });
      setData(res);
      void logAuditEvent({
        action: "server_ops.logs_view",
        tenantId: active?.id ?? null,
        target: `getServerLogs:${src}`,
        status: "ok",
        metadata: { count: res.entries?.length ?? 0 },
      });
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        setEndpointMissing(true);
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
      void logAuditEvent({
        action: "server_ops.logs_view",
        tenantId: active?.id ?? null,
        target: `getServerLogs:${src}`,
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(source);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, active?.id]);

  const filtered = useMemo<ServerLogEntry[]>(() => {
    const all = data?.entries ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((e) => e.line.toLowerCase().includes(q));
  }, [data, query]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
            Logs do servidor
          </h2>
          <p className="text-xs text-muted-foreground">
            Últimas linhas dos arquivos de log. Apenas leitura — sem
            modificação no disco.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => load()} disabled={loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      <Tabs value={source} onValueChange={(v) => setSource(v as ServerLogSource)}>
        <TabsList className="flex-wrap bg-background/40">
          {SOURCES.map((s) => (
            <TabsTrigger key={s.value} value={s.value}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SOURCES.map((s) => (
          <TabsContent key={s.value} value={s.value} className="mt-3">
            {endpointMissing ? (
              <EndpointMissingNotice action="getServerLogs" />
            ) : (
              <LogsPane
                loading={loading}
                error={error}
                data={data}
                entries={filtered}
                query={query}
                onQuery={setQuery}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function LogsPane({
  loading,
  error,
  data,
  entries,
  query,
  onQuery,
}: {
  loading: boolean;
  error: string | null;
  data: ServerLogsResponse | null;
  entries: ServerLogEntry[];
  query: string;
  onQuery: (v: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4 backdrop-blur-md">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Filtrar linhas..."
            className="h-8 pl-7 text-xs"
          />
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          {entries.length} / {data?.count ?? data?.entries?.length ?? 0} linhas
        </span>
        {data?.file && (
          <span className="truncate font-mono text-[10px] text-muted-foreground">
            {data.file}
          </span>
        )}
      </div>

      {data?.warning && (
        <div className="mb-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
          {data.warning}
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="max-h-[60vh] overflow-auto rounded-lg border border-border/60 bg-background/60">
        {loading && entries.length === 0 ? (
          <div className="flex items-center justify-center gap-2 p-6 text-xs text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Carregando logs...
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center gap-2 p-6 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            Nenhuma linha disponível.
          </div>
        ) : (
          <pre className="whitespace-pre-wrap break-words p-3 font-mono text-[11px] leading-relaxed text-foreground/90">
            {entries
              .map((e) => {
                const prefix = e.ts ? `[${e.ts}] ` : "";
                return prefix + e.line;
              })
              .join("\n")}
          </pre>
        )}
      </div>
    </div>
  );
}

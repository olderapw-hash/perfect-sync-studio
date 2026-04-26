// /admin/server/history — Histórico de operações do servidor (Server Ops v3).
//
// Lista paginada via getServerOperationsHistory, filtros por tipo /
// success_state / limit, e drawer de detalhe que reusa
// ServerOperationProgressDrawer (que já consome getServerOperationStatus).
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  History as HistoryIcon,
  Loader2,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
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
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import {
  EndpointMissingError,
  pwApi,
  type ServerOperationHistoryEntry,
} from "@/lib/pwApiActions";
import { logAuditEvent } from "@/lib/auditLog";
import { EndpointMissingNotice } from "@/components/admin/EndpointMissingNotice";
import { ServerOperationProgressDrawer } from "@/components/admin/ServerOperationProgressDrawer";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS = [
  { value: "all", label: "Todos os tipos" },
  { value: "startServer", label: "startServer" },
  { value: "stopServer", label: "stopServer" },
  { value: "restartServer", label: "restartServer" },
  { value: "startService", label: "startService" },
  { value: "stopService", label: "stopService" },
  { value: "restartService", label: "restartService" },
] as const;

const STATE_OPTIONS = [
  { value: "all", label: "Todos os estados" },
  { value: "running", label: "Em andamento" },
  { value: "success", label: "Concluído" },
  { value: "failed", label: "Falhou" },
  { value: "error", label: "Erro" },
] as const;

const LIMIT_OPTIONS = [25, 50, 100, 200];

function StateBadge({ entry }: { entry: ServerOperationHistoryEntry }) {
  if (entry.running) {
    return (
      <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-500">
        <Loader2 className="h-3 w-3 animate-spin" /> Em andamento
      </Badge>
    );
  }
  if (entry.success_state === "success" || entry.success === true) {
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

function formatTs(v: string | number | null | undefined): string {
  if (v == null || v === "") return "—";
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleString();
  }
  const ms = v < 1e12 ? v * 1000 : v;
  return new Date(ms).toLocaleString();
}

export default function ServerHistoryPage() {
  const { active } = useServers();
  const { isSuperadmin } = useAuth();
  const { can } = useServerPermissions();

  const [type, setType] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [limit, setLimit] = useState<number>(50);

  const [entries, setEntries] = useState<ServerOperationHistoryEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  const [trackedOp, setTrackedOp] = useState<{ id: string; type?: string } | null>(
    null,
  );
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const handleClearHistory = () => {
    setEntries([]);
    setConfirmClearOpen(false);
    toast.success("Histórico limpo da visualização");
    void logAuditEvent({
      action: "server_ops.history_clear_view",
      tenantId: active?.id ?? null,
      target: "client_only",
      status: "ok",
      metadata: { type, success_state: stateFilter, limit },
    });
  };

  const allowed = isSuperadmin || can("view_audit") || can("view");

  const load = async () => {
    setLoading(true);
    setError(null);
    setMissing(false);
    try {
      const res = await pwApi.getServerOperationsHistory({
        type: type !== "all" ? type : undefined,
        success_state: stateFilter !== "all" ? stateFilter : undefined,
        limit,
      });
      setEntries(res.operations ?? []);
      void logAuditEvent({
        action: "server_ops.history_view",
        tenantId: active?.id ?? null,
        target: "getServerOperationsHistory",
        status: "ok",
        metadata: { type, success_state: stateFilter, limit, count: res.operations?.length ?? 0 },
      });
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        setMissing(true);
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
      void logAuditEvent({
        action: "server_ops.history_view",
        tenantId: active?.id ?? null,
        target: "getServerOperationsHistory",
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
  }, [active?.id, type, stateFilter, limit, allowed]);

  const list = entries ?? [];
  const summary = useMemo(() => {
    const ok = list.filter((e) => !e.running && (e.success === true || e.success_state === "success")).length;
    const fail = list.filter((e) => !e.running && (e.success === false || e.success_state === "failed" || e.success_state === "error")).length;
    const running = list.filter((e) => e.running).length;
    return { ok, fail, running };
  }, [list]);

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-center text-sm text-muted-foreground">
        Você precisa da permissão <strong>view_audit</strong> para acessar o
        histórico de operações.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─── Header / filtros ─── */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-primary px-5 py-4">
          <div className="min-w-0 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <HistoryIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold uppercase tracking-wider text-foreground">
                Histórico de operações
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {loading ? (
                  "Carregando..."
                ) : entries == null ? (
                  "—"
                ) : (
                  <>
                    {list.length} registro(s){" "}
                    {summary.ok > 0 && (
                      <>
                        ·{" "}
                        <span className="font-semibold text-emerald-500">
                          {summary.ok} ok
                        </span>
                      </>
                    )}
                    {summary.fail > 0 && (
                      <>
                        {" "}
                        ·{" "}
                        <span className="font-semibold text-destructive">
                          {summary.fail} falhas
                        </span>
                      </>
                    )}
                    {summary.running > 0 && (
                      <>
                        {" "}
                        ·{" "}
                        <span className="font-semibold text-amber-500">
                          {summary.running} em andamento
                        </span>
                      </>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Atualizar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmClearOpen(true)}
              disabled={loading || list.length === 0}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar histórico
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 border-t border-border px-5 py-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Filter className="h-3 w-3" /> Filtros
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Tipo
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Estado
            </Label>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Limite
            </Label>
            <Select
              value={String(limit)}
              onValueChange={(v) => setLimit(Number(v))}
            >
              <SelectTrigger className="h-8 w-[100px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIMIT_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-xs">
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {missing && <EndpointMissingNotice action="getServerOperationsHistory" />}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          <strong>Erro ao carregar histórico:</strong> {error}
        </div>
      )}

      {/* ─── Tabela ─── */}
      {!missing && (
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-4">
                  ID
                </TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Tipo
                </TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Etapa
                </TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Serviços
                </TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Início
                </TableHead>
                <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Fim
                </TableHead>
                <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground pr-4">
                  Estado
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && list.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-xs text-muted-foreground"
                  >
                    <Loader2 className="inline h-4 w-4 animate-spin" /> Carregando histórico...
                  </TableCell>
                </TableRow>
              )}
              {!loading && list.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-xs text-muted-foreground"
                  >
                    Nenhuma operação registrada com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
              {list.map((entry) => (
                <TableRow
                  key={entry.id}
                  className="cursor-pointer border-border/60 hover:bg-muted/20"
                  onClick={() =>
                    setTrackedOp({ id: entry.id, type: entry.type })
                  }
                >
                  <TableCell className="py-3 pl-4">
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] text-foreground">
                        {entry.id}
                      </span>
                      {entry.dry_run && (
                        <span className="mt-0.5 inline-flex w-fit rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider text-amber-500">
                          dry-run
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {entry.type}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {entry.stage ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    {entry.services && entry.services.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {entry.services.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="rounded-md border border-border bg-background/60 px-1.5 py-0.5 font-mono text-[9px] text-foreground"
                          >
                            {s}
                          </span>
                        ))}
                        {entry.services.length > 3 && (
                          <span className="rounded-md border border-border bg-background/60 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                            +{entry.services.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTs(entry.created_at)}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {formatTs(entry.completed_at)}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {entry.error && (
                        <AlertTriangle
                          className="h-3.5 w-3.5 text-destructive"
                          aria-label={entry.error}
                        />
                      )}
                      <StateBadge entry={entry} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ─── Drawer de detalhes (reusa polling de status) ─── */}
      <ServerOperationProgressDrawer
        open={trackedOp !== null}
        operationId={trackedOp?.id ?? null}
        type={trackedOp?.type}
        onClose={() => setTrackedOp(null)}
      />

      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso remove os registros apenas da visualização atual. Ao
              clicar em <strong>Atualizar</strong>, o histórico real do
              servidor será carregado novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleClearHistory}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Limpar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// /admin/mail/history — Histórico de envios de correio.
// Filtros: tipo, status, alvo (roleid), data, busca textual.
// RLS já restringe: usuário vê seus próprios + view_audit vê todos do tenant.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CalendarRange,
  Coins,
  Download,
  Eye,
  History as HistoryIcon,
  Loader2,
  Mail,
  Package,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import {
  formatGold,
  type MailGoldPayload,
  type MailItemPayload,
  type MailKind,
  type MailSendLogRow,
  type MailSendStatus,
} from "@/lib/mailTemplates";
import { NoActiveServerState } from "@/components/admin/NoActiveServerState";
import { MailStatusBadge } from "@/components/admin/mail/MailStatusBadge";

type KindFilter = "all" | MailKind;
type StatusFilter = "all" | MailSendStatus;
type RangeFilter = "24h" | "7d" | "30d" | "all";

const RANGE_MS: Record<Exclude<RangeFilter, "all">, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

const PAGE_SIZE = 50;

interface LogRowDb {
  id: string;
  tenant_id: string;
  user_id: string;
  template_id: string | null;
  kind: MailKind;
  target_roleid: number;
  target_name: string | null;
  subject: string | null;
  body: string | null;
  payload: unknown;
  status: MailSendStatus;
  http_status: number | null;
  error_message: string | null;
  response: unknown;
  created_at: string;
}

const MailHistoryPage = () => {
  const { user } = useAuth();
  const { active } = useServers();
  const { can, loading: permsLoading } = useServerPermissions();
  const tenantId = active?.id ?? null;

  const [rows, setRows] = useState<MailSendLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("7d");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const [detail, setDetail] = useState<MailSendLogRow | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from("mail_send_log")
        .select(
          "id, tenant_id, user_id, template_id, kind, target_roleid, target_name, subject, body, payload, status, http_status, error_message, response, created_at",
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(500); // limite hard pra UI; paginação client-side dentro disto
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setRows([]);
      } else {
        setRows((data ?? []) as LogRowDb[] as MailSendLogRow[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  // Reset paginação quando filtros mudam
  useEffect(() => {
    setPage(0);
  }, [kindFilter, statusFilter, rangeFilter, search]);

  const filtered = useMemo(() => {
    const cutoff =
      rangeFilter === "all" ? null : Date.now() - RANGE_MS[rangeFilter];
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (kindFilter !== "all" && r.kind !== kindFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (cutoff && new Date(r.created_at).getTime() < cutoff) return false;
      if (q) {
        const hay = [
          String(r.target_roleid),
          r.target_name ?? "",
          r.subject ?? "",
          r.error_message ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, kindFilter, statusFilter, rangeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const stats = useMemo(() => {
    const s = { total: filtered.length, success: 0, error: 0, missing: 0, pending: 0 };
    for (const r of filtered) {
      if (r.status === "success") s.success++;
      else if (r.status === "error") s.error++;
      else if (r.status === "endpoint_missing") s.missing++;
      else if (r.status === "pending") s.pending++;
    }
    return s;
  }, [filtered]);

  const exportCsv = () => {
    const header = [
      "created_at",
      "kind",
      "target_roleid",
      "target_name",
      "status",
      "subject",
      "payload",
      "error_message",
    ];
    const rowsCsv = filtered.map((r) =>
      [
        r.created_at,
        r.kind,
        r.target_roleid,
        r.target_name ?? "",
        r.status,
        (r.subject ?? "").replace(/"/g, '""'),
        JSON.stringify(r.payload).replace(/"/g, '""'),
        (r.error_message ?? "").replace(/"/g, '""'),
      ]
        .map((v) => `"${v}"`)
        .join(","),
    );
    const csv = [header.join(","), ...rowsCsv].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mail-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!tenantId) return <NoActiveServerState />;
  if (permsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const isAuditor = can("view_audit");

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-5 p-6">
        <header className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            <HistoryIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold tracking-tight text-foreground">
              Histórico de envios
            </h1>
            <p className="text-xs text-muted-foreground">
              {isAuditor ? (
                <>Todos os envios deste servidor</>
              ) : (
                <>Apenas seus envios (sem permissão view_audit)</>
              )}{" "}
              · <Link to="/admin/gm?tab=compensation" className="text-primary hover:underline">Enviar nova recompensa</Link>
            </p>
          </div>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs transition-smooth hover:border-primary/50 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
        </header>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Entregues" value={stats.success} accent="success" />
          <StatCard label="Pendentes" value={stats.pending} accent="amber" />
          <StatCard label="Erros" value={stats.error} accent="destructive" />
          <StatCard label="Sem endpoint" value={stats.missing} accent="muted" />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/40 p-3">
          <Tabs value={rangeFilter} onValueChange={(v) => setRangeFilter(v as RangeFilter)}>
            <TabsList>
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
              <TabsTrigger value="all">Tudo</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as KindFilter)}>
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="item">Item</SelectItem>
              <SelectItem value="gold">Moedas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="h-9 w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="success">Entregue</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
              <SelectItem value="endpoint_missing">Endpoint ausente</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative ml-auto w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Roleid, nome, assunto…"
              className="h-9 pl-8 text-xs"
            />
          </div>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/20 p-10 text-center text-sm text-muted-foreground">
            <Mail className="mx-auto mb-3 h-8 w-8 opacity-50" />
            {rows.length === 0
              ? "Nenhum envio registrado neste servidor ainda."
              : "Nenhum envio corresponde aos filtros."}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card/40">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-card/60 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Quando</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Destinatário</th>
                  <th className="px-3 py-2">Conteúdo</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="w-10 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageRows.map((r) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer transition-colors hover:bg-card/60"
                    onClick={() => setDetail(r)}
                  >
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-3 py-2">
                      {r.kind === "item" ? (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Package className="h-3 w-3" /> Item
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-500">
                          <Coins className="h-3 w-3" /> Moedas
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-mono text-[11px] text-foreground">
                        {r.target_roleid}
                      </div>
                      {r.target_name && (
                        <div className="text-[10px] text-muted-foreground">{r.target_name}</div>
                      )}
                    </td>
                    <td className="max-w-[280px] truncate px-3 py-2 text-foreground">
                      <ContentSummary kind={r.kind} payload={r.payload} />
                    </td>
                    <td className="px-3 py-2">
                      <MailStatusBadge status={r.status} />
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border bg-card/40 px-3 py-2 text-[11px] text-muted-foreground">
                <span>
                  Página {page + 1} de {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="rounded border border-border bg-background/40 px-2 py-1 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="rounded border border-border bg-background/40 px-2 py-1 disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CalendarRange className="h-3 w-3" />
          Mostrando até 500 envios mais recentes deste servidor.
        </p>
      </div>

      <DetailDialog row={detail} onClose={() => setDetail(null)} />
    </div>
  );
};

const StatCard = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "success" | "destructive" | "amber" | "muted";
}) => (
  <div className="rounded-xl border border-border bg-card/40 p-3">
    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
    <div
      className={
        accent === "success"
          ? "text-success"
          : accent === "destructive"
            ? "text-destructive"
            : accent === "amber"
              ? "text-amber-500"
              : accent === "muted"
                ? "text-muted-foreground"
                : "text-foreground"
      }
    >
      <span className="font-mono text-2xl font-extrabold">{value}</span>
    </div>
  </div>
);

const ContentSummary = ({ kind, payload }: { kind: MailKind; payload: unknown }) => {
  if (kind === "item") {
    const p = payload as MailItemPayload;
    return (
      <span>
        <span className="font-semibold">{p.item_name ?? `Item ${p.item_id}`}</span>{" "}
        <span className="text-muted-foreground">×{p.count}</span>
      </span>
    );
  }
  const p = payload as MailGoldPayload;
  return <span className="font-mono text-amber-500">{formatGold(p.amount)}</span>;
};

const DetailDialog = ({
  row,
  onClose,
}: {
  row: MailSendLogRow | null;
  onClose: () => void;
}) => (
  <Dialog open={!!row} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {row?.kind === "item" ? (
            <Package className="h-4 w-4 text-primary" />
          ) : (
            <Coins className="h-4 w-4 text-amber-500" />
          )}
          Envio para roleid {row?.target_roleid}
        </DialogTitle>
        <DialogDescription>
          {row && new Date(row.created_at).toLocaleString("pt-BR")}
        </DialogDescription>
      </DialogHeader>

      {row && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3">
            <MailStatusBadge status={row.status} />
            {row.error_message && (
              <span className="text-xs text-destructive">{row.error_message}</span>
            )}
          </div>

          {(row.subject || row.body) && (
            <div className="rounded-lg border border-border bg-background/40 p-3 text-xs">
              {row.subject && (
                <div className="mb-1 font-semibold text-foreground">{row.subject}</div>
              )}
              {row.body && (
                <p className="whitespace-pre-wrap text-muted-foreground">{row.body}</p>
              )}
            </div>
          )}

          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Payload enviado
            </div>
            <pre className="max-h-60 overflow-auto rounded-md border border-border bg-background/60 p-3 font-mono text-[11px] text-foreground/80">
              {JSON.stringify(row.payload, null, 2)}
            </pre>
          </div>

          {row.response != null && (
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Resposta da VPS
              </div>
              <pre className="max-h-60 overflow-auto rounded-md border border-border bg-background/60 p-3 font-mono text-[11px] text-foreground/80">
                {JSON.stringify(row.response, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </DialogContent>
  </Dialog>
);

export default MailHistoryPage;

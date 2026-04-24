// /admin/security/history — Histórico de moderação.
//
// Fonte primária: audit_logs do Supabase filtrando por action like 'security.%'.
// Fonte opcional: pwApi.listSecurityHistory (quando a VPS implementa).
import { useEffect, useMemo, useState } from "react";
import { History, Loader2, RefreshCw, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { cn } from "@/lib/utils";

interface AuditRow {
  id: string;
  created_at: string;
  user_id: string;
  action: string;
  target: string | null;
  status: string;
  error: string | null;
  metadata: Record<string, unknown> | null;
}

const ACTION_FILTER_OPTIONS = [
  { value: "all", label: "Todas as ações" },
  { value: "security.kick", label: "Kick" },
  { value: "security.ban_temp", label: "Ban temporário" },
  { value: "security.ban_perm", label: "Ban permanente" },
  { value: "security.unban", label: "Unban" },
];

const SecurityHistoryPage = () => {
  const { isSuperadmin } = useAuth();
  const { active } = useServers();
  const { can, loading: permLoading } = useServerPermissions();

  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("");

  const allowed = isSuperadmin || can("view_audit");

  async function load() {
    if (!active?.id) return;
    setLoading(true);
    setError(null);
    let query = supabase
      .from("audit_logs")
      .select("id, created_at, user_id, action, target, status, error, metadata")
      .eq("tenant_id", active.id)
      .like("action", "security.%")
      .order("created_at", { ascending: false })
      .limit(200);
    if (actionFilter !== "all") query = query.eq("action", actionFilter);
    const { data, error } = await query;
    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setRows((data as AuditRow[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (allowed) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, actionFilter, allowed]);

  const filtered = useMemo(() => {
    const t = targetFilter.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => (r.target ?? "").toLowerCase().includes(t));
  }, [rows, targetFilter]);

  if (!permLoading && !allowed) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/20 text-destructive">
            <ShieldOff className="h-6 w-6" />
          </div>
          <h2 className="text-base font-extrabold uppercase tracking-wider text-foreground">
            Sem permissão
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Você precisa da permissão <strong>view_audit</strong> para ver o
            histórico de moderação.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <header className="flex items-center gap-3">
        <History className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
            Histórico de moderação
          </h2>
          <p className="text-xs text-muted-foreground">
            Registro local de cada kick / ban / unban executado deste painel.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Atualizar
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Ação</Label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_FILTER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Filtrar por alvo</Label>
          <Input
            placeholder="ex.: roleid:31 ou account:xxx"
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            className="mt-1 font-mono"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card/40">
        <div className="grid grid-cols-[140px_120px_1fr_80px] gap-3 border-b border-border bg-background/40 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <span>Quando</span>
          <span>Ação</span>
          <span>Alvo / motivo</span>
          <span>Status</span>
        </div>
        {loading && rows.length === 0 && (
          <div className="flex items-center justify-center gap-2 p-8 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando...
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Nenhum registro encontrado.
          </div>
        )}
        {filtered.map((r) => {
          const reason = (r.metadata?.reason as string | undefined) ?? "—";
          const dur = r.metadata?.duration_hours as number | undefined;
          const ok = r.status === "ok";
          return (
            <div
              key={r.id}
              className="grid grid-cols-[140px_120px_1fr_80px] gap-3 border-b border-border/40 px-4 py-3 text-xs last:border-0"
            >
              <span className="font-mono text-[11px] text-muted-foreground">
                {new Date(r.created_at).toLocaleString()}
              </span>
              <span className="font-mono text-[11px] text-foreground">
                {r.action.replace("security.", "")}
                {dur != null && (
                  <span className="ml-1 text-muted-foreground">· {dur}h</span>
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate font-mono text-[11px] text-foreground">
                  {r.target ?? "—"}
                </p>
                <p className="truncate text-[10px] text-muted-foreground" title={reason}>
                  {reason}
                </p>
                {r.error && (
                  <p className="truncate text-[10px] text-destructive" title={r.error}>
                    {r.error}
                  </p>
                )}
              </div>
              <span
                className={cn(
                  "h-fit rounded-full px-2 py-0.5 text-center text-[10px] font-bold uppercase tracking-wider",
                  ok
                    ? "bg-success/15 text-success"
                    : "bg-destructive/15 text-destructive",
                )}
              >
                {r.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SecurityHistoryPage;

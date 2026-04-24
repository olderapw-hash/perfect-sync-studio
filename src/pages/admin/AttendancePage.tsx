// /admin/events/presenca — CRUD de eventos de presença + check-in.
// Fase 4A: lista de eventos, editor (criar/editar/ativar), check-in
// rápido por roleid, e tabelas de presenças e entregas (histórico).
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarCheck,
  Clock,
  Coins,
  Loader2,
  Package,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useAttendanceEvents } from "@/hooks/useAttendanceEvents";
import { useItemCatalog } from "@/context/ItemCatalogContext";
import { supabase } from "@/integrations/supabase/client";
import {
  computeDateKey,
  registerAttendance,
  TIMEZONE_OPTIONS,
  type AttendanceClaimRow,
  type AttendanceDeliveryRow,
  type AttendanceDeliveryStatus,
  type AttendanceEventRow,
  type AttendanceRewardItem,
  type AttendanceRewardPayload,
} from "@/lib/attendance";
import { formatGold } from "@/lib/mailTemplates";
import { NoActiveServerState } from "@/components/admin/NoActiveServerState";
import { cn } from "@/lib/utils";

const AttendancePage = () => {
  const { user } = useAuth();
  const { active } = useServers();
  const { can, loading: permsLoading } = useServerPermissions();
  const tenantId = active?.id ?? null;

  const {
    events,
    loading,
    error,
    refetch,
    createEvent,
    updateEvent,
    setActive: setEventActive,
    removeEvent,
  } = useAttendanceEvents(tenantId);

  const canManage = can("manage_kits");
  const canRegister = can("save_real_roles");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AttendanceEventRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttendanceEventRow | null>(null);

  // Auto-seleciona o primeiro evento
  useEffect(() => {
    if (!selectedId && events.length > 0) setSelectedId(events[0].id);
    if (selectedId && !events.find((e) => e.id === selectedId)) {
      setSelectedId(events[0]?.id ?? null);
    }
  }, [events, selectedId]);

  const selected = useMemo(
    () => events.find((e) => e.id === selectedId) ?? null,
    [events, selectedId],
  );

  /* ─── Bloqueios ─── */
  if (!tenantId) return <NoActiveServerState />;
  if (permsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!can("view")) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-destructive" />
          <h2 className="mt-3 text-base font-extrabold uppercase tracking-wider text-foreground">
            Sem permissão
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Você não tem permissão para visualizar este servidor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Header */}
        <header className="flex flex-wrap items-start gap-3 rounded-2xl border-2 border-primary/40 bg-primary/5 p-4">
          <CalendarCheck className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Eventos · Presença
            </p>
            <h1 className="text-lg font-extrabold text-foreground">
              Check-in diário e recompensas
            </h1>
            <p className="text-xs text-muted-foreground">
              Servidor <span className="font-semibold">{active?.server_name}</span> · idempotência
              por dia · entrega automática via correio.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/admin/events"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs transition-smooth hover:border-primary/50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Hub de eventos
            </Link>
            {canManage && (
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setEditorOpen(true);
                }}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Novo evento
              </Button>
            )}
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />
            {error}
          </div>
        )}

        {/* Layout 2 colunas: lista + detalhe */}
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Lista de eventos */}
          <aside className="rounded-xl border border-border bg-card/40 p-3">
            <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Eventos ({events.length})
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : events.length === 0 ? (
              <p className="px-2 py-4 text-xs text-muted-foreground">
                Nenhum evento cadastrado ainda.
              </p>
            ) : (
              <div className="space-y-1.5">
                {events.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setSelectedId(ev.id)}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-left transition-smooth",
                      selectedId === ev.id
                        ? "border-primary/60 bg-primary/10"
                        : "border-border bg-background/40 hover:border-primary/40",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          ev.status_active ? "bg-success" : "bg-muted-foreground/50",
                        )}
                      />
                      <span className="flex-1 truncate text-sm font-semibold text-foreground">
                        {ev.name}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {ev.timezone} · {ev.daily_reset ? "reset diário" : "sem reset"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </aside>

          {/* Detalhe do evento */}
          <section className="min-w-0">
            {!selected ? (
              <div className="rounded-xl border border-dashed border-border bg-card/30 p-10 text-center">
                <CalendarCheck className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  {canManage
                    ? 'Crie um evento clicando em "Novo evento" para começar.'
                    : "Nenhum evento de presença foi cadastrado neste servidor ainda."}
                </p>
              </div>
            ) : (
              <EventDetail
                event={selected}
                canManage={canManage}
                canRegister={canRegister}
                userId={user?.id ?? null}
                onEdit={() => {
                  setEditing(selected);
                  setEditorOpen(true);
                }}
                onToggle={async (next) => {
                  try {
                    await setEventActive(selected.id, next);
                    toast.success(next ? "Evento ativado" : "Evento desativado");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Falha ao alterar status");
                  }
                }}
                onDelete={() => setDeleteTarget(selected)}
                onAfterRegister={refetch}
              />
            )}
          </section>
        </div>
      </div>

      {/* Editor */}
      <EventEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editing={editing}
        onSubmit={async (input) => {
          if (!user?.id) throw new Error("Sessão inválida");
          if (editing) await updateEvent(editing.id, input);
          else await createEvent(input, user.id);
        }}
      />

      {/* Confirm delete */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o evento e todo o histórico associado (presenças
              registradas e entregas). Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await removeEvent(deleteTarget.id);
                  toast.success("Evento removido");
                  setDeleteTarget(null);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Falha ao remover");
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AttendancePage;

/* -------------------------------------------------------------------------- */
/* Detalhe do evento + check-in + histórico                                   */
/* -------------------------------------------------------------------------- */

interface EventDetailProps {
  event: AttendanceEventRow;
  canManage: boolean;
  canRegister: boolean;
  userId: string | null;
  onEdit: () => void;
  onToggle: (next: boolean) => Promise<void>;
  onDelete: () => void;
  onAfterRegister: () => Promise<void> | void;
}

const EventDetail = ({
  event,
  canManage,
  canRegister,
  userId,
  onEdit,
  onToggle,
  onDelete,
  onAfterRegister,
}: EventDetailProps) => {
  const [claims, setClaims] = useState<AttendanceClaimRow[]>([]);
  const [deliveries, setDeliveries] = useState<AttendanceDeliveryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const reload = async () => {
    setHistoryLoading(true);
    const [c, d] = await Promise.all([
      supabase
        .from("attendance_claims")
        .select("*")
        .eq("event_id", event.id)
        .order("claimed_at", { ascending: false })
        .limit(50),
      supabase
        .from("attendance_reward_deliveries")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setClaims((c.data ?? []) as unknown as AttendanceClaimRow[]);
    setDeliveries((d.data ?? []) as unknown as AttendanceDeliveryRow[]);
    setHistoryLoading(false);
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  const today = computeDateKey(event.timezone);

  return (
    <div className="space-y-4">
      {/* Cabeçalho do evento */}
      <div className="rounded-xl border border-border bg-card/60 p-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-extrabold text-foreground">
                {event.name}
              </h2>
              <span
                className={cn(
                  "rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-tight",
                  event.status_active
                    ? "bg-success/15 text-success"
                    : "bg-muted/60 text-muted-foreground",
                )}
              >
                {event.status_active ? "Ativo" : "Inativo"}
              </span>
            </div>
            {event.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{event.description}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span>
                <Clock className="mr-1 inline h-3 w-3" />
                Fuso: <span className="font-mono">{event.timezone}</span>
              </span>
              <span>
                Hoje (no fuso): <span className="font-mono text-foreground">{today}</span>
              </span>
              {event.period_start && (
                <span>Início: {new Date(event.period_start).toLocaleString()}</span>
              )}
              {event.period_end && (
                <span>Fim: {new Date(event.period_end).toLocaleString()}</span>
              )}
            </div>
          </div>

          {canManage && (
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                variant={event.status_active ? "outline" : "default"}
                size="sm"
                onClick={() => onToggle(!event.status_active)}
              >
                {event.status_active ? "Desativar" : "Ativar"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Recompensa snapshot */}
        <RewardSummary reward={event.reward_payload} />
      </div>

      {/* Check-in rápido */}
      <CheckInCard
        event={event}
        userId={userId}
        canRegister={canRegister}
        onDone={async () => {
          await reload();
          await onAfterRegister();
        }}
      />

      {/* Histórico */}
      <div className="grid gap-4 lg:grid-cols-2">
        <HistorySection title={`Presenças (${claims.length})`} loading={historyLoading}>
          {claims.length === 0 ? (
            <EmptyHistory text="Nenhuma presença registrada ainda." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-2 py-1.5 text-left">Data</th>
                    <th className="px-2 py-1.5 text-left">Roleid</th>
                    <th className="px-2 py-1.5 text-left">Nome</th>
                    <th className="px-2 py-1.5 text-left">Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((c) => (
                    <tr key={c.id} className="border-b border-border/40">
                      <td className="px-2 py-1.5 font-mono text-foreground">{c.date_key}</td>
                      <td className="px-2 py-1.5 font-mono">{c.roleid}</td>
                      <td className="px-2 py-1.5">{c.role_name ?? "—"}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">
                        {new Date(c.claimed_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </HistorySection>

        <HistorySection title={`Entregas (${deliveries.length})`} loading={historyLoading}>
          {deliveries.length === 0 ? (
            <EmptyHistory text="Nenhuma entrega registrada ainda." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-2 py-1.5 text-left">Data</th>
                    <th className="px-2 py-1.5 text-left">Roleid</th>
                    <th className="px-2 py-1.5 text-left">Status</th>
                    <th className="px-2 py-1.5 text-left">Detalhe</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d) => (
                    <tr key={d.id} className="border-b border-border/40 align-top">
                      <td className="px-2 py-1.5 font-mono text-foreground">{d.date_key}</td>
                      <td className="px-2 py-1.5 font-mono">{d.roleid}</td>
                      <td className="px-2 py-1.5">
                        <DeliveryStatusBadge status={d.status} />
                      </td>
                      <td className="px-2 py-1.5 text-muted-foreground">
                        {d.error_message ?? `${d.mail_log_ids.length} envio(s)`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </HistorySection>
      </div>
    </div>
  );
};

const HistorySection = ({
  title,
  loading,
  children,
}: {
  title: string;
  loading?: boolean;
  children: React.ReactNode;
}) => (
  <section className="rounded-xl border border-border bg-card/40 p-3">
    <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
      {title}
    </h3>
    {loading ? (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    ) : (
      children
    )}
  </section>
);

const EmptyHistory = ({ text }: { text: string }) => (
  <p className="px-2 py-4 text-xs text-muted-foreground">{text}</p>
);

const DeliveryStatusBadge = ({ status }: { status: AttendanceDeliveryStatus }) => {
  const map: Record<AttendanceDeliveryStatus, { label: string; cls: string }> = {
    pending: { label: "Pendente", cls: "bg-amber-500/15 text-amber-500" },
    sent: { label: "Enviado", cls: "bg-success/15 text-success" },
    error: { label: "Erro", cls: "bg-destructive/15 text-destructive" },
    duplicate_blocked: {
      label: "Duplicado",
      cls: "bg-muted/70 text-muted-foreground",
    },
  };
  const { label, cls } = map[status];
  return (
    <span
      className={cn(
        "inline-flex rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-tight",
        cls,
      )}
    >
      {label}
    </span>
  );
};

const RewardSummary = ({ reward }: { reward: AttendanceRewardPayload }) => {
  const items = reward?.items ?? [];
  const gold = reward?.gold ?? 0;
  const { metaFor, iconUrlFor } = useItemCatalog();
  if (items.length === 0 && gold <= 0) {
    return (
      <div className="mt-3 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-2.5 text-[11px] text-amber-500">
        Recompensa vazia — adicione itens ou gold antes de ativar.
      </div>
    );
  }
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {items.map((it, idx) => {
        const meta = metaFor(it.item_id);
        const icon = iconUrlFor(it.item_id);
        return (
          <div
            key={`${it.item_id}-${idx}`}
            className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-2 py-1 text-xs"
          >
            {icon ? (
              <img
                src={icon}
                alt=""
                className="h-5 w-5 rounded border border-border object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Package className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-semibold text-foreground">
              {meta?.name ?? it.item_name ?? `Item ${it.item_id}`}
            </span>
            <span className="font-mono text-muted-foreground">×{it.count}</span>
          </div>
        );
      })}
      {gold > 0 && (
        <div className="flex items-center gap-1.5 rounded-md border border-border bg-background/40 px-2 py-1 text-xs">
          <Coins className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-mono">{formatGold(gold)}</span>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Check-in                                                                    */
/* -------------------------------------------------------------------------- */

const CheckInCard = ({
  event,
  userId,
  canRegister,
  onDone,
}: {
  event: AttendanceEventRow;
  userId: string | null;
  canRegister: boolean;
  onDone: () => Promise<void> | void;
}) => {
  const [roleidStr, setRoleidStr] = useState("");
  const [roleName, setRoleName] = useState("");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{
    status: "sent" | "duplicate_blocked" | "error" | "pending";
    message: string;
  } | null>(null);

  const submit = async () => {
    if (!userId) return;
    const roleid = parseInt(roleidStr, 10);
    if (!Number.isFinite(roleid) || roleid <= 0) {
      toast.error("Roleid inválido");
      return;
    }
    setBusy(true);
    try {
      const r = await registerAttendance({
        event,
        roleid,
        roleName: roleName.trim() || null,
        userId,
      });
      setLast({ status: r.status, message: r.message });
      if (r.status === "sent") toast.success(r.message);
      else if (r.status === "duplicate_blocked") toast.warning(r.message);
      else if (r.status === "pending") toast.info(r.message);
      else toast.error(r.message);
      await onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Registrar presença
        </h3>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Cada personagem só pode marcar 1 presença por <span className="font-mono">date_key</span>{" "}
        (calculado no fuso do evento).
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-[160px_1fr_auto]">
        <div className="space-y-1.5">
          <Label htmlFor="att-roleid">Roleid *</Label>
          <Input
            id="att-roleid"
            type="number"
            min={1}
            value={roleidStr}
            onChange={(e) => setRoleidStr(e.target.value)}
            placeholder="1024"
            className="font-mono"
            disabled={!canRegister || !event.status_active}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="att-name">Nome (opcional)</Label>
          <Input
            id="att-name"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            maxLength={64}
            disabled={!canRegister || !event.status_active}
          />
        </div>
        <div className="flex items-end">
          <Button
            onClick={submit}
            disabled={busy || !canRegister || !event.status_active}
            className="w-full sm:w-auto"
          >
            {busy ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserCheck className="mr-1.5 h-3.5 w-3.5" />
            )}
            Marcar presença
          </Button>
        </div>
      </div>

      {!canRegister && (
        <p className="mt-2 text-[11px] text-amber-500">
          Você precisa da permissão <code className="font-mono">save_real_roles</code> para
          registrar presenças.
        </p>
      )}
      {!event.status_active && (
        <p className="mt-2 text-[11px] text-amber-500">
          Este evento está inativo — ative para permitir check-ins.
        </p>
      )}

      {last && (
        <div
          className={cn(
            "mt-3 rounded-lg border p-2.5 text-xs",
            last.status === "sent"
              ? "border-success/40 bg-success/10 text-success"
              : last.status === "duplicate_blocked"
                ? "border-muted-foreground/30 bg-muted/40 text-foreground/80"
                : last.status === "pending"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                  : "border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          {last.message}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Editor de evento                                                            */
/* -------------------------------------------------------------------------- */

interface EditorState {
  name: string;
  description: string;
  status_active: boolean;
  period_start: string;
  period_end: string;
  daily_reset: boolean;
  streak_enabled: boolean;
  timezone: string;
  items: AttendanceRewardItem[];
  gold: string;
  subject: string;
  body: string;
}

const emptyState = (): EditorState => ({
  name: "",
  description: "",
  status_active: true,
  period_start: "",
  period_end: "",
  daily_reset: true,
  streak_enabled: false,
  timezone: "America/Sao_Paulo",
  items: [],
  gold: "",
  subject: "",
  body: "",
});

const fromEvent = (ev: AttendanceEventRow): EditorState => ({
  name: ev.name,
  description: ev.description ?? "",
  status_active: ev.status_active,
  period_start: ev.period_start ? toLocalInputValue(ev.period_start) : "",
  period_end: ev.period_end ? toLocalInputValue(ev.period_end) : "",
  daily_reset: ev.daily_reset,
  streak_enabled: ev.streak_enabled,
  timezone: ev.timezone,
  items: ev.reward_payload?.items ?? [],
  gold: ev.reward_payload?.gold ? String(ev.reward_payload.gold) : "",
  subject: ev.reward_payload?.subject ?? "",
  body: ev.reward_payload?.body ?? "",
});

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

const EventEditorDialog = ({
  open,
  onOpenChange,
  editing,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: AttendanceEventRow | null;
  onSubmit: (input: {
    name: string;
    description: string | null;
    status_active: boolean;
    period_start: string | null;
    period_end: string | null;
    daily_reset: boolean;
    streak_enabled: boolean;
    timezone: string;
    reward_payload: AttendanceRewardPayload;
  }) => Promise<void>;
}) => {
  const { metaFor } = useItemCatalog();
  const [state, setState] = useState<EditorState>(emptyState());
  const [saving, setSaving] = useState(false);
  const [newItemId, setNewItemId] = useState("");
  const [newItemCount, setNewItemCount] = useState("1");

  useEffect(() => {
    if (open) setState(editing ? fromEvent(editing) : emptyState());
  }, [open, editing]);

  const addItem = () => {
    const id = parseInt(newItemId, 10);
    const count = parseInt(newItemCount, 10);
    if (!Number.isFinite(id) || id <= 0) {
      toast.error("Item ID inválido");
      return;
    }
    if (!Number.isFinite(count) || count <= 0) {
      toast.error("Quantidade inválida");
      return;
    }
    const meta = metaFor(id);
    setState((s) => ({
      ...s,
      items: [
        ...s.items,
        { item_id: id, count, item_name: meta?.name },
      ],
    }));
    setNewItemId("");
    setNewItemCount("1");
  };

  const removeItem = (idx: number) => {
    setState((s) => ({ ...s, items: s.items.filter((_, i) => i !== idx) }));
  };

  const submit = async () => {
    if (!state.name.trim()) {
      toast.error("Informe um nome para o evento");
      return;
    }
    const goldNum = state.gold.trim() ? parseInt(state.gold, 10) : 0;
    if (state.gold.trim() && (!Number.isFinite(goldNum) || goldNum <= 0)) {
      toast.error("Valor de gold inválido");
      return;
    }
    if (state.items.length === 0 && goldNum <= 0) {
      toast.error("Adicione ao menos 1 item ou gold à recompensa");
      return;
    }
    const reward: AttendanceRewardPayload = {
      items: state.items,
      ...(goldNum > 0 ? { gold: goldNum } : {}),
      ...(state.subject.trim() ? { subject: state.subject.trim() } : {}),
      ...(state.body.trim() ? { body: state.body.trim() } : {}),
    };
    setSaving(true);
    try {
      await onSubmit({
        name: state.name.trim(),
        description: state.description.trim() || null,
        status_active: state.status_active,
        period_start: state.period_start ? new Date(state.period_start).toISOString() : null,
        period_end: state.period_end ? new Date(state.period_end).toISOString() : null,
        daily_reset: state.daily_reset,
        streak_enabled: state.streak_enabled,
        timezone: state.timezone,
        reward_payload: reward,
      });
      toast.success(editing ? "Evento atualizado" : "Evento criado");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar evento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar evento" : "Novo evento de presença"}</DialogTitle>
          <DialogDescription>
            Configure regras, janela e recompensa. O check-in fica disponível
            assim que o evento estiver ativo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nome *</Label>
              <Input
                value={state.name}
                onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
                placeholder="ex.: Check-in diário"
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={state.description}
                onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
                rows={2}
                maxLength={500}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Início (opcional)</Label>
              <Input
                type="datetime-local"
                value={state.period_start}
                onChange={(e) => setState((s) => ({ ...s, period_start: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fim (opcional)</Label>
              <Input
                type="datetime-local"
                value={state.period_end}
                onChange={(e) => setState((s) => ({ ...s, period_end: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Fuso horário</Label>
              <Select
                value={state.timezone}
                onValueChange={(v) => setState((s) => ({ ...s, timezone: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                A chave de dia é calculada neste fuso (define quando "vira o dia").
              </p>
            </div>

            <ToggleRow
              label="Ativo"
              hint="Permite registrar presenças"
              checked={state.status_active}
              onChange={(v) => setState((s) => ({ ...s, status_active: v }))}
            />
            <ToggleRow
              label="Reset diário"
              hint="Habilita check-in 1× por dia"
              checked={state.daily_reset}
              onChange={(v) => setState((s) => ({ ...s, daily_reset: v }))}
            />
            <ToggleRow
              label="Streak (próxima fase)"
              hint="Mantém o flag salvo; sem efeito agora"
              checked={state.streak_enabled}
              onChange={(v) => setState((s) => ({ ...s, streak_enabled: v }))}
              disabled
            />
          </div>

          {/* Recompensa */}
          <div className="space-y-3 rounded-lg border border-border bg-background/30 p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Recompensa base
            </h3>

            {state.items.length > 0 && (
              <div className="space-y-1.5">
                {state.items.map((it, idx) => {
                  const meta = metaFor(it.item_id);
                  return (
                    <div
                      key={`${it.item_id}-${idx}`}
                      className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-2 py-1.5 text-xs"
                    >
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-semibold text-foreground">
                        {meta?.name ?? it.item_name ?? `Item ${it.item_id}`}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        ID {it.item_id} · ×{it.count}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(idx)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
              <div className="space-y-1.5">
                <Label className="text-[11px]">Item ID</Label>
                <Input
                  type="number"
                  min={1}
                  value={newItemId}
                  onChange={(e) => setNewItemId(e.target.value)}
                  placeholder="ex.: 11530"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Qtd</Label>
                <Input
                  type="number"
                  min={1}
                  value={newItemCount}
                  onChange={(e) => setNewItemCount(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="flex items-end">
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px]">Gold (cobre, opcional)</Label>
              <Input
                type="number"
                min={0}
                value={state.gold}
                onChange={(e) => setState((s) => ({ ...s, gold: e.target.value }))}
                placeholder="0"
                className="font-mono"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px]">Assunto do correio (opcional)</Label>
                <Input
                  value={state.subject}
                  onChange={(e) => setState((s) => ({ ...s, subject: e.target.value }))}
                  maxLength={120}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Corpo (opcional)</Label>
                <Input
                  value={state.body}
                  onChange={(e) => setState((s) => ({ ...s, body: e.target.value }))}
                  maxLength={500}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {editing ? "Salvar alterações" : "Criar evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ToggleRow = ({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) => (
  <div className="flex items-center justify-between rounded-md border border-border bg-background/30 p-2.5">
    <div className="min-w-0">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
  </div>
);

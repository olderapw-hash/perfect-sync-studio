// /admin/events/raffles — Fase 4B1: CRUD de Sorteios.
//
// Esta tela cobre:
//   - listar sorteios (todos os status)
//   - criar sorteio (status inicial = draft)
//   - editar dados básicos + payload de prêmio (itens + gold)
//   - ativar (draft → active) e encerrar (active → closed)
//   - excluir
//   - ver detalhes em painel lateral
//
// Participantes / sorteio / entrega de prêmio entram nas fases 4B2 e 4B3 —
// aqui mostramos placeholders informativos no painel de detalhes para
// deixar claro o roadmap.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Coins,
  Dices,
  Gift,
  Loader2,
  Lock,
  Package,
  Pencil,
  Play,
  Plus,
  RotateCw,
  Search,
  Square,
  Trash2,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useServers } from "@/hooks/useServers";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { useRaffles, type CreateRaffleInput } from "@/hooks/useRaffles";
import { useRaffleParticipants } from "@/hooks/useRaffleParticipants";
import { useItemCatalog } from "@/context/ItemCatalogContext";
import { NoActiveServerState } from "@/components/admin/NoActiveServerState";
import { formatGold } from "@/lib/mailTemplates";
import {
  isRewardPayloadValid,
  raffleStatusLabel,
  type RaffleEvent,
  type RaffleParticipant,
  type RaffleRewardItem,
  type RaffleRewardPayload,
  type RaffleStatus,
} from "@/lib/raffles";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | RaffleStatus;

const RafflesPage = () => {
  const { active } = useServers();
  const { can, loading: permsLoading } = useServerPermissions();
  const tenantId = active?.id ?? null;

  const {
    raffles,
    loading,
    error,
    createRaffle,
    updateRaffle,
    deleteRaffle,
  } = useRaffles({ tenantId });

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RaffleEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RaffleEvent | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return raffles.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (q && !r.name.toLowerCase().includes(q) && !(r.description ?? "").toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [raffles, filter, search]);

  const selected = useMemo(
    () => raffles.find((r) => r.id === selectedId) ?? null,
    [raffles, selectedId],
  );

  const canManage = can("manage_kits");

  if (!tenantId) return <NoActiveServerState />;
  if (permsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (r: RaffleEvent) => {
    setEditing(r);
    setEditorOpen(true);
  };

  const handleSetStatus = async (r: RaffleEvent, status: RaffleStatus) => {
    if (r.status === status) return;
    if (status === "active" && !isRewardPayloadValid(r.reward_payload_json)) {
      toast.error("Adicione um prêmio (item ou gold) antes de ativar.");
      return;
    }
    const ok = await updateRaffle(r.id, { status });
    if (ok) {
      toast.success(
        status === "active"
          ? "Sorteio ativado"
          : status === "closed"
            ? "Sorteio encerrado"
            : "Sorteio movido para rascunho",
      );
    } else {
      toast.error("Falha ao atualizar status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteRaffle(deleteTarget.id);
    if (ok) {
      toast.success("Sorteio excluído");
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
    } else {
      toast.error("Falha ao excluir sorteio");
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-5 p-6">
        {/* Header */}
        <header className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/events"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card/40 px-2 py-1 text-[11px] text-muted-foreground transition-smooth hover:border-primary/40 hover:text-primary"
          >
            <ArrowLeft className="h-3 w-3" />
            Eventos
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            <Gift className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold tracking-tight text-foreground">
              Sorteios
            </h1>
            <p className="text-xs text-muted-foreground">
              Crie sorteios com prêmios, ative quando quiser e acompanhe os
              vencedores.
            </p>
          </div>
          {canManage && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo sorteio
            </Button>
          )}
        </header>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="draft">Rascunho</TabsTrigger>
              <TabsTrigger value="active">Ativos</TabsTrigger>
              <TabsTrigger value="closed">Encerrados</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative ml-auto w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nome ou descrição"
              className="h-8 pl-8 text-xs"
            />
          </div>
          <span className="text-[11px] text-muted-foreground">
            {filtered.length} de {raffles.length}
          </span>
        </div>

        {/* Lista + Detalhes */}
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div>
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/20 p-10 text-center text-sm text-muted-foreground">
                <Gift className="mx-auto mb-3 h-8 w-8 opacity-50" />
                {raffles.length === 0 ? (
                  <>
                    Nenhum sorteio ainda.{" "}
                    {canManage && (
                      <button onClick={openCreate} className="text-primary hover:underline">
                        Criar o primeiro
                      </button>
                    )}
                  </>
                ) : (
                  "Nenhum sorteio corresponde ao filtro."
                )}
              </div>
            ) : (
              <ul className="space-y-3">
                {filtered.map((r) => (
                  <RaffleCard
                    key={r.id}
                    raffle={r}
                    selected={r.id === selectedId}
                    canManage={canManage}
                    onSelect={() => setSelectedId(r.id)}
                    onEdit={() => openEdit(r)}
                    onDelete={() => setDeleteTarget(r)}
                    onSetStatus={(s) => handleSetStatus(r, s)}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Painel lateral */}
          <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-7rem)] lg:overflow-y-auto">
            {selected ? (
              <RaffleDetailsPanel raffle={selected} canManage={canManage} tenantId={tenantId} />
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card/20 p-6 text-center text-xs text-muted-foreground">
                Selecione um sorteio para ver os detalhes.
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Editor */}
      <RaffleEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editing={editing}
        onCreate={async (input) => {
          const created = await createRaffle(input);
          if (created) {
            toast.success("Sorteio criado");
            setEditorOpen(false);
            setSelectedId(created.id);
          } else {
            toast.error("Falha ao criar sorteio");
          }
        }}
        onUpdate={async (id, patch) => {
          const ok = await updateRaffle(id, patch);
          if (ok) {
            toast.success("Sorteio atualizado");
            setEditorOpen(false);
          } else {
            toast.error("Falha ao atualizar");
          }
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Excluir sorteio?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name && (
                <>
                  O sorteio <strong>"{deleteTarget.name}"</strong> será removido
                  permanentemente, junto com participantes, vencedores e
                  histórico de entregas associados.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

const STATUS_STYLES: Record<RaffleStatus, string> = {
  draft: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
  active: "border-success/40 bg-success/15 text-success",
  closed: "border-amber-500/40 bg-amber-500/15 text-amber-500",
};

const StatusBadge = ({ status }: { status: RaffleStatus }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
      STATUS_STYLES[status],
    )}
  >
    {status === "active" && <CheckCircle2 className="h-3 w-3" />}
    {status === "closed" && <Lock className="h-3 w-3" />}
    {raffleStatusLabel(status)}
  </span>
);

interface RaffleCardProps {
  raffle: RaffleEvent;
  selected: boolean;
  canManage: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetStatus: (s: RaffleStatus) => void;
}

const RaffleCard = ({
  raffle,
  selected,
  canManage,
  onSelect,
  onEdit,
  onDelete,
  onSetStatus,
}: RaffleCardProps) => {
  const itemsCount = raffle.reward_payload_json.items.length;
  const gold = raffle.reward_payload_json.gold;

  return (
    <li
      className={cn(
        "rounded-xl border bg-card/40 p-4 transition-smooth",
        selected
          ? "border-primary/60 ring-1 ring-primary/40"
          : "border-border hover:border-primary/40",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            <Trophy className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-bold text-foreground">{raffle.name}</h3>
              <StatusBadge status={raffle.status} />
            </div>
            {raffle.description && (
              <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                {raffle.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {raffle.winners_count} vencedor{raffle.winners_count > 1 ? "es" : ""}
              </span>
              <span className="inline-flex items-center gap-1">
                <Package className="h-3 w-3" />
                {itemsCount} {itemsCount === 1 ? "item" : "itens"}
              </span>
              {gold > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-500">
                  <Coins className="h-3 w-3" />
                  {formatGold(gold)}
                </span>
              )}
            </div>
          </div>
        </button>

        {canManage && (
          <div className="flex flex-col gap-1">
            {raffle.status === "draft" && (
              <button
                onClick={() => onSetStatus("active")}
                className="inline-flex items-center gap-1 rounded-md border border-success/40 bg-success/10 px-2 py-1 text-[11px] font-semibold text-success transition-smooth hover:bg-success/20"
                title="Ativar sorteio"
              >
                <Play className="h-3 w-3" />
                Ativar
              </button>
            )}
            {raffle.status === "active" && (
              <button
                onClick={() => onSetStatus("closed")}
                className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-500 transition-smooth hover:bg-amber-500/20"
                title="Encerrar sorteio"
              >
                <Square className="h-3 w-3" />
                Encerrar
              </button>
            )}
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background/40 px-2 py-1 text-[11px] transition-smooth hover:border-primary/50"
              title="Editar"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-[11px] text-destructive transition-smooth hover:bg-destructive/20"
              title="Excluir"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </li>
  );
};

/* -------------------------------------------------------------------------- */
/* Painel de detalhes                                                         */
/* -------------------------------------------------------------------------- */

const RaffleDetailsPanel = ({
  raffle,
  canManage,
  tenantId,
}: {
  raffle: RaffleEvent;
  canManage: boolean;
  tenantId: string;
}) => {
  const { metaFor } = useItemCatalog();
  const items = raffle.reward_payload_json.items;
  const gold = raffle.reward_payload_json.gold;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="flex items-start gap-2">
          <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Sorteio
            </p>
            <h2 className="truncate text-base font-extrabold text-foreground">{raffle.name}</h2>
            {raffle.description && (
              <p className="mt-1 text-xs text-muted-foreground">{raffle.description}</p>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-md border border-border bg-background/40 p-2">
            <span className="text-muted-foreground">Status</span>
            <div className="mt-1">
              <StatusBadge status={raffle.status} />
            </div>
          </div>
          <div className="rounded-md border border-border bg-background/40 p-2">
            <span className="text-muted-foreground">Vencedores</span>
            <div className="mt-1 font-mono text-sm font-bold text-foreground">
              {raffle.winners_count}
            </div>
          </div>
          <div className="rounded-md border border-border bg-background/40 p-2">
            <span className="text-muted-foreground">Início</span>
            <div className="mt-1 text-[11px] text-foreground">
              {raffle.starts_at ? new Date(raffle.starts_at).toLocaleString("pt-BR") : "—"}
            </div>
          </div>
          <div className="rounded-md border border-border bg-background/40 p-2">
            <span className="text-muted-foreground">Fim</span>
            <div className="mt-1 text-[11px] text-foreground">
              {raffle.ends_at ? new Date(raffle.ends_at).toLocaleString("pt-BR") : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Prêmio */}
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Prêmio
        </p>
        {raffle.reward_title && (
          <p className="text-sm font-bold text-foreground">{raffle.reward_title}</p>
        )}
        {raffle.reward_message && (
          <p className="mt-1 text-[11px] text-muted-foreground whitespace-pre-wrap">
            {raffle.reward_message}
          </p>
        )}
        {items.length === 0 && gold === 0 ? (
          <p className="mt-2 text-[11px] text-amber-500">
            Nenhum item ou gold cadastrado.
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {items.map((it, idx) => {
              const meta = metaFor(it.item_id);
              return (
                <li
                  key={`${it.item_id}-${idx}`}
                  className="flex items-center justify-between rounded-md border border-border bg-background/40 px-2 py-1.5 text-[11px]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-foreground">
                      {meta?.name ?? it.item_name ?? `Item ${it.item_id}`}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      ID {it.item_id}
                    </div>
                  </div>
                  <span className="font-mono text-primary">×{it.count}</span>
                </li>
              );
            })}
            {gold > 0 && (
              <li className="flex items-center justify-between rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1.5 font-semibold text-amber-500">
                  <Coins className="h-3 w-3" />
                  Moedas
                </span>
                <span className="font-mono font-bold text-amber-500">{formatGold(gold)}</span>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Participantes & sorteio (Fase 4B2) */}
      <RaffleParticipantsSection
        raffle={raffle}
        canManage={canManage}
        tenantId={tenantId}
      />

      <div className="rounded-2xl border border-dashed border-border bg-card/20 p-3 text-[11px] text-muted-foreground">
        <p className="inline-flex items-center gap-1 text-[10px]">
          <CalendarClock className="h-3 w-3" />
          Criado em {new Date(raffle.created_at).toLocaleString("pt-BR")}
        </p>
        <p className="mt-1 text-[10px]">
          A entrega automática de prêmios por correio será adicionada na próxima
          fase (4B3).
        </p>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Participantes & Sorteio (Fase 4B2)                                         */
/* -------------------------------------------------------------------------- */

interface ParticipantsSectionProps {
  raffle: RaffleEvent;
  canManage: boolean;
  tenantId: string;
}

const RaffleParticipantsSection = ({
  raffle,
  canManage,
  tenantId,
}: ParticipantsSectionProps) => {
  const {
    participants,
    winners,
    loading,
    drawing,
    error,
    addParticipant,
    bulkAddParticipants,
    removeParticipant,
    drawWinners,
  } = useRaffleParticipants({ raffleId: raffle.id, tenantId });

  const [newRoleid, setNewRoleid] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [drawConfirmOpen, setDrawConfirmOpen] = useState(false);
  const [redrawConfirmOpen, setRedrawConfirmOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<RaffleParticipant | null>(null);

  const winnerRoleids = useMemo(
    () => new Set(winners.map((w) => w.roleid)),
    [winners],
  );

  const canDraw =
    canManage && raffle.status !== "draft" && participants.length > 0 &&
    raffle.winners_count <= participants.length;

  const handleAdd = async () => {
    const id = parseInt(newRoleid, 10);
    if (!Number.isFinite(id) || id <= 0) {
      toast.error("Roleid inválido");
      return;
    }
    if (participants.some((p) => p.roleid === id)) {
      toast.error("Esse personagem já está no sorteio");
      return;
    }
    const r = await addParticipant({
      roleid: id,
      role_name: newRoleName.trim() || null,
      source: "manual",
    });
    if (r) {
      toast.success("Participante adicionado");
      setNewRoleid("");
      setNewRoleName("");
    } else {
      toast.error("Falha ao adicionar (verifique permissão / duplicidade)");
    }
  };

  const handleBulk = async () => {
    const lines = bulkText
      .split(/[\s,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const ids = lines
      .map((l) => parseInt(l, 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (ids.length === 0) {
      toast.error("Cole ao menos um roleid válido");
      return;
    }
    setBulkBusy(true);
    try {
      const result = await bulkAddParticipants(ids, "import");
      const parts: string[] = [];
      if (result.added > 0) parts.push(`${result.added} adicionado(s)`);
      if (result.duplicates > 0) parts.push(`${result.duplicates} duplicado(s)`);
      if (result.invalid > 0) parts.push(`${result.invalid} inválido(s)`);
      if (result.errors > 0) parts.push(`${result.errors} erro(s)`);
      if (result.added > 0) toast.success(parts.join(" · "));
      else toast.error(parts.join(" · ") || "Nada importado");
      if (result.added > 0) {
        setBulkOpen(false);
        setBulkText("");
      }
    } finally {
      setBulkBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    const ok = await removeParticipant(removeTarget.id);
    if (ok) toast.success("Participante removido");
    else toast.error("Falha ao remover");
    setRemoveTarget(null);
  };

  const handleDraw = async (clearPrevious: boolean) => {
    const r = await drawWinners(raffle.winners_count, clearPrevious);
    if (r) {
      toast.success(
        `Sorteio concluído — ${r.length} vencedor(es) selecionado(s)`,
      );
    } else if (error) {
      toast.error(error);
    } else {
      toast.error("Falha ao sortear");
    }
  };

  return (
    <>
      {/* Participantes */}
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Users className="h-3 w-3" />
            Participantes ({participants.length})
          </p>
          {canManage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-[11px]"
              onClick={() => setBulkOpen(true)}
            >
              <UserPlus className="h-3 w-3" />
              Importar
            </Button>
          )}
        </div>

        {canManage && (
          <div className="mt-2 grid grid-cols-[110px_1fr_auto] gap-2">
            <Input
              value={newRoleid}
              onChange={(e) => setNewRoleid(e.target.value)}
              placeholder="Roleid"
              inputMode="numeric"
              className="h-8 text-xs"
            />
            <Input
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Nome (opcional)"
              className="h-8 text-xs"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 gap-1"
              onClick={handleAdd}
            >
              <Plus className="h-3 w-3" />
              Add
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex h-16 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        ) : participants.length === 0 ? (
          <p className="mt-3 text-[11px] text-muted-foreground">
            Nenhum participante ainda.
          </p>
        ) : (
          <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto pr-1">
            {participants.map((p) => {
              const isWinner = winnerRoleids.has(p.roleid);
              return (
                <li
                  key={p.id}
                  className={cn(
                    "flex items-center justify-between rounded-md border px-2 py-1.5 text-[11px]",
                    isWinner
                      ? "border-primary/50 bg-primary/10"
                      : "border-border bg-background/40",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-foreground">
                        {p.roleid}
                      </span>
                      {p.role_name && (
                        <span className="truncate text-muted-foreground">
                          {p.role_name}
                        </span>
                      )}
                      {isWinner && (
                        <Trophy className="h-3 w-3 shrink-0 text-primary" />
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {p.source === "manual"
                        ? "Manual"
                        : p.source === "import"
                          ? "Importado"
                          : "Auto"}
                    </div>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => setRemoveTarget(p)}
                      className="text-destructive hover:opacity-80"
                      title="Remover"
                      type="button"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Sortear */}
      {canManage && (
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Sorteio
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Selecionar <span className="font-bold text-foreground">{raffle.winners_count}</span>{" "}
                de <span className="font-bold text-foreground">{participants.length}</span> participante(s).
              </p>
            </div>
            {winners.length === 0 ? (
              <Button
                size="sm"
                className="gap-1.5"
                disabled={!canDraw || drawing}
                onClick={() => setDrawConfirmOpen(true)}
              >
                {drawing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Dices className="h-3.5 w-3.5" />
                )}
                Sortear agora
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={!canDraw || drawing}
                onClick={() => setRedrawConfirmOpen(true)}
              >
                {drawing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCw className="h-3.5 w-3.5" />
                )}
                Sortear de novo
              </Button>
            )}
          </div>

          {raffle.status === "draft" && (
            <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-[10px] text-amber-500">
              Ative o sorteio antes de sortear vencedores.
            </p>
          )}
          {raffle.status !== "draft" &&
            participants.length < raffle.winners_count && (
              <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-[10px] text-amber-500">
                Adicione mais participantes — são necessários pelo menos{" "}
                {raffle.winners_count}.
              </p>
            )}
          {error && (
            <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-[10px] text-destructive">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Vencedores */}
      {winners.length > 0 && (
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Trophy className="h-3 w-3" />
            Vencedores ({winners.length})
          </p>
          <ul className="mt-3 space-y-1.5">
            {winners.map((w, idx) => (
              <li
                key={w.id}
                className="flex items-center justify-between rounded-md border border-primary/30 bg-background/60 px-2 py-1.5 text-[11px]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 font-mono text-[10px] font-bold text-primary">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono font-semibold text-foreground">
                      {w.roleid}
                    </div>
                    {w.role_name && (
                      <div className="truncate text-[10px] text-muted-foreground">
                        {w.role_name}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(w.drawn_at).toLocaleString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Diálogo: importar lista */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar participantes</DialogTitle>
            <DialogDescription>
              Cole os roleids separados por vírgula, espaço ou linha. Duplicados
              são ignorados automaticamente.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="Ex.: 31, 42, 99&#10;128&#10;512"
            rows={8}
            className="font-mono text-xs"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkOpen(false)}
              disabled={bulkBusy}
            >
              Cancelar
            </Button>
            <Button onClick={handleBulk} disabled={bulkBusy}>
              {bulkBusy && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação: sortear */}
      <AlertDialog open={drawConfirmOpen} onOpenChange={setDrawConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Dices className="h-5 w-5 text-primary" />
              Sortear agora?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Será selecionado(s) <strong>{raffle.winners_count}</strong> vencedor(es)
              entre os <strong>{participants.length}</strong> participantes.
              O resultado é registrado de forma permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                setDrawConfirmOpen(false);
                void handleDraw(false);
              }}
            >
              Sortear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação forte: re-sortear */}
      <AlertDialog open={redrawConfirmOpen} onOpenChange={setRedrawConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Sortear novamente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Os <strong>{winners.length}</strong> vencedor(es) atuais serão
              <strong> apagados</strong> e um novo sorteio será executado. Esta
              ação é registrada na auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                setRedrawConfirmOpen(false);
                void handleDraw(true);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sortear novamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação: remover participante */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover participante?</AlertDialogTitle>
            <AlertDialogDescription>
              O personagem <strong>{removeTarget?.roleid}</strong>
              {removeTarget?.role_name ? ` (${removeTarget.role_name})` : ""} será
              removido deste sorteio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleRemove();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* Editor (criar / editar)                                                    */
/* -------------------------------------------------------------------------- */

interface EditorProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: RaffleEvent | null;
  onCreate: (input: CreateRaffleInput) => Promise<void>;
  onUpdate: (
    id: string,
    patch: Partial<{
      name: string;
      description: string | null;
      starts_at: string | null;
      ends_at: string | null;
      winners_count: number;
      reward_title: string | null;
      reward_message: string | null;
      reward_payload_json: RaffleRewardPayload;
    }>,
  ) => Promise<void>;
}

/** Converte ISO → input datetime-local (sem timezone). */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

const RaffleEditorDialog = ({ open, onOpenChange, editing, onCreate, onUpdate }: EditorProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [winnersCount, setWinnersCount] = useState("1");
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardMessage, setRewardMessage] = useState("");
  const [items, setItems] = useState<RaffleRewardItem[]>([]);
  const [goldStr, setGoldStr] = useState("");
  const [saving, setSaving] = useState(false);

  // Form helpers para item novo
  const [newItemId, setNewItemId] = useState("");
  const [newItemCount, setNewItemCount] = useState("1");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setDescription(editing.description ?? "");
      setStartsAt(isoToLocalInput(editing.starts_at));
      setEndsAt(isoToLocalInput(editing.ends_at));
      setWinnersCount(String(editing.winners_count));
      setRewardTitle(editing.reward_title ?? "");
      setRewardMessage(editing.reward_message ?? "");
      setItems(editing.reward_payload_json.items);
      setGoldStr(
        editing.reward_payload_json.gold > 0
          ? String(editing.reward_payload_json.gold)
          : "",
      );
    } else {
      setName("");
      setDescription("");
      setStartsAt("");
      setEndsAt("");
      setWinnersCount("1");
      setRewardTitle("");
      setRewardMessage("");
      setItems([]);
      setGoldStr("");
    }
    setNewItemId("");
    setNewItemCount("1");
  }, [open, editing]);

  const addItem = () => {
    const id = parseInt(newItemId, 10);
    const count = parseInt(newItemCount, 10);
    if (!Number.isFinite(id) || id <= 0) {
      toast.error("ID do item inválido");
      return;
    }
    if (!Number.isFinite(count) || count <= 0) {
      toast.error("Quantidade inválida");
      return;
    }
    setItems((prev) => [...prev, { item_id: id, count }]);
    setNewItemId("");
    setNewItemCount("1");
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nome obrigatório");
      return;
    }
    const winners = parseInt(winnersCount, 10);
    if (!Number.isFinite(winners) || winners <= 0) {
      toast.error("Número de vencedores inválido");
      return;
    }
    const gold = goldStr ? parseInt(goldStr, 10) : 0;
    if (goldStr && (!Number.isFinite(gold) || gold < 0)) {
      toast.error("Valor de gold inválido");
      return;
    }
    const payload: RaffleRewardPayload = {
      items,
      gold: gold > 0 ? gold : 0,
    };

    setSaving(true);
    try {
      if (editing) {
        await onUpdate(editing.id, {
          name,
          description,
          starts_at: localInputToIso(startsAt),
          ends_at: localInputToIso(endsAt),
          winners_count: winners,
          reward_title: rewardTitle,
          reward_message: rewardMessage,
          reward_payload_json: payload,
        });
      } else {
        await onCreate({
          name,
          description,
          starts_at: localInputToIso(startsAt),
          ends_at: localInputToIso(endsAt),
          winners_count: winners,
          reward_title: rewardTitle,
          reward_message: rewardMessage,
          reward_payload_json: payload,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar sorteio" : "Novo sorteio"}</DialogTitle>
          <DialogDescription>
            Cadastre o prêmio e os dados básicos. Você poderá ativar o sorteio
            quando estiver pronto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dados básicos */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="raffle-name">Nome *</Label>
              <Input
                id="raffle-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Sorteio de aniversário"
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="raffle-desc">Descrição</Label>
              <Textarea
                id="raffle-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contexto, regras, link do anúncio..."
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="raffle-start">Início</Label>
              <Input
                id="raffle-start"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="raffle-end">Fim</Label>
              <Input
                id="raffle-end"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="raffle-winners">Número de vencedores *</Label>
              <Input
                id="raffle-winners"
                type="number"
                min={1}
                value={winnersCount}
                onChange={(e) => setWinnersCount(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Mensagem do prêmio */}
          <div className="rounded-xl border border-border bg-background/40 p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Mensagem do prêmio (correio)
            </p>
            <div className="grid gap-3">
              <div>
                <Label htmlFor="raffle-rtitle">Título</Label>
                <Input
                  id="raffle-rtitle"
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  placeholder="Ex.: Parabéns! Você ganhou o sorteio"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="raffle-rmsg">Mensagem</Label>
                <Textarea
                  id="raffle-rmsg"
                  value={rewardMessage}
                  onChange={(e) => setRewardMessage(e.target.value)}
                  placeholder="Texto do correio enviado aos vencedores"
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Payload de prêmio */}
          <div className="rounded-xl border border-border bg-background/40 p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Itens do prêmio
            </p>
            <div className="grid grid-cols-[1fr_120px_auto] gap-2">
              <Input
                value={newItemId}
                onChange={(e) => setNewItemId(e.target.value)}
                placeholder="ID do item"
                inputMode="numeric"
              />
              <Input
                value={newItemCount}
                onChange={(e) => setNewItemCount(e.target.value)}
                placeholder="Quantidade"
                inputMode="numeric"
              />
              <Button type="button" onClick={addItem} variant="secondary" className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            </div>

            {items.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {items.map((it, idx) => (
                  <li
                    key={`${it.item_id}-${idx}`}
                    className="flex items-center justify-between rounded-md border border-border bg-card/40 px-2 py-1.5 text-[11px]"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-foreground">
                        Item {it.item_id}
                      </span>
                      <span className="ml-2 font-mono text-primary">×{it.count}</span>
                    </div>
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-destructive hover:opacity-80"
                      title="Remover"
                      type="button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Nenhum item adicionado.
              </p>
            )}

            <div className="mt-3 border-t border-border pt-3">
              <Label htmlFor="raffle-gold" className="flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-amber-500" />
                Gold (em moedas de cobre)
              </Label>
              <Input
                id="raffle-gold"
                value={goldStr}
                onChange={(e) => setGoldStr(e.target.value)}
                placeholder="Ex.: 1000000"
                inputMode="numeric"
                className="mt-1"
              />
              {goldStr && Number(goldStr) > 0 && (
                <p className="mt-1 text-[10px] text-amber-500">
                  ≈ {formatGold(Number(goldStr))}
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RafflesPage;

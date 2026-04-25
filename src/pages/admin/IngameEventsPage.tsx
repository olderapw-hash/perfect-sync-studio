// /admin/events/ingame — Eventos Ingame
//
// Admin configura/monitora pelo painel; player participa no jogo via NPC.
// Esta tela lista, cria e edita eventos. Quando um evento é selecionado,
// abre um drawer com participantes e vencedores.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Coins,
  Copy,
  Loader2,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Square,
  Trash2,
  Trophy,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useServers } from "@/hooks/useServers";
import {
  useIngameEvents,
  type CreateIngameEventInput,
} from "@/hooks/useIngameEvents";
import { useIngameParticipations } from "@/hooks/useIngameParticipations";
import {
  ingameStatusLabel,
  ingameRewardModeLabel,
  ingameSourceLabel,
  isRewardPayloadValid,
  type IngameEvent,
  type IngameRewardMode,
  type IngameRewardPayload,
} from "@/lib/ingameEvents";
import { cn } from "@/lib/utils";

const NoActiveServer = () => (
  <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-6 text-center">
    <p className="text-sm font-semibold text-amber-500">Nenhum servidor ativo</p>
    <p className="mt-1 text-xs text-muted-foreground">
      Selecione um servidor em <Link to="/servers" className="underline">Servidores</Link> para
      gerenciar eventos ingame.
    </p>
  </div>
);

const StatusBadge = ({ s }: { s: IngameEvent["status"] }) => {
  const cfg =
    s === "active"
      ? "border-success/40 bg-success/10 text-success"
      : s === "closed"
        ? "border-muted-foreground/30 bg-muted/30 text-muted-foreground"
        : "border-amber-500/40 bg-amber-500/10 text-amber-500";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-tight",
        cfg,
      )}
    >
      {ingameStatusLabel(s)}
    </span>
  );
};

/* ========================================================================== */
/* Página                                                                      */
/* ========================================================================== */

const IngameEventsPage = () => {
  const navigate = useNavigate();
  const { active } = useServers();
  const {
    events,
    loading,
    canManage,
    refetch,
    createEvent,
    updateEvent,
    setStatus,
    deleteEvent,
  } = useIngameEvents();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<IngameEvent | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<IngameEvent | null>(null);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedId) ?? null,
    [events, selectedId],
  );

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (e: IngameEvent) => {
    setEditing(e);
    setEditorOpen(true);
  };

  if (!active) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <Header onBack={() => navigate("/admin/events")} />
          <NoActiveServer />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <Header onBack={() => navigate("/admin/events")} />

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              Eventos onde o player participa <strong className="text-foreground">dentro do jogo</strong>{" "}
              (NPC) e o admin gerencia/premia pelo painel.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={loading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Atualizar
            </Button>
            <Button size="sm" onClick={openCreate} disabled={!canManage}>
              <Plus className="h-3.5 w-3.5" />
              Novo evento
            </Button>
          </div>
        </div>

        {!canManage && (
          <p className="rounded-md border border-muted-foreground/20 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Você está em modo somente-leitura. Para criar/editar eventos é necessário a
            permissão <strong>manage_kits</strong>.
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <EmptyState onCreate={canManage ? openCreate : undefined} />
        ) : (
          <ul className="space-y-2">
            {events.map((e) => (
              <EventRow
                key={e.id}
                event={e}
                onSelect={() => setSelectedId(e.id)}
                onEdit={() => openEdit(e)}
                onActivate={() => void setStatus(e.id, "active").catch(notifyErr)}
                onClose={() => void setStatus(e.id, "closed").catch(notifyErr)}
                onReopen={() => void setStatus(e.id, "draft").catch(notifyErr)}
                onDelete={() => setConfirmDelete(e)}
                canManage={canManage}
              />
            ))}
          </ul>
        )}
      </div>

      {editorOpen && (
        <EventEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          editing={editing}
          onSave={async (input) => {
            try {
              if (editing) {
                await updateEvent(editing.id, input);
                toast({ title: "Evento atualizado" });
              } else {
                await createEvent(input);
                toast({ title: "Evento criado" });
              }
              setEditorOpen(false);
            } catch (e) {
              notifyErr(e);
            }
          }}
        />
      )}

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso remove o evento <strong>{confirmDelete?.name}</strong> e todas as
              participações/vencedores associados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmDelete) return;
                try {
                  await deleteEvent(confirmDelete.id);
                  toast({ title: "Evento excluído" });
                  setConfirmDelete(null);
                } catch (e) {
                  notifyErr(e);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedEvent && (
        <EventDetailDialog
          event={selectedEvent}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
};

const Header = ({ onBack }: { onBack: () => void }) => (
  <header className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5">
    <div className="flex items-start gap-3">
      <CalendarDays className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          Eventos · Ingame
        </p>
        <h1 className="mt-0.5 text-xl font-extrabold text-foreground">
          Eventos com participação ingame
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure aqui. Os players se inscrevem pelo NPC do servidor; o painel acompanha
          participantes, sorteia vencedores e dispara a premiação por correio.
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar
      </Button>
    </div>
  </header>
);

const EmptyState = ({ onCreate }: { onCreate?: () => void }) => (
  <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
    <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/50" />
    <p className="mt-3 text-sm font-semibold text-foreground">
      Nenhum evento configurado ainda
    </p>
    <p className="mt-1 text-xs text-muted-foreground">
      Crie um evento, ative-o e oriente seus players a falarem com o NPC ingame.
    </p>
    {onCreate && (
      <Button size="sm" className="mt-4" onClick={onCreate}>
        <Plus className="h-3.5 w-3.5" />
        Criar primeiro evento
      </Button>
    )}
  </div>
);

const EventRow = ({
  event,
  onSelect,
  onEdit,
  onActivate,
  onClose,
  onReopen,
  onDelete,
  canManage,
}: {
  event: IngameEvent;
  onSelect: () => void;
  onEdit: () => void;
  onActivate: () => void;
  onClose: () => void;
  onReopen: () => void;
  onDelete: () => void;
  canManage: boolean;
}) => (
  <li className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur-md transition-smooth hover:border-primary/40">
    <div className="flex items-start gap-3">
      <button
        onClick={onSelect}
        className="flex-1 min-w-0 text-left"
        title="Ver detalhes / participantes"
      >
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-bold text-foreground">{event.name}</h3>
          <StatusBadge s={event.status} />
          <Badge variant="outline" className="text-[10px]">
            {ingameRewardModeLabel(event.reward_mode)}
          </Badge>
        </div>
        {event.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {event.description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            {event.reward_mode === "raffle_winners"
              ? `${event.winners_count} vencedor(es)`
              : "Premia todos"}
          </span>
          {event.reward_payload_json.gold > 0 && (
            <span className="inline-flex items-center gap-1">
              <Coins className="h-3 w-3" />
              {event.reward_payload_json.gold.toLocaleString()} gold
            </span>
          )}
          {event.reward_payload_json.items.length > 0 && (
            <span>{event.reward_payload_json.items.length} item(ns) no prêmio</span>
          )}
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        {canManage && event.status === "draft" && (
          <Button
            size="sm"
            variant="outline"
            onClick={onActivate}
            title="Ativar"
          >
            <Play className="h-3.5 w-3.5" />
            Ativar
          </Button>
        )}
        {canManage && event.status === "active" && (
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            title="Encerrar"
          >
            <Square className="h-3.5 w-3.5" />
            Encerrar
          </Button>
        )}
        {canManage && event.status === "closed" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onReopen}
            title="Reabrir como rascunho"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reabrir
          </Button>
        )}
        {canManage && (
          <>
            <Button size="icon" variant="ghost" onClick={onEdit} title="Editar">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              title="Excluir"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  </li>
);

/* ========================================================================== */
/* Editor                                                                      */
/* ========================================================================== */

const EventEditorDialog = ({
  open,
  onOpenChange,
  editing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: IngameEvent | null;
  onSave: (input: CreateIngameEventInput) => Promise<void>;
}) => {
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [rewardMode, setRewardMode] = useState<IngameRewardMode>(
    editing?.reward_mode ?? "all_participants",
  );
  const [winnersCount, setWinnersCount] = useState(editing?.winners_count ?? 1);
  const [rewardTitle, setRewardTitle] = useState(editing?.reward_title ?? "");
  const [rewardMessage, setRewardMessage] = useState(editing?.reward_message ?? "");
  const [gold, setGold] = useState<number>(editing?.reward_payload_json.gold ?? 0);
  const [itemsJson, setItemsJson] = useState<string>(
    JSON.stringify(editing?.reward_payload_json.items ?? [], null, 2),
  );
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    let items: IngameRewardPayload["items"] = [];
    try {
      const parsed = JSON.parse(itemsJson || "[]");
      if (!Array.isArray(parsed)) throw new Error("Lista inválida");
      items = parsed;
    } catch {
      toast({ title: "JSON de itens inválido", variant: "destructive" });
      return;
    }
    const reward_payload_json: IngameRewardPayload = {
      items,
      gold: Math.max(0, Math.floor(gold)),
    };
    if (!isRewardPayloadValid(reward_payload_json)) {
      toast({
        title: "Defina um prêmio",
        description: "Adicione pelo menos um item ou um valor de gold > 0.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name,
        description: description || null,
        reward_mode: rewardMode,
        winners_count: rewardMode === "raffle_winners" ? winnersCount : 1,
        reward_title: rewardTitle || null,
        reward_message: rewardMessage || null,
        reward_payload_json,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar evento" : "Novo evento ingame"}</DialogTitle>
          <DialogDescription>
            Configure o evento. Os players se inscrevem pelo NPC do servidor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Modo de premiação</Label>
              <Select
                value={rewardMode}
                onValueChange={(v) => setRewardMode(v as IngameRewardMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_participants">
                    Premia todos os participantes
                  </SelectItem>
                  <SelectItem value="raffle_winners">Sortear vencedores</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {rewardMode === "raffle_winners" && (
              <div>
                <Label>Nº de vencedores</Label>
                <Input
                  type="number"
                  min={1}
                  value={winnersCount}
                  onChange={(e) => setWinnersCount(Number(e.target.value) || 1)}
                />
              </div>
            )}
          </div>

          <div className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Prêmio (correio)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Título do correio</Label>
                <Input
                  value={rewardTitle ?? ""}
                  onChange={(e) => setRewardTitle(e.target.value)}
                />
              </div>
              <div>
                <Label>Gold (cobre)</Label>
                <Input
                  type="number"
                  min={0}
                  value={gold}
                  onChange={(e) => setGold(Number(e.target.value) || 0)}
                />
              </div>
            </div>
            <div>
              <Label>Mensagem do correio</Label>
              <Textarea
                value={rewardMessage ?? ""}
                onChange={(e) => setRewardMessage(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label>Itens (JSON)</Label>
              <Textarea
                value={itemsJson}
                onChange={(e) => setItemsJson(e.target.value)}
                rows={5}
                className="font-mono text-xs"
                placeholder='[{ "item_id": 11530, "count": 1 }]'
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Lista de objetos compatíveis com sendMailItem.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {editing ? "Salvar" : "Criar evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ========================================================================== */
/* Detalhe (participantes + vencedores)                                        */
/* ========================================================================== */

const EventDetailDialog = ({
  event,
  onClose,
}: {
  event: IngameEvent;
  onClose: () => void;
}) => {
  const {
    participations,
    winners,
    loading,
    canManage,
    addManual,
    removeParticipant,
    drawWinners,
  } = useIngameParticipations(event.id);

  const [roleidStr, setRoleidStr] = useState("");
  const [roleName, setRoleName] = useState("");
  const [confirmDraw, setConfirmDraw] = useState<"first" | "redraw" | null>(null);
  const [drawing, setDrawing] = useState(false);

  const winnerSet = useMemo(() => new Set(winners.map((w) => w.roleid)), [winners]);

  const onAdd = async () => {
    const id = Number(roleidStr);
    if (!Number.isFinite(id) || id <= 0) {
      toast({ title: "Roleid inválido", variant: "destructive" });
      return;
    }
    try {
      await addManual(id, roleName);
      setRoleidStr("");
      setRoleName("");
      toast({ title: "Participante adicionado" });
    } catch (e) {
      notifyErr(e);
    }
  };

  const runDraw = async (redraw: boolean) => {
    setDrawing(true);
    try {
      await drawWinners(event.winners_count, redraw);
      toast({ title: redraw ? "Sorteio refeito" : "Vencedores sorteados" });
      setConfirmDraw(null);
    } catch (e) {
      notifyErr(e);
    } finally {
      setDrawing(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {event.name}
            <StatusBadge s={event.status} />
          </DialogTitle>
          <DialogDescription>
            Modo: <strong>{ingameRewardModeLabel(event.reward_mode)}</strong>
            {event.reward_mode === "raffle_winners" &&
              ` · ${event.winners_count} vencedor(es)`}
            · Participantes registrados: <strong>{participations.length}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Adicionar participante manual */}
        {canManage && event.status !== "closed" && (
          <div className="rounded-md border border-border bg-muted/20 p-3">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Adicionar participação manual
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-32">
                <Label>Roleid</Label>
                <Input
                  type="number"
                  value={roleidStr}
                  onChange={(e) => setRoleidStr(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[160px]">
                <Label>Nome (opcional)</Label>
                <Input
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                />
              </div>
              <Button size="sm" onClick={onAdd}>
                <UserPlus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Em produção, players se inscrevem via NPC ingame. Esta opção é só para
              casos pontuais / teste.
            </p>
          </div>
        )}

        {/* Sortear */}
        {event.reward_mode === "raffle_winners" && (
          <div className="rounded-md border border-border bg-card/60 p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Sorteio</p>
              <p className="text-xs text-muted-foreground">
                {winners.length === 0
                  ? "Nenhum vencedor sorteado ainda."
                  : `${winners.length} vencedor(es) sorteado(s).`}
              </p>
            </div>
            {canManage && (
              <Button
                size="sm"
                onClick={() =>
                  setConfirmDraw(winners.length > 0 ? "redraw" : "first")
                }
                disabled={participations.length === 0 || drawing}
              >
                <Trophy className="h-3.5 w-3.5" />
                {winners.length > 0 ? "Sortear novamente" : "Sortear agora"}
              </Button>
            )}
          </div>
        )}

        {/* Lista vencedores */}
        {winners.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-bold uppercase text-success">Vencedores</p>
            <ul className="space-y-1">
              {winners.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center gap-2 rounded-md border border-success/30 bg-success/5 px-3 py-1.5 text-xs"
                >
                  <Trophy className="h-3 w-3 text-success" />
                  <span className="font-mono">{w.roleid}</span>
                  {w.role_name && <span className="text-foreground">{w.role_name}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Lista participantes */}
        <div>
          <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-foreground">
            <Users className="h-3 w-3" />
            Participantes ({participations.length})
          </p>
          {loading ? (
            <div className="py-6 text-center text-muted-foreground">
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            </div>
          ) : participations.length === 0 ? (
            <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
              Nenhuma participação ainda. Quando o evento estiver{" "}
              <strong>ativo</strong>, players podem se inscrever pelo NPC.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto space-y-1">
              {participations.map((p) => (
                <li
                  key={p.id}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs",
                    winnerSet.has(p.roleid)
                      ? "border-success/40 bg-success/5"
                      : "border-border bg-card/40",
                  )}
                >
                  <span className="font-mono text-muted-foreground">{p.roleid}</span>
                  {p.role_name && <span className="text-foreground">{p.role_name}</span>}
                  <Badge variant="outline" className="ml-auto text-[9px]">
                    {ingameSourceLabel(p.source)}
                  </Badge>
                  {canManage && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        void removeParticipant(p.id).catch(notifyErr)
                      }
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      title="Remover"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Endpoint info — para configurar NPC */}
        <NpcContractHint eventId={event.id} tenantId={event.tenant_id} />

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog
        open={!!confirmDraw}
        onOpenChange={(o) => !o && setConfirmDraw(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDraw === "redraw"
                ? "Sortear novamente?"
                : "Sortear vencedores?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDraw === "redraw" ? (
                <>
                  Os vencedores anteriores serão <strong>removidos</strong> e um novo
                  sorteio será realizado entre os participantes atuais.
                </>
              ) : (
                <>
                  Serão sorteados <strong>{event.winners_count}</strong> vencedor(es) entre{" "}
                  {participations.length} participante(s).
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void runDraw(confirmDraw === "redraw")}>
              {drawing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

const NpcContractHint = ({
  eventId,
  tenantId,
}: {
  eventId: string;
  tenantId: string;
}) => {
  const sample = JSON.stringify(
    {
      event_id: eventId,
      tenant_id: tenantId,
      roleid: 12345,
      role_name: "PlayerName",
      userid: 67890,
    },
    null,
    2,
  );
  const copy = () => {
    navigator.clipboard.writeText(sample);
    toast({ title: "Payload copiado" });
  };
  return (
    <details className="rounded-md border border-border bg-muted/10 p-3">
      <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
        Como configurar o NPC ingame
      </summary>
      <div className="mt-2 space-y-2 text-xs text-muted-foreground">
        <p>
          O NPC chama a VPS na action{" "}
          <code className="font-mono text-foreground">registerIngameParticipation</code>{" "}
          (api_cls.php) com o payload abaixo. A VPS valida o secret e repassa pro
          Supabase.
        </p>
        <pre className="overflow-x-auto rounded bg-background p-2 text-[10px] text-foreground">
          {sample}
        </pre>
        <Button size="sm" variant="ghost" onClick={copy}>
          <Copy className="h-3 w-3" />
          Copiar payload de exemplo
        </Button>
        <p className="text-[10px]">
          Veja o contrato completo em <code>docs/api-contract.md</code>.
        </p>
      </div>
    </details>
  );
};

function notifyErr(e: unknown) {
  const msg = e instanceof Error ? e.message : "Erro desconhecido";
  toast({ title: "Erro", description: msg, variant: "destructive" });
}

export default IngameEventsPage;

// silenciar import não usado em alguns builds
void Check;

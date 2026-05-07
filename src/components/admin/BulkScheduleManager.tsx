// GM Commander v2 — Bulk Schedule Manager
// Integrado com endpoints reais da VPS:
//   scheduleBulkCommand, getBulkSchedules, getBulkSchedule,
//   updateBulkSchedule, deleteBulkSchedule
// A VPS é a fonte da verdade. Nenhum card local sem confirmação da API.

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Megaphone,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { cn } from "@/lib/utils";
import {
  pwApi,
  EndpointMissingError,
  type VpsBulkScheduleSummary,
  type BulkCommandKey,
} from "@/lib/pwApiActions";

/* ─── Constants ─── */

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
/** VPS uses 1-7 (Mon-Sun). Map for display: 1=Segunda...7=Domingo */
const VPS_DAY_LABELS: Record<number, string> = {
  1: "Segunda", 2: "Terça", 3: "Quarta", 4: "Quinta",
  5: "Sexta", 6: "Sábado", 7: "Domingo",
};

const COMMAND_LABELS: Record<string, string> = {
  sendMailItem: "Enviar Item",
  sendMailGold: "Enviar Gold",
  grantMallCash: "Creditar Cash",
  sendSystemMessage: "Broadcast",
};

/** Commands that don't need audience selection */
const NO_AUDIENCE_COMMANDS = new Set(["sendSystemMessage"]);

const PW_CLASSES_SCHEDULE = [
  { id: 0, name: "Guerreiro" },
  { id: 1, name: "Mágico" },
  { id: 2, name: "Arqueiro" },
  { id: 3, name: "Sacerdote" },
  { id: 4, name: "Lupina" },
  { id: 5, name: "Felina" },
  { id: 6, name: "Assassino" },
  { id: 7, name: "Aquariano" },
  { id: 8, name: "Buscador" },
  { id: 9, name: "Místico" },
  { id: 10, name: "Lâmina Crepuscular" },
  { id: 11, name: "Conjuradora" },
];

/* ─── Helpers ─── */

function isEveryDay(s: VpsBulkScheduleSummary): boolean {
  return s.weekdays.length === 7;
}

function weekdaysLabel(weekdays: number[]): string {
  if (weekdays.length === 7) return "Todos os dias";
  return weekdays.map(d => VPS_DAY_LABELS[d] || `Dia ${d}`).join(", ");
}

function formatRelative(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffH / 24);
  if (diffD > 0) return `em ${diffD}d ${diffH % 24}h`;
  if (diffH > 0) return `em ${diffH}h`;
  const diffM = Math.floor(diffMs / 60000);
  return diffM > 0 ? `em ${diffM}min` : "agora";
}

/* ─── Main Component ─── */

export function BulkScheduleManager() {
  const [schedules, setSchedules] = useState<VpsBulkScheduleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editSchedule, setEditSchedule] = useState<VpsBulkScheduleSummary | null>(null);
  const [endpointMissing, setEndpointMissing] = useState(false);

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await pwApi.getBulkSchedules({ limit: 100 });
      setSchedules(resp.schedules || []);
      setEndpointMissing(false);
    } catch (err) {
      if (err instanceof EndpointMissingError) {
        setEndpointMissing(true);
      }
      setSchedules([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSchedules();
  }, [loadSchedules]);

  const toggleActive = useCallback(async (s: VpsBulkScheduleSummary) => {
    try {
      await pwApi.updateBulkSchedule(s.id, {
        command_key: s.command_key,
        weekdays: s.weekdays,
        time_of_day: s.time_of_day,
        enabled: !s.enabled,
      });
      await loadSchedules();
    } catch (err) {
      console.error("toggleActive error:", err);
    }
  }, [loadSchedules]);

  const deleteSchedule = useCallback(async (id: string) => {
    try {
      await pwApi.deleteBulkSchedule(id);
      await loadSchedules();
    } catch (err) {
      console.error("deleteSchedule error:", err);
    }
  }, [loadSchedules]);

  if (endpointMissing) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-card/20 py-8 text-center">
        <Calendar className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-xs text-muted-foreground">
          Endpoint <code>getBulkSchedules</code> não disponível nesta VPS.
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          Atualize o instalador para habilitar agendamentos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Agendamentos Semanais
          </h4>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Recompensas automáticas executadas pelo scheduler da VPS. Horários em {DEFAULT_TIMEZONE}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={loadSchedules} disabled={loading} className="border-border/60 bg-card/60">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Novo
          </Button>
        </div>
      </div>

      {loading && schedules.length === 0 ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/20 py-10 text-center">
          <Calendar className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground">Nenhum agendamento criado</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Criar primeiro agendamento
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {schedules.map(s => {
            const everyDay = isEveryDay(s);
            const tz = s.timezone || DEFAULT_TIMEZONE;

            return (
              <Card key={s.id} className={cn("border-border/40 bg-card/40 backdrop-blur-sm transition-all", !s.enabled && "opacity-60")}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-foreground">{s.name}</span>
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                          {COMMAND_LABELS[s.command_key] || s.command_key}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px]",
                          everyDay
                            ? "border-amber-500/30 text-amber-400"
                            : "border-blue-500/30 text-blue-400"
                        )}>
                          {everyDay ? "Diário" : "Semanal"}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px]", s.enabled ? "border-emerald-500/30 text-emerald-400" : "border-muted-foreground/30 text-muted-foreground")}>
                          {s.enabled ? "Ativo" : "Pausado"}
                        </Badge>
                      </div>

                      <div className="mt-1.5 flex flex-col gap-1 text-[10px] text-muted-foreground">
                        {/* Main schedule line — local timezone */}
                        <div className="flex items-center gap-1 text-foreground/80 font-medium">
                          <Clock className="h-3 w-3 text-primary/60" />
                          <span>
                            {everyDay
                              ? `Todos os dias às ${s.time_of_day}`
                              : `${weekdaysLabel(s.weekdays)} às ${s.time_of_day}`}
                          </span>
                          <span className="text-muted-foreground font-normal">({tz})</span>
                        </div>

                        {/* Next execution — from backend */}
                        {s.enabled && s.next_run_at && (
                          <div className="flex items-center gap-1 ml-4">
                            <span className="text-primary/80">
                              Próximo: {new Date(s.next_run_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: tz })} ({formatRelative(new Date(s.next_run_at))})
                            </span>
                          </div>
                        )}

                        {/* Last run info */}
                        {s.last_run_at ? (
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1">
                              {s.last_result === "ok" || s.last_result === "success" ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              ) : s.last_error ? (
                                <XCircle className="h-3 w-3 text-red-400" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              Último disparo: {new Date(s.last_run_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: tz })}
                            </span>
                            {s.last_job_id && (
                              <span className="font-mono text-muted-foreground/60" title={`Job ID: ${s.last_job_id}`}>
                                Job: {s.last_job_id.length > 16 ? s.last_job_id.slice(0, 16) + "…" : s.last_job_id}
                              </span>
                            )}
                            {s.last_error && (
                              <span className="text-red-400 truncate max-w-[200px]" title={s.last_error}>
                                {s.last_error}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="ml-4 text-muted-foreground/50 italic">Ainda não executado</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => toggleActive(s)}
                        title={s.enabled ? "Pausar" : "Ativar"}
                      >
                        {s.enabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteSchedule(s.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {(showCreate || editSchedule) && (
        <ScheduleFormDialog
          schedule={editSchedule}
          existingSchedules={schedules}
          onClose={() => { setShowCreate(false); setEditSchedule(null); }}
          onSaved={async () => { await loadSchedules(); setShowCreate(false); setEditSchedule(null); }}
        />
      )}
    </div>
  );
}

/* ─── Form Dialog ─── */

function ScheduleFormDialog({
  schedule,
  existingSchedules,
  onClose,
  onSaved,
}: {
  schedule: VpsBulkScheduleSummary | null;
  existingSchedules: VpsBulkScheduleSummary[];
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const isEdit = !!schedule;
  const [name, setName] = useState(schedule?.name || "");
  const [commandKey, setCommandKey] = useState<string>(schedule?.command_key || "sendMailItem");
  const [everyDay, setEveryDay] = useState(schedule ? isEveryDay(schedule) : false);
  // VPS uses 1-7 (Mon=1..Sun=7)
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(
    schedule?.weekdays?.length ? schedule.weekdays : [1]
  );
  const [timeOfDay, setTimeOfDay] = useState(schedule?.time_of_day || "12:00");
  const [enabled, setEnabled] = useState(schedule?.enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection fields
  const [selMode, setSelMode] = useState("all_online");
  const [namesInput, setNamesInput] = useState("");
  const [guildId, setGuildId] = useState("");
  const [classIds, setClassIds] = useState<number[]>([]);
  const [levelMin, setLevelMin] = useState("");
  const [levelMax, setLevelMax] = useState("");

  // Command payload fields
  const [itemId, setItemId] = useState("");
  const [itemCount, setItemCount] = useState("1");
  const [goldAmount, setGoldAmount] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");

  const needsAudience = !NO_AUDIENCE_COMMANDS.has(commandKey);

  // Load from existing schedule
  useEffect(() => {
    if (!schedule) return;
    const sel = schedule.selection || {};
    if (sel.all_online) setSelMode("all_online");
    else if (sel.names) { setSelMode("names"); setNamesInput(Array.isArray(sel.names) ? (sel.names as string[]).join("\n") : ""); }
    else if (sel.guild_id) { setSelMode("guild"); setGuildId(String(sel.guild_id)); }
    else if (sel.class_ids) { setSelMode("class"); setClassIds(sel.class_ids as number[]); }
    else setSelMode("all_online");

    if (sel.level_min) setLevelMin(String(sel.level_min));
    if (sel.level_max) setLevelMax(String(sel.level_max));

    // Load command payload from detail if needed — for now use selection fields
    // The VPS getBulkSchedule returns full command_payload in the schedule object
  }, [schedule]);

  const handleSave = async () => {
    if (!name.trim()) { setError("Nome obrigatório"); return; }

    setSaving(true);
    setError(null);

    // Build weekdays
    const weekdays = everyDay ? [1, 2, 3, 4, 5, 6, 7] : selectedWeekdays;
    if (weekdays.length === 0) {
      setError("Selecione pelo menos um dia da semana");
      setSaving(false);
      return;
    }

    // Build the payload — VPS expects flat fields + selection
    const payload: Record<string, unknown> = {
      name: name.trim(),
      command_key: commandKey,
      weekdays,
      time_of_day: timeOfDay,
      timezone: DEFAULT_TIMEZONE,
      enabled,
    };

    // Selection
    const selection: Record<string, unknown> = {};
    if (needsAudience) {
      switch (selMode) {
        case "all_online": selection.all_online = true; break;
        case "names": selection.names = namesInput.split(/[,\n]+/).map(s => s.trim()).filter(Boolean); break;
        case "guild": selection.guild_id = parseInt(guildId) || 0; break;
        case "class": selection.class_ids = classIds; break;
      }
      const lMin = parseInt(levelMin);
      const lMax = parseInt(levelMax);
      if (!isNaN(lMin) && lMin > 0) selection.level_min = lMin;
      if (!isNaN(lMax) && lMax > 0) selection.level_max = lMax;
    } else {
      // sendSystemMessage — VPS still expects some selection criteria
      selection.all_online = true;
    }
    payload.selection = selection;

    // Command-specific fields (flattened into payload, VPS extracts them)
    switch (commandKey) {
      case "sendMailItem":
        payload.item_id = parseInt(itemId) || 0;
        payload.count = parseInt(itemCount) || 1;
        if (subject) payload.subject = subject;
        if (body) payload.body = body;
        break;
      case "sendMailGold":
        payload.money = parseInt(goldAmount) || 0;
        if (subject) payload.subject = subject;
        if (body) payload.body = body;
        break;
      case "grantMallCash":
        payload.amount = parseInt(cashAmount) || 0;
        payload.reason = subject || "Agendamento automático";
        payload.confirm = "GRANT_MALL_CASH";
        break;
      case "sendSystemMessage":
        payload.message = message || "";
        break;
    }

    try {
      if (isEdit && schedule) {
        await pwApi.updateBulkSchedule(schedule.id, payload as any);
      } else {
        await pwApi.scheduleBulkCommand(payload as any);
      }
      await onSaved();
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar agendamento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg border-border/40 bg-card/95 backdrop-blur-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-extrabold">
            {isEdit ? "Editar Agendamento" : "Novo Agendamento"}
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            Horários em {DEFAULT_TIMEZONE}. A VPS é a fonte da verdade do agendamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[10px] text-red-400">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-[11px]">Nome do Agendamento</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Recompensa semanal TOP guild" className="h-9 text-xs" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="every-day"
                checked={everyDay}
                onCheckedChange={(v) => setEveryDay(!!v)}
              />
              <Label htmlFor="every-day" className="text-[11px] cursor-pointer">Todos os dias (executar diariamente)</Label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {!everyDay && (
                <div className="space-y-1">
                  <Label className="text-[11px]">Dias da Semana</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      [1, "Seg"], [2, "Ter"], [3, "Qua"], [4, "Qui"],
                      [5, "Sex"], [6, "Sáb"], [7, "Dom"],
                    ] as [number, string][]).map(([d, label]) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedWeekdays(prev =>
                          prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
                        )}
                        className={cn(
                          "rounded-lg border px-2 py-1 text-[10px] font-medium transition-all",
                          selectedWeekdays.includes(d)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/40 text-muted-foreground hover:border-primary/30",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className={cn("space-y-1", everyDay && "col-span-2")}>
                <Label className="text-[11px]">Horário ({DEFAULT_TIMEZONE})</Label>
                <Input
                  type="time"
                  value={timeOfDay}
                  onChange={e => setTimeOfDay(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px]">Comando</Label>
            <Select value={commandKey} onValueChange={setCommandKey}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sendMailItem">Enviar Item</SelectItem>
                <SelectItem value="sendMailGold">Enviar Gold</SelectItem>
                <SelectItem value="grantMallCash">Creditar Cash</SelectItem>
                <SelectItem value="sendSystemMessage">Broadcast (Mensagem Global)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audience — hidden for sendSystemMessage */}
          {needsAudience && (
            <div className="space-y-2">
              <Label className="text-[11px] text-muted-foreground">Seleção de Audiência</Label>
              <Select value={selMode} onValueChange={setSelMode}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_online">Todos Online</SelectItem>
                  <SelectItem value="names">Por Nomes</SelectItem>
                  <SelectItem value="guild">Por Guild ID</SelectItem>
                  <SelectItem value="class">Por Classe</SelectItem>
                </SelectContent>
              </Select>

              {selMode === "names" && (
                <Textarea value={namesInput} onChange={e => setNamesInput(e.target.value)} placeholder="Um nome por linha" className="h-16 text-xs" />
              )}
              {selMode === "guild" && (
                <Input value={guildId} onChange={e => setGuildId(e.target.value)} placeholder="Guild ID" className="h-9 text-xs" />
              )}
              {selMode === "class" && (
                <div className="flex flex-wrap gap-1.5">
                  {PW_CLASSES_SCHEDULE.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setClassIds(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-all",
                        classIds.includes(c.id)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/40 text-muted-foreground hover:border-primary/30",
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Level Mín</Label>
                  <Input value={levelMin} onChange={e => setLevelMin(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Level Máx</Label>
                  <Input value={levelMax} onChange={e => setLevelMax(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
            </div>
          )}

          {!needsAudience && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <Megaphone className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="text-[10px] text-amber-400/80">
                Broadcast é enviado globalmente — não requer seleção de audiência.
              </span>
            </div>
          )}

          {/* Command payload */}
          {commandKey === "sendMailItem" && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Item ID</Label>
                  <Input value={itemId} onChange={e => setItemId(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Quantidade</Label>
                  <Input value={itemCount} onChange={e => setItemCount(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Assunto" className="h-8 text-xs" />
              <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Mensagem" className="h-12 text-xs" />
            </div>
          )}

          {commandKey === "sendMailGold" && (
            <div className="space-y-2">
              <Input value={goldAmount} onChange={e => setGoldAmount(e.target.value)} placeholder="Gold" className="h-8 text-xs" />
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Assunto" className="h-8 text-xs" />
            </div>
          )}

          {commandKey === "grantMallCash" && (
            <div className="space-y-2">
              <Input value={cashAmount} onChange={e => setCashAmount(e.target.value)} placeholder="Cash/Gold (Mall)" className="h-8 text-xs" />
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Motivo" className="h-8 text-xs" />
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="text-[10px] text-amber-400/80">
                  Confirmação <code className="font-mono">GRANT_MALL_CASH</code> será enviada automaticamente.
                </span>
              </div>
            </div>
          )}

          {commandKey === "sendSystemMessage" && (
            <div className="space-y-2">
              <Label className="text-[10px]">Mensagem do Broadcast</Label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Mensagem que será enviada no chat global" className="h-16 text-xs" />
            </div>
          )}

          <div className="flex items-center gap-3">
            <Switch checked={enabled} onCheckedChange={setEnabled} id="sched-active" />
            <Label htmlFor="sched-active" className="text-xs">Ativo</Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {isEdit ? "Salvar" : "Criar Agendamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// GM Commander v2 — Bulk Schedule Manager
// CRUD de agendamentos semanais para recompensas em massa.
// Persiste em gm_bulk_schedules (Supabase), executado por edge function
// run-bulk-schedules via cron que chama queueBulkCommand na VPS.

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { cn } from "@/lib/utils";
import type { BulkCommandKey } from "@/lib/pwApiActions";

/* ─── Types ─── */

interface BulkSchedule {
  id: string;
  tenant_id: string;
  name: string;
  command_key: string;
  selection: Record<string, unknown>;
  command_payload: Record<string, unknown>;
  day_of_week: number;
  time_utc: string;
  timezone: string;
  is_active: boolean;
  last_run_at: string | null;
  last_run_status: string | null;
  last_run_job_id: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  every_day?: boolean;
}

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const COMMAND_LABELS: Record<string, string> = {
  sendMailItem: "Enviar Item",
  sendMailGold: "Enviar Gold",
  grantMallCash: "Creditar Cash",
  sendSystemMessage: "Broadcast",
};

/** Commands that don't need audience selection */
const NO_AUDIENCE_COMMANDS = new Set(["sendSystemMessage"]);

/**
 * Calculate next fire date for a schedule.
 * `timeLocal` is in the schedule's timezone (HH:MM).
 * We compute relative to the schedule timezone.
 */
function getNextFire(dayOfWeek: number, timeLocal: string, tz: string, everyDay?: boolean): { date: Date; pushed: boolean } {
  const [hh, mm] = timeLocal.split(":").map(Number);

  // Build a "now" string in the target timezone to compare
  const now = new Date();
  const nowInTz = new Date(now.toLocaleString("en-US", { timeZone: tz }));

  // Build today's fire time in the target timezone
  const todayFire = new Date(nowInTz);
  todayFire.setHours(hh || 0, mm || 0, 0, 0);

  if (everyDay) {
    if (todayFire > nowInTz) {
      return { date: todayFire, pushed: false };
    }
    todayFire.setDate(todayFire.getDate() + 1);
    return { date: todayFire, pushed: true };
  }

  // Weekly
  const currentDay = nowInTz.getDay();
  let daysAhead = dayOfWeek - currentDay;
  const sameDay = daysAhead === 0;
  if (daysAhead < 0 || (sameDay && todayFire <= nowInTz)) daysAhead += 7;
  const pushed = sameDay && todayFire <= nowInTz;
  const next = new Date(todayFire);
  next.setDate(nowInTz.getDate() + daysAhead);
  next.setHours(hh || 0, mm || 0, 0, 0);
  return { date: next, pushed };
}

/** Format a date as dd/MM HH:mm in a given timezone label */
function formatInTz(date: Date, tz: string): string {
  try {
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: tz }) +
      " " +
      date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: tz });
  } catch {
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) +
      " " +
      date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
}

/** Convert a local time to UTC display string */
function localTimeToUtcDisplay(timeLocal: string, tz: string): string {
  try {
    // Create a date with the local time, then format in UTC
    const now = new Date();
    const ref = new Date(now.toLocaleString("en-US", { timeZone: tz }));
    const [hh, mm] = timeLocal.split(":").map(Number);
    ref.setHours(hh || 0, mm || 0, 0, 0);
    // Offset: real UTC = local + offset
    const offsetMs = ref.getTime() - now.getTime();
    const utcDate = new Date(now.getTime() + (ref.getTime() - new Date(now.toLocaleString("en-US", { timeZone: tz })).getTime()));
    // Simpler: just create a proper date and format in UTC
    const fakeDate = new Date();
    fakeDate.setHours(hh || 0, mm || 0, 0, 0);
    // Get tz offset difference
    const localStr = new Date().toLocaleString("en-US", { timeZone: tz });
    const localDate = new Date(localStr);
    const utcStr = new Date().toLocaleString("en-US", { timeZone: "UTC" });
    const utcDate2 = new Date(utcStr);
    const diffMs = utcDate2.getTime() - localDate.getTime();
    const resultH = ((hh || 0) + Math.round(diffMs / 3600000) + 24) % 24;
    return `${String(resultH).padStart(2, "0")}:${String(mm || 0).padStart(2, "0")}`;
  } catch {
    return timeLocal;
  }
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

/** Detect if schedule has every_day from selection or day_of_week sentinel */
function isEveryDay(s: BulkSchedule): boolean {
  if (s.every_day) return true;
  if (s.selection?.every_day) return true;
  return false;
}

/** Short timezone label */
function tzShort(tz: string): string {
  if (tz === "America/Sao_Paulo") return "BRT";
  return tz;
}

/* ─── Main Component ─── */

export function BulkScheduleManager() {
  const { user } = useAuth();
  const { active } = useServers();
  const [schedules, setSchedules] = useState<BulkSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editSchedule, setEditSchedule] = useState<BulkSchedule | null>(null);

  const tenantId = active?.id;

  const loadSchedules = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data } = await supabase
      .from("gm_bulk_schedules")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    setSchedules((data as unknown as BulkSchedule[]) || []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void loadSchedules();
  }, [loadSchedules]);

  const toggleActive = useCallback(async (id: string, active: boolean) => {
    await supabase
      .from("gm_bulk_schedules")
      .update({ is_active: active })
      .eq("id", id);
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, is_active: active } : s));
  }, []);

  const deleteSchedule = useCallback(async (id: string) => {
    await supabase.from("gm_bulk_schedules").delete().eq("id", id);
    setSchedules(prev => prev.filter(s => s.id !== id));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Agendamentos Semanais
          </h4>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Recompensas automáticas executadas pelo scheduler. Horários em {DEFAULT_TIMEZONE}.
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
            const timeLocal = s.time_utc; // stored as local time despite column name
            const { date: nextFireDate, pushed } = getNextFire(s.day_of_week, timeLocal, tz, everyDay);
            const utcTime = localTimeToUtcDisplay(timeLocal, tz);

            return (
              <Card key={s.id} className={cn("border-border/40 bg-card/40 backdrop-blur-sm transition-all", !s.is_active && "opacity-60")}>
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
                        <Badge variant="outline" className={cn("text-[10px]", s.is_active ? "border-emerald-500/30 text-emerald-400" : "border-muted-foreground/30 text-muted-foreground")}>
                          {s.is_active ? "Ativo" : "Pausado"}
                        </Badge>
                      </div>

                      <div className="mt-1.5 flex flex-col gap-1 text-[10px] text-muted-foreground">
                        {/* Main schedule line — local timezone */}
                        <div className="flex items-center gap-1 text-foreground/80 font-medium">
                          <Clock className="h-3 w-3 text-primary/60" />
                          <span>
                            {everyDay
                              ? `Todos os dias às ${timeLocal}`
                              : `${DAY_NAMES[s.day_of_week]} às ${timeLocal}`}
                          </span>
                          <span className="text-muted-foreground font-normal">({tz})</span>
                        </div>

                        {/* Secondary: UTC equivalent */}
                        <span className="text-muted-foreground/60 text-[9px] ml-4">
                          UTC: {utcTime}
                        </span>

                        {/* Next execution */}
                        {s.is_active && (
                          <div className="flex items-center gap-1 ml-4">
                            <span className="text-primary/80">
                              Próximo: {formatInTz(nextFireDate, tz)} ({formatRelative(nextFireDate)})
                            </span>
                          </div>
                        )}

                        {/* Pushed explanation */}
                        {s.is_active && pushed && (
                          <div className="flex items-center gap-1 ml-4 text-amber-400/70">
                            <Info className="h-3 w-3 shrink-0" />
                            <span>
                              {everyDay
                                ? "Horário de hoje já passou; próxima execução amanhã."
                                : "Horário desta semana já passou; próxima execução calculada para a semana seguinte."}
                            </span>
                          </div>
                        )}

                        {/* Last run info */}
                        {s.last_run_at && (
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1">
                              {s.last_run_status === "ok" ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              ) : s.last_run_status === "error" ? (
                                <XCircle className="h-3 w-3 text-red-400" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              Último disparo: {new Date(s.last_run_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: tz })}
                            </span>
                            {s.last_run_job_id && (
                              <span className="font-mono text-muted-foreground/60" title={`Job ID: ${s.last_run_job_id}`}>
                                Job: {s.last_run_job_id.length > 12 ? s.last_run_job_id.slice(0, 12) + "…" : s.last_run_job_id}
                              </span>
                            )}
                            {s.last_error && (
                              <span className="text-red-400 truncate max-w-[200px]" title={s.last_error}>
                                {s.last_error}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => toggleActive(s.id, !s.is_active)}
                        title={s.is_active ? "Pausar" : "Ativar"}
                      >
                        {s.is_active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
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
      {(showCreate || editSchedule) && tenantId && user && (
        <ScheduleFormDialog
          tenantId={tenantId}
          userId={user.id}
          schedule={editSchedule}
          existingSchedules={schedules}
          onClose={() => { setShowCreate(false); setEditSchedule(null); }}
          onSaved={() => { setShowCreate(false); setEditSchedule(null); void loadSchedules(); }}
        />
      )}
    </div>
  );
}

/* ─── Form Dialog ─── */

function ScheduleFormDialog({
  tenantId,
  userId,
  schedule,
  existingSchedules,
  onClose,
  onSaved,
}: {
  tenantId: string;
  userId: string;
  schedule: BulkSchedule | null;
  existingSchedules: BulkSchedule[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!schedule;
  const [name, setName] = useState(schedule?.name || "");
  const [commandKey, setCommandKey] = useState<string>(schedule?.command_key || "sendMailItem");
  const [everyDay, setEveryDay] = useState(schedule ? isEveryDay(schedule) : false);
  const [dayOfWeek, setDayOfWeek] = useState(String(schedule?.day_of_week ?? 1));
  const [timeLocal, setTimeLocal] = useState(schedule?.time_utc || "12:00");
  const [isActive, setIsActive] = useState(schedule?.is_active ?? true);
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

    if (sel.every_day || schedule.every_day) setEveryDay(true);

    const cp = schedule.command_payload || {};
    if (cp.item_id) setItemId(String(cp.item_id));
    if (cp.count) setItemCount(String(cp.count));
    if (cp.money) setGoldAmount(String(cp.money));
    if (cp.amount) setCashAmount(String(cp.amount));
    if (cp.subject) setSubject(cp.subject as string);
    if (cp.body) setBody(cp.body as string);
    if (cp.reason) setSubject(cp.reason as string);
    if (cp.message) setMessage(cp.message as string);
  }, [schedule]);

  const handleSave = async () => {
    if (!name.trim()) { setError("Nome obrigatório"); return; }

    // Duplicate detection: same command + day + time (skip for every_day)
    if (!isEdit && !everyDay) {
      const dup = existingSchedules.find(
        s => s.command_key === commandKey && s.day_of_week === parseInt(dayOfWeek) && s.time_utc === timeLocal
      );
      if (dup) {
        setError(`Já existe um agendamento "${dup.name}" com o mesmo comando, dia e horário. Edite o existente ou escolha outro horário.`);
        return;
      }
    }

    setSaving(true);
    setError(null);

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
    }

    if (everyDay) {
      selection.every_day = true;
    }

    const command_payload: Record<string, unknown> = {};
    switch (commandKey) {
      case "sendMailItem":
        command_payload.item_id = parseInt(itemId) || 0;
        command_payload.count = parseInt(itemCount) || 1;
        if (subject) command_payload.subject = subject;
        if (body) command_payload.body = body;
        break;
      case "sendMailGold":
        command_payload.money = parseInt(goldAmount) || 0;
        if (subject) command_payload.subject = subject;
        if (body) command_payload.body = body;
        break;
      case "grantMallCash":
        command_payload.amount = parseInt(cashAmount) || 0;
        command_payload.reason = subject || "Agendamento automático";
        command_payload.confirm = "GRANT_MALL_CASH";
        break;
      case "sendSystemMessage":
        command_payload.message = message || "";
        break;
    }

    const row = {
      tenant_id: tenantId,
      name: name.trim(),
      command_key: commandKey,
      selection: selection as unknown as Record<string, never>,
      command_payload: command_payload as unknown as Record<string, never>,
      day_of_week: everyDay ? 0 : parseInt(dayOfWeek),
      time_utc: timeLocal,
      timezone: DEFAULT_TIMEZONE,
      is_active: isActive,
    };

    let err;
    if (isEdit && schedule) {
      const { error: e } = await supabase
        .from("gm_bulk_schedules")
        .update({ ...row, updated_by: userId } as never)
        .eq("id", schedule.id);
      err = e;
    } else {
      const { error: e } = await supabase
        .from("gm_bulk_schedules")
        .insert({ ...row, created_by: userId } as never);
      err = e;
    }

    if (err) {
      setError(err.message);
      setSaving(false);
    } else {
      onSaved();
    }
  };

  const utcPreview = localTimeToUtcDisplay(timeLocal, DEFAULT_TIMEZONE);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg border-border/40 bg-card/95 backdrop-blur-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-extrabold">
            {isEdit ? "Editar Agendamento" : "Novo Agendamento"}
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            Horários em {DEFAULT_TIMEZONE}. O scheduler converte automaticamente para UTC.
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
                  <Label className="text-[11px]">Dia da Semana</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAY_NAMES.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className={cn("space-y-1", everyDay && "col-span-2")}>
                <Label className="text-[11px]">Horário ({tzShort(DEFAULT_TIMEZONE)})</Label>
                <Input
                  type="time"
                  value={timeLocal}
                  onChange={e => setTimeLocal(e.target.value)}
                  className="h-9 text-xs"
                />
                <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                  UTC equivalente: {utcPreview}
                </p>
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
            </div>
          )}

          {commandKey === "sendSystemMessage" && (
            <div className="space-y-2">
              <Label className="text-[10px]">Mensagem do Broadcast</Label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Mensagem que será enviada no chat global" className="h-16 text-xs" />
            </div>
          )}

          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} id="sched-active" />
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

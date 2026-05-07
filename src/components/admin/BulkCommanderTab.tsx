// GM Commander v2 — Bulk Commander Tab
// Consome os endpoints reais da VPS (Fase A homologada):
//   searchPlayerDirectory, resolveBulkTargets, previewBulkTargets,
//   queueBulkCommand, getBulkCommandJob, getBulkCommandJobs
//
// Fluxo: Selecionar audiência → Preview → Enfileirar → Monitorar jobs

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Loader2,
  Megaphone,
  Package,
  Play,
  RefreshCw,
  Search,
  Send,
  Target,
  Users,
  Wallet,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import { EndpointMissingNotice } from "@/components/admin/EndpointMissingNotice";
import { logAuditEvent } from "@/lib/auditLog";
import { cn } from "@/lib/utils";
import {
  EndpointMissingError,
  pwApi,
  type BulkCommandKey,
  type BulkJobSummary,
  type BulkSelectionParams,
  type BulkTarget,
  type GmCommandCapability,
  type PreviewBulkTargetsResponse,
} from "@/lib/pwApiActions";
import { BulkScheduleManager } from "@/components/admin/BulkScheduleManager";

const PW_CLASSES = [
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

/* ─── Constants ─── */

const BULK_COMMANDS: { key: BulkCommandKey; label: string; icon: React.ReactNode; description: string }[] = [
  { key: "sendMailItem", label: "Enviar Item", icon: <Package className="h-4 w-4" />, description: "Envia um item via correio para os alvos" },
  { key: "sendMailGold", label: "Enviar Gold", icon: <Wallet className="h-4 w-4" />, description: "Envia moedas via correio para os alvos" },
  { key: "grantMallCash", label: "Creditar Cash", icon: <Wallet className="h-4 w-4" />, description: "Credita gold/cash da loja na conta" },
  { key: "sendSystemMessage", label: "Mensagem Global", icon: <Megaphone className="h-4 w-4" />, description: "Envia mensagem de sistema (global nesta fase)" },
];

/* ─── Types ─── */

interface BulkCommanderTabProps {
  caps: Map<string, GmCommandCapability>;
  onActed: () => void;
}

type Step = "select" | "configure" | "preview" | "queued";

/* ─── Main Component ─── */

export function BulkCommanderTab({ caps, onActed }: BulkCommanderTabProps) {
  const [endpointMissing, setEndpointMissing] = useState(false);
  const [step, setStep] = useState<Step>("select");
  const [commandKey, setCommandKey] = useState<BulkCommandKey>("sendMailItem");

  // Selection state
  const [selectionMode, setSelectionMode] = useState<string>("names");
  const [namesInput, setNamesInput] = useState("");
  const [roleidsInput, setRoleidsInput] = useState("");
  const [guildIdInput, setGuildIdInput] = useState("");
  const [classIds, setClassIds] = useState<number[]>([]);
  const [levelMin, setLevelMin] = useState("");
  const [levelMax, setLevelMax] = useState("");
  const [allOnline, setAllOnline] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);

  // Command payload
  const [itemId, setItemId] = useState("");
  const [itemCount, setItemCount] = useState("1");
  const [goldAmount, setGoldAmount] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sysMessage, setSysMessage] = useState("");
  const [confirmToken, setConfirmToken] = useState("");

  // Preview/Queue state
  const [preview, setPreview] = useState<PreviewBulkTargetsResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queuedJobId, setQueuedJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Jobs list
  const [jobs, setJobs] = useState<BulkJobSummary[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<BulkJobSummary | null>(null);

  const buildSelection = useCallback((): BulkSelectionParams => {
    const sel: BulkSelectionParams = {};
    if (allOnline) {
      sel.all_online = true;
    } else {
      switch (selectionMode) {
        case "names": {
          const names = namesInput.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
          if (names.length) sel.names = names;
          break;
        }
        case "roleids": {
          const ids = roleidsInput.split(/[,\s]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
          if (ids.length) sel.roleids = ids;
          break;
        }
        case "guild": {
          const gid = parseInt(guildIdInput);
          if (!isNaN(gid) && gid > 0) sel.guild_id = gid;
          break;
        }
        case "class": {
          if (classIds.length) sel.class_ids = classIds;
          break;
        }
        case "level": {
          // level range
          break;
        }
      }
    }
    if (onlineOnly && !allOnline) sel.online_only = true;
    const lMin = parseInt(levelMin);
    const lMax = parseInt(levelMax);
    if (!isNaN(lMin) && lMin > 0) sel.level_min = lMin;
    if (!isNaN(lMax) && lMax > 0) sel.level_max = lMax;
    if (selectionMode === "class" && classIds.length) sel.class_ids = classIds;
    return sel;
  }, [selectionMode, namesInput, roleidsInput, guildIdInput, classIds, levelMin, levelMax, allOnline, onlineOnly]);

  const buildCommandPayload = useCallback((): Record<string, unknown> => {
    const p: Record<string, unknown> = {};
    switch (commandKey) {
      case "sendMailItem":
        p.item_id = parseInt(itemId) || 0;
        p.count = parseInt(itemCount) || 1;
        if (subject) p.subject = subject;
        if (body) p.body = body;
        break;
      case "sendMailGold":
        p.money = parseInt(goldAmount) || 0;
        if (subject) p.subject = subject;
        if (body) p.body = body;
        break;
      case "grantMallCash":
        p.amount = parseInt(cashAmount) || 0;
        p.reason = subject || "Bulk grant via GM Commander";
        if (confirmToken) p.confirm = confirmToken;
        break;
      case "sendSystemMessage":
        p.message = sysMessage;
        break;
    }
    return p;
  }, [commandKey, itemId, itemCount, goldAmount, cashAmount, subject, body, sysMessage]);

  const handlePreview = useCallback(async () => {
    setPreviewLoading(true);
    setError(null);
    try {
      const sel = buildSelection();
      const payload = buildCommandPayload();
      const res = await pwApi.previewBulkTargets({
        command_key: commandKey,
        ...sel,
        ...payload,
      });
      setPreview(res);
      setStep("preview");
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        setEndpointMissing(true);
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setPreviewLoading(false);
    }
  }, [commandKey, buildSelection, buildCommandPayload]);

  const needsConfirmation = commandKey === "grantMallCash";
  const confirmationValid = !needsConfirmation || confirmToken === "GRANT_MALL_CASH";

  const handleQueue = useCallback(async () => {
    if (needsConfirmation && !confirmationValid) {
      setError("Confirmação obrigatória: digite GRANT_MALL_CASH para autorizar esta operação.");
      return;
    }
    setQueueLoading(true);
    setError(null);
    try {
      const sel = buildSelection();
      const payload = buildCommandPayload();
      const res = await pwApi.queueBulkCommand({
        command_key: commandKey,
        ...sel,
        ...payload,
      });
      setQueuedJobId(res.job.id);
      setStep("queued");
      onActed();
      await logAuditEvent({
        action: "gm.bulk_queue",
        target: commandKey,
        status: "ok",
        metadata: {
          job_id: res.job.id,
          command_key: commandKey,
          target_count: res.job.target_count,
        },
      });
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        setEndpointMissing(true);
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        // Confirmation/validation errors are not retryable
        const isConfirmErr = /confirm|validation|GRANT_MALL_CASH/i.test(msg);
        setError(isConfirmErr ? `⛔ Erro de confirmação (não retentável): ${msg}` : msg);
      }
    } finally {
      setQueueLoading(false);
    }
  }, [commandKey, buildSelection, buildCommandPayload, onActed, needsConfirmation, confirmationValid]);

  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const res = await pwApi.getBulkCommandJobs({ limit: 50 });
      setJobs(res.jobs || []);
    } catch (e) {
      if (e instanceof EndpointMissingError) setEndpointMissing(true);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const resetFlow = useCallback(() => {
    setStep("select");
    setPreview(null);
    setQueuedJobId(null);
    setError(null);
  }, []);

  if (endpointMissing) {
    return <EndpointMissingNotice action="queueBulkCommand" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Bulk Commander
            <Badge variant="outline" className="ml-2 border-primary/30 text-[10px] text-primary">v2 · Fase A</Badge>
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            Premiação e comandos em massa com audiência real, preview e fila de execução.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={loadJobs} disabled={jobsLoading} className="border-border/60 bg-card/60">
          <RefreshCw className={cn("h-3.5 w-3.5", jobsLoading && "animate-spin")} />
          Jobs
        </Button>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 text-[11px] font-semibold">
        {(["select", "configure", "preview", "queued"] as Step[]).map((s, i) => {
          const labels: Record<Step, string> = { select: "Audiência", configure: "Comando", preview: "Preview", queued: "Fila" };
          const active = s === step;
          const done = (["select", "configure", "preview", "queued"] as Step[]).indexOf(step) > i;
          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
              <span className={cn(
                "rounded-full border px-3 py-1 transition-all",
                active ? "border-primary bg-primary/10 text-primary" :
                  done ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" :
                    "border-border/40 text-muted-foreground",
              )}>
                {labels[s]}
              </span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-[11px] text-red-400">
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step: Select audience + command */}
      {(step === "select" || step === "configure") && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Audience selector */}
          <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider">
                <Target className="h-3.5 w-3.5 text-primary" />
                Seleção de Audiência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={allOnline} onCheckedChange={setAllOnline} id="all-online" />
                <Label htmlFor="all-online" className="text-xs">Todos Online</Label>
              </div>

              {!allOnline && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[11px] text-muted-foreground">Modo de Seleção</Label>
                    <Select value={selectionMode} onValueChange={setSelectionMode}>
                      <SelectTrigger className="h-9 text-xs border-border/60 bg-card/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="names">Por Nomes</SelectItem>
                        <SelectItem value="roleids">Por Role IDs</SelectItem>
                        <SelectItem value="guild">Por Guild ID</SelectItem>
                        <SelectItem value="class">Por Classe</SelectItem>
                        <SelectItem value="level">Por Faixa de Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectionMode === "names" && (
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Nomes (um por linha ou separados por vírgula)</Label>
                      <Textarea
                        value={namesInput}
                        onChange={e => setNamesInput(e.target.value)}
                        placeholder="Player1&#10;Player2&#10;Player3"
                        className="h-24 text-xs border-border/60 bg-card/60"
                      />
                    </div>
                  )}

                  {selectionMode === "roleids" && (
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Role IDs (separados por vírgula)</Label>
                      <Textarea
                        value={roleidsInput}
                        onChange={e => setRoleidsInput(e.target.value)}
                        placeholder="12345, 67890, 11111"
                        className="h-20 text-xs border-border/60 bg-card/60"
                      />
                    </div>
                  )}

                  {selectionMode === "guild" && (
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Guild ID</Label>
                      <Input
                        value={guildIdInput}
                        onChange={e => setGuildIdInput(e.target.value)}
                        placeholder="ID numérico da guild"
                        className="h-9 text-xs border-border/60 bg-card/60"
                      />
                    </div>
                  )}

                  {selectionMode === "class" && (
                    <div className="space-y-2">
                      <Label className="text-[11px] text-muted-foreground">Classes</Label>
                      <div className="flex flex-wrap gap-2">
                        {PW_CLASSES.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setClassIds(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                            className={cn(
                              "rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all",
                              classIds.includes(c.id)
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/40 text-muted-foreground hover:border-primary/30",
                            )}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectionMode === "level" || selectionMode === "class") && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Level Mín</Label>
                        <Input value={levelMin} onChange={e => setLevelMin(e.target.value)} placeholder="1" className="h-9 text-xs border-border/60 bg-card/60" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Level Máx</Label>
                        <Input value={levelMax} onChange={e => setLevelMax(e.target.value)} placeholder="150" className="h-9 text-xs border-border/60 bg-card/60" />
                      </div>
                    </div>
                  )}
                </>
              )}

              {!allOnline && (
                <div className="flex items-center gap-3 pt-1">
                  <Switch checked={onlineOnly} onCheckedChange={setOnlineOnly} id="online-only" />
                  <Label htmlFor="online-only" className="text-[11px] text-muted-foreground">Filtrar apenas online</Label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Command configuration */}
          <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider">
                <Send className="h-3.5 w-3.5 text-primary" />
                Comando
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[11px] text-muted-foreground">Tipo de Comando</Label>
                <div className="grid grid-cols-2 gap-2">
                  {BULK_COMMANDS.map(cmd => (
                    <button
                      key={cmd.key}
                      type="button"
                      onClick={() => setCommandKey(cmd.key)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all",
                        commandKey === cmd.key
                          ? "border-primary/50 bg-primary/10 shadow-[0_0_20px_-6px_hsl(210_85%_60%/0.2)]"
                          : "border-border/40 bg-card/30 hover:border-primary/30",
                      )}
                    >
                      <div className={cn("text-muted-foreground", commandKey === cmd.key && "text-primary")}>{cmd.icon}</div>
                      <div>
                        <p className="text-[11px] font-bold text-foreground">{cmd.label}</p>
                        <p className="text-[10px] text-muted-foreground">{cmd.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Command-specific fields */}
              {commandKey === "sendMailItem" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Item ID</Label>
                      <Input value={itemId} onChange={e => setItemId(e.target.value)} placeholder="Ex: 21652" className="h-9 text-xs border-border/60 bg-card/60" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Quantidade</Label>
                      <Input value={itemCount} onChange={e => setItemCount(e.target.value)} placeholder="1" className="h-9 text-xs border-border/60 bg-card/60" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Assunto (opcional)</Label>
                    <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Recompensa de evento" className="h-9 text-xs border-border/60 bg-card/60" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Mensagem (opcional)</Label>
                    <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Parabéns..." className="h-16 text-xs border-border/60 bg-card/60" />
                  </div>
                </div>
              )}

              {commandKey === "sendMailGold" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Gold (moedas normais)</Label>
                    <Input value={goldAmount} onChange={e => setGoldAmount(e.target.value)} placeholder="Ex: 1000000" className="h-9 text-xs border-border/60 bg-card/60" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Assunto (opcional)</Label>
                    <Input value={subject} onChange={e => setSubject(e.target.value)} className="h-9 text-xs border-border/60 bg-card/60" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Mensagem (opcional)</Label>
                    <Textarea value={body} onChange={e => setBody(e.target.value)} className="h-16 text-xs border-border/60 bg-card/60" />
                  </div>
                </div>
              )}

              {commandKey === "grantMallCash" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Quantidade de Cash/Gold (Mall)</Label>
                    <Input value={cashAmount} onChange={e => setCashAmount(e.target.value)} placeholder="Ex: 100" className="h-9 text-xs border-border/60 bg-card/60" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Motivo</Label>
                    <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Premiação de evento" className="h-9 text-xs border-border/60 bg-card/60" />
                  </div>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                    <div className="flex items-start gap-2 text-[10px] text-amber-400">
                      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>Operação sensível: digite <code className="font-mono font-bold text-amber-300">GRANT_MALL_CASH</code> para autorizar o envio.</span>
                    </div>
                    <Input
                      value={confirmToken}
                      onChange={e => setConfirmToken(e.target.value)}
                      placeholder="Digite GRANT_MALL_CASH"
                      className={cn(
                        "h-9 text-xs font-mono border-border/60 bg-card/60",
                        confirmToken === "GRANT_MALL_CASH" && "border-emerald-500/50 bg-emerald-500/5"
                      )}
                    />
                    {confirmToken && confirmToken !== "GRANT_MALL_CASH" && (
                      <p className="text-[10px] text-red-400">Token inválido. Digite exatamente: GRANT_MALL_CASH</p>
                    )}
                  </div>
                </div>
              )}

              {commandKey === "sendSystemMessage" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Mensagem</Label>
                    <Textarea value={sysMessage} onChange={e => setSysMessage(e.target.value)} placeholder="Mensagem de sistema..." className="h-20 text-xs border-border/60 bg-card/60" />
                  </div>
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[10px] text-amber-400">
                    <AlertTriangle className="inline h-3 w-3 mr-1" />
                    sendSystemMessage é global nesta fase e ignora filtros de alvo.
                  </div>
                </div>
              )}

              <Button
                onClick={handlePreview}
                disabled={previewLoading}
                className="w-full gap-2"
              >
                {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                Preview da Operação
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Preview */}
      {step === "preview" && preview && (
        <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider">
              <Eye className="h-3.5 w-3.5 text-primary" />
              Preview — {preview.count} alvos
              <Badge variant="outline" className="border-primary/30 text-[10px] text-primary ml-2">
                {preview.command_key}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview.warnings?.length > 0 && (
              <div className="space-y-1">
                {preview.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[10px] text-amber-400">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Payload summary */}
            <div className="rounded-xl border border-border/40 bg-card/20 p-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Payload do Comando</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                {preview.command_payload_preview.item_id ? (
                  <><span className="text-muted-foreground">Item ID:</span><span className="font-mono text-foreground">{preview.command_payload_preview.item_id}</span></>
                ) : null}
                {preview.command_payload_preview.count ? (
                  <><span className="text-muted-foreground">Quantidade:</span><span className="font-mono text-foreground">{preview.command_payload_preview.count}</span></>
                ) : null}
                {preview.command_payload_preview.money ? (
                  <><span className="text-muted-foreground">Gold:</span><span className="font-mono text-foreground">{preview.command_payload_preview.money.toLocaleString()}</span></>
                ) : null}
                {preview.command_payload_preview.amount != null ? (
                  <><span className="text-muted-foreground">Cash:</span><span className="font-mono text-foreground">{String(preview.command_payload_preview.amount)}</span></>
                ) : null}
                {preview.command_payload_preview.message ? (
                  <><span className="text-muted-foreground">Mensagem:</span><span className="text-foreground">{preview.command_payload_preview.message}</span></>
                ) : null}
                <span className="text-muted-foreground">Total de alvos:</span><span className="font-mono font-bold text-primary">{preview.count}</span>
              </div>
            </div>

            {/* Confirmation requirement for grantMallCash */}
            {needsConfirmation && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 space-y-2">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <span className="text-amber-400 font-semibold">confirmation.required:</span>
                  <span className="font-mono font-bold text-amber-300">true</span>
                  <span className="text-amber-400 font-semibold">confirmation.token:</span>
                  <span className="font-mono font-bold text-amber-300">"GRANT_MALL_CASH"</span>
                </div>
                {!confirmationValid && (
                  <div className="flex items-start gap-2 text-[10px] text-red-400 mt-2">
                    <XCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>Confirmação pendente — volte e digite o token para liberar o envio.</span>
                  </div>
                )}
                {confirmationValid && (
                  <div className="flex items-start gap-2 text-[10px] text-emerald-400 mt-2">
                    <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>Confirmação validada.</span>
                  </div>
                )}
              </div>
            )}

            {/* Sample targets */}
            {preview.sample_targets.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Amostra ({preview.sample_size} de {preview.count})
                </h4>
                <ScrollArea className="h-48">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/30">
                        <TableHead className="text-[10px]">Role ID</TableHead>
                        <TableHead className="text-[10px]">Nome</TableHead>
                        <TableHead className="text-[10px]">Level</TableHead>
                        <TableHead className="text-[10px]">Classe</TableHead>
                        <TableHead className="text-[10px]">Online</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.sample_targets.map((t, i) => (
                        <TableRow key={i} className="border-border/20">
                          <TableCell className="font-mono text-[11px]">{t.roleid}</TableCell>
                          <TableCell className="text-[11px]">{t.name || "—"}</TableCell>
                          <TableCell className="text-[11px]">{t.level ?? "—"}</TableCell>
                          <TableCell className="text-[11px]">{t.cls != null ? (PW_CLASSES.find(c => c.id === t.cls)?.name ?? t.cls) : "—"}</TableCell>
                          <TableCell>
                            {t.online ? (
                              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                            ) : (
                              <span className="inline-flex h-2 w-2 rounded-full bg-muted-foreground/30" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={resetFlow} className="flex-1 gap-2 border-border/60">
                Voltar
              </Button>
              <Button
                onClick={handleQueue}
                disabled={queueLoading || (needsConfirmation && !confirmationValid)}
                className="flex-1 gap-2"
                title={needsConfirmation && !confirmationValid ? "Confirmação obrigatória" : undefined}
              >
                {queueLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Enfileirar Job ({preview.count} alvos)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Queued */}
      {step === "queued" && queuedJobId && (
        <Card className="border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm">
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 mb-3" />
            <h3 className="text-sm font-extrabold text-foreground">Job Enfileirado</h3>
            <p className="text-xs text-muted-foreground mt-1">
              ID: <span className="font-mono text-foreground">{queuedJobId}</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-2">
              O worker <code className="font-mono text-[10px]">gm-queue-worker.php</code> irá processar os alvos automaticamente.
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <Button variant="outline" size="sm" onClick={() => { resetFlow(); void loadJobs(); }}>
                Nova Operação
              </Button>
              <Button size="sm" onClick={() => void loadJobs()}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Atualizar Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jobs list */}
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            Fila de Jobs
            <Badge variant="outline" className="border-border/30 text-[10px] text-muted-foreground ml-2">
              {jobs.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobsLoading && jobs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-center py-8 text-xs text-muted-foreground">Nenhum job registrado</p>
          ) : (
            <ScrollArea className="h-64">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30">
                    <TableHead className="text-[10px]">ID</TableHead>
                    <TableHead className="text-[10px]">Comando</TableHead>
                    <TableHead className="text-[10px]">Alvos</TableHead>
                    <TableHead className="text-[10px]">Status</TableHead>
                    <TableHead className="text-[10px]">Criado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map(j => (
                    <TableRow key={j.id} className="border-border/20 cursor-pointer hover:bg-primary/5" onClick={() => setSelectedJob(j)}>
                      <TableCell className="font-mono text-[10px] text-muted-foreground">{j.id.slice(0, 16)}…</TableCell>
                      <TableCell className="text-[11px]">{j.command_key}</TableCell>
                      <TableCell className="text-[11px] font-mono">{j.target_count}</TableCell>
                      <TableCell>
                        <JobStatusBadge status={j.status} />
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">
                        {new Date(j.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Job detail dialog */}
      {selectedJob && (
        <JobDetailDialog job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}

      {/* Schedule Manager */}
      <Separator className="bg-border/30" />
      <BulkScheduleManager />
    </div>
  );
}

/* ─── Sub-components ─── */

function JobStatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: React.ReactNode }> = {
    queued: { color: "border-blue-500/30 bg-blue-500/10 text-blue-400", icon: <Clock className="h-3 w-3" /> },
    processing: { color: "border-amber-500/30 bg-amber-500/10 text-amber-400", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    completed: { color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", icon: <CheckCircle2 className="h-3 w-3" /> },
    failed: { color: "border-red-500/30 bg-red-500/10 text-red-400", icon: <XCircle className="h-3 w-3" /> },
    cancelled: { color: "border-muted-foreground/30 bg-muted/10 text-muted-foreground", icon: <XCircle className="h-3 w-3" /> },
  };
  const s = map[status] ?? map.queued;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", s.color)}>
      {s.icon}
      {status}
    </span>
  );
}

function JobDetailDialog({ job, onClose }: { job: BulkJobSummary; onClose: () => void }) {
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    pwApi.getBulkCommandJob(job.id)
      .then(res => setDetail(res.job as unknown as Record<string, unknown>))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [job.id]);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg border-border/40 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-extrabold">
            Job: {job.id.slice(0, 20)}…
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            {job.command_key} · {job.target_count} alvos
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <JobStatusBadge status={job.status} />
            {job.actor?.name && (
              <span className="text-[10px] text-muted-foreground">por {job.actor.name}</span>
            )}
          </div>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : detail ? (
            <ScrollArea className="h-60 rounded-lg border border-border/30 bg-card/30 p-3">
              <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap">
                {JSON.stringify(detail, null, 2)}
              </pre>
            </ScrollArea>
          ) : (
            <p className="text-xs text-muted-foreground">Não foi possível carregar detalhes</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// GM Commander v2 — Bulk Templates Manager
// CRUD + preview + execute (queue/schedule) de templates operacionais.
// Backend homologado: saveBulkTemplate, getBulkTemplates, updateBulkTemplate,
// deleteBulkTemplate, previewBulkTemplate, executeBulkTemplate.

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Edit,
  Eye,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Scroll,
  Send,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { cn } from "@/lib/utils";
import {
  EndpointMissingError,
  pwApi,
  type BulkCommandKey,
  type BulkTemplate,
  type BulkTemplateCategory,
  type BulkSelectionParams,
  type PreviewBulkTargetsResponse,
} from "@/lib/pwApiActions";

/* ─── Constants ─── */

const CATEGORIES: { value: BulkTemplateCategory; label: string; color: string }[] = [
  { value: "recompensa", label: "Recompensa", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  { value: "evento", label: "Evento", color: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
  { value: "broadcast", label: "Broadcast", color: "border-purple-500/30 bg-purple-500/10 text-purple-400" },
  { value: "punicao", label: "Punição", color: "border-red-500/30 bg-red-500/10 text-red-400" },
];

const COMMAND_LABELS: Record<string, string> = {
  sendMailItem: "Enviar Item",
  sendMailGold: "Enviar Gold",
  grantMallCash: "Creditar Cash",
  sendSystemMessage: "Mensagem Global",
};

const COMMANDS: BulkCommandKey[] = ["sendMailItem", "sendMailGold", "grantMallCash", "sendSystemMessage"];

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function catBadge(cat: BulkTemplateCategory) {
  const c = CATEGORIES.find((x) => x.value === cat);
  return c ? c : CATEGORIES[0];
}

/* ─── Main ─── */

export function BulkTemplatesManager() {
  const [templates, setTemplates] = useState<BulkTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("all");

  // Dialogs
  const [editOpen, setEditOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<BulkTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewBulkTargetsResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [execOpen, setExecOpen] = useState(false);
  const [execTemplate, setExecTemplate] = useState<BulkTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMissing(false);
    try {
      const res = await pwApi.getBulkTemplates();
      setTemplates(res.templates ?? []);
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        setMissing(true);
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = filterCat === "all" ? templates : templates.filter((t) => t.category === filterCat);

  const handleDelete = async (key: string) => {
    setActionLoading(true);
    try {
      await pwApi.deleteBulkTemplate(key);
      setTemplates((prev) => prev.filter((t) => t.template_key !== key));
      setDeleteConfirm(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePreview = async (key: string) => {
    setPreviewKey(key);
    setPreviewLoading(true);
    setPreviewData(null);
    setPreviewOpen(true);
    try {
      const res = await pwApi.previewBulkTemplate(key);
      setPreviewData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  if (missing) {
    return (
      <Card className="border-amber-500/20 bg-card/40">
        <CardContent className="flex items-center gap-2 py-4 text-xs text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Endpoints de <strong>Bulk Templates</strong> não disponíveis nesta VPS. Atualize o api_cls.php.</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/30 bg-card/40 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <Scroll className="h-5 w-5 text-primary" />
          <CardTitle className="text-sm font-extrabold uppercase tracking-wider">
            Templates Operacionais
          </CardTitle>
          <div className="ml-auto flex items-center gap-2">
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="h-8 w-[140px] border-border/40 bg-card/60 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setEditTemplate(null); setEditOpen(true); }}
              className="gap-1 border-border/40 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Novo
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={load}
              disabled={loading}
              className="gap-1 text-xs"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <XCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}
          {loading && templates.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              {templates.length === 0 ? "Nenhum template salvo." : "Nenhum template nesta categoria."}
            </p>
          ) : (
            <div className="grid gap-2">
              {filtered.map((t) => {
                const cat = catBadge(t.category);
                return (
                  <div
                    key={t.template_key}
                    className="group flex items-center gap-3 rounded-xl border border-border/30 bg-card/30 px-4 py-3 transition-all hover:border-primary/30 hover:bg-card/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">{t.label}</span>
                        <Badge variant="outline" className={cn("text-[9px]", cat.color)}>
                          {cat.label}
                        </Badge>
                        {t.requires_confirmation && (
                          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[9px] text-amber-400">
                            Confirmação
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{COMMAND_LABELS[t.command_key] ?? t.command_key}</span>
                        <span>·</span>
                        <span className="font-mono">{t.template_key}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Preview" onClick={() => handlePreview(t.template_key)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Executar" onClick={() => { setExecTemplate(t); setExecOpen(true); }}>
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Editar" onClick={() => { setEditTemplate(t); setEditOpen(true); }}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Excluir" onClick={() => setDeleteConfirm(t.template_key)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      {editOpen && (
        <TemplateFormDialog
          template={editTemplate}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); void load(); }}
        />
      )}

      {/* Preview Dialog */}
      {previewOpen && (
        <Dialog open onOpenChange={() => setPreviewOpen(false)}>
          <DialogContent className="max-w-lg border-border/40 bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-extrabold">Preview do Template</DialogTitle>
              <DialogDescription className="text-[11px] font-mono">{previewKey}</DialogDescription>
            </DialogHeader>
            {previewLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : previewData ? (
              <ScrollArea className="h-60 rounded-lg border border-border/30 bg-card/30 p-3">
                <div className="space-y-2 text-xs">
                  <div className="flex gap-3">
                    <span className="text-muted-foreground">Comando:</span>
                    <span className="font-semibold">{previewData.command_key}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-muted-foreground">Alvos:</span>
                    <span className="font-semibold">{previewData.count}</span>
                  </div>
                  {previewData.command_payload_preview && (
                    <div>
                      <span className="text-muted-foreground">Payload:</span>
                      <pre className="mt-1 rounded-md bg-background/60 p-2 font-mono text-[10px]">
                        {JSON.stringify(previewData.command_payload_preview, null, 2)}
                      </pre>
                    </div>
                  )}
                  {previewData.warnings?.length > 0 && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2 text-amber-400">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <ul className="list-disc pl-3 text-[10px]">
                        {previewData.warnings.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  )}
                  {previewData.sample_targets?.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Amostra ({previewData.sample_size} de {previewData.count}):</span>
                      <pre className="mt-1 max-h-32 overflow-auto rounded-md bg-background/60 p-2 font-mono text-[10px]">
                        {JSON.stringify(previewData.sample_targets, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <p className="py-4 text-center text-xs text-muted-foreground">Sem dados de preview</p>
            )}
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Execute Dialog */}
      {execOpen && execTemplate && (
        <ExecuteTemplateDialog
          template={execTemplate}
          onClose={() => { setExecOpen(false); setExecTemplate(null); }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Dialog open onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="max-w-sm border-border/40 bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-extrabold">Confirmar exclusão</DialogTitle>
              <DialogDescription className="text-[11px]">
                Excluir template <span className="font-mono font-semibold">{deleteConfirm}</span>? Essa ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)} disabled={actionLoading}>Cancelar</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(deleteConfirm)} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ─── Template Form Dialog ─── */

function TemplateFormDialog({
  template,
  onClose,
  onSaved,
}: {
  template: BulkTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!template;

  /* ── Default models per command ── */
  const DEFAULTS: Record<BulkCommandKey, {
    selection: object;
    payload: object;
    key: string;
    label: string;
    category: BulkTemplateCategory;
  }> = {
    sendMailItem: {
      selection: { roleids: [1024] },
      payload: { item_id: 12980, count: 1, title: "Premio", message: "Entrega por template" },
      key: "reward_item_default",
      label: "Recompensa Item",
      category: "recompensa",
    },
    sendMailGold: {
      selection: { guild_ids: [1] },
      payload: { money: 1000, title: "Guild Reward", message: "Entrega por template" },
      key: "reward_gold_default",
      label: "Recompensa Gold",
      category: "recompensa",
    },
    grantMallCash: {
      selection: { roleids: [1024] },
      payload: { amount: 1000, reason: "Bulk grant via GM Commander", confirm: "GRANT_MALL_CASH" },
      key: "reward_cash_default",
      label: "Recompensa Cash",
      category: "recompensa",
    },
    sendSystemMessage: {
      selection: {},
      payload: { message: "Evento diario ativo", kind: "system", priority: "normal" },
      key: "broadcast_default",
      label: "Mensagem Global",
      category: "broadcast",
    },
  };

  const initialCmd = template?.command_key ?? "sendMailItem";
  const initialDefaults = DEFAULTS[initialCmd];

  const [key, setKey] = useState(template?.template_key ?? initialDefaults.key);
  const [label, setLabel] = useState(template?.label ?? initialDefaults.label);
  const [category, setCategory] = useState<BulkTemplateCategory>(template?.category ?? initialDefaults.category);
  const [commandKey, setCommandKey] = useState<BulkCommandKey>(initialCmd);
  const [selectionJson, setSelectionJson] = useState(
    JSON.stringify(template?.selection ?? initialDefaults.selection, null, 2)
  );
  const [payloadJson, setPayloadJson] = useState(
    JSON.stringify(template?.default_payload ?? initialDefaults.payload, null, 2)
  );
  const [requiresPreview, setRequiresPreview] = useState(template?.requires_preview ?? true);
  const [requiresConfirmation, setRequiresConfirmation] = useState(template?.requires_confirmation ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if user manually edited selection/payload
  const [selectionDirty, setSelectionDirty] = useState(isEdit);
  const [payloadDirty, setPayloadDirty] = useState(isEdit);
  // Pending overwrite confirmation
  const [pendingCommand, setPendingCommand] = useState<BulkCommandKey | null>(null);

  // Handle command change with auto-fill logic
  const handleCommandChange = (newCmd: BulkCommandKey) => {
    if (newCmd === commandKey) return;
    const bothClean = !selectionDirty && !payloadDirty;
    if (bothClean) {
      applyDefaults(newCmd);
    } else {
      setPendingCommand(newCmd);
    }
  };

  const applyDefaults = (cmd: BulkCommandKey) => {
    const d = DEFAULTS[cmd];
    setCommandKey(cmd);
    setSelectionJson(JSON.stringify(d.selection, null, 2));
    setPayloadJson(JSON.stringify(d.payload, null, 2));
    setSelectionDirty(false);
    setPayloadDirty(false);
    if (!isEdit) {
      setKey(d.key);
      setLabel(d.label);
      setCategory(d.category);
    }
    if (cmd === "grantMallCash") setRequiresConfirmation(true);
  };

  const confirmOverwrite = () => {
    if (pendingCommand) {
      applyDefaults(pendingCommand);
      setPendingCommand(null);
    }
  };

  const cancelOverwrite = () => {
    if (pendingCommand) {
      setCommandKey(pendingCommand);
      if (pendingCommand === "grantMallCash") setRequiresConfirmation(true);
      setPendingCommand(null);
    }
  };

  // Auto-set confirmation for grantMallCash
  useEffect(() => {
    if (commandKey === "grantMallCash") {
      setRequiresConfirmation(true);
    }
  }, [commandKey]);

  const handleSave = async () => {
    setError(null);
    let selection: BulkSelectionParams;
    let defaultPayload: Record<string, unknown>;
    try {
      selection = JSON.parse(selectionJson);
    } catch {
      setError("JSON de seleção inválido");
      return;
    }
    try {
      defaultPayload = JSON.parse(payloadJson);
    } catch {
      setError("JSON de payload inválido");
      return;
    }

    // grantMallCash MUST have confirm
    if (commandKey === "grantMallCash") {
      defaultPayload.confirm = "GRANT_MALL_CASH";
    }

    if (!key.trim() || !label.trim()) {
      setError("Chave e label são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const body = {
        template_key: key.trim(),
        label: label.trim(),
        category,
        command_key: commandKey,
        selection,
        default_payload: defaultPayload,
        requires_preview: requiresPreview,
        requires_confirmation: requiresConfirmation,
      };
      if (isEdit) {
        await pwApi.updateBulkTemplate(body);
      } else {
        await pwApi.saveBulkTemplate(body);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg border-border/40 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-extrabold">
            {isEdit ? "Editar Template" : "Novo Template"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px]">Chave (template_key)</Label>
                <Input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  disabled={isEdit}
                  placeholder="reward_weekly_gold"
                  className="h-8 border-border/40 bg-card/60 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Label</Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Recompensa Semanal Gold"
                  className="h-8 border-border/40 bg-card/60 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px]">Categoria</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as BulkTemplateCategory)}>
                  <SelectTrigger className="h-8 border-border/40 bg-card/60 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Comando</Label>
                <Select value={commandKey} onValueChange={(v) => handleCommandChange(v as BulkCommandKey)}>
                  <SelectTrigger className="h-8 border-border/40 bg-card/60 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMANDS.map((c) => (
                      <SelectItem key={c} value={c}>{COMMAND_LABELS[c] ?? c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px]">Seleção (JSON)</Label>
              <Textarea
                value={selectionJson}
                onChange={(e) => { setSelectionJson(e.target.value); setSelectionDirty(true); }}
                rows={4}
                className="border-border/40 bg-card/60 font-mono text-[11px]"
                placeholder={commandKey === "sendSystemMessage"
                  ? '{}'
                  : '{"all_online": true}'}
              />
              <div className="space-y-0.5 text-[9px] text-muted-foreground/60">
                {commandKey === "sendSystemMessage" ? (
                  <p>Broadcast é global — use <code className="font-mono">{'{}'}</code></p>
                ) : (
                  <>
                    <p>Exemplos: <code className="font-mono">{'{"roleids":[1024]}'}</code> · <code className="font-mono">{'{"names":["Criador"]}'}</code> · <code className="font-mono">{'{"guild_ids":[1]}'}</code></p>
                    <p><code className="font-mono">{'{"class_ids":[4],"online_only":true}'}</code> · <code className="font-mono">{'{"level_min":100,"level_max":105}'}</code> · <code className="font-mono">{'{"all_online":true}'}</code></p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px]">Payload padrão (JSON)</Label>
              <Textarea
                value={payloadJson}
                onChange={(e) => { setPayloadJson(e.target.value); setPayloadDirty(true); }}
                rows={4}
                className="border-border/40 bg-card/60 font-mono text-[11px]"
                placeholder={
                  commandKey === "sendMailItem" ? '{"item_id": 12980, "count": 1, "title": "Premio", "message": "Entrega por template"}'
                  : commandKey === "sendMailGold" ? '{"money": 1000, "title": "Guild Reward", "message": "Entrega por template"}'
                  : commandKey === "grantMallCash" ? '{"amount": 1000, "reason": "Bulk grant via GM Commander"}'
                  : '{"message": "Evento diario ativo", "kind": "system", "priority": "normal"}'
                }
              />
              {commandKey === "grantMallCash" && (
                <p className="flex items-center gap-1.5 text-[10px] text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  confirm:"GRANT_MALL_CASH" será incluído automaticamente.
                </p>
              )}
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={requiresPreview} onCheckedChange={setRequiresPreview} />
                Exigir preview
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Switch
                  checked={requiresConfirmation}
                  onCheckedChange={setRequiresConfirmation}
                  disabled={commandKey === "grantMallCash"}
                />
                Exigir confirmação
                {commandKey === "grantMallCash" && (
                  <span className="text-[9px] text-amber-400">(obrigatório)</span>
                )}
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <XCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {isEdit ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Overwrite confirmation */}
      {pendingCommand && (
        <Dialog open onOpenChange={() => setPendingCommand(null)}>
          <DialogContent className="max-w-sm border-border/40 bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-extrabold">Substituir campos?</DialogTitle>
              <DialogDescription className="text-[11px]">
                Deseja substituir Seleção e Payload pelo modelo padrão de <strong>{COMMAND_LABELS[pendingCommand]}</strong>? As edições manuais atuais serão perdidas.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={cancelOverwrite}>Manter meus dados</Button>
              <Button size="sm" onClick={confirmOverwrite} className="gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Substituir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}

/* ─── Execute Template Dialog ─── */

function ExecuteTemplateDialog({
  template,
  onClose,
}: {
  template: BulkTemplate;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"queue" | "schedule">("queue");
  const [everyDay, setEveryDay] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [timeUtc, setTimeUtc] = useState("12:00");
  const [scheduleName, setScheduleName] = useState(`${template.label} — Agendamento`);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const needsConfirm = template.command_key === "grantMallCash" || template.requires_confirmation;

  const handleExecute = async () => {
    setExecuting(true);
    setError(null);
    setResult(null);
    try {
      const payload: Record<string, unknown> = {
        template_key: template.template_key,
        mode,
      };
      if (needsConfirm && template.command_key === "grantMallCash") {
        payload.confirm = "GRANT_MALL_CASH";
      }
      if (mode === "schedule") {
        payload.schedule = {
          ...(everyDay
            ? { every_day: true }
            : { weekdays: [dayOfWeek] }),
          time_of_day: timeUtc,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          name: scheduleName,
          enabled: true,
        };
      }
      const res = await pwApi.executeBulkTemplate(payload as any);
      setResult(res.job ? `Job criado: ${res.job.id}` : "Executado com sucesso");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md border-border/40 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-extrabold">
            Executar Template
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            {template.label} · <span className="font-mono">{template.template_key}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px]">Modo de execução</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as "queue" | "schedule")}>
              <SelectTrigger className="h-8 border-border/40 bg-card/60 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="queue">
                  <span className="flex items-center gap-2"><Send className="h-3 w-3" /> Fila (executar agora)</span>
                </SelectItem>
                <SelectItem value="schedule">
                  <span className="flex items-center gap-2"><Calendar className="h-3 w-3" /> Agendamento semanal</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "schedule" && (
            <div className="space-y-3 rounded-lg border border-border/30 bg-card/30 p-3">
              <div className="space-y-1.5">
                <Label className="text-[11px]">Nome do agendamento</Label>
                <Input
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  className="h-8 border-border/40 bg-card/60 text-xs"
                />
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Switch checked={everyDay} onCheckedChange={setEveryDay} />
                Todo dia
              </label>
              <div className={cn("grid gap-3", everyDay ? "grid-cols-1" : "grid-cols-2")}>
                {!everyDay && (
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Dia da semana</Label>
                    <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(Number(v))}>
                      <SelectTrigger className="h-8 border-border/40 bg-card/60 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAY_NAMES.map((d, i) => (
                          <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Horário UTC</Label>
                  <Input
                    type="time"
                    value={timeUtc}
                    onChange={(e) => setTimeUtc(e.target.value)}
                    className="h-8 border-border/40 bg-card/60 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {needsConfirm && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-[11px] text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                <strong>Confirmação obrigatória:</strong> {template.command_key === "grantMallCash"
                  ? "confirm:\"GRANT_MALL_CASH\" será enviado automaticamente."
                  : "Este template exige confirmação explícita."}
              </span>
            </div>
          )}

          {result && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {result}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <XCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={executing}>Fechar</Button>
          <Button size="sm" onClick={handleExecute} disabled={executing || !!result} className="gap-1">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : mode === "queue" ? <Play className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
            {mode === "queue" ? "Enfileirar" : "Agendar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

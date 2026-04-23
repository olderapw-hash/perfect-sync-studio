import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Copy,
  Download,
  FileUp,
  Loader2,
  Package,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  applyKitToTemplate,
  buildKitBulkPayload,
  countKitItems,
  createKitFromTemplate,
  downloadKitJson,
  kitStore,
  parseKitFromJson,
  type ApplyMode,
  type InitialKit,
  type KitIncludes,
} from "@/lib/initialKits";
import type { ClsEntry, ClsTemplate } from "@/types/clsconfig";
import { summarizeIssues, validateAllItems } from "@/lib/validateItem";
import { ValidationPanel } from "./ValidationPanel";
import { getClassInfo } from "@/lib/pwClasses";
import { invokeClsconfigProxy } from "@/lib/clsconfigInvoke";
import { saveHistory } from "@/lib/saveHistory";
import { seenBackups } from "@/lib/seenBackups";

export type KitsDialogMode = "template" | "role";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Template atual sendo editado. */
  currentTemplate: ClsTemplate;
  /** Callback quando o usuário aplicar um kit — recebe o NOVO template. */
  onApply: (next: ClsTemplate) => void;
  /** True se o usuário tem permissão para aplicar (save_templates ou save_real_roles). */
  canApply: boolean;
  /** Tooltip exibido quando canApply=false. */
  applyDeniedTitle?: string;
  /** Modo do editor — bulk apply só funciona em "template". */
  mode?: KitsDialogMode;
  /** Todas as entries carregadas (para "Aplicar em todos os CLS"). */
  allEntries?: ClsEntry[];
  /** True se o usuário pode aplicar em massa (bulk_apply). */
  canBulkApply?: boolean;
  /** Tooltip exibido quando canBulkApply=false. */
  bulkDeniedTitle?: string;
  /** Disparado após bulk apply para recarregar o getClsconfig. */
  onBulkReload?: () => void;
}

type View = "list" | "create" | "apply" | "bulk_apply";

const APPLY_MODE_LABEL: Record<ApplyMode, { title: string; desc: string }> = {
  replace_section: {
    title: "Substituir seções inteiras",
    desc: "Apaga o conteúdo atual de cada seção e usa apenas o que está no kit.",
  },
  merge_empty: {
    title: "Mesclar apenas em slots vazios",
    desc: "Mantém tudo que já existe; preenche apenas slots vazios com itens do kit.",
  },
  replace_conflict: {
    title: "Substituir slots conflitantes",
    desc: "Mantém o que já existe; em slots com mesma posição, o kit vence.",
  },
};

export const InitialKitsDialog = ({
  open,
  onOpenChange,
  currentTemplate,
  onApply,
  canApply,
  applyDeniedTitle,
  mode = "template",
  allEntries = [],
  canBulkApply = false,
  bulkDeniedTitle,
  onBulkReload,
}: Props) => {
  const isTemplateMode = mode === "template";
  const bulkAvailable = isTemplateMode && allEntries.length > 0;
  const [view, setView] = useState<View>("list");
  const [kits, setKits] = useState<InitialKit[]>(() => kitStore.list());
  const [selectedKit, setSelectedKit] = useState<InitialKit | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = () => setKits(kitStore.list());

  const reset = () => {
    setView("list");
    setSelectedKit(null);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  // ─────────── Import ───────────
  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite reimportar mesmo arquivo
    if (!file) return;
    try {
      const text = await file.text();
      const kit = parseKitFromJson(text);
      kitStore.save(kit);
      refresh();
      toast.success(`Kit "${kit.name}" importado`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao importar";
      toast.error(`Falha na importação: ${msg}`);
    }
  };

  // ─────────── Duplicar / excluir / exportar ───────────
  const handleDuplicate = (id: string) => {
    const copy = kitStore.duplicate(id);
    if (copy) {
      refresh();
      toast.success(`Kit duplicado como "${copy.name}"`);
    }
  };

  const handleRemove = (kit: InitialKit) => {
    if (!confirm(`Excluir o kit "${kit.name}"? Esta ação não pode ser desfeita.`)) return;
    kitStore.remove(kit.id);
    refresh();
    toast.info(`Kit "${kit.name}" excluído`);
  };

  const handleExport = (kit: InitialKit) => {
    downloadKitJson(kit);
    toast.success(`Kit "${kit.name}" exportado`);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl border-border bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Kits Iniciais
          </DialogTitle>
          <DialogDescription>
            Salve um conjunto de bens (inventário, equipamentos, baú, task inventory)
            para reaplicar em qualquer template ou personagem. Identidade nunca é tocada.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImportFile}
        />

        {view === "list" && (
          <KitListView
            kits={kits}
            onCreate={() => setView("create")}
            onImport={handleImportClick}
            onApply={(k) => {
              setSelectedKit(k);
              setView("apply");
            }}
            onBulkApply={(k) => {
              setSelectedKit(k);
              setView("bulk_apply");
            }}
            onDuplicate={handleDuplicate}
            onRemove={handleRemove}
            onExport={handleExport}
            canApply={canApply}
            applyDeniedTitle={applyDeniedTitle}
            bulkAvailable={bulkAvailable}
            canBulkApply={canBulkApply}
            bulkDeniedTitle={bulkDeniedTitle}
          />
        )}

        {view === "create" && (
          <KitCreateView
            template={currentTemplate}
            onCancel={() => setView("list")}
            onSaved={() => {
              refresh();
              setView("list");
            }}
          />
        )}

        {view === "apply" && selectedKit && (
          <KitApplyView
            kit={selectedKit}
            template={currentTemplate}
            canApply={canApply}
            applyDeniedTitle={applyDeniedTitle}
            onCancel={() => setView("list")}
            onApplied={(next) => {
              onApply(next);
              toast.success(`Kit "${selectedKit.name}" aplicado — não esqueça de salvar.`);
              handleClose(false);
            }}
          />
        )}

        {view === "bulk_apply" && selectedKit && (
          <KitBulkApplyView
            kit={selectedKit}
            allEntries={allEntries}
            canBulkApply={canBulkApply}
            bulkDeniedTitle={bulkDeniedTitle}
            onCancel={() => setView("list")}
            onFinished={() => {
              onBulkReload?.();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

// ────────────────────────────────────────────────────────────
// LIST view
// ────────────────────────────────────────────────────────────

interface ListViewProps {
  kits: InitialKit[];
  onCreate: () => void;
  onImport: () => void;
  onApply: (kit: InitialKit) => void;
  onBulkApply: (kit: InitialKit) => void;
  onDuplicate: (id: string) => void;
  onRemove: (kit: InitialKit) => void;
  onExport: (kit: InitialKit) => void;
  canApply: boolean;
  applyDeniedTitle?: string;
  bulkAvailable: boolean;
  canBulkApply: boolean;
  bulkDeniedTitle?: string;
}

const KitListView = ({
  kits,
  onCreate,
  onImport,
  onApply,
  onBulkApply,
  onDuplicate,
  onRemove,
  onExport,
  canApply,
  applyDeniedTitle,
  bulkAvailable,
  canBulkApply,
  bulkDeniedTitle,
}: ListViewProps) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Criar kit do estado atual
        </Button>
        <Button onClick={onImport} variant="outline" className="gap-2">
          <FileUp className="h-4 w-4" />
          Importar JSON
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          {kits.length} kit{kits.length === 1 ? "" : "s"} salvo{kits.length === 1 ? "" : "s"}
        </span>
      </div>

      {kits.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 bg-background/40 p-8 text-center">
          <Boxes className="mx-auto h-8 w-8 text-muted-foreground/60" />
          <p className="mt-2 text-sm font-medium text-foreground">Nenhum kit ainda</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Crie um kit a partir do template atual ou importe um JSON.
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-[55vh] pr-2">
          <ul className="space-y-2">
            {kits.map((kit) => (
              <li
                key={kit.id}
                className="rounded-lg border border-border bg-background/40 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {kit.name}
                      </span>
                      <KitTargetBadge cls={kit.target_cls} />
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono text-primary">
                        {countKitItems(kit)} itens
                      </span>
                    </div>
                    {kit.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{kit.description}</p>
                    )}
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      Criado em {new Date(kit.created_at).toLocaleString()}
                      {kit.updated_at !== kit.created_at && (
                        <> · atualizado em {new Date(kit.updated_at).toLocaleString()}</>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                      {kit.includes.inventory_money && (
                        <span className="rounded bg-card px-1.5 py-0.5">+ dinheiro inv</span>
                      )}
                      {kit.includes.storehouse_money && (
                        <span className="rounded bg-card px-1.5 py-0.5">+ dinheiro baú</span>
                      )}
                      {kit.includes.task_inventory && (
                        <span className="rounded bg-card px-1.5 py-0.5">+ task inventory</span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-1">
                    <Button
                      size="sm"
                      onClick={() => onApply(kit)}
                      disabled={!canApply}
                      title={canApply ? "Aplicar este kit no editor" : applyDeniedTitle}
                      className="gap-1"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Aplicar
                    </Button>
                    {bulkAvailable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onBulkApply(kit)}
                        disabled={!canBulkApply}
                        title={
                          canBulkApply
                            ? "Aplicar este kit em todos os CLS carregados"
                            : bulkDeniedTitle
                        }
                        className="gap-1"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Aplicar em todos os CLS
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDuplicate(kit.id)}
                      title="Duplicar"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onExport(kit)}
                      title="Exportar JSON"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemove(kit)}
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
};

const KitTargetBadge = ({ cls }: { cls: number | null }) => {
  if (cls === null || cls === undefined) {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        Qualquer classe
      </span>
    );
  }
  // Tenta resolver um nome legível (race=0..5; fallback genérico).
  let name = `cls ${cls}`;
  for (const race of [0, 1, 2, 3, 4, 5]) {
    const info = getClassInfo(race, cls);
    if (info && info.name !== "Desconhecida") {
      name = info.name;
      break;
    }
  }
  return (
    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
      {name}
    </span>
  );
};

// ────────────────────────────────────────────────────────────
// CREATE view
// ────────────────────────────────────────────────────────────

interface CreateViewProps {
  template: ClsTemplate;
  onCancel: () => void;
  onSaved: () => void;
}

const KitCreateView = ({ template, onCancel, onSaved }: CreateViewProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetCls, setTargetCls] = useState<number | null>(template.summary.cls);
  const [includes, setIncludes] = useState<KitIncludes>({
    inventory_money: false,
    storehouse_money: false,
    task_inventory: false,
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Dê um nome ao kit");
      return;
    }
    const kit = createKitFromTemplate({
      name,
      description,
      target_cls: targetCls,
      includes,
      template,
    });
    kitStore.save(kit);
    toast.success(`Kit "${kit.name}" salvo (${countKitItems(kit)} itens)`);
    onSaved();
  };

  const invFilled = template.inventory.items.filter((i) => i.id > 0).length;
  const eqFilled = template.equipment.items.filter((i) => i.id > 0).length;
  const shFilled =
    template.storehouse.items.filter((i) => i.id > 0).length +
    template.storehouse.dress.filter((i) => i.id > 0).length +
    template.storehouse.material.filter((i) => i.id > 0).length +
    template.storehouse.generalcard.filter((i) => i.id > 0).length;
  const taskFilled = template.task?.task_inventory.filter((i) => i.id > 0).length ?? 0;

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-background/40 p-3 text-xs">
        <div className="mb-1 font-semibold uppercase tracking-wider text-muted-foreground">
          Capturando do template atual
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-foreground/80">
          <span>Inventário: <strong>{invFilled}</strong> itens</span>
          <span>Equipamentos: <strong>{eqFilled}</strong> itens</span>
          <span>Baú (todas): <strong>{shFilled}</strong> itens</span>
          <span>Task inventory: <strong>{taskFilled}</strong> itens</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="kit-name">Nome do kit</Label>
        <Input
          id="kit-name"
          placeholder="Ex: Kit inicial Guerreiro PvE lvl 1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="kit-desc">Descrição</Label>
        <Textarea
          id="kit-desc"
          placeholder="Notas, contexto, build..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={500}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="kit-cls">Classe alvo sugerida</Label>
        <div className="flex items-center gap-2">
          <Input
            id="kit-cls"
            type="number"
            min={0}
            max={11}
            placeholder="cls (0..11)"
            value={targetCls === null ? "" : targetCls}
            onChange={(e) => {
              const v = e.target.value.trim();
              setTargetCls(v === "" ? null : Number(v));
            }}
            className="max-w-[140px]"
          />
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => setTargetCls(null)}
          >
            Qualquer classe
          </Button>
          <span className="text-xs text-muted-foreground">
            Atual: cls {template.summary.cls}
          </span>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Incluir no kit
        </div>
        <label className="flex items-start gap-2 rounded-md border border-border bg-background/40 p-2 text-sm">
          <Checkbox
            checked={includes.inventory_money}
            onCheckedChange={(c) =>
              setIncludes((prev) => ({ ...prev, inventory_money: Boolean(c) }))
            }
          />
          <span>
            Dinheiro do inventário
            <span className="ml-2 font-mono text-xs text-muted-foreground">
              ({template.inventory.money.toLocaleString("pt-BR")})
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 rounded-md border border-border bg-background/40 p-2 text-sm">
          <Checkbox
            checked={includes.storehouse_money}
            onCheckedChange={(c) =>
              setIncludes((prev) => ({ ...prev, storehouse_money: Boolean(c) }))
            }
          />
          <span>
            Dinheiro do baú
            <span className="ml-2 font-mono text-xs text-muted-foreground">
              ({template.storehouse.money.toLocaleString("pt-BR")})
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 rounded-md border border-border bg-background/40 p-2 text-sm">
          <Checkbox
            checked={includes.task_inventory}
            onCheckedChange={(c) =>
              setIncludes((prev) => ({ ...prev, task_inventory: Boolean(c) }))
            }
            disabled={!template.task?.task_inventory}
          />
          <span>
            Task inventory
            <span className="ml-2 font-mono text-xs text-muted-foreground">
              ({taskFilled} itens)
            </span>
            {!template.task?.task_inventory && (
              <span className="ml-2 text-[10px] text-muted-foreground">
                (template atual não tem bloco task)
              </span>
            )}
          </span>
        </label>

        <p className="text-[11px] text-muted-foreground">
          NÃO incluído: base, status, task_data, task_complete, task_finishtime.
        </p>
      </div>

      <DialogFooter className="gap-2 border-t border-border pt-3">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4" />
          Cancelar
        </Button>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Salvar kit
        </Button>
      </DialogFooter>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// APPLY view
// ────────────────────────────────────────────────────────────

interface ApplyViewProps {
  kit: InitialKit;
  template: ClsTemplate;
  canApply: boolean;
  applyDeniedTitle?: string;
  onCancel: () => void;
  onApplied: (next: ClsTemplate) => void;
}

const KitApplyView = ({
  kit,
  template,
  canApply,
  applyDeniedTitle,
  onCancel,
  onApplied,
}: ApplyViewProps) => {
  const [mode, setMode] = useState<ApplyMode>("merge_empty");

  // Preview = aplicação simulada com o modo selecionado.
  const preview = useMemo(
    () => applyKitToTemplate(template, kit, { mode }),
    [template, kit, mode],
  );

  const validation = useMemo(
    () => summarizeIssues(validateAllItems(preview)),
    [preview],
  );

  const classMismatch =
    kit.target_cls !== null && kit.target_cls !== template.summary.cls;

  const handleConfirm = () => {
    if (validation.criticals.length > 0) {
      toast.error(
        `Apply bloqueado: ${validation.criticals.length} erro(s) crítico(s) detectado(s).`,
      );
      return;
    }
    onApplied(preview);
  };

  const counts = {
    inv: kit.inventory.items.filter((i) => i.id > 0).length,
    eq: kit.equipment.items.filter((i) => i.id > 0).length,
    sh: kit.storehouse.items.filter((i) => i.id > 0).length,
    dress: kit.storehouse.dress.filter((i) => i.id > 0).length,
    material: kit.storehouse.material.filter((i) => i.id > 0).length,
    general: kit.storehouse.generalcard.filter((i) => i.id > 0).length,
    task: kit.task?.task_inventory.filter((i) => i.id > 0).length ?? 0,
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-background/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">{kit.name}</span>
          <KitTargetBadge cls={kit.target_cls} />
        </div>
        {kit.description && (
          <p className="mt-1 text-xs text-muted-foreground">{kit.description}</p>
        )}
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-foreground/80 sm:grid-cols-3">
          <span>Inventário: <strong>{counts.inv}</strong></span>
          <span>Equipamentos: <strong>{counts.eq}</strong></span>
          <span>Baú itens: <strong>{counts.sh}</strong></span>
          <span>Baú dress: <strong>{counts.dress}</strong></span>
          <span>Baú material: <strong>{counts.material}</strong></span>
          <span>Baú general: <strong>{counts.general}</strong></span>
          {kit.includes.task_inventory && (
            <span>Task: <strong>{counts.task}</strong></span>
          )}
        </div>
        {(kit.includes.inventory_money || kit.includes.storehouse_money) && (
          <div className="mt-2 text-xs text-foreground/80">
            {kit.includes.inventory_money && (
              <span className="mr-3">
                Dinheiro inv: <strong className="font-mono">
                  {(kit.inventory.money ?? 0).toLocaleString("pt-BR")}
                </strong>
              </span>
            )}
            {kit.includes.storehouse_money && (
              <span>
                Dinheiro baú: <strong className="font-mono">
                  {(kit.storehouse.money ?? 0).toLocaleString("pt-BR")}
                </strong>
              </span>
            )}
          </div>
        )}
      </div>

      {classMismatch && (
        <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/5 p-2 text-xs text-warning">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Classe alvo do kit (cls {kit.target_cls}) é diferente da classe atual (cls{" "}
            {template.summary.cls}). Itens podem não ser usáveis pela classe destino.
          </span>
        </div>
      )}

      <div>
        <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Modo de aplicação
        </Label>
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as ApplyMode)}>
          {(Object.keys(APPLY_MODE_LABEL) as ApplyMode[]).map((m) => (
            <label
              key={m}
              className="flex items-start gap-2 rounded-md border border-border bg-background/40 p-2 text-sm hover:border-primary/50"
            >
              <RadioGroupItem value={m} id={`mode-${m}`} className="mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-foreground">{APPLY_MODE_LABEL[m].title}</div>
                <div className="text-xs text-muted-foreground">{APPLY_MODE_LABEL[m].desc}</div>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Validação do template pós-apply */}
      <ScrollArea className="max-h-[30vh]">
        <ValidationPanel summary={validation} />
      </ScrollArea>

      <p className="text-[11px] text-muted-foreground">
        A aplicação só altera o estado local do editor. Você ainda precisa clicar em
        <strong> Salvar</strong> para persistir na VPS (com auditoria).
      </p>

      <DialogFooter className="gap-2 border-t border-border pt-3">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4" />
          Voltar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!canApply || validation.criticals.length > 0}
          title={
            !canApply
              ? applyDeniedTitle
              : validation.criticals.length > 0
                ? "Existem erros críticos no resultado — corrija ou troque o modo de aplicação."
                : undefined
          }
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Aplicar no editor
        </Button>
      </DialogFooter>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// BULK APPLY view — aplica em todos os CLS carregados
// ────────────────────────────────────────────────────────────

interface BulkApplyViewProps {
  kit: InitialKit;
  allEntries: ClsEntry[];
  canBulkApply: boolean;
  bulkDeniedTitle?: string;
  onCancel: () => void;
  onFinished: () => void;
}

type BulkRowStatus = "pending" | "running" | "success" | "error" | "ignored";

interface BulkRowResult {
  roleid: number;
  className: string;
  cls: number;
  status: BulkRowStatus;
  message?: string;
  backupRoleJson?: string;
  backupClsconfigFile?: string;
  exportLogFile?: string;
}

const CONFIRM_PHRASE = "APLICAR KIT EM TODOS";

const extractAny = (obj: unknown, path: string[]): unknown => {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur && typeof cur === "object" && key in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return cur;
};
const extractStr = (obj: unknown, path: string[]): string | undefined => {
  const v = extractAny(obj, path);
  return typeof v === "string" ? v : undefined;
};

const KitBulkApplyView = ({
  kit,
  allEntries,
  canBulkApply,
  bulkDeniedTitle,
  onCancel,
  onFinished,
}: BulkApplyViewProps) => {
  const [mode, setMode] = useState<ApplyMode>("merge_empty");
  const [confirmText, setConfirmText] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<number, BulkRowResult>>({});
  const [done, setDone] = useState(false);

  const targets = useMemo(
    () =>
      allEntries
        .filter((e) => Number.isFinite(e.template.roleid) && e.template.roleid > 0)
        .map((e) => ({
          entry: e,
          roleid: e.template.roleid,
          className:
            e.template.summary.class_name ?? `cls ${e.template.summary.cls}`,
          cls: e.template.summary.cls,
          name: e.template.summary.name,
          mismatch: kit.target_cls !== null && kit.target_cls !== e.template.summary.cls,
        })),
    [allEntries, kit],
  );

  const mismatchCount = targets.filter((t) => t.mismatch).length;
  const phraseOk = confirmText.trim().toUpperCase() === CONFIRM_PHRASE;
  const canRun = canBulkApply && !running && !done && targets.length > 0 && phraseOk;

  const counters = useMemo(() => {
    let ok = 0,
      err = 0,
      ignored = 0;
    for (const r of Object.values(results)) {
      if (r.status === "success") ok++;
      else if (r.status === "error") err++;
      else if (r.status === "ignored") ignored++;
    }
    return { ok, err, ignored };
  }, [results]);

  const run = async () => {
    setRunning(true);
    setDone(false);

    // Inicializa o relatório com pending para todos os alvos.
    const init: Record<number, BulkRowResult> = {};
    for (const t of targets) {
      init[t.roleid] = {
        roleid: t.roleid,
        className: t.className,
        cls: t.cls,
        status: "pending",
      };
    }
    setResults(init);

    let okCount = 0;
    let errCount = 0;
    let ignoredCount = 0;

    for (const t of targets) {
      const rid = t.roleid;
      setResults((prev) => ({ ...prev, [rid]: { ...prev[rid], status: "running" } }));

      try {
        // 1. cópia do template + aplicação do kit
        const applied = applyKitToTemplate(t.entry.template, kit, { mode });

        // 2. validador avançado — bloqueia só em critical/error
        const summary = summarizeIssues(validateAllItems(applied));
        if (summary.hasBlocking) {
          ignoredCount++;
          const head = summary.criticals[0]?.message ?? summary.errors[0]?.message ?? "validação falhou";
          setResults((prev) => ({
            ...prev,
            [rid]: {
              ...prev[rid],
              status: "ignored",
              message: `Validação: ${head}`,
            },
          }));
          saveHistory.pushDiff({
            roleid: rid,
            className: t.className,
            field: `kit:${kit.name}`,
            oldValue: "(antes)",
            newValue: "(ignorado por validação)",
            status: "error",
            error: head,
          });
          continue;
        }

        // 3. payload mínimo
        const payload = buildKitBulkPayload(rid, applied, kit);

        // 4. POST clsconfig-proxy/clsconfig
        const { data, error, rawBody } = await invokeClsconfigProxy(
          "clsconfig-proxy/clsconfig",
          { method: "POST", body: payload },
        );
        if (error) {
          throw new Error(rawBody ? `${error.message}\n\n${rawBody}` : error.message);
        }
        if (data && typeof data === "object" && (data as { success?: boolean }).success === false) {
          throw new Error((data as { error?: string }).error || "save falhou");
        }

        // 5. extrai backups/export pra relatório
        const backupRoleJson =
          extractStr(data, ["saved", "backup", "file"]) ??
          extractStr(data, ["saved", "backups", "role_json", "file"]);
        const backupClsconfigFile =
          extractStr(data, ["saved", "clsconfig_file_backup", "file"]) ??
          extractStr(data, ["saved", "backups", "clsconfig_file", "file"]);
        const exportLogFile = extractStr(data, ["saved", "export", "log_file"]);

        if (backupRoleJson) seenBackups.add(rid, "role_json", backupRoleJson);
        if (backupClsconfigFile) seenBackups.add(rid, "clsconfig_file", backupClsconfigFile);

        okCount++;
        setResults((prev) => ({
          ...prev,
          [rid]: {
            ...prev[rid],
            status: "success",
            message: "Salvo",
            backupRoleJson,
            backupClsconfigFile,
            exportLogFile,
          },
        }));
        saveHistory.pushDiff({
          roleid: rid,
          className: t.className,
          field: `kit:${kit.name}`,
          oldValue: "(antes)",
          newValue: `(kit aplicado · modo ${mode})`,
          status: "ok",
        });
      } catch (e) {
        errCount++;
        const msg = e instanceof Error ? e.message : "erro";
        setResults((prev) => ({
          ...prev,
          [rid]: { ...prev[rid], status: "error", message: msg },
        }));
        saveHistory.pushDiff({
          roleid: rid,
          className: t.className,
          field: `kit:${kit.name}`,
          oldValue: "(antes)",
          newValue: "(falha)",
          status: "error",
          error: msg,
        });
        // Continua mesmo com erro — não para no primeiro.
      }
    }

    setRunning(false);
    setDone(true);

    if (errCount === 0 && ignoredCount === 0) {
      toast.success(`Kit aplicado em ${okCount} CLS`);
    } else {
      toast.warning(
        `Concluído: ${okCount} ok · ${errCount} erro(s) · ${ignoredCount} ignorado(s)`,
      );
    }
    // Recarrega o getClsconfig para refletir as mudanças.
    onFinished();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-background/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">{kit.name}</span>
          <KitTargetBadge cls={kit.target_cls} />
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono text-primary">
            {countKitItems(kit)} itens
          </span>
        </div>
        {kit.description && (
          <p className="mt-1 text-xs text-muted-foreground">{kit.description}</p>
        )}
      </div>

      <div>
        <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Modo de aplicação
        </Label>
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as ApplyMode)}>
          {(Object.keys(APPLY_MODE_LABEL) as ApplyMode[]).map((m) => (
            <label
              key={m}
              className="flex items-start gap-2 rounded-md border border-border bg-background/40 p-2 text-sm hover:border-primary/50"
            >
              <RadioGroupItem value={m} id={`bulk-mode-${m}`} className="mt-0.5" disabled={running || done} />
              <div className="flex-1">
                <div className="font-medium text-foreground">{APPLY_MODE_LABEL[m].title}</div>
                <div className="text-xs text-muted-foreground">{APPLY_MODE_LABEL[m].desc}</div>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            CLS alvo ({targets.length})
          </span>
          {mismatchCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-warning">
              <AlertTriangle className="h-3.5 w-3.5" />
              {mismatchCount} CLS com classe diferente do kit
            </span>
          )}
        </div>
        <ScrollArea className="max-h-[35vh] rounded-md border border-border bg-background/30">
          <ul className="divide-y divide-border/60 p-1">
            {targets.map((t) => {
              const r = results[t.roleid];
              return (
                <li
                  key={t.roleid}
                  className="flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-card/40"
                >
                  <span className="flex-1 truncate">
                    <span className="font-semibold text-foreground">{t.className}</span>
                    {t.name && (
                      <span className="ml-1 text-muted-foreground">· {t.name}</span>
                    )}{" "}
                    <span className="font-mono text-muted-foreground">
                      (roleid {t.roleid} · cls {t.cls})
                    </span>
                    {t.mismatch && (
                      <AlertTriangle
                        className="ml-1 inline h-3 w-3 text-warning"
                        aria-label="Classe diferente do kit"
                      />
                    )}
                  </span>
                  {r?.status === "running" && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  )}
                  {r?.status === "success" && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  )}
                  {r?.status === "ignored" && (
                    <span
                      title={r.message}
                      className="flex items-center gap-1 text-warning"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span className="max-w-[220px] truncate text-[10px]">{r.message}</span>
                    </span>
                  )}
                  {r?.status === "error" && (
                    <span
                      title={r.message}
                      className="flex items-center gap-1 text-destructive"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span className="max-w-[220px] truncate text-[10px]">{r.message}</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </div>

      {done && (
        <div className="rounded-md border border-border bg-background/40 p-3 text-xs">
          <div className="mb-2 flex flex-wrap items-center gap-3 font-semibold text-foreground">
            <span>Relatório final</span>
            <span className="rounded bg-success/10 px-2 py-0.5 text-success">
              {counters.ok} sucesso
            </span>
            <span className="rounded bg-warning/10 px-2 py-0.5 text-warning">
              {counters.ignored} ignorado(s)
            </span>
            <span className="rounded bg-destructive/10 px-2 py-0.5 text-destructive">
              {counters.err} erro(s)
            </span>
          </div>
          <ScrollArea className="max-h-[20vh]">
            <ul className="space-y-1">
              {Object.values(results).map((r) => (
                <li key={r.roleid} className="rounded bg-card/40 px-2 py-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      <span className="font-semibold text-foreground">{r.className}</span>{" "}
                      <span className="font-mono text-muted-foreground">
                        (roleid {r.roleid})
                      </span>
                    </span>
                    <span
                      className={
                        r.status === "success"
                          ? "text-success"
                          : r.status === "ignored"
                            ? "text-warning"
                            : r.status === "error"
                              ? "text-destructive"
                              : "text-muted-foreground"
                      }
                    >
                      {r.status}
                    </span>
                  </div>
                  {r.message && (
                    <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                      {r.message}
                    </div>
                  )}
                  {(r.backupRoleJson || r.backupClsconfigFile || r.exportLogFile) && (
                    <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                      {r.backupRoleJson && (
                        <span className="font-mono">role_json: {r.backupRoleJson}</span>
                      )}
                      {r.backupClsconfigFile && (
                        <span className="font-mono">cls_file: {r.backupClsconfigFile}</span>
                      )}
                      {r.exportLogFile && (
                        <span className="font-mono">export_log: {r.exportLogFile}</span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="bulk-confirm" className="text-xs text-muted-foreground">
          Para liberar o botão, digite exatamente:{" "}
          <span className="font-mono font-bold text-foreground">{CONFIRM_PHRASE}</span>
        </Label>
        <Input
          id="bulk-confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          disabled={running || done}
          placeholder={CONFIRM_PHRASE}
          className="font-mono"
        />
      </div>

      <DialogFooter className="gap-2 border-t border-border pt-3">
        <Button variant="outline" onClick={onCancel} disabled={running}>
          <X className="h-4 w-4" />
          {done ? "Fechar" : "Voltar"}
        </Button>
        {!done && (
          <Button
            onClick={run}
            disabled={!canRun}
            title={
              !canBulkApply
                ? bulkDeniedTitle
                : targets.length === 0
                  ? "Nenhum CLS carregado para aplicar"
                  : !phraseOk
                    ? `Digite "${CONFIRM_PHRASE}" para confirmar`
                    : undefined
            }
            className="gap-2"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {running ? "Aplicando..." : `Aplicar em ${targets.length} CLS`}
          </Button>
        )}
      </DialogFooter>
    </div>
  );
};

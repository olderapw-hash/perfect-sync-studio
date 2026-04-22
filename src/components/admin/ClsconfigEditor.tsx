import { useEffect, useState } from "react";
import {
  RotateCcw,
  Save,
  User,
  Activity,
  Backpack,
  Sword,
  Warehouse,
  Loader2,
  Bookmark,
  Send,
  ArrowRightLeft,
  AlertTriangle,
  UserCog,
} from "lucide-react";
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
import type { ClsEntry, ClsItem, ClsTemplate } from "@/types/clsconfig";
import {
  buildInventoryPayload,
  buildSavePayload,
  buildStatusPayload,
  diffSimpleStatus,
  normalizeClsconfigResponse,
  onlyInventoryChanged,
  onlySimpleStatusChanged,
  SIMPLE_STATUS_FIELDS,
  type SimpleStatusField,
} from "@/lib/clsconfig";
import { validateTemplateItems } from "@/lib/validateItem";
import { saveHistory } from "@/lib/saveHistory";
import { seenBackups } from "@/lib/seenBackups";
import { buildClassIconUrl } from "@/lib/pwIcons";
import { supabase } from "@/integrations/supabase/client";
import { pwApi, EndpointMissingError } from "@/lib/pwApiActions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BaseTab } from "./BaseTab";
import { StatusTab } from "./StatusTab";
import { InventoryTab } from "./InventoryTab";
import { EquipmentTab } from "./EquipmentTab";
import { StorehouseTab } from "./StorehouseTab";
import { SavePreviewDialog } from "./SavePreviewDialog";
import { SaveChecklistDialog, type SaveChecklistResult } from "./SaveChecklistDialog";
import { PresetsDialog } from "./PresetsDialog";
import { BulkApplyDialog } from "./BulkApplyDialog";
import { CompareClsDialog } from "./CompareClsDialog";

/**
 * Modo de operação:
 *  - "template" → editor original do CLS (saveClsconfigTemplate, exportclsconfig automático).
 *  - "role"     → personagem real existente (saveRoleEditable, sem export por padrão).
 */
export type ClsconfigEditorMode = "template" | "role";

interface Props {
  entry: ClsEntry;
  /** Todas as entries carregadas — necessário para "Aplicar em massa" e "Comparar". */
  allEntries?: ClsEntry[];
  /** Modo de save. Default: "template". */
  mode?: ClsconfigEditorMode;
  /** Callback chamado após save bem-sucedido com o template recém-persistido. */
  onSaved?: (template: ClsTemplate) => void;
}

type TabKey = "base" | "status" | "inventory" | "equipment" | "storehouse";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "base", label: "Base", icon: User },
  { key: "status", label: "Status", icon: Activity },
  { key: "inventory", label: "Inventário", icon: Backpack },
  { key: "equipment", label: "Equipamentos", icon: Sword },
  { key: "storehouse", label: "Baú", icon: Warehouse },
];

/** Lê um caminho aninhado em objeto destrutivo. Retorna string ou undefined. */
const extractPath = (obj: unknown, path: string[]): string | undefined => {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur && typeof cur === "object" && key in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
};

/** Lê um caminho aninhado e retorna o valor bruto (não força string). */
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

export const ClsconfigEditor = ({ entry, allEntries = [], mode = "template", onSaved }: Props) => {
  const [template, setTemplate] = useState<ClsTemplate>(entry.template);
  const [tab, setTab] = useState<TabKey>("base");
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [checklistResult, setChecklistResult] = useState<SaveChecklistResult | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  /** Apenas modo "role": opt-in para disparar exportclsconfig após o save. */
  const [exportClsconfigForRole, setExportClsconfigForRole] = useState(false);
  /** Apenas modo "role": confirmação forte ANTES de chamar runSave. */
  const [roleConfirmOpen, setRoleConfirmOpen] = useState(false);

  const isRoleMode = mode === "role";

  // Reset when switching entry
  useEffect(() => {
    setTemplate(entry.template);
    setTab("base");
  }, [entry.key_hex]);

  const dirty = JSON.stringify(template) !== JSON.stringify(entry.template);

  const handleReset = () => {
    setTemplate(entry.template);
    toast.info("Template restaurado para a versão original");
  };

  /** Abre o diálogo de preview (validação acontece aqui — bloqueia se houver erro). */
  const handleSave = () => {
    if (saving) return;
    const errs = validateTemplateItems(template);
    if (errs.length > 0) {
      // Mostra primeiros 3 erros no toast — resto vai pro console.
      const head = errs.slice(0, 3).map((e) => "• " + e.message).join("\n");
      const tail = errs.length > 3 ? `\n…e mais ${errs.length - 3} erro(s)` : "";
      toast.error(`Validação falhou:\n${head}${tail}`, { duration: 8000 });
      console.warn("[clsconfig] validação de itens →", errs);
      return;
    }
    if (isRoleMode) {
      // Modo personagem real → confirmação forte ANTES do preview.
      setRoleConfirmOpen(true);
      return;
    }
    setPreviewOpen(true);
  };

  /** Disparado pelo modal de confirmação do modo "role" — abre o preview real. */
  const confirmRoleEdit = () => {
    setRoleConfirmOpen(false);
    setPreviewOpen(true);
  };

  /**
   * Salva no modo "role" (personagem real existente).
   *
   * - Endpoint: pwApi.saveRoleEditable (NÃO clsconfig).
   * - Payload: template completo via buildSavePayload (sem cultivation/decoded/npc_relation).
   * - Verificação: getRoleEditable do mesmo roleid (NÃO getClsconfig).
   * - exportclsconfig: opt-in via `exportClsconfigForRole`.
   * - Restrição clsconfig_template_roleids NÃO se aplica aqui.
   */
  const runSaveRoleEditable = async () => {
    const className =
      template.summary.class_name ?? `Roleid real ${entry.template.roleid}`;
    setSaving(true);
    let lastResponse: Record<string, unknown> | null = null;

    try {
      const payload = buildSavePayload(entry, template);
      const savedRoleid = payload.roleid;

      const res = await pwApi.saveRoleEditable({
        roleid: savedRoleid,
        template: payload.template,
        export: exportClsconfigForRole,
      });
      lastResponse = res as unknown as Record<string, unknown>;

      if (res?.online) {
        toast.error(
          "Personagem está ONLINE — peça kick antes de salvar (mudanças podem ser sobrescritas no logout)",
          { duration: 9000 },
        );
        setPreviewOpen(false);
        setChecklistResult({
          saved: false,
          verified: false,
          error: "Personagem online — operação recusada pelo servidor",
        });
        return;
      }
      if (!res?.success) {
        throw new Error(res?.error || "saveRoleEditable falhou");
      }

      // Releitura para verificar persistência real (não usa getClsconfig).
      let freshTemplate: ClsTemplate | null = null;
      try {
        const reread = await pwApi.getRoleEditable(savedRoleid);
        const rawTpl = (reread?.template ?? (reread as unknown as { role?: unknown })?.role) as unknown;
        if (rawTpl && typeof rawTpl === "object") {
          freshTemplate = rawTpl as ClsTemplate;
        }
      } catch (e) {
        console.warn("[role] getRoleEditable releitura falhou:", e);
      }

      // Histórico — registra um snapshot do save bem-sucedido.
      saveHistory.pushDiff({
        roleid: savedRoleid,
        className,
        field: `roleEditable.${tab}`,
        oldValue: "(antes)",
        newValue: "(template completo aplicado)",
        status: "ok",
      });

      toast.success(
        `Personagem real ${savedRoleid} atualizado${
          res.applied?.length ? ` (${res.applied.length} campo(s))` : ""
        }`,
      );

      if (freshTemplate) {
        entry.template = freshTemplate;
        setTemplate(freshTemplate);
        onSaved?.(freshTemplate);
      } else {
        // Sem releitura disponível — mantém o template editado como referência.
        onSaved?.(template);
      }

      const verifiedFromBody =
        extractAny(lastResponse, ["saved", "verified"]) === true ||
        extractAny(lastResponse, ["verified"]) === true ||
        Boolean(freshTemplate);
      const backupRoleJson =
        extractPath(lastResponse, ["saved", "backup", "file"]) ??
        extractPath(lastResponse, ["saved", "backups", "role_json", "file"]) ??
        extractPath(lastResponse, ["backups", "role_json", "file"]);
      const exportLogFile = extractPath(lastResponse, ["saved", "export", "log_file"]);
      const exportScheduled =
        extractAny(lastResponse, ["saved", "export", "scheduled"]) === true ||
        Boolean(exportLogFile);

      if (backupRoleJson) {
        seenBackups.add(savedRoleid, "role_json", backupRoleJson);
      }

      setPreviewOpen(false);
      setChecklistResult({
        saved: true,
        verified: verifiedFromBody,
        backupRoleJson,
        // Em modo role NÃO geramos clsconfig_file; deixamos undefined
        // para o checklist mostrar como "não aplicável".
        backupClsconfigFile: undefined,
        exportLogFile,
        // Se o usuário não marcou export, marcamos como "não solicitado".
        exportScheduled: exportClsconfigForRole ? exportScheduled : true,
      });
    } catch (e) {
      const msg =
        e instanceof EndpointMissingError
          ? "Endpoint saveRoleEditable ainda não implementado na VPS"
          : e instanceof Error
            ? e.message
            : "Erro desconhecido ao salvar personagem";
      console.error("[role] save error →", e);
      toast.error(msg);
      saveHistory.pushDiff({
        roleid: entry.template.roleid,
        className,
        field: `roleEditable.${tab}`,
        oldValue: "(antes)",
        newValue: "(falha)",
        status: "error",
        error: msg,
      });
      setPreviewOpen(false);
      setChecklistResult({ saved: false, verified: false, error: msg });
    } finally {
      setSaving(false);
    }
  };

  /** Salva de fato (chamado pelo botão "Confirmar e salvar" do preview). */
  const runSave = async () => {
    if (saving) return;

    // ─────────────── Modo "role" (personagem real) ───────────────
    // Não usa supabase.functions.invoke("clsconfig-proxy/clsconfig").
    // Envia o template completo via pwApi.saveRoleEditable. Releitura
    // de verificação usa pwApi.getRoleEditable (mesmo roleid). Não
    // dispara exportclsconfig a menos que o usuário tenha marcado.
    if (isRoleMode) {
      await runSaveRoleEditable();
      return;
    }

    const className = template.summary.class_name ?? `Classe ${template.summary.cls}`;
    const statusDiff = diffSimpleStatus(entry.template, template);
    const useStatusPatch =
      tab === "status" &&
      Object.keys(statusDiff).length > 0 &&
      onlySimpleStatusChanged(entry.template, template);
    const useInventoryPatch =
      !useStatusPatch &&
      tab === "inventory" &&
      onlyInventoryChanged(entry.template, template);

    setSaving(true);
    let lastResponse: Record<string, unknown> | null = null;
    try {
      let savedRoleid: number;
      const expectedStatus: Partial<Record<SimpleStatusField, number>> = {};
      let expectedInventory: ClsItem[] | null = null;

      const invokePost = async (body: unknown, errLabel: string) => {
        const { data, error } = await supabase.functions.invoke("clsconfig-proxy/clsconfig", {
          method: "POST",
          body,
        });
        if (error) {
          const ctx = (error as unknown as { context?: Response }).context;
          let extra = "";
          if (ctx && typeof ctx.text === "function") {
            try { extra = await ctx.text(); } catch { /* ignore */ }
          }
          throw new Error(extra ? `${error.message}\n\n${extra}` : error.message);
        }
        if (data && typeof data === "object" && (data as { success?: boolean }).success === false) {
          throw new Error((data as { error?: string }).error || errLabel);
        }
        if (data && typeof data === "object") {
          lastResponse = data as Record<string, unknown>;
        }
      };

      if (useStatusPatch) {
        const patchPayload = buildStatusPayload(entry, statusDiff);
        savedRoleid = patchPayload.roleid;
        for (const [k, v] of Object.entries(patchPayload.status)) {
          expectedStatus[k as SimpleStatusField] = v as number;
        }
        await invokePost(patchPayload, "Falha ao salvar status");
      } else if (useInventoryPatch) {
        const invPayload = buildInventoryPayload(entry, template.inventory);
        savedRoleid = invPayload.roleid;
        expectedInventory = template.inventory.items;
        await invokePost(invPayload, "Falha ao salvar inventário");
      } else {
        const payload = buildSavePayload(entry, template);
        savedRoleid = payload.roleid;
        for (const f of SIMPLE_STATUS_FIELDS) {
          expectedStatus[f] = Number(payload.template.status[f]);
        }
        await invokePost(payload, "Falha ao salvar");
      }

      // Recarrega o clsconfig completo da VPS para validar persistência real.
      const reread = await supabase.functions.invoke("clsconfig-proxy/clsconfig", { method: "GET" });
      if (reread.error) {
        throw new Error("A VPS respondeu ao save, mas falhou na confirmação de leitura");
      }

      const normalized = normalizeClsconfigResponse(reread.data);
      const freshEntry = normalized.entries.find(
        (item) => item.template.roleid === savedRoleid,
      );

      if (!freshEntry) {
        throw new Error(
          `A VPS não retornou nenhum entry para roleid ${savedRoleid} após o save`,
        );
      }

      const divergent: string[] = [];
      for (const field of Object.keys(expectedStatus) as SimpleStatusField[]) {
        const expected = expectedStatus[field];
        const persisted = freshEntry.template.status[field];
        if (expected !== persisted) {
          divergent.push(`status.${field}: enviado ${expected}, persistido ${persisted}`);
        }
      }
      if (expectedInventory) {
        const sent = expectedInventory.filter((i) => i.id > 0).length;
        const persisted = freshEntry.template.inventory.items.filter((i) => i.id > 0).length;
        if (sent !== persisted) {
          divergent.push(`inventory.items: enviados ${sent}, persistidos ${persisted}`);
        }
      }
      if (divergent.length > 0) {
        throw new Error(
          `Persistência divergente (roleid ${savedRoleid}):\n${divergent.join("\n")}`,
        );
      }

      // Histórico — registra cada campo simples que mudou.
      for (const [field, newValue] of Object.entries(expectedStatus)) {
        const oldValue = entry.template.status[field as SimpleStatusField];
        if (oldValue === newValue) continue;
        saveHistory.pushDiff({
          roleid: savedRoleid,
          className,
          field: `status.${field}`,
          oldValue,
          newValue,
          status: "ok",
        });
      }
      if (expectedInventory) {
        const oldCount = entry.template.inventory.items.filter((i) => i.id > 0).length;
        const newCount = expectedInventory.filter((i) => i.id > 0).length;
        if (oldCount !== newCount) {
          saveHistory.pushDiff({
            roleid: savedRoleid,
            className,
            field: "inventory.items (count)",
            oldValue: oldCount,
            newValue: newCount,
            status: "ok",
          });
        }
      }

      const summary = useStatusPatch
        ? Object.entries(expectedStatus).map(([k, v]) => `${k}=${v}`).join(", ")
        : "";
      toast.success(
        useStatusPatch
          ? `Status atualizado (roleid ${savedRoleid}): ${summary}`
          : useInventoryPatch
            ? `Inventário atualizado (roleid ${savedRoleid})`
            : "Alterações persistidas na VPS",
      );
      entry.template = freshEntry.template;
      setTemplate(freshEntry.template);

      // Checklist pós-save — lê de response.saved.* (estrutura real da API).
      // Aceita tanto saved.backup.file quanto saved.backups.role_json.file.
      const savedOk = Boolean(extractAny(lastResponse, ["success"]));
      const verifiedOk =
        extractAny(lastResponse, ["saved", "verified"]) === true ||
        extractAny(lastResponse, ["saved", "role"]) != null;
      const backupRoleJson =
        extractPath(lastResponse, ["saved", "backup", "file"]) ??
        extractPath(lastResponse, ["saved", "backups", "role_json", "file"]);
      const backupClsconfigFile =
        extractPath(lastResponse, ["saved", "clsconfig_file_backup", "file"]) ??
        extractPath(lastResponse, ["saved", "backups", "clsconfig_file", "file"]);
      const exportLogFile = extractPath(lastResponse, ["saved", "export", "log_file"]);
      const exportScheduled =
        extractAny(lastResponse, ["saved", "export", "scheduled"]) === true ||
        Boolean(exportLogFile);

      // Registra os backups gerados nesta sessão (alimenta a aba "Backups").
      seenBackups.add(savedRoleid, "role_json", backupRoleJson);
      seenBackups.add(savedRoleid, "clsconfig_file", backupClsconfigFile);

      setPreviewOpen(false);
      setChecklistResult({
        saved: savedOk,
        verified: verifiedOk,
        backupRoleJson,
        backupClsconfigFile,
        exportLogFile,
        exportScheduled,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido ao salvar";
      console.error("[clsconfig] save error →", e);
      toast.error(msg);
      saveHistory.pushDiff({
        roleid: entry.template.roleid,
        className: template.summary.class_name ?? `Classe ${template.summary.cls}`,
        field: tab,
        oldValue: "(estado anterior)",
        newValue: "(tentativa de save)",
        status: "error",
        error: msg,
      });
      setPreviewOpen(false);
      setChecklistResult({
        saved: false,
        verified: false,
        error: msg,
        backupRoleJson:
          extractPath(lastResponse, ["saved", "backup", "file"]) ??
          extractPath(lastResponse, ["saved", "backups", "role_json", "file"]),
        backupClsconfigFile:
          extractPath(lastResponse, ["saved", "clsconfig_file_backup", "file"]) ??
          extractPath(lastResponse, ["saved", "backups", "clsconfig_file", "file"]),
      });
    } finally {
      setSaving(false);
    }
  };

  const iconUrl = buildClassIconUrl(template.summary.class_icon_path);
  const className = template.summary.class_name ?? `Classe ${template.summary.cls}`;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/40 px-6 py-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {iconUrl && (
              <img
                src={iconUrl}
                alt={className}
                className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="min-w-0">
              <h2 className="truncate text-xl font-extrabold tracking-tight text-foreground">
                {template.summary.name || "(sem nome)"}
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/80">{className}</span>
                <span>·</span>
                {isRoleMode ? (
                  <span className="font-mono text-destructive">
                    Personagem REAL · roleid {entry.template.roleid}
                  </span>
                ) : (
                  <span className="font-mono">key {entry.key_hex.slice(0, 12)}…</span>
                )}
                <span>·</span>
                <span>cls {template.summary.cls}</span>
                <span>·</span>
                <span>raça {template.base.race}</span>
                <span>·</span>
                <span>gen {template.base.gender}</span>
                <span>·</span>
                <span>lvl {template.status.level}</span>
                <span>·</span>
                <span>cult {template.status.level2}</span>
                <span>·</span>
                <span>fama {template.status.reputation}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {dirty && (
              <span className="rounded-full bg-primary/15 px-3 py-1 text-[11px] font-medium text-primary">
                Alterações não salvas
              </span>
            )}
            {isRoleMode && (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-destructive">
                <UserCog className="h-3 w-3" />
                Modo personagem real
              </span>
            )}
            {!isRoleMode && (
              <>
                <button
                  onClick={() => setPresetsOpen(true)}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-xs transition-smooth hover:border-primary/50"
                  title="Salvar/aplicar presets locais"
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  Presets
                </button>
                <button
                  onClick={() => setCompareOpen(true)}
                  disabled={allEntries.length < 2}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-xs transition-smooth hover:border-primary/50 disabled:opacity-50"
                  title="Comparar com outro CLS"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Comparar
                </button>
                <button
                  onClick={() => setBulkOpen(true)}
                  disabled={!dirty || allEntries.length < 2}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-xs transition-smooth hover:border-primary/50 disabled:opacity-50"
                  title="Aplicar mudanças em outros roleids"
                >
                  <Send className="h-3.5 w-3.5" />
                  Aplicar em massa
                </button>
              </>
            )}
            {isRoleMode && (
              <label
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-3 py-2 text-[11px] text-muted-foreground"
                title="Por padrão NÃO disparamos exportclsconfig em personagem real."
              >
                <input
                  type="checkbox"
                  checked={exportClsconfigForRole}
                  onChange={(e) => setExportClsconfigForRole(e.target.checked)}
                  className="h-3.5 w-3.5 accent-destructive"
                />
                Disparar exportclsconfig (avançado)
              </label>
            )}
            <button
              onClick={handleReset}
              disabled={!dirty}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-sm transition-smooth hover:border-primary/50 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-glow transition-smooth hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50",
                isRoleMode
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground",
              )}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Salvando..." : isRoleMode ? "Salvar no personagem real" : "Salvar"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="mt-4 flex flex-wrap gap-1 border-b border-border/60">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-smooth",
                  "border-b-2",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === "base" && <BaseTab template={template} onChange={setTemplate} />}
        {tab === "status" && (
          <StatusTab
            template={template}
            entry={entry}
            onChange={setTemplate}
            onEntryRefreshed={(next) => {
              entry.template = next;
            }}
          />
        )}
        {tab === "inventory" && <InventoryTab template={template} onChange={setTemplate} />}
        {tab === "equipment" && <EquipmentTab template={template} onChange={setTemplate} />}
        {tab === "storehouse" && <StorehouseTab template={template} onChange={setTemplate} />}
      </div>

      <SavePreviewDialog
        open={previewOpen}
        template={template}
        saving={saving}
        onCancel={() => setPreviewOpen(false)}
        onConfirm={runSave}
      />

      <SaveChecklistDialog
        open={checklistResult != null}
        result={checklistResult}
        onClose={() => setChecklistResult(null)}
      />

      {!isRoleMode && (
        <>
          <PresetsDialog
            open={presetsOpen}
            onOpenChange={setPresetsOpen}
            currentTemplate={template}
            currentRoleid={entry.template.roleid}
            currentClassName={template.summary.class_name}
            onApply={setTemplate}
          />

          <BulkApplyDialog
            open={bulkOpen}
            onOpenChange={setBulkOpen}
            sourceEntry={entry}
            currentTemplate={template}
            allEntries={allEntries}
          />

          <CompareClsDialog
            open={compareOpen}
            onOpenChange={setCompareOpen}
            entries={allEntries}
            initialKey={entry.key_hex}
          />
        </>
      )}

      {/* Confirmação forte ANTES do save em personagem real. */}
      <AlertDialog
        open={roleConfirmOpen}
        onOpenChange={(o) => !saving && setRoleConfirmOpen(o)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Salvar no personagem REAL roleid {entry.template.roleid}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p className="font-semibold text-foreground">
                  Personagem deve estar offline. Se estiver online, o servidor
                  pode sobrescrever as alterações no logout.
                </p>
                <ul className="ml-4 list-disc space-y-1 text-xs text-muted-foreground">
                  <li>
                    Endpoint usado: <code className="font-mono">saveRoleEditable</code>{" "}
                    (NÃO <code className="font-mono">saveClsconfigTemplate</code>).
                  </li>
                  <li>
                    Backup automático do <code className="font-mono">role_json</code> é
                    gerado pela VPS antes de aplicar.
                  </li>
                  <li>
                    {exportClsconfigForRole
                      ? "exportclsconfig SERÁ disparado (você marcou a opção avançada)."
                      : "exportclsconfig NÃO será disparado (padrão para personagem real)."}
                  </li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmRoleEdit();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, abrir preview
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

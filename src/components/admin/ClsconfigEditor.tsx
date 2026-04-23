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
  ScrollText,
  ArrowRightLeft,
  AlertTriangle,
  UserCog,
  History,
  Sparkles,
  Eraser,
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
import { summarizeIssues, validateAllItems, type ItemIssue } from "@/lib/validateItem";
import { saveHistory } from "@/lib/saveHistory";
import { handleMaybeAuthError, handleMaybeForbiddenError } from "@/lib/authErrors";
import { seenBackups } from "@/lib/seenBackups";
import { buildClassIconUrl } from "@/lib/pwIcons";
import { invokeClsconfigProxy } from "@/lib/clsconfigInvoke";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { pwApi, EndpointMissingError } from "@/lib/pwApiActions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BaseTab } from "./BaseTab";
import { StatusTab } from "./StatusTab";
import { InventoryTab } from "./InventoryTab";
import { EquipmentTab } from "./EquipmentTab";
import { StorehouseTab } from "./StorehouseTab";
import { TaskTab } from "./TaskTab";
import { SavePreviewDialog } from "./SavePreviewDialog";
import { SaveChecklistDialog, type SaveChecklistResult } from "./SaveChecklistDialog";
import { PresetsDialog } from "./PresetsDialog";
import { BulkApplyDialog } from "./BulkApplyDialog";
import { BulkClearInventoryDialog } from "./BulkClearInventoryDialog";
import { CompareClsDialog } from "./CompareClsDialog";
import { RoleidHistoryDialog } from "./RoleidHistoryDialog";
import { InitialKitsDialog } from "./InitialKitsDialog";
import { useTenant } from "@/hooks/useTenant";
import { useCharacterPhoto } from "@/hooks/useCharacterPhoto";

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
  /** Callback para recarregar o getClsconfig completo (usado após bulk apply de kit). */
  onReload?: () => void;
}

type TabKey = "base" | "status" | "inventory" | "equipment" | "storehouse" | "task";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "base", label: "Base", icon: User },
  { key: "status", label: "Status", icon: Activity },
  { key: "inventory", label: "Inventário", icon: Backpack },
  { key: "equipment", label: "Equipamentos", icon: Sword },
  { key: "storehouse", label: "Baú", icon: Warehouse },
  { key: "task", label: "Tarefas", icon: ScrollText },
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

export const ClsconfigEditor = ({ entry, allEntries = [], mode = "template", onSaved, onReload }: Props) => {
  const [template, setTemplate] = useState<ClsTemplate>(entry.template);
  const [tab, setTab] = useState<TabKey>("base");
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [checklistResult, setChecklistResult] = useState<SaveChecklistResult | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkClearInvOpen, setBulkClearInvOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [kitsOpen, setKitsOpen] = useState(false);
  /** Apenas modo "role": opt-in para disparar exportclsconfig após o save. */
  const [exportClsconfigForRole, setExportClsconfigForRole] = useState(false);
  /** Apenas modo "role": confirmação forte ANTES de chamar runSave. */
  const [roleConfirmOpen, setRoleConfirmOpen] = useState(false);

  const { can } = useServerPermissions();
  const { tenant } = useTenant();
  const isRoleMode = mode === "role";
  const requiredSavePerm = isRoleMode ? "save_real_roles" : "save_templates";
  const canSave = can(requiredSavePerm);
  const canBulkApply = can("bulk_apply");
  const canBulkClearInv = !isRoleMode && canBulkApply && can("save_templates");
  const canCompare = can("compare_backup");
  const permDeniedTitle = "Seu acesso não permite esta ação.";

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

  /**
   * Abre o diálogo de preview. A validação completa (inclusive avisos) é
   * mostrada dentro do `SavePreviewDialog`. Aqui só bloqueamos a abertura
   * quando há erros críticos/erros — avisos NÃO impedem abrir o preview,
   * mas exigem confirmação extra antes do save.
   */
  const handleSave = () => {
    if (saving) return;
    const summary = summarizeIssues(validateAllItems(template));
    if (summary.hasBlocking) {
      const blocking = [...summary.criticals, ...summary.errors];
      const head = blocking.slice(0, 3).map((e) => "• " + e.message).join("\n");
      const tail = blocking.length > 3 ? `\n…e mais ${blocking.length - 3} erro(s)` : "";
      toast.error(
        `${blocking.length} erro(s) impedem salvar:\n${head}${tail}`,
        { duration: 8000 },
      );
      console.warn("[clsconfig] validação de itens →", summary.issues);
      // Tenta abrir a tab do primeiro problema pra ajudar a localizar.
      const first = blocking[0];
      if (first?.tab) setTab(first.tab as TabKey);
      return;
    }
    if (isRoleMode) {
      // Modo personagem real → confirmação forte ANTES do preview.
      setRoleConfirmOpen(true);
      return;
    }
    setPreviewOpen(true);
  };

  /** Abre a tab correspondente ao issue clicado no painel de validação. */
  const handleIssueClick = (issue: ItemIssue) => {
    if (issue.tab) setTab(issue.tab as TabKey);
    setPreviewOpen(false);
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
      if (!handleMaybeAuthError(e) && !handleMaybeForbiddenError(e)) toast.error(msg);
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
        const { data, error, rawBody } = await invokeClsconfigProxy("clsconfig-proxy/clsconfig", {
          method: "POST",
          body,
        });
        if (error) {
          throw new Error(rawBody ? `${error.message}\n\n${rawBody}` : error.message);
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
      const reread = await invokeClsconfigProxy("clsconfig-proxy/clsconfig", { method: "GET" });
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
      if (!handleMaybeAuthError(e) && !handleMaybeForbiddenError(e)) toast.error(msg);
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

  const fallbackIconUrl = buildClassIconUrl(template.summary.class_icon_path);
  const className = template.summary.class_name ?? `Classe ${template.summary.cls}`;
  const { url: iconUrl } = useCharacterPhoto({
    roleid: entry.template.roleid ?? 0,
    cls: template.summary.cls,
    fallbackUrl: fallbackIconUrl,
  });

  const activeTabMeta = TABS.find((t) => t.key === tab) ?? TABS[0];
  const ActiveTabIcon = activeTabMeta.icon;

  return (
    <div className="flex h-full flex-col bg-hero-profile">
      {/* ─────────── Header de personagem (vitrine) ─────────── */}
      <header className="px-3 pt-3 pb-2 sm:px-5 lg:px-6">
        <div className="frame-bronze relative overflow-hidden p-3 sm:p-4">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, hsl(38 70% 50% / 0.35), transparent 70%)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-12 right-0 h-40 w-40 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, hsl(28 60% 35% / 0.4), transparent 70%)" }}
          />

          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="avatar-frame shrink-0">
                <div className="flex h-14 w-14 items-center justify-center sm:h-16 sm:w-16">
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt={className}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <User className="h-6 w-6 text-bronze" />
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    className="truncate font-serif text-lg font-extrabold tracking-tight text-bronze sm:text-xl"
                    style={{ textShadow: "0 2px 10px hsl(38 70% 40% / 0.45)" }}
                  >
                    {template.summary.name || "(sem nome)"}
                  </h1>
                  <span className="pill-gold py-0.5 text-[11px]">
                    <span className="opacity-70">LV</span>
                    <span className="text-sm font-black tracking-tight">{template.status.level}</span>
                    {template.status.level2 > 0 && <span className="opacity-70">·{template.status.level2}</span>}
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-medium text-bronze-muted">
                  <span className="text-bronze/90">{className}</span>
                  <span className="mx-1.5 opacity-40">•</span>
                  <span>Cult {template.status.level2}</span>
                  <span className="mx-1.5 opacity-40">•</span>
                  <span>
                    {template.base.gender === 0 ? "♂" : template.base.gender === 1 ? "♀" : `g${template.base.gender}`}
                  </span>
                  <span className="mx-1.5 opacity-40">•</span>
                  <span>Raça {template.base.race}</span>
                  <span className="mx-1.5 opacity-40">•</span>
                  <span>Fama {template.status.reputation}</span>
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {isRoleMode ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-destructive/50 bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
                      <UserCog className="h-2.5 w-2.5" />
                      Real · {entry.template.roleid}
                    </span>
                  ) : (
                    <span className="rounded-full border border-bronze-soft bg-card/40 px-2 py-0.5 font-mono text-[10px] text-bronze-muted">
                      {entry.key_hex.slice(0, 10)}…
                    </span>
                  )}
                  {dirty && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/50 bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary animate-pulse-glow">
                      ● Não salvo
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {!isRoleMode && (
                <>
                  <button
                    onClick={() => setPresetsOpen(true)}
                    className="inline-flex items-center gap-1 rounded-full border border-bronze-soft bg-card/50 px-2.5 py-1 text-[11px] font-semibold text-bronze-muted transition hover:border-primary/60 hover:text-bronze"
                    title="Salvar/aplicar presets locais"
                  >
                    <Bookmark className="h-3 w-3" />
                    Presets
                  </button>
                  <button
                    onClick={() => setCompareOpen(true)}
                    disabled={allEntries.length < 2 || !canCompare}
                    className="inline-flex items-center gap-1 rounded-full border border-bronze-soft bg-card/50 px-2.5 py-1 text-[11px] font-semibold text-bronze-muted transition hover:border-primary/60 hover:text-bronze disabled:opacity-40"
                    title={canCompare ? "Comparar com outro CLS" : permDeniedTitle}
                  >
                    <ArrowRightLeft className="h-3 w-3" />
                    Comparar
                  </button>
                  <button
                    onClick={() => setBulkOpen(true)}
                    disabled={!dirty || allEntries.length < 2 || !canBulkApply}
                    className="inline-flex items-center gap-1 rounded-full border border-bronze-soft bg-card/50 px-2.5 py-1 text-[11px] font-semibold text-bronze-muted transition hover:border-primary/60 hover:text-bronze disabled:opacity-40"
                    title={canBulkApply ? "Aplicar mudanças em outros roleids" : permDeniedTitle}
                  >
                    <Send className="h-3 w-3" />
                    Em massa
                  </button>
                  <button
                    onClick={() => setBulkClearInvOpen(true)}
                    disabled={allEntries.length === 0 || !canBulkClearInv}
                    className="inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive transition hover:border-destructive/70 hover:bg-destructive/20 disabled:opacity-40"
                    title={
                      canBulkClearInv
                        ? "Esvazia o inventário de TODOS os templates carregados"
                        : permDeniedTitle
                    }
                  >
                    <Eraser className="h-3 w-3" />
                    Limpar
                  </button>
                </>
              )}
              {isRoleMode && (
                <label
                  className="inline-flex items-center gap-1 rounded-full border border-bronze-soft bg-card/50 px-2.5 py-1 text-[10px] text-bronze-muted"
                  title="Por padrão NÃO disparamos exportclsconfig em personagem real."
                >
                  <input
                    type="checkbox"
                    checked={exportClsconfigForRole}
                    onChange={(e) => setExportClsconfigForRole(e.target.checked)}
                    className="h-3 w-3 accent-destructive"
                  />
                  exportclsconfig
                </label>
              )}
              <button
                onClick={() => setKitsOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-bronze-soft bg-card/50 px-2.5 py-1 text-[11px] font-semibold text-bronze-muted transition hover:border-primary/60 hover:text-bronze"
                title="Kits iniciais por classe"
              >
                <Sparkles className="h-3 w-3" />
                Kits
              </button>
              <button
                onClick={() => setHistoryOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-bronze-soft bg-card/50 px-2.5 py-1 text-[11px] font-semibold text-bronze-muted transition hover:border-primary/60 hover:text-bronze"
                title="Histórico de backups role_json"
              >
                <History className="h-3 w-3" />
                Histórico
              </button>
              <button
                onClick={handleReset}
                disabled={!dirty}
                className="inline-flex items-center gap-1 rounded-full border border-bronze-soft bg-card/50 px-2.5 py-1 text-[11px] font-semibold text-bronze-muted transition hover:border-primary/60 hover:text-bronze disabled:opacity-40"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !dirty || !canSave}
                title={canSave ? undefined : permDeniedTitle}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50",
                  isRoleMode
                    ? "bg-destructive text-destructive-foreground shadow-[0_4px_16px_hsl(0_70%_45%/0.4)] hover:brightness-110"
                    : "bg-gradient-to-br from-[hsl(38_75%_60%)] to-[hsl(32_60%_40%)] text-[hsl(28_30%_10%)] shadow-[0_4px_18px_hsl(38_60%_40%/0.45)] hover:brightness-110",
                )}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? "Salvando..." : isRoleMode ? "Salvar real" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─────────── Navegação modular ─────────── */}
      <nav className="px-3 pb-2 sm:px-5 lg:px-6">
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                data-active={active}
                onClick={() => setTab(t.key)}
                className="nav-card group !p-2 !gap-2"
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition",
                    active
                      ? "border-primary/60 bg-primary/15 text-primary shadow-[0_0_14px_hsl(38_70%_50%/0.35)]"
                      : "border-bronze-soft bg-black/30 text-bronze-muted group-hover:text-bronze",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-semibold tracking-wide">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ─────────── Painel principal ─────────── */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 sm:px-5 lg:px-6">
        <section key={tab} className="frame-bronze relative animate-fade-in-up">
          <header className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3 pb-2 sm:px-5">
            <div className="flex items-center gap-2">
              <ActiveTabIcon className="h-4 w-4 text-bronze" />
              <h2
                className="font-serif text-base font-bold tracking-wide text-bronze sm:text-lg"
                style={{ textShadow: "0 2px 8px hsl(38 70% 40% / 0.35)" }}
              >
                {activeTabMeta.label}
              </h2>
            </div>
            <div className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-bronze-muted sm:block">
              {className} · LV {template.status.level}
            </div>
          </header>
          <div className="ornate-divider mx-5 mb-3 opacity-60" />
          <div className="px-3 pb-4 sm:px-5">
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
            {tab === "task" && <TaskTab template={template} onChange={setTemplate} />}
          </div>
        </section>
      </div>


      <SavePreviewDialog
        open={previewOpen}
        template={template}
        saving={saving}
        onCancel={() => setPreviewOpen(false)}
        onConfirm={runSave}
        onIssueClick={handleIssueClick}
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

          <BulkClearInventoryDialog
            open={bulkClearInvOpen}
            onOpenChange={setBulkClearInvOpen}
            allEntries={allEntries}
            tenantId={tenant?.id}
            onBulkReload={onReload}
          />

          <CompareClsDialog
            open={compareOpen}
            onOpenChange={setCompareOpen}
            entries={allEntries}
            initialKey={entry.key_hex}
          />
        </>
      )}

      <InitialKitsDialog
        open={kitsOpen}
        onOpenChange={setKitsOpen}
        currentTemplate={template}
        canApply={canSave}
        applyDeniedTitle={permDeniedTitle}
        onApply={(next) => setTemplate(next)}
        mode={mode}
        allEntries={allEntries}
        canBulkApply={!isRoleMode && canBulkApply && can("save_templates")}
        bulkDeniedTitle={permDeniedTitle}
        onBulkReload={onReload}
      />

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

      <RoleidHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        roleid={entry.template.roleid}
        className={template.summary.class_name ?? `Classe ${template.summary.cls}`}
        onRestored={() => {
          // Após restore (parcial ou total), recarrega o estado do editor.
          if (isRoleMode) {
            // Em modo role, refaz getRoleEditable e atualiza o template.
            void (async () => {
              try {
                const reread = await pwApi.getRoleEditable(entry.template.roleid);
                const rawTpl = (reread?.template ?? (reread as unknown as { role?: unknown })?.role) as unknown;
                if (rawTpl && typeof rawTpl === "object") {
                  const fresh = rawTpl as ClsTemplate;
                  entry.template = fresh;
                  setTemplate(fresh);
                  onSaved?.(fresh);
                }
              } catch (e) {
                console.warn("[history] reload getRoleEditable falhou:", e);
              }
            })();
          } else {
            onSaved?.(entry.template);
          }
        }}
      />
    </div>
  );
};

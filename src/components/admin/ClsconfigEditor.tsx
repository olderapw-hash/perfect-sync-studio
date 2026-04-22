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
} from "lucide-react";
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
import { buildClassIconUrl } from "@/lib/pwIcons";
import { supabase } from "@/integrations/supabase/client";
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

interface Props {
  entry: ClsEntry;
  /** Todas as entries carregadas — necessário para "Aplicar em massa" e "Comparar". */
  allEntries?: ClsEntry[];
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

export const ClsconfigEditor = ({ entry, allEntries = [] }: Props) => {
  const [template, setTemplate] = useState<ClsTemplate>(entry.template);
  const [tab, setTab] = useState<TabKey>("base");
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [checklistResult, setChecklistResult] = useState<SaveChecklistResult | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

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
    setPreviewOpen(true);
  };

  /** Salva de fato (chamado pelo botão "Confirmar e salvar" do preview). */
  const runSave = async () => {
    if (saving) return;

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

      // Checklist pós-save — extrai caminhos de backup/export da response do save.
      setPreviewOpen(false);
      setChecklistResult({
        saved: true,
        verified: true,
        backupRoleJson: extractPath(lastResponse, ["backups", "role_json", "file"]) ??
          extractPath(lastResponse, ["backup_role_json"]),
        backupClsconfigFile: extractPath(lastResponse, ["backups", "clsconfig_file", "file"]) ??
          extractPath(lastResponse, ["backup_clsconfig_file"]),
        exportLogFile: extractPath(lastResponse, ["export", "log_file"]) ??
          extractPath(lastResponse, ["export_log_file"]),
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
        backupRoleJson: extractPath(lastResponse, ["backups", "role_json", "file"]) ?? undefined,
        backupClsconfigFile: extractPath(lastResponse, ["backups", "clsconfig_file", "file"]) ?? undefined,
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
                <span className="font-mono">key {entry.key_hex.slice(0, 12)}…</span>
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
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Salvando..." : "Salvar"}
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
    </div>
  );
};

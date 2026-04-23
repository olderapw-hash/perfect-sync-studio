// View para EDITAR os slots de um kit (cloud ou local) — PR2 do Catálogo Avançado.
//
// Regras-chave:
//  - SÓ edita conteúdo de itens. Nunca toca em base/status/roleid/name/cls/race/
//    gender/task_data/task_complete/task_finishtime.
//  - Cloud kit: precisa de save_templates OU manage_kits (para servidor) +
//    é o criador (privado). Caller passa `canEdit`.
//  - Local kit: precisa de usuário autenticado. Caller passa `canEdit`.
//  - Adiciona item via ItemCatalogAdvancedDialog → ItemInsertModal. NUNCA salva
//    automaticamente — só altera o estado local (kit em edição).
//  - Salvar dispara updateKitPayload (cloud) OU kitStore.save (local).
//  - Validação por seção via validateAllItems (template sintético).
//  - Auditoria: item.add_to_kit, initial_kit.update, initial_kit.slot_clear.
import { useMemo, useState } from "react";
import {
  Boxes,
  Eraser,
  Loader2,
  Lock,
  Package,
  Save,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ValidationPanel } from "./ValidationPanel";
import { ItemCatalogAdvancedDialog } from "./ItemCatalogAdvancedDialog";
import type { ClsItem, ClsTemplate } from "@/types/clsconfig";
import {
  countKitItems,
  kitStore,
  type InitialKit,
} from "@/lib/initialKits";
import { useItemCatalog } from "@/context/ItemCatalogContext";
import { summarizeIssues, validateAllItems } from "@/lib/validateItem";
import { logAuditEvent } from "@/lib/auditLog";
import {
  type InsertContextMap,
  type InsertDestination,
  type InsertResult,
} from "./ItemInsertModal";
import { getEquipmentSlotLabel } from "@/lib/equipmentSlots";

type SectionKey =
  | "inventory.items"
  | "equipment.items"
  | "storehouse.items"
  | "storehouse.dress"
  | "storehouse.material"
  | "storehouse.generalcard"
  | "task.task_inventory";

const SECTION_LABELS: Record<SectionKey, string> = {
  "inventory.items": "Inventário",
  "equipment.items": "Equipamentos",
  "storehouse.items": "Baú · Itens",
  "storehouse.dress": "Baú · Roupas",
  "storehouse.material": "Baú · Material",
  "storehouse.generalcard": "Baú · Cartas",
  "task.task_inventory": "Task · Inventário",
};

const SECTION_ORDER: SectionKey[] = [
  "inventory.items",
  "equipment.items",
  "storehouse.items",
  "storehouse.dress",
  "storehouse.material",
  "storehouse.generalcard",
  "task.task_inventory",
];

interface Props {
  kit: InitialKit;
  /** Salva no cloud quando kit.source==="cloud". */
  onSaveCloud: (id: string, kit: InitialKit) => Promise<boolean>;
  /** Refresh + voltar pra lista após salvar. */
  onSaved: () => void | Promise<void>;
  onCancel: () => void;
  /** Permissão calculada pelo caller (cloud=save_templates|manage_kits, local=auth). */
  canEdit: boolean;
  /** Tooltip exibido quando canEdit=false. */
  editDeniedTitle?: string;
  /** Tenant ativo — usado em audit. Pode ser null em kit local sem servidor. */
  tenantId: string | null;
}

// Helper: extrai itens de uma seção a partir do kit.
function getSectionItems(kit: InitialKit, sec: SectionKey): ClsItem[] {
  switch (sec) {
    case "inventory.items":
      return kit.inventory.items;
    case "equipment.items":
      return kit.equipment.items;
    case "storehouse.items":
      return kit.storehouse.items;
    case "storehouse.dress":
      return kit.storehouse.dress;
    case "storehouse.material":
      return kit.storehouse.material;
    case "storehouse.generalcard":
      return kit.storehouse.generalcard;
    case "task.task_inventory":
      return kit.task?.task_inventory ?? [];
  }
}

// Helper: cria um novo kit imutável com a seção alterada.
function setSectionItems(kit: InitialKit, sec: SectionKey, items: ClsItem[]): InitialKit {
  const next: InitialKit = JSON.parse(JSON.stringify(kit));
  switch (sec) {
    case "inventory.items":
      next.inventory.items = items;
      break;
    case "equipment.items":
      next.equipment.items = items;
      break;
    case "storehouse.items":
      next.storehouse.items = items;
      break;
    case "storehouse.dress":
      next.storehouse.dress = items;
      break;
    case "storehouse.material":
      next.storehouse.material = items;
      break;
    case "storehouse.generalcard":
      next.storehouse.generalcard = items;
      break;
    case "task.task_inventory":
      if (!next.task) {
        next.task = { task_inventory: items };
      } else {
        next.task.task_inventory = items;
      }
      break;
  }
  next.updated_at = new Date().toISOString();
  return next;
}

/**
 * Constrói um ClsTemplate "sintético" a partir do kit, só pra rodar
 * `validateAllItems` (que opera em template, não em kit). Identidade fica
 * com placeholders neutros.
 */
function kitToSyntheticTemplate(kit: InitialKit): ClsTemplate {
  return {
    roleid: 0,
    summary: {
      name: kit.name,
      cls: kit.target_cls ?? 0,
      race: 0,
      gender: 0,
      level: 1,
      level2: 0,
      cultivation: 0,
      reputation: 0,
      inventory_money: kit.inventory.money ?? 0,
      inventory_items: kit.inventory.items.filter((i) => i.id > 0).length,
      equipment_items: kit.equipment.items.filter((i) => i.id > 0).length,
      storehouse_items:
        kit.storehouse.items.filter((i) => i.id > 0).length +
        kit.storehouse.dress.filter((i) => i.id > 0).length +
        kit.storehouse.material.filter((i) => i.id > 0).length +
        kit.storehouse.generalcard.filter((i) => i.id > 0).length,
    },
    base: {
      id: 0,
      name: kit.name,
      race: 0,
      cls: kit.target_cls ?? 0,
      gender: 0,
      custom_data: "",
      config_data: "",
      custom_stamp: 0,
      status: 0,
      delete_time: 0,
      create_time: 0,
      lastlogin_time: 0,
      spouse: 0,
      userid: 0,
      cross_data: "",
    },
    status: {
      level: 1,
      level2: 0,
      cultivation: 0,
      exp: 0,
      sp: 0,
      pp: 0,
      hp: 0,
      mp: 0,
      worldtag: 0,
      reputation: 0,
      posx: 0,
      posy: 0,
      posz: 0,
      storesize: 0,
      custom_status: "",
      filter_data: "",
      charactermode: 0,
      instancekeylist: "",
      dbltime_expire: 0,
      dbltime_mode: 0,
      dbltime_begin: 0,
      dbltime_used: 0,
      dbltime_max: 0,
      time_used: 0,
      petcorral: "",
      property: "",
      var_data: "",
      skills: "",
      storehousepasswd: "",
      waypointlist: "",
      coolingtime: "",
      npc_relation: "",
      multi_exp_ctrl: "",
      storage_task: "",
      faction_contrib: "",
      force_data: "",
      online_award: "",
      profit_time_data: "",
      country_data: "",
      king_data: "",
      meridian_data: "",
      extraprop: "",
      title_data: "",
      reincarnation_data: "",
      realm_data: "",
    },
    inventory: {
      capacity: Math.max(kit.inventory.items.length, 1),
      timestamp: 0,
      money: kit.inventory.money ?? 0,
      items: kit.inventory.items,
    },
    equipment: { items: kit.equipment.items },
    storehouse: {
      capacity: Math.max(kit.storehouse.items.length, 1),
      money: kit.storehouse.money ?? 0,
      items: kit.storehouse.items,
      dress: kit.storehouse.dress,
      material: kit.storehouse.material,
      generalcard: kit.storehouse.generalcard,
    },
    ...(kit.task
      ? {
          task: {
            task_data: "",
            task_complete: "",
            task_finishtime: "",
            task_inventory: kit.task.task_inventory,
          },
        }
      : {}),
  };
}

export const KitEditSlotsView = ({
  kit: kitProp,
  onSaveCloud,
  onSaved,
  onCancel,
  canEdit,
  editDeniedTitle,
  tenantId,
}: Props) => {
  const [kit, setKit] = useState<InitialKit>(kitProp);
  const [section, setSection] = useState<SectionKey>("inventory.items");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogTarget, setCatalogTarget] = useState<SectionKey>("inventory.items");
  const [saving, setSaving] = useState(false);
  const [confirmWarnings, setConfirmWarnings] = useState(false);
  const dirty = kit !== kitProp;

  const { iconUrlFor, metaFor } = useItemCatalog();

  const validation = useMemo(
    () => summarizeIssues(validateAllItems(kitToSyntheticTemplate(kit))),
    [kit],
  );

  const blocking = validation.criticals.length + validation.errors.length > 0;
  const hasWarnings = validation.warnings.length > 0;

  const sectionItems = getSectionItems(kit, section);
  const filledCount = sectionItems.filter((i) => i.id > 0).length;

  // ───── handlers
  const openCatalogFor = (sec: SectionKey) => {
    if (!canEdit) {
      toast.warning(editDeniedTitle ?? "Seu acesso não permite editar kits.");
      return;
    }
    setCatalogTarget(sec);
    setCatalogOpen(true);
  };

  const handleInsert = (res: InsertResult) => {
    if (!canEdit) return;
    const dest = res.destination as SectionKey;
    const current = getSectionItems(kit, dest);

    // Substitui slot na mesma pos OU adiciona ao final.
    const idx = current.findIndex((it) => it.pos === res.item.pos);
    let nextItems: ClsItem[];
    if (idx >= 0) {
      nextItems = current.map((it, i) => (i === idx ? res.item : it));
    } else {
      nextItems = [...current, res.item].sort((a, b) => a.pos - b.pos);
    }
    setKit((prev) => setSectionItems(prev, dest, nextItems));

    void logAuditEvent({
      action: "item.add_to_kit",
      tenantId,
      target: kit.id,
      metadata: {
        kit_id: kit.id,
        kit_name: kit.name,
        item_id: res.item.id,
        destination: dest,
        pos: res.item.pos,
        tenant_id: tenantId,
      },
    });
  };

  const removeSlot = (sec: SectionKey, pos: number) => {
    if (!canEdit) return;
    const current = getSectionItems(kit, sec);
    const nextItems = current.filter((it) => it.pos !== pos);
    setKit((prev) => setSectionItems(prev, sec, nextItems));
  };

  const clearSection = (sec: SectionKey) => {
    if (!canEdit) return;
    if (
      !confirm(
        `Limpar TODOS os itens da seção "${SECTION_LABELS[sec]}" deste kit? Isso só altera o kit em edição — você ainda precisa Salvar.`,
      )
    ) {
      return;
    }
    setKit((prev) => setSectionItems(prev, sec, []));
    void logAuditEvent({
      action: "initial_kit.slot_clear",
      tenantId,
      target: kit.id,
      metadata: {
        kit_id: kit.id,
        kit_name: kit.name,
        destination: sec,
        tenant_id: tenantId,
      },
    });
  };

  const handleSave = async () => {
    if (!canEdit) {
      toast.warning(editDeniedTitle ?? "Seu acesso não permite editar kits.");
      return;
    }
    if (blocking) {
      toast.error("Existem erros que impedem salvar — corrija na aba indicada.");
      return;
    }
    if (hasWarnings && !confirmWarnings) {
      const ok = window.confirm(
        `Há ${validation.warnings.length} aviso(s) na validação. Salvar mesmo assim?`,
      );
      if (!ok) return;
      setConfirmWarnings(true);
    }
    setSaving(true);
    try {
      if (kit.source === "cloud") {
        const ok = await onSaveCloud(kit.id, kit);
        if (!ok) {
          toast.error("Falha ao salvar no servidor (sem permissão ou erro de rede).");
          return;
        }
        toast.success(`Kit "${kit.name}" salvo no servidor (${countKitItems(kit)} itens)`);
      } else {
        kitStore.save(kit);
        toast.success(`Kit "${kit.name}" salvo localmente (${countKitItems(kit)} itens)`);
      }
      await onSaved();
    } finally {
      setSaving(false);
    }
  };

  // Contextos disponíveis no catalog dialog: a seção alvo + (opcional) outras
  // seções já existentes no kit, pra permitir trocar destino sem fechar o catálogo.
  const insertContexts: InsertContextMap = useMemo(() => {
    const out: InsertContextMap = {};
    for (const sec of SECTION_ORDER) {
      const items = getSectionItems(kit, sec);
      // Só ativa task se o kit já tiver task OU includes.task_inventory pediu.
      if (sec === "task.task_inventory" && !kit.task && !kit.includes.task_inventory) {
        continue;
      }
      out[sec as InsertDestination] = {
        items,
        capacity: Math.max(items.length, 32),
      };
    }
    return out;
  }, [kit]);

  return (
    <div className="space-y-3">
      {!canEdit && (
        <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/5 p-3 text-xs">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <div className="font-semibold text-foreground">Modo somente leitura</div>
            <p className="text-muted-foreground">
              {editDeniedTitle ?? "Seu acesso não permite editar kits."}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Boxes className="h-4 w-4 text-primary" />
          {kit.name}
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono text-primary">
          {countKitItems(kit)} itens · {kit.source === "cloud" ? "nuvem" : "local"}
        </span>
        {dirty && (
          <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
            alterações não salvas
          </span>
        )}
      </div>

      <Tabs value={section} onValueChange={(v) => setSection(v as SectionKey)}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/40 p-1">
          {SECTION_ORDER.map((s) => {
            const items = getSectionItems(kit, s);
            const count = items.filter((i) => i.id > 0).length;
            return (
              <TabsTrigger key={s} value={s} className="gap-1.5 text-[11px]">
                {SECTION_LABELS[s]}
                <span className="rounded bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {count}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {SECTION_ORDER.map((s) => (
          <TabsContent key={s} value={s} className="mt-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                {SECTION_LABELS[s]}{" "}
                <span className="font-mono">
                  ({getSectionItems(kit, s).filter((i) => i.id > 0).length} itens)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openCatalogFor(s)}
                  disabled={!canEdit}
                  title={canEdit ? "Buscar item no catálogo" : editDeniedTitle}
                  className="gap-1.5"
                >
                  <Search className="h-3.5 w-3.5" />
                  Buscar no catálogo
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => clearSection(s)}
                  disabled={!canEdit || getSectionItems(kit, s).length === 0}
                  title="Limpar todos os slots desta seção"
                  className="gap-1.5 text-destructive hover:text-destructive"
                >
                  <Eraser className="h-3.5 w-3.5" />
                  Limpar seção
                </Button>
              </div>
            </div>

            <SlotList
              items={getSectionItems(kit, s)}
              section={s}
              canEdit={canEdit}
              iconUrlFor={iconUrlFor}
              nameFor={(id) => metaFor(id)?.name}
              onRemove={(pos) => removeSlot(s, pos)}
            />
          </TabsContent>
        ))}
      </Tabs>

      <ValidationPanel summary={validation} hideWhenClean={false} />

      <DialogFooter className="gap-2 border-t border-border pt-3">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          <X className="h-4 w-4" />
          {dirty ? "Descartar" : "Voltar"}
        </Button>
        <Button
          onClick={handleSave}
          disabled={!canEdit || !dirty || saving || blocking}
          title={
            !canEdit
              ? editDeniedTitle
              : !dirty
                ? "Nenhuma alteração para salvar"
                : blocking
                  ? "Corrija os erros de validação"
                  : undefined
          }
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : blocking ? (
            <ShieldAlert className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar kit
        </Button>
      </DialogFooter>

      <ItemCatalogAdvancedDialog
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        contexts={insertContexts}
        defaultDestination={catalogTarget as InsertDestination}
        onInsert={handleInsert}
      />
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Lista de slots simples — não usa ItemEditor para evitar acoplamento
// com fluxos de "salvar" do template real.
// ────────────────────────────────────────────────────────────

const SlotList = ({
  items,
  section,
  canEdit,
  iconUrlFor,
  nameFor,
  onRemove,
}: {
  items: ClsItem[];
  section: SectionKey;
  canEdit: boolean;
  iconUrlFor: (id: number) => string;
  nameFor: (id: number) => string | undefined;
  onRemove: (pos: number) => void;
}) => {
  const filled = items.filter((it) => it.id > 0);
  if (filled.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border/60 bg-background/30 p-6 text-center text-xs text-muted-foreground">
        <Package className="mx-auto mb-1 h-4 w-4 text-muted-foreground/60" />
        Nenhum item nesta seção do kit. Use “Buscar no catálogo” para adicionar.
      </div>
    );
  }
  return (
    <ScrollArea className="max-h-[40vh] rounded-md border border-border bg-background/40">
      <ul className="divide-y divide-border/60">
        {filled
          .slice()
          .sort((a, b) => a.pos - b.pos)
          .map((it) => {
            const name = nameFor(it.id) ?? `Item ${it.id}`;
            const iconUrl = iconUrlFor(it.id);
            return (
              <li
                key={`${section}-${it.pos}-${it.id}`}
                className="flex items-center gap-3 px-3 py-2 text-sm"
              >
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded bg-muted">
                  {iconUrl && (
                    <img
                      src={iconUrl}
                      alt=""
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                      }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-foreground">{name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {section === "equipment.items" && (
                      <>
                        <span className="text-foreground/80">
                          {getEquipmentSlotLabel(it.pos)}
                        </span>
                        {" · "}
                      </>
                    )}
                    id {it.id} · pos {it.pos} · ×{it.count}
                    {it.max_count > 0 && <> / {it.max_count}</>}
                    {it.proctype > 0 && <> · proc {it.proctype}</>}
                    {it.expire_date > 0 && <> · expire {it.expire_date}</>}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemove(it.pos)}
                  disabled={!canEdit}
                  title={canEdit ? "Remover slot" : "Sem permissão"}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </li>
            );
          })}
      </ul>
    </ScrollArea>
  );
};

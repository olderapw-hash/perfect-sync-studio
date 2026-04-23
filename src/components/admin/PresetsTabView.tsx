// Aba "Presets" do InitialKitsDialog. Lista presets oficiais (read-only)
// e permite duplicar para o servidor ou como kit privado.
//
// Regras críticas:
// - Presets oficiais NÃO pertencem a tenant — são in-code (officialPresets.ts).
// - Read-only: nada de editar/excluir/aplicar direto. Apenas duplicar.
// - "Duplicar para servidor" exige permissão save_templates ou manage_kits.
// - "Duplicar privado" exige usuário autenticado e tenant ativo.
// - Toda duplicação grava audit `initial_kit.preset_duplicate`.

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Cloud,
  EyeOff,
  Loader2,
  Package,
  Sparkles,
  Sword,
  Trash,
  Trees,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  OFFICIAL_PRESETS,
  FOCUS_LABEL,
  countPresetItems,
  countPresetSlots,
  presetToKit,
  type OfficialPreset,
  type PresetFocus,
} from "@/lib/officialPresets";
import type { InitialKit, KitVisibility } from "@/lib/initialKits";
import { logAuditEvent } from "@/lib/auditLog";
import { toast } from "sonner";

interface Props {
  /** Tenant ativo (null = sem servidor). */
  tenantId: string | null;
  /** True se usuário pode criar kit no servidor (save_templates OU manage_kits). */
  canDuplicateToServer: boolean;
  /** True se usuário está autenticado e tem tenant — necessário pra "privado". */
  canDuplicatePrivate: boolean;
  /** Cria o kit no Supabase. Retorna o kit final (já com id real) ou null. */
  onCreateCloud: (
    kit: InitialKit,
    visibility: KitVisibility,
  ) => Promise<InitialKit | null>;
  /** Disparado após duplicação com sucesso (pra trocar de aba, refetch, etc.). */
  onDuplicated?: (kit: InitialKit, visibility: KitVisibility) => void;
}

const FOCUS_ICON: Record<PresetFocus, typeof Sparkles> = {
  leveling: Zap,
  farm: Trees,
  pvp: Sword,
  clear: Trash,
};

const FOCUS_COLOR: Record<PresetFocus, string> = {
  leveling: "bg-primary/10 text-primary",
  farm: "bg-success/10 text-success",
  pvp: "bg-destructive/10 text-destructive",
  clear: "bg-warning/10 text-warning",
};

export const PresetsTabView = ({
  tenantId,
  canDuplicateToServer,
  canDuplicatePrivate,
  onCreateCloud,
  onDuplicated,
}: Props) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleDuplicate = async (
    preset: OfficialPreset,
    visibility: KitVisibility,
  ) => {
    if (!tenantId) {
      toast.error("Selecione um servidor antes de duplicar um preset");
      return;
    }
    setBusyId(`${preset.id}:${visibility}`);
    try {
      const kit = presetToKit(preset);
      const created = await onCreateCloud(kit, visibility);
      if (!created) {
        toast.error("Falha ao duplicar preset");
        return;
      }
      // Audit dedicado de preset_duplicate (além do create já gravado pelo hook).
      await logAuditEvent({
        action: "initial_kit.preset_duplicate",
        tenantId,
        target: created.id,
        metadata: {
          preset_id: preset.id,
          preset_name: preset.name,
          focus: preset.focus,
          visibility,
          kit_name: created.name,
        },
      });
      toast.success(
        `Preset "${preset.name}" duplicado como ${
          visibility === "server" ? "kit do servidor" : "kit privado"
        }. Edite-o em "Meus Kits".`,
      );
      onDuplicated?.(created, visibility);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-background/40 p-3 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            Presets oficiais são <strong className="text-foreground">somente leitura</strong>{" "}
            e não pertencem a nenhum servidor. Para usar, duplique para o seu
            servidor (visível por todos) ou crie uma cópia privada (só você vê).
            Depois personalize em <em>Meus Kits</em>.
          </div>
        </div>
      </div>

      <ScrollArea className="max-h-[55vh] pr-2">
        <ul className="space-y-2">
          {OFFICIAL_PRESETS.map((preset) => {
            const Icon = FOCUS_ICON[preset.focus];
            const focusColor = FOCUS_COLOR[preset.focus];
            const slots = countPresetSlots(preset);
            const filled = countPresetItems(preset);
            const isExpanded = expanded === preset.id;
            const busyServer = busyId === `${preset.id}:server`;
            const busyPrivate = busyId === `${preset.id}:private`;
            const anyBusy = busyId !== null;

            return (
              <li
                key={preset.id}
                className="rounded-lg border border-border bg-background/40 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {preset.name}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${focusColor}`}
                      >
                        <Icon className="h-3 w-3" />
                        {FOCUS_LABEL[preset.focus]}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        <Package className="h-3 w-3" />
                        Oficial
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {preset.description}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] font-mono text-muted-foreground">
                      <span className="rounded bg-card px-1.5 py-0.5">
                        Inv: {filled > 0 ? `${filled} itens · ` : ""}
                        {slots.inv} slots
                      </span>
                      <span className="rounded bg-card px-1.5 py-0.5">
                        Equip: {slots.eq} slots
                      </span>
                      <span className="rounded bg-card px-1.5 py-0.5">
                        Baú: {slots.sh} slots
                      </span>
                      {preset.includes.inventory_money && preset.inventory.money && (
                        <span className="rounded bg-card px-1.5 py-0.5">
                          + {preset.inventory.money.toLocaleString("pt-BR")} (inv)
                        </span>
                      )}
                      {preset.includes.storehouse_money && preset.storehouse.money && (
                        <span className="rounded bg-card px-1.5 py-0.5">
                          + {preset.storehouse.money.toLocaleString("pt-BR")} (baú)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setExpanded(isExpanded ? null : preset.id)}
                    className="gap-1"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                    {isExpanded ? "Ocultar detalhes" : "Ver detalhes"}
                  </Button>
                  <div className="ml-auto flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => void handleDuplicate(preset, "server")}
                      disabled={!canDuplicateToServer || !tenantId || anyBusy}
                      title={
                        !tenantId
                          ? "Selecione um servidor"
                          : !canDuplicateToServer
                            ? "Você precisa de permissão save_templates ou manage_kits"
                            : "Cria um kit visível para todos os membros"
                      }
                      className="gap-1"
                    >
                      {busyServer ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Cloud className="h-3.5 w-3.5" />
                      )}
                      Duplicar para servidor
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleDuplicate(preset, "private")}
                      disabled={!canDuplicatePrivate || !tenantId || anyBusy}
                      title={
                        !tenantId
                          ? "Selecione um servidor"
                          : !canDuplicatePrivate
                            ? "Faça login com um servidor ativo"
                            : "Cria uma cópia privada — só você vê"
                      }
                      className="gap-1"
                    >
                      {busyPrivate ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                      Duplicar privado
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 rounded-md border border-border/60 bg-card/40 p-3 text-xs">
                    <div className="mb-1 font-semibold uppercase tracking-wider text-muted-foreground">
                      Estrutura
                    </div>
                    <ul className="space-y-0.5 text-foreground/80">
                      <li>
                        <strong>Inventário:</strong> {preset.inventory.items.length}{" "}
                        slots reservados
                        {preset.includes.inventory_money &&
                          ` · dinheiro inicial ${(preset.inventory.money ?? 0).toLocaleString("pt-BR")}`}
                      </li>
                      <li>
                        <strong>Equipamentos:</strong> {preset.equipment.items.length}{" "}
                        slots reservados
                      </li>
                      <li>
                        <strong>Baú:</strong> items {preset.storehouse.items.length} ·
                        dress {preset.storehouse.dress.length} · material{" "}
                        {preset.storehouse.material.length} · generalcard{" "}
                        {preset.storehouse.generalcard.length}
                        {preset.includes.storehouse_money &&
                          ` · dinheiro ${(preset.storehouse.money ?? 0).toLocaleString("pt-BR")}`}
                      </li>
                      <li>
                        <strong>Classe alvo:</strong>{" "}
                        {preset.target_cls === null
                          ? "qualquer classe"
                          : `cls ${preset.target_cls}`}
                      </li>
                    </ul>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Identidade (nome, cls, race, gender, base, status,
                      task_data) NUNCA é tocada — presets só carregam bens.
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
};

import { useEffect, useState } from "react";
import { RotateCcw, Save, User, Activity, Backpack, Sword, Warehouse } from "lucide-react";
import type { ClsEntry, ClsTemplate } from "@/types/clsconfig";
import { buildSavePayload } from "@/lib/clsconfig";
import { buildClassIconUrl } from "@/lib/pwIcons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BaseTab } from "./BaseTab";
import { StatusTab } from "./StatusTab";
import { InventoryTab } from "./InventoryTab";
import { EquipmentTab } from "./EquipmentTab";
import { StorehouseTab } from "./StorehouseTab";

interface Props {
  entry: ClsEntry;
}

type TabKey = "base" | "status" | "inventory" | "equipment" | "storehouse";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "base", label: "Base", icon: User },
  { key: "status", label: "Status", icon: Activity },
  { key: "inventory", label: "Inventário", icon: Backpack },
  { key: "equipment", label: "Equipamentos", icon: Sword },
  { key: "storehouse", label: "Baú", icon: Warehouse },
];

export const ClsconfigEditor = ({ entry }: Props) => {
  const [template, setTemplate] = useState<ClsTemplate>(entry.template);
  const [tab, setTab] = useState<TabKey>("base");

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

  const handleSave = () => {
    const payload = buildSavePayload(entry, template);
    // Por enquanto apenas loga — ainda não há endpoint de save.
    // eslint-disable-next-line no-console
    console.log("[clsconfig] save payload →", payload);
    toast.success("Payload montado e logado no console (modo preview)");
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
          <div className="flex items-center gap-2">
            {dirty && (
              <span className="rounded-full bg-primary/15 px-3 py-1 text-[11px] font-medium text-primary">
                Alterações não salvas
              </span>
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
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
            >
              <Save className="h-4 w-4" />
              Salvar
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
        {tab === "status" && <StatusTab template={template} onChange={setTemplate} />}
        {tab === "inventory" && <InventoryTab template={template} onChange={setTemplate} />}
        {tab === "equipment" && <EquipmentTab template={template} onChange={setTemplate} />}
        {tab === "storehouse" && <StorehouseTab template={template} onChange={setTemplate} />}
      </div>
    </div>
  );
};

import type { ClsTemplate } from "@/types/clsconfig";
import { InventoryGrid } from "./InventoryGrid";

interface Props {
  template: ClsTemplate;
  onChange: (next: ClsTemplate) => void;
}

export const StorehouseTab = ({ template, onChange }: Props) => {
  const sh = template.storehouse;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Num
          label="Capacidade"
          value={sh.capacity}
          onChange={(v) => onChange({ ...template, storehouse: { ...sh, capacity: v } })}
        />
        <Num
          label="Dinheiro"
          value={sh.money}
          onChange={(v) => onChange({ ...template, storehouse: { ...sh, money: v } })}
        />
      </div>

      <InventoryGrid
        title="Itens do baú"
        items={sh.items}
        gridSize={Math.max(sh.capacity || 0, sh.items.length, 48)}
        onChange={(items) => onChange({ ...template, storehouse: { ...sh, items } })}
        sectionKey="storehouse.items"
        capacity={sh.capacity}
        money={sh.money}
        onClearMoney={() => onChange({ ...template, storehouse: { ...sh, money: 0 } })}
      />
      <InventoryGrid
        title="Dress"
        items={sh.dress}
        gridSize={Math.max(sh.dress.length, 16)}
        onChange={(dress) => onChange({ ...template, storehouse: { ...sh, dress } })}
        sectionKey="storehouse.dress"
      />
      <InventoryGrid
        title="Material"
        items={sh.material}
        gridSize={Math.max(sh.material.length, 16)}
        onChange={(material) => onChange({ ...template, storehouse: { ...sh, material } })}
        sectionKey="storehouse.material"
      />
      <InventoryGrid
        title="General card"
        items={sh.generalcard}
        gridSize={Math.max(sh.generalcard.length, 16)}
        onChange={(generalcard) => onChange({ ...template, storehouse: { ...sh, generalcard } })}
        sectionKey="storehouse.generalcard"
      />
    </div>
  );
};

const Num = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <label className="block">
    <span className="uppercase-label mb-1.5 block">{label}</span>
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-sm outline-none transition-smooth focus:border-primary"
    />
  </label>
);

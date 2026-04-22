// Presets de template salvos localmente (localStorage). Não envolve backend.
import type { ClsTemplate } from "@/types/clsconfig";

const KEY = "clsconfig.presets.v1";

export interface PresetMeta {
  id: string;
  name: string;
  createdAt: number;
  sourceRoleid: number;
  sourceClassName?: string;
}

export interface Preset extends PresetMeta {
  template: ClsTemplate;
}

function readAll(): Preset[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list: Preset[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("[presets] failed to write", e);
  }
}

export const presetStore = {
  list(): PresetMeta[] {
    return readAll().map(({ template: _t, ...meta }) => meta);
  },
  get(id: string): Preset | null {
    return readAll().find((p) => p.id === id) ?? null;
  },
  save(name: string, template: ClsTemplate, sourceRoleid: number, sourceClassName?: string): Preset {
    const list = readAll();
    const preset: Preset = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim() || `Preset ${new Date().toLocaleString()}`,
      createdAt: Date.now(),
      sourceRoleid,
      sourceClassName,
      template: JSON.parse(JSON.stringify(template)),
    };
    list.unshift(preset);
    writeAll(list);
    return preset;
  },
  remove(id: string) {
    writeAll(readAll().filter((p) => p.id !== id));
  },
  clear() {
    writeAll([]);
  },
};

/**
 * Aplica um preset a um template alvo, preservando identidade (roleid, base.id,
 * base.name, base.cls, base.race, base.gender, base.userid, base.create_time
 * etc.) e copiando apenas os campos editáveis (status, inventory, equipment,
 * storehouse). Isso evita sobrescrever a identidade do personagem destino.
 */
export function applyPresetToTemplate(target: ClsTemplate, preset: ClsTemplate): ClsTemplate {
  return {
    ...target,
    status: { ...preset.status },
    inventory: JSON.parse(JSON.stringify(preset.inventory)),
    equipment: JSON.parse(JSON.stringify(preset.equipment)),
    storehouse: JSON.parse(JSON.stringify(preset.storehouse)),
    summary: {
      ...target.summary,
      level: preset.status.level,
      level2: preset.status.level2,
      cultivation: preset.status.cultivation,
      reputation: preset.status.reputation,
      inventory_money: preset.inventory.money,
    },
  };
}

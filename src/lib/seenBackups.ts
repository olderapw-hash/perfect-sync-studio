// Coleta backups vistos em respostas de save (vão se acumulando na sessão).
// Quando o endpoint listBackups existir, ele complementa esta lista.
import { useSyncExternalStore } from "react";

export interface SeenBackup {
  id: string;
  ts: number;
  roleid: number;
  type: "role_json" | "clsconfig_file";
  file: string;
}

const KEY = "clsconfig.seenBackups.v1";
const MAX = 200;

const load = (): SeenBackup[] => {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

let entries: SeenBackup[] = load();
const listeners = new Set<() => void>();

const persist = () => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(entries));
  } catch { /* quota */ }
  listeners.forEach((l) => l());
};

export const seenBackups = {
  add(roleid: number, type: SeenBackup["type"], file: string | undefined | null) {
    if (!file) return;
    if (entries.some((e) => e.file === file)) return;
    const full: SeenBackup = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: Date.now(),
      roleid,
      type,
      file,
    };
    entries = [full, ...entries].slice(0, MAX);
    persist();
  },
  list(): SeenBackup[] {
    return entries;
  },
  clear() {
    entries = [];
    persist();
  },
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useSeenBackups(): SeenBackup[] {
  return useSyncExternalStore(subscribe, () => entries, () => entries);
}

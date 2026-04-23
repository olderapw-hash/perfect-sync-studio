// Itens recentemente adicionados, persistidos em localStorage por tenant.
// Mantém os últimos 30 itens (mais recente primeiro), deduplicando por id.
//
// Não usa Supabase — escopo intencionalmente local para evitar latência
// e custo. Migração para tabela `item_recent_uses` é trivial no PR 2.

export interface RecentItem {
  id: number;
  name: string;
  iconPath?: string;
  maxCount?: number;
  /** epoch ms */
  usedAt: number;
}

export const RECENT_LIMIT = 30;

const keyFor = (tenantId: string | null | undefined) =>
  `pw_recent_items_${tenantId ?? "anon"}`;

export const itemRecents = {
  list(tenantId: string | null | undefined): RecentItem[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(keyFor(tenantId));
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.filter(
        (x): x is RecentItem =>
          x &&
          typeof x === "object" &&
          typeof x.id === "number" &&
          typeof x.usedAt === "number",
      );
    } catch {
      return [];
    }
  },

  push(tenantId: string | null | undefined, item: Omit<RecentItem, "usedAt">) {
    if (typeof window === "undefined") return;
    if (!Number.isFinite(item.id) || item.id <= 0) return;
    const list = itemRecents.list(tenantId);
    const filtered = list.filter((x) => x.id !== item.id);
    filtered.unshift({ ...item, usedAt: Date.now() });
    const next = filtered.slice(0, RECENT_LIMIT);
    try {
      localStorage.setItem(keyFor(tenantId), JSON.stringify(next));
    } catch {
      // quota cheia — ignora silenciosamente
    }
  },

  clear(tenantId: string | null | undefined) {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(keyFor(tenantId));
    } catch {
      /* noop */
    }
  },
};

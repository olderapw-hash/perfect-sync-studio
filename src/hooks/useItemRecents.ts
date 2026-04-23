import { useCallback, useEffect, useState } from "react";
import { itemRecents, type RecentItem } from "@/lib/itemRecents";

/** Estado reativo dos itens recentes do tenant ativo. */
export function useItemRecents(tenantId: string | null | undefined) {
  const [items, setItems] = useState<RecentItem[]>([]);

  const reload = useCallback(() => {
    setItems(itemRecents.list(tenantId));
  }, [tenantId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const push = useCallback(
    (it: Omit<RecentItem, "usedAt">) => {
      itemRecents.push(tenantId, it);
      reload();
    },
    [tenantId, reload],
  );

  const clear = useCallback(() => {
    itemRecents.clear(tenantId);
    reload();
  }, [tenantId, reload]);

  return { items, push, clear, reload };
}

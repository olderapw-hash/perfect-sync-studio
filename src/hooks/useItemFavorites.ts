import { useCallback, useEffect, useState } from "react";
import { itemFavorites, type ItemFavorite, type AddFavoriteInput } from "@/lib/itemFavorites";

interface State {
  items: ItemFavorite[];
  loading: boolean;
  error: string | null;
}

/** Carrega favoritos do tenant ativo. Sem tenant → lista vazia silenciosa. */
export function useItemFavorites(tenantId: string | null | undefined) {
  const [state, setState] = useState<State>({ items: [], loading: false, error: null });

  const reload = useCallback(async () => {
    if (!tenantId) {
      setState({ items: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const items = await itemFavorites.list(tenantId);
      setState({ items, loading: false, error: null });
    } catch (e) {
      setState({
        items: [],
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }, [tenantId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const isFavorite = useCallback(
    (itemId: number) => state.items.some((f) => f.item_id === itemId),
    [state.items],
  );

  const add = useCallback(
    async (input: Omit<AddFavoriteInput, "tenantId">) => {
      if (!tenantId) throw new Error("Selecione um servidor antes de favoritar.");
      await itemFavorites.add({ ...input, tenantId });
      await reload();
    },
    [tenantId, reload],
  );

  const remove = useCallback(
    async (itemId: number) => {
      if (!tenantId) return;
      await itemFavorites.remove(tenantId, itemId);
      await reload();
    },
    [tenantId, reload],
  );

  const toggle = useCallback(
    async (input: Omit<AddFavoriteInput, "tenantId">) => {
      if (isFavorite(input.itemId)) {
        await remove(input.itemId);
      } else {
        await add(input);
      }
    },
    [isFavorite, add, remove],
  );

  return { ...state, isFavorite, add, remove, toggle, reload };
}

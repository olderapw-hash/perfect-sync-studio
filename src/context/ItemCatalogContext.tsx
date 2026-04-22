import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseItemTab, buildIconUrl, type ItemCatalogMap, type ItemMeta } from "@/lib/itemTab";

interface CatalogRow {
  id: string;
  name: string;
  tab_path: string;
  icons_prefix: string;
  item_count: number;
  is_active: boolean;
  created_at: string;
}

interface ItemCatalogContextValue {
  catalog: CatalogRow | null;
  items: ItemCatalogMap;
  loading: boolean;
  error: string | null;
  iconUrlFor: (id: number) => string;
  metaFor: (id: number) => ItemMeta | undefined;
  reload: () => Promise<void>;
}

const ItemCatalogContext = createContext<ItemCatalogContextValue | null>(null);

const PUBLIC_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pw-assets`;

export const ItemCatalogProvider = ({ children }: { children: ReactNode }) => {
  const [catalog, setCatalog] = useState<CatalogRow | null>(null);
  const [items, setItems] = useState<ItemCatalogMap>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from("item_catalogs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (dbErr) throw dbErr;
      if (!data) {
        setCatalog(null);
        setItems(new Map());
        return;
      }
      setCatalog(data as CatalogRow);

      // Cache local do .tab parseado por id+updated — evita reparsing de 10k+ linhas.
      const cacheKey = `pw-tab-cache:${data.id}:${data.tab_path}`;
      const cachedRaw = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null;
      if (cachedRaw) {
        try {
          const arr = JSON.parse(cachedRaw) as Array<[number, ItemMeta]>;
          setItems(new Map(arr));
          setLoading(false);
          // Revalida em background, não bloqueia a UI
          void revalidate(data as CatalogRow, cacheKey);
          return;
        } catch {
          // cache corrompido — segue fluxo normal
        }
      }
      const parsed = await fetchAndParse(data as CatalogRow);
      setItems(parsed);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(Array.from(parsed.entries())));
      } catch {
        // quota cheia — ignora
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setItems(new Map());
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAndParse = async (row: CatalogRow): Promise<ItemCatalogMap> => {
    const tabUrl = `${PUBLIC_BASE}/${row.tab_path.replace(/^\/+/, "")}`;
    const res = await fetch(tabUrl, { cache: "force-cache" });
    if (!res.ok) throw new Error(`Falha ao baixar .tab (${res.status})`);
    const text = await res.text();
    return parseItemTab(text);
  };

  const revalidate = async (row: CatalogRow, cacheKey: string) => {
    try {
      const fresh = await fetchAndParse(row);
      // Só atualiza se mudou de tamanho (heurística leve)
      setItems((prev) => (prev.size === fresh.size ? prev : fresh));
      try {
        localStorage.setItem(cacheKey, JSON.stringify(Array.from(fresh.entries())));
      } catch { /* noop */ }
    } catch {
      // silencioso — UI já tem dados em cache
    }
  };

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo<ItemCatalogContextValue>(
    () => ({
      catalog,
      items,
      loading,
      error,
      reload: load,
      iconUrlFor: (id: number) =>
        catalog ? buildIconUrl(PUBLIC_BASE, catalog.icons_prefix, id) : "",
      metaFor: (id: number) => items.get(id),
    }),
    [catalog, items, loading, error, load],
  );

  return <ItemCatalogContext.Provider value={value}>{children}</ItemCatalogContext.Provider>;
};

export function useItemCatalog(): ItemCatalogContextValue {
  const ctx = useContext(ItemCatalogContext);
  if (!ctx) throw new Error("useItemCatalog must be used within ItemCatalogProvider");
  return ctx;
}

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

      // Baixa o .tab do storage público
      const tabUrl = `${PUBLIC_BASE}/${data.tab_path.replace(/^\/+/, "")}`;
      const res = await fetch(tabUrl);
      if (!res.ok) throw new Error(`Falha ao baixar .tab (${res.status})`);
      const text = await res.text();
      setItems(parseItemTab(text));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setItems(new Map());
    } finally {
      setLoading(false);
    }
  }, []);

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

// CRUD de favoritos de item por usuário+tenant.
// RLS garante isolamento (auth.uid() = user_id). FK em tenant_id valida
// que o tenant existe; quem é membro/owner já passou pela RLS de tenants.
import { supabase } from "@/integrations/supabase/client";

export interface ItemFavorite {
  id: string;
  user_id: string;
  tenant_id: string;
  item_id: number;
  name: string | null;
  icon_path: string | null;
  max_count: number | null;
  created_at: string;
}

export interface AddFavoriteInput {
  tenantId: string;
  itemId: number;
  name?: string;
  iconPath?: string;
  maxCount?: number;
}

export const itemFavorites = {
  async list(tenantId: string): Promise<ItemFavorite[]> {
    const { data, error } = await supabase
      .from("item_favorites")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ItemFavorite[];
  },

  async add(input: AddFavoriteInput): Promise<ItemFavorite | null> {
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user?.id;
    if (!uid) throw new Error("Sessão expirada — faça login novamente.");
    const { data, error } = await supabase
      .from("item_favorites")
      .insert({
        user_id: uid,
        tenant_id: input.tenantId,
        item_id: input.itemId,
        name: input.name ?? null,
        icon_path: input.iconPath ?? null,
        max_count: input.maxCount ?? null,
      })
      .select("*")
      .maybeSingle();
    if (error) {
      // Conflito (já é favorito) — devolve o existente.
      if ((error as { code?: string }).code === "23505") {
        return null;
      }
      throw error;
    }
    return (data as ItemFavorite) ?? null;
  },

  async remove(tenantId: string, itemId: number): Promise<void> {
    const { error } = await supabase
      .from("item_favorites")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("item_id", itemId);
    if (error) throw error;
  },
};

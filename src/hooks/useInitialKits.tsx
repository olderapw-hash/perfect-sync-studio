// Hook de gestão de kits iniciais persistidos no Supabase (tabela
// `initial_kits`). Convive com kits do localStorage (legacy/import) — a UI
// pode mostrar badge "Local" e oferecer migração para o tenant ativo.
//
// CRUD respeita as RLS:
//  - SELECT: membro do tenant + (visibility=server OU created_by=self)
//  - INSERT: precisa save_templates + created_by=self
//  - UPDATE/DELETE: criador OU save_templates
//
// Toda mutação grava `audit_logs` via RPC log_audit_event.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  KITS_STORAGE_KEY,
  countKitItems,
  isValidKit,
  kitStore,
  type InitialKit,
  type KitVisibility,
} from "@/lib/initialKits";
import { logAuditEvent } from "@/lib/auditLog";

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** Linha bruta retornada pelo select. */
interface KitRow {
  id: string;
  tenant_id: string;
  created_by: string;
  name: string;
  description: string | null;
  target_cls: number | null;
  visibility: KitVisibility;
  payload: unknown;
  created_at: string;
  updated_at: string;
}

/** Converte linha do banco em InitialKit usado pela UI. */
function rowToKit(row: KitRow): InitialKit | null {
  const p = row.payload;
  if (!p || typeof p !== "object") return null;
  const payload = p as Partial<InitialKit>;
  if (!payload.inventory || !payload.equipment || !payload.storehouse) return null;

  const kit: InitialKit = {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    target_cls: row.target_cls,
    created_at: row.created_at,
    updated_at: row.updated_at,
    source: "cloud",
    visibility: row.visibility,
    tenant_id: row.tenant_id,
    created_by: row.created_by,
    includes: payload.includes ?? {
      inventory_money: false,
      storehouse_money: false,
      task_inventory: false,
    },
    inventory: payload.inventory as InitialKit["inventory"],
    equipment: payload.equipment as InitialKit["equipment"],
    storehouse: payload.storehouse as InitialKit["storehouse"],
    ...(payload.task ? { task: payload.task } : {}),
  };
  return kit;
}

/** Extrai apenas o subconjunto seguro do kit p/ o jsonb `payload`. */
function kitToPayload(kit: InitialKit) {
  const out: Record<string, unknown> = {
    includes: kit.includes,
    inventory: clone(kit.inventory),
    equipment: clone(kit.equipment),
    storehouse: clone(kit.storehouse),
  };
  if (kit.task?.task_inventory) {
    out.task = { task_inventory: clone(kit.task.task_inventory) };
  }
  return out;
}

const MIGRATED_FLAG_KEY = "pw_initial_kits_migrated_v1";

/** Marca um conjunto de ids locais como migrados para um tenant. */
function markMigrated(tenantId: string, ids: string[]) {
  try {
    const raw = localStorage.getItem(MIGRATED_FLAG_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    const prev = new Set(map[tenantId] ?? []);
    for (const id of ids) prev.add(id);
    map[tenantId] = [...prev];
    localStorage.setItem(MIGRATED_FLAG_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn("[kits] failed to record migration", e);
  }
}

/** Remove TODOS os kits do localStorage. Não toca em cloud. */
export function clearLocalKits() {
  try {
    localStorage.removeItem(KITS_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

interface UseInitialKitsOptions {
  /** Tenant ativo. Se null, hook fica em estado vazio. */
  tenantId: string | null;
}

interface UseInitialKitsResult {
  /** Kits do servidor atual. */
  cloudKits: InitialKit[];
  /** Kits que ainda só existem no localStorage. */
  localKits: InitialKit[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;

  createKit: (kit: InitialKit, visibility: KitVisibility) => Promise<InitialKit | null>;
  updateKit: (
    id: string,
    patch: Partial<Pick<InitialKit, "name" | "description" | "target_cls" | "visibility">>,
  ) => Promise<boolean>;
  /**
   * Atualiza o conteúdo (slots) de um kit cloud. Recebe o kit JÁ atualizado
   * em memória; só extrai o payload mínimo (inventory/equipment/storehouse/
   * task.task_inventory + includes) e grava em `payload`.
   */
  updateKitPayload: (id: string, kit: InitialKit) => Promise<boolean>;
  deleteKit: (id: string) => Promise<boolean>;
  duplicateKit: (id: string) => Promise<InitialKit | null>;
  importKit: (kit: InitialKit, visibility: KitVisibility) => Promise<InitialKit | null>;
  /** Sobe TODOS os kits do localStorage para o tenant ativo. */
  migrateLocalStorageKitsToCloud: (
    visibility: KitVisibility,
  ) => Promise<{ migrated: number; failed: number }>;
  /** Apaga todos os kits locais (só após o usuário confirmar). */
  clearLocal: () => void;
}

export function useInitialKits({ tenantId }: UseInitialKitsOptions): UseInitialKitsResult {
  const { session } = useAuth();
  const [cloudKits, setCloudKits] = useState<InitialKit[]>([]);
  const [localKits, setLocalKits] = useState<InitialKit[]>(() =>
    kitStore.list().map((k) => ({ ...k, source: "local" as const })),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshLocal = useCallback(() => {
    setLocalKits(kitStore.list().map((k) => ({ ...k, source: "local" as const })));
  }, []);

  const refetch = useCallback(async () => {
    if (!tenantId || !session?.user) {
      setCloudKits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("initial_kits")
      .select(
        "id, tenant_id, created_by, name, description, target_cls, visibility, payload, created_at, updated_at",
      )
      .eq("tenant_id", tenantId)
      .order("updated_at", { ascending: false });

    if (err) {
      setError(err.message);
      setCloudKits([]);
    } else {
      const rows = (data ?? []) as KitRow[];
      setCloudKits(rows.map(rowToKit).filter((k): k is InitialKit => !!k));
    }
    setLoading(false);
  }, [tenantId, session?.user]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  // ─────────────────────────── mutations ───────────────────────────

  const createKit = useCallback(
    async (kit: InitialKit, visibility: KitVisibility) => {
      if (!tenantId || !session?.user) return null;
      const { data, error: err } = await supabase
        .from("initial_kits")
        .insert({
          tenant_id: tenantId,
          created_by: session.user.id,
          name: kit.name,
          description: kit.description || null,
          target_cls: kit.target_cls,
          visibility,
          payload: kitToPayload(kit) as never,
        })
        .select(
          "id, tenant_id, created_by, name, description, target_cls, visibility, payload, created_at, updated_at",
        )
        .single();

      if (err) {
        await logAuditEvent({
          action: "initial_kit.create",
          tenantId,
          target: kit.name,
          status: "error",
          error: err.message,
        });
        setError(err.message);
        return null;
      }
      const row = data as KitRow;
      await logAuditEvent({
        action: "initial_kit.create",
        tenantId,
        target: row.id,
        metadata: { name: row.name, visibility, item_count: countKitItems(kit) },
      });
      await refetch();
      return rowToKit(row);
    },
    [tenantId, session?.user, refetch],
  );

  const updateKit = useCallback<UseInitialKitsResult["updateKit"]>(
    async (id, patch) => {
      if (!tenantId) return false;
      const updates: {
        name?: string;
        description?: string | null;
        target_cls?: number | null;
        visibility?: KitVisibility;
      } = {};
      if (patch.name !== undefined) updates.name = patch.name;
      if (patch.description !== undefined) updates.description = patch.description;
      if (patch.target_cls !== undefined) updates.target_cls = patch.target_cls;
      if (patch.visibility !== undefined) updates.visibility = patch.visibility;

      const { error: err } = await supabase
        .from("initial_kits")
        .update(updates)
        .eq("id", id);

      if (err) {
        await logAuditEvent({
          action: "initial_kit.update",
          tenantId,
          target: id,
          status: "error",
          error: err.message,
        });
        return false;
      }
      await logAuditEvent({
        action: "initial_kit.update",
        tenantId,
        target: id,
        metadata: patch as Record<string, unknown>,
      });
      await refetch();
      return true;
    },
    [tenantId, refetch],
  );

  const updateKitPayload = useCallback(
    async (id: string, kit: InitialKit) => {
      if (!tenantId) return false;
      const payload = kitToPayload(kit);
      const { error: err } = await supabase
        .from("initial_kits")
        .update({
          payload: payload as never,
          // Mantém os "includes" coerentes com o conteúdo (para que reaplicar
          // o kit decida corretamente se respeita money/task).
          name: kit.name,
          description: kit.description || null,
          target_cls: kit.target_cls,
        })
        .eq("id", id);
      if (err) {
        await logAuditEvent({
          action: "initial_kit.update",
          tenantId,
          target: id,
          status: "error",
          error: err.message,
          metadata: { scope: "payload", item_count: countKitItems(kit) },
        });
        return false;
      }
      await logAuditEvent({
        action: "initial_kit.update",
        tenantId,
        target: id,
        metadata: { scope: "payload", item_count: countKitItems(kit), name: kit.name },
      });
      await refetch();
      return true;
    },
    [tenantId, refetch],
  );

  const deleteKit = useCallback(
    async (id: string) => {
      if (!tenantId) return false;
      const { error: err } = await supabase.from("initial_kits").delete().eq("id", id);
      if (err) {
        await logAuditEvent({
          action: "initial_kit.delete",
          tenantId,
          target: id,
          status: "error",
          error: err.message,
        });
        return false;
      }
      await logAuditEvent({ action: "initial_kit.delete", tenantId, target: id });
      await refetch();
      return true;
    },
    [tenantId, refetch],
  );

  const duplicateKit = useCallback(
    async (id: string) => {
      const orig = cloudKits.find((k) => k.id === id);
      if (!orig) return null;
      const copy: InitialKit = {
        ...clone(orig),
        id: `tmp_${Date.now()}`, // será substituído ao inserir
        name: `${orig.name} (cópia)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return createKit(copy, orig.visibility ?? "server");
    },
    [cloudKits, createKit],
  );

  const importKit = useCallback(
    async (kit: InitialKit, visibility: KitVisibility) => createKit(kit, visibility),
    [createKit],
  );

  const migrateLocalStorageKitsToCloud = useCallback(
    async (visibility: KitVisibility) => {
      if (!tenantId) return { migrated: 0, failed: 0 };
      const all = kitStore.list();
      let migrated = 0;
      let failed = 0;
      const okIds: string[] = [];
      for (const local of all) {
        const r = await createKit(local, visibility);
        if (r) {
          migrated++;
          okIds.push(local.id);
        } else {
          failed++;
        }
      }
      if (okIds.length) markMigrated(tenantId, okIds);
      return { migrated, failed };
    },
    [tenantId, createKit],
  );

  const clearLocal = useCallback(() => {
    clearLocalKits();
    refreshLocal();
  }, [refreshLocal]);

  return {
    cloudKits,
    localKits,
    loading,
    error,
    refetch,
    createKit,
    updateKit,
    updateKitPayload,
    deleteKit,
    duplicateKit,
    importKit,
    migrateLocalStorageKitsToCloud,
    clearLocal,
  };
}

/** Util pra UI: revalida shape antes de promover um kit local para cloud. */
export function isImportableKit(v: unknown): v is InitialKit {
  return isValidKit(v);
}

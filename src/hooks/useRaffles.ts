// Hook de leitura/escrita para o CRUD de sorteios (Fase 4B1).
// As operações de participantes/sorteio/entrega ficam para 4B2 e 4B3 —
// este hook concentra apenas o que a tela /admin/events/raffles precisa.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/lib/auditLog";
import {
  normalizeRewardPayload,
  type RaffleEvent,
  type RaffleRewardPayload,
  type RaffleStatus,
} from "@/lib/raffles";

interface RaffleEventRow {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  status: RaffleStatus;
  starts_at: string | null;
  ends_at: string | null;
  winners_count: number;
  reward_title: string | null;
  reward_message: string | null;
  reward_payload_json: unknown;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: RaffleEventRow): RaffleEvent {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    name: row.name,
    description: row.description,
    status: row.status,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    winners_count: row.winners_count,
    reward_title: row.reward_title,
    reward_message: row.reward_message,
    reward_payload_json: normalizeRewardPayload(row.reward_payload_json),
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export interface CreateRaffleInput {
  name: string;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  winners_count: number;
  reward_title?: string | null;
  reward_message?: string | null;
  reward_payload_json: RaffleRewardPayload;
}

export interface UpdateRafflePatch {
  name?: string;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  winners_count?: number;
  reward_title?: string | null;
  reward_message?: string | null;
  reward_payload_json?: RaffleRewardPayload;
  status?: RaffleStatus;
}

export function useRaffles({ tenantId }: { tenantId: string | null }) {
  const [raffles, setRaffles] = useState<RaffleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRaffles = useCallback(async () => {
    if (!tenantId) {
      setRaffles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("raffle_events")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
      setRaffles([]);
    } else {
      setRaffles(((data ?? []) as RaffleEventRow[]).map(mapRow));
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void fetchRaffles();
  }, [fetchRaffles]);

  const createRaffle = useCallback(
    async (input: CreateRaffleInput): Promise<RaffleEvent | null> => {
      if (!tenantId) return null;
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) return null;

      const { data, error: err } = await supabase
        .from("raffle_events")
        .insert({
          tenant_id: tenantId,
          created_by: userId,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          status: "draft" satisfies RaffleStatus,
          starts_at: input.starts_at || null,
          ends_at: input.ends_at || null,
          winners_count: Math.max(1, Math.floor(input.winners_count)),
          reward_title: input.reward_title?.trim() || null,
          reward_message: input.reward_message?.trim() || null,
          reward_payload_json: input.reward_payload_json as never,
        })
        .select("*")
        .single();

      if (err || !data) {
        await logAuditEvent({
          action: "raffle.create",
          tenantId,
          status: "error",
          error: err?.message ?? "unknown",
        });
        return null;
      }
      const row = mapRow(data as RaffleEventRow);
      await logAuditEvent({
        action: "raffle.create",
        tenantId,
        target: row.id,
        metadata: {
          name: row.name,
          winners_count: row.winners_count,
          items: row.reward_payload_json.items.length,
          gold: row.reward_payload_json.gold,
        },
      });
      setRaffles((prev) => [row, ...prev]);
      return row;
    },
    [tenantId],
  );

  const updateRaffle = useCallback(
    async (id: string, patch: UpdateRafflePatch): Promise<boolean> => {
      if (!tenantId) return false;
      const update: Record<string, unknown> = {};
      if (patch.name !== undefined) update.name = patch.name.trim();
      if (patch.description !== undefined)
        update.description = patch.description?.trim() || null;
      if (patch.starts_at !== undefined) update.starts_at = patch.starts_at || null;
      if (patch.ends_at !== undefined) update.ends_at = patch.ends_at || null;
      if (patch.winners_count !== undefined)
        update.winners_count = Math.max(1, Math.floor(patch.winners_count));
      if (patch.reward_title !== undefined)
        update.reward_title = patch.reward_title?.trim() || null;
      if (patch.reward_message !== undefined)
        update.reward_message = patch.reward_message?.trim() || null;
      if (patch.reward_payload_json !== undefined)
        update.reward_payload_json = patch.reward_payload_json;
      if (patch.status !== undefined) update.status = patch.status;

      const { data, error: err } = await supabase
        .from("raffle_events")
        .update(update as never)
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select("*")
        .single();

      if (err || !data) {
        await logAuditEvent({
          action: "raffle.update",
          tenantId,
          target: id,
          status: "error",
          error: err?.message ?? "unknown",
        });
        return false;
      }
      const row = mapRow(data as RaffleEventRow);
      await logAuditEvent({
        action: patch.status ? `raffle.set_status.${patch.status}` : "raffle.update",
        tenantId,
        target: id,
        metadata: { fields: Object.keys(update) },
      });
      setRaffles((prev) => prev.map((r) => (r.id === id ? row : r)));
      return true;
    },
    [tenantId],
  );

  const deleteRaffle = useCallback(
    async (id: string): Promise<boolean> => {
      if (!tenantId) return false;
      const { error: err } = await supabase
        .from("raffle_events")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);
      if (err) {
        await logAuditEvent({
          action: "raffle.delete",
          tenantId,
          target: id,
          status: "error",
          error: err.message,
        });
        return false;
      }
      await logAuditEvent({ action: "raffle.delete", tenantId, target: id });
      setRaffles((prev) => prev.filter((r) => r.id !== id));
      return true;
    },
    [tenantId],
  );

  return {
    raffles,
    loading,
    error,
    refetch: fetchRaffles,
    createRaffle,
    updateRaffle,
    deleteRaffle,
  };
}

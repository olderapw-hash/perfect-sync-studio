// Hook para gerenciar Eventos Ingame (lista do tenant ativo).
// Inclui CRUD básico + transições de status com auditoria.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { logAuditEvent } from "@/lib/auditLog";
import {
  type IngameEvent,
  type IngameEventStatus,
  type IngameRewardMode,
  type IngameRewardPayload,
  normalizeRewardPayload,
} from "@/lib/ingameEvents";

const COLUMNS =
  "id, tenant_id, name, description, event_type, status, starts_at, ends_at, reward_mode, winners_count, reward_title, reward_message, reward_payload_json, created_by, created_at, updated_at";

export interface CreateIngameEventInput {
  name: string;
  description?: string | null;
  reward_mode: IngameRewardMode;
  winners_count: number;
  reward_title?: string | null;
  reward_message?: string | null;
  reward_payload_json: IngameRewardPayload;
  starts_at?: string | null;
  ends_at?: string | null;
}

export interface UpdateIngameEventInput extends Partial<CreateIngameEventInput> {
  status?: IngameEventStatus;
}

function mapRow(raw: Record<string, unknown>): IngameEvent {
  return {
    id: String(raw.id),
    tenant_id: String(raw.tenant_id),
    name: String(raw.name ?? ""),
    description: (raw.description as string) ?? null,
    event_type: (raw.event_type as IngameEvent["event_type"]) ?? "ingame_generic",
    status: (raw.status as IngameEventStatus) ?? "draft",
    starts_at: (raw.starts_at as string) ?? null,
    ends_at: (raw.ends_at as string) ?? null,
    reward_mode: (raw.reward_mode as IngameRewardMode) ?? "all_participants",
    winners_count: Number(raw.winners_count ?? 1),
    reward_title: (raw.reward_title as string) ?? null,
    reward_message: (raw.reward_message as string) ?? null,
    reward_payload_json: normalizeRewardPayload(raw.reward_payload_json),
    created_by: String(raw.created_by ?? ""),
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? ""),
  };
}

export function useIngameEvents() {
  const { session } = useAuth();
  const { active } = useServers();
  const { can } = useServerPermissions();
  const [events, setEvents] = useState<IngameEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const tenantId = active?.id ?? null;

  const refetch = useCallback(async () => {
    if (!session?.user || !tenantId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("ingame_events")
      .select(COLUMNS)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[ingame-events] list", error);
      setEvents([]);
    } else {
      setEvents((data ?? []).map((r) => mapRow(r as Record<string, unknown>)));
    }
    setLoading(false);
  }, [session?.user, tenantId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const createEvent = useCallback(
    async (input: CreateIngameEventInput): Promise<IngameEvent> => {
      if (!session?.user) throw new Error("Não autenticado");
      if (!tenantId) throw new Error("Selecione um servidor ativo");
      if (!can("manage_kits"))
        throw new Error("Sem permissão para gerenciar eventos");

      const { data, error } = await supabase
        .from("ingame_events")
        .insert({
          tenant_id: tenantId,
          created_by: session.user.id,
          name: input.name.trim(),
          description: input.description ?? null,
          event_type: "ingame_generic",
          status: "draft",
          reward_mode: input.reward_mode,
          winners_count: Math.max(1, input.winners_count),
          reward_title: input.reward_title ?? null,
          reward_message: input.reward_message ?? null,
          reward_payload_json: input.reward_payload_json as never,
          starts_at: input.starts_at ?? null,
          ends_at: input.ends_at ?? null,
        })
        .select(COLUMNS)
        .single();
      if (error) {
        await logAuditEvent({
          action: "ingame_event.create",
          tenantId,
          status: "error",
          error: error.message,
        });
        throw error;
      }
      const row = mapRow(data as Record<string, unknown>);
      await logAuditEvent({
        action: "ingame_event.create",
        tenantId,
        target: row.id,
        metadata: { name: row.name, reward_mode: row.reward_mode },
      });
      await refetch();
      return row;
    },
    [session?.user, tenantId, can, refetch],
  );

  const updateEvent = useCallback(
    async (id: string, patch: UpdateIngameEventInput): Promise<IngameEvent> => {
      if (!session?.user) throw new Error("Não autenticado");
      if (!tenantId) throw new Error("Selecione um servidor ativo");
      if (!can("manage_kits"))
        throw new Error("Sem permissão para gerenciar eventos");

      const upd: Record<string, unknown> = {};
      if (patch.name !== undefined) upd.name = patch.name.trim();
      if (patch.description !== undefined) upd.description = patch.description;
      if (patch.reward_mode !== undefined) upd.reward_mode = patch.reward_mode;
      if (patch.winners_count !== undefined)
        upd.winners_count = Math.max(1, patch.winners_count);
      if (patch.reward_title !== undefined) upd.reward_title = patch.reward_title;
      if (patch.reward_message !== undefined)
        upd.reward_message = patch.reward_message;
      if (patch.reward_payload_json !== undefined)
        upd.reward_payload_json = patch.reward_payload_json;
      if (patch.starts_at !== undefined) upd.starts_at = patch.starts_at;
      if (patch.ends_at !== undefined) upd.ends_at = patch.ends_at;
      if (patch.status !== undefined) upd.status = patch.status;

      const { data, error } = await supabase
        .from("ingame_events")
        .update(upd as never)
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select(COLUMNS)
        .single();
      if (error) {
        await logAuditEvent({
          action: "ingame_event.update",
          tenantId,
          target: id,
          status: "error",
          error: error.message,
        });
        throw error;
      }
      const row = mapRow(data as Record<string, unknown>);
      await logAuditEvent({
        action: "ingame_event.update",
        tenantId,
        target: id,
        metadata: { fields: Object.keys(upd) },
      });
      await refetch();
      return row;
    },
    [session?.user, tenantId, can, refetch],
  );

  const setStatus = useCallback(
    async (id: string, status: IngameEventStatus) => {
      const row = await updateEvent(id, { status });
      await logAuditEvent({
        action: `ingame_event.status.${status}`,
        tenantId,
        target: id,
      });
      return row;
    },
    [updateEvent, tenantId],
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      if (!tenantId) throw new Error("Selecione um servidor ativo");
      if (!can("manage_kits"))
        throw new Error("Sem permissão para gerenciar eventos");
      const { error } = await supabase
        .from("ingame_events")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);
      if (error) {
        await logAuditEvent({
          action: "ingame_event.delete",
          tenantId,
          target: id,
          status: "error",
          error: error.message,
        });
        throw error;
      }
      await logAuditEvent({
        action: "ingame_event.delete",
        tenantId,
        target: id,
      });
      await refetch();
    },
    [tenantId, can, refetch],
  );

  return {
    events,
    loading,
    tenantId,
    canManage: can("manage_kits"),
    refetch,
    createEvent,
    updateEvent,
    setStatus,
    deleteEvent,
  };
}

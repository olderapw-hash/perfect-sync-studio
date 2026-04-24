// Hook que carrega/persiste attendance_events do tenant ativo.
// Mantém um cache local simples (state) e re-busca após mutações.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AttendanceEventRow, AttendanceRewardPayload } from "@/lib/attendance";

const SELECT_COLS =
  "id, tenant_id, created_by, name, description, status_active, period_start, period_end, daily_reset, streak_enabled, timezone, reward_payload, streak_payload, created_at, updated_at";

export interface NewAttendanceEventInput {
  name: string;
  description?: string | null;
  status_active: boolean;
  period_start?: string | null;
  period_end?: string | null;
  daily_reset: boolean;
  streak_enabled: boolean;
  timezone: string;
  reward_payload: AttendanceRewardPayload;
}

export function useAttendanceEvents(tenantId: string | null) {
  const [events, setEvents] = useState<AttendanceEventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!tenantId) {
      setEvents([]);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("attendance_events")
      .select(SELECT_COLS)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
      setEvents([]);
    } else {
      setEvents((data ?? []) as unknown as AttendanceEventRow[]);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const createEvent = useCallback(
    async (input: NewAttendanceEventInput, userId: string) => {
      if (!tenantId) throw new Error("Sem servidor ativo");
      const { error: err } = await supabase.from("attendance_events").insert({
        tenant_id: tenantId,
        created_by: userId,
        name: input.name,
        description: input.description ?? null,
        status_active: input.status_active,
        period_start: input.period_start ?? null,
        period_end: input.period_end ?? null,
        daily_reset: input.daily_reset,
        streak_enabled: input.streak_enabled,
        timezone: input.timezone,
        reward_payload: input.reward_payload as never,
      });
      if (err) throw err;
      await refetch();
    },
    [tenantId, refetch],
  );

  const updateEvent = useCallback(
    async (id: string, patch: Partial<NewAttendanceEventInput>) => {
      const updatePayload: Record<string, unknown> = { ...patch };
      if (patch.reward_payload) {
        updatePayload.reward_payload = patch.reward_payload as never;
      }
      const { error: err } = await supabase
        .from("attendance_events")
        .update(updatePayload)
        .eq("id", id);
      if (err) throw err;
      await refetch();
    },
    [refetch],
  );

  const setActive = useCallback(
    async (id: string, active: boolean) => {
      const { error: err } = await supabase
        .from("attendance_events")
        .update({ status_active: active })
        .eq("id", id);
      if (err) throw err;
      await refetch();
    },
    [refetch],
  );

  const removeEvent = useCallback(
    async (id: string) => {
      const { error: err } = await supabase.from("attendance_events").delete().eq("id", id);
      if (err) throw err;
      await refetch();
    },
    [refetch],
  );

  return { events, loading, error, refetch, createEvent, updateEvent, setActive, removeEvent };
}

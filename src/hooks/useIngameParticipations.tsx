// Participantes registrados em um evento ingame + sortear vencedores.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { logAuditEvent } from "@/lib/auditLog";
import {
  type IngameParticipation,
  type IngameParticipationSource,
  type IngameWinner,
} from "@/lib/ingameEvents";

const PART_COLS =
  "id, event_id, tenant_id, roleid, role_name, userid, source, added_by, metadata, created_at";
const WIN_COLS =
  "id, event_id, tenant_id, roleid, role_name, userid, drawn_by, drawn_at";

function mapPart(raw: Record<string, unknown>): IngameParticipation {
  return {
    id: String(raw.id),
    event_id: String(raw.event_id),
    tenant_id: String(raw.tenant_id),
    roleid: Number(raw.roleid),
    role_name: (raw.role_name as string) ?? null,
    userid: raw.userid != null ? Number(raw.userid) : null,
    source: (raw.source as IngameParticipationSource) ?? "npc",
    added_by: (raw.added_by as string) ?? null,
    metadata: raw.metadata ?? null,
    created_at: String(raw.created_at ?? ""),
  };
}

function mapWin(raw: Record<string, unknown>): IngameWinner {
  return {
    id: String(raw.id),
    event_id: String(raw.event_id),
    tenant_id: String(raw.tenant_id),
    roleid: Number(raw.roleid),
    role_name: (raw.role_name as string) ?? null,
    userid: raw.userid != null ? Number(raw.userid) : null,
    drawn_by: String(raw.drawn_by ?? ""),
    drawn_at: String(raw.drawn_at ?? ""),
  };
}

/** Fisher–Yates shuffle in-place. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useIngameParticipations(eventId: string | null) {
  const { session } = useAuth();
  const { active } = useServers();
  const { can } = useServerPermissions();
  const [participations, setParticipations] = useState<IngameParticipation[]>([]);
  const [winners, setWinners] = useState<IngameWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const tenantId = active?.id ?? null;

  const refetch = useCallback(async () => {
    if (!eventId || !tenantId) {
      setParticipations([]);
      setWinners([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [partsRes, winsRes] = await Promise.all([
      supabase
        .from("ingame_participations")
        .select(PART_COLS)
        .eq("event_id", eventId)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true }),
      supabase
        .from("ingame_winners")
        .select(WIN_COLS)
        .eq("event_id", eventId)
        .eq("tenant_id", tenantId)
        .order("drawn_at", { ascending: true }),
    ]);
    if (partsRes.error) console.error("[ingame] participations", partsRes.error);
    if (winsRes.error) console.error("[ingame] winners", winsRes.error);
    setParticipations(
      (partsRes.data ?? []).map((r) => mapPart(r as Record<string, unknown>)),
    );
    setWinners((winsRes.data ?? []).map((r) => mapWin(r as Record<string, unknown>)));
    setLoading(false);
  }, [eventId, tenantId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  /** Adiciona participante manualmente (admin). */
  const addManual = useCallback(
    async (roleid: number, role_name?: string) => {
      if (!session?.user || !tenantId || !eventId) return;
      if (!can("manage_kits")) throw new Error("Sem permissão");
      const { error } = await supabase.from("ingame_participations").insert({
        event_id: eventId,
        tenant_id: tenantId,
        roleid,
        role_name: role_name?.trim() || null,
        source: "manual",
        added_by: session.user.id,
      });
      if (error) {
        if (error.code === "23505") {
          throw new Error("Esse personagem já está registrado");
        }
        await logAuditEvent({
          action: "ingame_participation.add_manual",
          tenantId,
          target: eventId,
          status: "error",
          error: error.message,
        });
        throw error;
      }
      await logAuditEvent({
        action: "ingame_participation.add_manual",
        tenantId,
        target: eventId,
        metadata: { roleid },
      });
      await refetch();
    },
    [session?.user, tenantId, eventId, can, refetch],
  );

  const removeParticipant = useCallback(
    async (id: string) => {
      if (!tenantId || !eventId) return;
      if (!can("manage_kits")) throw new Error("Sem permissão");
      const { error } = await supabase
        .from("ingame_participations")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);
      if (error) throw error;
      await logAuditEvent({
        action: "ingame_participation.remove",
        tenantId,
        target: eventId,
        metadata: { participation_id: id },
      });
      await refetch();
    },
    [tenantId, eventId, can, refetch],
  );

  /** Sorteia N vencedores. Limpa vencedores anteriores se redraw. */
  const drawWinners = useCallback(
    async (winnersCount: number, redraw = false) => {
      if (!session?.user || !tenantId || !eventId) return;
      if (!can("manage_kits")) throw new Error("Sem permissão");
      if (participations.length === 0)
        throw new Error("Sem participantes para sortear");
      if (winnersCount > participations.length)
        throw new Error("Mais vencedores do que participantes válidos");

      if (redraw && winners.length > 0) {
        const { error: delErr } = await supabase
          .from("ingame_winners")
          .delete()
          .eq("event_id", eventId)
          .eq("tenant_id", tenantId);
        if (delErr) throw delErr;
      }

      const picked = shuffle(participations).slice(0, winnersCount);
      const rows = picked.map((p) => ({
        event_id: eventId,
        tenant_id: tenantId,
        roleid: p.roleid,
        role_name: p.role_name,
        userid: p.userid,
        drawn_by: session.user.id,
      }));
      const { error } = await supabase.from("ingame_winners").insert(rows);
      if (error) {
        await logAuditEvent({
          action: redraw ? "ingame_event.draw.redraw" : "ingame_event.draw",
          tenantId,
          target: eventId,
          status: "error",
          error: error.message,
        });
        throw error;
      }
      await logAuditEvent({
        action: redraw ? "ingame_event.draw.redraw" : "ingame_event.draw",
        tenantId,
        target: eventId,
        metadata: { count: rows.length },
      });
      await refetch();
    },
    [session?.user, tenantId, eventId, can, participations, winners.length, refetch],
  );

  return {
    participations,
    winners,
    loading,
    canManage: can("manage_kits"),
    refetch,
    addManual,
    removeParticipant,
    drawWinners,
  };
}

// Phase 4B2 — Participants & Winners management for a single raffle.
//
// Encapsulates fetching, adding, removing participants, listing winners and
// running the draw. The draw itself runs client-side (Fisher–Yates shuffle)
// and persists the result via insert into `raffle_winners`. RLS guarantees
// only users with `manage_kits` can mutate.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/lib/auditLog";
import type {
  RaffleParticipant,
  RaffleParticipantSource,
  RaffleWinner,
} from "@/lib/raffles";

interface ParticipantRow {
  id: string;
  raffle_id: string;
  tenant_id: string;
  roleid: number;
  role_name: string | null;
  userid: number | null;
  source: RaffleParticipantSource;
  added_by: string;
  created_at: string;
}

interface WinnerRow {
  id: string;
  raffle_id: string;
  tenant_id: string;
  roleid: number;
  role_name: string | null;
  userid: number | null;
  drawn_by: string;
  drawn_at: string;
}

function mapParticipant(row: ParticipantRow): RaffleParticipant {
  return { ...row };
}

function mapWinner(row: WinnerRow): RaffleWinner {
  return { ...row };
}

export interface AddParticipantInput {
  roleid: number;
  role_name?: string | null;
  userid?: number | null;
  source?: RaffleParticipantSource;
}

export interface BulkAddResult {
  added: number;
  duplicates: number;
  invalid: number;
  errors: number;
}

/**
 * Fisher–Yates shuffle. Pure, in-place. We copy first to keep the original
 * array immutable.
 */
function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function useRaffleParticipants({
  raffleId,
  tenantId,
}: {
  raffleId: string | null;
  tenantId: string | null;
}) {
  const [participants, setParticipants] = useState<RaffleParticipant[]>([]);
  const [winners, setWinners] = useState<RaffleWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!raffleId || !tenantId) {
      setParticipants([]);
      setWinners([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const [pRes, wRes] = await Promise.all([
      supabase
        .from("raffle_participants")
        .select("*")
        .eq("raffle_id", raffleId)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true }),
      supabase
        .from("raffle_winners")
        .select("*")
        .eq("raffle_id", raffleId)
        .eq("tenant_id", tenantId)
        .order("drawn_at", { ascending: false }),
    ]);
    if (pRes.error) setError(pRes.error.message);
    if (wRes.error) setError((prev) => prev ?? wRes.error!.message);
    setParticipants(((pRes.data ?? []) as ParticipantRow[]).map(mapParticipant));
    setWinners(((wRes.data ?? []) as WinnerRow[]).map(mapWinner));
    setLoading(false);
  }, [raffleId, tenantId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const addParticipant = useCallback(
    async (input: AddParticipantInput): Promise<RaffleParticipant | null> => {
      if (!raffleId || !tenantId) return null;
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) return null;

      const { data, error: err } = await supabase
        .from("raffle_participants")
        .insert({
          raffle_id: raffleId,
          tenant_id: tenantId,
          added_by: userId,
          roleid: input.roleid,
          role_name: input.role_name ?? null,
          userid: input.userid ?? null,
          source: input.source ?? "manual",
        })
        .select("*")
        .single();
      if (err || !data) {
        await logAuditEvent({
          action: "raffle.participant.add",
          tenantId,
          target: raffleId,
          status: "error",
          error: err?.message ?? "unknown",
          metadata: { roleid: input.roleid },
        });
        return null;
      }
      const row = mapParticipant(data as ParticipantRow);
      await logAuditEvent({
        action: "raffle.participant.add",
        tenantId,
        target: raffleId,
        metadata: { roleid: input.roleid, source: row.source },
      });
      setParticipants((prev) => [...prev, row]);
      return row;
    },
    [raffleId, tenantId],
  );

  /** Bulk: parses a list of roleids and inserts each one (skipping duplicates). */
  const bulkAddParticipants = useCallback(
    async (
      roleids: number[],
      source: RaffleParticipantSource = "import",
    ): Promise<BulkAddResult> => {
      const result: BulkAddResult = { added: 0, duplicates: 0, invalid: 0, errors: 0 };
      if (!raffleId || !tenantId) return result;
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) return result;

      const existing = new Set(participants.map((p) => p.roleid));
      const seen = new Set<number>();

      const toInsert: Array<{
        raffle_id: string;
        tenant_id: string;
        added_by: string;
        roleid: number;
        source: RaffleParticipantSource;
      }> = [];

      for (const raw of roleids) {
        const r = Math.floor(raw);
        if (!Number.isFinite(r) || r <= 0) {
          result.invalid++;
          continue;
        }
        if (existing.has(r) || seen.has(r)) {
          result.duplicates++;
          continue;
        }
        seen.add(r);
        toInsert.push({
          raffle_id: raffleId,
          tenant_id: tenantId,
          added_by: userId,
          roleid: r,
          source,
        });
      }

      if (toInsert.length === 0) {
        return result;
      }

      // Insert one-by-one so a single duplicate doesn't abort the batch.
      const inserted: RaffleParticipant[] = [];
      for (const row of toInsert) {
        const { data, error: err } = await supabase
          .from("raffle_participants")
          .insert(row)
          .select("*")
          .single();
        if (err || !data) {
          // 23505 = unique_violation → contar como duplicate, não erro.
          if (err && (err as { code?: string }).code === "23505") {
            result.duplicates++;
          } else {
            result.errors++;
          }
          continue;
        }
        inserted.push(mapParticipant(data as ParticipantRow));
        result.added++;
      }

      if (inserted.length > 0) {
        setParticipants((prev) => [...prev, ...inserted]);
      }
      await logAuditEvent({
        action: "raffle.participant.bulk_add",
        tenantId,
        target: raffleId,
        metadata: result as unknown as Record<string, unknown>,
      });
      return result;
    },
    [raffleId, tenantId, participants],
  );

  const removeParticipant = useCallback(
    async (id: string): Promise<boolean> => {
      if (!raffleId || !tenantId) return false;
      const { error: err } = await supabase
        .from("raffle_participants")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);
      if (err) {
        await logAuditEvent({
          action: "raffle.participant.remove",
          tenantId,
          target: raffleId,
          status: "error",
          error: err.message,
        });
        return false;
      }
      await logAuditEvent({
        action: "raffle.participant.remove",
        tenantId,
        target: raffleId,
        metadata: { participant_id: id },
      });
      setParticipants((prev) => prev.filter((p) => p.id !== id));
      return true;
    },
    [raffleId, tenantId],
  );

  /**
   * Runs the draw. `clearPrevious` controls whether existing winners are wiped
   * before inserting the new selection (used when re-drawing).
   * Returns the inserted winners or `null` on validation failure.
   */
  const drawWinners = useCallback(
    async (winnersCount: number, clearPrevious = false): Promise<RaffleWinner[] | null> => {
      if (!raffleId || !tenantId) return null;
      const count = Math.max(1, Math.floor(winnersCount));
      if (participants.length === 0) {
        setError("Adicione participantes antes de sortear.");
        return null;
      }
      if (count > participants.length) {
        setError(
          `Não é possível sortear ${count} vencedor(es) com apenas ${participants.length} participante(s).`,
        );
        return null;
      }

      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) return null;

      setDrawing(true);
      setError(null);
      try {
        if (clearPrevious && winners.length > 0) {
          const { error: delErr } = await supabase
            .from("raffle_winners")
            .delete()
            .eq("raffle_id", raffleId)
            .eq("tenant_id", tenantId);
          if (delErr) {
            await logAuditEvent({
              action: "raffle.draw.clear_previous",
              tenantId,
              target: raffleId,
              status: "error",
              error: delErr.message,
            });
            setError(delErr.message);
            return null;
          }
        }

        const picked = shuffle(participants).slice(0, count);
        const rows = picked.map((p) => ({
          raffle_id: raffleId,
          tenant_id: tenantId,
          roleid: p.roleid,
          role_name: p.role_name,
          userid: p.userid,
          drawn_by: userId,
        }));

        const { data, error: insErr } = await supabase
          .from("raffle_winners")
          .insert(rows)
          .select("*");
        if (insErr || !data) {
          await logAuditEvent({
            action: "raffle.draw",
            tenantId,
            target: raffleId,
            status: "error",
            error: insErr?.message ?? "unknown",
            metadata: { winners_count: count },
          });
          setError(insErr?.message ?? "Falha ao sortear");
          return null;
        }

        const newWinners = (data as WinnerRow[]).map(mapWinner);
        await logAuditEvent({
          action: clearPrevious ? "raffle.draw.redraw" : "raffle.draw",
          tenantId,
          target: raffleId,
          metadata: {
            winners_count: count,
            participants_count: participants.length,
            winner_roleids: newWinners.map((w) => w.roleid),
          },
        });

        // Refetch to get the canonical ordered list (most recent first).
        if (clearPrevious) {
          setWinners(newWinners);
        } else {
          setWinners((prev) => [...newWinners, ...prev]);
        }
        return newWinners;
      } finally {
        setDrawing(false);
      }
    },
    [raffleId, tenantId, participants, winners],
  );

  return {
    participants,
    winners,
    loading,
    drawing,
    error,
    refetch: fetchAll,
    addParticipant,
    bulkAddParticipants,
    removeParticipant,
    drawWinners,
  };
}

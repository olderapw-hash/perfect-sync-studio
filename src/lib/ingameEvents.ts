// Tipos e helpers do módulo Eventos Ingame.
//
// Conceito: o admin configura/monitora pelo painel; a participação do
// player acontece dentro do jogo (NPC chama a VPS, VPS chama o Supabase).
// A entrega de prêmio reusa sendMailItem/sendMailGold via mail_send_log.
import type { MailItemAttachment } from "@/lib/pwApiActions";

export type IngameEventStatus = "draft" | "active" | "closed";
export type IngameEventType = "ingame_generic";
export type IngameRewardMode = "all_participants" | "raffle_winners";
export type IngameParticipationSource = "npc" | "manual" | "import";
export type IngameDeliveryStatus =
  | "pending"
  | "sent"
  | "error"
  | "duplicate_blocked";

/** Item incluído no prêmio. Espelha o shape esperado por sendMailItem. */
export interface IngameRewardItem extends MailItemAttachment {
  item_name?: string;
  icon_path?: string;
}

export interface IngameRewardPayload {
  items: IngameRewardItem[];
  /** Total em moedas de cobre. 0 = sem gold. */
  gold: number;
}

export interface IngameEvent {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  event_type: IngameEventType;
  status: IngameEventStatus;
  starts_at: string | null;
  ends_at: string | null;
  reward_mode: IngameRewardMode;
  winners_count: number;
  reward_title: string | null;
  reward_message: string | null;
  reward_payload_json: IngameRewardPayload;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface IngameParticipation {
  id: string;
  event_id: string;
  tenant_id: string;
  roleid: number;
  role_name: string | null;
  userid: number | null;
  source: IngameParticipationSource;
  added_by: string | null;
  metadata: unknown;
  created_at: string;
}

export interface IngameWinner {
  id: string;
  event_id: string;
  tenant_id: string;
  roleid: number;
  role_name: string | null;
  userid: number | null;
  drawn_by: string;
  drawn_at: string;
}

export interface IngameRewardDelivery {
  id: string;
  event_id: string;
  tenant_id: string;
  roleid: number;
  role_name: string | null;
  userid: number | null;
  reward_payload_json: IngameRewardPayload;
  idempotency_key: string;
  status: IngameDeliveryStatus;
  mail_log_ids: string[];
  response_json: unknown;
  error_message: string | null;
  sent_by: string;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

/* -------------------------------------------------------------------------- */
/* Labels PT-BR                                                                */
/* -------------------------------------------------------------------------- */

export function ingameStatusLabel(s: IngameEventStatus): string {
  switch (s) {
    case "draft":
      return "Rascunho";
    case "active":
      return "Ativo";
    case "closed":
      return "Encerrado";
  }
}

export function ingameRewardModeLabel(m: IngameRewardMode): string {
  switch (m) {
    case "all_participants":
      return "Todos os participantes";
    case "raffle_winners":
      return "Sortear vencedores";
  }
}

export function ingameSourceLabel(s: IngameParticipationSource): string {
  switch (s) {
    case "npc":
      return "NPC (ingame)";
    case "manual":
      return "Manual";
    case "import":
      return "Importação";
  }
}

export function ingameDeliveryStatusLabel(s: IngameDeliveryStatus): string {
  switch (s) {
    case "pending":
      return "Pendente";
    case "sent":
      return "Entregue";
    case "error":
      return "Erro";
    case "duplicate_blocked":
      return "Duplicada (bloqueada)";
  }
}

/* -------------------------------------------------------------------------- */
/* Reward payload                                                              */
/* -------------------------------------------------------------------------- */

export function normalizeRewardPayload(input: unknown): IngameRewardPayload {
  const fallback: IngameRewardPayload = { items: [], gold: 0 };
  if (!input || typeof input !== "object") return fallback;
  const o = input as Record<string, unknown>;
  const itemsRaw = Array.isArray(o.items) ? o.items : [];
  const items: IngameRewardItem[] = [];
  for (const raw of itemsRaw) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const item_id = Number(r.item_id);
    const count = Number(r.count);
    if (!Number.isFinite(item_id) || item_id <= 0) continue;
    if (!Number.isFinite(count) || count <= 0) continue;
    items.push({
      item_id,
      count,
      max_count: typeof r.max_count === "number" ? r.max_count : undefined,
      proctype: typeof r.proctype === "number" ? r.proctype : undefined,
      expire_date: typeof r.expire_date === "number" ? r.expire_date : undefined,
      mask: typeof r.mask === "number" ? r.mask : undefined,
      guid1: typeof r.guid1 === "number" ? r.guid1 : undefined,
      guid2: typeof r.guid2 === "number" ? r.guid2 : undefined,
      data: typeof r.data === "string" ? r.data : undefined,
      item_name: typeof r.item_name === "string" ? r.item_name : undefined,
      icon_path: typeof r.icon_path === "string" ? r.icon_path : undefined,
    });
  }
  const gold =
    typeof o.gold === "number" && Number.isFinite(o.gold) && o.gold > 0
      ? Math.floor(o.gold)
      : 0;
  return { items, gold };
}

export function isRewardPayloadValid(p: IngameRewardPayload): boolean {
  return p.items.length > 0 || p.gold > 0;
}

/** Hash determinístico e estável do payload (não criptográfico). */
export function rewardPayloadHash(p: IngameRewardPayload): string {
  const items = [...p.items]
    .map((i) => ({
      item_id: i.item_id,
      count: i.count,
      mask: i.mask ?? 0,
      guid1: i.guid1 ?? 0,
      guid2: i.guid2 ?? 0,
    }))
    .sort((a, b) => a.item_id - b.item_id || a.count - b.count);
  const stable = JSON.stringify({ items, gold: p.gold });
  let hash = 0;
  for (let i = 0; i < stable.length; i++) {
    hash = (hash << 5) - hash + stable.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/** Gera idempotency_key padronizada para a entrega de prêmio. */
export function buildDeliveryKey(
  eventId: string,
  roleid: number,
  payload: IngameRewardPayload,
): string {
  return `${eventId}:${roleid}:${rewardPayloadHash(payload)}`;
}

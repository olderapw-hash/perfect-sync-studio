// Helpers do módulo Eventos · Presença (Fase 4A).
//
// Toda a lógica vive no Supabase + envia recompensa pelo correio existente
// (sendMailItem / sendMailGold). A VPS não tem endpoint dedicado de presença
// nesta fase — se um dia tiver, basta plugar aqui.
//
// Idempotência: por (event_id, roleid, date_key). O date_key é calculado
// no fuso configurado em attendance_events.timezone.

import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/lib/auditLog";
import { sendMailGold, sendMailItem } from "@/lib/mailSend";
import type { MailGoldPayload, MailItemPayload } from "@/lib/mailTemplates";

/* ─────────── Tipos ─────────── */

export interface AttendanceRewardItem {
  item_id: number;
  count: number;
  /** Snapshot do nome para exibir no histórico sem depender do catálogo. */
  item_name?: string;
  icon_path?: string;
  max_count?: number;
}

export interface AttendanceRewardPayload {
  items: AttendanceRewardItem[];
  /** Valor de gold opcional, no menor denominador (cobre). */
  gold?: number;
  subject?: string;
  body?: string;
}

export interface AttendanceEventRow {
  id: string;
  tenant_id: string;
  created_by: string;
  name: string;
  description: string | null;
  status_active: boolean;
  period_start: string | null;
  period_end: string | null;
  daily_reset: boolean;
  streak_enabled: boolean;
  timezone: string;
  reward_payload: AttendanceRewardPayload;
  streak_payload: AttendanceRewardPayload | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceClaimRow {
  id: string;
  tenant_id: string;
  event_id: string;
  roleid: number;
  role_name: string | null;
  date_key: string;
  claimed_by: string;
  claimed_at: string;
  streak_count: number;
  metadata: Record<string, unknown> | null;
}

export type AttendanceDeliveryStatus =
  | "pending"
  | "sent"
  | "error"
  | "duplicate_blocked";

export interface AttendanceDeliveryRow {
  id: string;
  tenant_id: string;
  event_id: string;
  claim_id: string | null;
  roleid: number;
  role_name: string | null;
  date_key: string;
  status: AttendanceDeliveryStatus;
  mail_log_ids: string[];
  reward_snapshot: AttendanceRewardPayload;
  error_message: string | null;
  delivered_by: string;
  created_at: string;
  updated_at: string;
}

/* ─────────── date_key no fuso do evento ─────────── */

/**
 * Calcula a chave de dia (YYYY-MM-DD) no fuso passado. Usa Intl para
 * evitar dependência externa. Se o fuso for inválido, cai em UTC.
 */
export function computeDateKey(timezone: string, when: Date = new Date()): string {
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    // en-CA já formata como YYYY-MM-DD
    return fmt.format(when);
  } catch {
    return when.toISOString().slice(0, 10);
  }
}

/** Lista de fusos sugeridos no editor — não é exaustiva. */
export const TIMEZONE_OPTIONS = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Belem",
  "America/Fortaleza",
  "America/Argentina/Buenos_Aires",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Lisbon",
  "Europe/London",
  "UTC",
];

/* ─────────── Validação ─────────── */

export function validateRewardPayload(p: AttendanceRewardPayload): string | null {
  if (!p || typeof p !== "object") return "Recompensa inválida";
  const items = Array.isArray(p.items) ? p.items : [];
  const gold = typeof p.gold === "number" ? p.gold : 0;
  if (items.length === 0 && gold <= 0) {
    return "Adicione ao menos 1 item ou um valor de gold";
  }
  for (const it of items) {
    if (!Number.isFinite(it.item_id) || it.item_id <= 0) {
      return "Item ID inválido";
    }
    if (!Number.isFinite(it.count) || it.count <= 0) {
      return "Quantidade do item inválida";
    }
  }
  if (gold && (!Number.isFinite(gold) || gold <= 0 || gold > 2_000_000_000)) {
    return "Valor de gold fora do permitido";
  }
  return null;
}

/* ─────────── Persistência: claim + delivery ─────────── */

export interface RegisterAttendanceArgs {
  event: AttendanceEventRow;
  roleid: number;
  roleName?: string | null;
  userId: string;
  /** Override útil para testes — default = agora. */
  now?: Date;
}

export interface RegisterAttendanceResult {
  status: "sent" | "duplicate_blocked" | "error" | "pending";
  message: string;
  claimId: string | null;
  deliveryId: string | null;
  dateKey: string;
}

/**
 * Registra a presença de um personagem em um evento e dispara a entrega
 * da recompensa por correio. Sempre grava em attendance_reward_deliveries
 * para o histórico, mesmo em duplicidade ou erro.
 */
export async function registerAttendance(
  args: RegisterAttendanceArgs,
): Promise<RegisterAttendanceResult> {
  const { event, roleid, roleName, userId, now = new Date() } = args;
  const dateKey = computeDateKey(event.timezone, now);

  // 1) Janela do evento
  if (!event.status_active) {
    return failClosed(event, roleid, roleName ?? null, dateKey, userId, "Evento inativo");
  }
  const ts = now.getTime();
  if (event.period_start && new Date(event.period_start).getTime() > ts) {
    return failClosed(event, roleid, roleName ?? null, dateKey, userId, "Evento ainda não começou");
  }
  if (event.period_end && new Date(event.period_end).getTime() < ts) {
    return failClosed(event, roleid, roleName ?? null, dateKey, userId, "Evento já encerrado");
  }

  // 2) Validação da recompensa
  const reward = event.reward_payload ?? { items: [] };
  const rewardErr = validateRewardPayload(reward);
  if (rewardErr) {
    return failClosed(event, roleid, roleName ?? null, dateKey, userId, rewardErr);
  }

  // 3) Tenta inserir o claim — se a unique disparar, é duplicata.
  const { data: claimData, error: claimError } = await supabase
    .from("attendance_claims")
    .insert({
      tenant_id: event.tenant_id,
      event_id: event.id,
      roleid,
      role_name: roleName ?? null,
      date_key: dateKey,
      claimed_by: userId,
      streak_count: 1,
    })
    .select("id")
    .single();

  if (claimError) {
    // 23505 = unique_violation
    const code = (claimError as { code?: string }).code;
    if (code === "23505") {
      const dup = await persistDelivery({
        tenantId: event.tenant_id,
        eventId: event.id,
        claimId: null,
        roleid,
        roleName: roleName ?? null,
        dateKey,
        status: "duplicate_blocked",
        mailLogIds: [],
        rewardSnapshot: reward,
        errorMessage: "Presença já registrada hoje neste evento",
        userId,
      });
      await logAuditEvent({
        action: "attendance.register",
        tenantId: event.tenant_id,
        target: String(roleid),
        status: "ok",
        metadata: { event_id: event.id, date_key: dateKey, result: "duplicate_blocked" },
      });
      return {
        status: "duplicate_blocked",
        message: "Presença já registrada hoje para este personagem",
        claimId: null,
        deliveryId: dup,
        dateKey,
      };
    }
    return failClosed(
      event,
      roleid,
      roleName ?? null,
      dateKey,
      userId,
      claimError.message ?? "Falha ao registrar presença",
    );
  }

  const claimId = (claimData as { id: string }).id;

  // 4) Dispara correio item-a-item + gold (se houver)
  const mailLogIds: string[] = [];
  const errors: string[] = [];
  let anyPending = false;

  const subject = reward.subject?.trim() || `Recompensa · ${event.name}`;
  const body = reward.body?.trim() || `Obrigado por participar de "${event.name}".`;

  for (const it of reward.items ?? []) {
    const payload: MailItemPayload = {
      item_id: it.item_id,
      count: it.count,
      max_count: it.max_count,
      item_name: it.item_name,
      icon_path: it.icon_path,
    };
    const r = await sendMailItem({
      tenantId: event.tenant_id,
      userId,
      templateId: null,
      targetRoleid: roleid,
      targetName: roleName ?? null,
      subject,
      body,
      payload,
    });
    if (r.logId) mailLogIds.push(r.logId);
    if (r.status === "success") continue;
    if (r.status === "pending") {
      anyPending = true;
      continue;
    }
    errors.push(r.errorMessage || `Falha ao enviar item ${it.item_id}`);
  }

  if (typeof reward.gold === "number" && reward.gold > 0) {
    const payload: MailGoldPayload = { amount: reward.gold };
    const r = await sendMailGold({
      tenantId: event.tenant_id,
      userId,
      templateId: null,
      targetRoleid: roleid,
      targetName: roleName ?? null,
      subject,
      body,
      payload,
    });
    if (r.logId) mailLogIds.push(r.logId);
    if (r.status !== "success") {
      if (r.status === "pending") anyPending = true;
      else errors.push(r.errorMessage || "Falha ao enviar gold");
    }
  }

  const status: AttendanceDeliveryStatus = errors.length > 0 ? "error" : "sent";
  const errorMessage = errors.length > 0 ? errors.join(" · ") : null;

  const deliveryId = await persistDelivery({
    tenantId: event.tenant_id,
    eventId: event.id,
    claimId,
    roleid,
    roleName: roleName ?? null,
    dateKey,
    status,
    mailLogIds,
    rewardSnapshot: reward,
    errorMessage,
    userId,
  });

  await logAuditEvent({
    action: "attendance.register",
    tenantId: event.tenant_id,
    target: String(roleid),
    status: status === "sent" ? "ok" : "error",
    error: errorMessage,
    metadata: {
      event_id: event.id,
      date_key: dateKey,
      result: status,
      mail_log_count: mailLogIds.length,
    },
  });

  return {
    status: status === "sent" && anyPending ? "pending" : status,
    message:
      status === "sent"
        ? "Presença registrada e recompensa enviada"
        : errorMessage ?? "Erro ao entregar recompensa",
    claimId,
    deliveryId,
    dateKey,
  };
}

async function persistDelivery(args: {
  tenantId: string;
  eventId: string;
  claimId: string | null;
  roleid: number;
  roleName: string | null;
  dateKey: string;
  status: AttendanceDeliveryStatus;
  mailLogIds: string[];
  rewardSnapshot: AttendanceRewardPayload;
  errorMessage: string | null;
  userId: string;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from("attendance_reward_deliveries")
    .insert({
      tenant_id: args.tenantId,
      event_id: args.eventId,
      claim_id: args.claimId,
      roleid: args.roleid,
      role_name: args.roleName,
      date_key: args.dateKey,
      status: args.status,
      mail_log_ids: args.mailLogIds,
      reward_snapshot: args.rewardSnapshot as never,
      error_message: args.errorMessage,
      delivered_by: args.userId,
    })
    .select("id")
    .single();
  if (error) {
    console.warn("[attendance] failed to persist delivery", error);
    return null;
  }
  return (data as { id: string }).id;
}

/**
 * Encerra o fluxo gravando uma delivery `error` (sem claim) e retornando
 * o resultado já formatado. Mantém o histórico mesmo quando o evento
 * sequer está aberto.
 */
async function failClosed(
  event: AttendanceEventRow,
  roleid: number,
  roleName: string | null,
  dateKey: string,
  userId: string,
  message: string,
): Promise<RegisterAttendanceResult> {
  const deliveryId = await persistDelivery({
    tenantId: event.tenant_id,
    eventId: event.id,
    claimId: null,
    roleid,
    roleName,
    dateKey,
    status: "error",
    mailLogIds: [],
    rewardSnapshot: event.reward_payload ?? { items: [] },
    errorMessage: message,
    userId,
  });
  await logAuditEvent({
    action: "attendance.register",
    tenantId: event.tenant_id,
    target: String(roleid),
    status: "error",
    error: message,
    metadata: { event_id: event.id, date_key: dateKey, result: "error" },
  });
  return {
    status: "error",
    message,
    claimId: null,
    deliveryId,
    dateKey,
  };
}

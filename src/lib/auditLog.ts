// Frontend audit log helper. Roda em best-effort: nunca quebra o fluxo do
// usuário. Usa a RPC `log_audit_event` (SECURITY DEFINER) que grava em
// `audit_logs` no nome de auth.uid().
import { supabase } from "@/integrations/supabase/client";

export interface LogAuditOptions {
  action: string;
  tenantId?: string | null;
  target?: string | null;
  status?: "ok" | "error";
  httpStatus?: number | null;
  error?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logAuditEvent(opts: LogAuditOptions): Promise<void> {
  try {
    await supabase.rpc("log_audit_event", {
      _action: opts.action,
      _tenant_id: opts.tenantId ?? null,
      _target: opts.target ?? null,
      _status: opts.status ?? "ok",
      _http_status: opts.httpStatus ?? null,
      _error: opts.error ?? null,
      _metadata: (opts.metadata ?? null) as never,
    });
  } catch (e) {
    console.warn("[audit] log failed", opts.action, e);
  }
}

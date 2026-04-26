// Hook de polling pra Server Ops v3 — assista uma operação async (start/stop/restart)
// chamando getServerOperationStatus em loop até finalizar (running=false).
//
// Uso:
//   const { status, loading, error, missing, refresh, stop } =
//     useOperationStatusPolling({ operationId, type, intervalMs: 2500 });
//
// Quando `operationId` muda pra null/undefined, o polling para e o estado é limpo.
// Quando a operação reporta running=false, o intervalo é cancelado automaticamente.

import { useCallback, useEffect, useRef, useState } from "react";
import { pwApi } from "@/lib/pwApiActions";
import { EndpointMissingError } from "@/lib/pwApiActions";
import type { ServerOperationStatus } from "@/lib/pwApiActions";

export interface UseOperationStatusPollingOptions {
  operationId: string | null | undefined;
  /** Opcional: filtra a busca por tipo (startServer/stopServer/...) — útil quando não temos id ainda. */
  type?: string;
  /** Intervalo entre polls em ms. Default 2500ms. */
  intervalMs?: number;
  /** Quando true, NÃO inicia polling (mas mantém helpers utilizáveis). */
  paused?: boolean;
}

export interface UseOperationStatusPollingResult {
  status: ServerOperationStatus | null;
  loading: boolean;
  error: string | null;
  /** True quando a VPS não tem o endpoint getServerOperationStatus. */
  missing: boolean;
  /** Dispara um fetch imediato (botão "Atualizar agora"). */
  refresh: () => Promise<void>;
  /** Para o polling manualmente sem limpar o estado. */
  stop: () => void;
}

export function useOperationStatusPolling(
  opts: UseOperationStatusPollingOptions,
): UseOperationStatusPollingResult {
  const { operationId, type, intervalMs = 2500, paused = false } = opts;
  const [status, setStatus] = useState<ServerOperationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  // Refs pra evitar re-render em cada tick e permitir cleanup confiável.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const inflightRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fetchOnce = useCallback(async () => {
    if (!operationId && !type) return;
    if (inflightRef.current) return; // evita corrida quando o tick anterior ainda não voltou
    inflightRef.current = true;
    setLoading(true);
    try {
      const res = await pwApi.getServerOperationStatus({
        operation_id: operationId ?? undefined,
        type,
      });
      if (!mountedRef.current) return;
      if (res.success && res.operation) {
        setStatus(res.operation);
        setError(null);
        setMissing(false);
        if (!res.operation.running) {
          clearTimer();
        }
      } else {
        setError(res.error ?? "Resposta sem operation");
      }
    } catch (e) {
      if (!mountedRef.current) return;
      if (e instanceof EndpointMissingError) {
        setMissing(true);
        setError("Status em tempo real indisponível nesta VPS.");
        clearTimer();
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      inflightRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, [operationId, type, clearTimer]);

  // Inicia/Reinicia polling quando muda o id.
  useEffect(() => {
    mountedRef.current = true;
    if (paused || (!operationId && !type)) {
      clearTimer();
      return () => {
        mountedRef.current = false;
        clearTimer();
      };
    }
    // reset
    setStatus(null);
    setError(null);
    setMissing(false);
    // primeira chamada imediata + interval
    void fetchOnce();
    intervalRef.current = setInterval(() => {
      void fetchOnce();
    }, Math.max(1000, intervalMs));
    return () => {
      mountedRef.current = false;
      clearTimer();
    };
  }, [operationId, type, intervalMs, paused, fetchOnce, clearTimer]);

  return {
    status,
    loading,
    error,
    missing,
    refresh: fetchOnce,
    stop: clearTimer,
  };
}

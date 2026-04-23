import { useEffect, useState } from "react";
import { normalizeClsconfigResponse } from "@/lib/clsconfig";
import { invokeClsconfigProxy } from "@/lib/clsconfigInvoke";
import { NoServerSelectedError } from "@/lib/authErrors";
import { useServers } from "@/hooks/useServers";
import type { ClsconfigResponse } from "@/types/clsconfig";

interface State {
  data: ClsconfigResponse | null;
  raw: unknown;
  loading: boolean;
  error: string | null;
}

export function useClsconfig() {
  const { active } = useServers();
  const [state, setState] = useState<State>({ data: null, raw: null, loading: true, error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const { data, error, rawBody } = await invokeClsconfigProxy("clsconfig-proxy/clsconfig", {
          method: "GET",
        });
        if (error) {
          throw new Error(rawBody ? `${error.message}\n\n${rawBody}` : error.message);
        }
        if (data && typeof data === "object" && (data as { success?: boolean }).success === false) {
          throw new Error(JSON.stringify(data, null, 2));
        }
        const normalized = normalizeClsconfigResponse(data);
        if (!cancelled) setState({ data: normalized, raw: data, loading: false, error: null });
      } catch (e) {
        const msg =
          e instanceof NoServerSelectedError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Falha ao carregar clsconfig";
        if (!cancelled) setState({ data: null, raw: null, loading: false, error: msg });
      }
    })();
    return () => {
      cancelled = true;
    };
    // active?.id é a chave: troca de servidor → recarrega.
  }, [reloadKey, active?.id]);

  return { ...state, reload: () => setReloadKey((k) => k + 1) };
}


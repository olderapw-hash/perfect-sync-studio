import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeClsconfigResponse } from "@/lib/clsconfig";
import { handleMaybeAuthError } from "@/lib/authErrors";
import type { ClsconfigResponse } from "@/types/clsconfig";

interface State {
  data: ClsconfigResponse | null;
  raw: unknown;
  loading: boolean;
  error: string | null;
}

export function useClsconfig() {
  const [state, setState] = useState<State>({ data: null, raw: null, loading: true, error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const { data, error } = await supabase.functions.invoke("clsconfig-proxy/clsconfig", {
          method: "GET",
        });
        if (error) {
          // Surface upstream JSON body when present (FunctionsHttpError exposes .context)
          const ctx = (error as unknown as { context?: Response }).context;
          let extra = "";
          if (ctx && typeof ctx.text === "function") {
            try {
              extra = await ctx.text();
            } catch {
              /* ignore */
            }
          }
          throw new Error(extra ? `${error.message}\n\n${extra}` : error.message);
        }
        if (data && typeof data === "object" && (data as { success?: boolean }).success === false) {
          throw new Error(JSON.stringify(data, null, 2));
        }
        const normalized = normalizeClsconfigResponse(data);
        if (!cancelled) setState({ data: normalized, raw: data, loading: false, error: null });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Falha ao carregar clsconfig";
        handleMaybeAuthError(e);
        if (!cancelled) setState({ data: null, raw: null, loading: false, error: msg });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return { ...state, reload: () => setReloadKey((k) => k + 1) };
}

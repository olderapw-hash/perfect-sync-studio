import { useEffect, useState } from "react";

/**
 * Chave de licença embutida no build para instalações VPS.
 * Quando vazia (painel hospedado principal), a validação é ignorada.
 */
const LICENSE_KEY = import.meta.env.VITE_LICENSE_KEY as string | undefined;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

interface LicenseState {
  /** null = verificando, true = válida ou não aplicável, false = inválida */
  valid: boolean | null;
  reason?: string;
  plan?: string;
  clientName?: string;
  expiresAt?: string;
  expiresSoon?: boolean;
  daysRemaining?: number;
}

/**
 * Hook que valida a licença de instalação no boot do app.
 * Se VITE_LICENSE_KEY não está definida, retorna `valid: true` (modo SaaS).
 */
export function useLicenseValidation(): LicenseState {
  const [state, setState] = useState<LicenseState>({ valid: null });

  useEffect(() => {
    // Sem chave = modo SaaS hospedado, pula validação
    if (!LICENSE_KEY) {
      setState({ valid: true });
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/validate-license`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ license_key: LICENSE_KEY }),
          },
        );
        const data = await res.json();

        if (cancelled) return;

        if (data.valid) {
          setState({
            valid: true,
            plan: data.plan,
            clientName: data.client_name,
            expiresAt: data.expires_at,
            expiresSoon: data.expires_soon ?? false,
            daysRemaining: data.days_remaining,
          });
        } else {
          setState({ valid: false, reason: data.reason ?? "unknown" });
        }
      } catch {
        if (cancelled) return;
        // Erro de rede — permite acesso offline (fallback gracioso)
        setState({ valid: true });
      }
    }

    check();
    // Re-valida a cada 6 horas
    const interval = setInterval(check, 6 * 60 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return state;
}

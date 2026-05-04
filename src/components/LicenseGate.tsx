import { Shield, AlertTriangle } from "lucide-react";
import { useLicenseValidation } from "@/hooks/useLicenseValidation";

const REASON_TEXT: Record<string, string> = {
  not_found: "Chave de licença não encontrada.",
  revoked: "Esta licença foi revogada pelo administrador.",
  suspended: "Esta licença está temporariamente suspensa.",
  expired: "Sua licença expirou. Entre em contato para renovação.",
  unknown: "Não foi possível validar sua licença.",
};

/**
 * Envolve o app e bloqueia acesso se a licença for inválida.
 * Quando VITE_LICENSE_KEY não está definida, renderiza os children normalmente.
 */
export function LicenseGate({ children }: { children: React.ReactNode }) {
  const { valid, reason } = useLicenseValidation();

  // Verificando...
  if (valid === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Shield className="h-10 w-10 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Verificando licença...</p>
        </div>
      </div>
    );
  }

  // Inválida
  if (!valid) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-destructive/40 bg-destructive/5 p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h1 className="text-xl font-bold text-destructive">Licença Inválida</h1>
          <p className="text-sm text-muted-foreground">
            {REASON_TEXT[reason ?? "unknown"]}
          </p>
          <p className="text-xs text-muted-foreground/70">
            Entre em contato com o fornecedor do painel para resolver esta situação.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

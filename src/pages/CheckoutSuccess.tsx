import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { isActive, loading: subLoading, refetch } = useSubscription();

  // Refetch a few times after returning from checkout (webhook may take a moment)
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      refetch();
    }, 2000);
    const timeout = setTimeout(() => clearInterval(interval), 20000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [session, refetch]);

  // Auto-redirect to onboarding once subscription is active
  useEffect(() => {
    if (isActive) {
      const t = setTimeout(() => navigate("/onboarding", { replace: true }), 1500);
      return () => clearTimeout(t);
    }
  }, [isActive, navigate]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md rounded-xl border border-border bg-card/40 p-6 text-center">
          <h1 className="text-xl font-extrabold">Faça login pra continuar</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Você precisa estar logado pra acessar o painel após o pagamento.
          </p>
          <Link
            to="/auth"
            className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md rounded-2xl border border-primary/40 bg-card/60 p-8 text-center shadow-glow">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          {isActive ? <CheckCircle2 className="h-7 w-7" /> : <Loader2 className="h-7 w-7 animate-spin" />}
        </div>
        <h1 className="text-2xl font-extrabold">
          {isActive ? "Pagamento confirmado!" : "Confirmando pagamento..."}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {isActive
            ? "Sua assinatura está ativa. Redirecionando pro setup do seu servidor..."
            : "Estamos finalizando a confirmação. Em alguns segundos você será redirecionado."}
        </p>
        {!subLoading && !isActive && (
          <button
            onClick={() => refetch()}
            className="mt-6 rounded-md border border-border bg-card/60 px-4 py-2 text-xs hover:border-primary/50"
          >
            Verificar novamente
          </button>
        )}
      </div>
    </div>
  );
};

export default CheckoutSuccess;

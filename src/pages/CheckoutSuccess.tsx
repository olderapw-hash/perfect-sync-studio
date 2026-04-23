import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { isActive, loading: subLoading, refetch } = useSubscription();

  // Webhook do Paddle pode demorar até ~1min em dias ruins. Faz polling agressivo
  // por 60s e depois deixa o usuário revalidar manualmente.
  const [pollExhausted, setPollExhausted] = useState(false);
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      refetch();
    }, 2000);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setPollExhausted(true);
    }, 60000);
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
            : pollExhausted
              ? "A confirmação está demorando mais do que o normal — pode ser o webhook do Paddle. Tente revalidar ou continuar manualmente."
              : "Estamos finalizando a confirmação. Em alguns segundos você será redirecionado."}
        </p>
        {!subLoading && !isActive && (
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => refetch()}
              className="rounded-md border border-border bg-card/60 px-4 py-2 text-xs hover:border-primary/50"
            >
              Verificar agora
            </button>
            {pollExhausted && (
              <>
                <Link
                  to="/onboarding"
                  className="rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
                >
                  Já paguei, continuar pro setup
                </Link>
                <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> Se o pagamento foi confirmado pelo Paddle, sua
                  assinatura aparece em até 2 min.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutSuccess;

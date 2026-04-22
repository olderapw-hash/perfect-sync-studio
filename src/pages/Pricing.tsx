import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

const PLAN_FEATURES = [
  "Editor completo de personagens (status, equip, inventário, storehouse)",
  "Templates iniciais por classe (clsconfig)",
  "Backups automáticos + restauração 1-clique",
  "Histórico completo de alterações",
  "Múltiplos administradores",
  "Fotos personalizadas das classes",
  "Branding do seu servidor (logo, nome, cor)",
  "Suporte por Discord",
];

const Pricing = () => {
  const navigate = useNavigate();
  const { session, user } = useAuth();
  const { isActive } = useSubscription();
  const { openCheckout, loading } = usePaddleCheckout();

  const handleCheckout = async () => {
    if (!session) {
      navigate("/auth?next=/pricing");
      return;
    }
    if (isActive) {
      navigate("/admin");
      return;
    }
    try {
      await openCheckout({
        priceId: "pw_admin_monthly",
        customerEmail: user?.email,
        userId: user?.id,
        successUrl: `${window.location.origin}/checkout/success`,
      });
    } catch (e) {
      console.error(e);
      toast.error("Erro ao abrir checkout. Tenta de novo.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PaymentTestModeBanner />

      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-extrabold uppercase tracking-wider">
              PW <span className="text-primary">Admin</span>
            </span>
          </Link>
          {session ? (
            <Link
              to="/admin"
              className="rounded-md border border-border bg-card/40 px-3 py-2 text-xs font-medium hover:border-primary/50"
            >
              Voltar ao painel
            </Link>
          ) : (
            <Link
              to="/auth"
              className="rounded-md border border-border bg-card/40 px-3 py-2 text-xs font-medium hover:border-primary/50"
            >
              Entrar
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Assinar</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Acesso completo ao PW Admin
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Sem fidelidade. Cancele quando quiser. 7 dias de teste grátis pra você sentir.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-card via-card/80 to-card p-8 shadow-glow sm:p-10">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
              Plano único
            </div>

            <div className="mb-2 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold tracking-tight">R$ 47</span>
              <span className="text-base text-muted-foreground">/mês</span>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Por servidor. Sem limite de personagens editados.
            </p>

            <ul className="mb-8 space-y-3">
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-glow transition-smooth hover:brightness-110 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isActive ? "Você já é assinante" : "Começar 7 dias grátis"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Cancele quando quiser • Cobrança gerenciada pelo Paddle
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;

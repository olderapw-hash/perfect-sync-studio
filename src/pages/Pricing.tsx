import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Loader2, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { useServers } from "@/hooks/useServers";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";
import { getPaymentEnvironment } from "@/lib/paddle";

const PLAN_FEATURES = [
  "Editor completo de personagens (status, equip, inventário, storehouse)",
  "Templates iniciais por classe (clsconfig)",
  "Controle do servidor (start, stop, restart remoto)",
  "Área de segurança: kick, ban e moderação de jogadores",
  "Envio de itens e recompensas por correio in-game",
  "Backups automáticos + restauração 1-clique",
  "Histórico completo de alterações",
  "Múltiplos administradores com permissões granulares",
  "Fotos personalizadas das classes e personagens",
  "Branding do seu servidor (logo, nome, cor)",
  "Suporte por Discord",
];

const FAQ = [
  {
    q: "Como funcionam os 7 dias grátis?",
    a: "Você cadastra o cartão, mas não é cobrado nos primeiros 7 dias. Pode cancelar a qualquer momento dentro desse período sem pagar nada.",
  },
  {
    q: "Preciso instalar algo na minha VPS?",
    a: "Sim, um arquivo PHP único (api_cls.php) que faz a ponte entre o painel e o Perfect World. Temos um instalador automático pra CentOS 7 — leva 2 minutos.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, sem multa, sem fidelidade. O cancelamento é imediato pela página /admin → Conta.",
  },
  {
    q: "Funciona com qualquer versão do Perfect World?",
    a: "Funciona com servidores que rodam gamedbd padrão (1.5.5+). Compatível com a maioria dos servidores PT-BR e internacionais.",
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const { session, user, isAdmin, isSuperadmin, loading: authLoading } = useAuth();
  const { isActive, isTrial, loading: subLoading, refetch: refetchSub } = useSubscription();
  const { active, loading: serversLoading } = useServers();
  const { openCheckout, loading } = usePaddleCheckout();
  const [trialLoading, setTrialLoading] = useState(false);

  // Se o usuário já tem acesso (assinatura ativa OU é admin/superadmin)
  // e tem servidor configurado, mandamos direto pro painel — não faz sentido
  // exibir tela de assinatura.
  useEffect(() => {
    if (authLoading || subLoading || serversLoading) return;
    if (!session) return;
    // Trial → área dedicada /trial.
    if (isTrial) {
      navigate("/trial", { replace: true });
      return;
    }
    const bypass = isActive || isAdmin || isSuperadmin;
    if (bypass && active?.onboarding_completed) {
      navigate("/admin", { replace: true });
    }
  }, [
    authLoading,
    subLoading,
    serversLoading,
    session,
    isActive,
    isTrial,
    isAdmin,
    isSuperadmin,
    active?.onboarding_completed,
    navigate,
  ]);

  const handleCheckout = async () => {
    if (!session) {
      navigate("/auth?next=/pricing");
      return;
    }
    if (isActive && !isTrial) {
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

  const handleStartTrial = async () => {
    if (!session) {
      navigate("/auth?next=/pricing");
      return;
    }
    setTrialLoading(true);
    try {
      const { error } = await supabase.rpc("start_free_trial", {
        _environment: getPaymentEnvironment(),
      });
      if (error) throw error;
      toast.success("Trial gratuito ativado!");
      await refetchSub();
      navigate("/trial");
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível iniciar o trial. Tenta de novo.");
    } finally {
      setTrialLoading(false);
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

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-16">
        <div className="mb-8 text-center sm:mb-10">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Escolha seu plano</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
            Pare de editar SQL na unha
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Painel completo pra administrar seu servidor Perfect World.
            <strong className="text-foreground"> Comece grátis</strong> · cancele quando quiser ·
            sem fidelidade.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Free Trial */}
          <div className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card/40 p-5 sm:p-8">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" />
              Free Trial
            </div>

            <div className="mb-2 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight sm:text-5xl">R$ 0</span>
              <span className="text-sm text-muted-foreground sm:text-base">/sempre</span>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Sem cartão. Visualize tudo, edite só templates iniciais (CLS).
            </p>

            <ul className="mb-8 space-y-3">
              {[
                "Visualizar todo o painel",
                "Editar slots de equipamento (CLS) manualmente",
                "Editar inventário item por item (CLS)",
                "Editar status básico (HP/MP/level inicial)",
                "Salvar templates iniciais",
                "Recursos Pro bloqueados (bulk, mail, segurança)",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                  <span className="text-foreground/80">{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleStartTrial}
              disabled={trialLoading || isTrial}
              className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-6 py-3.5 text-sm font-bold text-primary transition-smooth hover:bg-primary/20 disabled:opacity-60"
            >
              {trialLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isTrial ? (
                "Trial já ativo"
              ) : (
                <>
                  Começar grátis
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Sem cartão · sem prazo · upgrade quando quiser
            </p>
          </div>

          {/* Paid plan */}
          <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-card via-card/80 to-card p-5 shadow-glow sm:p-8">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative flex flex-1 flex-col">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                  Plano Pro · tudo incluso
                </div>
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  Recomendado
                </span>
              </div>

              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight sm:text-5xl">R$ 47</span>
                <span className="text-sm text-muted-foreground sm:text-base">/mês</span>
              </div>
              <p className="mb-6 text-sm text-muted-foreground">
                Por servidor. Sem limite de personagens, edições ou administradores.
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
                className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-glow transition-smooth hover:brightness-110 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isActive && !isTrial ? "Você já é assinante" : "Começar 7 dias grátis"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Sem cobrança nos 7 primeiros dias · Pagamento seguro via Paddle
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="mb-6 text-center text-lg font-extrabold tracking-tight">
            Perguntas frequentes
          </h2>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-border bg-card/40 p-4 transition-smooth hover:border-primary/30"
              >
                <summary className="cursor-pointer list-none text-sm font-bold text-foreground">
                  <span className="mr-2 text-primary">+</span>
                  {item.q}
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Pricing;

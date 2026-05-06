import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Crown, Loader2, Server, Shield, Sparkles, Zap, QrCode } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { usePixCheckout } from "@/hooks/usePixCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { useServers } from "@/hooks/useServers";
import { useAppSettings } from "@/hooks/useAppSettings";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { PixCheckoutModal } from "@/components/PixCheckoutModal";
import { supabase } from "@/integrations/supabase/client";
import { getPaymentEnvironment } from "@/lib/paddle";

type BillingCycle = "monthly" | "yearly";

const INICIANTE_FEATURES = [
  "Visualizar todo o painel",
  "Editar slots de equipamento (CLS) manualmente",
  "Editar inventário item por item (CLS)",
  "Editar status básico (HP/MP/level inicial)",
  "Salvar templates iniciais",
];

const PRO_FEATURES = [
  "Editor completo de personagens (status, equip, inventário, storehouse)",
  "Templates iniciais por classe (clsconfig)",
  "Bulk apply: aplicar template em vários personagens",
  "Backups automáticos + restauração 1-clique",
  "Histórico completo de alterações",
  "Envio de itens e recompensas por correio in-game",
  "Eventos in-game e participações",
  "Kits iniciais e item catalog avançado",
  "Branding do servidor (logo, nome, cor)",
  "Suporte por Discord",
];

const ULTIMATE_FEATURES = [
  "Tudo do plano Pro",
  "Server Ops: start, stop e restart remoto do servidor",
  "Controle granular de instâncias (gs/gsalt/world)",
  "Múltiplos servidores no mesmo painel",
  "Convites e membros ilimitados",
  "Área de segurança: kick, ban e moderação",
  "Manutenção, mensagens globais e logs do servidor",
  "Auditoria completa e histórico de operações",
  "Suporte prioritário",
];

const VPS_FEATURES = [
  "Tudo do plano Ultimate incluso",
  "Pagamento único — sem assinatura",
  "Instalação completa na sua VPS",
  "Suporte dedicado na configuração",
  "Licença vitalícia do Orphea Core",
  "Atualizações inclusas",
];

const FAQ = [
  {
    q: "Posso trocar de plano depois?",
    a: "Sim. Você pode subir do Pro pro Ultimate (ou voltar) a qualquer momento — a cobrança é ajustada proporcionalmente.",
  },
  {
    q: "O que muda entre Pro e Ultimate?",
    a: "O Pro cobre toda a gestão de personagens, templates, kits, mail e eventos. O Ultimate adiciona controle do servidor (start/stop/restart, instâncias), múltiplos servidores e moderação avançada.",
  },
  {
    q: "Preciso instalar algo na minha VPS?",
    a: "Sim, um arquivo PHP único (api_cls.php) que faz a ponte entre o painel e o Perfect World. Temos um instalador automático pra CentOS 7 — leva 2 minutos.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, sem multa, sem fidelidade. O cancelamento é imediato pela página /admin → Conta.",
  },
];

interface PaidPlan {
  id: "iniciante" | "pro" | "ultimate";
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  monthlyPriceId: string;
  yearlyPriceId: string;
  features: string[];
  highlight?: boolean;
}

const PAID_PLANS: PaidPlan[] = [
  {
    id: "iniciante",
    name: "Iniciante",
    tagline: "Ideal pra começar a usar o painel",
    monthly: 25,
    yearly: 250,
    monthlyPriceId: "pw_admin_iniciante_monthly",
    yearlyPriceId: "pw_admin_iniciante_yearly",
    features: INICIANTE_FEATURES,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Gestão completa de personagens e templates",
    monthly: 150,
    yearly: 1500,
    monthlyPriceId: "pw_admin_pro_monthly",
    yearlyPriceId: "pw_admin_pro_yearly",
    features: PRO_FEATURES,
  },
  {
    id: "ultimate",
    name: "Ultimate",
    tagline: "Tudo do Pro + controle total do servidor",
    monthly: 300,
    yearly: 3000,
    monthlyPriceId: "pw_admin_ultimate_monthly",
    yearlyPriceId: "pw_admin_ultimate_yearly",
    features: ULTIMATE_FEATURES,
    highlight: true,
  },
];

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const Pricing = () => {
  const navigate = useNavigate();
  const { session, user, isAdmin, isSuperadmin, loading: authLoading } = useAuth();
  const { isActive, isTrial, plan, loading: subLoading, refetch: refetchSub } = useSubscription();
  const { active, loading: serversLoading } = useServers();
  const { createPixPayment, pixData, loading: pixLoading, status: pixStatus, checking: pixChecking, reset: resetPix } = usePixCheckout();
  const { settings } = useAppSettings();
  const [trialLoading, setTrialLoading] = useState(false);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixPlanName, setPixPlanName] = useState("");
  const [pixAmount, setPixAmount] = useState("");

  // Bypass: usuário com acesso vai direto pro painel ou onboarding.
  useEffect(() => {
    if (authLoading || subLoading || serversLoading) return;
    if (!session) return;
    if (isTrial) {
      navigate("/trial", { replace: true });
      return;
    }
    const bypass = isActive || isAdmin || isSuperadmin;
    if (bypass && active?.onboarding_completed) {
      navigate("/admin", { replace: true });
    } else if (bypass && !active?.onboarding_completed) {
      navigate("/onboarding", { replace: true });
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
      toast.success("Plano gratuito ativado!");
      await refetchSub();
      navigate("/trial");
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível ativar o plano gratuito. Tenta de novo.");
    } finally {
      setTrialLoading(false);
    }
  };

  const handlePixCheckout = async (plan: PaidPlan) => {
    if (!session) {
      navigate("/auth?next=/pricing");
      return;
    }
    const amountCents = cycle === "monthly" ? plan.monthly * 100 : plan.yearly * 100;
    const priceId = cycle === "monthly" ? plan.monthlyPriceId : plan.yearlyPriceId;
    setPixPlanName(`Orphea Core ${plan.name}`);
    setPixAmount(formatBRL(cycle === "monthly" ? plan.monthly : plan.yearly) + (cycle === "monthly" ? "/mês" : "/ano"));
    try {
      await createPixPayment({
        priceId,
        productId: plan.monthlyPriceId.replace("_monthly", "").replace("_yearly", ""),
        amountCents,
        environment: getPaymentEnvironment(),
      });
      setPixModalOpen(true);
    } catch {
      // error handled in hook
    }
  };

  const yearlyDiscountPct = (p: PaidPlan) =>
    Math.round((1 - p.yearly / (p.monthly * 12)) * 100);

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
              Orphea <span className="text-primary">Core</span>
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

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-16">
        <div className="mb-6 text-center sm:mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Escolha seu plano</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
            Pare de editar SQL na unha
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Painel completo pra administrar seu servidor Perfect World. Comece grátis · cancele
            quando quiser · sem fidelidade.
          </p>
        </div>

        {/* Toggle mensal/anual */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 p-1">
            <button
              type="button"
              onClick={() => setCycle("monthly")}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-smooth ${
                cycle === "monthly"
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setCycle("yearly")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-smooth ${
                cycle === "yearly"
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Anual
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-extrabold text-primary">
                -17%
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Iniciante / Pro / Ultimate */}
          {PAID_PLANS.map((p) => {
            const value = cycle === "monthly" ? p.monthly : p.yearly;
            const suffix = cycle === "monthly" ? "/mês" : "/ano";
            const monthlyEquivalent = cycle === "yearly" ? p.yearly / 12 : null;
            const isCurrent = plan === p.id;
            const Icon = p.id === "ultimate" ? Crown : p.id === "iniciante" ? Sparkles : Zap;
            return (
              <div
                key={p.id}
                className={`relative flex flex-col overflow-hidden rounded-2xl p-5 sm:p-7 ${
                  p.highlight
                    ? "border-2 border-primary/40 bg-gradient-to-br from-card via-card/80 to-card shadow-glow"
                    : "border border-border bg-card/40"
                }`}
              >
                {p.highlight && (
                  <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
                )}
                <div className="relative flex flex-1 flex-col">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <div
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                        p.highlight
                          ? "bg-primary/15 text-primary"
                          : "bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {p.name}
                    </div>
                    {p.highlight && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                        Recomendado
                      </span>
                    )}
                  </div>

                  <div className="mb-1">
                    <h3 className="text-xl font-extrabold">Orphea Core {p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.tagline}</p>
                  </div>

                  <div className="mb-2 mt-4 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tight">{formatBRL(value)}</span>
                    <span className="text-sm text-muted-foreground">{suffix}</span>
                  </div>
                  {monthlyEquivalent !== null && (
                    <p className="mb-2 text-xs font-semibold text-primary">
                      ≈ {formatBRL(monthlyEquivalent)}/mês · economia de {yearlyDiscountPct(p)}%
                    </p>
                  )}
                  <p className="mb-6 text-sm text-muted-foreground">
                    Por servidor. Sem limite de personagens, edições ou administradores.
                  </p>

                  <ul className="mb-8 space-y-2.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <div
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                            p.highlight
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-foreground/70"
                          }`}
                        >
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        </div>
                        <span className="text-foreground/90">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {!isCurrent ? (
                    <button
                      onClick={() => handlePixCheckout(p)}
                      disabled={pixLoading}
                      className={`mt-auto inline-flex w-full items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-bold transition-smooth disabled:opacity-60 ${
                        p.highlight
                          ? "bg-primary text-primary-foreground shadow-glow hover:brightness-110"
                          : "border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                      }`}
                    >
                      {pixLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <QrCode className="h-4 w-4" />
                          Assinar {p.name} via Pix
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-bold transition-smooth disabled:opacity-60 border border-primary/40 bg-primary/10 text-primary"
                    >
                      Plano atual
                    </button>
                  )}

                  <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    Pagamento via Pix · Renovação mensal manual
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* VPS */}
        <div className="mt-8">
          <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-card via-card/80 to-card p-5 sm:p-7">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="relative flex flex-1 flex-col items-center text-center sm:flex-row sm:text-left sm:items-start sm:gap-8">
              <div className="flex-1">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  <Server className="h-3 w-3" />
                  VPS · Pagamento único
                </div>
                <h3 className="text-xl font-extrabold">Orphea Core pra VPS</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Painel completo instalado na sua VPS com suporte. Pague uma vez, use pra sempre.
                </p>
                <ul className="mt-4 space-y-2.5 text-left">
                  {VPS_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </div>
                      <span className="text-foreground/90">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 flex flex-col items-center gap-3 sm:mt-0 sm:min-w-[200px]">
                <div className="mb-2 text-center">
                  <span className="text-4xl font-extrabold tracking-tight text-emerald-400">R$ 700</span>
                  <p className="mt-1 text-xs text-muted-foreground">pagamento único</p>
                </div>
                <a
                  href={settings.whatsapp_vps_link || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition-smooth hover:brightness-110"
                >
                  Obter agora
                  <ArrowRight className="h-4 w-4" />
                </a>
                <p className="text-[11px] text-muted-foreground">Fale conosco pelo WhatsApp</p>
              </div>
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

      <PixCheckoutModal
        open={pixModalOpen}
        onClose={() => {
          setPixModalOpen(false);
          if (pixStatus === "approved") {
            navigate("/onboarding");
          }
          resetPix();
          refetchSub();
        }}
        pixData={pixData}
        status={pixStatus}
        checking={pixChecking}
        planName={pixPlanName}
        amount={pixAmount}
      />
    </div>
  );
};

export default Pricing;

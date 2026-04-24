import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  ArrowRight,
  Check,
  Database,
  History,
  Image as ImageIcon,
  Lock,
  RefreshCw,
  Server,
  Shield,
  Sparkles,
  UserCog,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useSiteContent } from "@/hooks/useSiteContent";
import heroImg from "@/assets/landing-hero.jpg";

// Ícones rotativos pra cada bloco — o conteúdo dos textos vem do banco
// (editável em /admin/site), mas mantemos os ícones em código pra preservar
// a identidade visual.
const PROBLEM_ICONS = [Database, UserCog, Lock, RefreshCw];
const FEATURE_ICONS = [UserCog, Database, ImageIcon, History, Users, Server];
const STEP_ICONS = [UserCog, Server, Zap];

const Landing = () => {
  const navigate = useNavigate();
  const { session, isAdmin } = useAuth();
  const { settings } = useAppSettings();
  const { content } = useSiteContent();
  const bgImage = settings.background_url || heroImg;

  // SEO dinâmico (mantém index.html limpo, atualiza title em runtime)
  useEffect(() => {
    document.title = "Orphea Core — Painel completo pra GMs de Perfect World";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Edite personagens, itens, equipamentos e backups do seu servidor de Perfect World sem mexer no banco. Painel web seguro pra donos de servidor privado.",
      );
    }
  }, []);

  return (
    <div
      className="min-h-screen bg-background bg-fixed bg-cover bg-center text-foreground"
      style={{ backgroundImage: `linear-gradient(hsl(var(--background) / 0.92), hsl(var(--background) / 0.96)), url(${bgImage})` }}
    >
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/orphea-core-logo.png"
              alt="Orphea Core"
              className="h-8 w-8 rounded-md object-contain"
            />
            <span className="text-sm font-extrabold uppercase tracking-wider">
              Orphea <span className="text-primary">Core</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-xs font-medium text-muted-foreground sm:flex">
            <a href="#recursos" className="transition-smooth hover:text-foreground">Recursos</a>
            <a href="#como-funciona" className="transition-smooth hover:text-foreground">Como funciona</a>
            <a href="#preco" className="transition-smooth hover:text-foreground">Preço</a>
            <a href="#faq" className="transition-smooth hover:text-foreground">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            {session && isAdmin ? (
              <button
                onClick={() => navigate("/admin")}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
              >
                Abrir painel <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="hidden rounded-md border border-border bg-card/40 px-3 py-2 text-xs font-medium text-foreground transition-smooth hover:border-primary/50 sm:inline-flex"
                >
                  Entrar
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
                >
                  Começar
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <img
            src={bgImage}
            alt=""
            width={1920}
            height={1080}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />

          <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:py-32">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {content.hero.badge}
            </div>

            <h1 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl">
              {content.hero.title.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
                part.startsWith("**") && part.endsWith("**") ? (
                  <span key={i} className="text-primary">
                    {part.slice(2, -2)}
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
              {content.hero.subtitle}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
              >
                {content.hero.primary_cta} <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card/40 px-6 py-3 text-sm font-semibold text-foreground transition-smooth hover:border-primary/50"
              >
                {content.hero.secondary_cta}
              </a>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">{content.hero.fineprint}</p>
          </div>
        </section>

        {/* PROBLEMAS */}
        <section className="border-t border-border/60 bg-card/20 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mb-12 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {content.problems.eyebrow}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {content.problems.title}
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {content.problems.items.map((p, i) => {
                const Icon = PROBLEM_ICONS[i % PROBLEM_ICONS.length];
                return (
                  <div key={`${p.title}-${i}`} className="rounded-xl border border-border bg-card/40 p-6">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-1 font-bold">{p.title}</h3>
                    <p className="text-sm text-muted-foreground">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="recursos" className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-12 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {content.features.eyebrow}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {content.features.title}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                {content.features.subtitle}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {content.features.items.map((f, i) => {
                const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
                return (
                  <div
                    key={`${f.title}-${i}`}
                    className="group rounded-xl border border-border bg-card/40 p-6 transition-smooth hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary transition-smooth group-hover:bg-primary/25">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-1.5 font-bold text-foreground">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="border-t border-border/60 bg-card/20 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mb-12 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {content.steps.eyebrow}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {content.steps.title}
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {content.steps.items.map((s, i) => {
                const Icon = STEP_ICONS[i % STEP_ICONS.length];
                return (
                  <div key={`${s.title}-${i}`} className="relative rounded-xl border border-border bg-card/60 p-6">
                    <div className="absolute -top-3 left-6 rounded-md bg-gradient-gold px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-primary-foreground">
                      Passo {i + 1}
                    </div>
                    <div className="mb-3 mt-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-1.5 font-bold">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PREÇO */}
        <section id="preco" className="py-20">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-12 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {content.pricing.eyebrow}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {content.pricing.title}
              </h2>
            </div>

            <div className="relative overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-card via-card/80 to-card p-8 shadow-glow sm:p-10">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />

              <div className="relative">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                  {content.pricing.plan_label}
                </div>

                <div className="mb-2 flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold tracking-tight">{content.pricing.price}</span>
                  <span className="text-base text-muted-foreground">{content.pricing.price_suffix}</span>
                </div>
                <p className="mb-6 text-sm text-muted-foreground">{content.pricing.plan_desc}</p>

                <ul className="mb-8 space-y-3">
                  {content.pricing.features.map((f, i) => (
                    <li key={`${f}-${i}`} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                      <span className="text-foreground/90">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/pricing"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
                >
                  {content.pricing.cta} <ArrowRight className="h-4 w-4" />
                </Link>

                <p className="mt-4 text-center text-xs text-muted-foreground">{content.pricing.fineprint}</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-border/60 bg-card/20 py-20">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-12 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {content.faq.eyebrow}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {content.faq.title}
              </h2>
            </div>

            <div className="space-y-3">
              {content.faq.items.map((q, i) => (
                <details
                  key={`${q.q}-${i}`}
                  className="group rounded-xl border border-border bg-card/40 p-5 transition-smooth open:border-primary/40 open:shadow-glow"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                    <span className="font-semibold text-foreground">{q.q}</span>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-smooth group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{q.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-24">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {content.final_cta.title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              {content.final_cta.subtitle}
            </p>
            <div className="mt-8">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
              >
                {content.final_cta.cta} <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/60 bg-card/20 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
          <div className="flex items-center gap-2">
            <img src="/orphea-core-logo.png" alt="" className="h-5 w-5 object-contain" />
            <span className="font-bold uppercase tracking-wider text-foreground">Orphea Core</span>
            <span>· © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#recursos" className="hover:text-foreground">Recursos</a>
            <a href="#preco" className="hover:text-foreground">Preço</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <Link to="/auth" className="hover:text-foreground">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

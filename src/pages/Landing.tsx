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
import heroImg from "@/assets/landing-hero.jpg";

const Landing = () => {
  const navigate = useNavigate();
  const { session, isAdmin } = useAuth();

  // SEO dinâmico (mantém index.html limpo, atualiza title em runtime)
  useEffect(() => {
    document.title = "PW Admin — Painel completo pra GMs de Perfect World";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Edite personagens, itens, equipamentos e backups do seu servidor de Perfect World sem mexer no banco. Painel web seguro pra donos de servidor privado.",
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-extrabold uppercase tracking-wider">
              PW <span className="text-primary">Admin</span>
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
                <a
                  href="#preco"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
                >
                  Começar
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <img
            src={heroImg}
            alt=""
            width={1920}
            height={1080}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />

          <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:py-32">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Pra donos de servidor privado de PW
            </div>

            <h1 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl">
              Administre seu servidor de{" "}
              <span className="bg-gradient-gold bg-clip-text text-transparent">Perfect World</span>{" "}
              sem tocar no banco
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
              Edite personagens, itens, equipamentos, status e inventário direto pelo navegador. Backup automático, histórico de alterações e zero risco de quebrar dados com SQL manual.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#preco"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
              >
                Começar por R$ 47/mês <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card/40 px-6 py-3 text-sm font-semibold text-foreground transition-smooth hover:border-primary/50"
              >
                Ver como funciona
              </a>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              Sem fidelidade • Cancele quando quiser • Funciona com qualquer servidor PW
            </p>
          </div>
        </section>

        {/* PROBLEMAS */}
        <section className="border-t border-border/60 bg-card/20 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mb-12 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">O problema</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Cansado de abrir o phpMyAdmin toda hora?
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {PROBLEMS.map((p) => (
                <div key={p.title} className="rounded-xl border border-border bg-card/40 p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1 font-bold">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="recursos" className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-12 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Recursos</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Tudo que um GM precisa, num só lugar
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Construído por gente que vive o servidor — cada recurso resolve uma dor real do dia-a-dia.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-xl border border-border bg-card/40 p-6 transition-smooth hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary transition-smooth group-hover:bg-primary/25">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1.5 font-bold text-foreground">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="border-t border-border/60 bg-card/20 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mb-12 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Setup em 3 passos</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Pronto em menos de 5 minutos
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <div key={s.title} className="relative rounded-xl border border-border bg-card/60 p-6">
                  <div className="absolute -top-3 left-6 rounded-md bg-gradient-gold px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-primary-foreground">
                    Passo {i + 1}
                  </div>
                  <div className="mb-3 mt-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1.5 font-bold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PREÇO */}
        <section id="preco" className="py-20">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-12 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Preço</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Simples. Sem letras miúdas.
              </h2>
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
                  Por servidor. Acesso completo, sem limite de personagens editados.
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

                <Link
                  to="/auth"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
                >
                  Criar minha conta agora <ArrowRight className="h-4 w-4" />
                </Link>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Cancele quando quiser • 7 dias de teste grátis
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-border/60 bg-card/20 py-20">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-12 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">FAQ</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Dúvidas comuns
              </h2>
            </div>

            <div className="space-y-3">
              {FAQ.map((q) => (
                <details
                  key={q.q}
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
              Pronto pra deixar de quebrar a cabeça com SQL?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              Junte-se aos GMs que já administram seus servidores com a tranquilidade de um painel pensado pra Perfect World.
            </p>
            <div className="mt-8">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
              >
                Começar agora — R$ 47/mês <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/60 bg-card/20 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-bold uppercase tracking-wider text-foreground">PW Admin</span>
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

// ===== Conteúdo =====

const PROBLEMS = [
  {
    icon: Database,
    title: "Editar pelo phpMyAdmin é arriscado",
    desc: "Um UPDATE errado num campo binário e o personagem trava. Sem rollback, sem histórico de quem mexeu.",
  },
  {
    icon: UserCog,
    title: "Restaurar item perdido vira novela",
    desc: "Player perdeu equipamento? Procurar o ID, montar o INSERT, validar bytes do octet... 30 minutos por player.",
  },
  {
    icon: Lock,
    title: "Sem controle de quem fez o quê",
    desc: "Time de moderação direto no banco = zero auditoria. Quem deu aquele item raro pro alt do amigo?",
  },
  {
    icon: RefreshCw,
    title: "Templates iniciais difíceis de balancear",
    desc: "Mudar atributos de personagem novo (cls 16) exige edição manual em todas as classes. Trabalhoso e propenso a erro.",
  },
];

const FEATURES = [
  {
    icon: UserCog,
    title: "Editor visual de personagens",
    desc: "Status, equipamento, inventário e storehouse com interface idêntica ao cliente do jogo. Sem decorar IDs.",
  },
  {
    icon: Database,
    title: "Templates iniciais (clsconfig)",
    desc: "Edite os atributos de cada classe nova de personagem direto pelo painel — HP, MP, itens iniciais, tudo visual.",
  },
  {
    icon: ImageIcon,
    title: "Fotos personalizadas das classes",
    desc: "Suba retratos custom por classe ou por personagem específico. Identidade visual do seu servidor.",
  },
  {
    icon: History,
    title: "Backups automáticos + histórico",
    desc: "Cada alteração gera um backup. Reverteu errado? Restaurar é 1 clique. Auditoria completa de quem mudou o quê.",
  },
  {
    icon: Users,
    title: "Múltiplos admins, sem conflito",
    desc: "Convide moderadores com permissões granulares. Você decide quem pode editar status, dar item, ou só visualizar.",
  },
  {
    icon: Server,
    title: "Funciona com sua VPS",
    desc: "Os dados continuam na sua VPS. O painel só conecta via API segura — você troca de servidor sem perder configuração.",
  },
];

const STEPS = [
  {
    icon: UserCog,
    title: "Crie sua conta",
    desc: "Cadastro rápido com email e senha. Sem cartão de crédito no teste.",
  },
  {
    icon: Server,
    title: "Conecte sua VPS",
    desc: "Cole o IP/domínio do seu servidor PW e o secret da API. Pronto, o painel começa a sincronizar.",
  },
  {
    icon: Zap,
    title: "Comece a editar",
    desc: "Busque personagem, edite o que precisar, salve. Tudo com backup automático e histórico.",
  },
];

const PLAN_FEATURES = [
  "Editor completo de personagens (status, equip, inventário, storehouse)",
  "Templates iniciais por classe (clsconfig)",
  "Backups automáticos + restauração 1-clique",
  "Histórico completo de alterações",
  "Múltiplos administradores",
  "Fotos personalizadas das classes",
  "Branding do seu servidor (logo, nome, cor)",
  "Suporte por Discord",
  "Atualizações constantes",
];

const FAQ = [
  {
    q: "Preciso instalar algo na minha VPS?",
    a: "Sim, um único arquivo PHP (api_cls.php) que serve como ponte segura entre o painel e seu banco. Enviamos o arquivo e instruções de instalação após o cadastro — é literalmente colocar um arquivo numa pasta e pronto.",
  },
  {
    q: "Funciona com qual versão do Perfect World?",
    a: "Compatível com a maioria das versões/revisões usadas em servidores privados (1.3.6, 1.4.x, 1.5.x). Se tiver dúvida sobre a sua revisão específica, fala com a gente antes de assinar.",
  },
  {
    q: "Meus dados ficam seguros?",
    a: "Os dados nunca saem da sua VPS — o painel só lê e escreve via API com header secret criptografado. Conexões via HTTPS. Cada admin tem login próprio e auditoria completa de ações.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Sem fidelidade, sem multa. Cancela e a cobrança para no próximo ciclo. Seu painel fica acessível em modo somente-leitura por mais 30 dias pra você exportar o que precisar.",
  },
  {
    q: "Como funciona o teste grátis?",
    a: "7 dias de acesso completo, sem pedir cartão. No fim do teste, você decide se quer assinar. Se não fizer nada, a conta simplesmente expira.",
  },
  {
    q: "Vocês oferecem versão self-hosted (instalo na minha VPS)?",
    a: "Em breve, como tier Enterprise. Por enquanto, o painel é hospedado por nós e conecta na sua VPS via API.",
  },
];

export default Landing;

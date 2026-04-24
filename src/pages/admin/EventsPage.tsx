// /admin/events — Hub do módulo Eventos.
// Mostra cards das submodalidades. Apenas "Presença" está funcional na
// Fase 4A; as demais ficam como placeholders bonitos com badge "Em breve".
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  CalendarDays,
  Gift,
  HelpCircle,
  Sparkles,
  Swords,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EventModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  to?: string;
  comingSoon?: boolean;
  bullets: string[];
}

const MODULES: EventModule[] = [
  {
    id: "presenca",
    title: "Presença",
    description:
      "Recompensa diária por check-in com idempotência por dia e entrega automática via correio.",
    icon: CalendarCheck,
    to: "/admin/events/presenca",
    bullets: [
      "Check-in com bloqueio anti-duplicidade",
      "Recompensa em itens + gold",
      "Histórico completo de presenças e entregas",
    ],
  },
  {
    id: "sorteios",
    title: "Sorteios",
    description: "Sorteios pontuais com regras de elegibilidade e log público.",
    icon: Gift,
    comingSoon: true,
    bullets: [
      "Sorteio entre presentes ou entre todos",
      "Janelas configuráveis",
      "Auditoria do resultado",
    ],
  },
  {
    id: "quiz",
    title: "Quiz",
    description: "Sessões de quiz com perguntas/respostas e premiação automática.",
    icon: HelpCircle,
    comingSoon: true,
    bullets: [
      "Banco de perguntas reutilizável",
      "Pontuação por velocidade",
      "Recompensa por posição",
    ],
  },
  {
    id: "ranking-pvp",
    title: "Ranking PvP",
    description: "Ranking de PvP com snapshots semanais e premiação por faixa.",
    icon: Swords,
    comingSoon: true,
    bullets: [
      "Snapshots automáticos",
      "Faixas por posição",
      "Premiação por correio",
    ],
  },
];

const EventsPage = () => (
  <div className="h-full overflow-y-auto p-6">
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Eventos
            </p>
            <h1 className="mt-0.5 text-xl font-extrabold text-foreground">
              Hub de eventos do servidor
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure módulos com regras e recompensas. Cada módulo tem seu
              próprio histórico e auditoria.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {MODULES.map((m) => (
          <ModuleCard key={m.id} mod={m} />
        ))}
      </div>
    </div>
  </div>
);

const ModuleCard = ({ mod }: { mod: EventModule }) => {
  const Icon = mod.icon;
  const inner = (
    <article
      className={cn(
        "group relative h-full overflow-hidden rounded-2xl border bg-card/60 p-5 shadow-md backdrop-blur-md transition-smooth",
        mod.to
          ? "border-border hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
          : "border-border/60 opacity-90",
      )}
    >
      {/* glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-foreground">{mod.title}</h2>
            {mod.comingSoon ? (
              <span className="inline-flex items-center gap-1 rounded-sm border border-muted-foreground/30 bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-tight text-muted-foreground">
                <Sparkles className="h-2.5 w-2.5" />
                Em breve
              </span>
            ) : (
              <span className="rounded-sm border border-success/40 bg-success/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-tight text-success">
                Ativo
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{mod.description}</p>
        </div>
      </div>

      <ul className="relative mt-4 space-y-1.5">
        {mod.bullets.map((b) => (
          <li
            key={b}
            className="flex items-start gap-2 text-[12px] text-foreground/80"
          >
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {mod.to && (
        <div className="relative mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary group-hover:underline">
          Abrir módulo →
        </div>
      )}
    </article>
  );

  if (!mod.to) return inner;
  return (
    <Link to={mod.to} className="block">
      {inner}
    </Link>
  );
};

export default EventsPage;

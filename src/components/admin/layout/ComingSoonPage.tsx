// Placeholder premium para módulos da Fase 2 (Correio, Eventos, Operação).
// Mantém visual consistente com o resto do painel — borda suave,
// gradient sutil, ícone de destaque, lista de "o que vem aqui".
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  bullets?: string[];
  /** Texto do badge superior. Default: "Em breve". */
  badge?: string;
  className?: string;
}

export const ComingSoonPage = ({
  title,
  description,
  icon: Icon,
  bullets = [],
  badge = "Em breve",
  className,
}: Props) => {
  return (
    <div className={cn("h-full overflow-y-auto p-6", className)}>
      <div className="mx-auto max-w-3xl">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 p-8 shadow-lg backdrop-blur-md">
          {/* Glow decorativo */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-inner">
              <Icon className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                <Sparkles className="h-3 w-3" />
                {badge}
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                {description}
              </p>
            </div>
          </div>

          {bullets.length > 0 && (
            <div className="relative mt-8 grid gap-3 sm:grid-cols-2">
              {bullets.map((b) => (
                <div
                  key={b}
                  className="flex items-start gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs text-foreground/80"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          )}

          <p className="relative mt-8 text-[11px] text-muted-foreground">
            Esta área será habilitada na próxima fase. Suas permissões e
            servidor ativo já estão prontos para suportá-la — nada será
            perdido quando ligarmos.
          </p>
        </div>
      </div>
    </div>
  );
};

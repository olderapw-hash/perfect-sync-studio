// Badge "PRO" para sinalizar áreas/recursos pagos para usuários em trial.
// Visualmente discreto, com tooltip via title.
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  title?: string;
}

export const ProBadge = ({ className, title = "Disponível no plano pago" }: Props) => (
  <span
    title={title}
    className={cn(
      "inline-flex items-center rounded-sm bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-primary",
      className,
    )}
  >
    PRO
  </span>
);

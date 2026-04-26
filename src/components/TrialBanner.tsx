// Banner global do modo Free Trial.
// Mostrado no topo do AdminLayout quando o usuário está em trial,
// reforçando que tudo está visível mas só edição manual de templates está liberada.
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useServerPermissions } from "@/hooks/useServerPermissions";

export const TrialBanner = () => {
  const { isTrial } = useServerPermissions();
  if (!isTrial) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-primary/30 bg-primary/10 px-4 py-2 text-[12px]">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
        <Sparkles className="h-3 w-3" />
        Plano Free
      </span>
      <span className="text-foreground/90">
        Você está no plano <strong>Free</strong>: pode visualizar tudo, mas só{" "}
        <strong>edição manual de templates iniciais</strong> está liberada. Faça upgrade pra{" "}
        <strong>Pro</strong> ou <strong>Ultimate</strong> pra liberar bulk apply, mail, eventos
        e Server Ops.
      </span>
      <Link
        to="/pricing"
        className="ml-auto rounded-md bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground hover:brightness-110"
      >
        Ver planos
      </Link>
    </div>
  );
};

// Banner global mostrado no topo do /admin quando existe uma versão nova
// do installer publicada pelo superadmin. Ao ser clicado, leva o usuário
// para a página /install e marca a versão como vista.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Download, Sparkles, X } from "lucide-react";
import { useInstallerRelease } from "@/hooks/useInstallerRelease";

export const InstallerUpdateBanner = () => {
  const { current, hasUpdate, markSeen } = useInstallerRelease();

  // Toast 1x por versão (notificação leve, sem ser intrusiva).
  useEffect(() => {
    if (!hasUpdate || !current) return;
    toast.success(`Nova versão do installer: v${current.version}`, {
      description: "Clique no banner para ver as novidades e baixar.",
      duration: 6000,
    });
    // Não marcamos como vista aqui — só quando o usuário clicar/dispensar
    // ou abrir a página /install.
  }, [hasUpdate, current]);

  if (!hasUpdate || !current) return null;

  return (
    <div className="flex items-center gap-3 border-b border-primary/40 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent px-5 py-2 text-xs">
      <Sparkles className="h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <span className="font-semibold text-foreground">
          Nova versão do installer disponível
        </span>{" "}
        <span className="text-muted-foreground">
          v{current.version} — atualize sua instalação para receber correções e melhorias.
        </span>
      </div>
      <Link
        to="/install"
        onClick={() => markSeen(current.version)}
        className="inline-flex items-center gap-1.5 rounded-md border border-primary/50 bg-primary/20 px-3 py-1 font-semibold text-primary transition-colors hover:bg-primary/30"
      >
        <Download className="h-3.5 w-3.5" />
        Ver atualização
      </Link>
      <button
        onClick={() => markSeen(current.version)}
        title="Dispensar"
        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

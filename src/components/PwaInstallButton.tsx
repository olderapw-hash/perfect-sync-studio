// Botão "Instalar app" pra colocar no header do painel.
// - Em Chrome/Edge/Android: dispara o prompt nativo.
// - Em iOS Safari: abre tooltip explicando "Compartilhar → Adicionar à Tela de Início".
// - Some quando o app já está instalado / rodando standalone.
import { useState } from "react";
import { Download, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePwaInstall } from "@/hooks/usePwaInstall";

interface Props {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "icon";
  className?: string;
}

export const PwaInstallButton = ({
  variant = "outline",
  size = "sm",
  className,
}: Props) => {
  const { canInstall, installed, isIos, promptInstall } = usePwaInstall();
  const [open, setOpen] = useState(false);

  if (installed) return null;

  // iOS: mostra instruções manuais.
  if (isIos) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant={variant} size={size} className={className}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Instalar app</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 text-xs">
          <p className="mb-2 font-semibold text-foreground">Instalar no iPhone/iPad</p>
          <ol className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <Share className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>Toque no botão <strong>Compartilhar</strong> da barra do Safari.</span>
            </li>
            <li className="flex items-start gap-2">
              <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>Escolha <strong>Adicionar à Tela de Início</strong>.</span>
            </li>
          </ol>
        </PopoverContent>
      </Popover>
    );
  }

  // Android/desktop: precisa do beforeinstallprompt já capturado.
  if (!canInstall) return null;

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => {
        void promptInstall();
      }}
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Instalar app</span>
    </Button>
  );
};

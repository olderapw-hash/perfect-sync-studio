// Página pública /download
//
// Mostra instruções de instalação do PWA (Android/Chrome, iOS Safari, desktop).
// Esta rota também ativa o manifest (via PwaManifestGate), então o navegador
// já oferece o "instalar" enquanto o usuário está aqui.
import { Link } from "react-router-dom";
import { useEffect } from "react";
import {
  ArrowLeft,
  Chrome,
  Download,
  MonitorSmartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppSettings } from "@/hooks/useAppSettings";
import { usePwaInstall } from "@/hooks/usePwaInstall";

const DownloadPage = () => {
  const { settings } = useAppSettings();
  const { canInstall, installed, promptInstall } = usePwaInstall();

  useEffect(() => {
    document.title = `Baixar app — ${settings.server_name}`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Instale o painel do Orphea Core no seu celular ou desktop como aplicativo. Acesso rápido, modo tela cheia, atalho na home.",
      );
    }
  }, [settings.server_name]);

  return (
    <div className="min-h-screen bg-hero text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={settings.logo_url ?? "/orphea-core-logo.png"}
              alt=""
              className="h-7 w-7 rounded-md object-contain"
            />
            <span className="text-sm font-extrabold uppercase tracking-wider">
              {settings.server_name}
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
            <Download className="h-3 w-3" /> Aplicativo
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Instale o painel como app
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Adicione o {settings.server_name} à tela inicial do seu celular ou desktop.
            Abre em tela cheia, sem barra do navegador, com acesso rápido.
          </p>

          {installed ? (
            <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-4 py-2 text-xs font-semibold text-success">
              ✓ App já instalado neste dispositivo
            </div>
          ) : canInstall ? (
            <Button
              size="lg"
              className="mt-6"
              onClick={() => {
                void promptInstall();
              }}
            >
              <Download className="h-4 w-4" />
              Instalar agora
            </Button>
          ) : (
            <p className="mx-auto mt-6 max-w-md text-xs text-muted-foreground">
              Siga as instruções abaixo conforme o seu dispositivo.
            </p>
          )}
        </div>

        <div className="mx-auto mt-10 max-w-xl">
          {/* Windows */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <MonitorSmartphone className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold">Windows (Chrome / Edge)</h2>
            </div>
            <ol className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-foreground">1.</span>
                <span>
                  Abra esta página no <strong className="text-foreground">Google Chrome</strong> ou{" "}
                  <strong className="text-foreground">Microsoft Edge</strong>.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-foreground">2.</span>
                <span>
                  Procure o ícone{" "}
                  <Chrome className="inline h-3.5 w-3.5 text-primary" />{" "}
                  <strong className="text-foreground">Instalar</strong> no canto direito da barra de endereço — ou
                  abra o menu <strong className="text-foreground">⋮</strong> e escolha{" "}
                  <strong className="text-foreground">Instalar Orphea Core</strong>.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-foreground">3.</span>
                <span>Clique em <strong className="text-foreground">Instalar</strong>. Abre uma janela própria, sem barra do navegador.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-foreground">4.</span>
                <span>O atalho fica disponível no <strong className="text-foreground">Menu Iniciar</strong> e na área de trabalho.</span>
              </li>
            </ol>
            {canInstall && (
              <Button
                className="mt-5 w-full"
                onClick={() => {
                  void promptInstall();
                }}
              >
                <Download className="h-4 w-4" />
                Instalar agora
              </Button>
            )}
          </Card>
        </div>

        <div className="mt-10 rounded-xl border border-border bg-card/40 p-5 text-xs text-muted-foreground">
          <h3 className="mb-2 text-sm font-bold text-foreground">Por que instalar?</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            <li>✓ Abre direto no painel, sem barra do navegador.</li>
            <li>✓ Ícone na tela inicial do celular ou no menu do PC.</li>
            <li>✓ Mais rápido pra abrir no dia-a-dia.</li>
            <li>✓ Funciona em qualquer celular moderno.</li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-glow hover:brightness-110"
          >
            Entrar no painel <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
          </Link>
        </div>
      </main>
    </div>
  );
};

export default DownloadPage;

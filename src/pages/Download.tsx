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
  Plus,
  Share,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppSettings } from "@/hooks/useAppSettings";
import { usePwaInstall } from "@/hooks/usePwaInstall";

const DownloadPage = () => {
  const { settings } = useAppSettings();
  const { canInstall, installed, isIos, promptInstall } = usePwaInstall();

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

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {/* Android / Chrome */}
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <Smartphone className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold">Android (Chrome)</h2>
            </div>
            <ol className="space-y-2 text-xs text-muted-foreground">
              <li>1. Abra esta página no <strong className="text-foreground">Chrome</strong>.</li>
              <li>2. Toque no menu <strong className="text-foreground">⋮</strong> (canto superior).</li>
              <li>
                3. Escolha{" "}
                <strong className="text-foreground">Instalar app</strong> ou{" "}
                <strong className="text-foreground">Adicionar à tela inicial</strong>.
              </li>
              <li>4. Confirme. O ícone aparece junto dos outros apps.</li>
            </ol>
            {canInstall && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4 w-full"
                onClick={() => {
                  void promptInstall();
                }}
              >
                <Download className="h-3.5 w-3.5" />
                Instalar agora
              </Button>
            )}
          </Card>

          {/* iOS / Safari */}
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <Smartphone className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold">iPhone / iPad (Safari)</h2>
            </div>
            <ol className="space-y-2 text-xs text-muted-foreground">
              <li>1. Abra esta página no <strong className="text-foreground">Safari</strong>.</li>
              <li className="flex items-start gap-1.5">
                <span>2.</span>
                <span>
                  Toque em{" "}
                  <Share className="inline h-3.5 w-3.5 text-primary" />{" "}
                  <strong className="text-foreground">Compartilhar</strong> na barra inferior.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span>3.</span>
                <span>
                  Role e escolha{" "}
                  <Plus className="inline h-3.5 w-3.5 text-primary" />{" "}
                  <strong className="text-foreground">Adicionar à Tela de Início</strong>.
                </span>
              </li>
              <li>4. Confirme o nome e toque em <strong className="text-foreground">Adicionar</strong>.</li>
            </ol>
            {isIos && (
              <p className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-2 text-[11px] text-primary">
                Você está no iOS — siga os passos acima.
              </p>
            )}
          </Card>

          {/* Desktop */}
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <MonitorSmartphone className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold">Windows / Mac (Chrome / Edge)</h2>
            </div>
            <ol className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-1.5">
                <span>1.</span>
                <span>
                  Procure o ícone{" "}
                  <Chrome className="inline h-3.5 w-3.5 text-primary" />{" "}
                  <strong className="text-foreground">Instalar</strong> no canto direito da barra de endereço.
                </span>
              </li>
              <li>2. Clique e confirme — abre uma janela própria.</li>
              <li>3. Atalho fica disponível no menu iniciar / dock.</li>
            </ol>
            {canInstall && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4 w-full"
                onClick={() => {
                  void promptInstall();
                }}
              >
                <Download className="h-3.5 w-3.5" />
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

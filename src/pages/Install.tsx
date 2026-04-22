// Página /install — entrega o pacote de instalação para a VPS do cliente.
// Cada arquivo é baixado individualmente; também tem botão "Copiar conteúdo"
// para colar direto no editor da VPS via SSH.
//
// Os arquivos servidos são placeholders — substitua pelos arquivos reais
// quando estiverem disponíveis. Eles ficam em public/installer/.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileCode,
  FileText,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InstallerFile {
  name: string;
  description: string;
  path: string; // public path
  icon: typeof FileCode;
  language: "php" | "bash" | "ini" | "markdown";
}

const FILES: InstallerFile[] = [
  {
    name: "api_cls.php",
    description: "Ponte HTTP entre o painel e o gamedbd da sua VPS.",
    path: "/installer/api_cls.php",
    icon: FileCode,
    language: "php",
  },
  {
    name: "exportclsconfig-api.sh",
    description: "Script que exporta o clsconfig após salvamentos.",
    path: "/installer/exportclsconfig-api.sh",
    icon: Terminal,
    language: "bash",
  },
  {
    name: "sudoers.example",
    description: "Linhas a adicionar no /etc/sudoers para o www-data rodar o script.",
    path: "/installer/sudoers.example",
    icon: ShieldCheck,
    language: "ini",
  },
  {
    name: "README.md",
    description: "Passo-a-passo completo de instalação.",
    path: "/installer/README.md",
    icon: FileText,
    language: "markdown",
  },
];

const Install = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (file: InstallerFile) => {
    try {
      const res = await fetch(file.path);
      if (!res.ok) throw new Error("Arquivo ainda não disponível");
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(file.name);
      setTimeout(() => setCopied(null), 2000);
      toast.success(`${file.name} copiado`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao copiar");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/30">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
            <Download className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold uppercase tracking-wider">
              Instalador da VPS
            </h1>
            <p className="text-xs text-muted-foreground">
              Arquivos para conectar sua VPS ao painel
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <section className="mb-8 rounded-2xl border border-border bg-card/40 p-6">
          <h2 className="text-lg font-extrabold">Como instalar</h2>
          <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">1.</strong> Baixe ou copie o{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">api_cls.php</code> e
              suba para uma pasta acessível via web na sua VPS (ex.{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">/var/www/html/apicls/</code>).
            </li>
            <li>
              <strong className="text-foreground">2.</strong> Edite o arquivo e cole o seu{" "}
              <em>secret</em> na variável <code className="rounded bg-muted px-1 font-mono text-xs">$SECRET</code>.
              O mesmo valor vai em "Meus Servidores" no painel.
            </li>
            <li>
              <strong className="text-foreground">3.</strong> (Opcional) Copie o{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">exportclsconfig-api.sh</code>{" "}
              para <code className="rounded bg-muted px-1 font-mono text-xs">/usr/local/bin/</code> e dê{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">chmod +x</code>.
            </li>
            <li>
              <strong className="text-foreground">4.</strong> (Opcional) Adicione as linhas de{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">sudoers.example</code> no{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">/etc/sudoers.d/apicls</code>.
            </li>
            <li>
              <strong className="text-foreground">5.</strong> Volte ao painel, vá em{" "}
              <em>Meus Servidores</em>, cadastre a URL e o secret e clique em{" "}
              <em>Testar conexão</em>.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Arquivos do instalador
          </h2>
          <div className="space-y-3">
            {FILES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.name}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-card/40 p-4"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-bold">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.description}</p>
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                        {f.language}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(f)}
                      className={cn(copied === f.name && "border-emerald-500/60 text-emerald-500")}
                    >
                      {copied === f.name ? (
                        <Check className="mr-2 h-3.5 w-3.5" />
                      ) : (
                        <Copy className="mr-2 h-3.5 w-3.5" />
                      )}
                      {copied === f.name ? "Copiado" : "Copiar"}
                    </Button>
                    <Button asChild size="sm">
                      <a href={f.path} download={f.name}>
                        <Download className="mr-2 h-3.5 w-3.5" /> Baixar
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-6 rounded-md border border-border bg-card/30 p-4 text-xs text-muted-foreground">
            ⚠️ Os arquivos atuais são <strong>placeholders</strong>. Quando os arquivos
            definitivos do <code className="rounded bg-muted px-1 font-mono">api_cls.php</code>{" "}
            estiverem prontos, basta colocá-los em{" "}
            <code className="rounded bg-muted px-1 font-mono">public/installer/</code> e esta
            página passará a servir o conteúdo real.
          </p>
        </section>
      </main>
    </div>
  );
};

export default Install;

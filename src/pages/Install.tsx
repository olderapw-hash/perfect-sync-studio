// Página /install — entrega o pacote de instalação automática para a VPS.
//
// Método recomendado:
//   scp api_cls.php root@IP:/root/api_cls.php
//   scp install-apicls-centos7.sh root@IP:/root/install-apicls-centos7.sh
//   bash /root/install-apicls-centos7.sh --secret <SECRET> --api-src /root/api_cls.php
//
// O secret é o do servidor selecionado (vem do tenant ativo via RPC).
// O teste de conexão usa a edge function test-server-connection do tenant.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileCode,
  FileText,
  KeyRound,
  Link as LinkIcon,
  Loader2,
  Settings2,
  Terminal,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { supabase } from "@/integrations/supabase/client";
import { testServerConnection } from "@/lib/serverConnection";
import { cn } from "@/lib/utils";

interface InstallerFile {
  name: string;
  description: string;
  path: string;
  icon: typeof FileCode;
  language: "php" | "bash" | "markdown";
  primary?: boolean;
}

const FILES: InstallerFile[] = [
  {
    name: "api_cls.php",
    description:
      "Bridge HTTP completa (gamedbd, templates CLS, backups, restore, item catalog).",
    path: "/installer/api_cls.php",
    icon: FileCode,
    language: "php",
    primary: true,
  },
  {
    name: "install-apicls-centos7.sh",
    description:
      "Instalador automático para CentOS 7. Configura Apache, sudoers, scripts e backups.",
    path: "/installer/install-apicls-centos7.sh",
    icon: Terminal,
    language: "bash",
    primary: true,
  },
  {
    name: "README.md",
    description: "Tutorial completo atualizado (instalação, testes, troubleshooting).",
    path: "/installer/README.md",
    icon: FileText,
    language: "markdown",
  },
];

/** Tenta inferir uma URL "esperada" do api_cls.php a partir da URL cadastrada. */
function expectedApiUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) return "http://SEU_IP/apicls/api_cls.php";
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  if (/api_cls\.php$/i.test(trimmed)) return trimmed;
  return `${trimmed}/apicls/api_cls.php`;
}

const Install = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { servers, active, loading: serversLoading } = useServers();

  const [copied, setCopied] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [secret, setSecret] = useState<string | null>(null);
  const [secretLoading, setSecretLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!selectedId) {
      const fallback = active?.id ?? servers[0]?.id ?? "";
      if (fallback) setSelectedId(fallback);
    }
  }, [active, servers, selectedId]);

  const selected = useMemo(
    () => servers.find((s) => s.id === selectedId) ?? null,
    [servers, selectedId],
  );

  // RPC só retorna o secret do tenant ativo do usuário.
  useEffect(() => {
    let alive = true;
    setSecret(null);
    setShowSecret(false);
    if (!selected) return;
    if (!selected.is_active) return;
    setSecretLoading(true);
    supabase.rpc("get_my_tenant_secret").then(({ data }) => {
      if (!alive) return;
      setSecret((data as string | null) ?? null);
      setSecretLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [selected]);

  const apiUrl = expectedApiUrl(selected?.pw_api_base_url);
  // Sempre usamos placeholders fictícios no comando exibido — o IP e o secret
  // reais do servidor nunca aparecem no método recomendado, para evitar
  // vazamento ao copiar/compartilhar a tela.
  const ipPlaceholder = "IP_DA_VPS";
  const secretPlaceholder = "SEU_SECRET";

  const installCommand = [
    `scp api_cls.php root@${ipPlaceholder}:/root/api_cls.php`,
    `scp install-apicls-centos7.sh root@${ipPlaceholder}:/root/install-apicls-centos7.sh`,
    `ssh root@${ipPlaceholder} "bash /root/install-apicls-centos7.sh --secret ${secretPlaceholder} --api-src /root/api_cls.php"`,
  ].join("\n");

  const handleDownload = (file: InstallerFile) => {
    // Ancora <a download> faz o navegador baixar; nada além de um toast aqui.
    toast.success(`Baixando ${file.name}`);
  };

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

  const copyValue = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado`);
    } catch {
      toast.error("Falha ao copiar");
    }
  };

  const handleTest = async () => {
    if (!selected) return;
    setTesting(true);
    const r = await testServerConnection({ tenant_id: selected.id });
    setTesting(false);
    if (r.success) {
      toast.success(
        `Conexão OK${r.entries != null ? ` · ${r.entries} entries` : ""} (${r.elapsed_ms}ms)`,
      );
    } else {
      toast.error(`Falha: ${r.error ?? "erro desconhecido"}`);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

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
              Conecte sua VPS Perfect World ao painel
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Aviso de origem da conexão */}
        <div className="mb-6 flex flex-wrap items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 text-xs">
          <Settings2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="font-semibold text-foreground">
              A conexão da VPS agora é gerenciada em <strong>Servidores</strong>.
            </p>
            <p className="mt-1 text-muted-foreground">
              A tela antiga de Configurações <em>não</em> é mais usada para chamar
              a API da VPS. Cadastre/edite cada VPS em <strong>Meus Servidores</strong>{" "}
              e mantenha um servidor ativo.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate("/servers")}>
            Meus Servidores
          </Button>
        </div>

        {/* Seletor de servidor + credenciais */}
        {session && servers.length > 0 && (
          <section className="mb-8 rounded-2xl border border-border bg-card/40 p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider">
                  <KeyRound className="h-4 w-4 text-primary" />
                  Credenciais desta instalação
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  O comando abaixo já preenche o secret do servidor escolhido.
                </p>
              </div>
              {servers.length > 1 && (
                <div className="min-w-[220px]">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Servidor
                  </Label>
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {servers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.server_name}
                          {s.is_active ? " · ativo" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <LinkIcon className="mr-1 inline h-3 w-3" />
                  URL esperada do api_cls.php
                </Label>
                <div className="mt-1 flex gap-2">
                  <Input readOnly value={apiUrl} className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyValue("URL", apiUrl)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <KeyRound className="mr-1 inline h-3 w-3" />
                  Secret deste servidor
                </Label>
                <div className="mt-1 flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      readOnly
                      type={showSecret ? "text" : "password"}
                      value={
                        secretLoading
                          ? "Carregando..."
                          : secret ??
                            (selected?.is_active
                              ? "(sem secret configurado)"
                              : "(ative este servidor para ver)")
                      }
                      className="pr-10 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Mostrar/ocultar secret"
                      disabled={!secret}
                    >
                      {showSecret ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => secret && copyValue("Secret", secret)}
                    disabled={!secret}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {selected && !selected.is_active && (
                  <p className="mt-1 text-[11px] text-amber-500">
                    Este servidor não é o ativo. Ative-o em{" "}
                    <strong>Meus Servidores</strong> para ver o secret aqui.
                  </p>
                )}
              </div>

              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                <strong>Não reutilize</strong> o secret de outro servidor. Cada VPS
                deve ter o seu — se um vazar, os outros continuam seguros.
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button onClick={handleTest} disabled={testing || !selected}>
                  {testing ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Wifi className="mr-2 h-3.5 w-3.5" />
                  )}
                  Testar conexão
                </Button>
                <Button variant="outline" onClick={() => navigate("/servers")}>
                  Ir para Meus Servidores
                </Button>
              </div>
            </div>
          </section>
        )}

        {session && servers.length === 0 && !serversLoading && (
          <section className="mb-8 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Nenhum servidor cadastrado
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cadastre uma VPS em <strong>Meus Servidores</strong> primeiro — o secret
              aparece aqui pronto para colar no comando do instalador.
            </p>
            <Button className="mt-3" onClick={() => navigate("/servers")}>
              Ir para Meus Servidores
            </Button>
          </section>
        )}

        {/* Método recomendado: instalador automático */}
        <section className="mb-8 rounded-2xl border border-primary/40 bg-primary/5 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider">
              Método recomendado · instalador automático
            </h2>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Baixe os dois arquivos abaixo, suba pra VPS e rode o instalador. Ele
            instala Apache + PHP, configura sudoers, cria as pastas de backup e
            testa a conexão sozinho.
          </p>
          <div className="relative">
            <pre className="overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-xs">
              {installCommand}
            </pre>
            <Button
              size="sm"
              variant="outline"
              className="absolute right-2 top-2"
              onClick={() => copyValue("Comando", installCommand)}
            >
              <Copy className="mr-2 h-3.5 w-3.5" /> Copiar
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Substitua <code className="rounded bg-muted px-1 font-mono">IP_DA_VPS</code> pelo IP/host
            real e <code className="rounded bg-muted px-1 font-mono">SEU_SECRET</code> pelo secret
            mostrado em <strong>Meus Servidores</strong>. Depois volte aqui e clique em{" "}
            <strong>Testar conexão</strong>.
          </p>
        </section>

        {/* Arquivos */}
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
                  className={cn(
                    "flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-card/40 p-4",
                    f.primary ? "border-primary/40" : "border-border",
                  )}
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
                      className={cn(
                        copied === f.name && "border-emerald-500/60 text-emerald-500",
                      )}
                    >
                      {copied === f.name ? (
                        <Check className="mr-2 h-3.5 w-3.5" />
                      ) : (
                        <Copy className="mr-2 h-3.5 w-3.5" />
                      )}
                      {copied === f.name ? "Copiado" : "Copiar"}
                    </Button>
                    <Button asChild size="sm" onClick={() => handleDownload(f)}>
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
            💡 O instalador <strong>injeta o secret automaticamente</strong> no
            <code className="mx-1 rounded bg-muted px-1 font-mono">api_cls.php</code>
            antes de copiar para
            <code className="mx-1 rounded bg-muted px-1 font-mono">/var/www/html/apicls/</code>.
            Você não precisa editar nada manualmente.
          </p>
        </section>
      </main>
    </div>
  );
};

export default Install;

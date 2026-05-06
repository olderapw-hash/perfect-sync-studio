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
import { CurrentReleaseCard } from "@/components/CurrentReleaseCard";
import { useServers } from "@/hooks/useServers";
import { supabase } from "@/integrations/supabase/client";
import { testServerConnection } from "@/lib/serverConnection";
import { friendlyConnectionError } from "@/lib/connectionErrors";
import { cn } from "@/lib/utils";

interface InstallerFile {
  name: string;
  description: string;
  /** Static fallback path in public/ */
  staticPath: string;
  icon: typeof FileCode;
  language: "php" | "bash" | "markdown";
  primary?: boolean;
}

const FILES: InstallerFile[] = [
  {
    name: "api_cls.php",
    description:
      "Bridge HTTP completa: gamedbd, templates CLS, backups, restore, item catalog, correio, GM Commander bulk e moderação.",
    staticPath: "/installer/api_cls.php",
    icon: FileCode,
    language: "php",
    primary: true,
  },
  {
    name: "install-apicls-centos7.sh",
    description:
      "Instalador automático para CentOS 7. Configura Apache, sudoers, scripts de correio/backup e testa o ambiente.",
    staticPath: "/installer/install-apicls-centos7.sh",
    icon: Terminal,
    language: "bash",
    primary: true,
  },
  {
    name: "pw_send_mail.php",
    description:
      "Handler do correio real (item/gold). Conversa com o gdeliveryd via send_mail.lua.",
    staticPath: "/installer/pw_send_mail.php",
    icon: FileCode,
    language: "php",
  },
  {
    name: "sendreward-api.sh",
    description:
      "Wrapper sudo chamado pelo Apache para executar o pw_send_mail.php como root.",
    staticPath: "/installer/sendreward-api.sh",
    icon: Terminal,
    language: "bash",
  },
  {
    name: "backupgamedbd-api.sh",
    description:
      "Wrapper sudo para backups do gamedbd. Chamado pelo api_cls.php via sudoers.",
    staticPath: "/installer/backupgamedbd-api.sh",
    icon: Terminal,
    language: "bash",
  },
  {
    name: "gm-queue-worker.php",
    description:
      "Worker que processa jobs bulk do GM Commander (premiação em massa).",
    staticPath: "/installer/gm-queue-worker.php",
    icon: FileCode,
    language: "php",
  },
  {
    name: "gm-schedule-worker.php",
    description:
      "Worker de agendamento: cria jobs bulk a partir de schedules configurados.",
    staticPath: "/installer/gm-schedule-worker.php",
    icon: FileCode,
    language: "php",
  },
  {
    name: "README.md",
    description: "Tutorial completo: instalação, testes, dry_run do correio, troubleshooting.",
    staticPath: "/installer/README.md",
    icon: FileText,
    language: "markdown",
  },
];

/** Build a storage URL for a file in the installer-releases/current/ folder */
function storageFileUrl(fileName: string): string {
  const projUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${projUrl}/storage/v1/object/public/installer-releases/current/${encodeURIComponent(fileName)}`;
}

/** Returns the best available URL for a file: storage (latest release) or static fallback */
function getFileUrl(file: InstallerFile, storageAvailable: Set<string>): string {
  if (storageAvailable.has(file.name)) {
    return storageFileUrl(file.name);
  }
  return file.staticPath;
}

/** Features que a versão atual da API já suporta. Aparece na UI como
 *  "o que você ganha instalando este pacote". */
const API_FEATURES: { label: string; detail: string }[] = [
  { label: "Templates CLS", detail: "getClsconfig, saveClsconfigTemplate, exportClsconfig" },
  { label: "Personagem real", detail: "getRoleEditable, saveRoleEditable, getRolesEditable" },
  { label: "Backups", detail: "backupGamedbd, listBackups, getBackupContent, restoreBackup" },
  { label: "Item catalog", detail: "getItemCatalog (webtradeid, auctionid, valuables, visibleid)" },
  { label: "Correio real via gdeliveryd", detail: "sendMailItem, sendMailGold (com fallback queue + dry_run)" },
  { label: "GM Commander Bulk", detail: "resolveBulkTargets, previewBulkTargets, queueBulkCommand, getBulkCommandJobs" },
  { label: "Moderação", detail: "kickRole, banAccount, unbanAccount, muteAccount, clearRolePk" },
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
  const [storageFiles, setStorageFiles] = useState<Set<string>>(new Set());
  const [showRealValues, setShowRealValues] = useState(false);

  // Check which files exist in storage (from extracted releases)
  useEffect(() => {
    supabase.storage
      .from("installer-releases")
      .list("current", { limit: 50 })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setStorageFiles(new Set(data.map((f) => f.name)));
        }
      });
  }, []);

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

  // Busca o secret do servidor selecionado (RPC valida ownership).
  // Funciona mesmo quando o servidor NÃO está ativo — útil logo após criar
  // o 1º servidor no onboarding, antes de ativar.
  useEffect(() => {
    let alive = true;
    setSecret(null);
    setShowSecret(false);
    if (!selected) return;
    setSecretLoading(true);
    supabase
      .rpc("get_tenant_secret", { _tenant_id: selected.id })
      .then(({ data }) => {
        if (!alive) return;
        setSecret((data as string | null) ?? null);
        setSecretLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [selected]);

  const apiUrl = expectedApiUrl(selected?.pw_api_base_url);

  // Extrai host/IP da URL pra pré-preencher o comando quando o usuário escolher.
  const ipFromUrl = useMemo(() => {
    if (!selected?.pw_api_base_url) return null;
    try {
      const u = new URL(
        selected.pw_api_base_url.startsWith("http")
          ? selected.pw_api_base_url
          : `http://${selected.pw_api_base_url}`,
      );
      return u.hostname;
    } catch {
      return null;
    }
  }, [selected]);

  const ipDisplay = showRealValues && ipFromUrl ? ipFromUrl : "IP_DA_VPS";
  const secretDisplay = showRealValues && secret ? secret : "SEU_SECRET";

  const installCommand = [
    `scp api_cls.php install-apicls-centos7.sh root@${ipDisplay}:/root/`,
    `ssh root@${ipDisplay} "bash /root/install-apicls-centos7.sh --secret ${secretDisplay}"`,
  ].join("\n");

  const handleDownload = (file: InstallerFile) => {
    // Ancora <a download> faz o navegador baixar; nada além de um toast aqui.
    toast.success(`Baixando ${file.name}`);
  };

  const handleCopy = async (file: InstallerFile) => {
    try {
      const res = await fetch(getFileUrl(file, storageFiles));
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
      const f = friendlyConnectionError(r);
      toast.error(f.title, { description: f.hint, duration: 8000 });
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
        <CurrentReleaseCard />
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
            Método recomendado · 2 comandos
            </h2>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Baixe <strong>api_cls.php</strong> e <strong>install-apicls-centos7.sh</strong>, suba pra VPS e rode o instalador. 
            Ele instala tudo automaticamente: Apache, PHP, sudoers, scripts auxiliares e testa a conexão.
          </p>

          {/* Toggle: placeholders vs valores reais */}
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-border bg-card/40 p-2 text-xs">
            <button
              type="button"
              onClick={() => setShowRealValues(false)}
              className={cn(
                "flex-1 rounded px-3 py-1.5 font-semibold transition-smooth",
                !showRealValues
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              🛡️ Modo seguro (placeholders)
            </button>
            <button
              type="button"
              onClick={() => setShowRealValues(true)}
              disabled={!secret || !ipFromUrl}
              className={cn(
                "flex-1 rounded px-3 py-1.5 font-semibold transition-smooth disabled:opacity-40",
                showRealValues
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title={
                !secret || !ipFromUrl
                  ? "Selecione um servidor com URL e secret cadastrados"
                  : ""
              }
            >
              ⚡ Pronto pra colar (valores reais)
            </button>
          </div>

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
          {!showRealValues ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Substitua <code className="rounded bg-muted px-1 font-mono">IP_DA_VPS</code> pelo IP/host
              real e <code className="rounded bg-muted px-1 font-mono">SEU_SECRET</code> pelo secret
              mostrado em <strong>Meus Servidores</strong>. Depois volte aqui e clique em{" "}
              <strong>Testar conexão</strong>.
            </p>
          ) : (
            <p className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                O comando agora contém <strong>seu IP e secret reais</strong>. Não cole em chats,
                screenshots ou repos públicos — qualquer pessoa com esse comando consegue acesso
                root à sua VPS.
              </span>
            </p>
          )}
        </section>

        {/* Features que esta versão da API entrega */}
        <section className="mb-8 rounded-2xl border border-border bg-card/30 p-6">
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider">
            O que esta versão suporta
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {API_FEATURES.map((f) => (
              <li
                key={f.label}
                className="flex items-start gap-2 rounded-md border border-border bg-background/50 p-3"
              >
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{f.label}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{f.detail}</p>
                </div>
              </li>
            ))}
          </ul>
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
                      <a href={getFileUrl(f, storageFiles)} download={f.name}>
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

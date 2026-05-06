// Página /install — download único do .zip + 2 comandos na VPS.
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
  FolderOpen,
  KeyRound,
  Link as LinkIcon,
  Loader2,
  Package,
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

/** Build a storage URL for the zip in installer-releases/current/ */
function storageZipUrl(): string {
  const projUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${projUrl}/storage/v1/object/public/installer-releases/current/orphea-installer.zip`;
}

const API_FEATURES: { label: string; detail: string }[] = [
  { label: "Templates CLS", detail: "getClsconfig, saveClsconfigTemplate, exportClsconfig" },
  { label: "Personagem real", detail: "getRoleEditable, saveRoleEditable, getRolesEditable" },
  { label: "Backups", detail: "backupGamedbd, listBackups, getBackupContent, restoreBackup" },
  { label: "Item catalog", detail: "getItemCatalog (webtradeid, auctionid, valuables, visibleid)" },
  { label: "Correio real", detail: "sendMailItem, sendMailGold (com fallback queue + dry_run)" },
  { label: "GM Commander Bulk", detail: "resolveBulkTargets, previewBulkTargets, queueBulkCommand" },
  { label: "Moderação", detail: "kickRole, banAccount, unbanAccount, muteAccount, clearRolePk" },
];

const INCLUDED_FILES = [
  "api_cls.php",
  "install-apicls-centos7.sh",
  "pw_send_mail.php",
  "sendreward-api.sh",
  "backupgamedbd-api.sh",
  "gm-queue-worker.php",
  "gm-schedule-worker.php",
  "sudoers.gamedbd-backup.example",
  "README.md",
];

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

  const [selectedId, setSelectedId] = useState<string>("");
  const [secret, setSecret] = useState<string | null>(null);
  const [secretLoading, setSecretLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showRealValues, setShowRealValues] = useState(false);
  const [hasStorageZip, setHasStorageZip] = useState(false);
  const [vpsToken, setVpsToken] = useState<string | null>(null);
  const [vpsStatus, setVpsStatus] = useState<string | null>(null);

  // Check if zip exists in storage
  useEffect(() => {
    supabase.storage
      .from("installer-releases")
      .list("current", { limit: 50 })
      .then(({ data }) => {
        if (data?.some((f) => f.name === "orphea-installer.zip")) {
          setHasStorageZip(true);
        }
      });
  }, []);

  // Fetch user's VPS activation token
  useEffect(() => {
    if (!session?.user) return;
    supabase.rpc("get_my_vps_activation_token").then(({ data }) => {
      if (data && Array.isArray(data) && data.length > 0) {
        setVpsToken(data[0].activation_token);
        setVpsStatus(data[0].vps_status);
      }
    });
  }, [session?.user?.id]);

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

  const zipUrl = hasStorageZip ? storageZipUrl() : "/installer/orphea-installer.zip";

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

  // ---- Commands ----
  const step2Command = `scp -r C:\\orphea\\* root@${ipDisplay}:/root/orphea/`;
  const activationPart = vpsToken ? ` --activation-token ${vpsToken}` : "";
  const step3Command = `ssh root@${ipDisplay} "bash /root/orphea/install-apicls-centos7.sh --secret ${secretDisplay}${activationPart}"`;

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
              3 passos para conectar sua VPS ao painel
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <CurrentReleaseCard />

        {/* Aviso de servidores */}
        <div className="mb-6 flex flex-wrap items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 text-xs">
          <Settings2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="font-semibold text-foreground">
              Cadastre sua VPS em <strong>Servidores</strong> antes de instalar.
            </p>
            <p className="mt-1 text-muted-foreground">
              Você vai precisar do <strong>secret</strong> gerado lá para rodar o instalador.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate("/servers")}>
            Meus Servidores
          </Button>
        </div>

        {/* Credenciais */}
        {session && servers.length > 0 && (
          <section className="mb-8 rounded-2xl border border-border bg-card/40 p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider">
                  <KeyRound className="h-4 w-4 text-primary" />
                  Credenciais
                </h2>
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
                  URL esperada
                </Label>
                <div className="mt-1 flex gap-2">
                  <Input readOnly value={apiUrl} className="font-mono text-xs" />
                  <Button variant="outline" size="sm" onClick={() => copyValue("URL", apiUrl)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <KeyRound className="mr-1 inline h-3 w-3" />
                  Secret
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
                              ? "(sem secret)"
                              : "(ative o servidor)")
                      }
                      className="pr-10 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={!secret}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              Cadastre uma VPS em <strong>Meus Servidores</strong> primeiro.
            </p>
            <Button className="mt-3" onClick={() => navigate("/servers")}>
              Ir para Meus Servidores
            </Button>
          </section>
        )}

        {/* ===== 3 PASSOS ===== */}
        <div className="space-y-6">
          {/* PASSO 1 — Download */}
          <section className="rounded-2xl border border-primary/40 bg-primary/5 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider">
                  Baixar o pacote
                </h2>
                <p className="text-xs text-muted-foreground">
                  Um único arquivo .zip com tudo incluso
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <a href={zipUrl} download="orphea-installer.zip">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar orphea-installer.zip
                </a>
              </Button>
              <span className="text-xs text-muted-foreground">~131 KB</span>
            </div>

            <div className="mt-4 rounded-md border border-border bg-background p-3">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                <FolderOpen className="h-3.5 w-3.5 text-primary" />
                Extraia para <code className="rounded bg-muted px-1.5 font-mono">C:\orphea</code>
              </p>
              <div className="grid gap-1 pl-5 text-[11px] font-mono text-muted-foreground">
                {INCLUDED_FILES.map((f) => (
                  <span key={f}>📄 {f}</span>
                ))}
              </div>
            </div>
          </section>

          {/* PASSO 2 — Enviar pra VPS */}
          <section className="rounded-2xl border border-border bg-card/40 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </div>
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider">
                  Enviar para a VPS
                </h2>
                <p className="text-xs text-muted-foreground">
                  Abra o terminal (PowerShell/CMD) na pasta <code className="font-mono">C:\orphea</code>
                </p>
              </div>
            </div>

            {/* Toggle: placeholders vs valores reais */}
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-border bg-card/60 p-2 text-xs">
              <button
                type="button"
                onClick={() => setShowRealValues(false)}
                className={cn(
                  "flex-1 rounded px-3 py-1.5 font-semibold transition-all",
                  !showRealValues
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                🛡️ Placeholders
              </button>
              <button
                type="button"
                onClick={() => setShowRealValues(true)}
                disabled={!secret || !ipFromUrl}
                className={cn(
                  "flex-1 rounded px-3 py-1.5 font-semibold transition-all disabled:opacity-40",
                  showRealValues
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                ⚡ Valores reais
              </button>
            </div>

            <div className="relative">
              <pre className="overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-xs">
                {step2Command}
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute right-2 top-2"
                onClick={() => copyValue("Comando SCP", step2Command)}
              >
                <Copy className="mr-2 h-3.5 w-3.5" /> Copiar
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Isso envia todos os arquivos da pasta <code className="font-mono">C:\orphea</code> para <code className="font-mono">/root/orphea/</code> na VPS.
            </p>
          </section>

          {/* PASSO 3 — Instalar */}
          <section className="rounded-2xl border border-border bg-card/40 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </div>
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider">
                  Instalar na VPS
                </h2>
                <p className="text-xs text-muted-foreground">
                  O instalador configura tudo automaticamente
                </p>
              </div>
            </div>

            <div className="relative">
              <pre className="overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-xs">
                {step3Command}
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute right-2 top-2"
                onClick={() => copyValue("Comando SSH", step3Command)}
              >
                <Copy className="mr-2 h-3.5 w-3.5" /> Copiar
              </Button>
            </div>

            <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
              <p>✅ Instala Apache + PHP automaticamente</p>
              <p>✅ Configura sudoers e scripts auxiliares</p>
              <p>✅ Secrets salvos no .env (nunca no código-fonte)</p>
              <p>✅ Testa a conexão com o gamedbd</p>
              {vpsToken ? (
                <p className="text-primary font-semibold">🔒 Token de ativação VPS incluído — protegido contra redistribuição</p>
              ) : (
                <p className="text-amber-500">⚠️ Sem token de ativação VPS — sem proteção contra cópia</p>
              )}
            </div>

            {showRealValues && (
              <p className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Os comandos contêm <strong>IP e secret reais</strong>. Não compartilhe.
                </span>
              </p>
            )}

            {!showRealValues && (
              <p className="mt-3 text-xs text-muted-foreground">
                Substitua <code className="rounded bg-muted px-1 font-mono">IP_DA_VPS</code> e{" "}
                <code className="rounded bg-muted px-1 font-mono">SEU_SECRET</code> pelos valores
                reais do seu servidor.
              </p>
            )}
          </section>
        </div>

        {/* Features */}
        <section className="mt-8 rounded-2xl border border-border bg-card/30 p-6">
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

        {/* Conteúdo do pacote */}
        <section className="mt-6 rounded-2xl border border-border bg-card/30 p-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider">
            <Package className="h-4 w-4 text-primary" />
            Conteúdo do pacote
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {INCLUDED_FILES.map((f) => (
              <div
                key={f}
                className="flex items-center gap-2 rounded-md border border-border bg-background/50 px-3 py-2"
              >
                <Terminal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="font-mono text-xs">{f}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Install;

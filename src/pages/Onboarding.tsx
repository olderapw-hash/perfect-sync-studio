// Onboarding multi-servidor.
//
// Fluxo:
//   1) Usuário cria/loga (já tratado fora — chega aqui logado).
//   2) Se já tem servidor ATIVO -> manda direto pro /admin.
//   3) Se tem servidores mas nenhum ativo -> pede para escolher qual ativar.
//   4) Se NÃO tem servidor -> wizard:
//        a) preenche nome + URL + secret (gera/cole)
//        b) abre /install com esse servidor já selecionado
//        c) clica "Já instalei, testar conexão"
//        d) sucesso -> set_active_tenant e vai pro /admin
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  LogOut,
  Power,
  Server,
  Shield,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useServers } from "@/hooks/useServers";
import { testServerConnection } from "@/lib/serverConnection";
import { friendlyConnectionError } from "@/lib/connectionErrors";
import { validateApiUrl } from "@/lib/connectionErrors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Step = "form" | "install" | "test";

const Onboarding = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading, isAdmin, isSuperadmin, signOut } = useAuth();
  const { isActive, isTrial, loading: subLoading } = useSubscription();
  const { servers, active, loading: serversLoading, refetch, setActive } = useServers();
  const bypassPayment = isAdmin || isSuperadmin;
  // Trial users go to /trial (slim layout) instead of /admin after onboarding.
  const postOnboardingRoute = isTrial && !isAdmin && !isSuperadmin ? "/trial" : "/admin";

  // Estado do wizard de criação.
  const [step, setStep] = useState<Step>("form");
  const [serverName, setServerName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [iconBase, setIconBase] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  // Redirects de fluxo.
  useEffect(() => {
    if (authLoading || subLoading || serversLoading) return;
    if (!session) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!isActive && !bypassPayment) {
      navigate("/pricing", { replace: true });
      return;
    }
    // Só sai do onboarding quando o servidor ativo já concluiu o onboarding.
    // Se existir servidor ativo porém ainda incompleto, permanece aqui para evitar
    // loop /onboarding -> /admin -> /onboarding.
    if (active?.onboarding_completed) {
      navigate(postOnboardingRoute, { replace: true });
    }
  }, [
    authLoading,
    subLoading,
    serversLoading,
    session,
    isActive,
    bypassPayment,
    active,
    postOnboardingRoute,
    navigate,
  ]);

  const generateSecret = () => {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    setApiSecret(
      Array.from(arr)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
    );
    toast.success("Secret gerado");
  };

  const copySecret = async () => {
    if (!apiSecret) return;
    await navigator.clipboard.writeText(apiSecret);
    toast.success("Secret copiado");
  };

  // ===== Caso A: tem servidores mas nenhum ativo =====
  const needsActivation = !active && servers.length > 0;

  const handleActivate = async (id: string) => {
    setActivatingId(id);
    try {
      await setActive(id);
      toast.success("Servidor ativo definido");
      navigate(postOnboardingRoute, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao ativar");
    } finally {
      setActivatingId(null);
    }
  };

  // ===== Caso B: zero servidores -> wizard =====
  const urlValidation = useMemo(() => validateApiUrl(apiUrl), [apiUrl]);

  const handleCreateServer = async () => {
    if (!session?.user) return;
    if (!urlValidation.ok) {
      toast.error("URL inválida", { description: urlValidation.error });
      return;
    }
    if (!apiSecret || apiSecret.length < 16) {
      toast.error("Secret muito curto", {
        description: "Use 'Gerar' pra criar um secret forte de 48 caracteres.",
      });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("tenants")
      .insert({
        owner_id: session.user.id,
        server_name: serverName || "Meu Servidor PW",
        pw_api_base_url: urlValidation.normalized,
        pw_api_secret: apiSecret,
        icon_base_url: iconBase ? iconBase.replace(/\/+$/, "/") : null,
        onboarding_completed: false,
        is_active: true,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error || !data) {
      toast.error("Erro ao criar servidor: " + (error?.message ?? "desconhecido"));
      return;
    }
    setCreatedId(data.id);
    setApiUrl(urlValidation.normalized);
    await refetch();
    setStep("install");
    toast.success("Servidor criado! Agora instale o api_cls.php na sua VPS.");
  };

  const handleTestAndFinish = async () => {
    if (!createdId) return;
    setTesting(true);
    const r = await testServerConnection({ tenant_id: createdId });
    setTesting(false);
    if (!r.success) {
      const f = friendlyConnectionError(r);
      toast.error(f.title, { description: f.hint, duration: 10000 });
      return;
    }
    toast.success(`Conexão OK · ${r.elapsed_ms}ms`);
    // Marca onboarding como completo + ativa.
    await supabase
      .from("tenants")
      .update({ onboarding_completed: true })
      .eq("id", createdId);
    try {
      await setActive(createdId);
    } catch {
      /* ignore — RPC já valida ownership */
    }
    window.location.assign(postOnboardingRoute);
  };

  const installUrl = useMemo(() => "/install", []);

  if (authLoading || subLoading || serversLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/30">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-extrabold uppercase tracking-wider">
            PW <span className="text-primary">Admin</span>
          </span>
          <span className="ml-2 text-xs text-muted-foreground">· Configuração inicial</span>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await signOut();
                navigate("/auth", { replace: true });
              }}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {/* ============== CASO A: ativar servidor existente ============== */}
        {needsActivation && (
          <section className="rounded-2xl border border-border bg-card/40 p-8">
            <h1 className="flex items-center gap-2 text-2xl font-extrabold">
              <Power className="h-6 w-6 text-primary" /> Escolha o servidor ativo
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Você tem {servers.length} servidor(es) cadastrado(s), mas nenhum está marcado como
              ativo. O servidor ativo é o que o painel vai administrar.
            </p>

            <div className="mt-6 space-y-2">
              {servers.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{s.server_name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {s.pw_api_base_url ?? "(sem URL)"}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleActivate(s.id)}
                    disabled={activatingId === s.id}
                  >
                    {activatingId === s.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Power className="mr-2 h-4 w-4" />
                    )}
                    Ativar e abrir painel
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => navigate("/servers")}>
                Gerenciar servidores
              </Button>
            </div>
          </section>
        )}

        {/* ============== CASO B: wizard novo servidor ============== */}
        {!needsActivation && (
          <>
            {/* Stepper */}
            <div className="mb-8 flex items-center justify-between">
              {(["form", "install", "test"] as Step[]).map((s, i) => {
                const idx = ["form", "install", "test"].indexOf(step);
                const reached = idx >= i;
                return (
                  <div key={s} className="flex flex-1 items-center">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-smooth",
                        reached
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground",
                      )}
                    >
                      {idx > i ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    {i < 2 && (
                      <div
                        className={cn(
                          "mx-2 h-0.5 flex-1 transition-smooth",
                          idx > i ? "bg-primary" : "bg-border",
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {step === "form" && (
              <section className="rounded-2xl border border-border bg-card/40 p-8">
                <h1 className="flex items-center gap-2 text-2xl font-extrabold">
                  <Server className="h-6 w-6 text-primary" /> Cadastre seu primeiro servidor
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Em 3 passos seu painel está conectado: cadastro → instalação na VPS → teste.
                  Você pode adicionar mais servidores depois em <strong>Meus Servidores</strong>.
                </p>

                <div className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="ob-name">Nome do servidor</Label>
                    <Input
                      id="ob-name"
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      placeholder="Ex: Perfect World Brasil"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ob-url">URL da API (com http:// e porta)</Label>
                    <Input
                      id="ob-url"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      placeholder="http://SEU_IP/apicls/api_cls.php"
                      className={cn(
                        "font-mono text-xs",
                        apiUrl && !urlValidation.ok && "border-destructive",
                      )}
                    />
                    {apiUrl && !urlValidation.ok && (
                      <p className="mt-1 text-[11px] text-destructive">
                        ✗ {urlValidation.error}
                      </p>
                    )}
                    {apiUrl && urlValidation.ok && (
                      <p className="mt-1 text-[11px] text-emerald-500">
                        ✓ Endpoint final:{" "}
                        <code className="font-mono">{urlValidation.endpoint}</code>
                      </p>
                    )}
                    {!apiUrl && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Endereço do <code className="font-mono">api_cls.php</code> que você vai
                        instalar.
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="ob-secret">Secret</Label>
                    <div className="flex gap-2">
                      <Input
                        id="ob-secret"
                        value={apiSecret}
                        onChange={(e) => setApiSecret(e.target.value)}
                        className="font-mono text-xs"
                        placeholder="Gere ou cole um secret de 48 caracteres"
                      />
                      <Button type="button" variant="outline" onClick={generateSecret}>
                        Gerar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={copySecret}
                        disabled={!apiSecret}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ob-icons">URL base dos ícones (opcional)</Label>
                    <Input
                      id="ob-icons"
                      value={iconBase}
                      onChange={(e) => setIconBase(e.target.value)}
                      placeholder="http://SEU_IP/"
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    onClick={handleCreateServer}
                    disabled={
                      saving || !urlValidation.ok || !apiSecret || apiSecret.length < 16
                    }
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    Próximo: instalar na VPS
                  </Button>
                </div>
              </section>
            )}

            {step === "install" && (
              <section className="rounded-2xl border border-border bg-card/40 p-8">
                <h1 className="text-2xl font-extrabold">Instale na sua VPS</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Abra a página de instalação — ela já mostra a <strong>URL esperada</strong> e o{" "}
                  <strong>secret</strong> deste servidor prontos para colar no{" "}
                  <code className="rounded bg-muted px-1 font-mono">api_cls.php</code>.
                </p>

                <div className="mt-6 rounded-md border border-primary/40 bg-primary/5 p-4 text-sm">
                  <p>📋 Passo a passo resumido:</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
                    <li>Baixe ou copie o <code className="font-mono">api_cls.php</code></li>
                    <li>Suba para <code className="font-mono">/var/www/html/apicls/</code></li>
                    <li>O botão "Copiar" da página /install já embute o secret</li>
                    <li>Crie a pasta de backups e instale o script de export</li>
                    <li>Volte aqui e clique em "Já instalei, testar conexão"</li>
                  </ol>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Button asChild>
                    <a href={installUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" /> Abrir página /install
                    </a>
                  </Button>
                  <Button variant="outline" onClick={() => setStep("test")}>
                    Já instalei, testar conexão
                  </Button>
                </div>

                <div className="mt-8 flex justify-between">
                  <Button variant="ghost" onClick={() => setStep("form")}>
                    Voltar
                  </Button>
                </div>
              </section>
            )}

            {step === "test" && (
              <section className="rounded-2xl border border-border bg-card/40 p-8">
                <h1 className="flex items-center gap-2 text-2xl font-extrabold">
                  <Wifi className="h-6 w-6 text-primary" /> Testar conexão
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Vamos chamar o seu <code className="font-mono">api_cls.php</code> via edge
                  function autenticada. Se responder OK, marcamos o onboarding como concluído e
                  abrimos o painel.
                </p>

                <div className="mt-6 rounded-md border border-border bg-card/60 p-4 text-xs">
                  <p>
                    <strong className="text-foreground">URL:</strong>{" "}
                    <code className="font-mono">{apiUrl}</code>
                  </p>
                  <p className="mt-1">
                    <strong className="text-foreground">Servidor:</strong>{" "}
                    {serverName || "Meu Servidor PW"}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Button onClick={handleTestAndFinish} disabled={testing}>
                    {testing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wifi className="mr-2 h-4 w-4" />
                    )}
                    Testar e abrir painel
                  </Button>
                  <Button variant="outline" onClick={() => setStep("install")}>
                    Voltar para instalação
                  </Button>
                </div>

                <p className="mt-4 text-[11px] text-muted-foreground">
                  Falhou? Confirme que o secret no <code className="font-mono">api_cls.php</code>{" "}
                  é igual ao cadastrado, que a URL é acessível e que não há firewall bloqueando.
                </p>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Onboarding;

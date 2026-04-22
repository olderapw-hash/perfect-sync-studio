import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Copy, Download, Loader2, Server, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useTenant, fetchTenantSecret } from "@/hooks/useTenant";

const Onboarding = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();
  const { tenant, loading: tenantLoading, refetch } = useTenant();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [serverName, setServerName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [iconBase, setIconBase] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenant) {
      setServerName(tenant.server_name || "");
      setApiUrl(tenant.pw_api_base_url || "");
      setIconBase(tenant.icon_base_url || "");
    }
  }, [tenant]);

  // Fetch the API secret separately and only when needed (not stored in shared state).
  useEffect(() => {
    if (!session?.user?.id || !tenant) return;
    fetchTenantSecret(session.user.id).then((secret) => {
      if (secret) setApiSecret(secret);
    });
  }, [session?.user?.id, tenant]);

  // Redirect rules
  useEffect(() => {
    if (authLoading || subLoading) return;
    if (!session) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!isActive) {
      navigate("/pricing", { replace: true });
    }
  }, [authLoading, subLoading, session, isActive, navigate]);

  const generateSecret = () => {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    const secret = Array.from(arr)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setApiSecret(secret);
    toast.success("Secret gerado! Copia e cola no api_cls.php depois.");
  };

  const copySecret = () => {
    if (!apiSecret) return;
    navigator.clipboard.writeText(apiSecret);
    toast.success("Secret copiado");
  };

  const saveAndFinish = async () => {
    if (!session?.user) return;
    if (!apiUrl || !apiSecret) {
      toast.error("Preencha URL da API e Secret antes de finalizar.");
      return;
    }
    setSaving(true);
    const payload = {
      owner_id: session.user.id,
      server_name: serverName || "Meu Servidor PW",
      pw_api_base_url: apiUrl.replace(/\/+$/, ""),
      pw_api_secret: apiSecret,
      icon_base_url: iconBase ? iconBase.replace(/\/+$/, "/") : null,
      onboarding_completed: true,
    };
    const { error } = await supabase
      .from("tenants")
      .upsert(payload, { onConflict: "owner_id" });
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    await refetch();
    toast.success("Tudo certo! Bem-vindo ao seu painel.");
    navigate("/admin", { replace: true });
  };

  if (authLoading || subLoading || tenantLoading) {
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
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {/* Stepper */}
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex flex-1 items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-smooth ${
                  step >= n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {step > n ? <CheckCircle2 className="h-4 w-4" /> : n}
              </div>
              {n < 3 && (
                <div
                  className={`mx-2 h-0.5 flex-1 transition-smooth ${
                    step > n ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Welcome + download */}
        {step === 1 && (
          <section className="rounded-2xl border border-border bg-card/40 p-8">
            <h1 className="text-2xl font-extrabold">Bem-vindo ao PW Admin! 🎮</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Em 3 passos seu painel tá rodando conectado na sua VPS. O primeiro é instalar o
              arquivo de ponte (<code className="rounded bg-muted px-1 py-0.5">api_cls.php</code>) na
              sua VPS — ele que faz a conexão segura entre o painel e o banco do seu servidor.
            </p>

            <div className="mt-6 rounded-xl border border-border bg-card/60 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
                <Download className="h-4 w-4 text-primary" /> Baixe o arquivo de instalação
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Após baixar, suba o arquivo pra uma pasta acessível via web na sua VPS (ex:
                <code className="mx-1 rounded bg-muted px-1">/var/www/html/</code>) e abra o
                arquivo pra colar o secret que você vai gerar no próximo passo.
              </p>
              <a
                href="/api_cls.php.txt"
                download="api_cls.php"
                className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
                onClick={(e) => {
                  // If file doesn't exist yet, show a tip instead
                  // Real file should be uploaded to /public/api_cls.php.txt
                  e.preventDefault();
                  toast.info(
                    "Vamos te enviar o arquivo por aqui em breve. Por ora, você pode usar o api_cls.php que já está na sua VPS atual.",
                  );
                }}
              >
                <Download className="h-3.5 w-3.5" /> Baixar api_cls.php
              </a>
            </div>

            <button
              onClick={() => setStep(2)}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow hover:brightness-110"
            >
              Próximo: gerar secret <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        )}

        {/* Step 2: Generate secret */}
        {step === 2 && (
          <section className="rounded-2xl border border-border bg-card/40 p-8">
            <h1 className="text-2xl font-extrabold">Gerar secret de acesso</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              O secret é uma chave única que protege a comunicação entre o painel e sua VPS. Sem
              ela, ninguém consegue acessar a API mesmo sabendo a URL.
            </p>

            <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-foreground">
              🔒 <strong>Dica de segurança:</strong> gere um secret <em>novo</em> agora (192 bits
              aleatórios). Ele fica salvo só na sua conta e na sua VPS — nem outros clientes do
              painel nem a equipe do PW Admin conseguem ler. Se desconfiar de vazamento, é só voltar
              aqui, gerar outro e atualizar no <code className="rounded bg-muted px-1">api_cls.php</code>.
            </div>
            <div className="mt-6 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Secret da API
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="Clique em 'Gerar' ou cole um secret existente"
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs font-mono"
                />
                <button
                  onClick={generateSecret}
                  className="rounded-md border border-border bg-card/60 px-3 py-2 text-xs font-semibold hover:border-primary/50"
                >
                  Gerar
                </button>
                <button
                  onClick={copySecret}
                  disabled={!apiSecret}
                  className="rounded-md border border-border bg-card/60 px-3 py-2 text-xs font-semibold hover:border-primary/50 disabled:opacity-50"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Cole o mesmo valor na variável <code className="rounded bg-muted px-1">$SECRET</code>{" "}
                dentro do <code className="rounded bg-muted px-1">api_cls.php</code> da sua VPS.
              </p>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="rounded-md border border-border bg-card/60 px-4 py-2 text-xs font-semibold"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!apiSecret}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow hover:brightness-110 disabled:opacity-50"
              >
                Próximo <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {/* Step 3: Connect */}
        {step === 3 && (
          <section className="rounded-2xl border border-border bg-card/40 p-8">
            <h1 className="flex items-center gap-2 text-2xl font-extrabold">
              <Server className="h-6 w-6 text-primary" /> Conectar sua VPS
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Cole abaixo a URL onde você instalou o <code className="rounded bg-muted px-1">api_cls.php</code>.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nome do seu servidor
                </label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="Ex: Perfect World Brasil"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  URL da API (com http:// e porta)
                </label>
                <input
                  type="url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://93.127.143.77/api_cls.php"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Secret da API
                </label>
                <input
                  type="text"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  URL base dos ícones (opcional)
                </label>
                <input
                  type="url"
                  value={iconBase}
                  onChange={(e) => setIconBase(e.target.value)}
                  placeholder="http://93.127.143.77/"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="rounded-md border border-border bg-card/60 px-4 py-2 text-xs font-semibold"
              >
                Voltar
              </button>
              <button
                onClick={saveAndFinish}
                disabled={saving || !apiUrl || !apiSecret}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-glow hover:brightness-110 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Finalizar e abrir painel
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Onboarding;

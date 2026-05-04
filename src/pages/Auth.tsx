import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useServers } from "@/hooks/useServers";
import { useAppSettings } from "@/hooks/useAppSettings";
import { toast } from "sonner";
import heroBg from "@/assets/landing-hero.jpg";
import orpheaLogo from "@/assets/orphea-core-logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading, isAdmin, isSuperadmin } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();
  const { servers, active, loading: serversLoading } = useServers();
  const { settings } = useAppSettings();
  const bgImage = settings.background_url || heroBg;
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authLoading || subLoading || serversLoading || !session) return;

    const next = new URLSearchParams(window.location.search).get("next");
    if (next && ["/pricing", "/onboarding", "/servers", "/install"].includes(next)) {
      navigate(next, { replace: true });
      return;
    }

    const hasServerAccess = servers.length > 0;
    const hasCompletedActiveServer = !!active?.onboarding_completed;
    const isVpsMode = !!import.meta.env.VITE_LICENSE_KEY;
    const bypassPayment = isSuperadmin || isAdmin || isVpsMode;

    // Servidor ativo já configurado -> painel.
    if (hasCompletedActiveServer) {
      navigate("/admin", { replace: true });
      return;
    }

    // Tem servidor cadastrado mas ainda não completou setup (ex: criou mas não
    // testou conexão / não rodou install) -> volta pro onboarding pra terminar.
    if (hasServerAccess) {
      navigate("/onboarding", { replace: true });
      return;
    }

    // Sem servidor: precisa de assinatura ativa (admin/superadmin pulam pagamento).
    if (isActive || bypassPayment) {
      navigate("/onboarding", { replace: true });
      return;
    }

    navigate("/pricing", { replace: true });
  }, [
    active?.onboarding_completed,
    authLoading,
    isActive,
    isAdmin,
    isSuperadmin,
    navigate,
    servers.length,
    serversLoading,
    session,
    subLoading,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        toast.success("Conta criada. Faça login para continuar.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo!");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro de autenticação";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background bg-fixed bg-cover bg-center p-4 text-foreground"
      style={{
        backgroundImage: `linear-gradient(hsl(var(--background) / 0.92), hsl(var(--background) / 0.96)), url(${bgImage})`,
      }}
    >
      {/* Glow do primary para realçar o card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.18),transparent_65%)]"
      />

      <section className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-card/70 p-6 shadow-glow backdrop-blur-xl">
        <header className="mb-6 flex flex-col items-center gap-3 text-center">
          <img
            src={orpheaLogo}
            alt="Orphea Core"
            className="h-16 w-16 rounded-2xl object-contain shadow-glow ring-1 ring-primary/30"
          />
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            Orphea Core
          </h1>
          <p className="text-xs text-muted-foreground">
            Login e cadastro · Perfect World
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow transition-smooth hover:brightness-110 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signup" ? "Criar conta" : "Entrar"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "signin" ? (
            <>
              Sem conta?{" "}
              <button onClick={() => setMode("signup")} className="font-semibold text-primary hover:underline">
                Cadastrar
              </button>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <button onClick={() => setMode("signin")} className="font-semibold text-primary hover:underline">
                Entrar
              </button>
            </>
          )}
        </p>
        <p className="mt-3 text-center text-[10px] text-muted-foreground/70">
          Depois do login, você será guiado para assinatura ou configuração inicial do servidor.
        </p>
      </section>
    </main>
  );
};

export default Auth;

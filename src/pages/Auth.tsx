import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useServers } from "@/hooks/useServers";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading, isAdmin, isSuperadmin } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();
  const { servers, active, loading: serversLoading } = useServers();
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

    if (isSuperadmin || isAdmin || hasCompletedActiveServer) {
      navigate("/admin", { replace: true });
      return;
    }

    if (hasServerAccess || isActive) {
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
    <main className="flex min-h-screen items-center justify-center bg-hero p-4">
      <section className="w-full max-w-sm rounded-xl border border-border bg-card/60 p-6 backdrop-blur-md shadow-glow">
        <header className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            Painel Admin
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

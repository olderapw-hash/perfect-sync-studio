import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Loader2, MailCheck, Eye, EyeOff, Check, X, ArrowLeft,
  Shield, Mail, Lock, User, AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useServers } from "@/hooks/useServers";
import { useAppSettings } from "@/hooks/useAppSettings";
import { toast } from "sonner";
import orpheaLogo from "@/assets/orphea-core-logo.png";

/* ─────────── Password Strength ─────────── */
interface PwReq { label: string; met: boolean }

function usePasswordRequirements(pw: string): { reqs: PwReq[]; score: number } {
  return useMemo(() => {
    const reqs: PwReq[] = [
      { label: "Mínimo 8 caracteres", met: pw.length >= 8 },
      { label: "Letra maiúscula", met: /[A-Z]/.test(pw) },
      { label: "Número", met: /\d/.test(pw) },
      { label: "Caractere especial", met: /[^A-Za-z0-9]/.test(pw) },
    ];
    const score = reqs.filter((r) => r.met).length;
    return { reqs, score };
  }, [pw]);
}

function StrengthBar({ score }: { score: number }) {
  const colors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500"];
  const labels = ["", "Fraca", "Razoável", "Boa", "Forte"];
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? colors[score] : "bg-white/10"
            }`}
          />
        ))}
      </div>
      {score > 0 && (
        <p className={`text-[10px] font-medium ${score >= 3 ? "text-emerald-400" : "text-muted-foreground"}`}>
          {labels[score]}
        </p>
      )}
    </div>
  );
}

function RequirementsList({ reqs }: { reqs: PwReq[] }) {
  return (
    <ul className="space-y-1 pt-1">
      {reqs.map((r) => (
        <li
          key={r.label}
          className={`flex items-center gap-1.5 text-[11px] transition-all duration-200 ${
            r.met ? "text-emerald-400" : "text-muted-foreground/60"
          }`}
        >
          {r.met ? (
            <Check className="h-3 w-3 shrink-0" />
          ) : (
            <X className="h-3 w-3 shrink-0 opacity-40" />
          )}
          {r.label}
        </li>
      ))}
    </ul>
  );
}

/* ─────────── Animated Particles ─────────── */
function Particles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            background: `hsl(0 ${40 + Math.random() * 20}% ${30 + Math.random() * 20}%)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float-particle ${8 + Math.random() * 12}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.15; }
          50% { transform: translateY(-30px) translateX(10px); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

/* ─────────── Premium Input ─────────── */
function PremiumInput({
  id, label, icon: Icon, type = "text", value, onChange, error, ...props
}: {
  id: string; label: string; icon: any; type?: string;
  value: string; onChange: (v: string) => void; error?: string;
  [k: string]: any;
}) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPw ? "text" : "password") : type;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/80">
        {label}
      </label>
      <div
        className={`relative flex items-center rounded-lg border transition-all duration-200 ${
          error
            ? "border-red-500/60 bg-red-500/5"
            : focused
              ? "border-[hsl(0_50%_35%/0.6)] bg-white/[0.03] shadow-[0_0_12px_hsl(0_60%_30%/0.1)]"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12]"
        }`}
      >
        <Icon className="ml-3 h-4 w-4 text-muted-foreground/50" />
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          {...props}
        />
        {isPassword && value && (
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="mr-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            tabIndex={-1}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-[11px] text-red-400">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}

/* ─────────── Main Auth ─────────── */
type Mode = "signin" | "signup" | "forgot";

const Auth = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading, isAdmin, isSuperadmin } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();
  const { servers, active, loading: serversLoading } = useServers();
  const { settings } = useAppSettings();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { reqs, score } = usePasswordRequirements(password);

  // --- Redirect logic ---
  useEffect(() => {
    if (authLoading || subLoading || serversLoading || !session) return;
    const next = new URLSearchParams(window.location.search).get("next");
    if (next && ["/pricing", "/onboarding", "/servers", "/install"].includes(next)) {
      navigate(next, { replace: true }); return;
    }
    const hasServerAccess = servers.length > 0;
    const hasCompletedActiveServer = !!active?.onboarding_completed;
    const isVpsMode = !!import.meta.env.VITE_LICENSE_KEY;
    const bypassPayment = isSuperadmin || isAdmin || isVpsMode;
    if (hasCompletedActiveServer) { navigate("/admin", { replace: true }); return; }
    if (hasServerAccess) { navigate("/onboarding", { replace: true }); return; }
    if (isActive || bypassPayment) { navigate("/onboarding", { replace: true }); return; }
    navigate("/pricing", { replace: true });
  }, [active?.onboarding_completed, authLoading, isActive, isAdmin, isSuperadmin, navigate, servers.length, serversLoading, session, subLoading]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const maskEmail = (e: string) => {
    const [local, domain] = e.split("@");
    if (!domain) return e;
    return `${local.slice(0, 3)}${"*".repeat(Math.max(local.length - 3, 3))}@${domain}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    // Validations
    if (mode === "signup") {
      if (password !== confirmPassword) {
        toast.error("As senhas não coincidem."); return;
      }
      if (score < 3) {
        toast.error("Sua senha precisa atender ao menos 3 requisitos."); return;
      }
      if (!acceptTerms) {
        toast.error("Você precisa aceitar os termos de uso."); return;
      }
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { display_name: username || undefined },
          },
        });
        if (error) throw error;
        setShowConfirmation(true);
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setForgotSent(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro de autenticação";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) toast.error(error.message);
    else {
      toast.success("Email reenviado!");
      setResendCooldown(60);
    }
  };

  /* ─── Render ─── */
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] p-4">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,hsl(0_60%_15%/0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_50%_at_80%_90%,hsl(0_50%_12%/0.08),transparent_60%)]" />
      </div>
      <Particles />

      {/* Main Card */}
      <section className="relative z-10 w-full max-w-[420px] animate-fade-in-up">
        {/* Glow behind card */}
        <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-[radial-gradient(ellipse_at_center,hsl(0_60%_25%/0.08),transparent_70%)] blur-xl" aria-hidden />

        <div className="relative rounded-2xl border border-white/[0.06] bg-[hsl(0_0%_5%/0.85)] p-8 shadow-[0_32px_80px_-20px_hsl(0_0%_0%/0.9)] backdrop-blur-2xl">
          {/* Top border glow */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(0_50%_35%/0.3)] to-transparent" aria-hidden />

          {/* Logo */}
          <header className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="relative">
              <div className="absolute -inset-2 rounded-2xl bg-[radial-gradient(circle,hsl(0_60%_30%/0.15),transparent_70%)]" />
              <img
                src={orpheaLogo}
                alt="Orphea Core"
                className="relative h-14 w-14 rounded-xl object-contain ring-1 ring-white/10"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                {mode === "signin" && "Acesse sua conta"}
                {mode === "signup" && "Crie sua conta Orphea Core"}
                {mode === "forgot" && "Recuperar acesso"}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {mode === "signin" && "Gerencie seu servidor Perfect World com tecnologia premium."}
                {mode === "signup" && "Gerencie seu servidor Perfect World com segurança e tecnologia premium."}
                {mode === "forgot" && "Informe o email associado à sua conta para receber as instruções de recuperação."}
              </p>
            </div>
          </header>

          {/* ─── Confirmation Screen ─── */}
          {showConfirmation ? (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 animate-pulse rounded-full bg-[hsl(0_60%_30%/0.15)]" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[hsl(0_50%_35%/0.3)] bg-[hsl(0_0%_8%)]">
                  <MailCheck className="h-7 w-7 text-[hsl(0_50%_45%)]" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-bold text-foreground">Confirmação enviada</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enviamos um link de verificação para seu endereço de email.
                  Confirme sua conta para continuar utilizando todos os recursos do Orphea Core.
                </p>
                <div className="mt-3 inline-block rounded-md border border-white/[0.06] bg-white/[0.03] px-4 py-2">
                  <p className="font-mono text-sm text-[hsl(0_50%_50%)]">{maskEmail(email)}</p>
                </div>
              </div>
              <div className="w-full space-y-2 pt-2">
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2.5 text-xs font-semibold text-foreground transition-all hover:border-[hsl(0_50%_35%/0.3)] hover:bg-white/[0.05] disabled:opacity-40"
                >
                  {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : "Reenviar email"}
                </button>
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setMode("signin");
                    setEmail(""); setPassword(""); setConfirmPassword(""); setUsername("");
                  }}
                  className="w-full rounded-lg py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Voltar para login
                </button>
              </div>
            </div>
          ) : forgotSent ? (
            /* ─── Forgot Password Sent ─── */
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[hsl(0_50%_35%/0.3)] bg-[hsl(0_0%_8%)]">
                <Mail className="h-6 w-6 text-[hsl(0_50%_45%)]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-bold text-foreground">Instruções enviadas</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Se uma conta com este email existir, você receberá as instruções de recuperação em instantes.
                </p>
              </div>
              <button
                onClick={() => { setForgotSent(false); setMode("signin"); }}
                className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[hsl(0_50%_50%)] hover:text-[hsl(0_50%_60%)] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar para login
              </button>
            </div>
          ) : (
            /* ─── Forms ─── */
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <PremiumInput
                    id="username"
                    label="Nome de usuário"
                    icon={User}
                    value={username}
                    onChange={setUsername}
                    placeholder="Seu nome"
                    autoComplete="username"
                  />
                )}
                <PremiumInput
                  id="email"
                  label="Email"
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="voce@email.com"
                  required
                  autoComplete="email"
                />
                {mode !== "forgot" && (
                  <div className="space-y-2">
                    <PremiumInput
                      id="password"
                      label="Senha"
                      icon={Lock}
                      type="password"
                      value={password}
                      onChange={setPassword}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    />
                    {mode === "signup" && password && (
                      <div className="space-y-2 pl-1">
                        <StrengthBar score={score} />
                        <RequirementsList reqs={reqs} />
                      </div>
                    )}
                  </div>
                )}
                {mode === "signup" && (
                  <PremiumInput
                    id="confirm-password"
                    label="Confirmar senha"
                    icon={Shield}
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    error={confirmPassword && confirmPassword !== password ? "As senhas não coincidem" : undefined}
                  />
                )}

                {mode === "signup" && (
                  <label className="flex items-start gap-2.5 cursor-pointer group pt-1">
                    <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                      acceptTerms
                        ? "border-[hsl(0_50%_35%)] bg-[hsl(0_50%_30%)]"
                        : "border-white/[0.12] bg-white/[0.03] group-hover:border-white/[0.2]"
                    }`}>
                      {acceptTerms && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="sr-only"
                    />
                    <span className="text-[11px] leading-relaxed text-muted-foreground">
                      Li e aceito os{" "}
                      <Link to="/terms" className="text-[hsl(0_50%_50%)] hover:underline">Termos de Uso</Link>
                      {" "}e a{" "}
                      <Link to="/privacy" className="text-[hsl(0_50%_50%)] hover:underline">Política de Privacidade</Link>.
                    </span>
                  </label>
                )}

                {mode === "signin" && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-[11px] text-muted-foreground/70 hover:text-[hsl(0_50%_50%)] transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-[hsl(0_50%_22%)] to-[hsl(0_60%_28%)] py-3 text-sm font-bold text-white shadow-[0_4px_20px_hsl(0_60%_25%/0.25)] transition-all duration-300 hover:shadow-[0_6px_30px_hsl(0_60%_25%/0.4)] hover:brightness-110 disabled:opacity-50 disabled:hover:shadow-none"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/[0.06] to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <span className="relative flex items-center justify-center gap-2">
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {mode === "signup" && "Criar conta"}
                    {mode === "signin" && "Entrar"}
                    {mode === "forgot" && "Enviar instruções"}
                  </span>
                </button>
              </form>

              {/* Mode switch */}
              <div className="mt-6 space-y-2 text-center">
                {mode === "signin" && (
                  <p className="text-xs text-muted-foreground">
                    Não possui uma conta?{" "}
                    <button onClick={() => { setMode("signup"); setPassword(""); setConfirmPassword(""); }} className="font-semibold text-[hsl(0_50%_50%)] hover:text-[hsl(0_50%_60%)] transition-colors">
                      Criar conta
                    </button>
                  </p>
                )}
                {mode === "signup" && (
                  <p className="text-xs text-muted-foreground">
                    Já possui uma conta?{" "}
                    <button onClick={() => { setMode("signin"); setPassword(""); setConfirmPassword(""); }} className="font-semibold text-[hsl(0_50%_50%)] hover:text-[hsl(0_50%_60%)] transition-colors">
                      Acessar
                    </button>
                  </p>
                )}
                {mode === "forgot" && (
                  <button
                    onClick={() => setMode("signin")}
                    className="flex items-center gap-1.5 mx-auto text-xs font-semibold text-[hsl(0_50%_50%)] hover:text-[hsl(0_50%_60%)] transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar para login
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default Auth;

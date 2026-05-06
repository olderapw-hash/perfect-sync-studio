import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock, Shield, Check, X, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import orpheaLogo from "@/assets/orphea-core-logo.png";

function usePasswordRequirements(pw: string) {
  return useMemo(() => {
    const reqs = [
      { label: "Mínimo 8 caracteres", met: pw.length >= 8 },
      { label: "Letra maiúscula", met: /[A-Z]/.test(pw) },
      { label: "Número", met: /\d/.test(pw) },
      { label: "Caractere especial", met: /[^A-Za-z0-9]/.test(pw) },
    ];
    return { reqs, score: reqs.filter((r) => r.met).length };
  }, [pw]);
}

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const { reqs, score } = usePasswordRequirements(password);

  // Check for recovery token in URL
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      // No recovery token — redirect
      navigate("/auth", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem."); return;
    }
    if (score < 3) {
      toast.error("Sua senha precisa atender ao menos 3 requisitos."); return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate("/auth", { replace: true }), 3000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao redefinir senha");
    } finally {
      setBusy(false);
    }
  };

  const colors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500"];

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,hsl(0_60%_15%/0.15),transparent_70%)]" aria-hidden />

      <section className="relative z-10 w-full max-w-[420px] animate-fade-in-up">
        <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-[radial-gradient(ellipse_at_center,hsl(0_60%_25%/0.08),transparent_70%)] blur-xl" aria-hidden />
        <div className="relative rounded-2xl border border-white/[0.06] bg-[hsl(0_0%_5%/0.85)] p-8 shadow-[0_32px_80px_-20px_hsl(0_0%_0%/0.9)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(0_50%_35%/0.3)] to-transparent" aria-hidden />

          <header className="mb-8 flex flex-col items-center gap-3 text-center">
            <img src={orpheaLogo} alt="Orphea Core" className="h-14 w-14 rounded-xl object-contain ring-1 ring-white/10" />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                {success ? "Senha alterada" : "Definir nova senha"}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {success ? "Sua senha foi redefinida com sucesso." : "Escolha uma senha forte para proteger sua conta."}
              </p>
            </div>
          </header>

          {success ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                <CheckCircle className="h-7 w-7 text-emerald-400" />
              </div>
              <p className="text-xs text-muted-foreground">Redirecionando para o login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/80">Nova senha</label>
                <div className="flex items-center rounded-lg border border-white/[0.08] bg-white/[0.02] focus-within:border-[hsl(0_50%_35%/0.6)] transition-all">
                  <Lock className="ml-3 h-4 w-4 text-muted-foreground/50" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
                {password && (
                  <div className="space-y-2 pt-1 pl-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= score ? colors[score] : "bg-white/10"}`} />
                      ))}
                    </div>
                    <ul className="space-y-1">
                      {reqs.map((r) => (
                        <li key={r.label} className={`flex items-center gap-1.5 text-[11px] ${r.met ? "text-emerald-400" : "text-muted-foreground/60"}`}>
                          {r.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-40" />} {r.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/80">Confirmar senha</label>
                <div className={`flex items-center rounded-lg border transition-all ${confirmPassword && confirmPassword !== password ? "border-red-500/60" : "border-white/[0.08]"} bg-white/[0.02]`}>
                  <Shield className="ml-3 h-4 w-4 text-muted-foreground/50" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-[11px] text-red-400">As senhas não coincidem</p>
                )}
              </div>

              <button
                type="submit"
                disabled={busy}
                className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-[hsl(0_50%_22%)] to-[hsl(0_60%_28%)] py-3 text-sm font-bold text-white shadow-[0_4px_20px_hsl(0_60%_25%/0.25)] transition-all hover:shadow-[0_6px_30px_hsl(0_60%_25%/0.4)] hover:brightness-110 disabled:opacity-50"
              >
                <span className="relative flex items-center justify-center gap-2">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Redefinir senha
                </span>
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default ResetPassword;

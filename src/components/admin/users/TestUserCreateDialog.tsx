// Diálogo: superadmin cria um usuário de teste com plano e duração
// configuráveis. Mostra credenciais geradas uma única vez.
import { useState } from "react";
import { Loader2, X, FlaskConical, Copy, Check, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

type Plan = "free" | "pro" | "ultimate";

interface Created {
  email: string;
  password: string;
  plan: Plan;
  expires_at: string;
}

const DURATIONS = [
  { label: "1 hora", hours: 1 },
  { label: "24 horas", hours: 24 },
  { label: "7 dias", hours: 24 * 7 },
  { label: "30 dias", hours: 24 * 30 },
  { label: "∞ Ilimitado", hours: 0 },
];

export const TestUserCreateDialog = ({ onClose, onCreated }: Props) => {
  const [plan, setPlan] = useState<Plan>("ultimate");
  const [hours, setHours] = useState(24);
  const isUnlimited = hours === 0;
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState<"email" | "password" | "both" | null>(null);

  const create = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("admin-create-test-user", {
      body: { plan, duration_hours: hours },
    });
    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    if ((data as { error?: string })?.error) {
      toast.error((data as { error: string }).error);
      return;
    }

    setCreated(data as Created);
    onCreated();
  };

  const copy = async (text: string, kind: "email" | "password" | "both") => {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-glow">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <h3 className="text-base font-extrabold text-foreground">Criar usuário de teste</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!created ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase text-muted-foreground">
                Plano
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["free", "pro", "ultimate"] as Plan[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlan(p)}
                    className={`rounded-md border px-2 py-2 text-xs font-bold uppercase transition ${
                      plan === p
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-card/40 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase text-muted-foreground">
                Duração
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.hours}
                    onClick={() => setHours(d.hours)}
                    className={`rounded-md border px-2 py-2 text-xs font-semibold transition ${
                      hours === d.hours
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-card/40 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 text-[11px] text-amber-300">
              Email e senha serão gerados aleatoriamente. A conta é excluída
              automaticamente quando o tempo acabar.
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={onClose}
                className="rounded-md border border-border px-3 py-1.5 text-xs hover:border-primary/40"
              >
                Cancelar
              </button>
              <button
                onClick={create}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:brightness-110 disabled:opacity-50"
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Criar conta
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="font-semibold">
                Copie agora! As credenciais não poderão ser recuperadas depois de fechar.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">
                Email
              </label>
              <div className="flex gap-1">
                <input
                  readOnly
                  value={created.email}
                  className="flex-1 rounded-md border border-border bg-card/40 px-2 py-1.5 font-mono text-foreground"
                />
                <button
                  onClick={() => copy(created.email, "email")}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 hover:border-primary/40"
                >
                  {copied === "email" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">
                Senha
              </label>
              <div className="flex gap-1">
                <input
                  readOnly
                  value={created.password}
                  className="flex-1 rounded-md border border-border bg-card/40 px-2 py-1.5 font-mono text-foreground"
                />
                <button
                  onClick={() => copy(created.password, "password")}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 hover:border-primary/40"
                >
                  {copied === "password" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md bg-muted/20 p-2 text-[11px]">
              <span className="text-muted-foreground">
                Plano <strong className="uppercase text-foreground">{created.plan}</strong>
              </span>
              <span className="text-muted-foreground">
                Expira em{" "}
                <strong className="text-foreground">
                  {new Date(created.expires_at).toLocaleString()}
                </strong>
              </span>
            </div>

            <button
              onClick={() =>
                copy(`${created.email}\n${created.password}`, "both")
              }
              className="w-full rounded-md border border-border bg-card/40 px-3 py-2 text-xs font-semibold hover:border-primary/40"
            >
              {copied === "both" ? (
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Copiado!
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Copy className="h-3.5 w-3.5" /> Copiar email + senha
                </span>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:brightness-110"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Diálogo do superadmin pra forçar um plano em qualquer usuário.
// Não passa pela Paddle — escreve direto na tabela subscriptions via RPC.
import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  userId: string;
  email: string;
  currentPlan: string;
  onClose: () => void;
  onSaved: () => void;
}

type Plan = "free" | "pro" | "ultimate";

const PLAN_LABELS: Record<Plan, string> = {
  free: "Free (sem assinatura)",
  pro: "Pro — gestão de personagens",
  ultimate: "Ultimate — tudo liberado",
};

export const UserPlanDialog = ({ userId, email, currentPlan, onClose, onSaved }: Props) => {
  const initial: Plan = (["free", "pro", "ultimate"] as Plan[]).includes(currentPlan as Plan)
    ? (currentPlan as Plan)
    : "free";
  const [plan, setPlan] = useState<Plan>(initial);
  // Padrão: 30 dias se Pro/Ultimate; campo vazio = sem expiração.
  const defaultExpiry = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  })();
  const [expiresAt, setExpiresAt] = useState<string>(defaultExpiry);
  const [noExpiry, setNoExpiry] = useState(false);
  const [env, setEnv] = useState<"live" | "sandbox">("live");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const expires =
      plan === "free" || noExpiry || !expiresAt ? null : new Date(expiresAt).toISOString();
    const { error } = await supabase.rpc("admin_set_user_plan", {
      target_user_id: userId,
      new_plan: plan,
      expires_at: expires,
      env,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Plano atualizado para ${PLAN_LABELS[plan]}`);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-glow">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-foreground">Alterar plano</h3>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Plano</label>
            <div className="grid grid-cols-3 gap-2">
              {(["free", "pro", "ultimate"] as Plan[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={`rounded-md border px-2 py-2 text-xs font-bold capitalize transition ${
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
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Ambiente</label>
            <div className="flex gap-2">
              {(["live", "sandbox"] as const).map((e) => (
                <button
                  key={e}
                  onClick={() => setEnv(e)}
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-semibold capitalize ${
                    env === e
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-card/40 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {e === "live" ? "Live (produção)" : "Sandbox (teste)"}
                </button>
              ))}
            </div>
          </div>

          {plan !== "free" && (
            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Expira em</span>
                <label className="flex items-center gap-1 text-[10px] font-normal">
                  <input
                    type="checkbox"
                    checked={noExpiry}
                    onChange={(e) => setNoExpiry(e.target.checked)}
                  />
                  Sem expiração
                </label>
              </label>
              <input
                type="date"
                value={expiresAt}
                disabled={noExpiry}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-md border border-border bg-card/40 px-2 py-1.5 text-xs text-foreground disabled:opacity-50"
              />
            </div>
          )}

          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-300">
            Esse override não passa pela Paddle. Se o usuário já tem assinatura paga ativa, ela será
            substituída por essa entrada manual.
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:border-primary/40"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-glow hover:brightness-110 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Aplicar plano
          </button>
        </div>
      </div>
    </div>
  );
};

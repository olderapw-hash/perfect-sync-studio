// Confirmação de exclusão TOTAL de usuário. Chama edge function
// admin-delete-user (purge + remoção do auth.users via service role).
import { useState } from "react";
import { Loader2, AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  userId: string;
  email: string;
  onClose: () => void;
  onDeleted: () => void;
}

export const UserDeleteDialog = ({ userId, email, onClose, onDeleted }: Props) => {
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const matches = confirm.trim().toLowerCase() === email.toLowerCase();

  const run = async () => {
    if (!matches) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("admin-delete-user", {
      body: { target_user_id: userId },
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
    toast.success("Usuário excluído permanentemente");
    onDeleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-destructive/40 bg-card p-5 shadow-glow">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="text-base font-extrabold text-foreground">Excluir usuário</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <p className="text-muted-foreground">
            Esta ação remove <strong className="text-foreground">{email}</strong> permanentemente,
            incluindo:
          </p>
          <ul className="list-inside list-disc space-y-0.5 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-muted-foreground">
            <li>Conta de login</li>
            <li>Todos os servidores que ele é dono + dados vinculados</li>
            <li>Assinaturas, permissões e logs de auditoria</li>
            <li>Convites enviados e participações</li>
          </ul>
          <p className="text-destructive">Não é possível reverter.</p>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
              Digite o e-mail completo para confirmar:
            </label>
            <input
              autoFocus
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={email}
              className="w-full rounded-md border border-border bg-card/40 px-2 py-1.5 text-xs text-foreground focus:border-destructive focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:border-primary/40"
          >
            Cancelar
          </button>
          <button
            onClick={run}
            disabled={!matches || busy}
            className="inline-flex items-center gap-1 rounded-md bg-destructive px-3 py-1.5 text-xs font-bold text-destructive-foreground hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Excluir definitivamente
          </button>
        </div>
      </div>
    </div>
  );
};

// Lista todos os servidores (tenants) de um usuário e permite excluir
// individualmente. Cada exclusão dispara cascade no banco (admin_delete_tenant).
import { useEffect, useState } from "react";
import { Loader2, Trash2, X, ServerCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserTenant {
  id: string;
  server_name: string;
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
  members_count: number;
}

interface Props {
  userId: string;
  email: string;
  onClose: () => void;
  onChanged: () => void;
}

export const UserServersDialog = ({ userId, email, onClose, onChanged }: Props) => {
  const [tenants, setTenants] = useState<UserTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_user_tenants", {
      target_user_id: userId,
    });
    if (error) toast.error(error.message);
    setTenants((data ?? []) as UserTenant[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const remove = async (tid: string, name: string) => {
    if (!confirm(`Excluir o servidor "${name}" e TODOS os dados vinculados? Esta ação é permanente.`))
      return;
    setBusyId(tid);
    const { error } = await supabase.rpc("admin_delete_tenant", { target_tenant_id: tid });
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Servidor excluído");
    await load();
    onChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-glow">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-foreground">Servidores do usuário</h3>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Este usuário não possui servidores.
          </div>
        ) : (
          <ul className="space-y-2">
            {tenants.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/40 p-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <ServerCog className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {t.server_name}
                      {t.is_active && (
                        <span className="ml-2 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                          ATIVO
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {t.members_count} membro(s) · Criado em{" "}
                      {new Date(t.created_at).toLocaleDateString()} · Onboarding{" "}
                      {t.onboarding_completed ? "✓" : "pendente"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => remove(t.id, t.server_name)}
                  disabled={busyId === t.id}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50"
                >
                  {busyId === t.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:border-primary/40"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ShieldCheck, ShieldOff, Crown, ArrowLeft, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminUserRow {
  user_id: string;
  email: string;
  created_at: string;
  is_admin: boolean;
  is_superadmin: boolean;
  has_subscription: boolean;
  tenant_server_name: string | null;
  onboarding_completed: boolean;
}

const AdminUsers = () => {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) {
      toast.error(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as AdminUserRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const grant = async (userId: string) => {
    setBusyId(userId);
    const { error } = await supabase.rpc("admin_grant_admin", { target_user_id: userId });
    if (error) toast.error(error.message);
    else {
      toast.success("Usuário promovido a admin");
      await load();
    }
    setBusyId(null);
  };

  const revoke = async (userId: string) => {
    if (!confirm("Revogar permissão de admin deste usuário?")) return;
    setBusyId(userId);
    const { error } = await supabase.rpc("admin_revoke_admin", { target_user_id: userId });
    if (error) toast.error(error.message);
    else {
      toast.success("Permissão revogada");
      await load();
    }
    setBusyId(null);
  };

  return (
    <main className="min-h-screen bg-hero p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs hover:border-primary/50"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Painel
            </Link>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                Gestão de usuários
              </h1>
              <p className="text-xs text-muted-foreground">
                Acesso restrito ao superadmin · Aprove novos assinantes
              </p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs hover:border-primary/50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </header>

        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-border bg-card/60 p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/60 p-8 text-center text-sm text-muted-foreground">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card/60">
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Usuário</th>
                    <th className="px-4 py-3 font-semibold">Servidor</th>
                    <th className="px-4 py-3 font-semibold">Assinatura</th>
                    <th className="px-4 py-3 font-semibold">Acesso</th>
                    <th className="px-4 py-3 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.user_id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{u.email}</div>
                        <div className="text-[11px] text-muted-foreground">
                          Cadastro: {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {u.tenant_server_name ?? "—"}
                        {u.tenant_server_name && (
                          <div className="text-[10px]">
                            Onboarding: {u.onboarding_completed ? "✓" : "pendente"}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.has_subscription ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Ativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <XCircle className="h-3.5 w-3.5" /> Sem assinatura
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.is_superadmin ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-500">
                            <Crown className="h-3 w-3" /> Superadmin
                          </span>
                        ) : u.is_admin ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            <ShieldCheck className="h-3 w-3" /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted/30 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.is_superadmin ? (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        ) : u.is_admin ? (
                          <button
                            onClick={() => revoke(u.user_id)}
                            disabled={busyId === u.user_id}
                            className="inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50"
                          >
                            {busyId === u.user_id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShieldOff className="h-3.5 w-3.5" />
                            )}
                            Revogar
                          </button>
                        ) : (
                          <button
                            onClick={() => grant(u.user_id)}
                            disabled={busyId === u.user_id}
                            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-glow hover:brightness-110 disabled:opacity-50"
                          >
                            {busyId === u.user_id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            )}
                            Aprovar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-border md:hidden">
              {rows.map((u) => (
                <div key={u.user_id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{u.email}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                        {u.tenant_server_name && ` · ${u.tenant_server_name}`}
                      </div>
                    </div>
                    {u.is_superadmin ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                        <Crown className="h-3 w-3" /> Super
                      </span>
                    ) : u.is_admin ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        <ShieldCheck className="h-3 w-3" /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-muted/30 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        User
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    {u.has_subscription ? (
                      <span className="inline-flex items-center gap-1 text-emerald-500">
                        <CheckCircle2 className="h-3 w-3" /> Assinatura ativa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <XCircle className="h-3 w-3" /> Sem assinatura
                      </span>
                    )}
                  </div>
                  {!u.is_superadmin && (
                    <div className="pt-1">
                      {u.is_admin ? (
                        <button
                          onClick={() => revoke(u.user_id)}
                          disabled={busyId === u.user_id}
                          className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive disabled:opacity-50"
                        >
                          {busyId === u.user_id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ShieldOff className="h-3.5 w-3.5" />
                          )}
                          Revogar admin
                        </button>
                      ) : (
                        <button
                          onClick={() => grant(u.user_id)}
                          disabled={busyId === u.user_id}
                          className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-glow disabled:opacity-50"
                        >
                          {busyId === u.user_id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ShieldCheck className="h-3.5 w-3.5" />
                          )}
                          Aprovar como admin
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default AdminUsers;

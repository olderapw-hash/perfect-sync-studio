import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  ShieldCheck,
  ShieldOff,
  Crown,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trash2,
  CreditCard,
  ServerCog,
  MoreVertical,
  FlaskConical,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlanDialog } from "@/components/admin/users/UserPlanDialog";
import { UserServersDialog } from "@/components/admin/users/UserServersDialog";
import { UserDeleteDialog } from "@/components/admin/users/UserDeleteDialog";
import { TestUserCreateDialog } from "@/components/admin/users/TestUserCreateDialog";


interface AdminUserRow {
  user_id: string;
  email: string;
  created_at: string;
  is_admin: boolean;
  is_superadmin: boolean;
  has_subscription: boolean;
  tenant_server_name: string | null;
  onboarding_completed: boolean;
  current_plan: string;
  plan_expires_at: string | null;
  tenants_count: number;
}

type DialogState =
  | { kind: "plan"; row: AdminUserRow }
  | { kind: "servers"; row: AdminUserRow }
  | { kind: "delete"; row: AdminUserRow }
  | null;

const PLAN_BADGE: Record<string, string> = {
  free: "bg-muted/40 text-muted-foreground",
  trial: "bg-amber-500/15 text-amber-400",
  pro: "bg-primary/15 text-primary",
  ultimate: "bg-fuchsia-500/15 text-fuchsia-400",
};

const AdminUsers = () => {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);


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

  const planLabel = (row: AdminUserRow) => {
    const cls = PLAN_BADGE[row.current_plan] ?? PLAN_BADGE.free;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`}
      >
        {row.current_plan}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-hero p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
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
                Acesso restrito ao superadmin · Plano, servidores e permissões
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTestDialogOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:brightness-110"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              Criar usuário teste
            </button>
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs hover:border-primary/50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>

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
                    <th className="px-4 py-3 font-semibold">Servidores</th>
                    <th className="px-4 py-3 font-semibold">Plano</th>
                    <th className="px-4 py-3 font-semibold">Acesso</th>
                    <th className="px-4 py-3 text-right font-semibold">Ações</th>
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
                        {u.tenants_count > 0 ? (
                          <button
                            onClick={() => setDialog({ kind: "servers", row: u })}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-card/40 px-2 py-1 text-[11px] hover:border-primary/40"
                          >
                            <ServerCog className="h-3 w-3" />
                            {u.tenants_count} servidor{u.tenants_count > 1 ? "es" : ""}
                          </button>
                        ) : (
                          <span className="text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {planLabel(u)}
                          {u.plan_expires_at && (
                            <span className="text-[10px] text-muted-foreground">
                              até {new Date(u.plan_expires_at).toLocaleDateString()}
                            </span>
                          )}
                          {u.has_subscription ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500">
                              <CheckCircle2 className="h-2.5 w-2.5" /> ativa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                              <XCircle className="h-2.5 w-2.5" /> sem cobrança
                            </span>
                          )}
                        </div>
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
                        <div className="inline-flex items-center gap-1">
                          {!u.is_superadmin && (
                            <>
                              <button
                                onClick={() => setDialog({ kind: "plan", row: u })}
                                title="Alterar plano"
                                className="rounded-md border border-border bg-card/40 p-1.5 text-muted-foreground hover:border-primary/40 hover:text-primary"
                              >
                                <CreditCard className="h-3.5 w-3.5" />
                              </button>
                              {u.is_admin ? (
                                <button
                                  onClick={() => revoke(u.user_id)}
                                  disabled={busyId === u.user_id}
                                  title="Revogar admin"
                                  className="rounded-md border border-destructive/40 bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20 disabled:opacity-50"
                                >
                                  {busyId === u.user_id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <ShieldOff className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => grant(u.user_id)}
                                  disabled={busyId === u.user_id}
                                  title="Promover a admin"
                                  className="rounded-md bg-primary/90 p-1.5 text-primary-foreground hover:bg-primary disabled:opacity-50"
                                >
                                  {busyId === u.user_id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => setDialog({ kind: "delete", row: u })}
                                title="Excluir usuário"
                                className="rounded-md border border-destructive/40 bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          {u.is_superadmin && <span className="text-[11px] text-muted-foreground">—</span>}
                        </div>
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
                        {new Date(u.created_at).toLocaleDateString()} · {u.tenants_count} servidor(es)
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
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    {planLabel(u)}
                    {u.plan_expires_at && (
                      <span className="text-[10px] text-muted-foreground">
                        até {new Date(u.plan_expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {!u.is_superadmin && (
                    <div className="relative pt-1">
                      <button
                        onClick={() => setOpenMenu(openMenu === u.user_id ? null : u.user_id)}
                        className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-border bg-card/40 px-3 py-2 text-xs font-semibold text-muted-foreground"
                      >
                        <MoreVertical className="h-3.5 w-3.5" /> Ações
                      </button>
                      {openMenu === u.user_id && (
                        <div className="absolute right-0 z-10 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
                          <button
                            onClick={() => {
                              setOpenMenu(null);
                              setDialog({ kind: "plan", row: u });
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted/30"
                          >
                            <CreditCard className="h-3.5 w-3.5" /> Alterar plano
                          </button>
                          {u.tenants_count > 0 && (
                            <button
                              onClick={() => {
                                setOpenMenu(null);
                                setDialog({ kind: "servers", row: u });
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted/30"
                            >
                              <ServerCog className="h-3.5 w-3.5" /> Gerenciar servidores
                            </button>
                          )}
                          {u.is_admin ? (
                            <button
                              onClick={() => {
                                setOpenMenu(null);
                                revoke(u.user_id);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-destructive hover:bg-destructive/10"
                            >
                              <ShieldOff className="h-3.5 w-3.5" /> Revogar admin
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setOpenMenu(null);
                                grant(u.user_id);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-primary hover:bg-primary/10"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" /> Promover a admin
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setOpenMenu(null);
                              setDialog({ kind: "delete", row: u });
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Excluir usuário
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {dialog?.kind === "plan" && (
        <UserPlanDialog
          userId={dialog.row.user_id}
          email={dialog.row.email}
          currentPlan={dialog.row.current_plan}
          onClose={() => setDialog(null)}
          onSaved={load}
        />
      )}
      {dialog?.kind === "servers" && (
        <UserServersDialog
          userId={dialog.row.user_id}
          email={dialog.row.email}
          onClose={() => setDialog(null)}
          onChanged={load}
        />
      )}
      {dialog?.kind === "delete" && (
        <UserDeleteDialog
          userId={dialog.row.user_id}
          email={dialog.row.email}
          onClose={() => setDialog(null)}
          onDeleted={load}
        />
      )}
      {testDialogOpen && (
        <TestUserCreateDialog
          onClose={() => setTestDialogOpen(false)}
          onCreated={load}
        />
      )}
    </main>
  );
};

export default AdminUsers;

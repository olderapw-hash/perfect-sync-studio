// Página /members — gerencia membros e convites do servidor ATIVO.
// Exige permissão `manage_members` (owner sempre tem).
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Crown,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserMinus,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { useServerPermissions, type ServerRole } from "@/hooks/useServerPermissions";
import { useServerMembers, type ServerMember } from "@/hooks/useServerMembers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<ServerRole, string> = {
  owner: "Dono",
  admin: "Admin",
  editor: "Editor",
  readonly: "Somente leitura",
};

const ROLE_BADGE: Record<ServerRole, string> = {
  owner: "bg-amber-500/15 text-amber-500",
  admin: "bg-primary/15 text-primary",
  editor: "bg-emerald-500/15 text-emerald-500",
  readonly: "bg-muted text-muted-foreground",
};

const Members = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { active, loading: serversLoading } = useServers();
  const { can, loading: permsLoading, role: myRole } = useServerPermissions();
  const tenantId = active?.id ?? null;
  const { members, invites, loading, refetch } = useServerMembers(tenantId);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<ServerMember | null>(null);

  useEffect(() => {
    if (!authLoading && !session) navigate("/auth", { replace: true });
  }, [authLoading, session, navigate]);

  // Após carregar permissões, se não tiver manage_members, manda de volta.
  useEffect(() => {
    if (permsLoading || serversLoading) return;
    if (!tenantId) return;
    if (!can("manage_members")) {
      toast.error("Você não tem permissão para gerenciar membros deste servidor.");
      navigate("/admin", { replace: true });
    }
  }, [permsLoading, serversLoading, tenantId, can, navigate]);

  const removeMember = async (m: ServerMember) => {
    if (m.role === "owner") {
      toast.error("Não é possível remover o dono do servidor.");
      return;
    }
    const { error } = await supabase.from("server_members").delete().eq("id", m.id);
    if (error) {
      toast.error("Erro ao remover: " + error.message);
      return;
    }
    toast.success("Membro removido");
    refetch();
  };

  const revokeInvite = async (id: string) => {
    const { error } = await supabase
      .from("server_invites")
      .update({ status: "revoked" })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao revogar: " + error.message);
      return;
    }
    toast.success("Convite revogado");
    refetch();
  };

  const updateMemberRole = async (m: ServerMember, newRole: ServerRole) => {
    if (m.role === "owner") {
      toast.error("Papel do dono não pode ser alterado por aqui.");
      return;
    }
    if (newRole === "owner") {
      toast.error("Transferência de ownership não está disponível ainda.");
      return;
    }
    // Pega defaults do novo role via uma query SQL embutida não dá — chamamos
    // via .rpc ou recalculamos no client espelhando a função SQL. Para evitar
    // duplicar, atualizamos só o role e deixamos as permissions herdadas;
    // mas pra UX ficar previsível, regravamos o jsonb com os defaults.
    const defaults = await supabase.rpc("default_permissions_for_role" as never, {
      _role: newRole,
    } as never);
    const newPerms = (defaults.data as object | null) ?? m.permissions;
    const { error } = await supabase
      .from("server_members")
      .update({ role: newRole, permissions: newPerms })
      .eq("id", m.id);
    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
      return;
    }
    toast.success("Papel atualizado");
    refetch();
  };

  if (authLoading || serversLoading || permsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-sm text-muted-foreground">
        Nenhum servidor ativo. Cadastre/ative um servidor primeiro.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/30">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold uppercase tracking-wider">
                Membros · {active?.server_name}
              </h1>
              <p className="text-xs text-muted-foreground">
                Quem pode fazer o quê neste servidor
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" /> Atualizar
            </Button>
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Convidar
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* ===== Membros ===== */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Membros ({members.length})
          </h2>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : members.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-card/30 p-8 text-center text-sm text-muted-foreground">
              Nenhum membro ainda. Você é o dono — convide alguém para colaborar.
            </p>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/40 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-xs">{m.user_id}</p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          ROLE_BADGE[m.role],
                        )}
                      >
                        {m.role === "owner" && <Crown className="h-3 w-3" />}
                        {ROLE_LABEL[m.role]}
                      </span>
                      {m.user_id === session?.user.id && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">
                          você
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Desde {new Date(m.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.role !== "owner" && (
                      <>
                        <Select
                          value={m.role}
                          onValueChange={(v) => updateMemberRole(m, v as ServerRole)}
                        >
                          <SelectTrigger className="h-8 w-[140px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="readonly">Somente leitura</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setConfirmRemove(m)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===== Convites ===== */}
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Convites pendentes ({invites.length})
          </h2>
          {invites.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-card/30 p-6 text-center text-xs text-muted-foreground">
              Nenhum convite pendente.
            </p>
          ) : (
            <div className="space-y-2">
              {invites.map((inv) => {
                const expired = new Date(inv.expires_at) < new Date();
                return (
                  <div
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/40 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-mono text-xs">{inv.email}</span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            ROLE_BADGE[inv.role],
                          )}
                        >
                          {ROLE_LABEL[inv.role]}
                        </span>
                        {expired && (
                          <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
                            expirado
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Enviado em {new Date(inv.invited_at).toLocaleString()} · expira em{" "}
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => revokeInvite(inv.id)}
                    >
                      <XCircle className="mr-2 h-3.5 w-3.5" /> Revogar
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {myRole && (
          <p className="mt-8 flex items-center gap-2 rounded-md border border-border bg-card/30 p-3 text-[11px] text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            Seu papel neste servidor: <strong className="text-foreground">{ROLE_LABEL[myRole]}</strong>.
            Para ver/alterar permissões granulares de um membro, edite o role acima — os defaults do
            papel serão aplicados.
          </p>
        )}
      </main>

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        tenantId={tenantId}
        onCreated={refetch}
      />

      <AlertDialog open={confirmRemove != null} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover este membro?</AlertDialogTitle>
            <AlertDialogDescription>
              Ele perde acesso imediato a este servidor. Pode ser convidado novamente depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmRemove) removeMember(confirmRemove);
                setConfirmRemove(null);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const InviteDialog = ({
  open,
  onOpenChange,
  tenantId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tenantId: string;
  onCreated: () => void;
}) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ServerRole>("editor");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail("");
      setRole("editor");
    }
  }, [open]);

  const submit = async () => {
    if (!email.trim()) {
      toast.error("Informe um e-mail");
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc("create_server_invite" as never, {
      _tenant_id: tenantId,
      _email: email.trim(),
      _role: role,
    } as never);
    setSaving(false);
    if (error) {
      toast.error("Erro ao convidar: " + error.message);
      return;
    }
    toast.success(`Convite enviado para ${email}`);
    onCreated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar membro</DialogTitle>
          <DialogDescription>
            O convidado precisa ter conta no app. Quando logar, verá o convite e poderá aceitar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="inv-email">E-mail</Label>
            <Input
              id="inv-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@dominio.com"
            />
          </div>
          <div>
            <Label htmlFor="inv-role">Papel</Label>
            <Select value={role} onValueChange={(v) => setRole(v as ServerRole)}>
              <SelectTrigger id="inv-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  Admin — quase tudo, exceto gerenciar servidores/membros
                </SelectItem>
                <SelectItem value="editor">
                  Editor — edita templates, sem mexer em personagens reais
                </SelectItem>
                <SelectItem value="readonly">
                  Somente leitura — só visualiza
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enviar convite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Members;

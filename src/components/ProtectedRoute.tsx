import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Loader2, Mail, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useTenant } from "@/hooks/useTenant";
import { useMyPendingInvites } from "@/hooks/useServerMembers";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
  /** Also require an active paid subscription + completed onboarding */
  requireSubscription?: boolean;
}

export const ProtectedRoute = ({
  children,
  requireAdmin = true,
  requireSubscription = false,
}: Props) => {
  const { session, isAdmin, isSuperadmin, loading, signOut } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();
  const { tenant, loading: tenantLoading } = useTenant();
  const { invites: pendingInvites } = useMyPendingInvites();

  // Membros de servidor (owner OU convidado aceito) também podem entrar no /admin,
  // mesmo sem role admin global.
  const [isServerMember, setIsServerMember] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!session?.user) {
      setIsServerMember(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("server_members")
        .select("id")
        .eq("user_id", session.user.id)
        .limit(1);
      if (cancelled) return;
      setIsServerMember(!error && (data?.length ?? 0) > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  if (loading || (requireSubscription && (subLoading || tenantLoading)) || (requireAdmin && isServerMember === null && !!session)) {
    return (
      <div className="flex h-screen items-center justify-center bg-hero">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Acesso ao painel: admin global OU membro de algum servidor (convidado aceito).
  const canEnterAdmin = isAdmin || isServerMember === true;
  if (requireAdmin && !canEnterAdmin) {
    const hasPending = pendingInvites.length > 0;
    return (
      <div className="flex h-screen items-center justify-center bg-hero p-4">
        <div className="max-w-sm rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center">
          <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h2 className="text-lg font-extrabold text-foreground">Acesso negado</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Sua conta não tem permissão de administrador para acessar o painel.
          </p>
          {hasPending && (
            <div className="mt-4 rounded-md border border-primary/40 bg-primary/10 p-3 text-left text-xs">
              <Mail className="mb-1 inline h-3.5 w-3.5 text-primary" /> Você tem{" "}
              <strong>{pendingInvites.length}</strong> convite
              {pendingInvites.length > 1 ? "s" : ""} pendente
              {pendingInvites.length > 1 ? "s" : ""}. Aceite para virar membro de um
              servidor.
            </div>
          )}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {hasPending && (
              <Link
                to="/invites"
                className="rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
              >
                Ver convites
              </Link>
            )}
            <Link
              to="/servers"
              className="rounded-md border border-border bg-card/60 px-4 py-2 text-xs hover:border-primary/50"
            >
              Meus servidores
            </Link>
            <button
              onClick={signOut}
              className="rounded-md border border-border bg-card/60 px-4 py-2 text-xs hover:border-primary/50"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Subscription gate. Superadmin AND manually-approved admins bypass —
  // the superadmin uses the user-management screen to grant comp access
  // without forcing the user through Paddle checkout.
  if (requireSubscription && !isSuperadmin && !isAdmin) {
    if (!isActive) {
      return <Navigate to="/pricing" replace />;
    }
    if (!tenant?.onboarding_completed) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  // Even bypass users still need onboarding done so the panel has a tenant
  // to work against. Only enforce when they don't have a completed tenant.
  if (requireSubscription && (isAdmin || isSuperadmin) && !isSuperadmin) {
    if (!tenant?.onboarding_completed) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
};

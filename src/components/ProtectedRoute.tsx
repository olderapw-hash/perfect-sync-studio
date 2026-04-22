import { Navigate } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useTenant } from "@/hooks/useTenant";

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

  if (loading || (requireSubscription && (subLoading || tenantLoading))) {
    return (
      <div className="flex h-screen items-center justify-center bg-hero">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-hero p-4">
        <div className="max-w-sm rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center">
          <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h2 className="text-lg font-extrabold text-foreground">Acesso negado</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Sua conta não tem permissão de administrador para acessar o painel.
          </p>
          <button
            onClick={signOut}
            className="mt-4 rounded-md border border-border bg-card/60 px-4 py-2 text-xs hover:border-primary/50"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  // Subscription gate (superadmin bypasses — that's you, the SaaS owner)
  if (requireSubscription && !isSuperadmin) {
    if (!isActive) {
      return <Navigate to="/pricing" replace />;
    }
    if (!tenant?.onboarding_completed) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
};

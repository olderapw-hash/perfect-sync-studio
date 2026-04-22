import { Navigate } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const SuperadminRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isSuperadmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-hero">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;

  if (!isSuperadmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-hero p-4">
        <div className="max-w-sm rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center">
          <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h2 className="text-lg font-extrabold text-foreground">Acesso restrito</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Esta área é exclusiva do superadministrador da plataforma.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

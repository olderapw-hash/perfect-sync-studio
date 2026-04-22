import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isSuperadmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  isAdmin: false,
  isSuperadmin: false,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) Listener PRIMEIRO (evita race com getSession)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        // Defer chamada Supabase para não travar o callback
        setTimeout(() => checkRoles(newSession.user.id), 0);
      } else {
        setIsAdmin(false);
        setIsSuperadmin(false);
      }
    });

    // 2) Sessão atual
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        checkRoles(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const checkRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (error) {
      console.error("[auth] checkRoles error", error);
      setIsAdmin(false);
      setIsSuperadmin(false);
      return;
    }
    const roles = (data ?? []).map((r) => r.role);
    const superadmin = roles.includes("superadmin" as never);
    setIsSuperadmin(superadmin);
    // Superadmin implica admin
    setIsAdmin(superadmin || roles.includes("admin" as never));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
    setIsSuperadmin(false);
  };

  return (
    <Ctx.Provider
      value={{ session, user: session?.user ?? null, isAdmin, isSuperadmin, loading, signOut }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);

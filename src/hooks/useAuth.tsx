import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { warnSessionExpired } from "@/lib/authErrors";

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

  const hadSessionRef = useRef(false);

  const clearAuthState = () => {
    setSession(null);
    setIsAdmin(false);
    setIsSuperadmin(false);
    hadSessionRef.current = false;
  };

  const validateSession = async (candidate: Session, warnOnFailure = false) => {
    const { data, error } = await supabase.auth.getUser(candidate.access_token);
    if (error || !data.user) {
      console.warn("[auth] invalid cached session", error);
      clearAuthState();
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
      if (warnOnFailure) warnSessionExpired();
      return false;
    }

    setSession(candidate);
    hadSessionRef.current = true;
    await checkRoles(data.user.id);
    return true;
  };

  useEffect(() => {
    // 1) Listener PRIMEIRO (evita race com getSession)
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (newSession?.user) {
        // Defer chamada Supabase para não travar o callback.
        setTimeout(() => {
          void validateSession(newSession, false);
        }, 0);
      } else {
        // Se o usuário tinha sessão e agora não tem (token expirou / refresh falhou),
        // avisa explicitamente em vez de redirecionar silenciosamente.
        if (hadSessionRef.current && (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED")) {
          warnSessionExpired();
        }
        clearAuthState();
      }
    });

    // 2) Sessão atual — sempre destrava `loading`, mesmo em erro
    // (ex.: refresh_token_not_found após token expirar)
    supabase.auth
      .getSession()
      .then(async ({ data: { session: s } }) => {
        if (s?.user) {
          await validateSession(s, true);
        } else {
          clearAuthState();
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("[auth] getSession failed", err);
        clearAuthState();
        setLoading(false);
      });

    // Safety net: se nada destravou loading em 5s, libera mesmo assim
    // para a UI poder pelo menos redirecionar para /auth.
    const safety = setTimeout(() => {
      setLoading((prev) => {
        if (prev) console.warn("[auth] safety timeout — forcing loading=false");
        return false;
      });
    }, 5000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(safety);
    };
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
    clearAuthState();
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

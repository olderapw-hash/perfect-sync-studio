// Helpers para detectar e avisar o usuário quando a sessão (JWT) expira.
// Edge functions retornam 401 com bodies como `{"success":false,"error":"Unauthorized"}`
// ou `Unauthorized: token inválido ou expirado`. Usamos um toast com ação
// de "Fazer login" pra não deixar o usuário batendo cabeça.
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AUTH_HINTS = [
  "unauthorized",
  "missing bearer token",
  "token inválido",
  "token invalido",
  "sessão expirou",
  "sessao expirou",
  "jwt expired",
  "session_not_found",
];

export function isAuthError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes("edge function returned 401")) return true;
  return AUTH_HINTS.some((h) => msg.includes(h));
}

let lastWarnAt = 0;
/** Mostra um toast (com debounce de 5s) pedindo pro usuário relogar. */
export function warnSessionExpired(detail?: string) {
  const now = Date.now();
  if (now - lastWarnAt < 5000) return;
  lastWarnAt = now;
  toast.error("Sessão expirada", {
    description:
      detail ?? "Seu login expirou. Faça login novamente para continuar.",
    duration: 10000,
    action: {
      label: "Fazer login",
      onClick: async () => {
        try {
          await supabase.auth.signOut();
        } catch {
          /* ignore */
        }
        window.location.href = "/auth";
      },
    },
  });
}

/** Se o erro for de auth, dispara o aviso e devolve true. */
export function handleMaybeAuthError(err: unknown): boolean {
  if (!isAuthError(err)) return false;
  warnSessionExpired();
  return true;
}

const FORBIDDEN_HINTS = [
  "permissão negada",
  "permissao negada",
  "permission denied",
  "forbidden",
  "edge function returned 403",
  "403",
];

/** Detecta se o erro é 403/permissão negada. */
export function isForbiddenError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return FORBIDDEN_HINTS.some((h) => msg.includes(h));
}

let lastForbiddenAt = 0;
/** Toast amigável para 403 (com debounce de 4s para evitar spam). */
export function warnForbidden(detail?: string) {
  const now = Date.now();
  if (now - lastForbiddenAt < 4000) return;
  lastForbiddenAt = now;
  toast.error("Acesso negado", {
    description:
      detail ??
      "Seu usuário não tem permissão para esta ação. Peça ao dono do servidor para ajustar suas permissões.",
    duration: 8000,
  });
}

/** Se o erro for 403/permissão, dispara o aviso e devolve true. */
export function handleMaybeForbiddenError(err: unknown, detail?: string): boolean {
  if (!isForbiddenError(err)) return false;
  warnForbidden(detail);
  return true;
}

/** Atalho: trata auth (401) ou permissão (403). Retorna true se já tratou. */
export function handleMaybeAuthOrForbidden(err: unknown, forbiddenDetail?: string): boolean {
  if (handleMaybeAuthError(err)) return true;
  if (handleMaybeForbiddenError(err, forbiddenDetail)) return true;
  return false;
}

/** Erro lançado quando nenhum servidor está ativo/selecionado. */
export class NoServerSelectedError extends Error {
  constructor() {
    super("Nenhum servidor selecionado. Cadastre/ative um servidor antes.");
    this.name = "NoServerSelectedError";
  }
}

import { useState } from "react";
import { AlertTriangle, Loader2, UserCog, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pwApi, EndpointMissingError } from "@/lib/pwApiActions";
import { normalizeClsconfigResponse } from "@/lib/clsconfig";
import type { ClsEntry } from "@/types/clsconfig";
import { ClsconfigEditor } from "./ClsconfigEditor";
import { toast } from "sonner";

/**
 * Aba "Personagem Real / Existente".
 *
 * Fluxo:
 *  1. Usuário digita o roleid e clica "Carregar".
 *  2. Chamamos `pwApi.getRoleEditable(roleid)` — endpoint dedicado, NÃO
 *     reutiliza o catálogo CLS (não é uma entry de template).
 *  3. A resposta é normalizada para o mesmo shape de uma `ClsEntry`, o
 *     que nos permite reusar o `ClsconfigEditor` em modo `role`.
 *  4. O save dentro do editor vai por `saveRoleEditable` (não
 *     `saveClsconfigTemplate`), com confirmação forte e sem
 *     `exportclsconfig` por padrão (toggle avançado disponível).
 *
 * NÃO aplicamos a restrição `clsconfig_template_roleids` aqui — qualquer
 * roleid real é válido (a VPS é quem decide se existe / está online).
 */
export const RolePersonagemTab = () => {
  const [roleidStr, setRoleidStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<ClsEntry | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = async () => {
    const roleid = Number(roleidStr);
    if (!Number.isFinite(roleid) || roleid <= 0) {
      toast.error("Informe um roleid válido (> 0)");
      return;
    }

    setLoading(true);
    setError(null);
    setEntry(null);
    setOnline(null);

    try {
      const res = await pwApi.getRoleEditable(roleid);
      if (!res?.success) {
        throw new Error(res?.error || "Falha ao carregar personagem");
      }
      setOnline(res.online === true);

      // Aceita tanto `template` (preferido) quanto `role` (wrapper opcional).
      const rawTemplate = res.template ?? (res as unknown as { role?: unknown }).role;
      if (!rawTemplate || typeof rawTemplate !== "object") {
        throw new Error("Resposta sem `template`");
      }

      // Reusa o normalizador do clsconfig embrulhando como uma entry única.
      const normalized = normalizeClsconfigResponse({
        success: true,
        entries: [
          {
            source: "role",
            key_hex: `role-${roleid}`,
            version: 1,
            template: rawTemplate,
          },
        ],
      });
      const fresh = normalized.entries[0];
      if (!fresh) {
        throw new Error("Não foi possível normalizar o template do personagem");
      }
      // Garante que o roleid REAL prevaleça sobre qualquer fallback do mapa CLS.
      fresh.template.roleid = roleid;

      setEntry(fresh);
      toast.success(
        `Personagem ${roleid} carregado${res.online ? " (ATENÇÃO: ONLINE)" : ""}`,
      );
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        setError(
          "Endpoint getRoleEditable ainda não implementado na VPS. Veja docs/api-contract.md.",
        );
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        // Detecta o erro específico de gamedbd offline e mostra orientação clara
        // em vez do stack puro vindo do PHP.
        if (/gamedbd/i.test(msg) && /(connection refused|recusad)/i.test(msg)) {
          setError(
            "O serviço gamedbd (porta 29400) não está acessível no servidor de jogo. " +
              "Isso é uma falha do lado da VPS, não do painel. Verifique se o gamedbd " +
              "está em execução e escutando em 127.0.0.1:29400, e depois tente novamente.",
          );
        } else {
          setError(msg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Aviso permanente — esta aba não edita templates CLS. */}
      <div className="rounded-xl border-2 border-destructive/60 bg-destructive/10 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="space-y-1 text-sm">
            <p className="font-bold uppercase tracking-wider text-destructive">
              Edição de personagem real
            </p>
            <p className="text-foreground">
              Esta aba <strong>não</strong> reutiliza a lista de templates CLS.
              Ela carrega o registro real de um personagem já existente no{" "}
              <code className="font-mono">gamedbd</code> via{" "}
              <code className="font-mono">getRoleEditable</code> e salva via{" "}
              <code className="font-mono">saveRoleEditable</code>.
            </p>
            <p className="text-xs text-muted-foreground">
              Personagem deve estar offline. Se estiver online, o servidor pode
              sobrescrever as alterações no logout.
            </p>
          </div>
        </div>
      </div>

      {/* Carregar roleid */}
      <section className="rounded-xl border border-border bg-card/40 p-4">
        <header className="mb-3 flex items-center gap-2">
          <UserCog className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Personagem alvo
          </h3>
        </header>
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="roleid-real">Roleid real</Label>
            <Input
              id="roleid-real"
              type="number"
              min={1}
              value={roleidStr}
              onChange={(e) => setRoleidStr(e.target.value)}
              placeholder="ex.: 1024"
              className="w-48 font-mono"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleLoad();
              }}
            />
          </div>
          <Button onClick={handleLoad} disabled={loading || !roleidStr}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {loading ? "Carregando..." : "Carregar"}
          </Button>
          {entry && (
            <span className="text-xs text-muted-foreground">
              Carregado:{" "}
              <span className="font-mono text-foreground">
                roleid {entry.template.roleid}
              </span>{" "}
              · {entry.template.summary.name || "(sem nome)"}
            </span>
          )}
          {online && (
            <span className="rounded-full bg-destructive/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-destructive">
              ONLINE — kick antes de salvar
            </span>
          )}
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}
      </section>

      {/* Editor reutilizado em modo "role" */}
      {entry && (
        <div className="overflow-hidden rounded-xl border border-border bg-card/30">
          {/* O editor preenche toda a área disponível. */}
          <div className="h-[calc(100vh-22rem)] min-h-[480px]">
            <ClsconfigEditor
              entry={entry}
              mode="role"
              onSaved={(next) => {
                // Mantém a referência atualizada após o save bem-sucedido.
                setEntry({ ...entry, template: next });
                setOnline(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

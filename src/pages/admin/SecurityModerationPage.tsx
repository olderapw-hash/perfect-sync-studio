// /admin/security/moderation — Kick / Ban / Unban v1.
//
// Fluxo:
//   1. usuário busca por roleid (e opcionalmente account)
//   2. escolhe a ação (Kick · Ban temporário · Ban permanente · Unban)
//   3. preenche motivo obrigatório + duração (quando ban temporário)
//   4. confirma o impacto via AlertDialog forte
//   5. executa via pwApi e registra em audit_logs (sucesso ou erro)
//
// Gating: manage_security. Servidor ativo obrigatório.
// Endpoints novos da VPS — quando ausentes, exibimos a notice padrão.
import { useState } from "react";
import {
  AlertCircle,
  Clock,
  Hammer,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import {
  EndpointMissingError,
  pwApi,
  type SecurityActionResponse,
} from "@/lib/pwApiActions";
import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { logAuditEvent } from "@/lib/auditLog";
import { EndpointMissingNotice } from "@/components/admin/EndpointMissingNotice";
import { cn } from "@/lib/utils";

type ActionKind = "kick" | "ban_temp" | "ban_perm" | "unban";

interface ActionConfig {
  kind: ActionKind;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  perm: "manage_security";
  cta: string;
  /** "destructive" = vermelho forte; "warning" = amber; "neutral" = primário. */
  tone: "destructive" | "warning" | "neutral";
  needsDuration?: boolean;
}

const ACTIONS: ActionConfig[] = [
  {
    kind: "kick",
    title: "Kick",
    desc: "Desconecta o personagem agora. Não bane — pode reconectar imediatamente.",
    icon: UserX,
    perm: "manage_security",
    cta: "Kickar agora",
    tone: "warning",
  },
  {
    kind: "ban_temp",
    title: "Ban temporário",
    desc: "Bane a conta por um período definido. A conta volta automaticamente ao expirar.",
    icon: Clock,
    perm: "manage_security",
    cta: "Banir temporariamente",
    tone: "destructive",
    needsDuration: true,
  },
  {
    kind: "ban_perm",
    title: "Ban permanente",
    desc: "Bane a conta sem prazo. Só sai com unban manual.",
    icon: Hammer,
    perm: "manage_security",
    cta: "Banir permanentemente",
    tone: "destructive",
  },
  {
    kind: "unban",
    title: "Desbanir",
    desc: "Remove o ban da conta e libera login imediatamente.",
    icon: ShieldCheck,
    perm: "manage_security",
    cta: "Desbanir conta",
    tone: "neutral",
  },
];

const SecurityModerationPage = () => {
  const { isSuperadmin } = useAuth();
  const { active } = useServers();
  const { can, loading: permLoading } = useServerPermissions();

  const [roleidStr, setRoleidStr] = useState("");
  const [account, setAccount] = useState("");
  const [pendingAction, setPendingAction] = useState<ActionConfig | null>(null);
  const [reason, setReason] = useState("");
  const [durationHours, setDurationHours] = useState<string>("24");
  const [submitting, setSubmitting] = useState(false);
  const [endpointMissing, setEndpointMissing] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    action: ActionKind;
    res: SecurityActionResponse;
  } | null>(null);

  const allowed = isSuperadmin || can("manage_security");

  if (!permLoading && !allowed) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/20 text-destructive">
            <ShieldOff className="h-6 w-6" />
          </div>
          <h2 className="text-base font-extrabold uppercase tracking-wider text-foreground">
            Sem permissão
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Você precisa da permissão <strong>manage_security</strong> neste
            servidor para usar moderação.
          </p>
        </div>
      </div>
    );
  }

  const roleid = parseInt(roleidStr.trim(), 10);
  const hasRoleid = Number.isFinite(roleid) && roleid > 0;
  const hasAccount = account.trim().length > 0;

  function openAction(a: ActionConfig) {
    if (a.kind === "kick" && !hasRoleid) {
      toast.error("Informe o roleid para kickar.");
      return;
    }
    if ((a.kind === "ban_temp" || a.kind === "ban_perm" || a.kind === "unban") && !hasAccount && !hasRoleid) {
      toast.error("Informe a conta (login/userid) ou um roleid.");
      return;
    }
    setReason("");
    setPendingAction(a);
  }

  async function execute() {
    if (!pendingAction) return;
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 3) {
      toast.error("Motivo é obrigatório (mínimo 3 caracteres).");
      return;
    }
    if (pendingAction.needsDuration) {
      const h = parseFloat(durationHours);
      if (!Number.isFinite(h) || h <= 0) {
        toast.error("Duração inválida. Informe horas > 0.");
        return;
      }
    }

    setSubmitting(true);
    setEndpointMissing(null);
    setLastResult(null);

    const payloadAccount = hasAccount ? account.trim() : undefined;
    const payloadRoleid = hasRoleid ? roleid : undefined;
    const auditTarget =
      payloadRoleid != null
        ? `roleid:${payloadRoleid}`
        : payloadAccount
          ? `account:${payloadAccount}`
          : "—";

    try {
      let res: SecurityActionResponse;
      switch (pendingAction.kind) {
        case "kick":
          res = await pwApi.kickRole({ roleid: payloadRoleid as number, reason: trimmedReason });
          break;
        case "ban_temp": {
          const seconds = Math.round(parseFloat(durationHours) * 3600);
          res = await pwApi.banAccount({
            account: payloadAccount,
            roleid: payloadRoleid,
            duration_seconds: seconds,
            reason: trimmedReason,
          });
          break;
        }
        case "ban_perm":
          res = await pwApi.banAccount({
            account: payloadAccount,
            roleid: payloadRoleid,
            reason: trimmedReason,
          });
          break;
        case "unban":
          res = await pwApi.unbanAccount({
            account: payloadAccount,
            roleid: payloadRoleid,
            reason: trimmedReason || undefined,
          });
          break;
      }
      setLastResult({ action: pendingAction.kind, res });
      toast.success(`${pendingAction.title} executado.`);
      void logAuditEvent({
        action: `security.${pendingAction.kind}`,
        tenantId: active?.id ?? null,
        target: auditTarget,
        status: "ok",
        metadata: {
          reason: trimmedReason,
          duration_hours: pendingAction.needsDuration ? parseFloat(durationHours) : undefined,
          response: res as unknown as Record<string, unknown>,
        },
      });
      setPendingAction(null);
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        setEndpointMissing(e.action);
        toast.error("Esta VPS ainda não implementa essa ação.");
      } else {
        toast.error(e instanceof Error ? e.message : String(e));
      }
      void logAuditEvent({
        action: `security.${pendingAction.kind}`,
        tenantId: active?.id ?? null,
        target: auditTarget,
        status: "error",
        error: e instanceof Error ? e.message : String(e),
        metadata: {
          reason: trimmedReason,
          duration_hours: pendingAction.needsDuration ? parseFloat(durationHours) : undefined,
        },
      });
      setPendingAction(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      {/* Busca / alvo */}
      <section className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-md">
        <div className="mb-3 flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
            Alvo
          </h2>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Informe ao menos um identificador. <strong>Kick</strong> requer
          roleid. <strong>Ban/Unban</strong> aceita conta (login) ou roleid —
          a VPS resolve a conta a partir do roleid quando possível.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="roleid" className="text-xs">
              Roleid
            </Label>
            <Input
              id="roleid"
              type="number"
              inputMode="numeric"
              placeholder="ex.: 31"
              value={roleidStr}
              onChange={(e) => setRoleidStr(e.target.value)}
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label htmlFor="account" className="text-xs">
              Conta (login)
            </Label>
            <Input
              id="account"
              placeholder="ex.: gm_alvo"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="mt-1 font-mono"
              maxLength={64}
            />
          </div>
        </div>
      </section>

      {endpointMissing && <EndpointMissingNotice action={endpointMissing} />}

      {/* Ações */}
      <section className="grid gap-3 md:grid-cols-2">
        {ACTIONS.map((a) => (
          <ActionCard key={a.kind} action={a} onClick={() => openAction(a)} />
        ))}
      </section>

      {lastResult && <LastResultPanel data={lastResult} />}

      {/* Confirmação forte */}
      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && !submitting && setPendingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert
                className={cn(
                  "h-5 w-5",
                  pendingAction?.tone === "destructive" && "text-destructive",
                  pendingAction?.tone === "warning" && "text-amber-500",
                  pendingAction?.tone === "neutral" && "text-primary",
                )}
              />
              Confirmar: {pendingAction?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-xs">
              <span className="block">
                Alvo:{" "}
                <span className="font-mono text-foreground">
                  {hasRoleid && `roleid ${roleid}`}
                  {hasRoleid && hasAccount && " · "}
                  {hasAccount && `conta ${account.trim()}`}
                </span>
              </span>
              {pendingAction?.tone === "destructive" && (
                <span className="block text-destructive">
                  Esta ação afeta o jogador imediatamente. Confirme com cuidado.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-2">
            {pendingAction?.needsDuration && (
              <div>
                <Label htmlFor="duration" className="text-xs">
                  Duração (horas) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="mt-1 font-mono"
                />
              </div>
            )}
            <div>
              <Label htmlFor="reason" className="text-xs">
                Motivo <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ex.: exploit no NPC X, cliente modificado, etc."
                maxLength={500}
                className="mt-1"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Obrigatório · mínimo 3 caracteres · gravado na auditoria.
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void execute();
              }}
              disabled={submitting}
              className={cn(
                pendingAction?.tone === "destructive" &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                pendingAction?.tone === "warning" &&
                  "bg-amber-500 text-white hover:bg-amber-600",
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  Executando...
                </>
              ) : (
                pendingAction?.cta
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SecurityModerationPage;

/* -------------------------------------------------------------------------- */
/* Componentes internos                                                       */
/* -------------------------------------------------------------------------- */

function ActionCard({ action, onClick }: { action: ActionConfig; onClick: () => void }) {
  const Icon = action.icon;
  const toneBg =
    action.tone === "destructive"
      ? "border-destructive/40 bg-destructive/5 hover:bg-destructive/10"
      : action.tone === "warning"
        ? "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10"
        : "border-primary/40 bg-primary/5 hover:bg-primary/10";
  const iconColor =
    action.tone === "destructive"
      ? "text-destructive"
      : action.tone === "warning"
        ? "text-amber-500"
        : "text-primary";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col gap-3 rounded-xl border p-4 text-left transition-smooth",
        toneBg,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("h-5 w-5", iconColor)} />
        <h3 className="text-sm font-bold text-foreground">{action.title}</h3>
      </div>
      <p className="text-[11px] text-muted-foreground">{action.desc}</p>
      <span
        className={cn(
          "mt-auto inline-flex w-fit items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-smooth",
          action.tone === "destructive"
            ? "border-destructive/40 bg-destructive/10 text-destructive group-hover:bg-destructive/20"
            : action.tone === "warning"
              ? "border-amber-500/40 bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20"
              : "border-primary/40 bg-primary/10 text-primary group-hover:bg-primary/20",
        )}
      >
        {action.cta}
      </span>
    </button>
  );
}

function LastResultPanel({
  data,
}: {
  data: { action: ActionKind; res: SecurityActionResponse };
}) {
  const { action, res } = data;
  const ok = res.success !== false;
  return (
    <section
      className={cn(
        "rounded-xl border p-4",
        ok
          ? "border-success/40 bg-success/10 text-success"
          : "border-destructive/40 bg-destructive/10 text-destructive",
      )}
    >
      <div className="flex items-start gap-2">
        {ok ? (
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        )}
        <div className="text-xs">
          <p className="font-bold uppercase tracking-wider">
            Resultado · {action}
          </p>
          <pre className="mt-2 max-h-48 overflow-auto rounded-md border border-border/30 bg-background/40 p-2 font-mono text-[10px] text-foreground/80">
            {JSON.stringify(res, null, 2)}
          </pre>
        </div>
      </div>
    </section>
  );
}

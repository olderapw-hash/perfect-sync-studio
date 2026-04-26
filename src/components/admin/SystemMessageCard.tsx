// Server Ops v2 — Send System Message.
// Card premium dentro de /admin/server/actions. Form de mensagem global,
// dry_run, prioridade/kind, confirmação forte, audit em sucesso/erro.
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Megaphone,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import {
  EndpointMissingError,
  pwApi,
  type SendSystemMessageResponse,
  type SystemMessageKind,
  type SystemMessagePriority,
} from "@/lib/pwApiActions";
import { logAuditEvent } from "@/lib/auditLog";
import { EndpointMissingNotice } from "@/pages/admin/ServerOpsPage";

const MAX_LEN = 200;

const KINDS: { value: SystemMessageKind; label: string; hint: string }[] = [
  { value: "system", label: "System", hint: "Aviso oficial do servidor" },
  { value: "broadcast", label: "Broadcast", hint: "Mensagem destacada para todos" },
  { value: "world", label: "World chat", hint: "Aparece no chat global" },
  { value: "tip", label: "Tip", hint: "Dica leve no rodapé" },
];

const PRIORITIES: { value: SystemMessagePriority; label: string }[] = [
  { value: "low", label: "Baixa" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
];

export function SystemMessageCard() {
  const { isSuperadmin } = useAuth();
  const { active } = useServers();
  const { can } = useServerPermissions();
  const canSend = isSuperadmin || can("save_templates");

  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<SystemMessageKind>("system");
  const [priority, setPriority] = useState<SystemMessagePriority>("normal");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SendSystemMessageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [endpointMissing, setEndpointMissing] = useState(false);

  const trimmed = message.trim();
  const len = trimmed.length;
  const tooShort = len < 1;
  const tooLong = len > MAX_LEN;
  const invalid = tooShort || tooLong;

  const run = async (dryRun: boolean) => {
    if (invalid) return;
    setLoading(true);
    setError(null);
    setEndpointMissing(false);
    try {
      const res = await pwApi.sendSystemMessage({
        message: trimmed,
        kind,
        priority,
        dry_run: dryRun,
      });
      setResult(res);
      if (dryRun) {
        toast.success("Validação OK (dry-run)", {
          description: "Payload aceito pela VPS — nenhum envio real foi feito.",
        });
      } else {
        toast.success(
          res.delivered ? "Mensagem enviada" : "Mensagem enfileirada",
          {
            description: res.delivered
              ? `Método: ${res.method ?? "—"}`
              : res.note ?? "Sem entrega imediata; ficou em queue na VPS.",
          },
        );
      }
      void logAuditEvent({
        action: dryRun
          ? "server_ops.system_message.dry_run"
          : "server_ops.system_message.send",
        tenantId: active?.id ?? null,
        target: "sendSystemMessage",
        status: "ok",
        metadata: {
          kind,
          priority,
          length: len,
          delivered: res.delivered ?? null,
          method: res.method ?? null,
        },
      });
    } catch (e) {
      const missing = e instanceof EndpointMissingError;
      setResult(null);
      if (missing) {
        setEndpointMissing(true);
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        toast.error("Falha ao enviar mensagem", { description: msg });
      }
      void logAuditEvent({
        action: dryRun
          ? "server_ops.system_message.dry_run"
          : "server_ops.system_message.send",
        tenantId: active?.id ?? null,
        target: "sendSystemMessage",
        status: "error",
        error: e instanceof Error ? e.message : String(e),
        metadata: { kind, priority, length: len },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-md">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
          <Megaphone className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
              <Sparkles className="h-3 w-3" />
              v2 · operação real
            </div>
            <h3 className="text-base font-bold text-foreground">
              Mensagem de sistema
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Envia uma mensagem global a todos os jogadores online via{" "}
              <code className="font-mono">gdeliveryd</code>. Use{" "}
              <strong>Validar</strong> antes para garantir que o endpoint está
              disponível na VPS.
            </p>
          </div>

          {!canSend && (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-500">
              <ShieldCheck className="h-3 w-3" />
              Requer permissão save_templates
            </span>
          )}

          {/* Form */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-3">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Mensagem
              </Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex.: Servidor reiniciará em 5 minutos. Salve seu progresso."
                rows={3}
                maxLength={MAX_LEN + 50}
                disabled={!canSend || loading}
                className="mt-1 font-medium"
              />
              <div className="mt-1 flex items-center justify-between text-[10px]">
                <span
                  className={
                    tooLong
                      ? "text-destructive"
                      : tooShort
                        ? "text-muted-foreground"
                        : "text-success"
                  }
                >
                  {len}/{MAX_LEN}
                </span>
                {tooLong && (
                  <span className="text-destructive">Acima do limite</span>
                )}
              </div>
            </div>

            <div>
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Tipo
              </Label>
              <Select
                value={kind}
                onValueChange={(v) => setKind(v as SystemMessageKind)}
                disabled={!canSend || loading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      <div className="flex flex-col">
                        <span className="font-semibold">{k.label}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {k.hint}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Prioridade
              </Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as SystemMessagePriority)}
                disabled={!canSend || loading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => run(true)}
                disabled={!canSend || loading || invalid}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5" />
                )}
                Validar
              </Button>
            </div>
          </div>

          {/* Confirm + send */}
          <div className="flex flex-wrap items-center gap-2">
            {canSend && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" disabled={loading || invalid}>
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Enviar agora
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Enviar esta mensagem para TODOS os jogadores?
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-2 text-xs">
                        <div className="rounded-md border border-border bg-background/40 p-3">
                          <p className="font-semibold text-foreground">
                            “{trimmed}”
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            tipo: <span className="font-mono">{kind}</span> ·
                            prioridade:{" "}
                            <span className="font-mono">{priority}</span> ·{" "}
                            {len} chars
                          </p>
                        </div>
                        <p>
                          A ação será registrada na auditoria e o gdeliveryd
                          entregará imediatamente — não há undo.
                        </p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => run(false)}>
                      Enviar agora
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {endpointMissing && (
            <EndpointMissingNotice action="sendSystemMessage" />
          )}

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
              {error}
            </div>
          )}

          {result && (
            <div
              className={
                "rounded-md border p-3 text-xs " +
                (result.delivered === false && !result.dry_run
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                  : "border-success/40 bg-success/10 text-success")
              }
            >
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {result.dry_run
                  ? "Validação OK"
                  : result.delivered
                    ? "Mensagem entregue"
                    : "Mensagem enfileirada"}
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                {result.method && (
                  <>
                    <dt className="text-muted-foreground">Método</dt>
                    <dd className="font-mono">{result.method}</dd>
                  </>
                )}
                {result.length != null && (
                  <>
                    <dt className="text-muted-foreground">Tamanho</dt>
                    <dd className="font-mono">{result.length} chars</dd>
                  </>
                )}
                {result.log_file && (
                  <>
                    <dt className="text-muted-foreground">Log</dt>
                    <dd className="break-all font-mono">{result.log_file}</dd>
                  </>
                )}
              </dl>
              {result.note && (
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {result.note}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

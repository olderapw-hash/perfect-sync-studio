// /admin/mail — Enviar recompensa (item / gold).
// Tabs: Item | Moedas/Gold. Permite escolher um template existente como
// ponto de partida, customizar e enviar. Confirmação forte. Persiste no
// mail_send_log + audit_logs sempre, mesmo em erro.
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Coins,
  History,
  Loader2,
  Mail,
  Package,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { useMailTemplates } from "@/hooks/useMailTemplates";
import { useItemCatalog } from "@/context/ItemCatalogContext";
import { sendMailGold, sendMailItem } from "@/lib/mailSend";
import {
  formatGold,
  type MailGoldPayload,
  type MailItemPayload,
  type MailTemplate,
} from "@/lib/mailTemplates";
import { NoActiveServerState } from "@/components/admin/NoActiveServerState";
import { MailStatusBadge } from "@/components/admin/mail/MailStatusBadge";
import { cn } from "@/lib/utils";

/* ─────────── Validação de inputs ─────────── */

const recipientSchema = z.object({
  roleid: z
    .number()
    .int({ message: "Roleid deve ser inteiro" })
    .positive({ message: "Roleid deve ser > 0" }),
  name: z.string().trim().max(64).optional(),
});

const itemSchema = z.object({
  item_id: z.number().int().positive({ message: "Item ID > 0" }),
  count: z
    .number()
    .int()
    .positive({ message: "Quantidade > 0" })
    .max(99999, { message: "Quantidade muito alta" }),
  max_count: z.number().int().positive().optional(),
});

const goldSchema = z.object({
  amount: z
    .number()
    .int()
    .positive({ message: "Valor > 0" })
    .max(2_000_000_000, { message: "Valor excede o teto inteiro" }),
});

const messageSchema = z.object({
  subject: z.string().trim().max(120).optional(),
  body: z.string().trim().max(1000).optional(),
});

const MailPage = () => {
  const { user } = useAuth();
  const { active } = useServers();
  const { can, loading: permsLoading } = useServerPermissions();
  const tenantId = active?.id ?? null;
  const { templates } = useMailTemplates({ tenantId });
  const { metaFor, iconUrlFor } = useItemCatalog();
  const [params, setParams] = useSearchParams();

  // Tab atual
  const initialTab = params.get("tab") === "gold" ? "gold" : "item";
  const [tab, setTab] = useState<"item" | "gold">(initialTab);

  // Recipient
  const [roleidStr, setRoleidStr] = useState("");
  const [targetName, setTargetName] = useState("");

  // Mensagem
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Item
  const [itemIdStr, setItemIdStr] = useState("");
  const [itemCountStr, setItemCountStr] = useState("1");

  // Gold
  const [goldAmountStr, setGoldAmountStr] = useState("");

  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{
    status: "success" | "error" | "endpoint_missing" | "pending";
    message: string;
  } | null>(null);

  // Atualiza search param quando troca de tab (preserva URL compartilhável)
  useEffect(() => {
    const next = new URLSearchParams(params);
    next.set("tab", tab);
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Templates filtrados pela tab atual
  const filteredTemplates = useMemo(
    () => templates.filter((t) => t.kind === tab),
    [templates, tab],
  );

  // Item meta para preview
  const itemId = parseInt(itemIdStr, 10);
  const itemMeta = Number.isFinite(itemId) && itemId > 0 ? metaFor(itemId) : undefined;
  const itemIconUrl = Number.isFinite(itemId) && itemId > 0 ? iconUrlFor(itemId) : "";

  /* ─── Handlers ─── */

  const applyTemplate = (tpl: MailTemplate) => {
    setAppliedTemplateId(tpl.id);
    setSubject(tpl.subject ?? "");
    setBody(tpl.body ?? "");
    if (tpl.kind === "item") {
      const p = tpl.payload as MailItemPayload;
      setItemIdStr(String(p.item_id));
      setItemCountStr(String(p.count));
    } else {
      const p = tpl.payload as MailGoldPayload;
      setGoldAmountStr(String(p.amount));
    }
    toast.success(`Template "${tpl.name}" aplicado`);
  };

  const validate = ():
    | { ok: true; data: ValidatedSend }
    | { ok: false; error: string } => {
    const recipient = recipientSchema.safeParse({
      roleid: parseInt(roleidStr, 10),
      name: targetName.trim() || undefined,
    });
    if (!recipient.success) return { ok: false, error: recipient.error.issues[0].message };

    const msg = messageSchema.safeParse({
      subject: subject.trim() || undefined,
      body: body.trim() || undefined,
    });
    if (!msg.success) return { ok: false, error: msg.error.issues[0].message };

    const recipientData = { roleid: recipient.data.roleid, name: recipient.data.name };
    const messageData = { subject: msg.data.subject, body: msg.data.body };

    if (tab === "item") {
      const it = itemSchema.safeParse({
        item_id: parseInt(itemIdStr, 10),
        count: parseInt(itemCountStr, 10),
      });
      if (!it.success) return { ok: false, error: it.error.issues[0].message };
      return {
        ok: true,
        data: {
          kind: "item",
          recipient: recipientData,
          message: messageData,
          payload: { item_id: it.data.item_id, count: it.data.count, max_count: it.data.max_count },
        },
      };
    }
    const g = goldSchema.safeParse({ amount: parseInt(goldAmountStr, 10) });
    if (!g.success) return { ok: false, error: g.error.issues[0].message };
    return {
      ok: true,
      data: {
        kind: "gold",
        recipient: recipientData,
        message: messageData,
        payload: { amount: g.data.amount },
      },
    };
  };

  const handleOpenConfirm = () => {
    setLastResult(null);
    const v = validate();
    if (v.ok === false) {
      toast.error(v.error);
      return;
    }
    setConfirmOpen(true);
  };

  const handleSend = async () => {
    if (!tenantId || !user?.id) return;
    const v = validate();
    if (v.ok === false) {
      toast.error(v.error);
      setConfirmOpen(false);
      return;
    }
    setSending(true);
    try {
      const baseArgs = {
        tenantId,
        userId: user.id,
        templateId: appliedTemplateId,
        targetRoleid: v.data.recipient.roleid,
        targetName: v.data.recipient.name ?? null,
        subject: v.data.message.subject ?? null,
        body: v.data.message.body ?? null,
      };
      const result =
        v.data.kind === "item"
          ? await sendMailItem({
              ...baseArgs,
              payload: {
                ...v.data.payload,
                item_name: itemMeta?.name,
              },
            })
          : await sendMailGold({
              ...baseArgs,
              payload: v.data.payload,
            });

      setLastResult({
        status: result.status,
        message:
          result.status === "success"
            ? `Recompensa enviada para roleid ${v.data.recipient.roleid}`
            : result.errorMessage || "Falha desconhecida",
      });

      if (result.status === "success") {
        toast.success("Recompensa enviada");
      } else if (result.status === "endpoint_missing") {
        toast.warning(
          "Endpoint do correio ainda não existe nesta VPS. Envio registrado no histórico como 'endpoint ausente'.",
        );
      } else if (result.status === "pending") {
        toast.info("Envio aceito mas ainda não confirmado pelo servidor.");
      } else {
        toast.error(result.errorMessage || "Falha ao enviar");
      }
    } finally {
      setSending(false);
      setConfirmOpen(false);
    }
  };

  /* ─── Estados de bloqueio ─── */
  if (!tenantId) {
    return <NoActiveServerState />;
  }
  if (permsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!can("save_real_roles")) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
          <h2 className="mt-3 text-base font-extrabold uppercase tracking-wider text-foreground">
            Sem permissão
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Você precisa da permissão <code className="font-mono">save_real_roles</code>{" "}
            para enviar recompensas neste servidor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="space-y-4">
        {/* Aviso/contexto — mesmo padrão do RolePersonagemTab */}
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1 space-y-1 text-sm">
              <p className="font-bold uppercase tracking-wider text-primary">
                Enviar recompensa
              </p>
              <p className="text-foreground">
                Item ou moedas via correio do jogo · servidor{" "}
                <span className="font-semibold">{active?.server_name}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Toda tentativa fica registrada no histórico, mesmo em caso de erro.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/admin/mail/templates"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs transition-smooth hover:border-primary/50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Templates
              </Link>
              <Link
                to="/admin/mail/history"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs transition-smooth hover:border-primary/50"
              >
                <History className="h-3.5 w-3.5" />
                Histórico
              </Link>
            </div>
          </div>
        </div>

        {lastResult && (
          <div
            className={cn(
              "rounded-xl border p-3 text-xs",
              lastResult.status === "success"
                ? "border-success/40 bg-success/10 text-success"
                : lastResult.status === "endpoint_missing"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                  : "border-destructive/40 bg-destructive/10 text-destructive",
            )}
          >
            <div className="flex items-center gap-2">
              <MailStatusBadge status={lastResult.status} />
              <span>{lastResult.message}</span>
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          {/* Form principal — mesmo card style do RolePersonagemTab */}
          <section className="rounded-xl border border-border bg-card/40 p-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "item" | "gold")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="item" className="gap-2">
                  <Package className="h-3.5 w-3.5" />
                  Item
                </TabsTrigger>
                <TabsTrigger value="gold" className="gap-2">
                  <Coins className="h-3.5 w-3.5" />
                  Moedas / Gold
                </TabsTrigger>
              </TabsList>

              {/* ─── Recipient (compartilhado) ─── */}
              <div className="mt-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Destinatário
                </h3>
                <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                  <div className="space-y-1.5">
                    <Label htmlFor="roleid">Roleid *</Label>
                    <Input
                      id="roleid"
                      type="number"
                      min={1}
                      value={roleidStr}
                      onChange={(e) => setRoleidStr(e.target.value)}
                      placeholder="ex.: 1024"
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="targetName">Nome (opcional)</Label>
                    <Input
                      id="targetName"
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                      placeholder="Para registrar no histórico"
                      maxLength={64}
                    />
                  </div>
                </div>
              </div>

              {/* ─── Mensagem (compartilhado) ─── */}
              <div className="mt-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Mensagem
                </h3>
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Assunto</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="ex.: Recompensa do evento"
                    maxLength={120}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="body">Corpo</Label>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Texto que aparece no correio do jogador (opcional)"
                    rows={3}
                    maxLength={1000}
                  />
                </div>
              </div>

              <TabsContent value="item" className="mt-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Item anexado
                </h3>
                <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                  <div className="space-y-1.5">
                    <Label htmlFor="itemId">Item ID *</Label>
                    <Input
                      id="itemId"
                      type="number"
                      min={1}
                      value={itemIdStr}
                      onChange={(e) => setItemIdStr(e.target.value)}
                      placeholder="ex.: 11530"
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="itemCount">Quantidade *</Label>
                    <Input
                      id="itemCount"
                      type="number"
                      min={1}
                      value={itemCountStr}
                      onChange={(e) => setItemCountStr(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
                {itemMeta ? (
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3">
                    {itemIconUrl ? (
                      <img
                        src={itemIconUrl}
                        alt=""
                        className="h-10 w-10 rounded border border-border object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded border border-border bg-muted/40">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {itemMeta.name}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        ID {itemMeta.id}
                      </div>
                    </div>
                  </div>
                ) : itemIdStr ? (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-500">
                    <Search className="h-3.5 w-3.5" />
                    Item não encontrado no catálogo .tab — o servidor ainda
                    pode aceitar pelo ID.
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="gold" className="mt-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Moedas anexadas
                </h3>
                <div className="space-y-1.5">
                  <Label htmlFor="goldAmount">
                    Valor em "moedas de cobre" *{" "}
                    <span className="text-muted-foreground">
                      (1 gold = 10.000 silver = 100 copper)
                    </span>
                  </Label>
                  <Input
                    id="goldAmount"
                    type="number"
                    min={1}
                    value={goldAmountStr}
                    onChange={(e) => setGoldAmountStr(e.target.value)}
                    placeholder="ex.: 1000000 = 100g"
                    className="font-mono"
                  />
                </div>
                {goldAmountStr && Number(goldAmountStr) > 0 && (
                  <div className="rounded-lg border border-border bg-background/40 p-3 text-sm">
                    <span className="text-muted-foreground">Equivalente:</span>{" "}
                    <span className="font-mono font-semibold text-amber-500">
                      {formatGold(parseInt(goldAmountStr, 10))}
                    </span>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button onClick={handleOpenConfirm} className="gap-2">
                <Send className="h-4 w-4" />
                Revisar e enviar
              </Button>
            </div>
          </section>

          {/* Sidebar: templates rápidos */}
          <aside className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Templates rápidos
              </h3>
              <Link
                to="/admin/mail/templates"
                className="text-[11px] text-primary hover:underline"
              >
                Gerenciar
              </Link>
            </div>
            {filteredTemplates.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card/30 p-4 text-center text-xs text-muted-foreground">
                Nenhum template do tipo <strong>{tab === "item" ? "item" : "moedas"}</strong>.{" "}
                <Link to="/admin/mail/templates" className="text-primary hover:underline">
                  Criar agora
                </Link>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {filteredTemplates.map((tpl) => (
                  <li key={tpl.id}>
                    <button
                      onClick={() => applyTemplate(tpl)}
                      className={cn(
                        "group w-full rounded-lg border border-border bg-card/40 p-2.5 text-left text-xs transition-smooth hover:border-primary/50 hover:bg-card/60",
                        appliedTemplateId === tpl.id && "border-primary/60 bg-primary/5",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {tpl.kind === "item" ? (
                          <Package className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Coins className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        <span className="flex-1 truncate font-semibold text-foreground">
                          {tpl.name}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      {tpl.description && (
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                          {tpl.description}
                        </p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>

      {/* Confirmação forte */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar envio
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-sm">
              <span className="block">
                Você vai enviar uma recompensa <strong>real</strong> via correio do jogo.
                Esta ação não pode ser desfeita pelo painel.
              </span>
              <span className="block rounded-lg border border-border bg-background/60 p-3 text-xs">
                <span className="block">
                  <strong>Servidor:</strong> {active?.server_name}
                </span>
                <span className="block">
                  <strong>Roleid:</strong>{" "}
                  <code className="font-mono">{roleidStr}</code>
                  {targetName && <> · {targetName}</>}
                </span>
                <span className="block">
                  <strong>Tipo:</strong>{" "}
                  {tab === "item"
                    ? `${itemCountStr}× ${itemMeta?.name ?? `Item ${itemIdStr}`} (ID ${itemIdStr})`
                    : `${formatGold(parseInt(goldAmountStr, 10) || 0)} (${goldAmountStr} copper)`}
                </span>
                {subject && (
                  <span className="block">
                    <strong>Assunto:</strong> {subject}
                  </span>
                )}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleSend();
              }}
              disabled={sending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span className="ml-2">Confirmar envio</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface ValidatedSendBase {
  recipient: { roleid: number; name?: string };
  message: { subject?: string; body?: string };
}
type ValidatedSend =
  | (ValidatedSendBase & {
      kind: "item";
      payload: { item_id: number; count: number; max_count?: number };
    })
  | (ValidatedSendBase & {
      kind: "gold";
      payload: { amount: number };
    });

export default MailPage;

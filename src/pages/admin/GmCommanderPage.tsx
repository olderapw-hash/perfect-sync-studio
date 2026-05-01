// /admin/gm — GM Commander v1
//
// Painel operacional para Game Masters. Consome os endpoints do api_cls.php
// (via clsconfig-proxy) já validados no backend do PWOLD:
//
//   Compensação:  sendMailItem · sendMailGold · grantMallCash
//   Moderação:    kickRole · banAccount · unbanAccount · muteAccount · muteRole
//   Comunicação:  sendSystemMessage
//   Histórico:    getGmActionHistory
//   Capacidade:   getGmCommandCatalog
//
// Regras importantes:
//   1. Capacidade real = getGmCommandCatalog. Actions com state diferente
//      de "supported" aparecem desabilitadas com badge "em breve".
//   2. Toda ação destrutiva passa por dialog de confirmação que FORÇA
//      um dry_run primeiro (preview) antes de liberar a execução real.
//   3. sendMailGold (moedas normais) ≠ grantMallCash (gold da loja).
//      A UI mantém os dois em cards separados com tooltip explicando.
//   4. grantMallCash valida o sucesso operacional via balance_change e
//      wallet_after.cash_total — NÃO assume cash_gold isolado.
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Ban,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Gift,
  Hammer,
  History as HistoryIcon,
  Loader2,
  LogOut,
  Mail,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  ShieldOff,
  Sparkles,
  VolumeX,
  Wallet,
  Wand2,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { NoActiveServerState } from "@/components/admin/NoActiveServerState";
import { EndpointMissingNotice } from "@/components/admin/EndpointMissingNotice";

import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { logAuditEvent } from "@/lib/auditLog";
import { cn } from "@/lib/utils";
import {
  EndpointMissingError,
  pwApi,
  type GmActionHistoryEntry,
  type GmCommandCapability,
  type GmCommandCatalogResponse,
  type GrantMallCashResponse,
  type MallCashBalanceResponse,
  type MallCashWallet,
} from "@/lib/pwApiActions";

/* -------------------------------------------------------------------------- */
/* Capabilities — fonte da verdade do que está suportado de fato              */
/* -------------------------------------------------------------------------- */

const FALLBACK_SUPPORTED = new Set([
  "sendMailItem",
  "sendMailGold",
  "grantMallCash",
  "kickRole",
  "banAccount",
  "unbanAccount",
  "muteAccount",
  "muteRole",
  "sendSystemMessage",
]);

const FALLBACK_UNSUPPORTED = new Set([
  "teleportRole",
  "summonRole",
  "prisonRole",
  "clearRolePk",
  "reviveRole",
  "resetRoleQuest",
  "grantGmPermission",
]);

function normalizeCatalog(
  cat: GmCommandCatalogResponse | null,
): Map<string, GmCommandCapability> {
  const map = new Map<string, GmCommandCapability>();
  if (!cat) return map;
  if (Array.isArray(cat.capabilities)) {
    for (const c of cat.capabilities) map.set(c.action, c);
  }
  if (cat.commands && typeof cat.commands === "object") {
    for (const [k, v] of Object.entries(cat.commands)) map.set(k, v);
  }
  return map;
}

function isSupported(
  action: string,
  caps: Map<string, GmCommandCapability>,
): boolean {
  const c = caps.get(action);
  if (c) return c.state === "supported";
  // Fallback: se o catálogo não devolveu nada (versão antiga da VPS),
  // confia na lista canônica de actions validadas.
  if (FALLBACK_SUPPORTED.has(action)) return true;
  if (FALLBACK_UNSUPPORTED.has(action)) return false;
  return false;
}

/* -------------------------------------------------------------------------- */
/* Página principal                                                            */
/* -------------------------------------------------------------------------- */

export default function GmCommanderPage() {
  const { active } = useServers();
  const { isSuperadmin } = useAuth();
  const { can, loading: permLoading } = useServerPermissions();
  const [catalog, setCatalog] = useState<GmCommandCatalogResponse | null>(null);
  const [catalogMissing, setCatalogMissing] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [historyTick, setHistoryTick] = useState(0);

  const caps = useMemo(() => normalizeCatalog(catalog), [catalog]);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogMissing(false);
    try {
      const res = await pwApi.getGmCommandCatalog();
      setCatalog(res);
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        // Catálogo ausente não bloqueia a UI: caímos no fallback canônico.
        setCatalog(null);
        setCatalogMissing(true);
      } else {
        toast.error(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const refreshHistory = useCallback(() => setHistoryTick((t) => t + 1), []);

  if (!active) return <NoActiveServerState />;
  const allowed = isSuperadmin || can("manage_security");
  if (!permLoading && !allowed) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center">
          <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h2 className="text-base font-extrabold uppercase tracking-wider text-foreground">
            Sem permissão
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Permissão <strong>manage_security</strong> obrigatória para o GM
            Commander.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <header className="border-b border-border bg-gradient-to-r from-card/80 via-card/60 to-card/80 px-6 py-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/40 bg-purple-500/10 text-purple-400">
            <Wand2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-purple-400">
              <Zap className="h-3 w-3" />
              GM · v1
            </div>
            <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground">
              GM Commander
            </h1>
            <p className="text-xs text-muted-foreground">
              Compensação, moderação e comunicação operacional. Toda ação
              destrutiva passa por preview (dry_run) antes da execução real.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadCatalog()}
            disabled={catalogLoading}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", catalogLoading && "animate-spin")} />
            Capacidades
          </Button>
        </div>

        {catalogMissing && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-500">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <strong>getGmCommandCatalog</strong> não existe nesta VPS — usando
              capacidades canônicas como fallback. Atualize o api_cls.php para
              detecção dinâmica.
            </span>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <Tabs defaultValue="compensation" className="space-y-4">
          <TabsList className="bg-card/40">
            <TabsTrigger value="compensation" className="gap-2">
              <Gift className="h-3.5 w-3.5" />
              Compensação
            </TabsTrigger>
            <TabsTrigger value="moderation" className="gap-2">
              <Hammer className="h-3.5 w-3.5" />
              Moderação
            </TabsTrigger>
            <TabsTrigger value="communication" className="gap-2">
              <MessageSquare className="h-3.5 w-3.5" />
              Comunicação
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <HistoryIcon className="h-3.5 w-3.5" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compensation" className="space-y-4">
            <CompensationTab caps={caps} onActed={refreshHistory} />
          </TabsContent>
          <TabsContent value="moderation" className="space-y-4">
            <ModerationTab caps={caps} onActed={refreshHistory} />
          </TabsContent>
          <TabsContent value="communication" className="space-y-4">
            <CommunicationTab caps={caps} onActed={refreshHistory} />
          </TabsContent>
          <TabsContent value="history">
            <HistoryTab tick={historyTick} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers visuais                                                             */
/* -------------------------------------------------------------------------- */

function CapBadge({
  action,
  caps,
}: {
  action: string;
  caps: Map<string, GmCommandCapability>;
}) {
  const c = caps.get(action);
  const state = c?.state ?? (FALLBACK_SUPPORTED.has(action) ? "supported" : "unsupported");
  if (state === "supported") {
    return (
      <Badge variant="outline" className="border-success/50 text-success">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        suportado
      </Badge>
    );
  }
  if (state === "version_gated" || state === "contract_only") {
    return (
      <Badge variant="outline" className="border-amber-500/60 text-amber-500">
        <Clock className="mr-1 h-3 w-3" />
        em breve
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
      <XCircle className="mr-1 h-3 w-3" />
      indisponível
    </Badge>
  );
}

function GmCard({
  icon: Icon,
  title,
  subtitle,
  action,
  caps,
  children,
  tone = "default",
}: {
  icon: typeof Gift;
  title: string;
  subtitle: string;
  action: string;
  caps: Map<string, GmCommandCapability>;
  children: React.ReactNode;
  tone?: "default" | "danger" | "warning" | "premium";
}) {
  const supported = isSupported(action, caps);
  const ring =
    tone === "danger"
      ? "border-destructive/40"
      : tone === "warning"
        ? "border-amber-500/40"
        : tone === "premium"
          ? "border-purple-500/40"
          : "border-border";
  const iconRing =
    tone === "danger"
      ? "bg-destructive/10 text-destructive"
      : tone === "warning"
        ? "bg-amber-500/10 text-amber-500"
        : tone === "premium"
          ? "bg-purple-500/10 text-purple-400"
          : "bg-primary/10 text-primary";
  return (
    <Card className={cn("bg-card/40", ring)}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconRing)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-sm font-extrabold uppercase tracking-wider">
                {title}
              </CardTitle>
              <CapBadge action={action} caps={caps} />
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
            <code className="mt-1 inline-block font-mono text-[10px] text-muted-foreground/70">
              ?action={action}
            </code>
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "space-y-3",
          !supported && "pointer-events-none opacity-50 grayscale",
        )}
      >
        {children}
        {!supported && (
          <p className="text-[11px] italic text-muted-foreground">
            Endpoint não suportado nesta VPS.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Confirm dialog — força dry_run antes do real                                */
/* -------------------------------------------------------------------------- */

interface ConfirmActionProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Função que executa a action. Recebe `dryRun:boolean` e devolve a resposta. */
  exec: (dryRun: boolean) => Promise<T>;
  /** Renderiza preview do resultado do dry_run. */
  renderPreview: (result: T) => React.ReactNode;
  /** Callback final (sucesso real). */
  onSuccess: (result: T) => void;
  /** Quando o endpoint não suporta dry_run, pula a etapa de preview. */
  skipDryRun?: boolean;
}

function ConfirmActionDialog<T>({
  open,
  onOpenChange,
  title,
  description,
  exec,
  renderPreview,
  onSuccess,
  skipDryRun,
}: ConfirmActionProps<T>) {
  const [phase, setPhase] = useState<"preview" | "ready" | "running">("preview");
  const [previewResult, setPreviewResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPhase(skipDryRun ? "ready" : "preview");
      setPreviewResult(null);
      setError(null);
    }
  }, [open, skipDryRun]);

  const runPreview = async () => {
    setError(null);
    setPhase("running");
    try {
      const r = await exec(true);
      setPreviewResult(r);
      setPhase("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("preview");
    }
  };

  const runReal = async () => {
    setError(null);
    setPhase("running");
    try {
      const r = await exec(false);
      onSuccess(r);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("ready");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {!skipDryRun && phase === "preview" && (
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">
              1. Preview (dry_run)
            </p>
            <p className="mt-1">
              Vamos consultar o servidor sem efetivar nada. Confira os números e
              só então execute de verdade.
            </p>
          </div>
        )}

        {phase === "ready" && previewResult && (
          <div className="space-y-2 rounded-md border border-success/40 bg-success/5 px-3 py-2 text-xs">
            <p className="font-semibold uppercase tracking-wider text-success">
              Preview validado
            </p>
            {renderPreview(previewResult)}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={phase === "running"}
          >
            Cancelar
          </Button>
          {!skipDryRun && phase !== "ready" ? (
            <Button onClick={runPreview} disabled={phase === "running"}>
              {phase === "running" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Rodar dry_run
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={runReal}
              disabled={phase === "running"}
            >
              {phase === "running" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
              Executar de verdade
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Action picker — menu de cards clicáveis para abrir cada ação                */
/* -------------------------------------------------------------------------- */

interface ActionItem {
  id: string;
  action: string;
  title: string;
  subtitle: string;
  icon: typeof Gift;
  tone?: "default" | "danger" | "warning" | "premium";
  render: () => React.ReactNode;
}

function ActionPicker({
  items,
  caps,
  emptyHint,
}: {
  items: ActionItem[];
  caps: Map<string, GmCommandCapability>;
  emptyHint?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = items.find((i) => i.id === activeId) ?? null;

  if (active) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveId(null)}
            className="gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </Button>
          <div className="text-[11px] text-muted-foreground">
            <span className="opacity-60">Ações</span>
            <ChevronRight className="mx-1 inline h-3 w-3" />
            <span className="font-semibold text-foreground">{active.title}</span>
          </div>
        </div>
        <div className="mx-auto max-w-2xl">{active.render()}</div>
      </div>
    );
  }

  return (
    <div>
      {emptyHint && (
        <p className="mb-3 text-[11px] text-muted-foreground">{emptyHint}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const supported = isSupported(item.action, caps);
          const toneRing =
            item.tone === "danger"
              ? "border-destructive/40 hover:border-destructive/70 hover:bg-destructive/5"
              : item.tone === "warning"
                ? "border-amber-500/40 hover:border-amber-500/70 hover:bg-amber-500/5"
                : item.tone === "premium"
                  ? "border-purple-500/40 hover:border-purple-500/70 hover:bg-purple-500/5"
                  : "border-border hover:border-primary/60 hover:bg-primary/5";
          const iconRing =
            item.tone === "danger"
              ? "bg-destructive/10 text-destructive"
              : item.tone === "warning"
                ? "bg-amber-500/10 text-amber-500"
                : item.tone === "premium"
                  ? "bg-purple-500/10 text-purple-400"
                  : "bg-primary/10 text-primary";
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => supported && setActiveId(item.id)}
              disabled={!supported}
              className={cn(
                "group flex flex-col items-start gap-3 rounded-xl border bg-card/40 p-4 text-left transition-all",
                toneRing,
                !supported && "cursor-not-allowed opacity-50",
              )}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    iconRing,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <CapBadge action={item.action} caps={caps} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                  {item.subtitle}
                </p>
              </div>
              <div className="flex w-full items-center justify-between text-[10px] text-muted-foreground">
                <code className="font-mono opacity-70">?action={item.action}</code>
                {supported && (
                  <span className="flex items-center gap-1 font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Abrir
                    <ChevronRight className="h-3 w-3" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Compensação                                                                 */
/* -------------------------------------------------------------------------- */

function CompensationTab({
  caps,
  onActed,
}: {
  caps: Map<string, GmCommandCapability>;
  onActed: () => void;
}) {
  const items: ActionItem[] = [
    {
      id: "mail-item",
      action: "sendMailItem",
      title: "Enviar Item",
      subtitle: "Anexa um item ao correio do personagem alvo.",
      icon: Mail,
      render: () => <SendMailItemCard caps={caps} onActed={onActed} />,
    },
    {
      id: "mail-gold",
      action: "sendMailGold",
      title: "Enviar Moedas",
      subtitle: "Moedas NORMAIS no inventário (não é gold da loja).",
      icon: Coins,
      render: () => <SendMailGoldCard caps={caps} onActed={onActed} />,
    },
    {
      id: "mall-cash",
      action: "grantMallCash",
      title: "Gold da Loja",
      subtitle: "Gold/CASH da Mall. NÃO confundir com sendMailGold.",
      icon: Wallet,
      tone: "premium",
      render: () => <GrantMallCashCard caps={caps} onActed={onActed} />,
    },
  ];
  return (
    <ActionPicker
      items={items}
      caps={caps}
      emptyHint="Selecione uma ação de compensação para abrir o formulário."
    />
  );
}

function SendMailItemCard({
  caps,
  onActed,
}: {
  caps: Map<string, GmCommandCapability>;
  onActed: () => void;
}) {
  const { active } = useServers();
  const [roleid, setRoleid] = useState("");
  const [itemId, setItemId] = useState("");
  const [count, setCount] = useState("1");
  const [subject, setSubject] = useState("Compensação");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const r = Number(roleid);
    const i = Number(itemId);
    const c = Number(count);
    if (!r || !i || c <= 0) {
      toast.error("Informe roleid, item_id e count válidos");
      return;
    }
    setBusy(true);
    try {
      const res = await pwApi.sendMailItem({
        roleid: r,
        subject,
        body,
        item: { item_id: i, count: c },
      });
      if (res.success) {
        toast.success(`Item enviado · mail_id ${res.mail_id ?? "—"}`);
        void logAuditEvent({
          action: "gm.sendMailItem",
          tenantId: active?.id ?? null,
          target: String(r),
          status: "ok",
          metadata: { item_id: i, count: c },
        });
        setItemId("");
        onActed();
      } else {
        toast.error(res.error ?? "Falhou");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <GmCard
      icon={Mail}
      title="Enviar Item por Correio"
      subtitle="Anexa um item ao correio do personagem alvo."
      action="sendMailItem"
      caps={caps}
    >
      <FieldRow label="Roleid">
        <Input value={roleid} onChange={(e) => setRoleid(e.target.value)} placeholder="1024" />
      </FieldRow>
      <FieldRow label="Item ID">
        <Input value={itemId} onChange={(e) => setItemId(e.target.value)} placeholder="22272" />
      </FieldRow>
      <FieldRow label="Quantidade">
        <Input
          type="number"
          min={1}
          value={count}
          onChange={(e) => setCount(e.target.value)}
        />
      </FieldRow>
      <FieldRow label="Assunto">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
      </FieldRow>
      <FieldRow label="Corpo">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Mensagem opcional…"
        />
      </FieldRow>
      <Button onClick={submit} disabled={busy} className="w-full">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
        Enviar item
      </Button>
    </GmCard>
  );
}

function SendMailGoldCard({
  caps,
  onActed,
}: {
  caps: Map<string, GmCommandCapability>;
  onActed: () => void;
}) {
  const { active } = useServers();
  const [roleid, setRoleid] = useState("");
  const [amount, setAmount] = useState("");
  const [subject, setSubject] = useState("Compensação");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const r = Number(roleid);
    const a = Number(amount);
    if (!r || a <= 0) {
      toast.error("Informe roleid e valor válidos");
      return;
    }
    setBusy(true);
    try {
      const res = await pwApi.sendMailGold({ roleid: r, subject, body, amount: a });
      if (res.success) {
        toast.success(`Moedas enviadas · mail_id ${res.mail_id ?? "—"}`);
        void logAuditEvent({
          action: "gm.sendMailGold",
          tenantId: active?.id ?? null,
          target: String(r),
          status: "ok",
          metadata: { amount: a },
        });
        setAmount("");
        onActed();
      } else {
        toast.error(res.error ?? "Falhou");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <GmCard
      icon={Coins}
      title="Enviar Moedas por Correio"
      subtitle="Moedas NORMAIS no inventário (não é gold da loja)."
      action="sendMailGold"
      caps={caps}
    >
      <FieldRow label="Roleid">
        <Input value={roleid} onChange={(e) => setRoleid(e.target.value)} placeholder="1024" />
      </FieldRow>
      <FieldRow label="Valor (em copper)">
        <Input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="10000 = 1 gold"
        />
      </FieldRow>
      <FieldRow label="Assunto">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
      </FieldRow>
      <FieldRow label="Corpo">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} />
      </FieldRow>
      <Button onClick={submit} disabled={busy} className="w-full">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Coins className="h-3.5 w-3.5" />}
        Enviar moedas
      </Button>
    </GmCard>
  );
}

function GrantMallCashCard({
  caps,
  onActed,
}: {
  caps: Map<string, GmCommandCapability>;
  onActed: () => void;
}) {
  const { active } = useServers();
  const [roleid, setRoleid] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("manual-test");
  const [walletLoading, setWalletLoading] = useState(false);
  const [wallet, setWallet] = useState<MallCashBalanceResponse | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showUnits, setShowUnits] = useState(false);

  const fetchWallet = useCallback(async () => {
    const r = Number(roleid);
    if (!r) {
      toast.error("Informe um roleid válido");
      return;
    }
    setWalletLoading(true);
    try {
      const res = await pwApi.getMallCashBalance(r);
      setWallet(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setWalletLoading(false);
    }
  }, [roleid]);

  const exec = async (dryRun: boolean): Promise<GrantMallCashResponse> => {
    const r = Number(roleid);
    const a = Number(amount);
    return pwApi.grantMallCash({
      roleid: r,
      amount: a,
      reason,
      ...(dryRun ? { dry_run: true } : { confirm: "GRANT_MALL_CASH" as const }),
    });
  };

  const onSuccess = (res: GrantMallCashResponse) => {
    const change = res.balance_change?.cash_total_gold ?? 0;
    const operationallyOk =
      res.success && (change > 0 || res.grant_result?.error_code === 0);
    if (operationallyOk) {
      toast.success(
        `Grant aplicado · +${change} gold (cash_total: ${
          res.wallet_after?.cash_total_gold ?? "—"
        })`,
      );
      void logAuditEvent({
        action: "gm.grantMallCash",
        tenantId: active?.id ?? null,
        target: String(roleid),
        status: "ok",
        metadata: {
          amount: Number(amount),
          balance_change: res.balance_change,
          error_code: res.grant_result?.error_code,
        },
      });
    } else {
      toast.warning(
        `Resposta ambígua · error_code=${
          res.grant_result?.error_code ?? "?"
        }, change=${change}`,
      );
    }
    setWallet({
      success: true,
      roleid: Number(roleid),
      wallet: res.wallet_after ?? {},
    });
    onActed();
  };

  const handleOpenConfirm = () => {
    const r = Number(roleid);
    const a = Number(amount);
    if (!r || a <= 0 || !reason.trim()) {
      toast.error("Roleid, amount > 0 e reason são obrigatórios");
      return;
    }
    setConfirmOpen(true);
  };

  return (
    <GmCard
      icon={Wallet}
      title="Adicionar Gold da Loja"
      subtitle="Gold/CASH da Mall (loja). NÃO é o mesmo que sendMailGold."
      action="grantMallCash"
      caps={caps}
      tone="premium"
    >
      <FieldRow label="Roleid">
        <div className="flex gap-2">
          <Input value={roleid} onChange={(e) => setRoleid(e.target.value)} placeholder="1024" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchWallet()}
            disabled={walletLoading}
          >
            {walletLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Saldo
          </Button>
        </div>
      </FieldRow>

      {wallet && <WalletPreview wallet={wallet.wallet} showUnits={showUnits} />}
      <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
        <Switch checked={showUnits} onCheckedChange={setShowUnits} id="units" />
        <Label htmlFor="units" className="text-[10px]">
          Detalhe técnico (units)
        </Label>
      </div>

      <Separator />

      <FieldRow label="Amount (gold)">
        <Input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="10"
        />
      </FieldRow>
      <FieldRow label="Reason">
        <Input value={reason} onChange={(e) => setReason(e.target.value)} />
      </FieldRow>

      <Button onClick={handleOpenConfirm} className="w-full" variant="default">
        <Sparkles className="h-3.5 w-3.5" />
        Conceder gold da loja
      </Button>

      <ConfirmActionDialog<GrantMallCashResponse>
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Conceder gold da Mall"
        description={`+${amount} gold para roleid ${roleid}. O dry_run só simula — execute o real depois de validar.`}
        exec={exec}
        onSuccess={onSuccess}
        renderPreview={(res) => (
          <div className="space-y-1 text-xs">
            <Row label="error_code" value={res.grant_result?.error_code ?? "—"} />
            <Row
              label="cash_total antes"
              value={res.wallet_before?.cash_total_gold ?? "—"}
            />
            <Row
              label="cash_total depois"
              value={res.wallet_after?.cash_total_gold ?? "—"}
            />
            <Row
              label="balance_change"
              value={`+${res.balance_change?.cash_total_gold ?? 0} gold`}
            />
            {res.warning && (
              <p className="mt-1 italic text-amber-500">⚠ {res.warning}</p>
            )}
          </div>
        )}
      />
    </GmCard>
  );
}

function WalletPreview({
  wallet,
  showUnits,
}: {
  wallet: MallCashWallet;
  showUnits: boolean;
}) {
  return (
    <div className="rounded-md border border-purple-500/30 bg-purple-500/5 p-2.5 text-xs">
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-400">
        Carteira da Mall
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <WalletStat label="cash" main={wallet.cash_gold} sub={showUnits ? wallet.cash_units : undefined} />
        <WalletStat label="cash_add" main={wallet.cash_add_gold} sub={showUnits ? wallet.cash_add_units : undefined} />
        <WalletStat
          label="TOTAL"
          main={wallet.cash_total_gold}
          sub={showUnits ? wallet.cash_total_units : undefined}
          highlight
        />
      </div>
      <p className="mt-1.5 text-[10px] italic text-muted-foreground">
        Crédito real geralmente reflete em <code>cash_add</code>. Confira sempre
        pelo <strong>cash_total</strong>.
      </p>
    </div>
  );
}

function WalletStat({
  label,
  main,
  sub,
  highlight,
}: {
  label: string;
  main?: number;
  sub?: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded border px-2 py-1.5",
        highlight
          ? "border-purple-500/50 bg-purple-500/10"
          : "border-border/60 bg-card/40",
      )}
    >
      <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="font-mono text-sm font-extrabold text-foreground">
        {main ?? "—"}
        <span className="ml-1 text-[10px] font-normal text-muted-foreground">g</span>
      </div>
      {sub != null && (
        <div className="font-mono text-[10px] text-muted-foreground">{sub} u</div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Moderação                                                                   */
/* -------------------------------------------------------------------------- */

function ModerationTab({
  caps,
  onActed,
}: {
  caps: Map<string, GmCommandCapability>;
  onActed: () => void;
}) {
  const items: ActionItem[] = [
    {
      id: "kick",
      action: "kickRole",
      title: "Kick",
      subtitle: "Desconecta o personagem online (não bane).",
      icon: LogOut,
      tone: "warning",
      render: () => <KickRoleCard caps={caps} onActed={onActed} />,
    },
    {
      id: "ban",
      action: "banAccount",
      title: "Ban",
      subtitle: "Bane uma conta — temporário ou permanente.",
      icon: Ban,
      tone: "danger",
      render: () => <BanAccountCard caps={caps} onActed={onActed} />,
    },
    {
      id: "unban",
      action: "unbanAccount",
      title: "Unban",
      subtitle: "Remove o ban de uma conta.",
      icon: ShieldOff,
      render: () => <UnbanAccountCard caps={caps} onActed={onActed} />,
    },
    {
      id: "mute-account",
      action: "muteAccount",
      title: "Mute Account",
      subtitle: "Silencia uma conta inteira no chat global.",
      icon: VolumeX,
      tone: "warning",
      render: () => (
        <MuteCard
          caps={caps}
          onActed={onActed}
          variant="account"
          action="muteAccount"
          title="Mute Account"
          subtitle="Silencia uma conta inteira no chat global."
        />
      ),
    },
    {
      id: "mute-role",
      action: "muteRole",
      title: "Mute Role",
      subtitle: "Silencia apenas um personagem específico.",
      icon: VolumeX,
      tone: "warning",
      render: () => (
        <MuteCard
          caps={caps}
          onActed={onActed}
          variant="role"
          action="muteRole"
          title="Mute Role"
          subtitle="Silencia apenas um personagem específico."
        />
      ),
    },
    {
      id: "teleport",
      action: "teleportRole",
      title: "Teleport",
      subtitle: "Aguardando suporte na VPS.",
      icon: Zap,
      render: () => <UnsupportedCard caps={caps} action="teleportRole" icon={Zap} title="Teleport" />,
    },
    {
      id: "summon",
      action: "summonRole",
      title: "Summon",
      subtitle: "Aguardando suporte na VPS.",
      icon: Zap,
      render: () => <UnsupportedCard caps={caps} action="summonRole" icon={Zap} title="Summon" />,
    },
    {
      id: "prison",
      action: "prisonRole",
      title: "Prison",
      subtitle: "Aguardando suporte na VPS.",
      icon: ShieldOff,
      render: () => <UnsupportedCard caps={caps} action="prisonRole" icon={ShieldOff} title="Prison" />,
    },
    {
      id: "clearpk",
      action: "clearRolePk",
      title: "Clear PK",
      subtitle: "Aguardando suporte na VPS.",
      icon: ShieldOff,
      render: () => <UnsupportedCard caps={caps} action="clearRolePk" icon={ShieldOff} title="Clear PK" />,
    },
    {
      id: "revive",
      action: "reviveRole",
      title: "Revive",
      subtitle: "Aguardando suporte na VPS.",
      icon: Sparkles,
      render: () => <UnsupportedCard caps={caps} action="reviveRole" icon={Sparkles} title="Revive" />,
    },
    {
      id: "reset-quest",
      action: "resetRoleQuest",
      title: "Reset Quest",
      subtitle: "Aguardando suporte na VPS.",
      icon: Sparkles,
      render: () => <UnsupportedCard caps={caps} action="resetRoleQuest" icon={Sparkles} title="Reset Quest" />,
    },
  ];
  return (
    <ActionPicker
      items={items}
      caps={caps}
      emptyHint="Selecione uma ação de moderação para abrir o formulário."
    />
  );
}

function KickRoleCard({
  caps,
  onActed,
}: {
  caps: Map<string, GmCommandCapability>;
  onActed: () => void;
}) {
  const { active } = useServers();
  const [roleid, setRoleid] = useState("");
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <GmCard
      icon={LogOut}
      title="Kick"
      subtitle="Desconecta o personagem online (não bane)."
      action="kickRole"
      caps={caps}
      tone="warning"
    >
      <FieldRow label="Roleid">
        <Input value={roleid} onChange={(e) => setRoleid(e.target.value)} placeholder="1024" />
      </FieldRow>
      <FieldRow label="Motivo">
        <Input value={reason} onChange={(e) => setReason(e.target.value)} />
      </FieldRow>
      <Button
        variant="outline"
        className="w-full border-amber-500/50 text-amber-500"
        onClick={() => {
          if (!Number(roleid) || !reason.trim()) {
            toast.error("Roleid e motivo são obrigatórios");
            return;
          }
          setConfirmOpen(true);
        }}
      >
        <LogOut className="h-3.5 w-3.5" />
        Kickar
      </Button>
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        skipDryRun
        title="Kick Role"
        description={`Desconectar roleid ${roleid}? Esta operação é imediata.`}
        exec={async () =>
          pwApi.kickRole({ roleid: Number(roleid), reason })
        }
        onSuccess={(res) => {
          if (res.success) {
            toast.success("Personagem desconectado");
            void logAuditEvent({
              action: "gm.kickRole",
              tenantId: active?.id ?? null,
              target: String(roleid),
              status: "ok",
            });
            onActed();
          } else {
            toast.error(res.error ?? "Falhou");
          }
        }}
        renderPreview={() => null}
      />
    </GmCard>
  );
}

function BanAccountCard({
  caps,
  onActed,
}: {
  caps: Map<string, GmCommandCapability>;
  onActed: () => void;
}) {
  const { active } = useServers();
  const [account, setAccount] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("3600");
  const [permanent, setPermanent] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <GmCard
      icon={Ban}
      title="Ban"
      subtitle="Bane uma conta — temporário ou permanente."
      action="banAccount"
      caps={caps}
      tone="danger"
    >
      <FieldRow label="Conta (login ou userid)">
        <Input value={account} onChange={(e) => setAccount(e.target.value)} />
      </FieldRow>
      <FieldRow label="Motivo">
        <Input value={reason} onChange={(e) => setReason(e.target.value)} />
      </FieldRow>
      <div className="flex items-center justify-between rounded-md border border-border bg-card/40 px-2 py-1.5">
        <Label className="text-[11px]">Permanente</Label>
        <Switch checked={permanent} onCheckedChange={setPermanent} />
      </div>
      {!permanent && (
        <FieldRow label="Duração (segundos)">
          <Input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </FieldRow>
      )}
      <Button
        variant="destructive"
        className="w-full"
        onClick={() => {
          if (!account.trim() || !reason.trim()) {
            toast.error("Conta e motivo são obrigatórios");
            return;
          }
          setConfirmOpen(true);
        }}
      >
        <Ban className="h-3.5 w-3.5" />
        Banir
      </Button>
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Ban Account"
        description={`Banir conta "${account}" ${
          permanent ? "PERMANENTEMENTE" : `por ${duration}s`
        }?`}
        exec={async (dryRun) =>
          pwApi.banAccount({
            account,
            reason,
            permanent,
            duration_seconds: permanent ? undefined : Number(duration),
            dry_run: dryRun,
          })
        }
        onSuccess={(res) => {
          if (res.success) {
            toast.success("Conta banida");
            void logAuditEvent({
              action: "gm.banAccount",
              tenantId: active?.id ?? null,
              target: account,
              status: "ok",
              metadata: { permanent, duration_seconds: Number(duration) },
            });
            onActed();
          } else {
            toast.error(res.error ?? "Falhou");
          }
        }}
        renderPreview={(res) => (
          <div className="space-y-1 text-xs">
            <Row label="state" value={res.state ?? "—"} />
            <Row label="ban_until" value={res.ban_until ?? "—"} />
            <Row label="seconds" value={res.seconds ?? "—"} />
          </div>
        )}
      />
    </GmCard>
  );
}

function UnbanAccountCard({
  caps,
  onActed,
}: {
  caps: Map<string, GmCommandCapability>;
  onActed: () => void;
}) {
  const { active } = useServers();
  const [account, setAccount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!account.trim()) {
      toast.error("Conta obrigatória");
      return;
    }
    setBusy(true);
    try {
      const res = await pwApi.unbanAccount({ account, reason });
      if (res.success) {
        toast.success("Ban removido");
        void logAuditEvent({
          action: "gm.unbanAccount",
          tenantId: active?.id ?? null,
          target: account,
          status: "ok",
        });
        onActed();
      } else {
        toast.error(res.error ?? "Falhou");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <GmCard
      icon={ShieldOff}
      title="Unban"
      subtitle="Remove o ban de uma conta."
      action="unbanAccount"
      caps={caps}
    >
      <FieldRow label="Conta">
        <Input value={account} onChange={(e) => setAccount(e.target.value)} />
      </FieldRow>
      <FieldRow label="Motivo (opcional)">
        <Input value={reason} onChange={(e) => setReason(e.target.value)} />
      </FieldRow>
      <Button onClick={submit} disabled={busy} className="w-full" variant="outline">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldOff className="h-3.5 w-3.5" />}
        Remover ban
      </Button>
    </GmCard>
  );
}

function MuteCard({
  caps,
  onActed,
  variant,
  action,
  title,
  subtitle,
}: {
  caps: Map<string, GmCommandCapability>;
  onActed: () => void;
  variant: "account" | "role";
  action: "muteAccount" | "muteRole";
  title: string;
  subtitle: string;
}) {
  const { active } = useServers();
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("3600");
  const [permanent, setPermanent] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <GmCard
      icon={VolumeX}
      title={title}
      subtitle={subtitle}
      action={action}
      caps={caps}
      tone="warning"
    >
      <FieldRow label={variant === "account" ? "Conta" : "Roleid"}>
        <Input value={target} onChange={(e) => setTarget(e.target.value)} />
      </FieldRow>
      <FieldRow label="Motivo">
        <Input value={reason} onChange={(e) => setReason(e.target.value)} />
      </FieldRow>
      <div className="flex items-center justify-between rounded-md border border-border bg-card/40 px-2 py-1.5">
        <Label className="text-[11px]">Permanente</Label>
        <Switch checked={permanent} onCheckedChange={setPermanent} />
      </div>
      {!permanent && (
        <FieldRow label="Duração (segundos)">
          <Input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </FieldRow>
      )}
      <Button
        variant="outline"
        className="w-full border-amber-500/50 text-amber-500"
        onClick={() => {
          if (!target.trim() || !reason.trim()) {
            toast.error("Alvo e motivo são obrigatórios");
            return;
          }
          setConfirmOpen(true);
        }}
      >
        <VolumeX className="h-3.5 w-3.5" />
        Silenciar
      </Button>
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={title}
        description={`Silenciar "${target}" ${
          permanent ? "PERMANENTEMENTE" : `por ${duration}s`
        }?`}
        exec={async (dryRun) => {
          if (variant === "account") {
            return pwApi.muteAccount({
              account: target,
              reason,
              permanent,
              duration_seconds: permanent ? undefined : Number(duration),
              dry_run: dryRun,
            });
          }
          return pwApi.muteRole({
            roleid: Number(target),
            reason,
            permanent,
            duration_seconds: permanent ? undefined : Number(duration),
            dry_run: dryRun,
          });
        }}
        onSuccess={(res) => {
          if (res.success) {
            toast.success("Silenciado");
            void logAuditEvent({
              action: `gm.${action}`,
              tenantId: active?.id ?? null,
              target,
              status: "ok",
              metadata: { permanent, duration_seconds: Number(duration) },
            });
            onActed();
          } else {
            toast.error(res.error ?? "Falhou");
          }
        }}
        renderPreview={(res) => (
          <div className="space-y-1 text-xs">
            <Row label="state" value={res.state ?? "—"} />
            <Row label="seconds" value={res.seconds ?? "—"} />
          </div>
        )}
      />
    </GmCard>
  );
}

function UnsupportedCard({
  caps,
  action,
  icon,
  title,
}: {
  caps: Map<string, GmCommandCapability>;
  action: string;
  icon: typeof Zap;
  title: string;
}) {
  return (
    <GmCard
      icon={icon}
      title={title}
      subtitle="Aguardando suporte na VPS."
      action={action}
      caps={caps}
    >
      <p className="text-[11px] text-muted-foreground">
        Endpoint planejado mas ainda não validado no api_cls.php.
      </p>
    </GmCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Comunicação                                                                 */
/* -------------------------------------------------------------------------- */

function CommunicationTab({
  caps,
  onActed,
}: {
  caps: Map<string, GmCommandCapability>;
  onActed: () => void;
}) {
  const { active } = useServers();
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<"system" | "broadcast" | "tip" | "world">("system");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [busy, setBusy] = useState(false);

  const submit = async (dryRun: boolean) => {
    if (!message.trim()) {
      toast.error("Mensagem obrigatória");
      return;
    }
    setBusy(true);
    try {
      const res = await pwApi.sendSystemMessage({
        message,
        kind,
        priority,
        dry_run: dryRun,
      });
      if (res.success) {
        if (dryRun) {
          toast.info(`Preview OK · método ${res.method ?? "—"} · ${res.length ?? 0} chars`);
        } else {
          toast.success(`Mensagem ${res.delivered ? "entregue" : "enfileirada"}`);
          void logAuditEvent({
            action: "gm.sendSystemMessage",
            tenantId: active?.id ?? null,
            target: kind,
            status: "ok",
            metadata: { kind, priority, length: res.length },
          });
          setMessage("");
          onActed();
        }
      } else {
        toast.error(res.error ?? "Falhou");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <GmCard
        icon={MessageSquare}
        title="Mensagem Global"
        subtitle="Envia para todos os jogadores online via gdeliveryd."
        action="sendSystemMessage"
        caps={caps}
        tone="premium"
      >
        <FieldRow label="Tipo">
          <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">system</SelectItem>
              <SelectItem value="broadcast">broadcast</SelectItem>
              <SelectItem value="tip">tip</SelectItem>
              <SelectItem value="world">world</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Prioridade">
          <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">low</SelectItem>
              <SelectItem value="normal">normal</SelectItem>
              <SelectItem value="high">high</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Mensagem">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={200}
          />
          <div className="text-right text-[10px] text-muted-foreground">
            {message.length}/200
          </div>
        </FieldRow>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => void submit(true)}
            disabled={busy}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Dry-run
          </Button>
          <Button
            className="flex-1"
            onClick={() => void submit(false)}
            disabled={busy}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
            Enviar
          </Button>
        </div>
      </GmCard>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Histórico                                                                   */
/* -------------------------------------------------------------------------- */

function HistoryTab({ tick }: { tick: number }) {
  const [entries, setEntries] = useState<GmActionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMissing(false);
    try {
      const res = await pwApi.getGmActionHistory({ limit: 20 });
      setEntries(res.entries ?? []);
    } catch (e) {
      if (e instanceof EndpointMissingError) setMissing(true);
      else setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, tick]);

  if (missing) return <EndpointMissingNotice action="getGmActionHistory" />;

  return (
    <Card className="bg-card/40">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider">
          <HistoryIcon className="h-4 w-4 text-primary" />
          Últimas 20 ações GM
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
        {loading && entries.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-md" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Nenhuma ação registrada ainda.
          </p>
        ) : (
          <ScrollArea className="h-[480px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Quando</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Alvo</TableHead>
                  <TableHead className="w-[90px]">Status</TableHead>
                  <TableHead className="w-[70px]">Dry</TableHead>
                  <TableHead>Mensagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e, i) => (
                  <TableRow key={e.id ?? i}>
                    <TableCell className="font-mono text-[11px]">
                      {fmtDate(e.ts)}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] font-semibold">
                      {e.action}
                    </TableCell>
                    <TableCell className="font-mono text-[11px]">
                      {(() => {
                        const toStr = (v: any): string => {
                          if (v == null) return "";
                          if (typeof v === "object")
                            return String(
                              v.roleid ?? v.userid ?? v.role_name ?? v.account ?? JSON.stringify(v),
                            );
                          return String(v);
                        };
                        return toStr(e.target) || toStr(e.roleid) || toStr(e.account) || "—";
                      })()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={e.status} />
                    </TableCell>
                    <TableCell>
                      {e.dry_run ? (
                        <Badge variant="outline" className="text-[9px]">
                          dry
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-[11px] text-muted-foreground">
                      {(() => {
                        const v = e.error ?? e.message;
                        if (v == null) return "—";
                        return typeof v === "object" ? JSON.stringify(v) : String(v);
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Util                                                                        */
/* -------------------------------------------------------------------------- */

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-xs font-semibold">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ok") {
    return (
      <Badge variant="outline" className="border-success/50 text-success">
        ok
      </Badge>
    );
  }
  if (status === "error") {
    return (
      <Badge variant="outline" className="border-destructive/50 text-destructive">
        error
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-500/50 text-amber-500">
      {status}
    </Badge>
  );
}

function fmtDate(ts: number | string): string {
  if (!ts) return "—";
  const date = typeof ts === "number" ? new Date(ts * (ts < 1e12 ? 1000 : 1)) : new Date(ts);
  if (Number.isNaN(date.getTime())) return String(ts);
  return date.toLocaleString();
}

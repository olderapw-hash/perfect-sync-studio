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
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  VolumeX,
  Wallet,
  Wand2,
  XCircle,
  Zap,
} from "lucide-react";
// toast replaced by GmFeedback overlay

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
import { logAuditEvent } from "@/lib/auditLog";
import { cn } from "@/lib/utils";
import {
  EndpointMissingError,
  pwApi,
  type ForbidDelivery,
  type GmActionBlock,
  type GmActionHistoryEntry,
  type GmCommandCapability,
  type GmCommandCatalogResponse,
  type GmPermissionMutationResponse,
  type GmPermissionRule,
  type GmPermissionStateResponse,
  type GmPermissionSummary,
  type GrantMallCashResponse,
  type MallCashBalanceResponse,
  type MallCashWallet,
  type SecurityActionResponse,
} from "@/lib/pwApiActions";

/* -------------------------------------------------------------------------- */
/* GmFeedback — centered card overlay instead of corner toasts                */
/* -------------------------------------------------------------------------- */

type FeedbackType = "success" | "error" | "info" | "warning";
interface FeedbackItem {
  id: number;
  type: FeedbackType;
  title: string;
  description?: string;
}

interface FeedbackAPI {
  success: (title: string, opts?: { description?: string } | string) => void;
  error: (title: string, opts?: { description?: string } | string) => void;
  info: (title: string, opts?: { description?: string } | string) => void;
  warning: (title: string, opts?: { description?: string } | string) => void;
}

const FeedbackCtx = createContext<FeedbackAPI | null>(null);

function useFeedback(): FeedbackAPI {
  const ctx = useContext(FeedbackCtx);
  if (!ctx) throw new Error("useFeedback must be inside FeedbackProvider");
  return ctx;
}

function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const nextId = useRef(0);

  const push = useCallback((type: FeedbackType, title: string, opts?: { description?: string } | string) => {
    const id = nextId.current++;
    const description = typeof opts === "string" ? opts : opts?.description;
    setItems((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 3500);
  }, []);

  const api = useMemo<FeedbackAPI>(
    () => ({
      success: (t, o?) => push("success", t, o),
      error: (t, o?) => push("error", t, o),
      info: (t, o?) => push("info", t, o),
      warning: (t, o?) => push("warning", t, o),
    }),
    [push],
  );

  const iconMap: Record<FeedbackType, React.ReactNode> = {
    success: <CheckCircle2 className="h-6 w-6 text-emerald-400" />,
    error: <XCircle className="h-6 w-6 text-red-400" />,
    info: <AlertTriangle className="h-6 w-6 text-blue-400" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-400" />,
  };

  const bgMap: Record<FeedbackType, string> = {
    success: "border-emerald-500/50 bg-emerald-950/90",
    error: "border-red-500/50 bg-red-950/90",
    info: "border-blue-500/50 bg-blue-950/90",
    warning: "border-amber-500/50 bg-amber-950/90",
  };

  return (
    <FeedbackCtx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[200] flex flex-col items-center justify-center gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300",
              "rounded-xl border px-6 py-4 shadow-2xl backdrop-blur-md",
              "flex items-start gap-3 max-w-md w-full",
              bgMap[item.type],
            )}
          >
            <div className="mt-0.5">{iconMap[item.type]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </FeedbackCtx.Provider>
  );
}

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
  // GM Permissions v2 — backend confirmado.
  "getGmPermissionCatalog",
  "getGmPermissionState",
  "grantGmPermission",
  "revokeGmPermission",
]);

const FALLBACK_UNSUPPORTED = new Set([
  "teleportRole",
  "summonRole",
  "prisonRole",
  "clearRolePk",
  "reviveRole",
  "resetRoleQuest",
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
  const toast = useFeedback();
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
    <FeedbackProvider><div className="flex h-full flex-col overflow-hidden bg-background">
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
            <TabsTrigger value="permissions" className="gap-2">
              <Shield className="h-3.5 w-3.5" />
              Permissões GM
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
          <TabsContent value="permissions" className="space-y-4">
            <GmPermissionsTab caps={caps} onActed={refreshHistory} />
          </TabsContent>
          <TabsContent value="history">
            <HistoryTab tick={historyTick} />
          </TabsContent>
        </Tabs>
      </main>
    </div></FeedbackProvider>
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
  const toast = useFeedback();
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
  const toast = useFeedback();
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
  const toast = useFeedback();
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
      title: "Kick Personagem",
      subtitle: "Desconecta o personagem online (roleid). Não bane a conta.",
      icon: LogOut,
      tone: "warning",
      render: () => <KickRoleCard caps={caps} onActed={onActed} />,
    },
    {
      id: "ban",
      action: "banAccount",
      title: "Banir Conta",
      subtitle: "Bane a conta inteira (userid). Afeta todos os personagens.",
      icon: Ban,
      tone: "danger",
      render: () => <BanAccountCard caps={caps} onActed={onActed} />,
    },
    {
      id: "unban",
      action: "unbanAccount",
      title: "Desbanir Conta",
      subtitle: "Remove o ban de uma conta (userid).",
      icon: ShieldOff,
      render: () => <UnbanAccountCard caps={caps} onActed={onActed} />,
    },
    {
      id: "mute-account",
      action: "muteAccount",
      title: "Mutar Conta",
      subtitle: "Silencia a conta (userid) — afeta todos os personagens dela.",
      icon: VolumeX,
      tone: "warning",
      render: () => (
        <MuteCard
          caps={caps}
          onActed={onActed}
          variant="account"
          action="muteAccount"
          title="Mutar Conta"
          subtitle="Silencia a conta (userid). Afeta todos os personagens dessa conta."
        />
      ),
    },
    {
      id: "mute-role",
      action: "muteRole",
      title: "Mutar Personagem",
      subtitle: "Silencia apenas um personagem específico (roleid).",
      icon: VolumeX,
      tone: "warning",
      render: () => (
        <MuteCard
          caps={caps}
          onActed={onActed}
          variant="role"
          action="muteRole"
          title="Mutar Personagem"
          subtitle="Silencia apenas um personagem específico (roleid)."
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
  const toast = useFeedback();
  const { active } = useServers();
  const [roleid, setRoleid] = useState("");
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const roleidNum = Number(roleid);
  const roleidValid = Number.isFinite(roleidNum) && roleidNum > 0;

  return (
    <GmCard
      icon={LogOut}
      title="Kick Personagem"
      subtitle="Desconecta o personagem online (não bane). Exige roleid — não confundir com userid da conta."
      action="kickRole"
      caps={caps}
      tone="warning"
    >
      <FieldRow label="Roleid (personagem)">
        <Input
          value={roleid}
          onChange={(e) => setRoleid(e.target.value)}
          placeholder="Ex.: 1024"
          inputMode="numeric"
        />
      </FieldRow>
      {!roleidValid && roleid.length > 0 && (
        <p className="text-[10px] text-destructive">
          roleid deve ser numérico (id do personagem, não da conta).
        </p>
      )}
      <FieldRow label="Motivo">
        <Input value={reason} onChange={(e) => setReason(e.target.value)} />
      </FieldRow>
      <Button
        variant="outline"
        className="w-full border-amber-500/50 text-amber-500"
        disabled={!roleidValid || !reason.trim()}
        onClick={() => setConfirmOpen(true)}
      >
        <LogOut className="h-3.5 w-3.5" />
        Kickar Personagem #{roleidValid ? roleidNum : "—"}
      </Button>
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        skipDryRun
        title={`Kick Personagem #${roleidNum}`}
        description={`Desconectar Personagem #${roleidNum}? Esta operação é imediata. Não afeta a conta.`}
        exec={async () => pwApi.kickRole({ roleid: roleidNum, reason })}
        onSuccess={(res) => {
          if (res.success) {
            toast.success(`Personagem #${roleidNum} desconectado`);
            void logAuditEvent({
              action: "gm.kickRole",
              tenantId: active?.id ?? null,
              target: `roleid:${roleidNum}`,
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
  const toast = useFeedback();
  const { active } = useServers();
  const [userid, setUserid] = useState("");
  const [roleid, setRoleid] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("3600");
  const [permanent, setPermanent] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [kickAfterBan, setKickAfterBan] = useState(true);
  const [kickConfirmOpen, setKickConfirmOpen] = useState(false);
  const [kicking, setKicking] = useState(false);

  const useridNum = Number(userid);
  const useridValid = Number.isFinite(useridNum) && useridNum > 0;
  const roleidNum = Number(roleid);
  const roleidValid = Number.isFinite(roleidNum) && roleidNum > 0;
  const durationNum = Number(duration);
  const durationValid = permanent || (Number.isFinite(durationNum) && durationNum > 0);

  const handleKick = async () => {
    setKicking(true);
    try {
      const res = await pwApi.kickRole({ roleid: roleidNum, reason: `Kick pós-ban: ${reason}` });
      if (res.success) {
        toast.success(`Personagem #${roleidNum} desconectado após ban`);
        void logAuditEvent({
          action: "gm.kickRole",
          tenantId: active?.id ?? null,
          target: `roleid:${roleidNum}`,
          status: "ok",
          metadata: { triggered_by: "post_ban" },
        });
      } else {
        toast.error(res.error ?? "Kick falhou — personagem pode já estar offline");
      }
    } catch {
      toast.error("Erro ao executar kick");
    } finally {
      setKicking(false);
      setKickConfirmOpen(false);
    }
  };

  return (
    <GmCard
      icon={Ban}
      title="Banir Conta"
      subtitle="Bane a CONTA (afeta todos os personagens). Exige userid — não confundir com roleid do personagem."
      action="banAccount"
      caps={caps}
      tone="danger"
    >
      <FieldRow label="Userid (conta)">
        <Input
          value={userid}
          onChange={(e) => setUserid(e.target.value)}
          placeholder="Ex.: 1234"
          inputMode="numeric"
        />
      </FieldRow>
      {!useridValid && userid.length > 0 && (
        <p className="text-[10px] text-destructive">
          userid deve ser numérico (id da conta, não do personagem).
        </p>
      )}
      <FieldRow label="Roleid (personagem online — opcional)">
        <Input
          value={roleid}
          onChange={(e) => setRoleid(e.target.value)}
          placeholder="Ex.: 1024"
          inputMode="numeric"
        />
      </FieldRow>
      {!roleidValid && roleid.length > 0 && (
        <p className="text-[10px] text-destructive">
          roleid deve ser numérico (id do personagem).
        </p>
      )}
      {roleidValid && (
        <div className="flex items-center justify-between rounded-md border border-border bg-card/40 px-2 py-1.5">
          <div className="flex-1">
            <Label className="text-[11px]">Kick após ban</Label>
            <p className="text-[10px] text-muted-foreground">
              Derrubar personagem #{roleidNum} após o ban
            </p>
          </div>
          <Switch checked={kickAfterBan} onCheckedChange={setKickAfterBan} />
        </div>
      )}
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
      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2">
        <p className="text-[10px] text-amber-400">
          <strong>Nota:</strong> Em servidores legados, o ban da conta pode valer apenas no próximo login.
          {roleidValid
            ? " Use o kick automático para remover a sessão atual."
            : " Informe o roleid acima para derrubar o personagem online após o ban."}
        </p>
      </div>
      <Button
        variant="destructive"
        className="w-full"
        disabled={!useridValid || !reason.trim() || !durationValid}
        onClick={() => setConfirmOpen(true)}
      >
        <Ban className="h-3.5 w-3.5" />
        Banir Conta #{useridValid ? useridNum : "—"}
        {roleidValid && kickAfterBan && " + Kick"}
      </Button>
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Banir Conta #${useridNum}`}
        description={`Banir Conta #${useridNum} ${
          permanent ? "PERMANENTEMENTE" : `por ${durationNum}s`
        }? Afeta todos os personagens dessa conta.${
          roleidValid && kickAfterBan
            ? ` Após o ban, o personagem #${roleidNum} será desconectado automaticamente.`
            : ""
        }`}
        exec={async (dryRun) =>
          pwApi.banAccount({
            userid: useridNum,
            reason,
            permanent,
            duration_seconds: permanent ? undefined : durationNum,
            dry_run: dryRun,
          })
        }
        onSuccess={(res) => {
          if (res.success) {
            const gm = res.gm_action;
            const backendLabel =
              gm?.account_forbid_backend === "forbid_table"
                ? "Backend: tabela forbid"
                : gm?.account_forbid_backend === "gamedbd"
                  ? "Backend: gamedbd"
                  : undefined;
            toast.success(
              gm?.message ?? `Conta #${useridNum} banida`,
              backendLabel ? { description: backendLabel } : undefined,
            );
            void logAuditEvent({
              action: "gm.banAccount",
              tenantId: active?.id ?? null,
              target: `userid:${useridNum}`,
              status: "ok",
              metadata: {
                permanent,
                duration_seconds: durationNum,
                account_forbid_backend: gm?.account_forbid_backend ?? null,
              },
            });
            onActed();
            // Auto-kick or prompt kick after successful ban
            if (roleidValid && kickAfterBan) {
              handleKick();
            } else if (roleidValid && !kickAfterBan) {
              setKickConfirmOpen(true);
            }
          } else {
            toast.error(res.error ?? "Falhou");
          }
        }}
        renderPreview={(res) => (
          <div className="space-y-1 text-xs">
            <Row label="state" value={res.state ?? "—"} />
            <Row label="ban_until" value={res.ban_until ?? "—"} />
            <Row label="seconds" value={res.seconds ?? "—"} />
            <DeliveryDetails gm={res.gm_action} variant="ban" />
          </div>
        )}
      />
      {/* Post-ban kick offer dialog (when kickAfterBan is off but roleid provided) */}
      <AlertDialog open={kickConfirmOpen} onOpenChange={setKickConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Derrubar personagem online?</AlertDialogTitle>
            <AlertDialogDescription>
              A conta #{useridNum} foi banida com sucesso. Deseja derrubar o personagem #{roleidNum} agora?
              Em servidores legados, o ban pode valer apenas no próximo login — o kick remove a sessão atual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={kicking}>Não, manter online</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleKick();
              }}
              disabled={kicking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {kicking ? "Kickando…" : `Kick #${roleidNum}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  const toast = useFeedback();
  const { active } = useServers();
  const [userid, setUserid] = useState("");
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const useridNum = Number(userid);
  const useridValid = Number.isFinite(useridNum) && useridNum > 0;

  return (
    <GmCard
      icon={ShieldOff}
      title="Desbanir Conta"
      subtitle="Remove o ban de uma CONTA. Exige userid — não confundir com roleid."
      action="unbanAccount"
      caps={caps}
    >
      <FieldRow label="Userid (conta)">
        <Input
          value={userid}
          onChange={(e) => setUserid(e.target.value)}
          placeholder="Ex.: 1234"
          inputMode="numeric"
        />
      </FieldRow>
      {!useridValid && userid.length > 0 && (
        <p className="text-[10px] text-destructive">
          userid deve ser numérico (id da conta).
        </p>
      )}
      <FieldRow label="Motivo (opcional)">
        <Input value={reason} onChange={(e) => setReason(e.target.value)} />
      </FieldRow>
      <Button
        onClick={() => setConfirmOpen(true)}
        disabled={!useridValid}
        className="w-full"
        variant="outline"
      >
        <ShieldOff className="h-3.5 w-3.5" />
        Desbanir Conta #{useridValid ? useridNum : "—"}
      </Button>
      <ConfirmActionDialog<SecurityActionResponse>
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Desbanir Conta #${useridNum}`}
        description={`Remover ban da Conta #${useridNum}?`}
        exec={async (dryRun) =>
          pwApi.unbanAccount({
            userid: useridNum,
            reason: reason || undefined,
            dry_run: dryRun,
          })
        }
        onSuccess={(res) => {
          if (res.success) {
            const gm = res.gm_action;
            const backendLabel =
              gm?.account_forbid_backend === "forbid_table"
                ? "Backend: tabela forbid"
                : gm?.account_forbid_backend === "gamedbd"
                  ? "Backend: gamedbd"
                  : undefined;
            toast.success(
              gm?.message ?? `Ban removido da Conta #${useridNum}`,
              backendLabel ? { description: backendLabel } : undefined,
            );
            void logAuditEvent({
              action: "gm.unbanAccount",
              tenantId: active?.id ?? null,
              target: `userid:${useridNum}`,
              status: "ok",
              metadata: {
                account_forbid_backend: gm?.account_forbid_backend ?? null,
              },
            });
            onActed();
          } else {
            toast.error(res.error ?? "Falhou");
          }
        }}
        renderPreview={(res) => (
          <div className="space-y-1 text-xs">
            <Row label="state" value={res.state ?? "—"} />
            <DeliveryDetails gm={res.gm_action} variant="unban" />
          </div>
        )}
      />
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
  const toast = useFeedback();
  const { active } = useServers();
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("3600");
  const [permanent, setPermanent] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isAccount = variant === "account";
  const idLabel = isAccount ? "Userid (conta)" : "Roleid (personagem)";
  const entityLabel = isAccount ? "Conta" : "Personagem";
  const fieldKey = isAccount ? "userid" : "roleid";
  const targetNum = Number(target);
  const targetValid = Number.isFinite(targetNum) && targetNum > 0;
  const durationNum = Number(duration);
  const durationValid = permanent || (Number.isFinite(durationNum) && durationNum > 0);
  const composedTitle = `Mutar ${entityLabel} #${targetValid ? targetNum : "—"}`;

  return (
    <GmCard
      icon={VolumeX}
      title={title}
      subtitle={subtitle}
      action={action}
      caps={caps}
      tone="warning"
    >
      <FieldRow label={idLabel}>
        <Input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder={isAccount ? "Ex.: 1234" : "Ex.: 1024"}
          inputMode="numeric"
        />
      </FieldRow>
      {!targetValid && target.length > 0 && (
        <p className="text-[10px] text-destructive">
          {isAccount
            ? "userid deve ser numérico (id da conta, não do personagem)."
            : "roleid deve ser numérico (id do personagem, não da conta)."}
        </p>
      )}
      {!targetValid && target.length === 0 && (
        <p className="text-[10px] text-muted-foreground">
          {isAccount
            ? "Ação de conta — informe o userid (não use roleid)."
            : "Ação de personagem — informe o roleid (não use userid)."}
        </p>
      )}
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
        disabled={!targetValid || !reason.trim() || !durationValid}
        onClick={() => setConfirmOpen(true)}
      >
        <VolumeX className="h-3.5 w-3.5" />
        {composedTitle}
      </Button>
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={composedTitle}
        description={`Silenciar ${entityLabel} #${targetNum} ${
          permanent ? "PERMANENTEMENTE" : `por ${durationNum}s`
        }? ${
          isAccount
            ? "A ação afeta a conta inteira (todos os personagens)."
            : "A ação afeta apenas este personagem."
        }`}
        exec={async (dryRun) => {
          const base = {
            reason,
            permanent,
            duration_seconds: permanent ? undefined : durationNum,
            dry_run: dryRun,
          };
          if (isAccount) {
            return pwApi.muteAccount({ userid: targetNum, ...base });
          }
          return pwApi.muteRole({ roleid: targetNum, ...base });
        }}
        onSuccess={(res) => {
          if (res.success) {
            toast.success(`${entityLabel} #${targetNum} silenciado`);
            void logAuditEvent({
              action: `gm.${action}`,
              tenantId: active?.id ?? null,
              target: `${fieldKey}:${targetNum}`,
              status: "ok",
              metadata: { permanent, duration_seconds: durationNum },
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
  const toast = useFeedback();
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
/* Permissões GM — checklist denso (espelha pwadmin)                           */
/* -------------------------------------------------------------------------- */

/**
 * Catálogo canônico das regras GM (fallback quando getGmPermissionCatalog
 * não está disponível ou não traz labels). Os labels seguem exatamente a
 * lista validada do servidor PW.
 */
const FALLBACK_RULE_CATALOG: GmPermissionRule[] = [
  { id: 0, label: "Alternar nome / ID", category: "info" },
  { id: 1, label: "Ocultar / ser Deus", category: "stealth" },
  { id: 2, label: "Online ou nao", category: "info" },
  { id: 3, label: "Conversa ou nao", category: "chat" },
  { id: 4, label: "Mover para o papel", category: "movement" },
  { id: 5, label: "Papel de busca", category: "info" },
  { id: 6, label: "Mover como sera", category: "movement" },
  { id: 7, label: "Mover para NPC", category: "movement" },
  { id: 8, label: "Mover para mapa (copiar)", category: "movement" },
  { id: 9, label: "Melhore a velocidade", category: "buff" },
  { id: 10, label: "Acompanhe o jogador", category: "tracking" },
  { id: 11, label: "Listar usuarios", category: "info" },
  { id: 100, label: "Forca offline", category: "moderation" },
  { id: 101, label: "Proibida conversa", category: "moderation" },
  { id: 102, label: "Proibir o comercio", category: "moderation" },
  { id: 103, label: "Proibir vender", category: "moderation" },
  { id: 104, label: "Transmissao", category: "comm" },
  { id: 105, label: "Desligar o servidor", category: "server" },
  { id: 200, label: "Invocar monstro", category: "spawn" },
  { id: 201, label: "Dispel convocacao", category: "spawn" },
  { id: 202, label: "Pretender", category: "misc" },
  { id: 203, label: "GM master", category: "elite" },
  { id: 204, label: "Duplo exp", category: "boost" },
  { id: 205, label: "Conexoes simultaneas (lambda)", category: "elite" },
  { id: 206, label: "Gerente de atividades", category: "events" },
  { id: 207, label: "Nenhum comercio", category: "moderation" },
  { id: 208, label: "Sem leilao", category: "moderation" },
  { id: 209, label: "Sem correspondencia", category: "moderation" },
  { id: 210, label: "Nenhuma faccao", category: "moderation" },
  { id: 211, label: "Dinheiro Duplo", category: "boost" },
  { id: 212, label: "Duplo Drop", category: "boost" },
  { id: 213, label: "Duplo Alma", category: "boost" },
  { id: 214, label: "Nenhum ponto de venda", category: "moderation" },
  { id: 215, label: "Interruptor PVP", category: "world" },
];

const TEMPLATE_DEFAULT_IDS = FALLBACK_RULE_CATALOG.map((r) => r.id);

function mergeRuleCatalog(
  serverRules?: GmPermissionRule[] | Record<string, GmPermissionRule>,
): GmPermissionRule[] {
  const map = new Map<number, GmPermissionRule>();
  for (const r of FALLBACK_RULE_CATALOG) map.set(r.id, r);
  if (Array.isArray(serverRules)) {
    for (const r of serverRules) {
      const merged = { ...map.get(r.id), ...r };
      map.set(r.id, merged);
    }
  } else if (serverRules && typeof serverRules === "object") {
    for (const [k, v] of Object.entries(serverRules)) {
      const id = Number(k);
      if (Number.isFinite(id)) {
        const merged = { ...map.get(id), ...v, id };
        map.set(id, merged);
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.id - b.id);
}

function ruleLabel(r: GmPermissionRule): string {
  return r.label ?? r.name ?? `Regra ${r.id}`;
}

function GmPermissionsTab({
  caps,
  onActed,
}: {
  caps: Map<string, GmCommandCapability>;
  onActed: () => void;
}) {
  const toast = useFeedback();
  const { active } = useServers();
  const [target, setTarget] = useState<{ kind: "userid" | "roleid"; value: string }>(
    { kind: "userid", value: "" },
  );
  const [reason, setReason] = useState("gm-permission-update");
  const [state, setState] = useState<GmPermissionStateResponse | null>(null);
  const [catalogRules, setCatalogRules] = useState<GmPermissionRule[]>(FALLBACK_RULE_CATALOG);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);
  const [lastResult, setLastResult] = useState<GmPermissionMutationResponse | null>(null);

  const supportedRead = isSupported("getGmPermissionState", caps);
  const supportedGrant = isSupported("grantGmPermission", caps);
  const supportedRevoke = isSupported("revokeGmPermission", caps);

  // Carrega catálogo uma vez (não bloqueante).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await pwApi.getGmPermissionCatalog();
        if (cancelled) return;
        setCatalogRules(mergeRuleCatalog(res.rule_catalog ?? res.rules));
      } catch (e) {
        if (e instanceof EndpointMissingError) {
          // Catálogo ausente → mantém fallback canônico (já setado).
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentRules = useMemo<Set<number>>(() => {
    const list =
      state?.permission_state?.current_rules ?? state?.current_rules ?? [];
    return new Set(list);
  }, [state]);

  const summary: GmPermissionSummary = state?.permission_summary ?? {};

  const loadState = useCallback(async () => {
    const v = Number(target.value);
    if (!v) {
      toast.error(`Informe ${target.kind} válido`);
      return;
    }
    setLoading(true);
    setMissing(false);
    setLastResult(null);
    try {
      const res = await pwApi.getGmPermissionState({ [target.kind]: v });
      setState(res);
      const cur = res.permission_state?.current_rules ?? res.current_rules ?? [];
      setSelected(new Set(cur));
      if (res.rule_catalog) setCatalogRules(mergeRuleCatalog(res.rule_catalog));
    } catch (e) {
      if (e instanceof EndpointMissingError) setMissing(true);
      else toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [target]);

  const toggleRule = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(catalogRules.map((r) => r.id)));
  const clearAll = () => setSelected(new Set());
  const selectTemplate = () => {
    const templ =
      state?.permission_state?.template_rules ??
      state?.template_rules ??
      TEMPLATE_DEFAULT_IDS;
    setSelected(new Set(templ));
  };

  const buildPayload = (rule_ids?: number[]) => {
    const v = Number(target.value);
    return {
      reason,
      [target.kind]: v,
      ...(rule_ids ? { rule_ids } : {}),
    } as const;
  };

  const runMutation = async (
    type: "grant" | "revoke",
    mode: "template" | "selected" | "diff",
  ) => {
    const v = Number(target.value);
    if (!v) {
      toast.error(`Informe ${target.kind} válido`);
      return;
    }
    if (!reason.trim()) {
      toast.error("Reason obrigatório");
      return;
    }
    let rule_ids: number[] | undefined;
    if (mode === "template") {
      rule_ids = undefined; // template completo
    } else if (mode === "selected") {
      rule_ids = Array.from(selected).sort((a, b) => a - b);
      if (rule_ids.length === 0) {
        toast.error("Selecione pelo menos uma regra");
        return;
      }
    } else {
      // diff: o que está selecionado mas NÃO está atual (grant) / o que está atual mas NÃO selecionado (revoke)
      if (type === "grant") {
        rule_ids = Array.from(selected).filter((id) => !currentRules.has(id));
      } else {
        rule_ids = Array.from(currentRules).filter((id) => !selected.has(id));
      }
      if (rule_ids.length === 0) {
        toast.info("Nada a aplicar — checklist já espelha o estado atual");
        return;
      }
    }
    setBusy(true);
    try {
      const fn = type === "grant" ? pwApi.grantGmPermission : pwApi.revokeGmPermission;
      const res = await fn(buildPayload(rule_ids));
      setLastResult(res);
      if (res.success) {
        const ins = res.inserted_rule_count ?? res.permission_change?.inserted?.length ?? 0;
        const del = res.deleted_rule_count ?? res.permission_change?.deleted?.length ?? 0;
        toast.success(
          `${type === "grant" ? "Grant" : "Revoke"} OK · +${ins} / -${del} regras`,
        );
        void logAuditEvent({
          action: `gm.${type}GmPermission`,
          tenantId: active?.id ?? null,
          target: `${target.kind}:${v}`,
          status: "ok",
          metadata: { mode, rule_ids, inserted: ins, deleted: del },
        });
        await loadState();
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

  if (!supportedRead && !supportedGrant && !supportedRevoke) {
    return <EndpointMissingNotice action="getGmPermissionState" />;
  }
  if (missing) return <EndpointMissingNotice action="getGmPermissionState" />;

  // Agrupa regras por categoria pra leitura densa.
  const grouped = catalogRules.reduce<Record<string, GmPermissionRule[]>>((acc, r) => {
    const k = r.category ?? "outros";
    (acc[k] = acc[k] ?? []).push(r);
    return acc;
  }, {});
  const categoryOrder = [
    "info",
    "stealth",
    "chat",
    "movement",
    "tracking",
    "buff",
    "boost",
    "spawn",
    "events",
    "comm",
    "moderation",
    "world",
    "elite",
    "server",
    "misc",
    "outros",
  ];
  const orderedCats = Object.keys(grouped).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b),
  );

  return (
    <div className="space-y-4">
      {/* Alvo + reason */}
      <Card className="bg-card/40">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <Shield className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-sm font-extrabold uppercase tracking-wider">
                  Permissões GM da conta
                </CardTitle>
                <CapBadge action="getGmPermissionState" caps={caps} />
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Espelha o checklist do pwadmin. Consulte por <code>userid</code> ou{" "}
                <code>roleid</code> e aplique grant/revoke total ou granular.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[140px_1fr_auto]">
            <Select
              value={target.kind}
              onValueChange={(v) =>
                setTarget((t) => ({ ...t, kind: v as "userid" | "roleid" }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="userid">userid</SelectItem>
                <SelectItem value="roleid">roleid</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={target.value}
              onChange={(e) => setTarget((t) => ({ ...t, value: e.target.value }))}
              placeholder={target.kind === "userid" ? "1216" : "1024"}
            />
            <Button onClick={() => void loadState()} disabled={loading || !supportedRead}>
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Consultar
            </Button>
          </div>
          <FieldRow label="Motivo (auditoria)">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </FieldRow>
        </CardContent>
      </Card>

      {/* Resumo */}
      {state && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryStat
            label="Regras atuais"
            value={summary.current_rule_count ?? currentRules.size}
            tone="default"
          />
          <SummaryStat
            label="Template"
            value={`${summary.matching_rule_count ?? 0} / ${summary.template_rule_count ?? "—"}`}
            tone={summary.fully_matches_template ? "success" : "warning"}
          />
          <SummaryStat
            label="Faltantes"
            value={summary.missing_rule_count ?? 0}
            tone={(summary.missing_rule_count ?? 0) > 0 ? "warning" : "success"}
          />
          <SummaryStat
            label="Status"
            value={
              summary.fully_matches_template
                ? "FULL GM"
                : summary.partially_matches_template
                  ? "PARCIAL"
                  : (summary.current_rule_count ?? currentRules.size) > 0
                    ? "CUSTOM"
                    : "SEM GM"
            }
            tone={
              summary.fully_matches_template
                ? "success"
                : summary.partially_matches_template
                  ? "warning"
                  : "default"
            }
          />
        </div>
      )}

      {/* Ações totais */}
      <Card className="border-purple-500/30 bg-card/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-extrabold uppercase tracking-widest text-purple-400">
            Template completo (todas as regras)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            onClick={() => void runMutation("grant", "template")}
            disabled={busy || !supportedGrant || !target.value}
            className="gap-1.5"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Grant TOTAL
          </Button>
          <Button
            variant="destructive"
            onClick={() => void runMutation("revoke", "template")}
            disabled={busy || !supportedRevoke || !target.value}
            className="gap-1.5"
          >
            <ShieldOff className="h-3.5 w-3.5" />
            Revoke TOTAL
          </Button>
          <span className="ml-auto text-[10px] italic text-muted-foreground">
            Aplica/remove o template GM inteiro de uma vez.
          </span>
        </CardContent>
      </Card>

      {/* Checklist granular */}
      <Card className="bg-card/40">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-sm font-extrabold uppercase tracking-wider">
              Regras GM ({selected.size}/{catalogRules.length} selecionadas)
            </CardTitle>
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="outline" onClick={selectTemplate}>
                Template
              </Button>
              <Button size="sm" variant="outline" onClick={selectAll}>
                Todas
              </Button>
              <Button size="sm" variant="outline" onClick={clearAll}>
                Limpar
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Marque as regras desejadas. Use{" "}
            <strong>Aplicar diff</strong> para sincronizar exatamente com o checklist.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[420px] pr-2">
            <div className="space-y-4">
              {orderedCats.map((cat) => (
                <div key={cat}>
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {cat}
                  </div>
                  <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                    {grouped[cat].map((r) => {
                      const isCurrent = currentRules.has(r.id);
                      const isSel = selected.has(r.id);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => toggleRule(r.id)}
                          className={cn(
                            "flex items-start gap-2 rounded-md border px-2 py-1.5 text-left transition-colors",
                            isSel
                              ? "border-purple-500/60 bg-purple-500/10"
                              : "border-border bg-card/40 hover:bg-card/60",
                          )}
                        >
                          <div
                            className={cn(
                              "mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border",
                              isSel
                                ? "border-purple-400 bg-purple-500 text-white"
                                : "border-muted-foreground/40",
                            )}
                          >
                            {isSel && <CheckCircle2 className="h-3 w-3" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <code className="font-mono text-[10px] text-muted-foreground">
                                {r.id}
                              </code>
                              <span className="truncate font-semibold text-foreground">
                                {ruleLabel(r)}
                              </span>
                            </div>
                            {isCurrent && (
                              <span className="text-[9px] font-bold uppercase tracking-widest text-success">
                                ativa
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              onClick={() => void runMutation("grant", "selected")}
              disabled={busy || !supportedGrant || !target.value}
              className="gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Grant selecionadas
            </Button>
            <Button
              variant="destructive"
              onClick={() => void runMutation("revoke", "selected")}
              disabled={busy || !supportedRevoke || !target.value}
              className="gap-1.5"
            >
              <ShieldOff className="h-3.5 w-3.5" />
              Revoke selecionadas
            </Button>
            <Button
              variant="outline"
              onClick={() => void runMutation("grant", "diff")}
              disabled={busy || !supportedGrant || !target.value}
              className="gap-1.5 border-purple-500/40 text-purple-400"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Aplicar diff (grant faltantes)
            </Button>
            <Button
              variant="outline"
              onClick={() => void runMutation("revoke", "diff")}
              disabled={busy || !supportedRevoke || !target.value}
              className="gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Aplicar diff (revoke extras)
            </Button>
            {busy && <Loader2 className="ml-2 h-4 w-4 animate-spin self-center" />}
          </div>
        </CardContent>
      </Card>

      {/* Resultado da última mutação */}
      {lastResult && (
        <Card className="border-success/40 bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-widest text-success">
              Último resultado
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1.5 text-[11px] sm:grid-cols-2">
            <Row label="inseridas" value={lastResult.inserted_rule_count ?? 0} />
            <Row label="removidas" value={lastResult.deleted_rule_count ?? 0} />
            <Row
              label="antes (count)"
              value={lastResult.permission_summary_before?.current_rule_count ?? "—"}
            />
            <Row
              label="depois (count)"
              value={lastResult.permission_summary_after?.current_rule_count ?? "—"}
            />
            {lastResult.warning && (
              <p className="col-span-full italic text-amber-500">⚠ {lastResult.warning}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "default" | "success" | "warning";
}) {
  const ring =
    tone === "success"
      ? "border-success/40 bg-success/5 text-success"
      : tone === "warning"
        ? "border-amber-500/40 bg-amber-500/5 text-amber-500"
        : "border-border bg-card/40 text-foreground";
  return (
    <div className={cn("rounded-lg border px-3 py-2", ring)}>
      <div className="text-[9px] font-bold uppercase tracking-widest opacity-70">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-base font-extrabold">{value}</div>
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

/** Extracts the flat ForbidDelivery from gm_action.delivery (ban has it flat, unban nests under .account) */
function extractDelivery(gm: GmActionBlock | undefined): ForbidDelivery | undefined {
  if (!gm?.delivery) return undefined;
  const d = gm.delivery as Record<string, unknown>;
  if ("account" in d && typeof d.account === "object" && d.account !== null) {
    return d.account as ForbidDelivery;
  }
  return gm.delivery as ForbidDelivery;
}

/** Renders backend label + delivery type_ids for ban/unban results */
function DeliveryDetails({
  gm,
  variant,
}: {
  gm?: GmActionBlock;
  variant: "ban" | "unban";
}) {
  if (!gm) return null;
  const backend = gm.account_forbid_backend;
  const delivery = extractDelivery(gm);
  const backendLabel =
    backend === "forbid_table"
      ? "tabela forbid"
      : backend === "gamedbd"
        ? "gamedbd"
        : backend ?? "—";

  return (
    <div className="space-y-1">
      {gm.message && <Row label="mensagem" value={gm.message} />}
      <Row
        label="backend"
        value={
          <span className="inline-flex items-center gap-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
            {backendLabel}
          </span>
        }
      />
      {delivery && (
        <>
          <Row label="before_type_ids" value={delivery.before_type_ids?.join(", ") ?? "—"} />
          <Row label="applied_type_ids" value={delivery.applied_type_ids?.join(", ") ?? "—"} />
          <Row label="after_type_ids" value={delivery.after_type_ids?.join(", ") ?? "—"} />
          {variant === "ban" && delivery.inserted_type_ids !== undefined && (
            <Row label="inserted_type_ids" value={delivery.inserted_type_ids?.join(", ") ?? "—"} />
          )}
          {variant === "unban" && delivery.deleted_type_ids !== undefined && (
            <Row label="deleted_type_ids" value={delivery.deleted_type_ids?.join(", ") ?? "—"} />
          )}
        </>
      )}
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

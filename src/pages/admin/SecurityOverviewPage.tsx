// /admin/security — Hub de Segurança v2 (com tabs).
//
// Estrutura:
//   - Visão geral  (cards rápidos para cada subárea)
//   - Moderação    (kick / ban / unban — manage_security)
//   - Histórico    (registro local + opcional VPS)
//   - Membros      (alias para /admin/members)
//   - Auditoria    (alias para /admin/audit)
//   - Configurações
//
// Quando estiver na rota raiz (/admin/security), renderiza o Overview
// "card grid" abaixo das tabs. Subpáginas usam <Outlet /> normalmente.
import { useMemo } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ChevronRight,
  History,
  Settings as SettingsIcon,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users as UsersIcon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { useServers } from "@/hooks/useServers";
import { NoActiveServerState } from "@/components/admin/NoActiveServerState";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "overview", label: "Visão geral", path: "/admin/security", icon: Shield, end: true },
  { value: "moderation", label: "Moderação", path: "/admin/security/moderation", icon: ShieldAlert },
  { value: "history", label: "Histórico", path: "/admin/security/history", icon: History },
  { value: "members", label: "Membros", path: "/admin/members", icon: UsersIcon },
  { value: "audit", label: "Auditoria", path: "/admin/audit", icon: ShieldCheck },
  { value: "settings", label: "Configurações", path: "/admin/security/settings", icon: SettingsIcon },
] as const;

const SecurityLayoutPage = () => {
  const { active } = useServers();
  const location = useLocation();

  const currentTab = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith("/admin/security/moderation")) return "moderation";
    if (p.startsWith("/admin/security/history")) return "history";
    if (p.startsWith("/admin/security/settings")) return "settings";
    if (p.startsWith("/admin/members")) return "members";
    if (p.startsWith("/admin/audit")) return "audit";
    return "overview";
  }, [location.pathname]);

  if (!active) return <NoActiveServerState />;

  const isOverview = location.pathname === "/admin/security";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="border-b border-border bg-card/60 px-6 py-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
              <Sparkles className="h-3 w-3" />
              v1 · moderação básica
            </div>
            <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground">
              Segurança
            </h1>
            <p className="text-xs text-muted-foreground">
              Quem tem acesso, o que cada um pode fazer e o que foi feito —
              agora com kick, ban e desbanir.
            </p>
          </div>
        </div>

        <Tabs value={currentTab} className="mt-4">
          <TabsList className="bg-background/40">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger key={t.value} value={t.value} asChild>
                  <NavLink to={t.path} end={"end" in t ? t.end : false} className="gap-2">
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </NavLink>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {isOverview ? <SecurityOverview /> : <Outlet />}
      </main>
    </div>
  );
};

export default SecurityLayoutPage;

/* -------------------------------------------------------------------------- */
/* Overview                                                                   */
/* -------------------------------------------------------------------------- */

function SecurityOverview() {
  const { can } = useServerPermissions();
  const { isSuperadmin } = useAuth();

  const cards = [
    {
      to: "/admin/security/moderation",
      icon: ShieldAlert,
      title: "Moderação",
      desc: "Kick em jogadores online, ban temporário ou permanente, desbanir contas.",
      enabled: isSuperadmin || can("manage_security"),
      tone: "destructive" as const,
    },
    {
      to: "/admin/security/history",
      icon: History,
      title: "Histórico de moderação",
      desc: "Quem fez kick/ban/unban, quando, em quem e por quê.",
      enabled: isSuperadmin || can("view_audit"),
      tone: "muted" as const,
    },
    {
      to: "/admin/members",
      icon: UsersIcon,
      title: "Membros & permissões",
      desc: "Convide novos editores, defina papéis e ajuste permissões finas.",
      enabled: isSuperadmin || can("manage_members"),
      tone: "muted" as const,
    },
    {
      to: "/admin/audit",
      icon: ShieldCheck,
      title: "Auditoria geral",
      desc: "Cada save, restore, clear, bulk apply e ação de moderação.",
      enabled: isSuperadmin || can("view_audit"),
      tone: "muted" as const,
    },
    {
      to: "/admin/security/settings",
      icon: SettingsIcon,
      title: "Configurações",
      desc: "Branding, conexão com a VPS e identidade visual do servidor.",
      enabled: true,
      tone: "muted" as const,
    },
  ];

  return (
    <div className="mx-auto grid max-w-3xl gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        const isCritical = c.tone === "destructive";
        const Card = (
          <div
            className={cn(
              "group flex items-center gap-4 rounded-xl border p-4 transition-smooth",
              isCritical
                ? "border-destructive/40 bg-destructive/10"
                : "border-border bg-card/60",
              c.enabled
                ? isCritical
                  ? "hover:border-destructive/70 hover:bg-destructive/15"
                  : "hover:border-primary/40 hover:bg-card/80"
                : "cursor-not-allowed opacity-50",
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background/40",
                isCritical
                  ? "border-destructive/40 text-destructive"
                  : "border-border text-primary",
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-foreground">{c.title}</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{c.desc}</p>
            </div>
            {c.enabled && (
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform group-hover:translate-x-1",
                  isCritical
                    ? "text-destructive/70 group-hover:text-destructive"
                    : "text-muted-foreground group-hover:text-primary",
                )}
              />
            )}
          </div>
        );
        return c.enabled ? (
          <Link key={c.to} to={c.to}>
            {Card}
          </Link>
        ) : (
          <div key={c.to}>{Card}</div>
        );
      })}
    </div>
  );
}

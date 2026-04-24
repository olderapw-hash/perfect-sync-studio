// Layout compartilhado do painel /admin (Fase 1 da nova arquitetura).
//
// Estrutura:
//   ┌─────────────────────────────────────────┐
//   │ Header global (logo · nome · servidor) │
//   ├─────────┬───────────────────────────────┤
//   │ Sidebar │ <Outlet />                    │
//   │ (nav)   │                               │
//   └─────────┴───────────────────────────────┘
//
// A sidebar agrupa as 6 grandes áreas do painel:
//   - Personagens Iniciais   (templates, kits, catálogo, backups)
//   - Personagens Reais      (busca/edição, histórico, restore)
//   - Correio & Recompensas  (placeholder Fase 2)
//   - Eventos                (placeholder Fase 2)
//   - Operação do Servidor   (placeholder Fase 2)
//   - Segurança              (membros, auditoria, configurações)
//
// Nada aqui faz fetch novo: cada subpágina usa os hooks/contextos
// já existentes (useClsconfig, useServerPermissions, etc).
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Boxes,
  CalendarDays,
  ChevronDown,
  LogOut,
  Mail,
  Server,
  Shield,
  ShieldCheck,
  UserCog,
  Users as UsersIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useServers } from "@/hooks/useServers";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { PendingInvitesBanner } from "@/components/PendingInvitesBanner";
import { TrialBanner } from "@/components/TrialBanner";
import { ProBadge } from "@/components/ProBadge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface NavChild {
  to: string;
  label: string;
  end?: boolean;
}

interface NavSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  basePath: string;
  children: NavChild[];
  /** Esconde a seção se essa permissão não existir. `undefined` = sempre mostra. */
  requirePermission?:
    | "manage_members"
    | "view_audit"
    | "manage_servers";
  /** Marca como "em breve" — visual diferente. */
  comingSoon?: boolean;
  /** Marca como recurso pago — exibe badge PRO no modo trial. */
  proInTrial?: boolean;
}

const SECTIONS: NavSection[] = [
  {
    id: "templates",
    label: "Personagens Iniciais",
    icon: UsersIcon,
    basePath: "/admin/templates",
    children: [
      { to: "/admin/templates", label: "Editor de templates", end: true },
      { to: "/admin/templates/kits", label: "Kits iniciais" },
      { to: "/admin/templates/catalogo", label: "Catálogo de itens" },
      { to: "/admin/templates/backups", label: "Backups" },
    ],
  },
  {
    id: "roles",
    label: "Personagens Reais",
    icon: UserCog,
    basePath: "/admin/roles",
    proInTrial: true,
    children: [
      { to: "/admin/roles", label: "Buscar / editar", end: true },
      { to: "/admin/roles/historico", label: "Histórico" },
      { to: "/admin/roles/backups", label: "Backups & restore" },
    ],
  },
  {
    id: "mail",
    label: "Correio & Recompensas",
    icon: Mail,
    basePath: "/admin/mail",
    comingSoon: true,
    proInTrial: true,
    children: [
      { to: "/admin/mail", label: "Visão geral", end: true },
      { to: "/admin/mail/templates", label: "Templates" },
      { to: "/admin/mail/history", label: "Histórico de envios" },
    ],
  },
  {
    id: "events",
    label: "Eventos",
    icon: CalendarDays,
    basePath: "/admin/events",
    comingSoon: true,
    proInTrial: true,
    children: [{ to: "/admin/events", label: "Visão geral", end: true }],
  },
  {
    id: "server",
    label: "Operação do Servidor",
    icon: Server,
    basePath: "/admin/server",
    children: [
      { to: "/admin/server", label: "Status", end: true },
      { to: "/admin/server/logs", label: "Logs" },
      { to: "/admin/server/actions", label: "Export & Reload" },
    ],
  },
  {
    id: "security",
    label: "Segurança",
    icon: Shield,
    basePath: "/admin/security",
    proInTrial: true,
    children: [
      { to: "/admin/security", label: "Visão geral", end: true },
      { to: "/admin/security/moderation", label: "Moderação" },
      { to: "/admin/security/history", label: "Histórico" },
      { to: "/admin/members", label: "Membros & permissões" },
      { to: "/admin/audit", label: "Auditoria" },
      { to: "/admin/security/settings", label: "Configurações" },
    ],
  },
];

export const AdminLayout = () => {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full bg-hero">
        <AdminNavSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <PendingInvitesBanner />
          <TrialBanner />
          <AdminTopBar />
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

/* -------------------------------------------------------------------------- */
/* Sidebar                                                                    */
/* -------------------------------------------------------------------------- */

const AdminNavSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { can } = useServerPermissions();
  const { isSuperadmin } = useAuth();

  const sections = SECTIONS.filter((s) => {
    if (!s.requirePermission) return true;
    if (isSuperadmin) return true;
    return can(s.requirePermission);
  });

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-card/40 backdrop-blur-md">
        {sections.map((section) => (
          <NavSectionGroup key={section.id} section={section} collapsed={collapsed} />
        ))}
      </SidebarContent>
    </Sidebar>
  );
};

const NavSectionGroup = ({
  section,
  collapsed,
}: {
  section: NavSection;
  collapsed: boolean;
}) => {
  const { isTrial } = useServerPermissions();
  const showProBadge = isTrial && section.proInTrial === true;
  const location = useLocation();
  const isActiveSection = location.pathname.startsWith(section.basePath);
  const [open, setOpen] = useState(isActiveSection);

  // Reabre automaticamente se a rota mudar para dentro deste grupo.
  useEffect(() => {
    if (isActiveSection) setOpen(true);
  }, [isActiveSection]);

  const Icon = section.icon;

  if (collapsed) {
    return (
      <SidebarGroup className="p-1">
        <Link
          to={section.children[0]?.to ?? section.basePath}
          title={section.label}
          className={cn(
            "flex h-9 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent",
            isActiveSection && "bg-sidebar-accent text-primary",
          )}
        >
          <Icon className="h-4 w-4" />
        </Link>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup className="p-0">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel
            className={cn(
              "flex h-10 cursor-pointer items-center gap-2 rounded-none border-b border-border px-3 text-xs font-extrabold uppercase tracking-wider hover:bg-sidebar-accent/50",
              isActiveSection ? "text-primary" : "text-foreground",
            )}
          >
            <Icon className="h-4 w-4 text-primary" />
            <span className="flex-1 truncate">{section.label}</span>
            {section.comingSoon && (
              <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[9px] tracking-tight text-muted-foreground">
                EM BREVE
              </span>
            )}
            {showProBadge && <ProBadge />}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                open ? "rotate-0" : "-rotate-90",
              )}
            />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent className="p-0">
            <SidebarMenu className="gap-0">
              {section.children.map((child) => (
                <SidebarMenuItem key={child.to}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={child.to}
                      end={child.end}
                      className={({ isActive }) =>
                        cn(
                          "flex h-9 items-center rounded-none border-l-2 border-transparent px-6 text-[12px] text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-foreground",
                          isActive &&
                            "border-primary bg-primary/10 font-semibold text-primary",
                        )
                      }
                    >
                      {child.label}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
};

/* -------------------------------------------------------------------------- */
/* Top bar                                                                    */
/* -------------------------------------------------------------------------- */

const AdminTopBar = () => {
  const { user, signOut, isSuperadmin } = useAuth();
  const { settings } = useAppSettings();
  const { active: activeServer } = useServers();

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-border bg-card/60 px-5 py-3 backdrop-blur-md">
      <SidebarTrigger className="-ml-1" />
      {settings.logo_url ? (
        <img src={settings.logo_url} alt="" className="h-6 w-6 rounded object-cover" />
      ) : (
        <Shield className="h-5 w-5 text-primary" />
      )}
      <div className="min-w-0">
        <h1 className="truncate text-sm font-extrabold uppercase tracking-wider text-foreground">
          {settings.server_name} · admin
        </h1>
        <p className="text-[11px] text-muted-foreground">
          Painel de operação — Perfect World
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {activeServer ? (
          <Link
            to="/servers"
            className="inline-flex max-w-[280px] items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-[11px] font-medium text-success transition-smooth hover:bg-success/20"
            title={`Servidor ativo: ${activeServer.server_name}\n${activeServer.pw_api_base_url ?? "(sem URL)"}`}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
            <span className="truncate font-semibold">{activeServer.server_name}</span>
            <span className="hidden truncate text-success/70 md:inline">
              · {activeServer.pw_api_base_url ?? "—"}
            </span>
          </Link>
        ) : (
          <Link
            to="/servers"
            className="inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-[11px] font-medium text-destructive transition-smooth hover:bg-destructive/20"
            title="Nenhum servidor ativo — abra Servidores para cadastrar/ativar"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
            Sem servidor ativo
          </Link>
        )}

        {isSuperadmin && (
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-500 transition-smooth hover:bg-amber-500/20"
            title="Gestão de usuários (superadmin)"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Usuários
          </Link>
        )}
        {user && (
          <span
            className="hidden text-[11px] text-muted-foreground sm:inline"
            title={user.email ?? ""}
          >
            {user.email}
          </span>
        )}
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-xs transition-smooth hover:border-destructive/50 hover:text-destructive"
          title="Sair"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
      </div>
    </header>
  );
};

// Workaround para ESLint que reclama de import não usado de Boxes
void Boxes;

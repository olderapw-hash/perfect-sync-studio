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
  Gauge,
  Globe,
  Key,
  LogOut,
  Settings,
  Shield,
  ShieldCheck,
  UserCog,
  Users as UsersIcon,
  Wand2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useServers } from "@/hooks/useServers";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { PendingInvitesBanner } from "@/components/PendingInvitesBanner";
import { TrialBanner } from "@/components/TrialBanner";
import { InstallerUpdateBanner } from "@/components/InstallerUpdateBanner";
import { ProBadge } from "@/components/ProBadge";
import { useInstallerRelease } from "@/hooks/useInstallerRelease";
import { Download } from "lucide-react";
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
    id: "control-center",
    label: "Central de Controle",
    icon: Gauge,
    basePath: "/admin/control-center",
    children: [
      { to: "/admin/control-center", label: "Dashboard NOC", end: true },
      { to: "/admin/server", label: "Operação (start/stop)", end: true },
      { to: "/admin/server/instances", label: "Instâncias" },
      { to: "/admin/server/logs", label: "Logs" },
      { to: "/admin/server/messages", label: "Mensagens & manutenção" },
      { to: "/admin/server/actions", label: "Export & reload" },
      { to: "/admin/server/history", label: "Histórico" },
    ],
  },
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
  // ⚠️ Correio & Recompensas removido: envio de item/gold agora vive
  // exclusivamente em GM Commander → Compensação. Templates e histórico
  // continuam acessíveis pelas rotas /admin/mail/templates e /admin/mail/history
  // (atalhos dentro do GM Commander), mas sem entrada paralela na sidebar.
  {
    id: "events",
    label: "Eventos",
    icon: CalendarDays,
    basePath: "/admin/events",
    proInTrial: true,
    children: [
      { to: "/admin/events", label: "Visão geral", end: true },
      { to: "/admin/events/ingame", label: "Eventos ingame" },
    ],
  },
  {
    id: "gm",
    label: "GM Commander",
    icon: Wand2,
    basePath: "/admin/gm",
    proInTrial: true,
    children: [
      { to: "/admin/gm", label: "Painel operacional", end: true },
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
      // ⚠️ "Moderação" removida: kick/ban/unban/mute estão em GM Commander → Moderação.
      { to: "/admin/security/history", label: "Histórico" },
      { to: "/admin/members", label: "Membros & permissões" },
      { to: "/admin/audit", label: "Auditoria" },
      { to: "/admin/security/settings", label: "Configurações" },
    ],
  },
];

/**
 * Seções exclusivas do superadmin — configuração da plataforma/site,
 * separadas das seções operacionais do servidor pra não misturar.
 */
const SUPERADMIN_SECTIONS: NavSection[] = [
  {
    id: "site",
    label: "Site (Landing)",
    icon: Globe,
    basePath: "/admin/site",
    children: [{ to: "/admin/site", label: "Editar conteúdo", end: true }],
  },
  {
    id: "installer",
    label: "Installer / Releases",
    icon: Download,
    basePath: "/admin/installer",
    children: [{ to: "/admin/installer", label: "Publicar versão", end: true }],
  },
  {
    id: "licenses",
    label: "Licenças",
    icon: Key,
    basePath: "/admin/licenses",
    children: [{ to: "/admin/licenses", label: "Gerenciar licenças", end: true }],
  },
  {
    id: "operators",
    label: "Gestão de Operadores",
    icon: UserCog,
    basePath: "/admin/operators",
    children: [{ to: "/admin/operators", label: "Gerenciar operadores", end: true }],
  },
];

export const AdminLayout = () => {
  const { settings } = useAppSettings();
  const bgStyle = settings.background_url
    ? {
        backgroundImage: `linear-gradient(hsl(var(--background) / 0.85), hsl(var(--background) / 0.92)), url(${settings.background_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed" as const,
      }
    : undefined;

  return (
    <SidebarProvider defaultOpen>
      <div
        className={cn(
          "admin-cursor flex h-screen w-full",
          !settings.background_url && "bg-hero",
          // Quando há background customizado, deixa as superfícies das páginas
          // semi-transparentes para que ele apareça através de bg-background / bg-card.
          settings.background_url && "admin-bg-transparent",
        )}
        style={bgStyle}
      >
        <AdminNavSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <PendingInvitesBanner />
          <TrialBanner />
          <InstallerUpdateBanner />
          <AdminTopBar />
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
          <AdminFooter />
        </div>
      </div>
    </SidebarProvider>
  );
};

const AdminFooter = () => {
  const { settings } = useAppSettings();
  const text = settings.footer_text?.trim() || "Desenvolvido por:";
  const label = settings.footer_link_label?.trim() || "Sath~";
  const url = settings.footer_link_url?.trim() || "https://discord.gg/lovable-dev";

  return (
    <footer className="flex items-center justify-center gap-2 border-t border-border/60 bg-card/40 px-5 py-2 text-[11px] text-muted-foreground backdrop-blur-md">
      <span>{text}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-[#1f1a3a] px-2 py-0.5 font-semibold text-[#c9c2ff] transition-colors hover:border-[#5865F2]/60 hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-[#5865F2]" aria-hidden="true">
          <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a13.65 13.65 0 0 0-.617 1.265 18.27 18.27 0 0 0-5.482 0A13.46 13.46 0 0 0 9.84 3a19.74 19.74 0 0 0-3.76 1.37C2.36 9.92 1.38 15.33 1.86 20.66a19.94 19.94 0 0 0 6.04 3.05c.49-.66.92-1.36 1.29-2.1a12.86 12.86 0 0 1-2.04-.98c.17-.13.34-.26.5-.4 3.91 1.81 8.13 1.81 12 0 .16.14.33.27.5.4-.65.39-1.34.72-2.05.98.37.74.8 1.44 1.29 2.1a19.9 19.9 0 0 0 6.05-3.05c.56-6.18-.96-11.54-4.12-16.29ZM8.52 17.36c-1.2 0-2.19-1.1-2.19-2.45 0-1.36.97-2.46 2.19-2.46 1.23 0 2.21 1.11 2.19 2.46 0 1.35-.97 2.45-2.19 2.45Zm6.96 0c-1.2 0-2.18-1.1-2.18-2.45 0-1.36.96-2.46 2.18-2.46 1.23 0 2.21 1.11 2.19 2.46 0 1.35-.96 2.45-2.19 2.45Z"/>
        </svg>
        {label}
      </a>
    </footer>
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

        {isSuperadmin && (
          <>
            {!collapsed && (
              <div className="mt-2 border-t border-border/60 px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Plataforma
              </div>
            )}
            {SUPERADMIN_SECTIONS.map((section) => (
              <NavSectionGroup key={section.id} section={section} collapsed={collapsed} />
            ))}
          </>
        )}

        {/* Minha Conta — sempre visível, no fim da sidebar */}
        <div className="mt-auto border-t border-border/60 p-2">
          <NavLink
            to="/admin/account"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-foreground",
                isActive && "bg-primary/10 font-semibold text-primary",
                collapsed && "justify-center px-0",
              )
            }
            title="Minha Conta"
          >
            <Settings className="h-4 w-4" />
            {!collapsed && <span>Minha Conta</span>}
          </NavLink>
        </div>
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
  const isActiveSection =
    location.pathname.startsWith(section.basePath) ||
    section.children.some((c) =>
      c.end ? location.pathname === c.to : location.pathname.startsWith(c.to),
    );
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
  const { current: currentRelease, hasUpdate } = useInstallerRelease();

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

        <Link
          to="/install"
          className="relative inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-smooth hover:bg-primary/20"
          title={
            currentRelease
              ? `Installer da API · v${currentRelease.version}${hasUpdate ? " (nova versão!)" : ""}`
              : "Instalar API no servidor"
          }
        >
          <Download className="h-3.5 w-3.5" />
          Install
          {currentRelease && (
            <span className="rounded bg-primary/20 px-1 py-0.5 text-[9px] font-mono">
              v{currentRelease.version}
            </span>
          )}
          {hasUpdate && (
            <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
          )}
        </Link>

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

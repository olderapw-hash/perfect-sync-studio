// Layout dedicado da área Free Trial.
//
// Estrutura intencionalmente mais enxuta que o AdminLayout:
//   - Sem sidebar de áreas Pro (Mail, Segurança, Personagens Reais...).
//   - Header destacando que o usuário está em modo gratuito.
//   - Botão de upgrade sempre visível.
//
// Aqui só liberamos o que o trial pode fazer hoje:
// edição manual de templates iniciais (CLS) + visualização do catálogo.
import { Link, NavLink, Outlet } from "react-router-dom";
import { LogOut, Shield, Sparkles, Boxes } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useServers } from "@/hooks/useServers";
import { PwaInstallButton } from "@/components/PwaInstallButton";
import { cn } from "@/lib/utils";

const TRIAL_NAV = [
  { to: "/trial/templates", label: "Templates iniciais", icon: Boxes },
];

export const TrialLayout = () => {
  const { user, signOut } = useAuth();
  const { settings } = useAppSettings();
  const { active: activeServer } = useServers();

  return (
    <div className="flex h-screen w-full flex-col bg-hero">
      {/* Faixa de modo trial — visualmente distinta do /admin. */}
      <div className="flex flex-wrap items-center gap-2 border-b border-primary/40 bg-primary/10 px-3 py-2 text-[11px] sm:gap-3 sm:px-4 sm:text-[12px]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          <Sparkles className="h-3 w-3" />
          Free Trial
        </span>
        <span className="hidden flex-1 text-foreground/90 sm:inline">
          Modo <strong>gratuito</strong>: você só pode editar manualmente os{" "}
          <strong>templates iniciais</strong>. Recursos Pro ficam disponíveis após
          o upgrade.
        </span>
        <span className="flex-1 text-foreground/90 sm:hidden">
          Modo <strong>gratuito</strong> · só templates iniciais
        </span>
        <Link
          to="/pricing"
          className="ml-auto rounded-md bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground hover:brightness-110 sm:px-3 sm:text-[11px]"
        >
          Upgrade
        </Link>
      </div>

      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-card/60 px-3 py-2 backdrop-blur-md sm:gap-3 sm:px-5 sm:py-3">
        {settings.logo_url ? (
          <img src={settings.logo_url} alt="" className="h-6 w-6 rounded object-cover" />
        ) : (
          <Shield className="h-5 w-5 text-primary" />
        )}
        <div className="min-w-0 flex-1 sm:flex-initial">
          <h1 className="truncate text-xs font-extrabold uppercase tracking-wider text-foreground sm:text-sm">
            {settings.server_name} · trial
          </h1>
          <p className="hidden text-[11px] text-muted-foreground sm:block">
            Acesso gratuito · edição manual de templates
          </p>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {activeServer ? (
            <Link
              to="/servers"
              className="inline-flex max-w-[140px] items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2 py-1 text-[10px] font-medium text-success transition-smooth hover:bg-success/20 sm:max-w-[280px] sm:gap-2 sm:px-3 sm:text-[11px]"
              title={`Servidor ativo: ${activeServer.server_name}`}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
              <span className="truncate font-semibold">{activeServer.server_name}</span>
            </Link>
          ) : (
            <Link
              to="/servers"
              className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-2 py-1 text-[10px] font-medium text-destructive transition-smooth hover:bg-destructive/20 sm:gap-2 sm:px-3 sm:text-[11px]"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
              <span className="hidden sm:inline">Sem servidor ativo</span>
              <span className="sm:hidden">Sem server</span>
            </Link>
          )}
          <PwaInstallButton size="sm" />
          {user && (
            <span
              className="hidden text-[11px] text-muted-foreground lg:inline"
              title={user.email ?? ""}
            >
              {user.email}
            </span>
          )}
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2 py-1.5 text-[11px] transition-smooth hover:border-destructive/50 hover:text-destructive sm:gap-2 sm:px-3 sm:py-2 sm:text-xs"
            title="Sair"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Sub-nav minimalista */}
      <nav className="flex items-center gap-1 overflow-x-auto border-b border-border bg-card/40 px-2 py-1 sm:px-3">
        {TRIAL_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
                  isActive && "bg-primary/10 text-primary",
                )
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

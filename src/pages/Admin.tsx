import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Database,
  Image as ImageIcon,
  Loader2,
  LogOut,
  RefreshCw,
  Shield,
  Archive,
  Search,
  UserCog,
  FileCog,
  Users as UsersIcon,
  Settings as SettingsIcon,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useClsconfig } from "@/hooks/useClsconfig";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { PendingInvitesBanner } from "@/components/PendingInvitesBanner";
import { ClsconfigEditor } from "@/components/admin/ClsconfigEditor";
import { ItemCatalogManager } from "@/components/admin/ItemCatalogManager";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { HistoryDrawer } from "@/components/admin/HistoryDrawer";
import { BackupsDialog } from "@/components/admin/BackupsDialog";
import { ItemCatalogAdvancedDialog } from "@/components/admin/ItemCatalogAdvancedDialog";
import { RolePersonagemTab } from "@/components/admin/RolePersonagemTab";
import { ClassPhotosTab } from "@/components/admin/ClassPhotosTab";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type AdminMode = "template" | "role" | "photos" | "settings";

const Admin = () => {
  const { data, raw, loading, error, reload } = useClsconfig();
  const { user, signOut, isSuperadmin } = useAuth();
  const { settings } = useAppSettings();
  const { can } = useServerPermissions();
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<AdminMode>("template");
  const [backupsOpen, setBackupsOpen] = useState(false);
  const [searchItemOpen, setSearchItemOpen] = useState(false);

  useEffect(() => {
    if (data?.entries.length && !selected) {
      setSelected(data.entries[0].key_hex);
    }
  }, [data, selected]);

  const entry = data?.entries.find((e) => e.key_hex === selected) ?? null;
  const isEmpty = !loading && !error && data && data.entries.length === 0;

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full bg-hero">
        {mode === "template" && (
          <AdminSidebar
            entries={data?.entries ?? []}
            classes={data?.classes ?? []}
            usedClasses={data?.used_classes ?? []}
            selectedKey={selected}
            onSelect={setSelected}
            loading={loading}
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <PendingInvitesBanner />
          {/* Top bar */}
          <header className="flex flex-wrap items-center gap-3 border-b border-border bg-card/60 px-5 py-3 backdrop-blur-md">
            {mode === "template" && <SidebarTrigger className="-ml-1" />}
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="" className="h-6 w-6 rounded object-cover" />
            ) : (
              <Shield className="h-5 w-5 text-primary" />
            )}
            <div>
              <h1 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
                {settings.server_name} · admin
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Editor de templates iniciais — Perfect World
              </p>
            </div>

            {/* Mode tabs (Template CLS vs Personagem Existente) */}
            <div className="ml-4 flex items-center gap-1 rounded-md border border-border bg-card/40 p-1">
              <ModeButton
                active={mode === "template"}
                onClick={() => setMode("template")}
                icon={<FileCog className="h-3.5 w-3.5" />}
                label="Template CLS"
              />
              <ModeButton
                active={mode === "role"}
                onClick={() => setMode("role")}
                icon={<UserCog className="h-3.5 w-3.5" />}
                label="Personagem Existente"
                danger
              />
              <ModeButton
                active={mode === "photos"}
                onClick={() => setMode("photos")}
                icon={<ImageIcon className="h-3.5 w-3.5" />}
                label="Fotos das Classes"
              />
              {(isSuperadmin || can("manage_servers")) && (
                <ModeButton
                  active={mode === "settings"}
                  onClick={() => setMode("settings")}
                  icon={<SettingsIcon className="h-3.5 w-3.5" />}
                  label="Configurações"
                />
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="rounded-full bg-success/15 px-3 py-1 text-[11px] font-medium text-success">
                Edge proxy ativo
              </span>
              <button
                onClick={() => setSearchItemOpen(true)}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-xs transition-smooth hover:border-primary/50"
                title="Buscar item no catálogo"
              >
                <Search className="h-3.5 w-3.5" />
                Item
              </button>
              <button
                onClick={() => setBackupsOpen(true)}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-xs transition-smooth hover:border-primary/50"
                title="Listar backups (restore desabilitado)"
              >
                <Archive className="h-3.5 w-3.5" />
                Backups
              </button>
              <ItemCatalogManager />
              <HistoryDrawer />
              {mode === "template" && (
                <button
                  onClick={reload}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-xs transition-smooth hover:border-primary/50 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Recarregar
                </button>
              )}
              {can("manage_servers") && (
                <Link
                  to="/servers"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-xs transition-smooth hover:border-primary/50"
                  title="Meus servidores VPS"
                >
                  <UsersIcon className="h-3.5 w-3.5" />
                  Servidores
                </Link>
              )}
              {can("manage_members") && (
                <Link
                  to="/members"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-xs transition-smooth hover:border-primary/50"
                  title="Gerenciar membros do servidor"
                >
                  <UsersIcon className="h-3.5 w-3.5" />
                  Membros
                </Link>
              )}
              {can("view_audit") && (
                <Link
                  to="/audit"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-xs transition-smooth hover:border-primary/50"
                  title="Logs de auditoria"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Auditoria
                </Link>
              )}
              {isSuperadmin && (
                <Link
                  to="/admin/users"
                  className="inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-500 transition-smooth hover:bg-amber-500/20"
                  title="Gestão de usuários (superadmin)"
                >
                  <UsersIcon className="h-3.5 w-3.5" />
                  Usuários
                </Link>
              )}
              {user && (
                <span className="hidden text-[11px] text-muted-foreground sm:inline" title={user.email ?? ""}>
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

          {/* Main content */}
          <section className="flex-1 overflow-hidden">
            {mode === "role" ? (
              <div className="h-full overflow-y-auto p-6">
                <RolePersonagemTab />
              </div>
            ) : mode === "photos" ? (
              <div className="h-full overflow-y-auto p-6">
                <ClassPhotosTab />
              </div>
            ) : mode === "settings" ? (
              <div className="h-full overflow-y-auto p-6">
                <SettingsTab />
              </div>
            ) : error ? (
              <div className="m-6 overflow-auto rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  Erro ao carregar clsconfig
                </div>
                <pre className="mt-2 whitespace-pre-wrap break-all rounded-md bg-background/40 p-3 text-xs text-destructive/90">
                  {error}
                </pre>
                <p className="mt-3 text-xs text-destructive/70">
                  Endpoint: <code className="font-mono">/apicls/api_cls.php?action=getClsconfig</code>{" "}
                  — secret enviado server-side via header{" "}
                  <code className="font-mono">x-sync-secret</code>. Confirme{" "}
                  <code className="font-mono">PW_API_BASE_URL</code> (domínio/base) e{" "}
                  <code className="font-mono">PW_API_SECRET</code> nas configurações do backend.
                </p>
              </div>
            ) : loading && !data ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : isEmpty ? (
              <div className="m-6 overflow-auto rounded-xl border border-border bg-card/40 p-6 text-sm">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Database className="h-4 w-4 text-primary" />
                  Nenhum template retornado (count = 0)
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  O endpoint <code className="font-mono">/apicls/api_cls.php?action=getClsconfig</code>{" "}
                  respondeu com sucesso, mas <code className="font-mono">entries</code> está vazio.
                </p>
                <div className="mt-4">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    JSON bruto (debug)
                  </div>
                  <pre className="max-h-[60vh] overflow-auto rounded-md bg-background/60 p-3 font-mono text-[11px] text-foreground/80">
                    {JSON.stringify(raw, null, 2)}
                  </pre>
                </div>
              </div>
            ) : entry ? (
              <ClsconfigEditor entry={entry} allEntries={data?.entries ?? []} onReload={reload} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Selecione um template à esquerda para editar.
              </div>
            )}
          </section>
        </div>
      </div>

      <BackupsDialog open={backupsOpen} onOpenChange={setBackupsOpen} onRestored={reload} />
      <ItemCatalogAdvancedDialog open={searchItemOpen} onOpenChange={setSearchItemOpen} />
    </SidebarProvider>
  );
};

const ModeButton = ({
  active,
  onClick,
  icon,
  label,
  danger,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-smooth",
      active
        ? danger
          ? "bg-destructive text-destructive-foreground shadow-sm"
          : "bg-primary text-primary-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground",
    )}
  >
    {icon}
    {label}
  </button>
);

export default Admin;

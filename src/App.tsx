import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ItemCatalogProvider } from "@/context/ItemCatalogContext";
import { AuthProvider } from "@/hooks/useAuth";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import { ServerPermissionsProvider } from "@/hooks/useServerPermissions";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SuperadminRoute } from "@/components/SuperadminRoute";
import { TrialRoute } from "@/components/TrialRoute";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { TrialLayout } from "@/components/trial/TrialLayout";
import TrialTemplatesPage from "./pages/trial/TrialTemplatesPage.tsx";
import AdminUsers from "./pages/AdminUsers.tsx";
import Auth from "./pages/Auth.tsx";
import Landing from "./pages/Landing.tsx";
import Pricing from "./pages/Pricing.tsx";
import CheckoutSuccess from "./pages/CheckoutSuccess.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Servers from "./pages/Servers.tsx";
import Install from "./pages/Install.tsx";
import Audit from "./pages/Audit.tsx";
import Members from "./pages/Members.tsx";
import Invites from "./pages/Invites.tsx";
import NotFound from "./pages/NotFound.tsx";

// Páginas internas do painel /admin (Fase 1 da nova arquitetura).
import TemplatesPage from "./pages/admin/TemplatesPage.tsx";
import TemplatesKitsPage from "./pages/admin/TemplatesKitsPage.tsx";
import TemplatesCatalogPage from "./pages/admin/TemplatesCatalogPage.tsx";
import TemplatesBackupsPage from "./pages/admin/TemplatesBackupsPage.tsx";
import RolesPage from "./pages/admin/RolesPage.tsx";
import RolesHistoryPage from "./pages/admin/RolesHistoryPage.tsx";
import RolesBackupsPage from "./pages/admin/RolesBackupsPage.tsx";
// MailPage removido da sidebar — envio consolidado em GM Commander.
import MailTemplatesPage from "./pages/admin/MailTemplatesPage.tsx";
import MailHistoryPage from "./pages/admin/MailHistoryPage.tsx";
import EventsPage from "./pages/admin/EventsPage.tsx";
import IngameEventsPage from "./pages/admin/IngameEventsPage.tsx";
import ServerOpsPage from "./pages/admin/ServerOpsPage.tsx";
import ControlCenterPage from "./pages/admin/ControlCenterPage.tsx";
import ServerLogsPage from "./pages/admin/ServerLogsPage.tsx";
import ServerActionsPage from "./pages/admin/ServerActionsPage.tsx";
import ServerMessagesPage from "./pages/admin/ServerMessagesPage.tsx";
import ServerHistoryPage from "./pages/admin/ServerHistoryPage.tsx";
import InstancesPage from "./pages/admin/InstancesPage.tsx";
import SecurityOverviewPage from "./pages/admin/SecurityOverviewPage.tsx";
// SecurityModerationPage removida — kick/ban/mute consolidados em GM Commander.
import SecurityHistoryPage from "./pages/admin/SecurityHistoryPage.tsx";
import SecuritySettingsPage from "./pages/admin/SecuritySettingsPage.tsx";
import SitePage from "./pages/admin/SitePage.tsx";
import InstallerReleasesPage from "./pages/admin/InstallerReleasesPage.tsx";
import GmCommanderPage from "./pages/admin/GmCommanderPage.tsx";
import LicensesPage from "./pages/admin/LicensesPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppSettingsProvider>
            <ServerPermissionsProvider>
              <ItemCatalogProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/checkout/success" element={<CheckoutSuccess />} />
                  <Route
                    path="/onboarding"
                    element={
                      <ProtectedRoute requireAdmin={false}>
                        <Onboarding />
                      </ProtectedRoute>
                    }
                  />

                  {/* /admin — layout compartilhado com sidebar lateral.
                      Todas as subpáginas herdam header + sidebar via <Outlet/>. */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin requireSubscription>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    {/* Landing do /admin → templates (área principal). */}
                    <Route index element={<Navigate to="/admin/templates" replace />} />

                    {/* Personagens Iniciais */}
                    <Route path="templates" element={<TemplatesPage />} />
                    <Route path="templates/kits" element={<TemplatesKitsPage />} />
                    <Route path="templates/catalogo" element={<TemplatesCatalogPage />} />
                    <Route path="templates/backups" element={<TemplatesBackupsPage />} />

                    {/* Personagens Reais */}
                    <Route path="roles" element={<RolesPage />} />
                    <Route path="roles/historico" element={<RolesHistoryPage />} />
                    <Route path="roles/backups" element={<RolesBackupsPage />} />

                    {/* Correio & Recompensas — formulário de envio consolidado em GM Commander.
                        /admin/mail vira atalho. Templates e histórico continuam disponíveis
                        como recursos auxiliares (presets e log de envios). */}
                    <Route path="mail" element={<Navigate to="/admin/gm?tab=compensation" replace />} />
                    <Route path="mail/templates" element={<MailTemplatesPage />} />
                    <Route path="mail/history" element={<MailHistoryPage />} />

                    {/* Eventos */}
                    <Route path="events" element={<EventsPage />} />
                    <Route path="events/ingame" element={<IngameEventsPage />} />

                    {/* Central de Controle (NOC) — dashboard premium do snapshot. */}
                    <Route path="control-center" element={<ControlCenterPage />} />

                    {/* Operação do Servidor (start/stop/restart + instâncias). */}
                    <Route path="server" element={<ServerOpsPage />}>
                      <Route path="instances" element={<InstancesPage />} />
                      <Route path="logs" element={<ServerLogsPage />} />
                      <Route path="messages" element={<ServerMessagesPage />} />
                      <Route path="actions" element={<ServerActionsPage />} />
                      <Route path="history" element={<ServerHistoryPage />} />
                    </Route>

                    {/* GM Commander — compensação, moderação e comunicação. */}
                    <Route path="gm" element={<GmCommanderPage />} />

                    {/* Segurança v1 — moderação operacional (kick/ban/mute) consolidada em GM Commander. */}
                    <Route path="security" element={<SecurityOverviewPage />}>
                      <Route
                        path="moderation"
                        element={<Navigate to="/admin/gm?tab=moderation" replace />}
                      />
                      <Route path="history" element={<SecurityHistoryPage />} />
                      <Route path="settings" element={<SecuritySettingsPage />} />
                    </Route>

                    {/* Site (landing pública) — apenas superadmin (guard interno). */}
                    <Route
                      path="site"
                      element={
                        <SuperadminRoute>
                          <SitePage />
                        </SuperadminRoute>
                      }
                    />
                    {/* Installer / Releases — apenas superadmin. */}
                    <Route
                      path="installer"
                      element={
                        <SuperadminRoute>
                          <InstallerReleasesPage />
                        </SuperadminRoute>
                      }
                    />
                    {/* Licenças de instalação — apenas superadmin. */}
                    <Route
                      path="licenses"
                      element={
                        <SuperadminRoute>
                          <LicensesPage />
                        </SuperadminRoute>
                      }
                    />
                  </Route>

                  {/* /trial — área enxuta para usuários no Free Trial.
                      Só libera edição manual de templates iniciais. */}
                  <Route
                    path="/trial"
                    element={
                      <TrialRoute>
                        <TrialLayout />
                      </TrialRoute>
                    }
                  >
                    <Route index element={<Navigate to="/trial/templates" replace />} />
                    <Route path="templates" element={<TrialTemplatesPage />} />
                  </Route>

                  {/* Members e Audit têm header próprio com botão "voltar".
                      Mantemos como rotas top-level (acessíveis também pelo
                      grupo "Segurança" da sidebar via Link normal). */}
                  <Route
                    path="/admin/members"
                    element={
                      <ProtectedRoute requireAdmin={false}>
                        <Members />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/audit"
                    element={
                      <ProtectedRoute requireAdmin>
                        <Audit />
                      </ProtectedRoute>
                    }
                  />
                  {/* Aliases legados (links antigos continuam válidos). */}
                  <Route path="/members" element={<Navigate to="/admin/members" replace />} />
                  <Route path="/audit" element={<Navigate to="/admin/audit" replace />} />

                  <Route
                    path="/admin/users"
                    element={
                      <SuperadminRoute>
                        <AdminUsers />
                      </SuperadminRoute>
                    }
                  />
                  <Route
                    path="/servers"
                    element={
                      <ProtectedRoute requireAdmin={false}>
                        <Servers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/invites"
                    element={
                      <ProtectedRoute requireAdmin={false}>
                        <Invites />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/install" element={<Install />} />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ItemCatalogProvider>
            </ServerPermissionsProvider>
          </AppSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

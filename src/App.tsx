import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ItemCatalogProvider } from "@/context/ItemCatalogContext";
import { AuthProvider } from "@/hooks/useAuth";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SuperadminRoute } from "@/components/SuperadminRoute";
import Admin from "./pages/Admin.tsx";
import AdminUsers from "./pages/AdminUsers.tsx";
import Auth from "./pages/Auth.tsx";
import Landing from "./pages/Landing.tsx";
import Pricing from "./pages/Pricing.tsx";
import CheckoutSuccess from "./pages/CheckoutSuccess.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Servers from "./pages/Servers.tsx";
import Install from "./pages/Install.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppSettingsProvider>
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
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin requireSubscription>
                      <Admin />
                    </ProtectedRoute>
                  }
                />
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
                <Route path="/install" element={<Install />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ItemCatalogProvider>
          </AppSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

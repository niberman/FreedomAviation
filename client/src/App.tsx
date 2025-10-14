import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { ErrorBoundary } from "@/components/error-boundary";
import { DevToolbar } from "@/components/dev-toolbar";
import Home from "./pages/home";
import Login from "./pages/login";
import Pricing from "./pages/Pricing";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import OwnerDashboard from "./pages/owner-dashboard";
import OwnerMore from "./pages/owner-more";
import AdminDashboard from "./pages/admin-dashboard";
import PricingConfigurator from "./pages/admin/PricingConfigurator";
import PackageConfigurator from "./pages/admin/PackageConfigurator";
import CFIDashboard from "./pages/cfi-dashboard";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/partners/sky-harbour" component={SkyHarbour} />
      <Route path="/partners/freedom-aviation-hangar" component={FAHangar} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <OwnerDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/more">
        <ProtectedRoute>
          <OwnerMore />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/pricing-configurator">
        <ProtectedRoute>
          <PricingConfigurator />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/packages">
        <ProtectedRoute>
          <PackageConfigurator />
        </ProtectedRoute>
      </Route>
      <Route path="/cfi">
        <ProtectedRoute>
          <CFIDashboard />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
              <DevToolbar />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;

import { Switch, Route } from "wouter";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import { queryClient } from "./lib/queryClient";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import { QueryClientProvider } from "@tanstack/react-query";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import { HelmetProvider } from "react-helmet-async";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import { Toaster } from "@/components/ui/toaster";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import { TooltipProvider } from "@/components/ui/tooltip";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import { AuthProvider } from "@/lib/auth-context";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import { ProtectedRoute } from "@/components/protected-route";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import { ErrorBoundary } from "@/components/error-boundary";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import { DevToolbar } from "@/components/dev-toolbar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import Home from "./pages/home";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import Login from "./pages/login";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import Pricing from "./pages/Pricing";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import Contact from "./pages/Contact";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import HangarLocations from "./pages/HangarLocations";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import OwnerDashboard from "./pages/owner-dashboard";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import OwnerMore from "./pages/owner-more";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import AdminDashboard from "./pages/admin-dashboard";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import UnifiedPricingConfigurator from "./pages/admin/UnifiedPricingConfigurator";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import CFIDashboard from "./pages/cfi-dashboard";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";
import NotFound from "./pages/not-found";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";
import SkyHarbour from "./pages/partners/SkyHarbour";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/contact" component={Contact} />
      <Route path="/hangar-locations" component={HangarLocations} />
      <Route path="/demo" component={OwnerDashboard} />
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
      <Route path="/admin/pricing">
        <ProtectedRoute>
          <UnifiedPricingConfigurator />
        </ProtectedRoute>
      </Route>
      <Route path="/cfi">
        <ProtectedRoute>
          <CFIDashboard />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
      <Route path="/partners/sky-harbour"><SkyHarbour /></Route>
          <Route path="/partners/fa-hangar"><FAHangar /></Route>
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

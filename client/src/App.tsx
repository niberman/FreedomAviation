import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { StaffProtectedRoute } from "@/components/staff-protected-route";
import { ErrorBoundary } from "@/components/error-boundary";
import { DevToolbar } from "@/components/dev-toolbar";
import { NavBar } from "@/components/navbar";
import Home from "./pages/home";
import Login from "./pages/login";
import ForgotPassword from "./pages/forgot-password";
import ResetPassword from "./pages/reset-password";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import HangarLocations from "./pages/HangarLocations";
import About from "./pages/About";
import OwnerDashboard from "./pages/owner-dashboard";
import OwnerMore from "./pages/owner-more";
import StaffDashboard from "./pages/staff-dashboard";
import UnifiedPricingConfigurator from "./pages/admin/UnifiedPricingConfigurator";
import NotFound from "./pages/not-found";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";

// Redirect to www domain in production to avoid CORS issues
function DomainRedirect() {
  useEffect(() => {
    // Only redirect in production and if on non-www domain
    if (
      typeof window !== "undefined" &&
      window.location.hostname === "freedomaviationco.com" &&
      !window.location.hostname.startsWith("localhost")
    ) {
      const newUrl = `https://www.freedomaviationco.com${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(newUrl);
    }
  }, []);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/contact" component={Contact} />
      <Route path="/about" component={About} />
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
        <StaffProtectedRoute>
          <StaffDashboard />
        </StaffProtectedRoute>
      </Route>
      <Route path="/admin/pricing">
        <StaffProtectedRoute>
          <UnifiedPricingConfigurator />
        </StaffProtectedRoute>
      </Route>
      <Route path="/staff">
        <StaffProtectedRoute>
          <StaffDashboard />
        </StaffProtectedRoute>
      </Route>
      <Route path="/partners/sky-harbour" component={SkyHarbour} />
      <Route path="/partners/fa-hangar" component={FAHangar} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const showNavBar = location !== "/demo";
  
  return (
    <ErrorBoundary>
      <DomainRedirect />
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              {showNavBar && <NavBar />}
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

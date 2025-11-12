import { Switch, Route, useLocation, Redirect } from "wouter";
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
import { Footer } from "@/components/footer";
import { siteConfig, isMarketingDomain } from "@/lib/site-config";
import Home from "./pages/home";
import Login from "./pages/login";
import ForgotPassword from "./pages/forgot-password";
import ResetPassword from "./pages/reset-password";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Onboarding from "./pages/onboarding";
import OwnerDashboard from "./pages/owner-dashboard";
import OwnerMore from "./pages/owner-more";
import StaffDashboard from "./pages/staff-dashboard";
import DashboardMembers from "./pages/dashboard/members";
import DashboardAircraft from "./pages/dashboard/aircraft";
import DashboardSettings from "./pages/dashboard/settings";
import StaffMembers from "./pages/staff/members";
import StaffAircraft from "./pages/staff/aircraft";
import StaffOperations from "./pages/staff/operations";
import StaffSettings from "./pages/staff/settings";
import UnifiedPricingConfigurator from "./pages/admin/UnifiedPricingConfigurator";
import PricingConfiguratorPage from "./pages/pricing-configurator";
import NotFound from "./pages/not-found";
import SkyHarbour from "./pages/partners/SkyHarbour";
import FAHangar from "./pages/partners/FAHangar";

// Redirect to www domain in production to avoid CORS issues
function DomainRedirect() {
  useEffect(() => {
    // Only redirect in production and if on non-www domain
    // IMPORTANT: Preserve hash (password reset tokens are in hash)
    if (
      typeof window !== "undefined" &&
      isMarketingDomain(window.location.hostname) &&
      window.location.hostname !== siteConfig.marketing.primaryDomain &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      // Don't redirect if we're on reset-password page with hash (password reset tokens)
      // Let the page load first so Supabase can process the hash
      if (window.location.pathname === "/reset-password" && window.location.hash) {
        // Only redirect if hash doesn't contain tokens (already processed)
        if (!window.location.hash.includes("access_token")) {
          const newUrl = `https://${siteConfig.marketing.primaryDomain}${window.location.pathname}${window.location.search}${window.location.hash}`;
          window.location.replace(newUrl);
        }
      } else {
        const newUrl = `https://${siteConfig.marketing.primaryDomain}${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.replace(newUrl);
      }
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
      <Route path="/onboarding">
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      </Route>
      <Route path="/pricing" component={Pricing} />
      <Route path="/pricing-configurator" component={PricingConfiguratorPage} />
      <Route path="/contact" component={Contact} />
      <Route path="/about" component={About} />
      <Redirect path="/hangar-locations" to="/pricing" />
      <Route path="/demo" component={OwnerDashboard} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <OwnerDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/members">
        <ProtectedRoute>
          <DashboardMembers />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/aircraft">
        <ProtectedRoute>
          <DashboardAircraft />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/settings">
        <ProtectedRoute>
          <DashboardSettings />
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
      <Route path="/staff/members">
        <StaffProtectedRoute>
          <StaffMembers />
        </StaffProtectedRoute>
      </Route>
      <Route path="/staff/aircraft">
        <StaffProtectedRoute>
          <StaffAircraft />
        </StaffProtectedRoute>
      </Route>
      <Route path="/staff/operations">
        <StaffProtectedRoute>
          <StaffOperations />
        </StaffProtectedRoute>
      </Route>
      <Route path="/staff/settings">
        <StaffProtectedRoute>
          <StaffSettings />
        </StaffProtectedRoute>
      </Route>
      <Route path="/staff/pricing">
        <StaffProtectedRoute>
          <UnifiedPricingConfigurator />
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
  const currentPath = location ?? "";
  const isDashboardRoute =
    currentPath.startsWith("/dashboard") ||
    currentPath.startsWith("/staff") ||
    currentPath.startsWith("/admin");
  const isOnboarding = currentPath.startsWith("/onboarding");
  const showMarketingChrome = !isDashboardRoute && !isOnboarding && currentPath !== "/demo";
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [location]);
  
  return (
    <ErrorBoundary>
      <DomainRedirect />
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <div className="flex min-h-screen flex-col">
                <Toaster />
                {showMarketingChrome && <NavBar />}
                <main className="flex-1">
                  <Router />
                </main>
                {showMarketingChrome && <Footer />}
              </div>
              <DevToolbar />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;

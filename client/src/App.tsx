import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Login from "@/pages/login";
import OwnerDashboard from "@/pages/owner-dashboard";
import OwnerMore from "@/pages/owner-more";
import AdminDashboard from "@/pages/admin-dashboard";
import CFIDashboard from "@/pages/cfi-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={OwnerDashboard} />
      <Route path="/dashboard/more" component={OwnerMore} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/cfi" component={CFIDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import SupplyChain from "@/pages/supply-chain";
import RiskAssessment from "@/pages/risk-assessment";
import Documents from "@/pages/documents";
import Declarations from "@/pages/declarations";
import Compliance from "@/pages/compliance";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import AppLayout from "@/layouts/app-layout";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      {/* App Routes - No authentication required */}
      <Route path="/">
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </Route>
      <Route path="/supply-chain">
        <AppLayout>
          <SupplyChain />
        </AppLayout>
      </Route>
      <Route path="/risk-assessment">
        <AppLayout>
          <RiskAssessment />
        </AppLayout>
      </Route>
      <Route path="/documents">
        <AppLayout>
          <Documents />
        </AppLayout>
      </Route>
      <Route path="/declarations">
        <AppLayout>
          <Declarations />
        </AppLayout>
      </Route>
      <Route path="/compliance">
        <AppLayout>
          <Compliance />
        </AppLayout>
      </Route>
      <Route path="/reports">
        <AppLayout>
          <Reports />
        </AppLayout>
      </Route>
      <Route path="/settings">
        <AppLayout>
          <Settings />
        </AppLayout>
      </Route>
      
      {/* Fallback to 404 */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

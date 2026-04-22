import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceShell } from "@/components/shell/WorkspaceShell";
import SammPage from "@/pages/SammPage";
import InboxPage from "@/pages/InboxPage";
import ContentPage from "@/pages/ContentPage";
import MetricsPage from "@/pages/MetricsPage";
import CalendarPage from "@/pages/CalendarPage";
import OperationsPage from "@/pages/OperationsPage";
import CRMPage from "@/pages/CRMPage";
import SalesPage from "@/pages/SalesPage";
import NotFoundPage from "@/pages/NotFoundPage";

const queryClient = new QueryClient();

function Router() {
  return (
    <WorkspaceShell>
      <Switch>
        <Route path="/" component={SammPage} />
        <Route path="/inbox" component={InboxPage} />
        <Route path="/content" component={ContentPage} />
        <Route path="/metrics" component={MetricsPage} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/operations" component={OperationsPage} />
        <Route path="/crm" component={CRMPage} />
        <Route path="/sales" component={SalesPage} />
        <Route component={NotFoundPage} />
      </Switch>
    </WorkspaceShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

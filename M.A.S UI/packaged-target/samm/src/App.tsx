import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import SammPage from "@/pages/SammPage";
import InboxPage from "@/pages/InboxPage";
import ContentPage from "@/pages/ContentPage";
import MetricsPage from "@/pages/MetricsPage";
import CalendarPage from "@/pages/CalendarPage";
import OperationsPage from "@/pages/OperationsPage";
import CRMPage from "@/pages/CRMPage";
import SalesPage from "@/pages/SalesPage";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { getActiveSession, supabase } from "../../../src/lib/supabase";

const queryClient = new QueryClient();

function PublicRouter() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route>
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}

function PrivateRouter() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={SammPage} />
        <Route path="/samm" component={SammPage} />
        <Route path="/inbox" component={InboxPage} />
        <Route path="/content" component={ContentPage} />
        <Route path="/metrics" component={MetricsPage} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/operations" component={OperationsPage} />
        <Route path="/crm" component={CRMPage} />
        <Route path="/sales" component={SalesPage} />
        <Route path="/login">
          <Redirect to="/" />
        </Route>
        <Route component={NotFoundPage} />
      </Switch>
    </Layout>
  );
}

function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getActiveSession()
      .then((nextSession) => {
        if (!isMounted) return;
        setSession(nextSession ?? null);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setSession(null);
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
      if (nextSession) {
        void queryClient.invalidateQueries();
      } else {
        queryClient.clear();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="rounded-2xl border border-border bg-card px-6 py-5 text-sm text-muted-foreground shadow-sm">
          Checking session...
        </div>
      </div>
    );
  }

  return session ? <PrivateRouter /> : <PublicRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthGate />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

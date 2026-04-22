import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocation } from "wouter";
import { WorkspaceSidebar } from "@/components/workspace/Sidebar";
import { InspectorPanel } from "@/components/workspace/InspectorPanel";
import type { WorkspaceInspectorPayload } from "@/lib/workspace-adapter";
import { useGetOrgConfig } from "@/lib/api";
import { cn } from "@/lib/utils";

interface WorkspaceShellProps {
  children: React.ReactNode;
}

interface WorkspaceInspectorContextValue {
  payload: WorkspaceInspectorPayload | null;
  openInspector: (payload: WorkspaceInspectorPayload) => void;
  closeInspector: () => void;
}

const WorkspaceInspectorContext = createContext<WorkspaceInspectorContextValue>({
  payload: null,
  openInspector: () => {},
  closeInspector: () => {},
});

export function useWorkspaceInspector() {
  return useContext(WorkspaceInspectorContext);
}

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [payload, setPayload] = useState<WorkspaceInspectorPayload | null>(null);
  const [location] = useLocation();
  const { data: config } = useGetOrgConfig();
  const workspaceName = config?.org_name ?? "Workspace";

  const openInspector = useCallback((nextPayload: WorkspaceInspectorPayload) => {
    setPayload(nextPayload);
  }, []);

  const closeInspector = useCallback(() => {
    setPayload(null);
  }, []);

  const inspectorValue = useMemo(
    () => ({ payload, openInspector, closeInspector }),
    [payload, openInspector, closeInspector]
  );

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <WorkspaceInspectorContext.Provider value={inspectorValue}>
      <div className="flex min-h-[100dvh] bg-background">
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-[220px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
          <WorkspaceSidebar />
        </aside>

        {mobileOpen ? (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        ) : null}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out md:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <button
            className="absolute right-3 top-3 rounded-md p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>

          <WorkspaceSidebar onNavigate={() => setMobileOpen(false)} />
        </aside>

        <main className="ml-0 flex min-h-screen flex-1 flex-col overflow-hidden md:ml-[220px]">
          <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:hidden">
            <button
              className="-ml-1 rounded-md p-1.5 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold lowercase tracking-[0.2em] text-foreground/46">samm</p>
              <p className="truncate text-sm font-medium text-foreground">{workspaceName}</p>
            </div>
          </div>

          {children}
        </main>

        <InspectorPanel payload={payload} onClose={closeInspector} />
      </div>
    </WorkspaceInspectorContext.Provider>
  );
}

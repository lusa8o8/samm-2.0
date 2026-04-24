import { useState, createContext, useContext, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Sidebar } from './Sidebar';
import { InspectorPanel } from './InspectorPanel';
import { useModules } from '../../store/moduleStore';
import type { WidgetDescriptor } from '../../types';
import { getInboxItems } from '../../services/liveInboxService';

interface WorkspaceShellProps {
  children: React.ReactNode;
}

export interface InspectorState {
  isOpen: boolean;
  title?: string;
  widget?: WidgetDescriptor;
}

interface InspectorContextValue {
  openInspector: (title: string, widget: WidgetDescriptor) => void;
  closeInspector: () => void;
  inspector: InspectorState;
}

export const InspectorContext = createContext<InspectorContextValue>({
  openInspector: () => {},
  closeInspector: () => {},
  inspector: { isOpen: false },
});

export function useInspector() {
  return useContext(InspectorContext);
}

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const [location] = useLocation();
  const { modules } = useModules();
  const [inspector, setInspector] = useState<InspectorState>({ isOpen: false });
  const { data: inboxItems = [] } = useQuery({
    queryKey: ['inbox-items'],
    queryFn: getInboxItems,
    staleTime: 30_000,
  });

  const modulesWithBadges = modules.map((module) =>
    module.id === 'inbox' ? { ...module, badge: inboxItems.length } : module
  );
  const enabledModules = modulesWithBadges.filter((module) => module.enabled);

  const openInspector = useCallback((title: string, widget: WidgetDescriptor) => {
    setInspector({ isOpen: true, title, widget });
  }, []);

  const closeInspector = useCallback(() => {
    setInspector({ isOpen: false });
  }, []);

  return (
    <InspectorContext.Provider value={{ openInspector, closeInspector, inspector }}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar
          enabledModules={enabledModules}
          allModules={modulesWithBadges}
          currentPath={location}
        />
        <main className="flex-1 overflow-hidden min-w-0">
          {children}
        </main>
      </div>
      <InspectorPanel
        isOpen={inspector.isOpen}
        title={inspector.title}
        widget={inspector.widget}
        onClose={closeInspector}
      />
    </InspectorContext.Provider>
  );
}

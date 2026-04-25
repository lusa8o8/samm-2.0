import { useState, createContext, useContext, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Sidebar } from './Sidebar';
import { InspectorPanel } from './InspectorPanel';
import { CalendarWorkspaceRail } from './CalendarWorkspaceRail';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable';
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
  const [isDesktopCalendarWorkspace, setIsDesktopCalendarWorkspace] = useState(false);
  const [calendarRailTab, setCalendarRailTab] = useState<'samm' | 'detail'>('samm');
  const [isCalendarRailCollapsed, setIsCalendarRailCollapsed] = useState(false);
  const { data: inboxItems = [] } = useQuery({
    queryKey: ['inbox-items'],
    queryFn: getInboxItems,
    staleTime: 30_000,
  });

  const modulesWithBadges = modules.map((module) =>
    module.id === 'inbox' ? { ...module, badge: inboxItems.length } : module
  );
  const enabledModules = modulesWithBadges.filter((module) => module.enabled);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateLayoutMode = () => {
      const isDesktop = window.innerWidth >= 1280;
      const isCalendarRoute = location.startsWith('/calendar');
      setIsDesktopCalendarWorkspace(isDesktop && isCalendarRoute);
    };

    updateLayoutMode();
    window.addEventListener('resize', updateLayoutMode);
    return () => window.removeEventListener('resize', updateLayoutMode);
  }, [location]);

  useEffect(() => {
    if (!isDesktopCalendarWorkspace || typeof window === 'undefined') return;

    const workspace = new URLSearchParams(window.location.search).get('workspace');
    if (workspace === 'samm' || workspace === 'detail') {
      setCalendarRailTab(workspace);
      setIsCalendarRailCollapsed(false);
    }
  }, [isDesktopCalendarWorkspace, location]);

  const openInspector = useCallback((title: string, widget: WidgetDescriptor) => {
    setInspector({ isOpen: true, title, widget });
    setCalendarRailTab('detail');
    setIsCalendarRailCollapsed(false);
  }, []);

  const closeInspector = useCallback(() => {
    setInspector({ isOpen: false });
    setCalendarRailTab('samm');
  }, []);

  return (
    <InspectorContext.Provider value={{ openInspector, closeInspector, inspector }}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar
          enabledModules={enabledModules}
          allModules={modulesWithBadges}
          currentPath={location}
        />
        {isDesktopCalendarWorkspace ? (
          isCalendarRailCollapsed ? (
            <div className="flex min-w-0 flex-1 overflow-hidden">
              <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
              <CalendarWorkspaceRail
                activeTab={calendarRailTab}
                detailTitle={inspector.title}
                detailWidget={inspector.widget}
                onTabChange={setCalendarRailTab}
                onClearDetail={closeInspector}
                isCollapsed={isCalendarRailCollapsed}
                onToggleCollapsed={() => setIsCalendarRailCollapsed((current) => !current)}
              />
            </div>
          ) : (
            <ResizablePanelGroup direction="horizontal" autoSaveId="calendar-desktop-workspace" className="min-w-0 flex-1 overflow-hidden">
              <ResizablePanel defaultSize={68} minSize={45}>
                <main className="h-full min-w-0 overflow-hidden">{children}</main>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={32} minSize={24} maxSize={48}>
                <CalendarWorkspaceRail
                  activeTab={calendarRailTab}
                  detailTitle={inspector.title}
                  detailWidget={inspector.widget}
                  onTabChange={setCalendarRailTab}
                  onClearDetail={closeInspector}
                  isCollapsed={isCalendarRailCollapsed}
                  onToggleCollapsed={() => setIsCalendarRailCollapsed((current) => !current)}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          )
        ) : (
          <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
        )}
      </div>
      {!isDesktopCalendarWorkspace && (
        <InspectorPanel
          isOpen={inspector.isOpen}
          title={inspector.title}
          widget={inspector.widget}
          onClose={closeInspector}
        />
      )}
    </InspectorContext.Provider>
  );
}

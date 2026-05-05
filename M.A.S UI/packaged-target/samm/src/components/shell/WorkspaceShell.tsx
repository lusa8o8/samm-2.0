import { useState, createContext, useContext, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Sidebar } from './Sidebar';
import { InspectorPanel } from './InspectorPanel';
import { CalendarWorkspaceRail } from './CalendarWorkspaceRail';
import { DesktopInspectorRail } from './DesktopInspectorRail';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable';
import { useModules } from '../../store/moduleStore';
import type { WidgetDescriptor } from '../../types';
import { getActionableInboxCount, getInboxItems } from '../../services/liveInboxService';

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
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const [isDesktopCalendarWorkspace, setIsDesktopCalendarWorkspace] = useState(false);
  const [calendarRailTab, setCalendarRailTab] = useState<'samm' | 'detail'>('samm');
  const [isCalendarRailCollapsed, setIsCalendarRailCollapsed] = useState(false);
  const { data: inboxItems = [] } = useQuery({
    queryKey: ['inbox-items'],
    queryFn: getInboxItems,
    staleTime: 30_000,
  });

  const actionableInboxCount = getActionableInboxCount(inboxItems);
  const modulesWithBadges = modules.map((module) =>
    module.id === 'inbox' ? { ...module, badge: actionableInboxCount } : module
  );
  const enabledModules = modulesWithBadges.filter((module) => module.enabled);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateLayoutMode = () => {
      const isDesktop = window.innerWidth >= 1280;
      const isCalendarRoute = location.startsWith('/calendar');
      setIsDesktopViewport(isDesktop);
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

  const shouldUseDesktopInspectorRail =
    isDesktopViewport &&
    !isDesktopCalendarWorkspace &&
    inspector.isOpen &&
    location.startsWith('/content');

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
        ) : shouldUseDesktopInspectorRail ? (
          <ResizablePanelGroup direction="horizontal" autoSaveId="content-desktop-inspector" className="min-w-0 flex-1 overflow-hidden">
            <ResizablePanel defaultSize={60} minSize={42}>
              <main className="h-full min-w-0 overflow-hidden">{children}</main>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={40} minSize={28} maxSize={52}>
              <DesktopInspectorRail
                title={inspector.title}
                widget={inspector.widget}
                onClose={closeInspector}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
        )}
      </div>
      {!isDesktopCalendarWorkspace && !shouldUseDesktopInspectorRail && (
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

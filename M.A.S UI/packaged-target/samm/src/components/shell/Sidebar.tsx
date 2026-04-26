import { useLocation, Link } from 'wouter';
import {
  Cpu, Inbox, FileText, BarChart2, Calendar, Settings,
  Users, TrendingUp, Star, Zap, LogOut, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Module, ModuleId } from '../../types';
import { useEffect, useState } from 'react';
import { signOut } from '../../../../../src/lib/supabase';

const iconMap: Record<string, LucideIcon> = {
  Cpu, Inbox, FileText, BarChart2, Calendar, Settings, Users, TrendingUp, Star,
};

interface SidebarProps {
  enabledModules: Module[];
  allModules: Module[];
  currentPath: string;
}

const routeMap: Record<ModuleId, string> = {
  samm: '/',
  inbox: '/inbox',
  content: '/content',
  metrics: '/metrics',
  calendar: '/calendar',
  operations: '/operations',
  crm: '/crm',
  sales: '/sales',
  ambassadors: '/ambassadors',
};

interface NavIconProps {
  icon: LucideIcon;
  label: string;
  path: string;
  isActive: boolean;
  badge?: number;
  onNavigate?: () => void;
}

function NavIcon({ icon: Icon, label, path, isActive, badge, onNavigate }: NavIconProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={path} data-testid={`nav-${label.toLowerCase()}`}>
      <div
        className="relative flex items-center"
        onClick={onNavigate}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span
          className={cn(
            'relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-150 cursor-pointer',
            isActive
              ? 'bg-primary text-white shadow-md shadow-primary/40'
              : 'text-foreground/25 hover:text-foreground/60'
          )}
        >
          <Icon size={16} />
          {badge && badge > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-3.5 px-0.5 rounded-full bg-red-500 text-[8px] font-bold text-white flex items-center justify-center leading-none">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </span>

        {/* Tooltip */}
        {hovered && (
          <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className="bg-popover border border-border rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap">
              <span className="text-xs font-medium text-foreground">{label}</span>
            </div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-popover border-l border-b border-border rotate-45" />
          </div>
        )}
      </div>
    </Link>
  );
}

export function Sidebar({ enabledModules, currentPath }: SidebarProps) {
  const [workspaceHovered, setWorkspaceHovered] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(false);

  const navModules = enabledModules.filter(m => m.id !== 'operations');
  const settingsModule = enabledModules.find(m => m.id === 'operations');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateViewport = () => {
      const nextIsMobile = window.innerWidth < 768;
      setIsMobileViewport(nextIsMobile);
      setIsMobileCollapsed((current) => (nextIsMobile ? current : false));
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    if (isMobileViewport) {
      setIsMobileCollapsed(true);
    }
  }, [isMobileViewport]);

  const collapseMobileRail = () => {
    if (isMobileViewport) {
      setIsMobileCollapsed(true);
    }
  };

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      {isMobileViewport && !isMobileCollapsed ? (
        <button
          type="button"
          aria-label="Collapse navigation"
          onClick={collapseMobileRail}
          className="fixed inset-0 z-20 bg-black/10 backdrop-blur-[1px]"
        />
      ) : null}

      <aside
        className={cn(
          'z-30 flex flex-col items-center py-3 select-none transition-transform duration-200 ease-out',
          isMobileViewport
            ? cn(
                'fixed inset-y-0 left-0 w-[60px] border-r border-border/60 bg-background/92 shadow-sm backdrop-blur-md',
                isMobileCollapsed ? '-translate-x-[46px]' : 'translate-x-0'
              )
            : 'relative h-full w-[60px] flex-shrink-0 bg-transparent'
        )}
      >
        {isMobileViewport && (
          <button
            type="button"
            onClick={() => setIsMobileCollapsed((current) => !current)}
            className="absolute right-[-14px] top-24 flex h-10 w-7 items-center justify-center rounded-r-full border border-l-0 border-border/60 bg-background/95 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
            aria-label={isMobileCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {isMobileCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
        )}

        {/* Workspace logo */}
        <div
          className="relative mb-3"
          onMouseEnter={() => setWorkspaceHovered(true)}
          onMouseLeave={() => setWorkspaceHovered(false)}
        >
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center cursor-default shadow-md shadow-primary/30">
            <Zap size={16} className="text-white" />
          </div>

          {workspaceHovered && (
            <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <div className="bg-popover border border-border rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap">
                <p className="text-xs font-semibold text-foreground">Northstar Co.</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Production workspace</p>
              </div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-popover border-l border-b border-border rotate-45" />
            </div>
          )}
        </div>

        <div className="mb-2" />

        {/* Main nav */}
        <nav className="flex flex-col items-center gap-1 flex-1">
          {navModules.map(module => {
            const Icon = iconMap[module.icon];
            if (!Icon) return null;
            const path = routeMap[module.id];
            const isActive = currentPath === path || (path !== '/' && currentPath.startsWith(path));

            return (
              <NavIcon
                key={module.id}
                icon={Icon}
                label={module.label}
                path={path}
                isActive={isActive}
                badge={module.badge}
                onNavigate={collapseMobileRail}
              />
            );
          })}
        </nav>

        {/* Settings at bottom */}
        {settingsModule && (
          <>
            <div className="mb-1" />
            <NavIcon
              icon={Settings}
              label="Operations"
              path="/operations"
              isActive={currentPath === '/operations' || currentPath.startsWith('/operations')}
              onNavigate={collapseMobileRail}
            />
          </>
        )}

        <div className="mb-1" />
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-150",
            signingOut
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "text-foreground/25 hover:bg-red-50 hover:text-red-600"
          )}
          title="Sign out"
          data-testid="nav-sign-out"
        >
          <LogOut size={16} />
        </button>
      </aside>
    </>
  );
}

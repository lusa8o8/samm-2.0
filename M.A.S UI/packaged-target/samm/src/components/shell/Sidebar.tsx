import { useLocation, Link } from 'wouter';
import {
  Cpu, Inbox, FileText, BarChart2, Calendar, Settings,
  Users, TrendingUp, Star, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Module, ModuleId } from '../../types';
import { useState } from 'react';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
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
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  path: string;
  isActive: boolean;
  badge?: number;
}

function NavIcon({ icon: Icon, label, path, isActive, badge }: NavIconProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={path} data-testid={`nav-${label.toLowerCase()}`}>
      <div
        className="relative flex items-center"
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

  const navModules = enabledModules.filter(m => m.id !== 'operations');
  const settingsModule = enabledModules.find(m => m.id === 'operations');

  return (
    <aside className="flex-shrink-0 flex flex-col items-center h-full w-[60px] py-3 bg-transparent select-none">

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
          />
        </>
      )}
    </aside>
  );
}

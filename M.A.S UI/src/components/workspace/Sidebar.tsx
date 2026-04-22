import { Link, useLocation } from "wouter";
import {
  Sparkles,
  Bell,
  LayoutList,
  BarChart2,
  Users,
  CalendarDays,
  Bot,
  LogOut,
} from "lucide-react";
import { useGetInboxSummary, useGetOrgConfig } from "@/lib/api";
import { signOut } from "@/lib/supabase";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/samm", label: "samm", icon: Sparkles },
  { href: "/inbox", label: "Inbox", icon: Bell },
  { href: "/content", label: "Content", icon: LayoutList },
  { href: "/metrics", label: "Metrics", icon: BarChart2 },
  { href: "/ambassadors", label: "Ambassadors", icon: Users },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/operations", label: "Operations", icon: Bot, isPrefix: true },
];

const operationsSubnav = [
  { path: "/operations/overview", label: "Overview" },
  { path: "/operations/settings", label: "Settings" },
  { path: "/operations/manual", label: "Manual" },
];

interface WorkspaceSidebarProps {
  onNavigate?: () => void;
}

export function WorkspaceSidebar({ onNavigate }: WorkspaceSidebarProps) {
  const [location] = useLocation();
  const { data: summary } = useGetInboxSummary();
  const { data: config } = useGetOrgConfig();
  const workspaceName = config?.org_name ?? "Workspace";
  const accountLabel = config?.full_name ?? config?.org_name ?? "Operations";
  const isOperationsActive = location.startsWith("/operations");
  const moduleSettings = ((config?.platform_connections as Record<string, any> | undefined)?.modules ?? {}) as Record<
    string,
    { enabled?: boolean }
  >;
  const ambassadorsEnabled = moduleSettings.ambassadors?.enabled !== false;
  const visibleNavItems = navItems.filter((item) => item.href !== "/ambassadors" || ambassadorsEnabled);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-5 py-5">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold lowercase tracking-[0.22em] text-sidebar-foreground/52">samm</p>
          <h1 className="text-base font-semibold leading-tight text-sidebar-foreground">{workspaceName}</h1>
          <p className="text-xs font-medium text-sidebar-foreground/46">coordinated workspace</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {visibleNavItems.map((item) => {
          const isActive = item.isPrefix ? location.startsWith(item.href) : location === item.href;

          return (
            <div key={item.href}>
              <Link href={item.href} onClick={onNavigate}>
                <div
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                  {item.href === "/inbox" && summary?.unread ? (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {summary.unread}
                    </span>
                  ) : null}
                </div>
              </Link>

              {item.href === "/operations" && isOperationsActive ? (
                <div className="ml-9 mt-1 space-y-1 border-l border-sidebar-border/50 pl-2">
                  {operationsSubnav.map((sub) => (
                    <Link key={sub.path} href={sub.path} onClick={onNavigate}>
                      <div
                        className={cn(
                          "cursor-pointer rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                          location === sub.path
                            ? "bg-sidebar-accent/50 text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                        )}
                      >
                        {sub.label}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 rounded-full border border-sidebar-border bg-sidebar-accent">
            <AvatarFallback className="bg-sidebar-accent text-xs text-sidebar-accent-foreground">
              {workspaceName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{accountLabel}</p>
            <p className="text-[11px] text-sidebar-foreground/46">workspace account</p>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => void signOut()}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WidgetDescriptor } from '../../types';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import { SammWorkspacePanel } from '../workspace/SammWorkspacePanel';

type WorkspaceRailTab = 'samm' | 'detail';

interface CalendarWorkspaceRailProps {
  activeTab: WorkspaceRailTab;
  onTabChange: (tab: WorkspaceRailTab) => void;
  detailTitle?: string;
  detailWidget?: WidgetDescriptor;
  onClearDetail: () => void;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export function CalendarWorkspaceRail({
  activeTab,
  detailTitle,
  detailWidget,
  isCollapsed,
  onClearDetail,
  onTabChange,
  onToggleCollapsed,
}: CalendarWorkspaceRailProps) {
  const hasDetail = Boolean(detailWidget);

  if (isCollapsed) {
    return (
      <div className="flex h-full w-14 flex-col items-center gap-3 border-l border-border bg-card/60 px-2 py-4">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Expand workspace rail"
        >
          <PanelRightOpen size={16} />
        </button>

        <div className="mt-3 flex flex-1 flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onToggleCollapsed();
              onTabChange('samm');
            }}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-2xl text-[10px] font-semibold transition-colors',
              activeTab === 'samm' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            s
          </button>
          <button
            type="button"
            onClick={() => {
              onToggleCollapsed();
              onTabChange('detail');
            }}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-2xl text-[10px] font-semibold transition-colors',
              activeTab === 'detail' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            d
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className="flex h-full min-h-0 w-full min-w-0 flex-col border-l border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="inline-flex rounded-full border border-border bg-muted/40 p-1">
          {(['samm', 'detail'] as WorkspaceRailTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                activeTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab === 'samm' ? 'samm' : 'Detail'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Collapse workspace rail"
        >
          <PanelRightClose size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === 'samm' ? (
          <SammWorkspacePanel embedded selectedContextLabel={detailTitle} />
        ) : hasDetail ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground">detail</p>
                <h2 className="mt-1 truncate text-sm font-semibold text-foreground">{detailTitle ?? 'Detail'}</h2>
              </div>
              <button
                type="button"
                onClick={onClearDetail}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Clear
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {detailWidget ? <WidgetRenderer widget={detailWidget} /> : null}
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center text-muted-foreground">
            <div className="rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]">
              Detail
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Select something on the calendar</p>
              <p className="mt-1 text-xs">
                Click a day, campaign, or content slot to inspect it here while keeping samm beside the calendar.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

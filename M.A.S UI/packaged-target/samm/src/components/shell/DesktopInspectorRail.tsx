import { X } from 'lucide-react';
import type { WidgetDescriptor } from '../../types';
import { WidgetRenderer } from '../widgets/WidgetRenderer';

interface DesktopInspectorRailProps {
  title?: string;
  widget?: WidgetDescriptor;
  onClose: () => void;
}

export function DesktopInspectorRail({ title, widget, onClose }: DesktopInspectorRailProps) {
  return (
    <aside className="flex h-full min-h-0 w-full min-w-0 flex-col border-l border-border bg-card/55 backdrop-blur-sm">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground">detail</p>
          <h2 className="mt-1 truncate text-sm font-semibold text-foreground">{title ?? 'Detail'}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          data-testid="desktop-inspector-close"
          aria-label="Close detail rail"
        >
          <X size={15} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {widget ? <WidgetRenderer widget={widget} /> : null}
      </div>
    </aside>
  );
}

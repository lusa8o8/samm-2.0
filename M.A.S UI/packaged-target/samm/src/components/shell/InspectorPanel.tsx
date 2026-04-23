import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import type { WidgetDescriptor } from '../../types';

interface InspectorPanelProps {
  isOpen: boolean;
  title?: string;
  widget?: WidgetDescriptor;
  onClose: () => void;
}

export function InspectorPanel({ isOpen, title, widget, onClose }: InspectorPanelProps) {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [renderedTitle, setRenderedTitle] = useState(title);
  const [renderedWidget, setRenderedWidget] = useState(widget);

  useEffect(() => {
    if (!isOpen) return;

    setIsMounted(true);
    setRenderedTitle(title);
    setRenderedWidget(widget);

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose, title, widget]);

  useEffect(() => {
    if (isOpen) return;

    const timeout = window.setTimeout(() => {
      setIsMounted(false);
      setRenderedTitle(undefined);
      setRenderedWidget(undefined);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        className={`absolute inset-0 transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'pointer-events-auto bg-black/10 opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className="absolute inset-y-3 right-3 flex max-w-full items-stretch justify-end"
        aria-hidden={!isOpen}
      >
        <div
          className={`pointer-events-auto flex h-full w-[min(560px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'
          }`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
            <h3 className="text-sm font-semibold text-foreground">{renderedTitle ?? 'Detail'}</h3>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              data-testid="inspector-close"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {renderedWidget && <WidgetRenderer widget={renderedWidget} />}
          </div>
        </div>
      </div>
    </div>
  );
}

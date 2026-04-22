import { useEffect } from 'react';
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
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ animation: 'fadeIn 150ms ease' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Card */}
      <div
        className="relative z-10 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          width: 'min(640px, calc(100vw - 48px))',
          maxHeight: 'calc(100vh - 96px)',
          animation: 'modalIn 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h3 className="text-sm font-semibold text-foreground">{title ?? 'Detail'}</h3>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            data-testid="inspector-close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {widget && <WidgetRenderer widget={widget} />}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

import { useEffect } from "react";
import { X } from "lucide-react";
import { WorkspaceWidgetRenderer } from "@/components/workspace/WorkspaceWidgetRenderer";
import type { WorkspaceInspectorPayload } from "@/lib/workspace-adapter";
import { cn } from "@/lib/utils";

interface InspectorPanelProps {
  payload: WorkspaceInspectorPayload | null;
  onClose: () => void;
}

function JsonPreview({ value }: { value: unknown }) {
  if (value == null) {
    return <p className="text-xs text-muted-foreground">No inspector data yet.</p>;
  }

  return (
    <pre className="overflow-x-auto rounded-xl border bg-muted/30 p-4 text-[11px] leading-relaxed text-muted-foreground">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function InspectorPanel({ payload, onClose }: InspectorPanelProps) {
  useEffect(() => {
    if (!payload) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [payload, onClose]);

  if (!payload) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:items-stretch md:justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <aside
        className={cn(
          "relative z-10 flex w-full max-w-[680px] flex-col overflow-hidden border-l border-border bg-background shadow-2xl",
          "h-[min(86vh,880px)] rounded-2xl md:h-screen md:rounded-none"
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">{payload.title}</h2>
            {payload.subtitle ? (
              <p className="mt-1 text-xs text-muted-foreground">{payload.subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={onClose}
            aria-label="Close inspector"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {payload.widget ? (
            <WorkspaceWidgetRenderer widget={payload.widget} />
          ) : (
            <JsonPreview value={null} />
          )}
        </div>
      </aside>
    </div>
  );
}

import { CheckCircle2, ExternalLink, FileEdit, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssetReadinessPill } from "@/components/workspace/shared/AssetReadinessPill";
import type { AssetReadinessRecordViewData } from "@/components/workspace/calendar-studio/types";
import { useCalendarStudioWorkflow } from "@/components/layout";

interface Props {
  data: AssetReadinessRecordViewData;
  compact?: boolean;
}

export function AssetReadinessPanel({ data, compact }: Props) {
  const workflow = useCalendarStudioWorkflow();

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border/60 bg-card", !compact && "shadow-sm")}>
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-3 py-2.5">
        <div className="min-w-0">
          {!compact ? (
            <p className="mb-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">Asset readiness</p>
          ) : null}
          <p className="truncate text-[12px] font-semibold text-foreground">{data.contextLabel}</p>
        </div>
        <AssetReadinessPill state={data.state} size="sm" />
      </div>

      <div className="space-y-3 px-3 py-3">
        {data.sourceLinks.length > 0 ? (
          <div>
            <p className="mb-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">Sources & references</p>
            <div className="flex flex-wrap gap-1.5">
              {data.sourceLinks.map((link, i) => (
                <a
                  key={`${link.label}-${i}`}
                  href={link.url}
                  className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/50 px-2 py-1 text-[11px] text-foreground/80 transition-colors hover:bg-muted"
                  onClick={(event) => event.preventDefault()}
                >
                  <ExternalLink size={10} />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        ) : data.state !== "assets_ready" ? (
          <div className="text-[11px] italic text-muted-foreground">No source references attached.</div>
        ) : null}

        {data.notes ? (
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Notes</p>
            <p className="text-[12px] leading-relaxed text-foreground/70">{data.notes}</p>
          </div>
        ) : null}

        {data.state !== "assets_ready" && data.assetRequestSummary ? (
          <div className="rounded-lg border border-amber-200/60 bg-amber-50/40 px-3 py-2 dark:border-amber-900/60 dark:bg-amber-950/15">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
              Asset request
            </p>
            <p className="text-[12px] leading-relaxed text-foreground/80">{data.assetRequestSummary}</p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5 border-t border-border/60 bg-card px-3 py-2">
        {data.state !== "assets_ready" ? (
          <button
            type="button"
            onClick={() => workflow.updateAssetStatus?.(data, "mark_ready")}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200/70 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
          >
            <CheckCircle2 size={11} /> Mark ready
          </button>
        ) : null}
        {data.state !== "assets_ready" ? (
          <button
            type="button"
            onClick={() => workflow.updateAssetStatus?.(data, "request_assets")}
            className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/15"
          >
            <Send size={11} /> Request assets
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => workflow.updateAssetStatus?.(data, "update_notes")}
          className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <FileEdit size={11} /> Update notes
        </button>
      </div>
    </div>
  );
}

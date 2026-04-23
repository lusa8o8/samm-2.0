import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { CampaignColor, CampaignTimelineCell } from "@/components/workspace/calendar-studio/types";
import { campaignColorClasses } from "@/components/workspace/shared/OwnershipChip";

interface CampaignTimelineStripProps {
  cells: CampaignTimelineCell[];
  color: CampaignColor;
  className?: string;
}

export function CampaignTimelineStrip({ cells, color, className }: CampaignTimelineStripProps) {
  const c = campaignColorClasses[color];
  const max = Math.max(1, ...cells.map((cell) => cell.scheduled + cell.drafts + cell.failed));

  return (
    <div className={cn("w-full", className)}>
      <div className="flex h-14 items-end gap-1">
        {cells.map((cell) => {
          const total = cell.scheduled + cell.drafts + cell.failed;
          const pct = total === 0 ? 4 : Math.max(8, Math.round((total / max) * 100));
          return (
            <div
              key={cell.date}
              className="group flex h-full min-w-0 flex-1 flex-col items-stretch justify-end"
              title={`${format(new Date(cell.date), "MMM d")} · ${total} items`}
            >
              <div
                className={cn(
                  "flex w-full flex-col-reverse overflow-hidden rounded-sm border",
                  c.border,
                  total === 0 && "border-border/60 bg-muted/50",
                )}
                style={{ height: `${pct}%` }}
              >
                {cell.scheduled > 0 ? <div className="bg-purple-400/80" style={{ flex: cell.scheduled }} /> : null}
                {cell.drafts > 0 ? (
                  <div className="bg-slate-300 dark:bg-slate-700" style={{ flex: cell.drafts }} />
                ) : null}
                {cell.failed > 0 ? <div className="bg-red-400" style={{ flex: cell.failed }} /> : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex items-center gap-1">
        {cells.map((cell) => (
          <div
            key={cell.date}
            className={cn(
              "flex-1 text-center text-[8px] leading-none tabular-nums",
              cell.isToday ? "font-semibold text-primary" : "text-muted-foreground/70",
            )}
          >
            {format(new Date(cell.date), "d")}
          </div>
        ))}
      </div>
    </div>
  );
}

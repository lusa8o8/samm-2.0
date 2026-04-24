import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarDayCellViewData, CalendarMonthGridViewData } from "@/components/workspace/calendar-studio/types";
import { ContentCapacityBar } from "@/components/workspace/shared/ContentCapacityBar";
import { ContentChip } from "@/components/workspace/shared/ContentChip";
import { DayMetricCounts } from "@/components/workspace/shared/DayMetricCounts";
import { CampaignPill, campaignColorClasses } from "@/components/workspace/shared/OwnershipChip";

interface Props {
  data: CalendarMonthGridViewData;
  onDayClick?: (day: CalendarDayCellViewData) => void;
  onCampaignClick?: (campaignId: string) => void;
}

export function CalendarMonthGrid({ data, onDayClick, onCampaignClick }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-3">
          {data.activeCampaigns.map((campaign) => (
            <CampaignPill
              key={campaign.id}
              name={campaign.name}
              color={campaign.color}
              size="sm"
              onClick={onCampaignClick ? () => onCampaignClick(campaign.id) : undefined}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span>
            <span className="font-semibold tabular-nums text-foreground">{data.committedPercent}%</span> committed
          </span>
          <span>
            <span className="font-semibold tabular-nums text-foreground">{data.totalScheduled}</span> scheduled
          </span>
          <span>
            <span className="font-semibold tabular-nums text-foreground">{data.totalDrafts}</span> drafts
          </span>
          {data.totalFailed > 0 ? (
            <span className="text-red-600 dark:text-red-400">
              <span className="font-semibold tabular-nums">{data.totalFailed}</span> failed
            </span>
          ) : null}
          <span>
            <span className="font-semibold tabular-nums text-foreground">{data.totalOpenSlots}</span> open
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 px-1">
        {data.weekdayLabels.map((weekday) => (
          <div key={weekday} className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {data.days.map((day) => (
          <DayCard key={day.date} day={day} onClick={() => onDayClick?.(day)} />
        ))}
      </div>
    </div>
  );
}

function DayCard({ day, onClick }: { day: CalendarDayCellViewData; onClick?: () => void }) {
  const isOtherMonth = !day.isCurrentMonth;
  const isFailureHeavy = day.counts.failed >= 2;
  const colorClasses = day.campaignColor ? campaignColorClasses[day.campaignColor] : null;
  const dayNum = format(new Date(day.date), "d");
  const isMonthStart = dayNum === "1";
  const showCampaignPill = Boolean(day.campaignName && day.campaignEventDate === day.date);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isOtherMonth}
      className={cn(
        "group flex min-h-[110px] flex-col rounded-2xl border bg-card text-left shadow-sm transition-all duration-150 hover:shadow-md",
        isOtherMonth && "pointer-events-none opacity-30",
        day.isToday && "ring-2 ring-primary/40 border-primary/40",
        !day.isToday && !isFailureHeavy && "border-border/60 hover:border-border",
        isFailureHeavy && "border-red-200 dark:border-red-900",
        colorClasses && !day.isToday && !isFailureHeavy && cn("hover:ring-1", colorClasses.border),
      )}
      data-testid={`calendar-day-${day.date}`}
    >
      <div className="flex items-start justify-between gap-1 px-2 pb-1 pt-2">
        <div className="flex items-center gap-1">
          <span className={cn("text-[12px] font-semibold leading-none tabular-nums", day.isToday ? "text-primary" : "text-foreground")}>
            {dayNum}
          </span>
          {isMonthStart && day.isCurrentMonth ? (
            <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{format(new Date(day.date), "MMM")}</span>
          ) : null}
        </div>
        {day.openSlots > 0 && day.counts.scheduled === 0 && day.counts.drafts === 0 ? (
          <span className="text-[9px] italic leading-none text-muted-foreground/60">+{day.openSlots} open</span>
        ) : null}
        {day.openSlots > 0 && (day.counts.scheduled > 0 || day.counts.drafts > 0) ? (
          <span className="h-1.5 w-1.5 rounded-full bg-primary/40" title={`${day.openSlots} open slots`} />
        ) : null}
      </div>

      {showCampaignPill ? (
        <div className="px-2">
          <CampaignPill
            name={day.campaignName!}
            color={day.campaignColor ?? "slate"}
            size="xs"
            exclusive={day.ownership === "campaign_exclusive"}
            className="max-w-full"
          />
        </div>
      ) : null}

      <div className="mt-1 flex-1 space-y-0.5 px-2">
        {day.previewChips.slice(0, 3).map((chip) => (
          <ContentChip key={chip.id} chip={chip} />
        ))}
      </div>

      <div className="space-y-1 px-2 pb-2 pt-1">
        {day.capacity.max > 0 ? <ContentCapacityBar used={day.capacity.used} max={day.capacity.max} size="xs" /> : null}
        <DayMetricCounts counts={day.counts} size="xs" />
      </div>
    </button>
  );
}

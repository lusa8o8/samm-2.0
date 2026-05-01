import { type ReactNode } from "react";
import { format } from "date-fns";
import { Calendar, Image as ImageIcon, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CampaignColor,
  KeyCampaignInput,
  MonthlyPlanningSessionViewData,
} from "@/components/workspace/calendar-studio/types";
import { AssetReadinessPill } from "@/components/workspace/shared/AssetReadinessPill";
import { campaignColorClasses } from "@/components/workspace/shared/OwnershipChip";
import { useCalendarStudioWorkflow } from "@/components/layout";

interface Props {
  data: MonthlyPlanningSessionViewData;
}

const kindColors: Record<KeyCampaignInput["kind"], CampaignColor> = {
  promotion: "amber",
  webinar: "blue",
  always_on: "slate",
  launch: "purple",
  newsletter: "emerald",
  seasonal: "pink",
};

function Section({
  icon,
  title,
  hint,
  children,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground/70">{icon}</span>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-foreground">{title}</h4>
        </div>
        {hint ? <span className="text-[10px] text-muted-foreground/60">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function MonthlyPlanningSessionWidget({ data }: Props) {
  const monthLabel = format(new Date(`${data.planningMonth}-01`), "MMMM yyyy");
  const workflow = useCalendarStudioWorkflow();

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/10 via-purple-500/5 to-amber-500/5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2 text-[11px] font-medium text-primary">
              <Sparkles size={12} />
              Monthly Planning Session
            </div>
            <h3 className="text-lg font-semibold leading-tight text-foreground">Plan {monthLabel}</h3>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Committed calendar windows and readiness signals for this month.
            </p>
          </div>
          <span
            className={cn(
              "flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
              data.status === "committed"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : data.status === "reviewing"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-border bg-muted text-muted-foreground",
            )}
          >
            {data.status}
          </span>
        </div>
        {data.totalPlannedDays || data.estimatedContentVolume ? (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/40 pt-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Planned days</p>
              <p className="text-lg font-semibold tabular-nums text-foreground">{data.totalPlannedDays ?? "-"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Est. content</p>
              <p className="text-lg font-semibold tabular-nums text-foreground">{data.estimatedContentVolume ?? "-"} pieces</p>
            </div>
          </div>
        ) : null}
      </div>

      <Section icon={<Calendar size={12} />} title="Key campaigns & dates" hint={`${data.keyCampaigns.length} planned`}>
        <div className="space-y-2">
          {data.keyCampaigns.length > 0 ? (
            data.keyCampaigns.map((campaign) => {
              const color = kindColors[campaign.kind];
              const cls = campaignColorClasses[color];
              return (
                <div
                  key={campaign.id}
                  className={cn("cursor-pointer rounded-xl border p-3 transition-colors hover:brightness-[0.98]", cls.soft, cls.border)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full", cls.dot)} />
                        <p className="truncate text-[12px] font-semibold text-foreground">{campaign.name}</p>
                        <span className="text-[10px] capitalize text-muted-foreground">- {campaign.kind.replace("_", " ")}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(campaign.startDate), "MMM d")}
                        {campaign.endDate && campaign.endDate !== campaign.startDate
                          ? ` - ${format(new Date(campaign.endDate), "MMM d")}`
                          : ""}
                        {campaign.exclusivity === "exclusive" ? (
                          <span className="ml-1 text-[10px] uppercase tracking-wide opacity-70">- exclusive</span>
                        ) : null}
                      </p>
                      {campaign.notes ? (
                        <p className="mt-1.5 line-clamp-2 text-[11px] italic text-foreground/70">{campaign.notes}</p>
                      ) : null}
                    </div>
                    <AssetReadinessPill state={campaign.assetReadiness} size="xs" />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="rounded-xl border border-border/60 bg-card px-3 py-2.5 text-[12px] text-muted-foreground">
              No committed campaign windows yet.
            </p>
          )}
          <button
            type="button"
            onClick={() => workflow.addCampaignOrKeyDate?.(data)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/70 py-2 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/30 hover:text-foreground"
          >
            <Plus size={12} /> Add campaign or key date
          </button>
        </div>
      </Section>

      <Section icon={<ImageIcon size={12} />} title="Asset readiness by campaign">
        {data.keyCampaigns.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border/60 divide-y divide-border/60">
            {data.keyCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between gap-2 bg-card px-3 py-2.5">
                <div className="min-w-0">
                  <span className="truncate text-[12px] font-medium text-foreground">{campaign.name}</span>
                </div>
                <AssetReadinessPill state={data.assetReadinessByCampaign[campaign.id] ?? campaign.assetReadiness} size="xs" />
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-border/60 bg-card px-3 py-2.5 text-[12px] text-muted-foreground">
            Asset readiness will appear after a campaign window is added.
          </p>
        )}
      </Section>
    </div>
  );
}

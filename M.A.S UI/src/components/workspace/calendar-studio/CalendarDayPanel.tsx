import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { format } from "date-fns";
import { AlertTriangle, CalendarDays, Lock, Plus, Sliders, Trash2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarDayPanelViewData } from "@/components/workspace/calendar-studio/types";
import { ContentCapacityBar } from "@/components/workspace/shared/ContentCapacityBar";
import { ChannelIcon } from "@/components/workspace/shared/ChannelIcon";
import { CampaignPill, campaignColorClasses } from "@/components/workspace/shared/OwnershipChip";
import { StatusChip } from "@/components/workspace/shared/StatusChip";
import { useCalendarStudioWorkflow } from "@/components/layout";
import {
  buildCampaignFormForDate,
  buildOneTimePostFormForDay,
  ManualEntryPanel,
  type ManualEntryType,
} from "@/components/workspace/calendar-studio/ManualEntryPanel";

interface Props {
  data: CalendarDayPanelViewData;
}

function SubHeading({
  children,
  count,
  tone,
}: {
  children: ReactNode;
  count?: number;
  tone?: "default" | "warn" | "danger";
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h4
        className={cn(
          "text-[11px] font-semibold uppercase tracking-wide",
          tone === "warn" && "text-amber-700 dark:text-amber-400",
          tone === "danger" && "text-red-700 dark:text-red-400",
          (!tone || tone === "default") && "text-foreground/80",
        )}
      >
        {children}
      </h4>
      {count !== undefined ? <span className="text-[10px] tabular-nums text-muted-foreground">{count}</span> : null}
    </div>
  );
}

export function CalendarDayPanel({ data }: Props) {
  const context = data.campaignContext;
  const oneTimeContext = data.oneTimeContext;
  const colorClasses = data.campaignColor ? campaignColorClasses[data.campaignColor] : null;
  const dateObj = new Date(data.date);
  const workflow = useCalendarStudioWorkflow();
  const hasDeleteTargets = Boolean(data.campaignDeleteCandidate || data.oneTimeDeleteCandidates.length > 0);
  const defaultManualEntryType: ManualEntryType = context ? "one_time" : "campaign";
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [manualEntryType, setManualEntryType] = useState<ManualEntryType>(defaultManualEntryType);
  const [manualCampaignForm, setManualCampaignForm] = useState(() => buildCampaignFormForDate(data.date));
  const [manualOneTimeForm, setManualOneTimeForm] = useState(() =>
    buildOneTimePostFormForDay({
      date: data.date,
      campaignId: context?.id,
      campaignName: context?.name,
    }),
  );
  const [submittingEntryType, setSubmittingEntryType] = useState<ManualEntryType | null>(null);

  const resetManualEntryState = () => {
    setManualEntryType(defaultManualEntryType);
    setManualCampaignForm(buildCampaignFormForDate(data.date));
    setManualOneTimeForm(
      buildOneTimePostFormForDay({
        date: data.date,
        campaignId: context?.id,
        campaignName: context?.name,
      }),
    );
    setSubmittingEntryType(null);
  };

  useEffect(() => {
    setIsAddingManually(false);
    resetManualEntryState();
  }, [data.date, context?.id, context?.name]);

  const handleStartManualEntry = () => {
    resetManualEntryState();
    setIsAddingManually(true);
  };

  const handleManualCampaignSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!workflow.createManualCampaignWindow) return;

    setSubmittingEntryType("campaign");
    try {
      await workflow.createManualCampaignWindow(manualCampaignForm);
      setIsAddingManually(false);
    } catch {
      // The page-level mutation owns the user-facing toast.
    } finally {
      setSubmittingEntryType(null);
    }
  };

  const handleManualOneTimeSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!workflow.queueManualOneTimePost) return;

    setSubmittingEntryType("one_time");
    try {
      await workflow.queueManualOneTimePost(manualOneTimeForm);
      setIsAddingManually(false);
    } catch {
      // The page-level mutation owns the user-facing toast.
    } finally {
      setSubmittingEntryType(null);
    }
  };

  if (isAddingManually) {
    return (
      <ManualEntryPanel
        entryType={manualEntryType}
        campaignForm={manualCampaignForm}
        oneTimeForm={manualOneTimeForm}
        onEntryTypeChange={setManualEntryType}
        onCampaignFormChange={setManualCampaignForm}
        onOneTimeFormChange={setManualOneTimeForm}
        onCampaignSubmit={handleManualCampaignSubmit}
        onOneTimeSubmit={handleManualOneTimeSubmit}
        isCampaignPending={submittingEntryType === "campaign"}
        isOneTimePending={submittingEntryType === "one_time"}
        onCancel={() => setIsAddingManually(false)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div
        className={cn(
          "rounded-2xl border p-5",
          colorClasses ? cn("bg-gradient-to-br", colorClasses.soft, colorClasses.border) : "bg-muted/40 border-border/60",
        )}
      >
        <div className="mb-1.5 flex items-center gap-2 text-[11px] font-medium text-foreground/70">
          <CalendarDays size={12} />
          {format(dateObj, "EEEE")}
          {data.isToday ? <span className="rounded-full bg-primary px-1.5 py-px text-[10px] font-semibold text-white">Today</span> : null}
        </div>
        <h3 className="text-xl font-semibold leading-tight text-foreground">{format(dateObj, "MMMM d, yyyy")}</h3>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {context ? <CampaignPill name={context.name} color={data.campaignColor ?? "slate"} size="sm" /> : null}
          {oneTimeContext && !context ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300">
              <Plus size={10} />
              One-time post
            </span>
          ) : null}
          {context?.exclusivity === "exclusive" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              <Lock size={10} />
              Exclusive window
            </span>
          ) : null}
        </div>
        {context ? <p className="mt-3 text-[12px] italic leading-relaxed text-foreground/70">{context.objective}</p> : null}
        {oneTimeContext && !context ? (
          <div className="mt-3 space-y-1">
            <p className="text-[13px] font-medium leading-relaxed text-foreground">{oneTimeContext.title}</p>
            <p className="text-[11px] text-foreground/70">
              {oneTimeContext.contentCount} {oneTimeContext.contentCount === 1 ? "draft" : "drafts"} across {oneTimeContext.channels.length}{" "}
              {oneTimeContext.channels.length === 1 ? "channel" : "channels"}
              {oneTimeContext.additionalCount > 0
                ? `, plus ${oneTimeContext.additionalCount} more standalone ${oneTimeContext.additionalCount === 1 ? "post" : "posts"} on this day.`
                : "."}
            </p>
          </div>
        ) : null}
      </div>

      <section>
        <SubHeading>Posting capacity</SubHeading>
        <div className="rounded-xl border border-border/60 bg-card p-3">
          <div className="mb-2 flex items-center justify-between text-[12px]">
            <span className="text-foreground/80">Total today</span>
            <span className="tabular-nums text-muted-foreground">
              {data.capacity.used} of {data.capacity.max} used
            </span>
          </div>
          <ContentCapacityBar used={data.capacity.used} max={data.capacity.max} size="sm" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {data.perChannelLimits.map((limit) => (
              <div key={limit.channel} className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5">
                <ChannelIcon channel={limit.channel} size={12} />
                <span className="flex-1 text-[11px] capitalize text-foreground/80">{limit.channel}</span>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {limit.used}/{limit.max}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {data.scheduledItems.length > 0 ? (
        <section>
          <SubHeading count={data.scheduledItems.length}>Scheduled</SubHeading>
          <div className="space-y-1.5">
            {data.scheduledItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5">
                <ChannelIcon channel={item.channel} size={14} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-foreground">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(item.scheduledFor), "h:mm a")} - {item.channel}
                  </p>
                </div>
                <StatusChip status={item.status} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {data.draftItems.length > 0 ? (
        <section>
          <SubHeading count={data.draftItems.length} tone="warn">
            Drafts / pending approvals
          </SubHeading>
          <div className="space-y-1.5">
            {data.draftItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-amber-200/60 bg-amber-50/40 px-3 py-2.5 dark:border-amber-900/60 dark:bg-amber-950/15"
              >
                <ChannelIcon channel={item.channel} size={14} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-foreground">{item.title}</p>
                  <p className="text-[10px] capitalize text-muted-foreground">{item.channel}</p>
                </div>
                <StatusChip status={item.approvalStatus} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {data.failureItems.length > 0 ? (
        <section>
          <SubHeading count={data.failureItems.length} tone="danger">
            Failures
          </SubHeading>
          <div className="space-y-1.5">
            {data.failureItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-red-200/60 bg-red-50/40 px-3 py-2.5 dark:border-red-900/60 dark:bg-red-950/15"
              >
                <div className="flex items-center gap-3">
                  <ChannelIcon channel={item.channel} size={14} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(item.failedAt), "h:mm a")} - {item.channel}
                    </p>
                  </div>
                  <AlertTriangle size={12} className="flex-shrink-0 text-red-600" />
                </div>
                <p className="mt-1.5 pl-7 text-[11px] text-red-700 dark:text-red-400">{item.reason}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {data.openSlots > 0 ? (
        <section>
          <SubHeading count={data.openSlots}>Open slots</SubHeading>
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-3 py-3 text-center text-[12px] text-muted-foreground">
            {data.openSlots} {data.openSlots === 1 ? "slot remains" : "slots remain"} open. Create drafts from the committed rules or add something manually.
          </div>
        </section>
      ) : null}

      {data.notes ? (
        <section>
          <SubHeading>Notes</SubHeading>
          <p className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5 text-[12px] leading-relaxed text-foreground/70">
            {data.notes}
          </p>
        </section>
      ) : null}

      <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-wrap items-center gap-1.5 border-t border-border/60 bg-card/95 px-5 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => workflow.createDraftsForDay?.(data)}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3 py-1.5 text-[11px] font-medium leading-none text-white transition-colors hover:bg-primary/90"
        >
          <Wand2 size={12} /> Create drafts
        </button>
        <button
          type="button"
          onClick={handleStartManualEntry}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-muted px-3 py-1.5 text-[11px] font-medium leading-none text-foreground transition-colors hover:bg-muted/80"
        >
          <Plus size={12} /> Add manually
        </button>
        <button
          type="button"
          onClick={() => workflow.editRulesForDay?.(data)}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-medium leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Sliders size={12} /> Edit rules
        </button>
        {hasDeleteTargets ? (
          <button
            type="button"
            onClick={() => workflow.deleteWindowForDay?.(data)}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-medium leading-none text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
          >
            <Trash2 size={12} /> Delete...
          </button>
        ) : null}
      </div>
    </div>
  );
}

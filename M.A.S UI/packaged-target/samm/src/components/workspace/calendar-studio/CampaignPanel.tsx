import type { ReactNode } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  Inbox,
  Lock,
  Megaphone,
  Plus,
  Sliders,
  Tag,
  Target,
  Unlock,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AssetReadinessPanel } from "@/components/workspace/calendar-studio/AssetReadinessPanel";
import type {
  AssetReadinessRecordViewData,
  CampaignPanelViewData,
} from "@/components/workspace/calendar-studio/types";
import { AssetReadinessPill } from "@/components/workspace/shared/AssetReadinessPill";
import { CampaignTimelineStrip } from "@/components/workspace/shared/CampaignTimelineStrip";
import { CampaignPill, campaignColorClasses } from "@/components/workspace/shared/OwnershipChip";
import { useCalendarStudioWorkflow } from "@/components/layout";

interface Props {
  data: CampaignPanelViewData;
}

function MetricTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "default" | "warn" | "danger";
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-base font-semibold tabular-nums",
          tone === "warn" && "text-amber-700 dark:text-amber-400",
          tone === "danger" && "text-red-700 dark:text-red-400",
          (!tone || tone === "default") && "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-foreground/80">{children}</h4>;
}

export function CampaignPanel({ data }: Props) {
  const colorClasses = campaignColorClasses[data.color];
  const workflow = useCalendarStudioWorkflow();

  const assetRecord: AssetReadinessRecordViewData = {
    contextId: data.id,
    contextLabel: data.name,
    state: data.assetReadiness,
    sourceLinks: data.assetSourceLinks ?? [],
    notes: data.assetNotes,
  };

  return (
    <div className="space-y-5">
      <div className={cn("rounded-2xl border bg-gradient-to-br p-5", colorClasses.soft, colorClasses.border)}>
        <div className="mb-1.5 flex items-center gap-2 text-[11px] font-medium text-foreground/70">
          <Megaphone size={12} />
          <span className="capitalize">{data.kind.replace("_", " ")}</span>
        </div>
        <h3 className="text-xl font-semibold leading-tight text-foreground">{data.name}</h3>
        <p className="mt-1 text-[12px] text-muted-foreground">
          {format(new Date(data.startDate), "MMM d")} — {format(new Date(data.endDate), "MMM d, yyyy")}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CampaignPill name={`Owner: Pipeline ${data.ownerPipeline}`} color={data.color} size="sm" />
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
              data.exclusivity === "exclusive"
                ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/30 dark:text-purple-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300",
            )}
          >
            {data.exclusivity === "exclusive" ? <Lock size={10} /> : <Unlock size={10} />}
            {data.exclusivity === "exclusive" ? "Exclusive window" : "Allows support content"}
          </span>
          <AssetReadinessPill state={data.assetReadiness} size="sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Target size={11} /> Objective
          </div>
          <p className="text-[12px] leading-snug text-foreground">{data.objective}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Users size={11} /> Target audience
          </div>
          <p className="text-[12px] leading-snug text-foreground">{data.targetAudience}</p>
        </div>
      </div>

      <section>
        <SubHeading>Readiness</SubHeading>
        <div className="grid grid-cols-3 gap-2">
          <MetricTile label="Readiness" value={`${data.readinessPercent}%`} />
          <MetricTile label="Missing slots" value={data.missingSlots} tone={data.missingSlots > 0 ? "warn" : "default"} />
          <MetricTile
            label="Approval backlog"
            value={data.approvalBacklog}
            tone={data.approvalBacklog > 2 ? "warn" : "default"}
          />
        </div>
      </section>

      <section>
        <SubHeading>Timeline across campaign</SubHeading>
        <div className="rounded-xl border border-border/60 bg-card p-3">
          <CampaignTimelineStrip cells={data.timeline} color={data.color} />
          <div className="mt-2 flex items-center gap-3 text-[9px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-2 rounded-sm bg-purple-400/80" /> scheduled
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-2 rounded-sm bg-slate-300 dark:bg-slate-700" /> drafts
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-2 rounded-sm bg-red-400" /> failed
            </span>
          </div>
        </div>
      </section>

      <section>
        <SubHeading>Content breakdown</SubHeading>
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card divide-y divide-border/60">
          {[
            { key: "published", label: "Published", value: data.contentBreakdown.published, dot: "bg-emerald-500" },
            { key: "scheduled", label: "Scheduled", value: data.contentBreakdown.scheduled, dot: "bg-purple-500" },
            { key: "drafts", label: "Drafts", value: data.contentBreakdown.drafts, dot: "bg-slate-400" },
            {
              key: "pendingApproval",
              label: "Pending approval",
              value: data.contentBreakdown.pendingApproval,
              dot: "bg-amber-500",
            },
            { key: "failed", label: "Failed", value: data.contentBreakdown.failed, dot: "bg-red-500" },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between px-3 py-2 text-[12px]">
              <span className="flex items-center gap-2 text-foreground/80">
                <span className={cn("h-1.5 w-1.5 rounded-full", row.dot)} />
                {row.label}
              </span>
              <span className="font-semibold tabular-nums text-foreground">{row.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SubHeading>Messaging constraints</SubHeading>
        <ul className="space-y-1 rounded-xl border border-border/60 bg-card px-3 py-2.5">
          {data.messagingConstraints.map((constraint, index) => (
            <li key={`${constraint}-${index}`} className="flex gap-2 text-[12px] text-foreground/80">
              <span className="text-muted-foreground/60">·</span>
              <span className="leading-snug">{constraint}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SubHeading>CTA rules</SubHeading>
        <ul className="space-y-1 rounded-xl border border-border/60 bg-card px-3 py-2.5">
          {data.ctaRules.map((rule, index) => (
            <li key={`${rule}-${index}`} className="flex gap-2 text-[12px] text-foreground/80">
              <span className="text-muted-foreground/60">·</span>
              <span className="leading-snug">{rule}</span>
            </li>
          ))}
        </ul>
      </section>

      {data.offerInScope ? (
        <section>
          <SubHeading>Offer in scope</SubHeading>
          <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 px-3 py-2.5 dark:border-amber-900/60 dark:bg-amber-950/15">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-400">
              <Tag size={11} /> Active offer
            </div>
            <p className="text-[12px] leading-snug text-foreground">{data.offerInScope}</p>
          </div>
        </section>
      ) : null}

      <section>
        <SubHeading>Asset readiness</SubHeading>
        <AssetReadinessPanel data={assetRecord} compact />
      </section>

      {data.contentBreakdown.failed > 0 || data.approvalBacklog > 0 ? (
        <section>
          <SubHeading>Needs attention</SubHeading>
          <div className="space-y-1.5">
            {data.contentBreakdown.failed > 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-red-200/60 bg-red-50/40 px-3 py-2 text-[12px] text-red-700 dark:border-red-900/60 dark:bg-red-950/15 dark:text-red-400">
                <AlertTriangle size={12} />
                {data.contentBreakdown.failed} failed item{data.contentBreakdown.failed === 1 ? "" : "s"}
              </div>
            ) : null}
            {data.approvalBacklog > 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200/60 bg-amber-50/40 px-3 py-2 text-[12px] text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/15 dark:text-amber-400">
                <Inbox size={12} />
                {data.approvalBacklog} item{data.approvalBacklog === 1 ? "" : "s"} waiting approval
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center gap-2 border-t border-border/60 bg-card/95 px-5 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => workflow.createDraftsForCampaign?.(data)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-primary/90"
        >
          <Plus size={12} /> Create campaign drafts
        </button>
        <button
          type="button"
          onClick={() => workflow.editCampaignRules?.(data)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Sliders size={12} /> Edit campaign rules
        </button>
        <button
          type="button"
          onClick={() => workflow.updateAssetStatus?.(assetRecord, "update_notes")}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Tag size={12} /> Update asset status
        </button>
      </div>
    </div>
  );
}

import { useState, type ReactNode } from "react";
import { format } from "date-fns";
import { Calendar, CheckCircle2, Gauge, Image as ImageIcon, Plus, Sparkles, StickyNote, Target, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CampaignColor,
  KeyCampaignInput,
  MonthlyPlanningSessionViewData,
} from "@/components/workspace/calendar-studio/types";
import { AssetReadinessPill } from "@/components/workspace/shared/AssetReadinessPill";
import { campaignColorClasses } from "@/components/workspace/shared/OwnershipChip";
import { useCalendarStudioWorkflow, useWorkspaceInspector } from "@/components/layout";

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
  const [emphasis, setEmphasis] = useState(data.temporaryEmphasis);
  const [notes, setNotes] = useState(data.oneOffNotes);
  const [isAddingEmphasis, setIsAddingEmphasis] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [draftEmphasis, setDraftEmphasis] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const monthLabel = format(new Date(`${data.planningMonth}-01`), "MMMM yyyy");
  const workflow = useCalendarStudioWorkflow();
  const { closeInspector } = useWorkspaceInspector();

  const handleAddEmphasis = () => {
    const trimmed = draftEmphasis.trim();
    if (!trimmed) return;
    setEmphasis((current) => [...current, trimmed]);
    setDraftEmphasis("");
    setIsAddingEmphasis(false);
  };

  const handleAddNote = () => {
    const trimmed = draftNote.trim();
    if (!trimmed) return;
    setNotes((current) => [...current, trimmed]);
    setDraftNote("");
    setIsAddingNote(false);
  };

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
            <p className="mt-1 text-[12px] text-muted-foreground">Capture intent. SAMM will turn this into calendar truth.</p>
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
              <p className="text-lg font-semibold tabular-nums text-foreground">{data.totalPlannedDays ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Est. content</p>
              <p className="text-lg font-semibold tabular-nums text-foreground">{data.estimatedContentVolume ?? "—"} pieces</p>
            </div>
          </div>
        ) : null}
      </div>

      <Section icon={<Target size={12} />} title="Monthly objective">
        <textarea
          defaultValue={data.monthlyObjective}
          rows={2}
          className="w-full resize-none rounded-xl border border-border/60 bg-card px-3 py-2.5 text-[12px] text-foreground transition-all placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
          placeholder="What does winning this month look like?"
        />
      </Section>

      <Section icon={<Calendar size={12} />} title="Key campaigns & dates" hint={`${data.keyCampaigns.length} planned`}>
        <div className="space-y-2">
          {data.keyCampaigns.map((campaign) => {
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
                      <span className="text-[10px] capitalize text-muted-foreground">· {campaign.kind.replace("_", " ")}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(campaign.startDate), "MMM d")}
                      {campaign.endDate && campaign.endDate !== campaign.startDate
                        ? ` — ${format(new Date(campaign.endDate), "MMM d")}`
                        : ""}
                      {campaign.exclusivity === "exclusive" ? (
                        <span className="ml-1 text-[10px] uppercase tracking-wide opacity-70">· exclusive</span>
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
          })}
          <button
            type="button"
            onClick={() => workflow.addCampaignOrKeyDate?.(data)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/70 py-2 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/30 hover:text-foreground"
          >
            <Plus size={12} /> Add campaign or key date
          </button>
        </div>
      </Section>

      <Section icon={<Sparkles size={12} />} title="This month, lean into…" hint="optional">
        <div className="flex flex-wrap gap-1.5">
          {emphasis.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/8 px-2 py-1 text-[11px] text-primary"
            >
              {item}
              <button
                type="button"
                onClick={() => setEmphasis(emphasis.filter((_, currentIndex) => currentIndex !== index))}
                className="opacity-50 hover:opacity-100"
              >
                <X size={10} />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setIsAddingEmphasis(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <Plus size={10} /> Add emphasis
          </button>
        </div>
        {isAddingEmphasis ? (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2">
            <input
              value={draftEmphasis}
              onChange={(event) => setDraftEmphasis(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddEmphasis();
                }
              }}
              placeholder="Add a monthly emphasis"
              autoFocus
              className="flex-1 bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted-foreground/60"
            />
            <button
              type="button"
              onClick={() => {
                setDraftEmphasis("");
                setIsAddingEmphasis(false);
              }}
              className="rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddEmphasis}
              disabled={!draftEmphasis.trim()}
              className="rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add
            </button>
          </div>
        ) : null}
      </Section>

      <Section icon={<Gauge size={12} />} title="Operator capacity">
        <textarea
          defaultValue={data.operatorCapacityNote}
          rows={2}
          className="w-full resize-none rounded-xl border border-border/60 bg-card px-3 py-2.5 text-[12px] text-foreground transition-all placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
          placeholder="Travel, OOO, approval throughput…"
        />
      </Section>

      <Section icon={<ImageIcon size={12} />} title="Asset readiness by campaign">
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
      </Section>

      <Section icon={<StickyNote size={12} />} title="One-off notes & exceptions">
        <div className="space-y-1.5">
          {notes.map((note, index) => (
            <div
              key={`${note}-${index}`}
              className="flex items-start gap-2 rounded-lg border border-border/40 bg-muted/40 px-3 py-2 text-[12px] text-foreground/80"
            >
              <span className="mt-0.5 text-muted-foreground/60">·</span>
              <span className="flex-1 leading-snug">{note}</span>
              <button
                type="button"
                onClick={() => setNotes(notes.filter((_, currentIndex) => currentIndex !== index))}
                className="text-muted-foreground/50 transition-colors hover:text-foreground"
              >
                <X size={11} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setIsAddingNote(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/70 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/30 hover:text-foreground"
          >
            <Plus size={11} /> Add note or exception
          </button>
          {isAddingNote ? (
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <textarea
                value={draftNote}
                onChange={(event) => setDraftNote(event.target.value)}
                rows={3}
                autoFocus
                placeholder="Add a note, caveat, or exception for this month"
                className="w-full resize-none bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted-foreground/60"
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraftNote("");
                    setIsAddingNote(false);
                  }}
                  className="rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddNote}
                  disabled={!draftNote.trim()}
                  className="rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add note
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center justify-end gap-2 border-t border-border/60 bg-card/95 px-5 py-4 backdrop-blur-md">
        <button
          type="button"
          onClick={() => closeInspector()}
          className="rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => workflow.reviewPlanningSession?.(data)}
          className="rounded-lg border border-border bg-muted px-3 py-1.5 text-[12px] text-foreground transition-colors hover:bg-muted/80"
        >
          Review draft plan
        </button>
        <button
          type="button"
          onClick={() => workflow.commitPlanningSession?.(data)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90"
        >
          <CheckCircle2 size={12} /> Commit to calendar
        </button>
      </div>
    </div>
  );
}

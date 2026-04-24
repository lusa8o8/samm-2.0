import { useCallback, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateCalendarEvent,
  useDeleteCalendarEvent,
  useUpdateCalendarEvent,
} from "@/lib/api";
import {
  useRegisterCalendarStudioWorkflow,
  useWorkspaceInspector,
} from "@/components/layout";
import { CalendarMonthGrid } from "@/components/workspace/calendar-studio/CalendarMonthGrid";
import type {
  AssetReadinessRecordViewData,
  CalendarDayCellViewData,
  CalendarDayPanelViewData,
  CampaignPanelViewData,
  MonthlyPlanningSessionViewData,
} from "@/components/workspace/calendar-studio/types";
import {
  buildCalendarStudioAssetReadinessDetail,
  buildCalendarStudioCampaignWindowDetail,
  buildCalendarStudioDayDetail,
  buildCalendarStudioMonthGrid,
  useCalendarStudioSourceBundle,
} from "@/lib/calendar-studio-read-models";
import { createInspectorPayload } from "@/lib/workspace-adapter";

type EventFormData = {
  event_type: string;
  event_date: string;
  event_end_date: string;
  label: string;
  universities: string[];
  creative_override_allowed: boolean;
  support_content_allowed: boolean;
};

type DeleteWindowTarget = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
};

const EVENT_TYPE_OPTIONS = [
  { value: "launch", label: "Launch" },
  { value: "promotion", label: "Promotion" },
  { value: "seasonal", label: "Seasonal" },
  { value: "community", label: "Community" },
  { value: "deadline", label: "Deadline" },
  { value: "other", label: "Other" },
] as const;

const BLANK_FORM: EventFormData = {
  event_type: "launch",
  event_date: new Date().toISOString().split("T")[0],
  event_end_date: "",
  label: "",
  universities: [],
  creative_override_allowed: false,
  support_content_allowed: false,
};

function buildMonthlyPlanningSession(source: Parameters<typeof buildCalendarStudioMonthGrid>[0], monthIso: string) {
  const monthGrid = buildCalendarStudioMonthGrid(source, monthIso);
  const monthDate = new Date(`${monthIso}-01T00:00:00`);
  const monthStart = format(startOfMonth(monthDate), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(monthDate), "yyyy-MM-dd");
  const overlappingWindows = source.windows
    .filter((window) => window.windowStart <= monthEnd && window.windowEnd >= monthStart)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const keyCampaigns = overlappingWindows.map((window) => {
    const assetReadiness = buildCalendarStudioAssetReadinessDetail(source, window.eventId);
    return {
      id: window.eventId,
      name: window.label,
      kind: window.kind,
      startDate: window.startDate,
      endDate: window.endDate,
      exclusivity: window.exclusivity,
      assetReadiness: assetReadiness.state,
      notes: window.planningNotes,
    };
  });

  const emphasis = [
    monthGrid.totalOpenSlots > 0 ? "Close open calendar slots" : null,
    monthGrid.totalDrafts > 0 ? "Clear draft approval backlog" : null,
    monthGrid.totalFailed > 0 ? "Reduce failure-heavy days" : null,
    ...Array.from(new Set(overlappingWindows.map((window) => window.kind.replace(/_/g, " ")))).slice(0, 2),
  ].filter((value): value is string => Boolean(value));

  const oneOffNotes = overlappingWindows
    .map((window) => (window.exclusivity === "exclusive" ? `${window.label} runs as an exclusive campaign window.` : null))
    .filter((value): value is string => Boolean(value));

  return {
    id: `planning:${monthIso}`,
    planningMonth: monthGrid.monthIso,
    monthlyObjective:
      overlappingWindows[0]?.objective ??
      `Shape ${monthGrid.monthLabel} around the active campaign windows and close the remaining open slots deterministically.`,
    keyCampaigns,
    temporaryEmphasis: emphasis,
    operatorCapacityNote: `${monthGrid.totalOpenSlots} open slots, ${monthGrid.totalDrafts} drafts, and ${monthGrid.totalFailed} failed items currently shape this month.`,
    assetReadinessByCampaign: Object.fromEntries(
      overlappingWindows.map((window) => [window.eventId, buildCalendarStudioAssetReadinessDetail(source, window.eventId).state]),
    ),
    oneOffNotes,
    status: "draft" as const,
    totalPlannedDays: monthGrid.days.filter((day) => day.isCurrentMonth && Boolean(day.campaignId)).length,
    estimatedContentVolume: monthGrid.totalScheduled + monthGrid.totalDrafts + monthGrid.totalOpenSlots,
  } satisfies MonthlyPlanningSessionViewData;
}

function LoadingState() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-44" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-[140px] rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 28 }).map((_, index) => (
            <Skeleton key={index} className="h-[140px] rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function EventForm({
  value,
  onChange,
  onSubmit,
  isPending,
  submitLabel,
}: {
  value: EventFormData;
  onChange: (nextValue: EventFormData) => void;
  onSubmit: (event: React.FormEvent) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Event Type</Label>
          <Select value={value.event_type} onValueChange={(nextValue) => onChange({ ...value, event_type: nextValue })}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input
            type="date"
            value={value.event_date}
            onChange={(event) => onChange({ ...value, event_date: event.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>
          End Date <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          type="date"
          value={value.event_end_date}
          min={value.event_date}
          onChange={(event) => onChange({ ...value, event_end_date: event.target.value })}
        />
        <p className="text-[11px] text-muted-foreground">
          Use this when the window spans several days, like a promotion week or campaign run.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Label / Description</Label>
        <Input
          value={value.label}
          onChange={(event) => onChange({ ...value, label: event.target.value })}
          placeholder="e.g. Mother&apos;s Day promotion"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>
          Audience Tags <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          value={value.universities.join(", ")}
          onChange={(event) =>
            onChange({
              ...value,
              universities: event.target.value
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            })
          }
          placeholder="e.g. loyal customers, first-time buyers"
        />
      </div>

      {["seasonal", "promotion", "other"].includes(value.event_type) ? (
        <div className="space-y-3 rounded-md border border-amber-100 bg-amber-50/50 p-3">
          <div className="flex items-start gap-3">
            <Switch
              checked={value.support_content_allowed}
              onCheckedChange={(nextValue) => onChange({ ...value, support_content_allowed: nextValue })}
            />
            <div>
              <Label className="text-xs font-semibold text-amber-800">Allow support content</Label>
              <p className="mt-0.5 text-[11px] leading-snug text-amber-700/80">
                Lets support-only slots live inside this campaign window while still following the campaign rules.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Switch
              checked={value.creative_override_allowed}
              onCheckedChange={(nextValue) => onChange({ ...value, creative_override_allowed: nextValue })}
            />
            <div>
              <Label className="text-xs font-semibold text-amber-800">Allow creative deviation</Label>
              <p className="mt-0.5 text-[11px] leading-snug text-amber-700/80">
                Permits creative deviation inside the campaign window where the underlying planner already allows it.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function CalendarStudioPage() {
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<EventFormData>(BLANK_FORM);
  const [editWindowId, setEditWindowId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EventFormData>(BLANK_FORM);
  const [deleteWindowTarget, setDeleteWindowTarget] = useState<DeleteWindowTarget | null>(null);
  const monthIso = format(monthDate, "yyyy-MM");
  const { data: source, isLoading, isError, error } = useCalendarStudioSourceBundle();
  const { openInspector, closeInspector } = useWorkspaceInspector();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const monthGrid = useMemo(
    () => (source ? buildCalendarStudioMonthGrid(source, monthIso) : null),
    [source, monthIso],
  );

  const planningSession = useMemo(
    () => (source ? buildMonthlyPlanningSession(source, monthIso) : null),
    [source, monthIso],
  );

  const invalidateStudio = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["calendar-studio"] });
    void queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
  }, [queryClient]);

  const createMutation = useCreateCalendarEvent({
    mutation: {
      onSuccess: () => {
        invalidateStudio();
        setCreateOpen(false);
        setCreateForm(BLANK_FORM);
        toast({
          title: "Calendar window added",
          description: "Calendar Studio has been refreshed with the new event.",
        });
      },
      onError: (nextError: unknown) => {
        toast({
          title: "Could not add the calendar window",
          description: nextError instanceof Error ? nextError.message : "Unknown error",
          variant: "destructive",
        });
      },
    },
  });

  const updateMutation = useUpdateCalendarEvent({
    mutation: {
      onSuccess: () => {
        invalidateStudio();
        setEditWindowId(null);
        toast({
          title: "Calendar rules updated",
          description: "The campaign window now reflects the revised rules.",
        });
      },
      onError: (nextError: unknown) => {
        toast({
          title: "Could not update the campaign rules",
          description: nextError instanceof Error ? nextError.message : "Unknown error",
          variant: "destructive",
        });
      },
    },
  });

  const deleteMutation = useDeleteCalendarEvent({
    mutation: {
      onSuccess: () => {
        const deletedLabel = deleteWindowTarget?.label ?? "Campaign window";
        invalidateStudio();
        closeInspector();
        setDeleteWindowTarget(null);
        setEditWindowId(null);
        toast({
          title: "Campaign window deleted",
          description: `${deletedLabel} has been removed from Calendar Studio.`,
        });
      },
      onError: (nextError: unknown) => {
        toast({
          title: "Could not delete the campaign window",
          description: nextError instanceof Error ? nextError.message : "Unknown error",
          variant: "destructive",
        });
      },
    },
  });

  const openCreateDialog = useCallback((initial?: Partial<EventFormData>) => {
    setCreateForm({
      ...BLANK_FORM,
      ...initial,
      event_end_date: initial?.event_end_date ?? "",
      universities: initial?.universities ?? [],
      creative_override_allowed: initial?.creative_override_allowed ?? false,
      support_content_allowed: initial?.support_content_allowed ?? false,
    });
    setCreateOpen(true);
  }, []);

  const openEditDialog = useCallback((windowId: string) => {
    if (!source) return;
    const window = source.windows.find((item) => item.eventId === windowId || item.id === windowId);
    if (!window) {
      toast({
        title: "Campaign window not found",
        description: "The selected campaign could not be matched to a live calendar rule.",
        variant: "destructive",
      });
      return;
    }

    setEditForm({
      event_type: window.row.event_type ?? "other",
      event_date: window.row.event_date ?? BLANK_FORM.event_date,
      event_end_date: window.row.event_end_date ?? "",
      label: window.row.label ?? "",
      universities: window.row.universities ?? [],
      creative_override_allowed: Boolean(window.row.creative_override_allowed),
      support_content_allowed: Boolean(window.row.support_content_allowed),
    });
    setEditWindowId(window.eventId);
  }, [source, toast]);

  const requestDeleteWindow = useCallback((windowId: string) => {
    if (!source) return;
    const window = source.windows.find((item) => item.eventId === windowId || item.id === windowId);
    if (!window) {
      toast({
        title: "Campaign window not found",
        description: "The selected campaign could not be matched to a live calendar rule.",
        variant: "destructive",
      });
      return;
    }

    setDeleteWindowTarget({
      id: window.eventId,
      label: window.label,
      startDate: window.startDate,
      endDate: window.endDate,
    });
  }, [source, toast]);

  const handoffToSamm = useCallback((
    mode: "planning" | "execution",
    prompt: string,
    toastTitle: string,
    toastDescription: string,
  ) => {
    closeInspector();
    setLocation(`/samm?mode=${mode}&prompt=${encodeURIComponent(prompt)}`);
    toast({
      title: toastTitle,
      description: toastDescription,
    });
  }, [closeInspector, setLocation, toast]);

  const workflowActions = useMemo(
    () =>
      source && planningSession
        ? {
            reviewPlanningSession: () => {
              closeInspector();
              toast({
                title: "Review the month visually",
                description: "Inspect the month grid, then open day or campaign drawers before you commit any changes.",
              });
            },
            commitPlanningSession: (data: MonthlyPlanningSessionViewData) => {
              closeInspector();
              if (data.keyCampaigns.length === 0) {
                openCreateDialog({
                  event_type: "other",
                  event_date: `${data.planningMonth}-01`,
                });
                toast({
                  title: "Add a key date first",
                  description: "This month has no committed campaign windows yet, so start by adding one.",
                });
                return;
              }

              toast({
                title: "Calendar truth is already current",
                description: "This Studio view is already reading from committed calendar windows. Edit rules or add a key date to change the month.",
              });
            },
            addCampaignOrKeyDate: (data: MonthlyPlanningSessionViewData) => {
              openCreateDialog({
                event_type: "other",
                event_date: `${data.planningMonth}-01`,
              });
            },
            createDraftsForDay: (data: CalendarDayPanelViewData) => {
              const dayLabel = format(new Date(data.date), "MMMM d, yyyy");
              const prompt = data.campaignContext
                ? `Create drafts for ${dayLabel} inside the ${data.campaignContext.name} campaign window using the committed calendar rules.`
                : `Create drafts for ${dayLabel} using the committed calendar rules and current open slots.`;
              handoffToSamm(
                "execution",
                prompt,
                "Execution handoff prepared",
                `samm is ready in Execution mode with day-level draft context for ${dayLabel}.`,
              );
            },
            addManualForDay: (data: CalendarDayPanelViewData) => {
              const dayLabel = format(new Date(data.date), "MMMM d, yyyy");
              const prompt = data.campaignContext
                ? `Help me decide the right manual content to add on ${dayLabel} inside the ${data.campaignContext.name} campaign window. Explain the why before we commit anything.`
                : `Help me decide the right manual content to add on ${dayLabel}. Explain the why before we commit anything.`;
              handoffToSamm(
                "planning",
                prompt,
                "Planning handoff prepared",
                `samm is ready in Planning mode to help shape the manual content for ${dayLabel}.`,
              );
            },
            editRulesForDay: (data: CalendarDayPanelViewData) => {
              if (data.campaignContext?.id) {
                openEditDialog(data.campaignContext.id);
                return;
              }

              openCreateDialog({
                event_type: "other",
                event_date: data.date,
                event_end_date: data.date,
              });
              toast({
                title: "Add a calendar window first",
                description: "This day has no campaign rules yet, so start by creating a key date or campaign window.",
              });
            },
            deleteWindowForDay: (data: CalendarDayPanelViewData) => {
              if (!data.campaignContext?.id) {
                toast({
                  title: "Nothing to delete here",
                  description: "This day does not currently belong to a committed calendar window.",
                  variant: "destructive",
                });
                return;
              }

              if (data.date !== data.campaignContext.eventDate) {
                toast({
                  title: "Delete from the actual campaign day",
                  description: `This window can only be deleted from ${format(new Date(data.campaignContext.eventDate), "MMMM d, yyyy")}, not from a lead-window day.`,
                  variant: "destructive",
                });
                return;
              }

              requestDeleteWindow(data.campaignContext.id);
            },
            createDraftsForCampaign: (data: CampaignPanelViewData) => {
              const prompt = `Create drafts for the ${data.name} campaign window from ${format(new Date(data.startDate), "MMMM d")} to ${format(new Date(data.endDate), "MMMM d, yyyy")} using the committed campaign rules.`;
              handoffToSamm(
                "execution",
                prompt,
                "Execution handoff prepared",
                `samm is ready in Execution mode with the ${data.name} campaign context.`,
              );
            },
            editCampaignRules: (data: CampaignPanelViewData) => {
              openEditDialog(data.id);
            },
            updateAssetStatus: (data: AssetReadinessRecordViewData, intent?: "mark_ready" | "request_assets" | "update_notes") => {
              const intentCopy =
                intent === "mark_ready"
                  ? "I have assets ready"
                  : intent === "request_assets"
                    ? "I need assets"
                    : "Help me update asset status";
              const prompt = `${intentCopy} for ${data.contextLabel}. Help me capture the right asset context, gaps, and next step before anything is committed.`;
              handoffToSamm(
                "planning",
                prompt,
                "Planning handoff prepared",
                `samm is ready in Planning mode to work through asset readiness for ${data.contextLabel}.`,
              );
            },
          }
        : null,
    [source, planningSession, closeInspector, toast, openCreateDialog, handoffToSamm, openEditDialog, requestDeleteWindow],
  );

  useRegisterCalendarStudioWorkflow(workflowActions);

  const handleDayClick = (day: CalendarDayCellViewData) => {
    if (!source || !day.isCurrentMonth) return;
    const detail = buildCalendarStudioDayDetail(source, day.date);
    openInspector(
      createInspectorPayload(
        format(new Date(day.date), "MMMM d, yyyy"),
        {
          type: "calendar_day_panel",
          title: format(new Date(day.date), "MMMM d, yyyy"),
          data: detail,
        },
        day.campaignName ? `Campaign context: ${day.campaignName}` : "Daily calendar detail",
      ),
    );
  };

  const handleCampaignClick = (campaignId: string) => {
    if (!source) return;
    const detail = buildCalendarStudioCampaignWindowDetail(source, campaignId);
    openInspector(
      createInspectorPayload(
        detail.name,
        {
          type: "campaign_panel",
          title: detail.name,
          data: detail,
        },
        `${format(new Date(detail.startDate), "MMM d")} - ${format(new Date(detail.endDate), "MMM d, yyyy")}`,
      ),
    );
  };

  const handlePlanMonth = () => {
    if (!planningSession) return;
    openInspector(
      createInspectorPayload(
        `Plan ${format(monthDate, "MMMM yyyy")}`,
        {
          type: "monthly_planning_session",
          title: `Plan ${format(monthDate, "MMMM yyyy")}`,
          data: planningSession,
        },
        "Structured monthly planning intake. No committed changes yet.",
      ),
    );
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError || !source || !monthGrid || !planningSession) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          <div className="rounded-2xl border border-red-200 bg-red-50/70 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
            {error instanceof Error ? error.message : "Calendar Studio could not load the current calendar state."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">Calendar Studio</p>
              <div className="mt-1 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMonthDate((current) => addMonths(current, -1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={14} />
                </button>
                <h1 className="text-2xl font-semibold text-foreground">{monthGrid.monthLabel}</h1>
                <button
                  type="button"
                  onClick={() => setMonthDate((current) => addMonths(current, 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Next month"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Plan the month. Commit it. samm turns the rest into deterministic calendar truth.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePlanMonth}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[12px] font-medium text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90"
              data-testid="open-monthly-planning"
            >
              <Sparkles size={13} /> Plan this month
            </button>
          </div>

          <CalendarMonthGrid data={monthGrid} onDayClick={handleDayClick} onCampaignClick={handleCampaignClick} />
        </div>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setCreateForm(BLANK_FORM);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add campaign or key date</DialogTitle>
            <DialogDescription>
              Add a real calendar window that Calendar Studio can treat as committed planning truth.
            </DialogDescription>
          </DialogHeader>
          <EventForm
            value={createForm}
            onChange={setCreateForm}
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate({
                data: {
                  ...createForm,
                  event_end_date: createForm.event_end_date || null,
                },
              });
            }}
            isPending={createMutation.isPending}
            submitLabel="Save window"
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editWindowId)}
        onOpenChange={(open) => {
          if (!open) setEditWindowId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit campaign rules</DialogTitle>
            <DialogDescription>
              Update the underlying calendar window so future planning and draft creation stay aligned with the real rules.
            </DialogDescription>
          </DialogHeader>
          <EventForm
            value={editForm}
            onChange={setEditForm}
            onSubmit={(event) => {
              event.preventDefault();
              if (!editWindowId) return;
              updateMutation.mutate({
                id: editWindowId,
                data: {
                  ...editForm,
                  event_end_date: editForm.event_end_date || null,
                },
              });
            }}
            isPending={updateMutation.isPending}
            submitLabel="Save changes"
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteWindowTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteWindowTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this campaign window?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteWindowTarget
                ? `${deleteWindowTarget.label} will be removed from ${format(new Date(deleteWindowTarget.startDate), "MMMM d, yyyy")} to ${format(new Date(deleteWindowTarget.endDate), "MMMM d, yyyy")}. Days in that range will become open again, and future draft creation will stop using this window.`
                : "This removes the committed calendar window and reopens the affected days."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteWindowTarget) return;
                deleteMutation.mutate({ id: deleteWindowTarget.id });
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete window"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

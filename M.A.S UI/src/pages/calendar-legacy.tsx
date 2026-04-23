import { useState } from "react";
import { format } from "date-fns";
import {
  useListCalendarEvents,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
  getListCalendarEventsQueryKey,
} from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, CheckCircle2, Clock, ExternalLink, Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { useWorkspaceInspector } from "@/components/layout";
import { createInspectorPayload } from "@/lib/workspace-adapter";
import { cn } from "@/lib/utils";



type EventFormData = {
  event_type: string;
  event_date: string;
  event_end_date: string;
  label: string;
  universities: string[];
  creative_override_allowed: boolean;
  support_content_allowed: boolean;
};


const EVENT_TYPE_OPTIONS = [
  { value: "launch", label: "Launch" },
  { value: "promotion", label: "Promotion" },
  { value: "seasonal", label: "Seasonal" },
  { value: "community", label: "Community" },
  { value: "deadline", label: "Deadline" },
  { value: "other", label: "Other" },
] as const;

const LEGACY_EVENT_TYPE_MAP: Record<string, string> = {
  exam: "deadline",
  registration: "launch",
  holiday: "seasonal",
  orientation: "community",
  graduation: "promotion",
  other: "other",
};

function normalizeEventType(eventType: string | null | undefined) {
  if (!eventType) return "other";
  return LEGACY_EVENT_TYPE_MAP[eventType] ?? eventType;
}

function getEventTypeLabel(eventType: string | null | undefined) {
  const normalized = normalizeEventType(eventType);
  return EVENT_TYPE_OPTIONS.find((option) => option.value === normalized)?.label ?? "Other";
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  launch: "bg-primary",
  promotion: "bg-amber-500",
  seasonal: "bg-emerald-500",
  community: "bg-blue-500",
  deadline: "bg-violet-500",
  other: "bg-slate-400",
};

function isPastEvent(event: any) {
  const anchor = new Date(event.event_end_date ?? event.event_date);
  return anchor < new Date() && anchor.toDateString() !== new Date().toDateString();
}

function toInspectorEventType(eventType: string | null | undefined) {
  switch (normalizeEventType(eventType)) {
    case "launch":
      return "campaign_launch" as const;
    case "promotion":
      return "promotion" as const;
    case "seasonal":
      return "holiday" as const;
    case "community":
      return "webinar" as const;
    case "deadline":
      return "product_release" as const;
    case "other":
    default:
      return "campaign_launch" as const;
  }
}

function buildCalendarInspectorPayload(event: any) {
  const audienceTags = Array.isArray(event.universities)
    ? event.universities.filter((tag: string) => Boolean(tag))
    : [];

  return createInspectorPayload(
    event.label,
    {
      type: "calendar_event_inspector",
      title: event.label,
      data: {
        id: event.id,
        name: event.label,
        eventType: toInspectorEventType(event.event_type),
        startDate: event.event_date,
        endDate: event.event_end_date ?? undefined,
        campaignType: getEventTypeLabel(event.event_type),
        priority: "medium",
        status: isPastEvent(event) ? "completed" : event.triggered ? "active" : "planned",
        ownerPipeline: "C",
        supportContentAllowed: Boolean(event.support_content_allowed),
        creativeOverrideAllowed: Boolean(event.creative_override_allowed),
        audienceTags,
        targetICP: audienceTags.length ? audienceTags.join(", ") : undefined,
        notes: undefined,
      },
    },
    `${getEventTypeLabel(event.event_type)} event on ${event.event_date}`,
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
  onChange: (v: EventFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  submitLabel: string;
}) {

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Event Type</Label>
          <Select value={value.event_type} onValueChange={(v) => onChange({ ...value, event_type: v })}>
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
            onChange={(e) => onChange({ ...value, event_date: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>End Date <span className="text-muted-foreground">(optional)</span></Label>
          <Input
            type="date"
            value={value.event_end_date}
            min={value.event_date}
            onChange={(e) => onChange({ ...value, event_end_date: e.target.value })}
          />
          <p className="text-[11px] text-muted-foreground">For events that run over several days, like sales windows, conferences, or festivals.</p>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Label / Description</Label>
        <Input
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          placeholder="e.g. Grand opening weekend"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Audience Tags <span className="text-muted-foreground">(optional)</span></Label>
        <Input
          value={value.universities.join(", ")}
          onChange={(e) =>
            onChange({
              ...value,
              universities: e.target.value
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            })
          }
          placeholder="e.g. students, staff, shoppers, vendors"
        />
        <p className="text-[11px] text-muted-foreground">
          Use short labels for the people this event matters to. Leave blank if it is a general event.
        </p>
      </div>
      {["seasonal", "promotion", "other"].includes(value.event_type) && (
        <div className="space-y-3 rounded-md border border-amber-100 bg-amber-50/50 p-3">
          <div className="flex items-start gap-3">
            <Switch
              checked={value.support_content_allowed}
              onCheckedChange={(v) => onChange({ ...value, support_content_allowed: v })}
            />
            <div>
              <Label className="text-xs font-semibold text-amber-800">
                Allow support content
              </Label>
              <p className="mt-0.5 text-[11px] leading-snug text-amber-700/80">
                Lets Pipeline B fill support-only slots inside this campaign window. Support content must follow the campaign CTA, message, and channel rules.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Switch
              checked={value.creative_override_allowed}
              onCheckedChange={(v) => onChange({ ...value, creative_override_allowed: v })}
            />
            <div>
              <Label className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                <Sparkles className="h-3 w-3" /> Allow creative deviation
              </Label>
              <p className="mt-0.5 text-[11px] leading-snug text-amber-700/80">
                Permits the design agent to deviate from the brand palette within the accent color family. Use for seasonal or celebratory events.
              </p>
            </div>
          </div>
        </div>
      )}
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

const BLANK_FORM: EventFormData = {
  event_type: "launch",
  event_date: new Date().toISOString().split("T")[0],
  event_end_date: "",
  label: "",
  universities: [],
  creative_override_allowed: false,
  support_content_allowed: false,
};

function EventCard({
  event,
  onInspect,
  onEdit,
  onDelete,
  deleteDisabled,
}: {
  event: any;
  onInspect: (event: any) => void;
  onEdit: (event: any) => void;
  onDelete: (id: string) => void;
  deleteDisabled: boolean;
}) {
  const startDate = new Date(event.event_date);
  const endDate = event.event_end_date ? new Date(event.event_end_date) : null;
  const normalizedType = normalizeEventType(event.event_type);
  const isToday = new Date().toDateString() === startDate.toDateString();
  const isPast = isPastEvent(event);
  const audienceTags = Array.isArray(event.universities)
    ? event.universities.filter((tag: string) => Boolean(tag))
    : [];

  const windowCopy = isPast
    ? "Window closed"
    : event.triggered
      ? "Live planning window"
      : "Awaiting calendar trigger";

  return (
    <div
      className={cn(
        "group cursor-pointer space-y-3 rounded-xl border border-border bg-card p-4 transition-all",
        !isPast && "hover:border-border/80 hover:shadow-sm",
        isPast && "opacity-60",
      )}
      onClick={() => onInspect(event)}
      data-testid={`calendar-event-${event.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
              EVENT_TYPE_COLORS[normalizedType] ?? "bg-muted-foreground",
            )}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-snug text-foreground">{event.label}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {getEventTypeLabel(event.event_type)} · {format(startDate, "MMM d")}
              {endDate ? ` – ${format(endDate, "MMM d")}` : ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium",
              isToday
                ? "border-primary/20 bg-primary/10 text-primary"
                : isPast
                  ? "border-border bg-muted text-muted-foreground"
                  : "border-slate-200 bg-slate-50 text-slate-600",
            )}
          >
            {isToday ? "Today" : isPast ? "Past" : "Upcoming"}
          </span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium",
              event.triggered
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700",
            )}
          >
            {event.triggered ? "Triggered" : "Pending"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          {getEventTypeLabel(event.event_type)}
        </span>
        {(normalizedType === "seasonal" || normalizedType === "promotion") && (
          <span className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            Campaign window
          </span>
        )}
        {event.support_content_allowed ? (
          <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            Support allowed
          </span>
        ) : null}
        {event.creative_override_allowed ? (
          <span className="rounded border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
            Creative deviation
          </span>
        ) : null}
        {audienceTags.slice(0, 3).map((tag: string) => (
          <span key={tag} className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground">
        Starts {format(startDate, "MMM d, yyyy")}
        {endDate ? ` · Ends ${format(endDate, "MMM d, yyyy")}` : ""}
      </p>

      <div className="flex items-center gap-2 pt-1" onClick={(event) => event.stopPropagation()}>
        <div className="mr-auto flex items-center gap-1 text-[10px] text-muted-foreground">
          {event.triggered ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          ) : (
            <Clock className="h-3 w-3" />
          )}
          <span>{windowCopy}</span>
        </div>

        <button
          type="button"
          className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          onClick={() => onEdit(event)}
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
        <button
          type="button"
          className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
          onClick={() => onDelete(event.id)}
          disabled={deleteDisabled}
        >
          <Trash2 className="h-3 w-3" /> Delete
        </button>
        <button
          type="button"
          className="ml-auto flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground opacity-0 transition-all hover:bg-muted group-hover:opacity-100"
          onClick={() => onInspect(event)}
        >
          <ExternalLink className="h-3 w-3" /> Open
        </button>
      </div>
    </div>
  );
}

export default function Calendar() {
  const { data: events, isLoading } = useListCalendarEvents();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { openInspector } = useWorkspaceInspector();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListCalendarEventsQueryKey() });

  const createMutation = useCreateCalendarEvent({
    mutation: { onSuccess: () => { invalidate(); setCreateOpen(false); } },
  });
  const updateMutation = useUpdateCalendarEvent({
    mutation: { onSuccess: () => { invalidate(); setEditEvent(null); } },
  });
  const deleteMutation = useDeleteCalendarEvent({
    mutation: {
      onSuccess: () => { invalidate(); setDeleteId(null); },
      onError: (err: any) => toast({ title: "Failed to delete event", description: err?.message ?? "Unknown error", variant: "destructive" }),
    },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<EventFormData>(BLANK_FORM);

  const [editEvent, setEditEvent] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<EventFormData>(BLANK_FORM);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  function openEdit(event: any) {
    setEditForm({
      event_type: normalizeEventType(event.event_type),
      event_date: event.event_date,
      event_end_date: event.event_end_date ?? "",
      label: event.label,
      universities: event.universities ?? [],
      creative_override_allowed: event.creative_override_allowed ?? false,
      support_content_allowed: event.support_content_allowed ?? false,
    });
    setEditEvent(event);
  }

  const upcoming = (events ?? []).filter((event: any) => !isPastEvent(event));
  const past = (events ?? []).filter((event: any) => isPastEvent(event));

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-border px-6 pb-4 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Calendar</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{upcoming.length} upcoming events</p>
          </div>

          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (open) setCreateForm(BLANK_FORM);
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Event</DialogTitle>
                <DialogDescription>
                  Add a future date that samm can plan around, like a launch, deadline, seasonal moment, or community event.
                </DialogDescription>
              </DialogHeader>
              <EventForm
                value={createForm}
                onChange={setCreateForm}
                onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ data: createForm }); }}
                isPending={createMutation.isPending}
                submitLabel="Save Event"
              />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Edit dialog */}
      <Dialog open={!!editEvent} onOpenChange={(open) => { if (!open) setEditEvent(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update the timing, label, or audience tags so future planning stays aligned with the real event.
            </DialogDescription>
          </DialogHeader>
          <EventForm
            value={editForm}
            onChange={setEditForm}
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({ id: editEvent.id, data: editForm });
            }}
            isPending={updateMutation.isPending}
            submitLabel="Save Changes"
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Any automations tied to this event will stop using it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))
          ) : events?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <CalendarDays className="mx-auto mb-4 h-12 w-12 opacity-20" />
              <p className="text-sm font-medium">No upcoming events</p>
              <p className="mt-1 text-xs">Add a calendar window to anchor future planning</p>
            </div>
          ) : (
            <>
              <div>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming</h2>
                <div className="space-y-3">
                  {upcoming.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No upcoming events</p>
                  ) : (
                    upcoming.map((event: any) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onInspect={(nextEvent) => openInspector(buildCalendarInspectorPayload(nextEvent))}
                        onEdit={openEdit}
                        onDelete={setDeleteId}
                        deleteDisabled={deleteMutation.isPending}
                      />
                    ))
                  )}
                </div>
              </div>

              {past.length > 0 ? (
                <div>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Past</h2>
                  <div className="space-y-3">
                    {past.map((event: any) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onInspect={(nextEvent) => openInspector(buildCalendarInspectorPayload(nextEvent))}
                        onEdit={openEdit}
                        onDelete={setDeleteId}
                        deleteDisabled={deleteMutation.isPending}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}



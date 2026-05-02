import type { FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export type EventFormData = {
  event_type: string;
  event_date: string;
  event_end_date: string;
  label: string;
  universities: string[];
  creative_override_allowed: boolean;
  support_content_allowed: boolean;
};

export type OneTimePostFormData = {
  scheduled_for: string;
  title: string;
  topic: string;
  platform: "all" | "facebook" | "instagram" | "linkedin" | "whatsapp" | "youtube" | "email" | "blog";
  asset_need: "none" | "static" | "carousel" | "video";
  event_ref: string | null;
  campaign_name: string | null;
};

export type ManualEntryType = "one_time" | "campaign";

export const EVENT_TYPE_OPTIONS = [
  { value: "launch", label: "Launch" },
  { value: "promotion", label: "Promotion" },
  { value: "seasonal", label: "Seasonal" },
  { value: "community", label: "Community" },
  { value: "deadline", label: "Deadline" },
  { value: "other", label: "Other" },
] as const;

export const BLANK_FORM: EventFormData = {
  event_type: "launch",
  event_date: new Date().toISOString().split("T")[0],
  event_end_date: "",
  label: "",
  universities: [],
  creative_override_allowed: false,
  support_content_allowed: false,
};

export const BLANK_ONE_TIME_POST_FORM: OneTimePostFormData = {
  scheduled_for: new Date().toISOString().split("T")[0],
  title: "",
  topic: "",
  platform: "all",
  asset_need: "none",
  event_ref: null,
  campaign_name: null,
};

const MANUAL_ENTRY_OPTIONS = [
  { value: "one_time", label: "One-time post" },
  { value: "campaign", label: "Campaign" },
] satisfies Array<{ value: ManualEntryType; label: string }>;

export function buildCampaignFormForDate(date: string): EventFormData {
  return {
    ...BLANK_FORM,
    event_date: date,
    event_end_date: "",
  };
}

export function buildOneTimePostFormForDay({
  date,
  campaignId,
  campaignName,
}: {
  date: string;
  campaignId?: string | null;
  campaignName?: string | null;
}): OneTimePostFormData {
  return {
    ...BLANK_ONE_TIME_POST_FORM,
    scheduled_for: date,
    title: "",
    event_ref: campaignId ?? null,
    campaign_name: campaignName ?? null,
  };
}

export function EventForm({
  value,
  onChange,
  onSubmit,
  isPending,
  submitLabel,
}: {
  value: EventFormData;
  onChange: (nextValue: EventFormData) => void;
  onSubmit: (event: FormEvent) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-4">
      <div className="grid gap-4 sm:grid-cols-2">
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
        <Label>Theme / title</Label>
        <Input
          value={value.label}
          onChange={(event) => onChange({ ...value, label: event.target.value })}
          placeholder="e.g. Mother's Day promotion"
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
        <div className="rounded-md border border-amber-100 bg-amber-50/50 p-3">
          <div className="flex items-start gap-3">
            <Switch
              checked={value.creative_override_allowed}
              onCheckedChange={(nextValue) => onChange({ ...value, creative_override_allowed: nextValue })}
            />
            <div>
              <Label className="text-xs font-semibold text-amber-800">Allow creative deviation</Label>
              <p className="mt-0.5 text-[11px] leading-snug text-amber-700/80">
                Lets Pipeline C loosen palette strictness for event-specific accents while keeping core brand rules intact.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function OneTimePostForm({
  value,
  onChange,
  onSubmit,
  isPending,
}: {
  value: OneTimePostFormData;
  onChange: (nextValue: OneTimePostFormData) => void;
  onSubmit: (event: FormEvent) => void;
  isPending: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Date</Label>
        <Input
          type="date"
          value={value.scheduled_for}
          onChange={(event) => onChange({ ...value, scheduled_for: event.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>
          Theme / title <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          value={value.title}
          onChange={(event) => onChange({ ...value, title: event.target.value })}
          placeholder="e.g. Graduation reminder"
        />
        <p className="text-[11px] text-muted-foreground">
          This gives the draft a clean internal name. If you leave it blank, samm will derive one from the final headline.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Post brief</Label>
        <Textarea
          value={value.topic}
          onChange={(event) => onChange({ ...value, topic: event.target.value })}
          placeholder="Describe the one-time post samm should draft."
          className="min-h-[120px]"
          required
        />
        <p className="text-[11px] text-muted-foreground">
          Keep it simple: what the post is about, who it is for, and the action you want the audience to take.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Primary channel</Label>
          <Select value={value.platform} onValueChange={(nextValue: OneTimePostFormData["platform"]) => onChange({ ...value, platform: nextValue })}>
            <SelectTrigger>
              <SelectValue placeholder="Choose channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All supported channels</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="blog">Blog</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Visual need</Label>
          <Select
            value={value.asset_need}
            onValueChange={(nextValue: OneTimePostFormData["asset_need"]) => onChange({ ...value, asset_need: nextValue })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select visual need" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Text only</SelectItem>
              <SelectItem value="static">Single image</SelectItem>
              <SelectItem value="carousel">Carousel</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {value.campaign_name ? (
        <div className="rounded-md border border-amber-100 bg-amber-50/60 p-3 text-[11px] leading-relaxed text-amber-800">
          This day sits inside the <span className="font-semibold">{value.campaign_name}</span> campaign window. samm will keep that context while treating this as a one-time post, not a new campaign.
        </div>
      ) : (
        <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
          One-time posts do not create campaign windows. Use this for a single dated post that should land on the calendar directly.
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Queueing..." : "Queue one-time post"}
        </Button>
      </div>
    </form>
  );
}

export function ManualEntryPanel({
  entryType,
  campaignForm,
  oneTimeForm,
  onEntryTypeChange,
  onCampaignFormChange,
  onOneTimeFormChange,
  onCampaignSubmit,
  onOneTimeSubmit,
  isCampaignPending,
  isOneTimePending,
  onCancel,
}: {
  entryType: ManualEntryType;
  campaignForm: EventFormData;
  oneTimeForm: OneTimePostFormData;
  onEntryTypeChange: (nextValue: ManualEntryType) => void;
  onCampaignFormChange: (nextValue: EventFormData) => void;
  onOneTimeFormChange: (nextValue: OneTimePostFormData) => void;
  onCampaignSubmit: (event: FormEvent) => void;
  onOneTimeSubmit: (event: FormEvent) => void;
  isCampaignPending: boolean;
  isOneTimePending: boolean;
  onCancel?: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Add manually</p>
            <h3 className="mt-1 text-xl font-semibold leading-tight text-foreground">Choose the right calendar item</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              Add a standalone one-time post or create a campaign window for this date.
            </p>
          </div>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              aria-label="Back to day detail"
            >
              <ArrowLeft size={14} />
            </button>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>What are you adding?</Label>
          <Select value={entryType} onValueChange={(nextValue: ManualEntryType) => onEntryTypeChange(nextValue)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose type" />
            </SelectTrigger>
            <SelectContent>
              {MANUAL_ENTRY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {entryType === "one_time" ? (
          <OneTimePostForm value={oneTimeForm} onChange={onOneTimeFormChange} onSubmit={onOneTimeSubmit} isPending={isOneTimePending} />
        ) : (
          <EventForm
            value={campaignForm}
            onChange={onCampaignFormChange}
            onSubmit={onCampaignSubmit}
            isPending={isCampaignPending}
            submitLabel="Save campaign window"
          />
        )}
      </div>
    </div>
  );
}

import ReactMarkdown from "react-markdown";
import { CalendarDays, ExternalLink, Image as ImageIcon, Link2, MessageSquareQuote, Target } from "lucide-react";
import { ChannelIcon } from "../shared/ChannelIcon";
import { StatusChip } from "../shared/StatusChip";

type ContentData = {
  platform?: string | null;
  platforms?: string[] | null;
  body?: string | null;
  subject_line?: string | null;
  campaign_name?: string | null;
  status?: string | null;
  created_at?: string | null;
  media_url?: string | null;
  metadata?: Record<string, unknown> | null;
};

function coerceChannel(value?: string | null) {
  const normalized = (value ?? "").toLowerCase();

  switch (normalized) {
    case "facebook":
    case "whatsapp":
    case "youtube":
    case "email":
    case "design_brief":
    case "linkedin":
    case "instagram":
    case "twitter":
      return normalized as
        | "facebook"
        | "whatsapp"
        | "youtube"
        | "email"
        | "design_brief"
        | "linkedin"
        | "instagram"
        | "twitter";
    default:
      return "facebook";
  }
}

function formatDate(value?: string | null) {
  if (!value) return "No date";
  return new Date(value).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

export function LinkedContentListWidget({ data }: { data: ContentData }) {
  const title = data.subject_line || data.campaign_name || "Content item";
  const metadata = data.metadata ?? {};
  const primaryMessage = stringifyValue(metadata.primary_message);
  const requiredCta = stringifyValue(metadata.required_cta_text) || stringifyValue(metadata.call_to_action);
  const purpose = stringifyValue(metadata.purpose) || stringifyValue(metadata.slot_purpose);
  const channel = coerceChannel(data.platform);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ChannelIcon channel={channel} size={16} />
              <span className="text-sm font-semibold text-foreground capitalize">{channel.replace("_", " ")}</span>
              <StatusChip status={(data.status ?? "draft") as never} />
            </div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(data.created_at)}
              </span>
              {data.campaign_name && (
                <span className="inline-flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  {data.campaign_name}
                </span>
              )}
            </div>
          </div>
          {Array.isArray(data.platforms) && data.platforms.length > 1 && (
            <div className="rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px] font-medium text-muted-foreground">
              Shared across {data.platforms.length} channels
            </div>
          )}
        </div>
      </div>

      {data.media_url && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <img src={data.media_url} alt="Attached media" className="max-h-64 w-full object-cover" />
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px] font-medium text-muted-foreground">
          <MessageSquareQuote className="h-3.5 w-3.5" />
          Full draft
        </div>
        <div className="prose prose-sm max-w-none text-[13px] leading-relaxed prose-p:my-2 prose-strong:text-foreground">
          <ReactMarkdown>{data.body ?? "No content body available."}</ReactMarkdown>
        </div>
      </div>

      {(primaryMessage || requiredCta || purpose) && (
        <div className="grid gap-3 md:grid-cols-3">
          {purpose && (
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Purpose</p>
              <p className="mt-1 text-sm font-medium text-foreground">{purpose}</p>
            </div>
          )}
          {requiredCta && (
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Required CTA</p>
              <p className="mt-1 text-sm font-medium text-foreground">{requiredCta}</p>
            </div>
          )}
          {primaryMessage && (
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
              <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                Message direction
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">{primaryMessage}</p>
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
          <ExternalLink className="h-3.5 w-3.5 text-primary" />
          Inspector note
        </span>
        <p className="mt-1">Use the card actions to approve, reject, edit, or replace imagery. This inspector is for focused review, not inline expansion.</p>
      </div>
    </div>
  );
}

import ReactMarkdown from "react-markdown";
import { CalendarDays, Link2, MessageSquareQuote, Target } from "lucide-react";
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

const platformAccent: Record<string, string> = {
  facebook: "border-blue-200/80 bg-gradient-to-br from-blue-50 via-blue-50/70 to-white",
  whatsapp: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-emerald-50/70 to-white",
  youtube: "border-red-200/80 bg-gradient-to-br from-red-50 via-rose-50/70 to-white",
  email: "border-amber-200/80 bg-gradient-to-br from-amber-50 via-yellow-50/60 to-white",
  linkedin: "border-blue-200/80 bg-gradient-to-br from-blue-50 via-sky-50/70 to-white",
  instagram: "border-fuchsia-200/80 bg-gradient-to-br from-fuchsia-50 via-purple-50/70 to-white",
  twitter: "border-sky-200/80 bg-gradient-to-br from-sky-50 via-cyan-50/70 to-white",
  design_brief: "border-violet-200/80 bg-gradient-to-br from-violet-50 via-fuchsia-50/60 to-white",
};

function getTags(metadata: Record<string, unknown>) {
  const sources = [metadata.pattern_tags, metadata.tags, metadata.hashtags];
  const values = new Set<string>();

  for (const source of sources) {
    if (Array.isArray(source)) {
      for (const entry of source) {
        const value = stringifyValue(entry);
        if (value) values.add(value.replace(/^#/, ""));
      }
    }
  }

  return Array.from(values).slice(0, 6);
}

export function LinkedContentListWidget({ data }: { data: ContentData }) {
  const title = data.subject_line || data.campaign_name || "Content item";
  const metadata = data.metadata ?? {};
  const primaryMessage = stringifyValue(metadata.primary_message);
  const requiredCta = stringifyValue(metadata.required_cta_text) || stringifyValue(metadata.call_to_action);
  const purpose = stringifyValue(metadata.purpose) || stringifyValue(metadata.slot_purpose);
  const channel = coerceChannel(data.platform);
  const tags = getTags(metadata);
  const accentClass = platformAccent[channel] ?? "border-border bg-gradient-to-br from-muted/30 via-background to-white";

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-5 ${accentClass}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ChannelIcon channel={channel} size={16} />
              <span className="text-sm font-semibold text-foreground capitalize">{channel.replace("_", " ")}</span>
              <StatusChip status={(data.status ?? "draft") as never} />
            </div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {Array.isArray(data.platforms) && data.platforms.length > 1 && (
              <div className="rounded-full border border-white/70 bg-white/75 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                Shared across {data.platforms.length} channels
              </div>
            )}
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
        </div>

        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/70 bg-white/75 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {data.media_url && (
          <div className="mt-4 overflow-hidden rounded-xl border border-white/60 bg-white/60">
            <img src={data.media_url} alt="Attached media" className="max-h-64 w-full object-cover" />
          </div>
        )}
      </div>

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
    </div>
  );
}

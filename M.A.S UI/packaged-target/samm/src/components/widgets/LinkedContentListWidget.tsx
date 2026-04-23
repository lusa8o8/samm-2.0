import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Link2,
  MessageSquareQuote,
  RefreshCw,
  Tag,
  Target,
  XCircle,
} from "lucide-react";
import { getListContentQueryKey, useActionContent, useRetryContent } from "@/lib/api";
import { stripMarkdownToPreviewText } from "@/lib/utils";
import { ChannelIcon } from "../shared/ChannelIcon";
import { StatusChip } from "../shared/StatusChip";

type ContentData = {
  id?: string;
  pipeline_run_id?: string | null;
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

function clipText(value: string, max = 140) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3).trimEnd()}...`;
}

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

function ActionButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function MetaCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
      <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium leading-snug text-foreground">{value}</p>
    </div>
  );
}

const platformAccent: Record<string, string> = {
  facebook: "border-blue-200/90 bg-gradient-to-br from-blue-50 via-blue-50/85 to-white",
  whatsapp: "border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-emerald-50/85 to-white",
  youtube: "border-red-200/90 bg-gradient-to-br from-red-50 via-rose-50/85 to-white",
  email: "border-amber-200/90 bg-gradient-to-br from-amber-50 via-yellow-50/80 to-white",
  linkedin: "border-blue-200/90 bg-gradient-to-br from-blue-50 via-sky-50/85 to-white",
  instagram: "border-fuchsia-200/90 bg-gradient-to-br from-fuchsia-50 via-purple-50/80 to-white",
  twitter: "border-sky-200/90 bg-gradient-to-br from-sky-50 via-cyan-50/85 to-white",
  design_brief: "border-violet-200/90 bg-gradient-to-br from-violet-50 via-fuchsia-50/80 to-white",
};

export function LinkedContentListWidget({ data }: { data: ContentData }) {
  const queryClient = useQueryClient();
  const [actionState, setActionState] = useState<"approved" | "rejected" | "retrying" | null>(null);
  const metadata = data.metadata ?? {};
  const title = data.subject_line || data.campaign_name || "Content item";
  const preview = clipText(stripMarkdownToPreviewText(data.body ?? ""), 160);
  const campaign = stringifyValue(data.campaign_name) || stringifyValue(metadata.campaign_name);
  const objective = stringifyValue(metadata.objective) || stringifyValue(metadata.purpose) || stringifyValue(metadata.slot_purpose);
  const requiredCta = stringifyValue(metadata.required_cta_text) || stringifyValue(metadata.call_to_action);
  const primaryMessage = stringifyValue(metadata.primary_message);
  const channel = coerceChannel(data.platform);
  const tags = getTags(metadata);
  const accentClass = platformAccent[channel] ?? "border-border bg-gradient-to-br from-muted/30 via-background to-white";
  const isDraft = data.status === "draft";
  const isFailed = data.status === "failed";
  const itemKind =
    data.platform === "email"
      ? "Email"
      : data.subject_line
        ? "Article"
        : "Post";

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListContentQueryKey() });
    queryClient.invalidateQueries({ queryKey: ["inbox-items"] });
    queryClient.invalidateQueries({ queryKey: ["inbox-summary"] });
    queryClient.invalidateQueries({ queryKey: ["pipeline-status"] });
    queryClient.invalidateQueries({ queryKey: ["pipeline-runs"] });
  };

  const actionMutation = useActionContent({
    mutation: {
      onSuccess: invalidate,
    },
  });
  const retryMutation = useRetryContent({
    mutation: {
      onSuccess: invalidate,
    },
  });

  async function handleApprove() {
    if (!data.id) return;
    await actionMutation.mutateAsync({
      id: data.id,
      pipelineRunId: data.pipeline_run_id,
      platform: data.platform,
      data: { action: "approve" },
    });
    setActionState("approved");
  }

  async function handleReject() {
    if (!data.id) return;
    await actionMutation.mutateAsync({
      id: data.id,
      pipelineRunId: data.pipeline_run_id,
      platform: data.platform,
      data: { action: "reject", note: "Rejected from packaged content inspector" },
    });
    setActionState("rejected");
  }

  async function handleRetry() {
    if (!data.id) return;
    await retryMutation.mutateAsync({ id: data.id });
    setActionState("retrying");
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border p-4 ${accentClass}`}>
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[12px] text-foreground">
                <ChannelIcon channel={channel} size={16} />
                <span className="font-medium capitalize">{channel.replace("_", " ")}</span>
                <span className="text-muted-foreground">{" · "}{itemKind}</span>
              </div>
              <h3 className="text-[1.1rem] font-semibold leading-snug text-foreground sm:text-[1.2rem]">{title}</h3>
              {preview && (
                <p className="max-w-[54ch] text-[13px] leading-[1.65] text-foreground/74">
                  {preview}
                </p>
              )}
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              {isDraft && <StatusChip status={"draft" as never} />}
              <StatusChip status={((isDraft ? "pending" : data.status) ?? "draft") as never} />
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3 w-3" />
              {formatDate(data.created_at)}
            </span>
            {campaign && (
              <span className="inline-flex items-center gap-1.5">
                <Link2 className="h-3 w-3" />
                {campaign}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {campaign && <MetaCard label="Campaign" value={campaign} icon={<Link2 className="h-3 w-3" />} />}
        {objective && <MetaCard label="Objective" value={objective} icon={<Target className="h-3 w-3" />} />}
        {requiredCta && <MetaCard label="CTA" value={requiredCta} icon={<Target className="h-3 w-3" />} />}
        <MetaCard label="Created" value={formatDate(data.created_at)} icon={<CalendarDays className="h-3 w-3" />} />
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-muted/35 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {primaryMessage && primaryMessage !== objective && (
        <div className="rounded-xl border border-border bg-muted/25 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Message direction</p>
          <p className="mt-1 text-[13px] leading-relaxed text-foreground">{primaryMessage}</p>
        </div>
      )}

      {data.media_url && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <img src={data.media_url} alt="Attached media" className="max-h-64 w-full object-cover" />
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          <MessageSquareQuote className="h-3 w-3" />
          Full draft
        </div>
        <div className="prose prose-sm max-w-none text-[13px] leading-[1.6] prose-p:my-1.5 prose-li:my-0.5 prose-ul:my-2 prose-strong:text-foreground">
          <ReactMarkdown>{data.body ?? "No content body available."}</ReactMarkdown>
        </div>
      </div>

      {!actionState && isDraft && data.id && (
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionButton
            type="button"
            className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            disabled={actionMutation.isPending}
            onClick={() => void handleApprove()}
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </ActionButton>
          <ActionButton
            type="button"
            className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            disabled={actionMutation.isPending}
            onClick={() => void handleReject()}
          >
            <XCircle className="h-4 w-4" />
            Reject
          </ActionButton>
        </div>
      )}

      {!actionState && isFailed && data.id && (
        <ActionButton
          type="button"
          className="w-full border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
          disabled={retryMutation.isPending}
          onClick={() => void handleRetry()}
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </ActionButton>
      )}

      {actionState && (
        <div
          className={[
            "rounded-xl px-4 py-3 text-sm font-medium text-center",
            actionState === "approved"
              ? "bg-emerald-50 text-emerald-700"
              : actionState === "rejected"
                ? "bg-red-50 text-red-600"
                : "bg-primary/10 text-primary",
          ].join(" ")}
        >
          {actionState === "approved"
            ? "Approved"
            : actionState === "rejected"
              ? "Rejected"
              : "Queued for retry"}
        </div>
      )}
    </div>
  );
}

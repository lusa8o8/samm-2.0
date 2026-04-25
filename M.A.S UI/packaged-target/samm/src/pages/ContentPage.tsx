import { useMemo, useRef, useState } from "react";
import {
  Check,
  Clock,
  ImagePlus,
  Pencil,
  RefreshCw,
  Share2,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListContentQueryKey,
  useActionContent,
  useBatchApproveContent,
  useEditContent,
  useListContent,
  type OneTimePostAssetNeed,
  useRegenerateAssetBrief,
  useRetryContent,
  useUploadContentImage,
} from "@/lib/api";
import { ChannelIcon } from "@/components/shared/ChannelIcon";
import { StatusChip } from "@/components/shared/StatusChip";
import { cn, stripMarkdownToPreviewText } from "@/lib/utils";
import { useInspector } from "@/components/shell/WorkspaceShell";
import type { ContentDraft } from "../types";

type TabStatus = "draft" | "scheduled" | "published" | "comments" | "failed";

type ContentItem = {
  id: string;
  platform: string;
  platforms?: string[] | null;
  body: string;
  subject_line?: string | null;
  status: string;
  scheduled_at?: string | null;
  published_at?: string | null;
  error_message?: string | null;
  campaign_name?: string | null;
  pipeline_run_id?: string | null;
  media_url?: string | null;
  rejection_note?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type InspectorContentDraft = ContentDraft & {
  platform?: string | null;
  pipelineRunId?: string | null;
};

const TABS: { id: TabStatus; label: string }[] = [
  { id: "draft", label: "Drafts" },
  { id: "scheduled", label: "Scheduled" },
  { id: "published", label: "Published" },
  { id: "comments", label: "Comments" },
  { id: "failed", label: "Failed" },
];

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  youtube: "YouTube",
  email: "Email",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  twitter: "X",
  design_brief: "Design Brief",
};

function truncateText(value: string, max = 56) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}...`;
}
function textValue(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

function clipText(value: string, max = 56) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3).trimEnd()}...`;
}

function stripMarkdownToInspectorText(value: string | null | undefined) {
  if (!value) return "";

  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/(```[\s\S]*?```)/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}(#{1,6})\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/\r?\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
}

function getObjective(item: ContentItem) {
  return textValue(item.metadata?.objective) || textValue(item.metadata?.purpose) || textValue(item.metadata?.slot_purpose);
}

function getCta(item: ContentItem) {
  return textValue(item.metadata?.required_cta_text) || textValue(item.metadata?.call_to_action);
}

function getTags(item: ContentItem) {
  const metadata = item.metadata ?? {};
  const sources = [metadata.pattern_tags, metadata.tags, metadata.hashtags];
  const values = new Set<string>();

  for (const source of sources) {
    if (Array.isArray(source)) {
      for (const entry of source) {
        const tag = textValue(entry);
        if (tag) values.add(tag.replace(/^#/, ""));
      }
    }
  }

  return Array.from(values).slice(0, 4);
}

function getPreviewTitle(item: ContentItem, preview: string) {
  const metadataTitle = textValue(item.metadata?.title) || textValue(item.metadata?.headline);
  if (metadataTitle) return metadataTitle;
  if (item.subject_line) return item.subject_line;
  if (item.platform === "design_brief") {
    if (isOneTimeDesignBrief(item)) return "One-time asset brief";
    return item.campaign_name ? `${item.campaign_name} Design Brief` : "Design Brief";
  }
  if (preview) {
    const sentence = preview.split(/[.!?]/)[0]?.trim();
    if (sentence) return clipText(sentence, 68);
  }
  if (item.campaign_name) return item.campaign_name;
  return PLATFORM_LABELS[item.platform] ?? item.platform;
}

function isOneTimeDesignBrief(item: { platform: string; metadata?: Record<string, unknown> | null }) {
  return item.platform === "design_brief" && item.metadata?.purpose === "one_time";
}

function getDesignBriefTitle(item: ContentItem, preview: string) {
  if (isOneTimeDesignBrief(item)) {
    const metadataTitle = textValue(item.metadata?.title) || textValue(item.metadata?.headline);
    return metadataTitle || "One-time asset brief";
  }
  return getPreviewTitle(item, preview);
}

function formatTimestamp(value?: string | null) {
  if (!value) return "No date";
  return new Date(value).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getInspectorStatus(item: ContentItem): ContentDraft["status"] {
  switch ((item.status ?? "").toLowerCase()) {
    case "scheduled":
      return "scheduled";
    case "published":
      return "published";
    case "failed":
      return "failed";
    case "rejected":
      return "rejected";
    case "draft":
    case "pending_approval":
    default:
      return "draft";
  }
}

function getInspectorApprovalStatus(item: ContentItem): ContentDraft["approvalStatus"] | undefined {
  const status = (item.status ?? "").toLowerCase();
  if (status === "draft" || status === "pending_approval") return "pending";
  if (status === "rejected") return "rejected";
  if (status === "scheduled" || status === "published") return "approved";
  return undefined;
}

function getInspectorContentType(item: ContentItem): ContentDraft["contentType"] {
  if (item.platform === "email") return "email";
  if (item.subject_line) return "article";
  if (item.platform === "youtube") return "reel";
  return "post";
}

function toInspectorDraft(item: ContentItem): InspectorContentDraft {
  const preview = stripMarkdownToInspectorText(item.body);

  return {
    id: item.id,
    title: getPreviewTitle(item, preview),
    preview: preview || "No content preview available.",
    channel: (item.platform as ContentDraft["channel"]) || "facebook",
    contentType: getInspectorContentType(item),
    status: getInspectorStatus(item),
    createdAt: item.created_at ?? new Date().toISOString(),
    scheduledFor: item.scheduled_at ?? undefined,
    publishedAt: item.published_at ?? undefined,
    failedAt: item.status === "failed" ? item.updated_at ?? item.created_at ?? undefined : undefined,
    failureReason: item.error_message ?? item.rejection_note ?? undefined,
    linkedCampaign: item.campaign_name ?? undefined,
    linkedICP: textValue(item.metadata?.icp_name) || textValue(item.metadata?.audience_segment) || undefined,
    objective: getObjective(item) ?? undefined,
    ctaType: getCta(item) ?? undefined,
    offerAssociation: textValue(item.metadata?.offer_name) || textValue(item.metadata?.offer) || undefined,
    patternTags: getTags(item),
    approvalStatus: getInspectorApprovalStatus(item),
    platform: item.platform,
    pipelineRunId: item.pipeline_run_id,
  };
}

function groupDrafts(items: ContentItem[]) {
  const groups = new Map<string, { pipelineRunId: string; campaignName: string; items: ContentItem[] }>();
  const standalone: ContentItem[] = [];

  for (const item of items) {
    if (item.pipeline_run_id && item.campaign_name) {
      const existing = groups.get(item.pipeline_run_id);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(item.pipeline_run_id, {
          pipelineRunId: item.pipeline_run_id,
          campaignName: item.campaign_name,
          items: [item],
        });
      }
    } else {
      standalone.push(item);
    }
  }

  return { groups: Array.from(groups.values()), standalone };
}

function ActionButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
        className,
      )}
    >
      {children}
    </button>
  );
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-border/70 bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      {children}
    </span>
  );
}

function EditorModal({
  item,
  body,
  subjectLine,
  isSaving,
  onBodyChange,
  onSubjectLineChange,
  onClose,
  onSave,
  onUploadImage,
  onShare,
}: {
  item: ContentItem;
  body: string;
  subjectLine: string;
  isSaving: boolean;
  onBodyChange: (value: string) => void;
  onSubjectLineChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  onUploadImage: (file: File) => void;
  onShare: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const isDesignBrief = item.platform === "design_brief";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[3px]" onClick={onClose} />
      <div className="relative z-10 flex max-h-[calc(100vh-80px)] w-[min(780px,calc(100vw-48px))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {isDesignBrief ? "Design brief editor" : "Content editor"}
            </p>
            <h3 className="text-base font-semibold text-foreground">
              {item.subject_line || item.campaign_name || PLATFORM_LABELS[item.platform] || "Content item"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {!isDesignBrief && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Title / subject</label>
                <input
                  value={subjectLine}
                  onChange={(e) => onSubjectLineChange(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none ring-0 transition-colors focus:border-primary"
                  placeholder="Optional title or subject"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Body</label>
                <textarea
                  value={body}
                  onChange={(e) => onBodyChange(e.target.value)}
                  className="min-h-[220px] w-full rounded-xl border border-border bg-background px-3 py-3 text-sm leading-relaxed outline-none transition-colors focus:border-primary"
                />
              </div>
            </div>
          )}

          {isDesignBrief && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Brief</label>
              <textarea
                value={body}
                onChange={(e) => onBodyChange(e.target.value)}
                className="min-h-[280px] w-full rounded-xl border border-border bg-background px-3 py-3 text-sm leading-relaxed outline-none transition-colors focus:border-primary"
              />
            </div>
          )}

          {item.media_url && !isDesignBrief && (
            <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
              <img src={item.media_url} alt="Attached media" className="max-h-64 w-full object-cover" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {!isDesignBrief && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUploadImage(file);
                    e.target.value = "";
                  }}
                />
                <ActionButton
                  type="button"
                  className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  {item.media_url ? "Replace image" : "Add image"}
                </ActionButton>
              </>
            )}
            {isDesignBrief && (
              <ActionButton
                type="button"
                className="border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                onClick={onShare}
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </ActionButton>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ActionButton
              type="button"
              className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={onClose}
            >
              Cancel
            </ActionButton>
            <ActionButton
              type="button"
              className="border-primary bg-primary text-white hover:opacity-90"
              disabled={isSaving}
              onClick={onSave}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentCard({
  item,
  onOpen,
  onApprove,
  onReject,
  onRetry,
  onEdit,
  onUploadImage,
  onShare,
}: {
  item: ContentItem;
  onOpen: (item: ContentItem) => void;
  onApprove: (item: ContentItem) => void;
  onReject: (item: ContentItem) => void;
  onRetry: (item: ContentItem) => void;
  onEdit: (item: ContentItem) => void;
  onUploadImage: (item: ContentItem, file: File) => void;
  onShare: (item: ContentItem) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const isDesignBrief = item.platform === "design_brief";
  const isDraft = item.status === "draft";
  const isRejected = item.status === "rejected";
  const isFailed = item.status === "failed";
  const supportsRegeneration = isOneTimeDesignBrief(item);
  const preview = stripMarkdownToPreviewText(item.body);
  const previewTitle = getDesignBriefTitle(item, preview);
  const objective = getObjective(item);
  const cta = getCta(item);
  const tags = getTags(item);
  const statusLabel = item.status === "draft" ? "pending" : item.status;
  const previewKind = isDesignBrief
    ? supportsRegeneration
      ? "One-time asset brief"
      : "Design brief"
    : item.platform === "email"
      ? "Email"
      : item.subject_line
        ? "Article"
        : "Post";
  const previewChips = [
    item.campaign_name ? clipText(item.campaign_name, 34) : null,
    objective ? clipText(objective, 24) : null,
    cta ? `CTA: ${clipText(cta, 18)}` : null,
    ...tags.map((tag) => `#${tag}`),
  ].filter((value): value is string => Boolean(value));

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-card p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-border/80 hover:shadow-md",
        isDesignBrief && "md:col-span-2",
      )}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(item);
        }
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUploadImage(item, file);
          e.target.value = "";
        }}
      />

      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <ChannelIcon channel={(item.platform as any) || "facebook"} size={14} className="mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className={cn("truncate text-sm font-semibold leading-snug text-foreground", isDesignBrief && "text-violet-900")}>
                {previewTitle}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {isDesignBrief ? previewKind : `${previewKind} - ${PLATFORM_LABELS[item.platform] ?? item.platform}`}
              </p>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <StatusChip status={(statusLabel as any) || "draft"} />
          </div>
        </div>

        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {preview || "No preview available."}
        </p>

        {previewChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {previewChips.map((chip) => (
              <MetaChip key={chip}>{chip}</MetaChip>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>
          {item.status === "published"
            ? `Published ${formatTimestamp(item.published_at)}`
            : item.status === "scheduled"
              ? `Scheduled ${formatTimestamp(item.scheduled_at)}`
              : `Created ${formatTimestamp(item.created_at)}`}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 pt-1" onClick={(event) => event.stopPropagation()}>
        {(isDraft || isRejected) && (
          <>
            <ActionButton
              type="button"
              className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => onEdit(item)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </ActionButton>
            {!isDesignBrief && (
              <ActionButton
                type="button"
                className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="h-3.5 w-3.5" />
                {item.media_url ? "Replace image" : "Add image"}
              </ActionButton>
            )}
          </>
        )}

        {isDraft && (
          <>
            <ActionButton
              type="button"
              className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
              onClick={() => onReject(item)}
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </ActionButton>
            <ActionButton
              type="button"
              className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              onClick={() => onApprove(item)}
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </ActionButton>
          </>
        )}

        {isFailed && (
          <ActionButton
            type="button"
            className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            onClick={() => onRetry(item)}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </ActionButton>
        )}

        {isDesignBrief && (
          <>
            {supportsRegeneration && (
              <ActionButton
                type="button"
                className="border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                onClick={() => onRetry(item)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate brief
              </ActionButton>
            )}
            <ActionButton
              type="button"
              className="border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
              onClick={() => onShare(item)}
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </ActionButton>
          </>
        )}
      </div>
    </article>
  );
}

export default function ContentPage() {
  const [status, setStatus] = useState<TabStatus>("draft");
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editorBody, setEditorBody] = useState("");
  const [editorSubject, setEditorSubject] = useState("");
  const queryClient = useQueryClient();
  const { openInspector } = useInspector();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["content-registry"] });
    queryClient.invalidateQueries({ queryKey: ["inbox-items"] });
    queryClient.invalidateQueries({ queryKey: ["inbox-summary"] });
    queryClient.invalidateQueries({ queryKey: ["pipeline-status"] });
    queryClient.invalidateQueries({ queryKey: ["pipeline-runs"] });
  };

  const contentParams = status === "comments"
    ? { status: "published" as const, created_by: "pipeline-a-engagement" }
    : { status };

  const { data: items, isLoading } = useListContent(contentParams, {
    query: { queryKey: getListContentQueryKey(contentParams) },
  });

  const retryMutation = useRetryContent({ mutation: { onSuccess: invalidate } });
  const actionMutation = useActionContent({ mutation: { onSuccess: invalidate } });
  const batchApproveMutation = useBatchApproveContent({ mutation: { onSuccess: invalidate } });
  const editMutation = useEditContent({
    mutation: {
      onSuccess: () => {
        invalidate();
        setEditingItem(null);
      },
    },
  });
  const imageMutation = useUploadContentImage({ mutation: { onSuccess: invalidate } });
  const regenerateBriefMutation = useRegenerateAssetBrief({ mutation: { onSuccess: invalidate } });

  const displayItems = useMemo(() => {
    const all = (items ?? []) as ContentItem[];
    if (status === "draft" || status === "comments") return all;
    return all.filter((item) => item.platform !== "design_brief");
  }, [items, status]);

  const { groups, standalone } = useMemo(
    () => (status === "draft" ? groupDrafts(displayItems) : { groups: [], standalone: displayItems }),
    [displayItems, status],
  );

  const openContentInspector = (item: ContentItem) => {
    const preview = stripMarkdownToInspectorText(item.body);
    const title = item.platform === "design_brief"
      ? getDesignBriefTitle(item, preview)
      : item.subject_line || item.campaign_name || PLATFORM_LABELS[item.platform] || "Content";
    openInspector(title, {
      type: item.platform === "design_brief" ? "campaign_brief" : "content_batch_review",
      title,
      data: item.platform === "design_brief" ? item : [toInspectorDraft(item)],
    });
  };

  const beginEdit = (item: ContentItem) => {
    setEditingItem(item);
    setEditorBody(item.body ?? "");
    setEditorSubject(item.subject_line ?? "");
  };

  const handleApprove = (item: ContentItem) => {
    actionMutation.mutate({
      id: item.id,
      pipelineRunId: item.pipeline_run_id,
      platform: item.platform,
      data: { action: "approve" },
    });
  };

  const handleReject = (item: ContentItem) => {
    actionMutation.mutate({
      id: item.id,
      pipelineRunId: item.pipeline_run_id,
      data: { action: "reject", note: "Rejected from packaged content registry" },
    });
  };

  const handleRetry = (item: ContentItem) => {
    if (isOneTimeDesignBrief(item)) {
      const draftGroupId =
        typeof item.metadata?.draft_group_id === "string" ? item.metadata.draft_group_id.trim() : "";

      const assetNeed =
        typeof item.metadata?.asset_need === "string" ? (item.metadata.asset_need as OneTimePostAssetNeed) : undefined;
      const title = getPreviewTitle(item, stripMarkdownToInspectorText(item.body));

      regenerateBriefMutation.mutate({
        draftGroupId,
        contentId: item.id,
        assetNeed,
        title: `Regenerate ${title}`,
        description: `Regenerate the visual brief for "${title}" without rewriting the copy.`,
      });
      return;
    }

    retryMutation.mutate({ id: item.id });
  };

  const handleSave = () => {
    if (!editingItem) return;
    editMutation.mutate({
      id: editingItem.id,
      body: editorBody,
      subjectLine:
        editingItem.subject_line !== undefined || editingItem.platform === "email"
          ? editorSubject || null
          : undefined,
    });
  };

  const handleImageUpload = (item: ContentItem, file: File) => {
    imageMutation.mutate({ id: item.id, file });
  };

  const handleShareBrief = async (item: ContentItem) => {
    const preview = stripMarkdownToInspectorText(item.body);
    const title = item.platform === "design_brief" ? getDesignBriefTitle(item, preview) : (item.subject_line || item.campaign_name || "Content");
    const label = isOneTimeDesignBrief(item) ? "One-time asset brief" : "Design brief";
    const shareText = `${label} — ${title}\n\n${item.body || ""}`.trim();
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      // no-op
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 pb-3 pt-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Content Registry</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Drafts, scheduled posts, and published assets flowing through the workspace.
            </p>
          </div>
          <button className="inline-flex h-9 items-center rounded-lg bg-primary px-3.5 text-xs font-medium text-white transition-opacity hover:opacity-90">
            New Post
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatus(tab.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition-colors",
                status === tab.id
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isLoading ? (
          <div className="rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
            Loading content...
          </div>
        ) : displayItems.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            No {status} content found.
          </div>
        ) : status === "draft" ? (
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.pipelineRunId} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Campaign</p>
                    <h2 className="text-base font-semibold text-foreground">{group.campaignName}</h2>
                  </div>
                  <ActionButton
                    type="button"
                    className="border-primary bg-primary text-white hover:opacity-90"
                    onClick={() => batchApproveMutation.mutate({ pipelineRunId: group.pipelineRunId })}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve all ({group.items.filter((item) => item.platform !== "design_brief" && item.status === "draft").length})
                  </ActionButton>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {group.items.map((item) => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      onOpen={openContentInspector}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onRetry={handleRetry}
                      onEdit={beginEdit}
                      onUploadImage={handleImageUpload}
                      onShare={handleShareBrief}
                    />
                  ))}
                </div>
              </section>
            ))}

            {standalone.length > 0 && (
              <section className="space-y-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Other drafts</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {standalone.map((item) => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      onOpen={openContentInspector}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onRetry={handleRetry}
                      onEdit={beginEdit}
                      onUploadImage={handleImageUpload}
                      onShare={handleShareBrief}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {displayItems.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                onOpen={openContentInspector}
                onApprove={handleApprove}
                onReject={handleReject}
                onRetry={handleRetry}
                onEdit={beginEdit}
                onUploadImage={handleImageUpload}
                onShare={handleShareBrief}
              />
            ))}
          </div>
        )}
      </div>

      {editingItem && (
        <EditorModal
          item={editingItem}
          body={editorBody}
          subjectLine={editorSubject}
          isSaving={editMutation.isPending}
          onBodyChange={setEditorBody}
          onSubjectLineChange={setEditorSubject}
          onClose={() => setEditingItem(null)}
          onSave={handleSave}
          onUploadImage={(file) => handleImageUpload(editingItem, file)}
          onShare={() => handleShareBrief(editingItem)}
        />
      )}
    </div>
  );
}

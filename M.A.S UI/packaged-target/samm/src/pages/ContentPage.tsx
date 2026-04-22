import { useMemo, useRef, useState } from "react";
import {
  Check,
  Clock,
  ExternalLink,
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
  useRetryContent,
  useUploadContentImage,
} from "@/lib/api";
import { ChannelIcon } from "@/components/shared/ChannelIcon";
import { StatusChip } from "@/components/shared/StatusChip";
import { cn, stripMarkdownToPreviewText } from "@/lib/utils";
import { useInspector } from "@/components/shell/WorkspaceShell";

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
  design_brief: "Design Brief",
};

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
        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors",
        className,
      )}
    >
      {children}
    </button>
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
  const preview = stripMarkdownToPreviewText(item.body);
  const title =
    item.subject_line ||
    (item.campaign_name && isDesignBrief
      ? `${item.campaign_name} Design Brief`
      : item.campaign_name
        ? `${item.campaign_name} ${PLATFORM_LABELS[item.platform] ?? item.platform}`
        : PLATFORM_LABELS[item.platform] ?? item.platform);
  const statusLabel = item.status === "draft" ? "pending" : item.status;

  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-border/80",
        isDesignBrief && "md:col-span-2",
      )}
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

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <ChannelIcon channel={(item.platform as any) || "facebook"} size={15} />
              <span className={cn("text-sm font-semibold", isDesignBrief && "text-violet-700")}>
                {title}
              </span>
            </div>
            <StatusChip status={(statusLabel as any) || "draft"} />
            {item.campaign_name && !isDesignBrief && (
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                campaign
              </span>
            )}
          </div>
          <p className={cn("text-sm leading-relaxed text-muted-foreground", isDesignBrief && "line-clamp-3")}>
            {preview || "No preview available."}
          </p>
          {item.media_url && !isDesignBrief && (
            <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
              <img src={item.media_url} alt="Attached media preview" className="h-36 w-full object-cover" />
            </div>
          )}
        </div>

        <ActionButton
          type="button"
          className="shrink-0 border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => onOpen(item)}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open
        </ActionButton>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>
          {item.status === "published"
            ? `Published ${formatTimestamp(item.published_at)}`
            : item.status === "scheduled"
              ? `Scheduled ${formatTimestamp(item.scheduled_at)}`
              : `Created ${formatTimestamp(item.created_at)}`}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
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
          <ActionButton
            type="button"
            className="border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
            onClick={() => onShare(item)}
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </ActionButton>
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
    openInspector(item.subject_line || item.campaign_name || PLATFORM_LABELS[item.platform] || "Content", {
      type: item.platform === "design_brief" ? "campaign_brief" : "linked_content_list",
      title: item.subject_line || item.campaign_name || PLATFORM_LABELS[item.platform] || "Content",
      data: item,
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

  const handleRetry = (item: ContentItem) => retryMutation.mutate({ id: item.id });

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
    const shareText = item.body || item.subject_line || item.campaign_name || "Campaign brief";
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      // no-op
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 pb-4 pt-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Content Registry</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Drafts, scheduled posts, and published assets flowing through the workspace.
            </p>
          </div>
          <button className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-white transition-opacity hover:opacity-90">
            New Post
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-5 text-sm font-medium">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatus(tab.id)}
              className={cn(
                "border-b-2 pb-2 transition-colors",
                status === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card px-5 py-8 text-sm text-muted-foreground">
            Loading content...
          </div>
        ) : displayItems.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">
            No {status} content found.
          </div>
        ) : status === "draft" ? (
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.pipelineRunId} className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Campaign</p>
                    <h2 className="text-lg font-semibold text-foreground">{group.campaignName}</h2>
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
                <div className="grid gap-4 md:grid-cols-2">
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
              <section className="space-y-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Other drafts</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
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
          <div className="grid gap-4 md:grid-cols-2">
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

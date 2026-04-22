import { getOrgId, supabase } from "../../../../src/lib/supabase";
import type { Channel, ContentDraft, ContentStatus } from "../types";

type LiveContentRow = {
  id: string;
  org_id: string;
  platform?: string | null;
  platforms?: string[] | null;
  body?: string | null;
  subject_line?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  failure_reason?: string | null;
  rejection_note?: string | null;
  campaign_name?: string | null;
  pipeline_run_id?: string | null;
  media_url?: string | null;
  metadata?: Record<string, any> | null;
};

const COORDINATOR_FUNCTION = "coordinator-ingress";

function stripMarkdown(value?: string | null) {
  return (value ?? "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*`_~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toChannel(value?: string | null): Channel {
  switch ((value ?? "").toLowerCase()) {
    case "facebook":
      return "facebook";
    case "whatsapp":
      return "whatsapp";
    case "youtube":
      return "youtube";
    case "email":
      return "email";
    case "instagram":
      return "instagram";
    case "linkedin":
      return "linkedin";
    case "twitter":
      return "twitter";
    case "design_brief":
      return "design_brief";
    default:
      return "facebook";
  }
}

function toContentStatus(value?: string | null): ContentStatus {
  switch ((value ?? "").toLowerCase()) {
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

function toContentType(row: LiveContentRow): ContentDraft["contentType"] {
  const platform = (row.platform ?? "").toLowerCase();
  if (platform === "email" || row.subject_line) return "email";
  if (platform === "design_brief") return "article";
  if (platform === "youtube") return "reel";
  return "post";
}

function toApprovalStatus(row: LiveContentRow): ContentDraft["approvalStatus"] | undefined {
  const status = (row.status ?? "").toLowerCase();
  if (status === "pending_approval" || status === "draft") return "pending";
  if (status === "rejected") return "rejected";
  if (status === "scheduled" || status === "published") return "approved";
  return undefined;
}

function getPreview(row: LiveContentRow) {
  const preview = stripMarkdown(row.body);
  if (preview) return preview;
  if (row.subject_line) return row.subject_line;
  if (row.campaign_name) return row.campaign_name;
  return "No content preview available.";
}

function getTitle(row: LiveContentRow) {
  const platform = row.platform ?? "content";
  if (row.subject_line) return row.subject_line;
  if (row.campaign_name && platform === "design_brief") return `${row.campaign_name} Design Brief`;
  if (row.campaign_name) return `${row.campaign_name} ${platform}`;
  return `${platform.replace(/_/g, " ")} draft`;
}

function getPatternTags(row: LiveContentRow) {
  const tags = new Set<string>();
  const metadata = row.metadata ?? {};

  if (typeof metadata.purpose === "string") tags.add(metadata.purpose);
  if (typeof metadata.required_content_type === "string") tags.add(metadata.required_content_type);
  if (typeof metadata.content_type === "string") tags.add(metadata.content_type);
  if (typeof metadata.slot_purpose === "string") tags.add(metadata.slot_purpose);
  if (row.platform) tags.add(row.platform);

  return Array.from(tags).slice(0, 4);
}

function mapContentRow(row: LiveContentRow): ContentDraft {
  const metadata = row.metadata ?? {};
  const status = toContentStatus(row.status);
  const preview = getPreview(row);

  return {
    id: row.id,
    title: getTitle(row),
    preview,
    channel: toChannel(row.platform),
    contentType: toContentType(row),
    status,
    createdAt: row.created_at ?? new Date().toISOString(),
    scheduledFor: row.scheduled_at ?? undefined,
    publishedAt: row.published_at ?? undefined,
    failedAt: status === "failed" ? row.updated_at ?? row.created_at ?? undefined : undefined,
    failureReason: row.failure_reason ?? row.rejection_note ?? undefined,
    linkedCampaign: row.campaign_name ?? undefined,
    linkedICP: metadata.icp_name ?? metadata.audience_segment ?? undefined,
    objective: metadata.purpose ?? metadata.objective ?? undefined,
    ctaType: metadata.required_cta_text ?? metadata.call_to_action ?? undefined,
    offerAssociation: metadata.offer_name ?? metadata.offer ?? undefined,
    patternTags: getPatternTags(row),
    approvalStatus: toApprovalStatus(row),
  };
}

async function requestCoordinatorAction(message: string) {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token ?? null;

  if (!accessToken) {
    throw new Error("Your session expired. Please sign in again.");
  }

  const { error } = await supabase.functions.invoke(COORDINATOR_FUNCTION, {
    body: {
      message,
      history: [],
      confirmationAction: null,
      orgId: getOrgId(),
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (error) {
    throw error;
  }
}

async function requestPipelineBResume() {
  await requestCoordinatorAction("resume pipeline b");
}

async function requestPipelineCResume() {
  await requestCoordinatorAction("resume pipeline c");
}

async function requireContentRow(id: string) {
  const { data, error } = await supabase
    .from("content_registry")
    .select("*")
    .eq("org_id", getOrgId())
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as LiveContentRow;
}

async function getPipelineOwner(pipelineRunId: string) {
  const { data, error } = await supabase
    .from("pipeline_runs")
    .select("pipeline")
    .eq("id", pipelineRunId)
    .single();

  if (error) throw error;
  return (data?.pipeline ?? "") as string;
}

export async function getContentRegistry() {
  const { data, error } = await supabase
    .from("content_registry")
    .select("*")
    .eq("org_id", getOrgId())
    .order("scheduled_at", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapContentRow(row as LiveContentRow));
}

export async function approveContentItem(id: string) {
  const row = await requireContentRow(id);
  const platform = (row.platform ?? "").toLowerCase();

  const { error } = await supabase
    .from("content_registry")
    .update({ status: "scheduled" })
    .eq("id", id)
    .eq("org_id", getOrgId());

  if (error) throw error;

  if (row.pipeline_run_id && platform !== "design_brief") {
    const ownerPipeline = await getPipelineOwner(row.pipeline_run_id);

    if (ownerPipeline.includes("pipeline-b")) {
      const { count, error: countError } = await supabase
        .from("content_registry")
        .select("id", { count: "exact", head: true })
        .eq("pipeline_run_id", row.pipeline_run_id)
        .eq("status", "draft")
        .eq("org_id", getOrgId());

      if (countError) throw countError;
      if ((count ?? 0) === 0) await requestPipelineBResume();
    } else if (ownerPipeline.includes("pipeline-c")) {
      const { count, error: countError } = await supabase
        .from("content_registry")
        .select("id", { count: "exact", head: true })
        .eq("pipeline_run_id", row.pipeline_run_id)
        .eq("status", "draft")
        .neq("platform", "design_brief")
        .eq("org_id", getOrgId());

      if (countError) throw countError;
      if ((count ?? 0) === 0) await requestPipelineCResume();
    }
  }

  return { id };
}

export async function rejectContentItem(id: string, note?: string) {
  const row = await requireContentRow(id);
  const patch: Record<string, unknown> = {
    status: "rejected",
    rejection_note: note ?? null,
  };

  const { error } = await supabase
    .from("content_registry")
    .update(patch)
    .eq("id", id)
    .eq("org_id", getOrgId());

  if (error) throw error;

  if (row.pipeline_run_id) {
    const ownerPipeline = await getPipelineOwner(row.pipeline_run_id);

    if (ownerPipeline.includes("pipeline-b")) {
      const { count, error: countError } = await supabase
        .from("content_registry")
        .select("id", { count: "exact", head: true })
        .eq("pipeline_run_id", row.pipeline_run_id)
        .eq("status", "draft")
        .eq("org_id", getOrgId());

      if (countError) throw countError;
      if ((count ?? 0) === 0) await requestPipelineBResume();
    } else if (ownerPipeline.includes("pipeline-c")) {
      await requestPipelineCResume();
    }
  }

  return { id };
}

export async function retryContentItem(id: string) {
  const { error } = await supabase
    .from("content_registry")
    .update({ status: "pending_approval" })
    .eq("id", id)
    .eq("org_id", getOrgId());

  if (error) throw error;
  return { id };
}

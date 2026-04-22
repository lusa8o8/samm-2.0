import { FunctionsHttpError } from "@supabase/supabase-js";
import { getAccessToken, getOrgId, supabase } from "../../../../src/lib/supabase";
import type { InboxItem, PipelineId } from "../types";

const COORDINATOR_FUNCTION = "coordinator-ingress";

type LiveInboxRow = {
  id: string;
  item_type: string;
  created_by_pipeline?: string | null;
  status?: string | null;
  priority?: string | null;
  created_at?: string | null;
  payload?: Record<string, any> | null;
  ref_id?: string | null;
};

function titleCase(value?: string | null) {
  return (value ?? "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toPipelineId(value?: string | null): PipelineId {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("pipeline-b")) return "B";
  if (normalized.includes("pipeline-c")) return "C";
  if (normalized.includes("pipeline-d")) return "D";
  if (normalized.includes("publish")) return "publish";
  return "A";
}

function toInboxType(row: LiveInboxRow): InboxItem["type"] {
  switch (row.item_type) {
    case "campaign_brief":
    case "draft_approval":
      return "approval";
    case "suggestion":
      return "suggestion";
    case "escalation":
      return "escalation";
    default:
      return "fyi";
  }
}

function toPriority(value?: string | null): InboxItem["priority"] {
  switch ((value ?? "").toLowerCase()) {
    case "urgent":
    case "high":
      return "high";
    case "medium":
      return "medium";
    default:
      return "low";
  }
}

function toStatus(value?: string | null): InboxItem["status"] {
  switch ((value ?? "").toLowerCase()) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "new":
      return "new";
    default:
      return "pending";
  }
}

function getPreview(payload: Record<string, any>) {
  return (
    payload.preview ??
    payload.post_copy ??
    payload.body ??
    payload.report ??
    payload.comment_text ??
    payload.original_comment ??
    payload.suggestion ??
    payload.brief ??
    ""
  );
}

function getTitle(row: LiveInboxRow, payload: Record<string, any>, type: InboxItem["type"]) {
  if (payload.title) return payload.title;

  if (row.item_type === "campaign_brief") {
    return payload.campaign_brief?.name ?? payload.event_label ?? "Campaign Brief";
  }

  if (row.item_type === "draft_approval") {
    return `${titleCase(payload.platform ?? "Content")} draft awaiting approval`;
  }

  if (type === "suggestion") return titleCase(payload.type ?? "Suggestion");
  if (type === "escalation") return `Escalation on ${titleCase(payload.platform ?? "channel")}`;
  return titleCase(row.item_type ?? "Inbox Item");
}

function getSummary(row: LiveInboxRow, payload: Record<string, any>, type: InboxItem["type"]) {
  const preview = getPreview(payload);
  if (preview) return String(preview);

  if (row.item_type === "campaign_brief") {
    return "Campaign approval is required before Pipeline C can continue.";
  }

  if (row.item_type === "draft_approval") {
    return "Draft approval is required before content can proceed.";
  }

  if (type === "escalation") return "SAMM flagged this item for human review.";
  if (type === "suggestion") return "A suggestion is ready for review.";
  return "Information is available for review.";
}

function getRationale(row: LiveInboxRow, payload: Record<string, any>, type: InboxItem["type"]) {
  if (payload.rationale) return String(payload.rationale);
  if (payload.reason) return String(payload.reason);
  if (payload.suggestion && type !== "suggestion") return String(payload.suggestion);

  if (row.item_type === "campaign_brief") {
    return "Approving this brief lets Pipeline C continue with campaign-specific asset creation.";
  }

  if (row.item_type === "draft_approval") {
    return "Human review is required before the pipeline can finalize the current content set.";
  }

  if (type === "escalation") {
    return "This item was escalated because the underlying interaction needs human judgment.";
  }

  if (type === "suggestion") {
    return "SAMM generated a suggested next step based on the current workspace context.";
  }

  return "This item is available for awareness or light follow-up.";
}

function mapInboxItem(row: LiveInboxRow): InboxItem {
  const payload = row.payload ?? {};
  const type = toInboxType(row);

  return {
    id: row.id,
    type,
    title: getTitle(row, payload, type),
    summary: getSummary(row, payload, type),
    rationale: getRationale(row, payload, type),
    source: titleCase(row.created_by_pipeline ?? "coordinator"),
    sourcePipeline: toPipelineId(row.created_by_pipeline),
    priority: toPriority(row.priority),
    status: toStatus(row.status),
    createdAt: row.created_at ?? new Date().toISOString(),
    linkedObjectId: row.ref_id ?? undefined,
    linkedObjectType: row.item_type ?? undefined,
  };
}

async function requireSingleRow(table: string, id: string) {
  const { data, error } = await supabase.from(table).select("*").eq("org_id", getOrgId()).eq("id", id).single();
  if (error) throw error;
  return data;
}

async function requestCoordinatorAction(message: string) {
  const accessToken = await getAccessToken();

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

function getApproveAction(row: LiveInboxRow): "approve" | "read" {
  switch (row.item_type) {
    case "draft_approval":
    case "campaign_brief":
    case "suggestion":
      return "approve";
    default:
      return "read";
  }
}

async function performAction(id: string, action: "approve" | "reject" | "read", note?: string) {
  const inboxRow = await requireSingleRow("human_inbox", id);

  const nextStatus =
    action === "approve" ? "approved" : action === "reject" ? "rejected" : "actioned";

  const { error: inboxError } = await supabase
    .from("human_inbox")
    .update({
      status: nextStatus,
      action_note: note ?? null,
      actioned_at: new Date().toISOString(),
      actioned_by: "packaged-ui",
    })
    .eq("id", id)
    .eq("org_id", getOrgId());

  if (inboxError) throw inboxError;

  if (inboxRow.item_type === "draft_approval") {
    const contentId = inboxRow.ref_id ?? inboxRow.payload?.content_registry_id;
    if (contentId) {
      const contentStatus = action === "approve" ? "scheduled" : "rejected";
      const contentPatch: Record<string, unknown> =
        action === "reject"
          ? { status: contentStatus, rejection_note: note ?? null }
          : { status: contentStatus };

      const { error: contentError } = await supabase
        .from("content_registry")
        .update(contentPatch)
        .eq("id", contentId)
        .eq("org_id", getOrgId());

      if (contentError) throw contentError;
    }

    if (inboxRow.created_by_pipeline === "pipeline-b-weekly") {
      await requestCoordinatorAction("resume pipeline b");
    }
  }

  if (inboxRow.item_type === "campaign_brief" && inboxRow.created_by_pipeline === "pipeline-c-campaign" && action !== "read") {
    await requestCoordinatorAction("resume pipeline c");
  }

  return { id, action };
}

export async function getInboxItems() {
  const { data, error } = await supabase
    .from("human_inbox")
    .select("*")
    .eq("org_id", getOrgId())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapInboxItem(row as LiveInboxRow));
}

export async function approveInboxItem(id: string) {
  const inboxRow = (await requireSingleRow("human_inbox", id)) as LiveInboxRow;
  return performAction(id, getApproveAction(inboxRow));
}

export async function rejectInboxItem(id: string, note?: string) {
  return performAction(id, "reject", note);
}

export async function readFunctionError(error: unknown) {
  if (error instanceof FunctionsHttpError) {
    try {
      const context = error.context;
      const cloned = typeof context?.clone === "function" ? context.clone() : context;
      const payload = await cloned.json();
      if (typeof payload?.error === "string" && payload.error) return payload.error;
      if (typeof payload?.message === "string" && payload.message) return payload.message;
      return JSON.stringify(payload);
    } catch (_jsonError) {
      try {
        const context = error.context;
        const cloned = typeof context?.clone === "function" ? context.clone() : context;
        const text = await cloned.text();
        if (text) return text;
      } catch (_textError) {
        // Fall through to generic handling below.
      }
    }
  }

  if (error instanceof Error) return error.message;
  return "The request failed.";
}

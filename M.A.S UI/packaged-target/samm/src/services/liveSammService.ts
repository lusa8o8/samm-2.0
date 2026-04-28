import { getAccessToken, getOrgId, supabase } from "../../../../src/lib/supabase";
import {
  appendSammChatMessage,
  loadSammChatMessages,
} from "../../../../src/lib/samm-chat-persistence";
import type { ActionDescriptor, CalendarEvent, PipelineRun, RunStatus, SammMessage, WorkspaceContext } from "../types";

export type SammConversationMode = "planning" | "execution";

type CoordinatorChatResponse = {
  message?: string;
  suggestions?: string[];
  confirmation?: {
    title: string;
    description: string;
    action: string;
  } | null;
  invoked_action?: {
    type: "run_pipeline";
    pipeline: string;
    status: "queued" | "completed" | "failed";
  } | null;
};

const COORDINATOR_FUNCTION = "coordinator-ingress";

function normalizeRunStatus(value?: string | null): RunStatus {
  switch (value) {
    case "running":
    case "waiting_human":
    case "failed":
    case "scheduled":
      return value;
    case "queued":
    case "resumed":
      return "running";
    case "success":
    case "completed":
    case "cancelled":
      return "completed";
    default:
      return "scheduled";
  }
}

function mapPipelineName(pipeline?: string | null) {
  const normalized = (pipeline ?? "").toLowerCase();
  if (normalized.includes("pipeline-a")) return { id: "A", name: "Pipeline A" } as const;
  if (normalized.includes("pipeline-b")) return { id: "B", name: "Pipeline B" } as const;
  if (normalized.includes("pipeline-c")) return { id: "C", name: "Pipeline C" } as const;
  if (normalized.includes("pipeline-d")) return { id: "D", name: "Pipeline D" } as const;
  if (normalized.includes("publish")) return { id: "publish", name: "Publisher" } as const;
  return { id: "A", name: pipeline ?? "Pipeline" } as const;
}

function toIsoOrNow(value?: string | null) {
  return value ?? new Date().toISOString();
}

function mapPipelineRun(row: Record<string, any>): PipelineRun {
  const pipelineInfo = mapPipelineName(row.pipeline);
  const status = normalizeRunStatus(row.status);
  return {
    id: row.id,
    pipelineId: pipelineInfo.id,
    pipelineName: pipelineInfo.name,
    status,
    startedAt: toIsoOrNow(row.started_at),
    lastActivity: toIsoOrNow(row.started_at),
    stepCurrent: Number(row.result?.copy_assets_created ?? row.result?.posts_scheduled ?? row.result?.resolved_slots ?? 0),
    stepTotal: Number(row.result?.resolved_slots ?? row.result?.calendar_windows_considered ?? 1) || 1,
    stepName:
      row.summary ??
      row.result?.error ??
      row.result?.message ??
      row.pipeline ??
      "Processing",
    message: row.result?.error ?? undefined,
    retriesLeft: undefined,
  };
}

function normalizeEventType(eventType?: string | null): CalendarEvent["eventType"] {
  switch ((eventType ?? "").toLowerCase()) {
    case "launch":
      return "campaign_launch";
    case "promotion":
      return "promotion";
    case "seasonal":
      return "holiday";
    case "community":
      return "webinar";
    case "deadline":
      return "product_release";
    case "other":
      return "campaign_launch";
    default:
      return "campaign_launch";
  }
}

function mapCalendarEvent(row: Record<string, any>): CalendarEvent {
  return {
    id: row.id,
    name: row.label,
    eventType: normalizeEventType(row.event_type),
    startDate: row.event_date,
    endDate: row.event_end_date ?? undefined,
    targetICP: Array.isArray(row.universities) && row.universities.length > 0 ? row.universities.join(", ") : undefined,
    objective: row.label,
    campaignType: row.event_type,
    priority: row.creative_override_allowed ? "high" : "medium",
    status: "planned",
    ownerPipeline: "C",
    notes: row.support_content_allowed
      ? "Support content allowed inside this campaign window."
      : undefined,
  };
}

function buildActions(response: CoordinatorChatResponse): ActionDescriptor[] | undefined {
  if (!response.confirmation) return undefined;
  return [
    {
      label: `Confirm: ${response.confirmation.title}`,
      action: response.confirmation.action,
      variant: "default",
      payload: { confirmationAction: response.confirmation.action },
    },
  ];
}

function restoreActions(metadata: Record<string, unknown>): ActionDescriptor[] | undefined {
  if (Array.isArray(metadata.actions)) return metadata.actions as ActionDescriptor[];

  const confirmation =
    typeof metadata.confirmation === "object" && metadata.confirmation !== null
      ? (metadata.confirmation as { title?: string; action?: string })
      : null;

  if (!confirmation?.title || !confirmation.action) return undefined;
  return [
    {
      label: `Confirm: ${confirmation.title}`,
      action: confirmation.action,
      variant: "default",
      payload: { confirmationAction: confirmation.action },
    },
  ];
}

async function readFunctionError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null) {
    const maybeMessage = (error as { message?: string }).message;
    if (maybeMessage) return maybeMessage;
  }
  return "The request failed.";
}

export async function getSammMessages(): Promise<SammMessage[]> {
  const storedMessages = await loadSammChatMessages();
  if (storedMessages.length > 0) {
    return storedMessages.map((message) => ({
      id: message.id,
      role: message.role === "coordinator" ? "samm" : "user",
      content: message.content,
      timestamp: message.created_at,
      actions: message.role === "coordinator" ? restoreActions(message.metadata ?? {}) : undefined,
    }));
  }

  return [
    {
      id: "welcome-live",
      role: "samm",
      content:
        "I can help you shape the month, explain the tradeoffs, and turn that into a clear plan before anything goes live.",
      timestamp: new Date().toISOString(),
    },
  ];
}

export async function getSammContext(): Promise<WorkspaceContext> {
  const orgId = getOrgId();

  const [pipelineRunsResult, inboxResult, calendarResult] = await Promise.all([
    supabase
      .from("pipeline_runs")
      .select("id,pipeline,status,started_at,result")
      .eq("org_id", orgId)
      .order("started_at", { ascending: false })
      .limit(8),
    supabase
      .from("human_inbox")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "pending"),
    supabase
      .from("academic_calendar")
      .select("id,label,event_type,event_date,event_end_date,universities,creative_override_allowed,support_content_allowed")
      .eq("org_id", orgId)
      .gte("event_date", new Date().toISOString().slice(0, 10))
      .order("event_date", { ascending: true })
      .limit(1),
  ]);

  const pipelineRows = pipelineRunsResult.data ?? [];
  const activeRuns = pipelineRows
    .map(mapPipelineRun)
    .filter((run: PipelineRun) => run.status === "running" || run.status === "waiting_human")
    .slice(0, 4);
  const recentFailures = pipelineRows
    .map(mapPipelineRun)
    .filter((run: PipelineRun) => run.status === "failed")
    .slice(0, 3);

  return {
    activeRuns,
    pendingApprovals: inboxResult.count ?? 0,
    nextCalendarEvent: (calendarResult.data ?? [])[0] ? mapCalendarEvent(calendarResult.data![0]) : undefined,
    recentFailures,
    currentFocus: activeRuns[0]?.pipelineName ?? undefined,
  };
}

export async function sendSammMessage(
  content: string,
  history: SammMessage[] = [],
  mode: SammConversationMode = "execution",
  confirmationAction: string | null = null,
): Promise<SammMessage> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error("Your session expired. Please sign in again.");
  }

  const latestUserMessage = [...history].reverse().find((message) => message.role === "user" && message.content === content);
  void appendSammChatMessage({
    role: "user",
    content,
    mode,
    metadata: { source: "packaged_workspace" },
    createdAt: latestUserMessage?.timestamp ?? new Date().toISOString(),
  });

  try {
    const { data, error } = await supabase.functions.invoke(COORDINATOR_FUNCTION, {
      body: {
        message: content,
        history: history.map((message) => ({ role: message.role === "samm" ? "coordinator" : "user", content: message.content })),
        mode,
        confirmationAction,
        orgId: getOrgId(),
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (error) {
      throw error;
    }

    const response = (data ?? {}) as CoordinatorChatResponse;
    const reply =
      response.message ??
      "I reviewed the current workspace state and prepared the next step.";
    const actions = buildActions(response);
    const replyMessage: SammMessage = {
      id: `live-${Date.now()}`,
      role: "samm",
      content: reply,
      timestamp: new Date().toISOString(),
      actions,
    };

    void appendSammChatMessage({
      role: "coordinator",
      content: reply,
      mode,
      metadata: {
        source: "packaged_workspace",
        actions: actions ?? [],
        confirmation: response.confirmation ?? null,
        invoked_action: response.invoked_action ?? null,
        suggestions: response.suggestions ?? [],
      },
      createdAt: replyMessage.timestamp,
    });

    return replyMessage;
  } catch (error) {
    const message = await readFunctionError(error);
    const content = `I couldn't complete that request: ${message}`;
    void appendSammChatMessage({
      role: "coordinator",
      content,
      mode,
      metadata: {
        source: "packaged_workspace",
        error: message,
      },
    });
    throw new Error(message);
  }
}

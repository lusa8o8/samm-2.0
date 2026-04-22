import { getAccessToken, getOrgId, supabase } from "../../../../src/lib/supabase";
import type { PipelineId, PipelineRun, RunStatus } from "../types";

const PIPELINE_DESCRIPTIONS: Record<string, string> = {
  coordinator: "Orchestrates all pipelines and schedules.",
  pipeline_a: "Processes engagement and escalations.",
  pipeline_b: "Drafts and schedules social content.",
  pipeline_c: "Generates and sends campaign briefs.",
  pipeline_d: "Drafts one-off posts on request.",
};

export interface OperationsPipelineHealth {
  id: string;
  pipelineId?: PipelineId;
  name: string;
  description: string;
  status: RunStatus;
  lastRun: string | null;
  duration: string | null;
  canTrigger: boolean;
}

export interface OperationsOverview {
  runs: PipelineRun[];
  health: OperationsPipelineHealth[];
  statusCounts: {
    running: number;
    waiting_human: number;
    failed: number;
    completed: number;
    scheduled: number;
  };
}

function toPipelineKey(value?: string | null) {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("pipeline-a") || normalized === "pipeline_a") return "pipeline_a";
  if (normalized.includes("pipeline-b") || normalized === "pipeline_b") return "pipeline_b";
  if (normalized.includes("pipeline-c") || normalized === "pipeline_c") return "pipeline_c";
  if (normalized.includes("pipeline-d") || normalized === "pipeline_d") return "pipeline_d";
  return "coordinator";
}

function toPipelineInfo(value?: string | null) {
  switch (toPipelineKey(value)) {
    case "pipeline_a":
      return { id: "A" as const, name: "Pipeline A" };
    case "pipeline_b":
      return { id: "B" as const, name: "Pipeline B" };
    case "pipeline_c":
      return { id: "C" as const, name: "Pipeline C" };
    case "pipeline_d":
      return { id: "D" as const, name: "Pipeline D" };
    default:
      return { id: undefined, name: "Coordinator" };
  }
}

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

function calculateDurationSeconds(row: Record<string, any>) {
  if (typeof row.duration_seconds === "number") return row.duration_seconds;
  const startedAt = row.started_at ?? row.created_at;
  const finishedAt = row.finished_at ?? row.updated_at;
  if (!startedAt || !finishedAt) return null;
  const seconds = Math.round((new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

function summarizeRun(row: Record<string, any>) {
  if (row.summary) return row.summary;
  if (row.result_summary) return row.result_summary;
  if (row.error_message) return row.error_message;
  if (row.result?.error) return row.result.error;

  const result = row.result ?? {};
  if (row.status === "failed") return "Execution failed";
  if (typeof result.copy_assets_created === "number") return `${result.copy_assets_created} copy assets`;
  if (typeof result.posts_drafted === "number") return `${result.posts_drafted} drafts`;
  if (typeof result.comments_processed === "number") return `${result.comments_processed} comments processed`;
  if (typeof result.posts_scheduled === "number") return `${result.posts_scheduled} posts scheduled`;
  return row.pipeline ?? "Processing";
}

function mapPipelineRun(row: Record<string, any>): PipelineRun {
  const pipelineInfo = toPipelineInfo(row.pipeline);
  const status = normalizeRunStatus(row.status);
  const stepCurrent = Number(
    row.result?.copy_assets_created ??
      row.result?.posts_scheduled ??
      row.result?.posts_drafted ??
      row.result?.comments_processed ??
      0
  );
  const stepTotal = Number(
    row.result?.resolved_slots ??
      row.result?.copy_assets_needed ??
      row.result?.copy_assets_created ??
      row.result?.posts_planned ??
      row.result?.calendar_windows_considered ??
      1
  ) || 1;

  return {
    id: row.id,
    pipelineId: pipelineInfo.id ?? "publish",
    pipelineName: pipelineInfo.name,
    status,
    startedAt: row.started_at ?? row.created_at ?? new Date().toISOString(),
    lastActivity: row.finished_at ?? row.updated_at ?? row.started_at ?? row.created_at ?? new Date().toISOString(),
    stepCurrent,
    stepTotal,
    stepName: summarizeRun(row),
    message: row.error_message ?? row.result?.error ?? undefined,
    retriesLeft: undefined,
  };
}

function formatDuration(seconds: number | null) {
  return seconds == null ? null : `${seconds}s`;
}

function formatHealthRow(key: string, row?: Record<string, any>): OperationsPipelineHealth {
  const info = toPipelineInfo(key);
  const status = normalizeRunStatus(row?.status ?? "scheduled");
  return {
    id: key,
    pipelineId: info.id,
    name: info.name,
    description: PIPELINE_DESCRIPTIONS[key] ?? "Pipeline activity",
    status,
    lastRun: row?.started_at ?? row?.created_at ?? null,
    duration: formatDuration(row ? calculateDurationSeconds(row) : null),
    canTrigger: key === "pipeline_a" || key === "pipeline_b" || key === "pipeline_c",
  };
}

export async function getOperationsOverview(): Promise<OperationsOverview> {
  const orgId = getOrgId();

  const [{ data, error }, { data: pipelineDRows, error: pipelineDError }] = await Promise.all([
    supabase
      .from("pipeline_runs")
      .select("*")
      .eq("org_id", orgId)
      .order("started_at", { ascending: false })
      .limit(40),
    supabase
      .from("content_registry")
      .select("id, created_at, updated_at, status, created_by")
      .eq("org_id", orgId)
      .eq("created_by", "pipeline-d-post")
      .eq("is_campaign_post", false)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  if (error) throw error;
  if (pipelineDError) throw pipelineDError;

  const latestByPipeline: Record<string, any> = {};
  for (const row of data ?? []) {
    const key = toPipelineKey(row.pipeline);
    if (!latestByPipeline[key]) latestByPipeline[key] = row;
  }

  const syntheticPipelineDRows = (pipelineDRows ?? []).map((row) => ({
    id: `pipeline-d-${row.id}`,
    pipeline: "pipeline_d",
    status: row.status === "failed" ? "failed" : "success",
    started_at: row.created_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    duration_seconds: calculateDurationSeconds(row) ?? 0,
    summary: row.status === "failed" ? "One-off post failed" : "Recent one-off drafts created",
    error_message: row.status === "failed" ? "One-off post failed" : null,
    result: null,
  }));

  const pipelineDHealthRow =
    latestByPipeline.pipeline_d ??
    syntheticPipelineDRows[0] ??
    undefined;

  const runs = [...(data ?? []), ...syntheticPipelineDRows]
    .sort((a, b) => {
      const aTime = new Date(a.started_at ?? a.created_at ?? 0).getTime();
      const bTime = new Date(b.started_at ?? b.created_at ?? 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 14)
    .map(mapPipelineRun);

  const statusCounts = {
    running: runs.filter((run) => run.status === "running").length,
    waiting_human: runs.filter((run) => run.status === "waiting_human").length,
    failed: runs.filter((run) => run.status === "failed").length,
    completed: runs.filter((run) => run.status === "completed").length,
    scheduled: runs.filter((run) => run.status === "scheduled").length,
  };

  const health = [
    formatHealthRow("coordinator", latestByPipeline.coordinator),
    formatHealthRow("pipeline_a", latestByPipeline.pipeline_a),
    formatHealthRow("pipeline_b", latestByPipeline.pipeline_b),
    formatHealthRow("pipeline_c", latestByPipeline.pipeline_c),
    formatHealthRow("pipeline_d", pipelineDHealthRow),
  ];

  return { runs, health, statusCounts };
}

export async function triggerOperationsPipeline(pipelineId: PipelineId) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error("Your session expired. Please sign in again.");
  }

  const pipelineMap: Partial<Record<PipelineId, "a" | "b" | "c">> = {
    A: "a",
    B: "b",
    C: "c",
  };

  const triggerKey = pipelineMap[pipelineId];
  if (!triggerKey) return;

  const messageMap = {
    a: "run pipeline a",
    b: "run pipeline b",
    c: "run pipeline c",
  };

  const { error } = await supabase.functions.invoke("coordinator-ingress", {
    body: {
      message: messageMap[triggerKey],
      history: [],
      confirmationAction: null,
      orgId: getOrgId(),
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (error) throw error;
}

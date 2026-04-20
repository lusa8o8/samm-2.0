import { PIPELINE_RUN_STATUS, type PipelineRunStatus } from './pipeline-run-status.ts'

export const COORDINATOR_TASK_TYPE = {
  PIPELINE_RUN: 'pipeline_run',
  APPROVAL_REQUEST: 'approval_request',
  STATUS_CHECK: 'status_check',
  SUMMARY_REQUEST: 'summary_request',
  CALENDAR_FOLLOWUP: 'calendar_followup',
  CONTENT_REVIEW: 'content_review',
  MANUAL_ACTION: 'manual_action',
  SYSTEM_NOTICE: 'system_notice',
} as const

export const COORDINATOR_TASK_STATUS = {
  NEW: 'new',
  ADMITTED: 'admitted',
  RUNNING: 'running',
  WAITING_HUMAN: 'waiting_human',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const

export const COORDINATOR_OBLIGATION_STATUS = {
  PENDING: 'pending',
  FIRED: 'fired',
  CANCELLED: 'cancelled',
} as const

export const COORDINATOR_TRIGGER_TYPE = {
  ON_SUCCESS: 'on_success',
  ON_FAILURE: 'on_failure',
  ON_WAITING_HUMAN: 'on_waiting_human',
  ON_STALE: 'on_stale',
  ON_CANCELLED: 'on_cancelled',
  ON_DUE_TIME: 'on_due_time',
  ON_NO_RESPONSE_TIMEOUT: 'on_no_response_timeout',
} as const

export const MEMORY_CHANNEL = {
  DASHBOARD: 'dashboard',
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
  SLACK: 'slack',
  TELEGRAM: 'telegram',
  TEAMS: 'teams',
} as const

export type CoordinatorTaskType = typeof COORDINATOR_TASK_TYPE[keyof typeof COORDINATOR_TASK_TYPE]
export type CoordinatorTaskStatus = typeof COORDINATOR_TASK_STATUS[keyof typeof COORDINATOR_TASK_STATUS]
export type CoordinatorObligationStatus = typeof COORDINATOR_OBLIGATION_STATUS[keyof typeof COORDINATOR_OBLIGATION_STATUS]
export type CoordinatorTriggerType = typeof COORDINATOR_TRIGGER_TYPE[keyof typeof COORDINATOR_TRIGGER_TYPE]
export type MemoryChannel = typeof MEMORY_CHANNEL[keyof typeof MEMORY_CHANNEL]

const TASK_TYPE_VALUES = new Set<string>(Object.values(COORDINATOR_TASK_TYPE))
const TASK_STATUS_VALUES = new Set<string>(Object.values(COORDINATOR_TASK_STATUS))
const OBLIGATION_STATUS_VALUES = new Set<string>(Object.values(COORDINATOR_OBLIGATION_STATUS))
const TRIGGER_TYPE_VALUES = new Set<string>(Object.values(COORDINATOR_TRIGGER_TYPE))

export type DashboardMemoryContext = {
  routeId: string
  threadId: string
  routeKey: string
  threadKey: string
  sourceChannel: typeof MEMORY_CHANNEL.DASHBOARD
  sourceConversationId: string
  sourceThreadId: string
}

export type CreateCoordinatorTaskParams = {
  supabase: any
  orgId: string
  userId?: string | null
  routeId: string
  threadId: string
  sourceChannel: MemoryChannel
  sourceConversationId: string
  sourceThreadId?: string | null
  sourceMessageId?: string | null
  taskType: CoordinatorTaskType
  requestText: string
  resolvedIntent?: string | null
  requestedPipeline?: string | null
  currentSummary?: string | null
  followupRouteId?: string | null
}

export function assertCoordinatorTaskType(value: string): asserts value is CoordinatorTaskType {
  if (!TASK_TYPE_VALUES.has(value)) {
    throw new Error(`Unsupported coordinator task type: ${value}`)
  }
}

export function assertCoordinatorTaskStatus(value: string): asserts value is CoordinatorTaskStatus {
  if (!TASK_STATUS_VALUES.has(value)) {
    throw new Error(`Unsupported coordinator task status: ${value}`)
  }
}

export function assertCoordinatorObligationStatus(value: string): asserts value is CoordinatorObligationStatus {
  if (!OBLIGATION_STATUS_VALUES.has(value)) {
    throw new Error(`Unsupported coordinator obligation status: ${value}`)
  }
}

export function assertCoordinatorTriggerType(value: string): asserts value is CoordinatorTriggerType {
  if (!TRIGGER_TYPE_VALUES.has(value)) {
    throw new Error(`Unsupported coordinator trigger type: ${value}`)
  }
}

export async function ensureDashboardMemoryContext(
  supabase: any,
  params: { orgId: string; userId: string; message?: string | null },
): Promise<DashboardMemoryContext> {
  const { orgId, userId, message } = params
  const routeKey = `dashboard:user:${userId}`
  const threadKey = `${routeKey}:main`
  const sourceConversationId = routeKey
  const sourceThreadId = threadKey
  const now = new Date().toISOString()

  const { data: route, error: routeError } = await supabase
    .from('channel_routes')
    .upsert({
      org_id: orgId,
      channel: MEMORY_CHANNEL.DASHBOARD,
      route_type: 'workspace',
      route_key: routeKey,
      external_user_id: userId,
      external_conversation_id: sourceConversationId,
      external_thread_id: sourceThreadId,
      is_primary: true,
      fallback_priority: 0,
      metadata: {},
      updated_at: now,
    }, { onConflict: 'org_id,route_key' })
    .select('id')
    .single()

  if (routeError || !route?.id) {
    throw new Error(`Failed to upsert dashboard route: ${routeError?.message ?? 'Missing route id'}`)
  }

  const { data: thread, error: threadError } = await supabase
    .from('conversation_threads')
    .upsert({
      org_id: orgId,
      route_id: route.id,
      channel: MEMORY_CHANNEL.DASHBOARD,
      thread_key: threadKey,
      external_conversation_id: sourceConversationId,
      external_thread_id: sourceThreadId,
      external_user_id: userId,
      last_message_at: now,
      recent_summary: message?.slice(0, 500) ?? null,
      updated_at: now,
    }, { onConflict: 'org_id,thread_key' })
    .select('id')
    .single()

  if (threadError || !thread?.id) {
    throw new Error(`Failed to upsert dashboard thread: ${threadError?.message ?? 'Missing thread id'}`)
  }

  return {
    routeId: route.id,
    threadId: thread.id,
    routeKey,
    threadKey,
    sourceChannel: MEMORY_CHANNEL.DASHBOARD,
    sourceConversationId,
    sourceThreadId,
  }
}

export async function createCoordinatorTask(
  params: CreateCoordinatorTaskParams,
): Promise<{ taskId: string; obligationIds: string[] }> {
  const {
    supabase,
    orgId,
    userId,
    routeId,
    threadId,
    sourceChannel,
    sourceConversationId,
    sourceThreadId,
    sourceMessageId,
    taskType,
    requestText,
    resolvedIntent,
    requestedPipeline,
    currentSummary,
    followupRouteId,
  } = params

  assertCoordinatorTaskType(taskType)
  const now = new Date().toISOString()

  const { data: task, error: taskError } = await supabase
    .from('coordinator_tasks')
    .insert({
      org_id: orgId,
      created_by_user_id: userId ?? null,
      route_id: routeId,
      thread_id: threadId,
      source_channel: sourceChannel,
      source_conversation_id: sourceConversationId,
      source_thread_id: sourceThreadId ?? null,
      source_message_id: sourceMessageId ?? null,
      task_type: taskType,
      request_text: requestText,
      resolved_intent: resolvedIntent ?? null,
      requested_pipeline: requestedPipeline ?? null,
      status: COORDINATOR_TASK_STATUS.ADMITTED,
      current_summary: currentSummary ?? requestText,
      followup_route_id: followupRouteId ?? routeId,
      updated_at: now,
    })
    .select('id, followup_route_id')
    .single()

  if (taskError || !task?.id) {
    throw new Error(`Failed to create coordinator task: ${taskError?.message ?? 'Missing task id'}`)
  }

  const obligationPayloads = [
    COORDINATOR_TRIGGER_TYPE.ON_SUCCESS,
    COORDINATOR_TRIGGER_TYPE.ON_FAILURE,
    COORDINATOR_TRIGGER_TYPE.ON_WAITING_HUMAN,
    COORDINATOR_TRIGGER_TYPE.ON_CANCELLED,
  ].map((triggerType) => ({
    org_id: orgId,
    coordinator_task_id: task.id,
    trigger_type: triggerType,
    trigger_ref_type: 'pipeline_run',
    trigger_ref_id: null,
    destination_route_id: task.followup_route_id ?? routeId,
    obligation_status: COORDINATOR_OBLIGATION_STATUS.PENDING,
    payload: {},
  }))

  const { data: obligations, error: obligationError } = await supabase
    .from('coordinator_obligations')
    .insert(obligationPayloads)
    .select('id')

  if (obligationError) {
    throw new Error(`Failed to create coordinator obligations: ${obligationError.message}`)
  }

  const { error: threadUpdateError } = await supabase
    .from('conversation_threads')
    .update({
      active_task_id: task.id,
      updated_at: now,
    })
    .eq('id', threadId)

  if (threadUpdateError) {
    throw new Error(`Failed to update conversation thread: ${threadUpdateError.message}`)
  }

  return {
    taskId: task.id,
    obligationIds: (obligations ?? []).map((row: { id: string }) => row.id),
  }
}

export async function linkCoordinatorTaskToPipelineRun(
  supabase: any,
  params: { taskId: string; runId: string | null },
) {
  const { taskId, runId } = params
  if (!runId) return

  const now = new Date().toISOString()
  const { error: taskError } = await supabase
    .from('coordinator_tasks')
    .update({
      linked_pipeline_run_id: runId,
      status: COORDINATOR_TASK_STATUS.RUNNING,
      updated_at: now,
    })
    .eq('id', taskId)

  if (taskError) {
    throw new Error(`Failed to link coordinator task to run: ${taskError.message}`)
  }

  const { error: obligationError } = await supabase
    .from('coordinator_obligations')
    .update({ trigger_ref_id: runId })
    .eq('coordinator_task_id', taskId)

  if (obligationError) {
    throw new Error(`Failed to link coordinator obligations to run: ${obligationError.message}`)
  }
}

export async function updateCoordinatorTaskStatus(
  supabase: any,
  params: {
    taskId: string
    status: CoordinatorTaskStatus
    currentSummary?: string | null
    resultSummary?: string | null
  },
) {
  const { taskId, status, currentSummary, resultSummary } = params
  assertCoordinatorTaskStatus(status)

  const now = new Date().toISOString()
  const terminal = status === COORDINATOR_TASK_STATUS.COMPLETED
    || status === COORDINATOR_TASK_STATUS.FAILED
    || status === COORDINATOR_TASK_STATUS.CANCELLED

  const patch: Record<string, unknown> = {
    status,
    updated_at: now,
  }

  if (currentSummary !== undefined) {
    patch.current_summary = currentSummary
  }

  if (resultSummary !== undefined) {
    patch.result_summary = resultSummary
  }

  if (terminal) {
    patch.completed_at = now
  }

  const { error } = await supabase
    .from('coordinator_tasks')
    .update(patch)
    .eq('id', taskId)

  if (error) {
    throw new Error(`Failed to update coordinator task status: ${error.message}`)
  }
}

export function mapPipelineRunStatusToCoordinatorStatus(status: PipelineRunStatus): CoordinatorTaskStatus {
  if (status === PIPELINE_RUN_STATUS.RUNNING || status === PIPELINE_RUN_STATUS.RESUMED) {
    return COORDINATOR_TASK_STATUS.RUNNING
  }
  if (status === PIPELINE_RUN_STATUS.WAITING_HUMAN) {
    return COORDINATOR_TASK_STATUS.WAITING_HUMAN
  }
  if (status === PIPELINE_RUN_STATUS.SUCCESS) {
    return COORDINATOR_TASK_STATUS.COMPLETED
  }
  if (status === PIPELINE_RUN_STATUS.CANCELLED) {
    return COORDINATOR_TASK_STATUS.CANCELLED
  }
  return COORDINATOR_TASK_STATUS.FAILED
}

export async function syncCoordinatorTaskFromRun(
  supabase: any,
  params: {
    runId: string | null
    status: PipelineRunStatus
    result?: Record<string, unknown> | null
  },
) {
  const { runId, status, result } = params
  if (!runId) return

  const { data: runRow, error: runError } = await supabase
    .from('pipeline_runs')
    .select('coordinator_task_id')
    .eq('id', runId)
    .single()

  if (runError) {
    throw new Error(`Failed to load pipeline run for coordinator sync: ${runError.message}`)
  }

  const taskId = runRow?.coordinator_task_id
  if (!taskId) return

  const nextStatus = mapPipelineRunStatusToCoordinatorStatus(status)
  const now = new Date().toISOString()
  const terminal = nextStatus === COORDINATOR_TASK_STATUS.COMPLETED
    || nextStatus === COORDINATOR_TASK_STATUS.FAILED
    || nextStatus === COORDINATOR_TASK_STATUS.CANCELLED

  const summary =
    (typeof result?.error === 'string' && result.error)
    || (typeof result?.summary === 'string' && result.summary)
    || (typeof result?.message === 'string' && result.message)
    || null

  const patch: Record<string, unknown> = {
    status: nextStatus,
    updated_at: now,
  }

  if (nextStatus === COORDINATOR_TASK_STATUS.WAITING_HUMAN) {
    patch.current_summary = summary ?? 'Waiting on human action.'
  }

  if (terminal) {
    patch.result_summary = summary
    patch.completed_at = now
  }

  const { error: taskError } = await supabase
    .from('coordinator_tasks')
    .update(patch)
    .eq('id', taskId)

  if (taskError) {
    throw new Error(`Failed to sync coordinator task from pipeline run: ${taskError.message}`)
  }
}

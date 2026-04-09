export const PIPELINE_RUN_STATUS = {
  QUEUED: 'queued',
  RUNNING: 'running',
  WAITING_HUMAN: 'waiting_human',
  RESUMED: 'resumed',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const

export type PipelineRunStatus = typeof PIPELINE_RUN_STATUS[keyof typeof PIPELINE_RUN_STATUS]

export function isPipelineRunTerminal(status?: string | null) {
  return status === PIPELINE_RUN_STATUS.SUCCESS
    || status === PIPELINE_RUN_STATUS.FAILED
    || status === PIPELINE_RUN_STATUS.CANCELLED
}

export function isPipelineRunExecuting(status?: string | null) {
  return status === PIPELINE_RUN_STATUS.RUNNING || status === PIPELINE_RUN_STATUS.RESUMED
}

export function isPipelineRunBlocking(status?: string | null) {
  return status === PIPELINE_RUN_STATUS.QUEUED
    || status === PIPELINE_RUN_STATUS.RUNNING
    || status == PIPELINE_RUN_STATUS.WAITING_HUMAN
    || status === PIPELINE_RUN_STATUS.RESUMED
}

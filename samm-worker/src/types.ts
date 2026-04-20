export type PipelineRunRecord = {
  id: string
  org_id: string
  pipeline: string
  status: string
  result: Record<string, unknown> | null
  started_at: string | null
  finished_at: string | null
  coordinator_task_id: string | null
  execution_target: string
  worker_claimed_at: string | null
  worker_claimed_by: string | null
  worker_last_heartbeat_at: string | null
  worker_attempt_count: number
}

import { supabaseAdmin } from './supabase.js'
import { workerConfig } from './config.js'
import type { PipelineRunRecord } from './types.js'

export async function claimNextWorkerRun(): Promise<PipelineRunRecord | null> {
  const { data, error } = await supabaseAdmin.rpc('claim_next_worker_run', {
    p_worker_id: workerConfig.workerId,
    p_pipelines: workerConfig.pipelines,
  })

  if (error) {
    throw new Error(`Failed to claim worker run: ${error.message}`)
  }

  if (!data) return null

  if (Array.isArray(data)) {
    return (data[0] ?? null) as PipelineRunRecord | null
  }

  return data as PipelineRunRecord
}

export async function heartbeatWorkerRun(runId: string) {
  const { error } = await supabaseAdmin.rpc('heartbeat_worker_run', {
    p_run_id: runId,
    p_worker_id: workerConfig.workerId,
  })

  if (error) {
    throw new Error(`Failed to heartbeat worker run ${runId}: ${error.message}`)
  }
}

export async function releaseWorkerRun(runId: string) {
  const { error } = await supabaseAdmin.rpc('release_worker_run_claim', {
    p_run_id: runId,
    p_worker_id: workerConfig.workerId,
  })

  if (error) {
    throw new Error(`Failed to release worker run ${runId}: ${error.message}`)
  }
}

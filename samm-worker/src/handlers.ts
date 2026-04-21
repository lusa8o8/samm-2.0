import { supabaseAdmin } from './supabase.js'
import { workerConfig } from './config.js'
import type { PipelineRunRecord } from './types.js'

async function invokeEdgePipeline(run: PipelineRunRecord, functionName: string) {
  const workerPayload =
    run.result && typeof run.result === 'object' && 'worker_payload' in run.result
      ? (run.result.worker_payload as Record<string, unknown> | null)
      : null

  const response = await fetch(`${workerConfig.functionsBaseUrl}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: workerConfig.supabaseServiceRoleKey,
      Authorization: `Bearer ${workerConfig.supabaseServiceRoleKey}`,
    },
    body: JSON.stringify({
      org_id: run.org_id,
      worker_run_id: run.id,
      coordinator_task_id: run.coordinator_task_id,
      ...(workerPayload ?? {}),
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Edge invoke failed (${response.status}) ${body}`.trim())
  }
}

async function markRunFailed(run: PipelineRunRecord, errorMessage: string) {
  const result = {
    ...(run.result ?? {}),
    error: errorMessage,
  }

  const { error } = await supabaseAdmin
    .from('pipeline_runs')
    .update({
      status: 'failed',
      result,
      finished_at: new Date().toISOString(),
    })
    .eq('id', run.id)

  if (error) {
    throw new Error(`Failed to mark run ${run.id} as failed: ${error.message}`)
  }

  if (run.coordinator_task_id) {
    const { error: taskError } = await supabaseAdmin
      .from('coordinator_tasks')
      .update({
        status: 'failed',
        result_summary: errorMessage,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', run.coordinator_task_id)

    if (taskError) {
      throw new Error(`Failed to sync coordinator task ${run.coordinator_task_id}: ${taskError.message}`)
    }
  }
}

export async function dispatchClaimedRun(run: PipelineRunRecord) {
  switch (run.pipeline) {
    case 'pipeline-b-weekly':
      await invokeEdgePipeline(run, 'pipeline-b-weekly')
      console.log(`[worker] dispatched ${run.pipeline} run ${run.id} to edge execution`)
      return
    case 'pipeline-c-campaign':
      await invokeEdgePipeline(run, 'pipeline-c-campaign')
      console.log(`[worker] dispatched ${run.pipeline} run ${run.id} to edge execution`)
      return
    default:
      console.warn(`[worker] claimed unsupported pipeline ${run.pipeline} for run ${run.id}`)
      await markRunFailed(run, `Unsupported worker pipeline: ${run.pipeline}`)
  }
}

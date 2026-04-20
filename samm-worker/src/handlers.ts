import type { PipelineRunRecord } from './types.js'

export async function dispatchClaimedRun(run: PipelineRunRecord) {
  switch (run.pipeline) {
    case 'pipeline-b-weekly':
    case 'pipeline-c-campaign':
      console.log(`[worker] claimed ${run.pipeline} run ${run.id}. Execution handoff is not wired yet in this slice.`)
      return
    default:
      console.warn(`[worker] claimed unsupported pipeline ${run.pipeline} for run ${run.id}`)
  }
}

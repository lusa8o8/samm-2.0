import { workerConfig } from './config.js'
import { claimNextWorkerRun, releaseWorkerRun } from './claim-next-run.js'
import { dispatchClaimedRun } from './handlers.js'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function tick() {
  const claimedRun = await claimNextWorkerRun()
  if (!claimedRun) {
    return false
  }

  console.log(`[worker] claimed run ${claimedRun.id} for ${claimedRun.pipeline}`)

  try {
    await dispatchClaimedRun(claimedRun)
  } catch (error) {
    console.error(
      `[worker] dispatch failed for run ${claimedRun.id}:`,
      error instanceof Error ? error.message : String(error),
    )
    await releaseWorkerRun(claimedRun.id)
  }

  return true
}

async function main() {
  console.log(
    `[worker] starting ${workerConfig.workerId} (poll=${workerConfig.pollIntervalMs}ms pipelines=${workerConfig.pipelines.join(',')})`,
  )

  while (true) {
    try {
      await tick()
    } catch (error) {
      console.error('[worker] tick failed:', error instanceof Error ? error.message : String(error))
    }

    await sleep(workerConfig.pollIntervalMs)
  }
}

main().catch((error) => {
  console.error('[worker] fatal startup error:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})

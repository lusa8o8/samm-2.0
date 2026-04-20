const DEFAULT_POLL_INTERVAL_MS = 5000

function requireEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const workerConfig = {
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  workerId: process.env.SAMM_WORKER_ID?.trim() || `worker-${process.pid}`,
  pollIntervalMs: parsePositiveInt(process.env.SAMM_WORKER_POLL_INTERVAL_MS, DEFAULT_POLL_INTERVAL_MS),
  pipelines: ['pipeline-b-weekly', 'pipeline-c-campaign'],
} as const

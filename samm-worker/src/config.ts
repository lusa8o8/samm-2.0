const DEFAULT_POLL_INTERVAL_MS = 5000
const DEFAULT_PIPELINES = ''

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

function parsePipelineList(value: string | undefined) {
  return (value ?? DEFAULT_PIPELINES)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export const workerConfig = {
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  functionsBaseUrl: `${requireEnv('SUPABASE_URL')}/functions/v1`,
  workerId: process.env.SAMM_WORKER_ID?.trim() || `worker-${process.pid}`,
  pollIntervalMs: parsePositiveInt(process.env.SAMM_WORKER_POLL_INTERVAL_MS, DEFAULT_POLL_INTERVAL_MS),
  pipelines: parsePipelineList(process.env.SAMM_WORKER_PIPELINES),
} as const

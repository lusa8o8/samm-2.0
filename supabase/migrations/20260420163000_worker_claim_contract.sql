ALTER TABLE public.pipeline_runs
  ADD COLUMN IF NOT EXISTS execution_target text NOT NULL DEFAULT 'edge',
  ADD COLUMN IF NOT EXISTS worker_claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS worker_claimed_by text,
  ADD COLUMN IF NOT EXISTS worker_last_heartbeat_at timestamptz,
  ADD COLUMN IF NOT EXISTS worker_attempt_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_execution_target_status
  ON public.pipeline_runs (execution_target, status, started_at);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_worker_claimed_at
  ON public.pipeline_runs (worker_claimed_at);

CREATE OR REPLACE FUNCTION public.claim_next_worker_run(
  p_worker_id text,
  p_pipelines text[] DEFAULT NULL
)
RETURNS SETOF public.pipeline_runs
LANGUAGE plpgsql
AS $$
DECLARE
  claimed_row public.pipeline_runs%ROWTYPE;
BEGIN
  UPDATE public.pipeline_runs pr
  SET
    status = 'running',
    worker_claimed_at = now(),
    worker_claimed_by = p_worker_id,
    worker_last_heartbeat_at = now(),
    worker_attempt_count = COALESCE(pr.worker_attempt_count, 0) + 1,
    started_at = COALESCE(pr.started_at, now())
  WHERE pr.id = (
    SELECT id
    FROM public.pipeline_runs
    WHERE execution_target = 'worker'
      AND status = 'queued'
      AND worker_claimed_at IS NULL
      AND (
        p_pipelines IS NULL
        OR array_length(p_pipelines, 1) IS NULL
        OR pipeline = ANY(p_pipelines)
      )
    ORDER BY started_at ASC NULLS FIRST, created_at ASC NULLS FIRST, id ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING pr.* INTO claimed_row;

  IF claimed_row.id IS NULL THEN
    RETURN;
  END IF;

  RETURN NEXT claimed_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_worker_run_claim(
  p_run_id uuid,
  p_worker_id text
)
RETURNS public.pipeline_runs
LANGUAGE plpgsql
AS $$
DECLARE
  updated_row public.pipeline_runs%ROWTYPE;
BEGIN
  UPDATE public.pipeline_runs
  SET
    status = 'queued',
    worker_claimed_at = NULL,
    worker_claimed_by = NULL,
    worker_last_heartbeat_at = NULL
  WHERE id = p_run_id
    AND worker_claimed_by = p_worker_id
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.heartbeat_worker_run(
  p_run_id uuid,
  p_worker_id text
)
RETURNS public.pipeline_runs
LANGUAGE plpgsql
AS $$
DECLARE
  updated_row public.pipeline_runs%ROWTYPE;
BEGIN
  UPDATE public.pipeline_runs
  SET worker_last_heartbeat_at = now()
  WHERE id = p_run_id
    AND worker_claimed_by = p_worker_id
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

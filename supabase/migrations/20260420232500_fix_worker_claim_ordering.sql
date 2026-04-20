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
    ORDER BY started_at ASC NULLS FIRST, id ASC
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

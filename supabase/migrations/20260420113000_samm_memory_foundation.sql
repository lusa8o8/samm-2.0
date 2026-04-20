CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.channel_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  channel text NOT NULL,
  route_type text NOT NULL,
  route_key text NOT NULL,
  external_user_id text,
  external_conversation_id text,
  external_thread_id text,
  is_primary boolean NOT NULL DEFAULT false,
  fallback_priority integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, route_key)
);

CREATE INDEX IF NOT EXISTS idx_channel_routes_org_id ON public.channel_routes (org_id);
CREATE INDEX IF NOT EXISTS idx_channel_routes_org_channel ON public.channel_routes (org_id, channel);

CREATE TABLE IF NOT EXISTS public.conversation_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  route_id uuid REFERENCES public.channel_routes(id) ON DELETE SET NULL,
  channel text NOT NULL,
  thread_key text NOT NULL,
  external_conversation_id text NOT NULL,
  external_thread_id text,
  external_user_id text,
  current_state text,
  current_goal text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  recent_summary text,
  active_task_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, thread_key)
);

CREATE INDEX IF NOT EXISTS idx_conversation_threads_org_id ON public.conversation_threads (org_id);
CREATE INDEX IF NOT EXISTS idx_conversation_threads_org_channel ON public.conversation_threads (org_id, channel);

CREATE TABLE IF NOT EXISTS public.coordinator_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  created_by_user_id uuid,
  route_id uuid REFERENCES public.channel_routes(id) ON DELETE SET NULL,
  thread_id uuid REFERENCES public.conversation_threads(id) ON DELETE SET NULL,
  source_channel text NOT NULL,
  source_conversation_id text NOT NULL,
  source_thread_id text,
  source_message_id text,
  task_type text NOT NULL,
  request_text text NOT NULL,
  resolved_intent text,
  requested_pipeline text,
  linked_pipeline_run_id uuid,
  linked_human_task_id uuid,
  status text NOT NULL DEFAULT 'new',
  current_summary text NOT NULL DEFAULT '',
  result_summary text,
  followup_route_id uuid REFERENCES public.channel_routes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_coordinator_tasks_org_id ON public.coordinator_tasks (org_id);
CREATE INDEX IF NOT EXISTS idx_coordinator_tasks_org_status ON public.coordinator_tasks (org_id, status);
CREATE INDEX IF NOT EXISTS idx_coordinator_tasks_pipeline_run ON public.coordinator_tasks (linked_pipeline_run_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'coordinator_tasks_status_check'
  ) THEN
    ALTER TABLE public.coordinator_tasks
      ADD CONSTRAINT coordinator_tasks_status_check
      CHECK (status IN ('new', 'admitted', 'running', 'waiting_human', 'completed', 'failed', 'cancelled'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.coordinator_obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  coordinator_task_id uuid NOT NULL REFERENCES public.coordinator_tasks(id) ON DELETE CASCADE,
  trigger_type text NOT NULL,
  trigger_ref_type text NOT NULL,
  trigger_ref_id text,
  destination_route_id uuid NOT NULL REFERENCES public.channel_routes(id) ON DELETE CASCADE,
  obligation_status text NOT NULL DEFAULT 'pending',
  message_template_key text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  fired_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_coordinator_obligations_org_id ON public.coordinator_obligations (org_id);
CREATE INDEX IF NOT EXISTS idx_coordinator_obligations_task_id ON public.coordinator_obligations (coordinator_task_id);
CREATE INDEX IF NOT EXISTS idx_coordinator_obligations_pending ON public.coordinator_obligations (org_id, obligation_status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'coordinator_obligations_status_check'
  ) THEN
    ALTER TABLE public.coordinator_obligations
      ADD CONSTRAINT coordinator_obligations_status_check
      CHECK (obligation_status IN ('pending', 'fired', 'cancelled'));
  END IF;
END $$;

ALTER TABLE public.pipeline_runs
  ADD COLUMN IF NOT EXISTS coordinator_task_id uuid REFERENCES public.coordinator_tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_coordinator_task_id ON public.pipeline_runs (coordinator_task_id);

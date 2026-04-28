CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.platform_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  platform text NOT NULL,
  snapshot_date date NOT NULL DEFAULT current_date,
  followers double precision,
  post_reach double precision,
  reach double precision,
  engagement_rate double precision,
  engagement double precision,
  signups double precision,
  conversions double precision,
  clicks double precision,
  link_clicks double precision,
  site_clicks double precision,
  followers_change double precision,
  reach_change double precision,
  engagement_change double precision,
  signups_change double precision,
  source text NOT NULL DEFAULT 'manual',
  source_integration text,
  external_account_id text,
  external_snapshot_id text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_metrics
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS snapshot_date date NOT NULL DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS followers double precision,
  ADD COLUMN IF NOT EXISTS post_reach double precision,
  ADD COLUMN IF NOT EXISTS reach double precision,
  ADD COLUMN IF NOT EXISTS engagement_rate double precision,
  ADD COLUMN IF NOT EXISTS engagement double precision,
  ADD COLUMN IF NOT EXISTS signups double precision,
  ADD COLUMN IF NOT EXISTS conversions double precision,
  ADD COLUMN IF NOT EXISTS clicks double precision,
  ADD COLUMN IF NOT EXISTS link_clicks double precision,
  ADD COLUMN IF NOT EXISTS site_clicks double precision,
  ADD COLUMN IF NOT EXISTS followers_change double precision,
  ADD COLUMN IF NOT EXISTS reach_change double precision,
  ADD COLUMN IF NOT EXISTS engagement_change double precision,
  ADD COLUMN IF NOT EXISTS signups_change double precision,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_integration text,
  ADD COLUMN IF NOT EXISTS external_account_id text,
  ADD COLUMN IF NOT EXISTS external_snapshot_id text,
  ADD COLUMN IF NOT EXISTS raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS captured_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_platform_metrics_org_snapshot
  ON public.platform_metrics (org_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_platform_metrics_org_platform_snapshot
  ON public.platform_metrics (org_id, platform, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_platform_metrics_source
  ON public.platform_metrics (source, source_integration);

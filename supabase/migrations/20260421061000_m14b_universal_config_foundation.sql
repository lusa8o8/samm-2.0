CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.icp_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  description text,
  hard_filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  soft_signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  exclusion_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  default_channels text[] NOT NULL DEFAULT '{}'::text[],
  default_cta_style text,
  default_offer_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  default_outreach_policy_id uuid,
  priority_score integer NOT NULL DEFAULT 0,
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_icp_categories_org_id ON public.icp_categories (org_id);
CREATE INDEX IF NOT EXISTS idx_icp_categories_org_active ON public.icp_categories (org_id, active);

CREATE TABLE IF NOT EXISTS public.discount_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  max_discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  allowed_discount_types text[] NOT NULL DEFAULT '{}'::text[],
  allowed_offer_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  allowed_icp_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  allowed_conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  forbidden_conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  cooldown_days integer NOT NULL DEFAULT 0,
  stacking_allowed boolean NOT NULL DEFAULT false,
  approval_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discount_policies_org_id ON public.discount_policies (org_id);

CREATE TABLE IF NOT EXISTS public.outreach_policy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  min_icp_fit_score numeric(5,2) NOT NULL DEFAULT 0,
  min_trigger_confidence numeric(5,2) NOT NULL DEFAULT 0,
  negative_signal_suppression_days integer NOT NULL DEFAULT 0,
  max_contacts_per_7d integer NOT NULL DEFAULT 0,
  max_contacts_per_30d integer NOT NULL DEFAULT 0,
  channel_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_policy_org_id ON public.outreach_policy (org_id);

CREATE TABLE IF NOT EXISTS public.offer_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  active boolean NOT NULL DEFAULT true,
  name text NOT NULL,
  type text NOT NULL,
  category text NOT NULL DEFAULT '',
  description text,
  base_price numeric(12,2),
  currency text,
  pricing_model text,
  valid_from date,
  valid_until date,
  applicable_icp_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  applicable_channels text[] NOT NULL DEFAULT '{}'::text[],
  applicable_subjects text[] NOT NULL DEFAULT '{}'::text[],
  applicable_seasons text[] NOT NULL DEFAULT '{}'::text[],
  default_cta text,
  delivery_method text,
  landing_url text,
  discount_allowed boolean NOT NULL DEFAULT false,
  discount_policy_id uuid,
  approval_required boolean NOT NULL DEFAULT false,
  priority_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offer_catalog_org_id ON public.offer_catalog (org_id);
CREATE INDEX IF NOT EXISTS idx_offer_catalog_org_active ON public.offer_catalog (org_id, active);

CREATE TABLE IF NOT EXISTS public.seasonality_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seasonality_profile_org_id ON public.seasonality_profile (org_id);

CREATE TABLE IF NOT EXISTS public.seasonality_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  seasonality_profile_id uuid NOT NULL REFERENCES public.seasonality_profile(id) ON DELETE CASCADE,
  name text NOT NULL,
  period_type text NOT NULL DEFAULT 'recurring',
  starts_on date,
  ends_on date,
  demand_level text NOT NULL DEFAULT 'normal',
  allow_discounts boolean NOT NULL DEFAULT false,
  outreach_intensity text NOT NULL DEFAULT 'normal',
  campaign_priority integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seasonality_periods_org_id ON public.seasonality_periods (org_id);
CREATE INDEX IF NOT EXISTS idx_seasonality_periods_profile_id ON public.seasonality_periods (seasonality_profile_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'seasonality_periods_demand_level_check'
  ) THEN
    ALTER TABLE public.seasonality_periods
      ADD CONSTRAINT seasonality_periods_demand_level_check
      CHECK (demand_level IN ('high', 'normal', 'low'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'seasonality_periods_period_type_check'
  ) THEN
    ALTER TABLE public.seasonality_periods
      ADD CONSTRAINT seasonality_periods_period_type_check
      CHECK (period_type IN ('recurring', 'override'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.campaign_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  default_duration_days integer NOT NULL DEFAULT 14,
  default_channels text[] NOT NULL DEFAULT '{}'::text[],
  default_objective text,
  default_cta_style text,
  default_icp_category_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_defaults_org_id ON public.campaign_defaults (org_id);

CREATE TABLE IF NOT EXISTS public.approval_policy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  brief_approval_required boolean NOT NULL DEFAULT true,
  copy_approval_required boolean NOT NULL DEFAULT true,
  discount_approval_required boolean NOT NULL DEFAULT true,
  outreach_approval_required boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_policy_org_id ON public.approval_policy (org_id);

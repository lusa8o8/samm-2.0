-- M11E+: Add social_handles JSONB and primary_cta_url text to org_config.
-- social_handles stores per-platform handles/usernames so they are injected
-- into design briefs — Canva AI needs these to place social icons accurately.
-- primary_cta_url is the single link used for QR codes and CTA buttons in
-- all designed assets (typically the StudyHub URL or campaign landing page).
ALTER TABLE org_config
  ADD COLUMN IF NOT EXISTS social_handles  jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS primary_cta_url text;

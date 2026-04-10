-- Add design_brief as an allowed platform value in content_registry
-- Required for Milestone 7E
-- Note: applied manually in two steps via Supabase SQL editor (DO blocks not supported)

ALTER TABLE content_registry DROP CONSTRAINT IF EXISTS content_registry_platform_check;

ALTER TABLE content_registry
  ADD CONSTRAINT content_registry_platform_check
  CHECK (platform = ANY (ARRAY['facebook', 'whatsapp', 'youtube', 'email', 'studyhub', 'ambassador', 'design_brief']));

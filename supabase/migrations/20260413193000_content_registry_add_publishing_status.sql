ALTER TABLE content_registry
  DROP CONSTRAINT IF EXISTS content_registry_status_check;

ALTER TABLE content_registry
  ADD CONSTRAINT content_registry_status_check
  CHECK (status IN ('draft', 'approved', 'scheduled', 'publishing', 'published', 'rejected', 'failed'));

ALTER TABLE content_registry
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

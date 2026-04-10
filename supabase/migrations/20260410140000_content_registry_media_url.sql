-- Add media_url to content_registry for image attachments
-- Required for Milestone 7E

ALTER TABLE content_registry
  ADD COLUMN IF NOT EXISTS media_url text;

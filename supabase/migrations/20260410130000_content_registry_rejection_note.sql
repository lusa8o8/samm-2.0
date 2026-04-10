-- Add rejection_note to content_registry for marketer approval gate
-- Required for Milestone 7D

ALTER TABLE content_registry
  ADD COLUMN IF NOT EXISTS rejection_note text;

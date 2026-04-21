-- M14B: Add explicit support_content_allowed to academic_calendar.
-- This separates campaign support-slot behavior from creative palette deviation.
-- Backfill existing rows from creative_override_allowed so current event behavior
-- remains stable after the UI and scheduler contract split.

ALTER TABLE academic_calendar
  ADD COLUMN IF NOT EXISTS support_content_allowed boolean NOT NULL DEFAULT false;

UPDATE academic_calendar
SET support_content_allowed = creative_override_allowed
WHERE support_content_allowed = false
  AND creative_override_allowed = true;

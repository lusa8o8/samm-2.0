-- Add event_end_date to academic_calendar for multi-day events
-- (exam windows, orientation weeks, registration periods).
-- Nullable — single-day events leave this null.
-- Pipeline C uses this for campaign window calculation when present.
ALTER TABLE academic_calendar
  ADD COLUMN IF NOT EXISTS event_end_date date;

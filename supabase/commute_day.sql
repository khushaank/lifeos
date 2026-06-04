-- LifeOS: commute marker for daily check-ins
-- Run in Supabase SQL Editor before using the Commute Day toggle.

ALTER TABLE daily_entries
  ADD COLUMN IF NOT EXISTS commute_day BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE daily_entries
SET commute_day = COALESCE(commute_day, FALSE)
WHERE commute_day IS NULL;

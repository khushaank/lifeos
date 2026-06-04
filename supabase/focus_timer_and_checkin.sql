-- LifeOS: Focus timer sync + check-in helpers
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

-- ---------------------------------------------------------------------------
-- Focus timer (single active session synced across devices)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS focus_timer_state (
  id TEXT PRIMARY KEY DEFAULT 'default',
  selected_minutes INTEGER NOT NULL DEFAULT 25,
  status TEXT NOT NULL DEFAULT 'idle'
    CHECK (status IN ('idle', 'running', 'paused', 'completed')),
  ends_at TIMESTAMPTZ NULL,
  remaining_seconds INTEGER NOT NULL DEFAULT 1500,
  sessions_completed_date DATE NULL,
  sessions_completed_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO focus_timer_state (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE focus_timer_state DISABLE ROW LEVEL SECURITY;

-- Optional: log completed focus blocks (for analytics / check-in hints)
CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  planned_minutes INTEGER NOT NULL,
  actual_seconds INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_completed_at
  ON focus_sessions (completed_at DESC);

ALTER TABLE focus_sessions DISABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Check-in: ensure one row per calendar day (required for upsert)
-- ---------------------------------------------------------------------------
-- If daily_entries.date is not unique yet, add a unique constraint:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'daily_entries_date_key'
  ) THEN
    ALTER TABLE daily_entries
      ADD CONSTRAINT daily_entries_date_key UNIQUE (date);
  END IF;
END $$;

-- Track when a check-in was last saved (optional but useful in UI)
ALTER TABLE daily_entries
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill updated_at for existing rows
UPDATE daily_entries
SET updated_at = COALESCE(updated_at, NOW())
WHERE updated_at IS NULL;

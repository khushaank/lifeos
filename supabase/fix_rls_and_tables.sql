-- LifeOS: run once in Supabase SQL Editor
-- Fixes RLS errors (42501) and creates missing tables

-- ---------------------------------------------------------------------------
-- Focus timer
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

CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  planned_minutes INTEGER NOT NULL,
  actual_seconds INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE focus_sessions DISABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Life experiments (90-day challenges)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS life_experiments (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  track_type TEXT NOT NULL,
  daily_prompt TEXT NOT NULL,
  started_at DATE NOT NULL,
  ends_at DATE NOT NULL,
  notify_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  notify_hour SMALLINT NOT NULL DEFAULT 20 CHECK (notify_hour >= 0 AND notify_hour <= 23),
  responses JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_life_experiments_ends
  ON life_experiments (ends_at DESC);

ALTER TABLE life_experiments DISABLE ROW LEVEL SECURITY;

-- Life Experiments (90-day challenges) for LifeOS
-- Run in Supabase SQL Editor

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

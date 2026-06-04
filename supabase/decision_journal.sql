-- Decision Journal for LifeOS
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS decision_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  situation TEXT,
  options_considered TEXT,
  decision_made TEXT NOT NULL,
  reasoning TEXT,
  expected_outcome TEXT,
  actual_outcome TEXT,
  confidence SMALLINT CHECK (confidence >= 1 AND confidence <= 10),
  outcome_rating SMALLINT CHECK (outcome_rating IS NULL OR (outcome_rating >= 1 AND outcome_rating <= 10)),
  tags TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decision_journal_date
  ON decision_journal (decision_date DESC);

CREATE INDEX IF NOT EXISTS idx_decision_journal_created
  ON decision_journal (created_at DESC);

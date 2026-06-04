-- LifeOS features 18–21: Missed Opportunities, Movies, supporting indexes
-- Run in Supabase SQL Editor

-- 18. Missed Opportunity Log
CREATE TABLE IF NOT EXISTS missed_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  description TEXT,
  why_missed TEXT,
  lesson_learned TEXT,
  regret_level SMALLINT CHECK (regret_level >= 1 AND regret_level <= 10),
  tags TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_missed_opportunities_date
  ON missed_opportunities (opportunity_date DESC);

-- 19. Movies watched + rating
CREATE TABLE IF NOT EXISTS movie_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watched_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movie_log_rating
  ON movie_log (rating DESC, watched_date DESC);

CREATE INDEX IF NOT EXISTS idx_movie_log_watched
  ON movie_log (watched_date DESC);

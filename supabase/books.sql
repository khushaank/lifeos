-- LifeOS: Books table and reading_logs linking
-- Run in Supabase SQL Editor (Dashboard -> SQL -> New query)

CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT,
  total_pages INTEGER NOT NULL DEFAULT 100 CHECK (total_pages > 0),
  current_page INTEGER NOT NULL DEFAULT 0 CHECK (current_page >= 0),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disable Row Level Security (RLS) as done for other tables in local development
ALTER TABLE books DISABLE ROW LEVEL SECURITY;

-- Index for searching books database
CREATE INDEX IF NOT EXISTS idx_books_title_author ON books (title, author);

-- Alter reading_logs to store the reference to the books table
ALTER TABLE reading_logs ADD COLUMN IF NOT EXISTS book_id UUID REFERENCES books(id) ON DELETE SET NULL;

-- Image support: book covers (base64 data URL) and workout selfies
ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS selfie_url TEXT;

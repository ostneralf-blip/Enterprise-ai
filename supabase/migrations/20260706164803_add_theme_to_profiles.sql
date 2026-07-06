ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'book'
  CHECK (theme IN ('book', 'teal', 'indigo', 'dark'));

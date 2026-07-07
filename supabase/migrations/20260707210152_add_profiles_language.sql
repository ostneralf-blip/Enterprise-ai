-- D2: Sprach-Persistenz — profiles.language Spalte
-- Cookie dient als Fallback für nicht-eingeloggte Nutzer
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'de'
  CHECK (language IN ('de', 'en'));

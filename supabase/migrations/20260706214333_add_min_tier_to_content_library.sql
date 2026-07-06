-- Issue #81: min_tier-Feld für Tier-Gating von Wissens-Layer-Inhalten
-- Default 'free' → alle bestehenden Inhalte bleiben sichtbar
-- Admin kann einzelne Einträge nachträglich auf 'pro' stellen

ALTER TABLE public.content_library
  ADD COLUMN IF NOT EXISTS min_tier TEXT NOT NULL DEFAULT 'free';

ALTER TABLE public.content_library
  ADD CONSTRAINT content_library_min_tier_check
  CHECK (min_tier IN ('free', 'pro', 'enterprise'));

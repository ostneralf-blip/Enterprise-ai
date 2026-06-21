-- Migration 003: Admin User-Management
-- is_banned + feature_flags auf profiles

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_flags JSONB NOT NULL DEFAULT '{}';

-- Index für Admin-Queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON public.profiles(is_banned);
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON public.profiles(tier);

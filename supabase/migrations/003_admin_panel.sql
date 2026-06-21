-- ═══════════════════════════════════════════════════════════════════════════
-- AI NAVIGATOR — Admin Panel Stufe A
-- Migration: 003_admin_panel
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── IS_ADMIN FLAG ───────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- ─── ADMIN HELPER FUNCTION ───────────────────────────────────────────────────
-- SECURITY DEFINER so RLS policies can call it without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS BOOLEAN
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

-- ─── CONTENT LIBRARY TABLE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.content_library (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module      TEXT NOT NULL,
  category    TEXT NOT NULL,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  source      TEXT,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER content_library_updated_at
  BEFORE UPDATE ON public.content_library
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "admin_all" ON public.content_library
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Authenticated users can read
CREATE POLICY "authenticated_read" ON public.content_library
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════════════════════
-- AI NAVIGATOR — Initial Schema
-- Migration: 001_initial_schema
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── EXTENSIONS ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS / PROFILES ───────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT NOT NULL,
  full_name           TEXT,
  company             TEXT,
  role                TEXT,
  tier                TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  stripe_customer_id  TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  subscription_period_end TIMESTAMPTZ,
  archetype           TEXT CHECK (archetype IN ('starter', 'scaler', 'transformer')),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Trigger: Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── ASSESSMENT SESSIONS ─────────────────────────────────────────────────────
CREATE TABLE public.assessment_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'quick' CHECK (type IN ('quick', 'deep')),
  archetype   TEXT CHECK (archetype IN ('starter', 'scaler', 'transformer')),
  total_score NUMERIC(3,2),
  dim_scores  JSONB DEFAULT '{}',
  answers     JSONB DEFAULT '{}',
  completed   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assessment_own" ON public.assessment_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER assessment_updated_at
  BEFORE UPDATE ON public.assessment_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── USE CASE PORTFOLIOS ─────────────────────────────────────────────────────
CREATE TABLE public.uc_portfolios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Mein Portfolio',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.uc_portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portfolios_own" ON public.uc_portfolios
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.use_cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id    UUID NOT NULL REFERENCES public.uc_portfolios(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  domain          TEXT,
  description     TEXT,
  scores          JSONB NOT NULL DEFAULT '{}',
  weighted_score  NUMERIC(3,2),
  quadrant        TEXT CHECK (quadrant IN ('quick_win', 'strategic_bet', 'low_hanging_fruit', 'avoid')),
  archetype       TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.use_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "use_cases_own" ON public.use_cases
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM public.uc_portfolios WHERE id = portfolio_id)
  );

-- ─── CANVAS ──────────────────────────────────────────────────────────────────
CREATE TABLE public.canvases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Neuer Use Case',
  archetype   TEXT CHECK (archetype IN ('starter', 'scaler', 'transformer')),
  data        JSONB NOT NULL DEFAULT '{
    "problem": "",
    "solution": "",
    "data_sources": "",
    "stakeholders": "",
    "kpis": "",
    "risks": "",
    "architecture": "",
    "next_steps": ""
  }',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.canvases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "canvases_own" ON public.canvases
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER canvases_updated_at
  BEFORE UPDATE ON public.canvases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── ROADMAPS ────────────────────────────────────────────────────────────────
CREATE TABLE public.roadmaps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Meine AI-Roadmap',
  archetype   TEXT CHECK (archetype IN ('starter', 'scaler', 'transformer')),
  phases      JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roadmaps_own" ON public.roadmaps
  FOR ALL USING (auth.uid() = user_id);

-- ─── GOVERNANCE SESSIONS ─────────────────────────────────────────────────────
CREATE TABLE public.governance_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  use_case_name TEXT,
  answers       JSONB NOT NULL DEFAULT '{}',
  result        TEXT CHECK (result IN ('approve', 'stop_dsgvo', 'stop_risk', 'improve')),
  protocol      JSONB DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.governance_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "governance_own" ON public.governance_sessions
  FOR ALL USING (auth.uid() = user_id);

-- ─── COMPLIANCE CHECKS ───────────────────────────────────────────────────────
CREATE TABLE public.compliance_checks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  regulation      TEXT NOT NULL, -- 'eu_ai_act' | 'dsgvo' | 'internal'
  check_type      TEXT NOT NULL,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'compliant', 'non_compliant', 'partial')),
  notes           TEXT,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.compliance_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compliance_own" ON public.compliance_checks
  FOR ALL USING (auth.uid() = user_id);

-- ─── ARCHITECTURE RESULTS ────────────────────────────────────────────────────
CREATE TABLE public.architectures (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Meine AI-Architektur',
  wizard_data JSONB NOT NULL DEFAULT '{}',
  result      JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.architectures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "architectures_own" ON public.architectures
  FOR ALL USING (auth.uid() = user_id);

-- ─── RESULT VERSIONS (alle Module) ───────────────────────────────────────────
CREATE TABLE public.result_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module      TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  version_no  INTEGER NOT NULL,
  data        JSONB NOT NULL,
  label       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (entity_id, version_no)
);

ALTER TABLE public.result_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "versions_own" ON public.result_versions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_versions_entity ON public.result_versions(entity_id, version_no DESC);

-- ─── SHARE LINKS ─────────────────────────────────────────────────────────────
CREATE TABLE public.share_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module        TEXT NOT NULL,
  entity_id     UUID NOT NULL,
  token         TEXT NOT NULL UNIQUE DEFAULT replace(replace(replace(encode(gen_random_bytes(24), 'base64'), '+', '-'), '/', '_'), '=', ''),
  expires_at    TIMESTAMPTZ,
  password_hash TEXT,
  view_count    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "share_own" ON public.share_links
  FOR ALL USING (auth.uid() = user_id);
-- Public read via token (for share page — no auth needed)
CREATE POLICY "share_public_read" ON public.share_links
  FOR SELECT USING (
    expires_at IS NULL OR expires_at > now()
  );

-- ─── FEEDBACK ────────────────────────────────────────────────────────────────
CREATE TABLE public.feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  module      TEXT NOT NULL,
  sentiment   TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative')),
  comment     TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedback_insert" ON public.feedback
  FOR INSERT WITH CHECK (true); -- Jeder kann Feedback geben
CREATE POLICY "feedback_read_own" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

-- ─── SUBSCRIPTIONS (Stripe-Sync) ─────────────────────────────────────────────
CREATE TABLE public.subscriptions (
  id                  TEXT PRIMARY KEY, -- Stripe Subscription ID
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status              TEXT NOT NULL,
  price_id            TEXT,
  current_period_end  TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);


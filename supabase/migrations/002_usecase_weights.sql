-- ═══════════════════════════════════════════════════════════════════════════
-- AI NAVIGATOR — Use-Case Weights & missing triggers
-- Migration: 002_usecase_weights
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── WEIGHTS COLUMN ──────────────────────────────────────────────────────────
-- User-konfigurierbare Gewichte pro Portfolio; Standard aus Sprint-2-Design
ALTER TABLE public.uc_portfolios
  ADD COLUMN IF NOT EXISTS weights JSONB NOT NULL DEFAULT
    '{"value":0.30,"feasibility":0.25,"data_readiness":0.20,"risk":0.15,"speed":0.10}';

-- ─── UPDATED_AT TRIGGERS (in 001 für diese Tabellen vergessen) ───────────────
CREATE TRIGGER uc_portfolios_updated_at
  BEFORE UPDATE ON public.uc_portfolios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER use_cases_updated_at
  BEFORE UPDATE ON public.use_cases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

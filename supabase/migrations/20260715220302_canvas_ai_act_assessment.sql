-- #187: EU AI Act Art.-6-Bewertung am Canvas persistieren
-- ai_act_assessment JSONB: { domain, answers, classification, documentationText, assessedAt }
ALTER TABLE public.canvases
  ADD COLUMN IF NOT EXISTS ai_act_assessment jsonb;
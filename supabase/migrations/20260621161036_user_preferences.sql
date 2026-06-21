-- user_preferences: speichert primäre Ergebnis-IDs pro Nutzer für den Architektur-Generator
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_assessment_id   UUID REFERENCES public.assessment_sessions(id)  ON DELETE SET NULL,
  primary_governance_id   UUID REFERENCES public.governance_sessions(id)  ON DELETE SET NULL,
  primary_roadmap_id      UUID REFERENCES public.roadmaps(id)             ON DELETE SET NULL,
  primary_architecture_id UUID REFERENCES public.architectures(id)        ON DELETE SET NULL,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "preferences_own" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

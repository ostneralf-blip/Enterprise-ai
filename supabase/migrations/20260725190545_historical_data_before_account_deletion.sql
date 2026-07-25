-- #261: Historische (anonyme) Datenhaltung vor Account-Löschung.
--
-- Beim DSGVO-Löschen eines Accounts werden die INHALTLICHEN Daten (Use Cases,
-- Architekturen) in diese Tabellen kopiert, BEVOR der Account kaskadierend
-- gelöscht wird. Zweck: AI-Learnings + aggregierte Auswertungen.
--
-- Entscheidung Daniel (25.07.2026, via AskUserQuestion): Es wird "alles außer
-- user_id" behalten — der nutzergeschriebene Freitext (name/description/title/
-- wizard_data/ai_narrative) bleibt bewusst erhalten. Das damit verbundene
-- Re-Identifikationsrisiko (Freitext kann Firmen-/Projektnamen enthalten) wurde
-- ausdrücklich akzeptiert. Rechtliche Bewertung (DSGVO Art. 17 vs. Art. 89
-- Statistik-/Analysezweck) bleibt bei Daniel.
--
-- Sicherungen auf DB-Ebene:
--  * KEIN user_id / portfolio_id / canvas_id — kein direkter Nutzerbezug.
--  * Frische UUID pro Zeile (kein Übertragen der Original-id) — keine
--    Rückverknüpfung zu Share-Links o. Ä.
--  * RLS aktiv, NUR Admins (public.is_admin()) dürfen lesen; kein INSERT/UPDATE/
--    DELETE für Nutzer. Geschrieben wird ausschließlich über die Service-Role
--    (createAdminClient) im Lösch-Endpoint, die RLS umgeht.

CREATE TABLE public.historical_use_cases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT,
  domain              TEXT,
  description         TEXT,
  scores              JSONB,
  weighted_score      NUMERIC(3,2),
  quadrant            TEXT,
  archetype           TEXT,
  original_created_at TIMESTAMPTZ,
  archived_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.historical_architectures (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT,
  wizard_data         JSONB,
  result              JSONB,
  ai_narrative        JSONB,
  narrative_locale    TEXT,
  original_created_at TIMESTAMPTZ,
  archived_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.historical_use_cases     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_architectures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historical_use_cases_admin_read" ON public.historical_use_cases
  FOR SELECT USING (public.is_admin());
CREATE POLICY "historical_architectures_admin_read" ON public.historical_architectures
  FOR SELECT USING (public.is_admin());

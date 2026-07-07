CREATE TABLE IF NOT EXISTS public.compliance_source_drafts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url       TEXT        NOT NULL,
  source_label     TEXT        NOT NULL,
  summary          TEXT        NOT NULL,
  status_estimate  TEXT        NOT NULL
    CONSTRAINT compliance_source_drafts_estimate_check
    CHECK (status_estimate IN ('final', 'entwurf', 'unklar')),
  review_status    TEXT        NOT NULL DEFAULT 'pending_review'
    CONSTRAINT compliance_source_drafts_review_check
    CHECK (review_status IN ('pending_review', 'beruecksichtigt', 'ignoriert')),
  scanned_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at      TIMESTAMPTZ,
  reviewed_by      UUID        REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_compliance_drafts_review_status
  ON public.compliance_source_drafts (review_status, scanned_at DESC);

ALTER TABLE public.compliance_source_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all" ON public.compliance_source_drafts
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

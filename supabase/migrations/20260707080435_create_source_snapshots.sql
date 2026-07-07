CREATE TABLE IF NOT EXISTS public.source_snapshots (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  url           TEXT        NOT NULL,
  label         TEXT        NOT NULL,
  content_hash  TEXT        NOT NULL,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_source_snapshots_url_fetched
  ON public.source_snapshots (url, fetched_at DESC);

ALTER TABLE public.source_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all" ON public.source_snapshots
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

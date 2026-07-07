-- Idempotenz-Tabelle für Stripe Webhooks
-- Verhindert doppelte Verarbeitung bei Stripe-Retry-Events.
-- event_id ist die Stripe Event-ID (z.B. evt_1ABC...) — global eindeutig.
CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  event_id     TEXT        PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;

-- Webhook-Handler läuft mit Service-Role-Key (Adminzugriff) — kein User-Policy nötig.
-- is_admin() als Policy verhindert direkte Client-Zugriffe.
CREATE POLICY "admin_all" ON public.processed_stripe_events
  FOR ALL USING (public.is_admin());

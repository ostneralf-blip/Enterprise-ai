-- Fix: 2 Vorschläge hingen dauerhaft bei enrichment_status='pending' fest, weil
-- der auslösende Serverless-Aufruf ohne after()-Bindung terminiert wurde, bevor
-- der Bedrock-Call zurückkam (siehe Fix in /api/analysis/architecture/[id]/route.ts,
-- 18.07.2026). Zurücksetzen auf 'none', damit sie beim nächsten Durchlauf (neue
-- Trigger-Logik: enrichment_status statt reiner Namens-Neuheit) erneut versucht werden.
update catalog_suggestions set enrichment_status = 'none'
  where enrichment_status = 'pending';

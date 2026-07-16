-- #197: ai_narrative JSONB → audience-keyed { exec?, architect?, compliance? }
-- Wraps existing flat records (those with top-level "summary" key) under "architect".
-- Already-keyed records (with "architect"/"exec"/"compliance" at top level) are untouched.
UPDATE architectures
SET ai_narrative = jsonb_build_object('architect', ai_narrative)
WHERE ai_narrative IS NOT NULL
  AND (ai_narrative ? 'summary');

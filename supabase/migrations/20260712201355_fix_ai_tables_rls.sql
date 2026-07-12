-- Fix: ai_prompt_cache und ai_usage_log hatten offene Policies ohne TO-Klausel.
-- Ohne TO service_role gilt using(true) für ALLE Rollen inkl. anon/authenticated:
--   ai_prompt_cache → Cross-User-Leak von KI-Antworten + Cache-Poisoning möglich
--   ai_usage_log    → User könnte eigenes Tages-Limit manipulieren
-- Service Role umgeht RLS ohnehin — es braucht schlicht KEINE Policy für andere Rollen.
-- price_config + promotions behalten ihre SELECT-Policies (öffentliche Preisdaten, gewollt).

-- ai_prompt_cache: offene Policy entfernen
drop policy if exists "Service Role darf Cache lesen und schreiben" on ai_prompt_cache;
revoke all on ai_prompt_cache from anon, authenticated;

-- ai_usage_log: offene Policy entfernen
drop policy if exists "Service Role darf Usage upserten" on ai_usage_log;
revoke all on ai_usage_log from anon, authenticated;

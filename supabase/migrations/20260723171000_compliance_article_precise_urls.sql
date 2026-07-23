-- Artikelgenaue Quell-URLs (Wunsch Daniel 23.07.2026): pro Checklistenpunkt eine
-- URL zum EINZELNEN Artikel statt zum Gesamtdokument. Zwei Effekte:
--   1) Nutzer klickt „Quelle" im Compliance-Modul → landet exakt beim Artikel.
--   2) Der Deep-Check kann den Einzelartikel abrufen + verifizieren (eur-lex lieferte
--      das Gesamtgesetz/eine 202-Leerseite, wodurch das LLM Korrekturen erfand).
--
-- Belegte, fetchbare Artikel-Quellen (alle getestet → HTTP 200):
--   EU AI Act → artificialintelligenceact.eu/article/<N>/
--   DSGVO     → dsgvo-gesetz.de/art-<N>-dsgvo/  (behebt zugleich 11 leere DSGVO-URLs)
-- BDSG + LkSG haben bereits artikelgenaue gesetze-im-internet-URLs (unverändert).
-- ISO 27001/42001 (iso.org, kostenpflichtig) und BAIT (bafin.de) haben KEINE freie
-- Einzelartikel-URL → bewusst unverändert, keine erfundene Quelle.

update public.compliance_checklist_items i
set source_url = 'https://artificialintelligenceact.eu/article/' || (regexp_match(i.article, '\d+'))[1] || '/'
from public.compliance_regulations r
where i.regulation_id = r.id and r.slug = 'eu_ai_act' and i.article ~ '\d';

update public.compliance_checklist_items i
set source_url = 'https://dsgvo-gesetz.de/art-' || (regexp_match(i.article, '\d+'))[1] || '-dsgvo/'
from public.compliance_regulations r
where i.regulation_id = r.id and r.slug = 'dsgvo' and i.article ~ '\d';

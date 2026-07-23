-- Artikelgenaue Quell-URLs für NIS2 (Ergänzung zu 20260723171000). eur-lex liefert
-- die Richtlinie als 202-Leerseite/Gesamtdokument; nis-2-directive.com hat je Artikel
-- eine eigene, fetchbare Seite (Art. 20/21/23 getestet → HTTP 200).

update public.compliance_checklist_items i
set source_url = 'https://www.nis-2-directive.com/NIS_2_Directive_Article_' || (regexp_match(i.article, '\d+'))[1] || '.html'
from public.compliance_regulations r
where i.regulation_id = r.id and r.slug = 'nis2' and i.article ~ '\d';

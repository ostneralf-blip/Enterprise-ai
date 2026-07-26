# Leitfaden-Content-Pipeline (#220)

_Workflow für die öffentlichen Guides im Leitfaden-Hub (`/leitfaden`, `/en/leitfaden`).
Stand: 26.07.2026._

## Grundprinzip

Die öffentliche Inhaltsfläche entsteht aus **allgemeinem Hintergrundwissen** des Buchs
„Enterprise AI Best-Practice-Leitfaden" (eigene Rechte, Daniel). **Keine Produkt-Interna,
keine Tool-Logik.** Tools bleiben hinter Login — die Guides sind SEO-/GEO-Einstieg mit
genau einem Tool-CTA je Guide.

Quelle & Format-Entscheidung: `docs/design/seo-geo-konzept.md` (Stufe 2, verbindlich).

## Speicherort — kein CMS, kein MDX

Guides liegen als **typisierte, zweisprachige Datenobjekte** in
`src/config/leitfaden-data.ts` (nicht als MDX/Markdown — bewusste Abweichung von der
ursprünglichen Issue-Skizze). Vorteile: Versionierung über Git, Typsicherheit
(`Guide`-Interface erzwingt Answer-first-Struktur, FAQ, CTA-Band), kein zusätzliches
System. Jedes Textfeld ist ein `Bi`-Objekt `{ de, en }`.

Rendering:
- Shell: `src/app/[locale]/leitfaden/layout.tsx` (Public-Reading-Shell, getrennt von der App-Shell — Header via `PublicNav`, Footer mit Impressum/Datenschutz).
- Hub: `src/app/[locale]/leitfaden/page.tsx` (Kapitel-Karten + Glossar).
- Guide-Template: `src/app/[locale]/leitfaden/[slug]/page.tsx` (GEO-Format, JSON-LD).

## Pipeline: Buchkapitel → Publish

```
1. Rohtext   Daniel liefert das/die relevante(n) Buchkapitel (Format egal).
              └─ Mapping Kapitel → Guide siehe #220-Kommentar (Content-Mapping-Tabelle).

2. KI-Aufbereitung DE   Kapitel → GEO-Format:
              • H1 als Frage
              • Answer-first-Absatz (40–60 Wörter) unter JEDER H2
              • FAQ-Block (3–5 Fragen), Fakten-/Stat-Kacheln
              • genau EIN Tool-CTA (Ziel aus GUIDE_PRIMARY_TOOL)
              └─ Humanizer-Pass: KI-Schreibmuster raus. Vorwort-Ton des Buchs
                 („kein Konfigurationshandbuch … ehrlich beschreiben") als Referenz
                 — der Ton ist bereits stark, NICHT glattbügeln.

3. Fact-Check DE   Zahlen, Marktfakten, Rechts-/Fristenstand je Guide prüfen
              (ändert sich laufend — z. B. EU-AI-Act-Fristen, Digital-Omnibus).
              Quelle-Belege im Zweifel im PR-Text vermerken.

4. Review DE   Daniel liest gegen (fachlich + Ton).

5. EN-Übersetzung   DE → EN, gleiche Struktur; idiomatische Übersetzung,
              keine 1:1-Wort-für-Wort-Fassung. Rechts-/Norm-Verweise beibehalten.

6. Review EN   Daniel/Gegenprüfung.

7. Publish   Guide-Objekt in GUIDES (leitfaden-data.ts) eintragen, ggf. in
              HUB_CATEGORIES / HUB_GLOSSARY verlinken. GUIDES_REVIEWED_AT
              aktualisieren (steuert das „Zuletzt geprüft"-Datum je Guide).
              Deploy → Sitemap nimmt die Seite automatisch auf (#219).
```

## Checkliste je Guide vor Publish

- [ ] H1 ist eine Frage; unter jeder H2 ein Answer-first-Absatz (40–60 Wörter)
- [ ] FAQ-Block vorhanden (füllt FAQPage-Schema)
- [ ] genau EIN Tool-CTA (kein zweiter Ausgang)
- [ ] DE **und** EN vollständig (jedes `Bi`-Feld gesetzt)
- [ ] Zahlen/Fristen fact-gecheckt, Stand im PR vermerkt
- [ ] Humanizer-Pass gelaufen (kein KI-Sound)
- [ ] `GUIDES_REVIEWED_AT` aktualisiert

## Telemetrie

Cookieless (wie App): `guide_viewed` (beim Öffnen) + `guide_cta` (Klick auf den
Tool-CTA) via `src/components/shared/GuideAnalytics.tsx`. Events in der
`TrackingEvent`-Union.

## Was NICHT hierher gehört

- Produkt-Feature-Details, Preis-/Tier-Aussagen (die gehören auf `/preise`, Quelle
  `config/tiers.ts` — siehe #220-Kommentar zur fehlerhaften Free/Pro-FAQ im alten Mockup).
- Interne Tool-Mechanik, Scoring-Formeln, DB-Struktur.

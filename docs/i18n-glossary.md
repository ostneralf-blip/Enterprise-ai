# i18n Glossar — AI Navigator DE↔EN

Verbindliche Terminologie für alle Übersetzungsarbeiten (P1–P6).
Beim Übersetzen neuer Strings muss diese Datei konsultiert werden.
Alle Begriffe in `messages/en.json` sind gegen dieses Glossar geprüft (Stand: P6, Juli 2026).

## Kernbegriffe

| Deutsch | English | Hinweis |
|---|---|---|
| Geführter Pfad | Guided Path | Nav-Label und Dashboard-Sequenz |
| Readiness-Assessment | Readiness Assessment | Kein Bindestrich im EN |
| Archetyp | Archetype | AI Starter / Scaler / Transformer bleiben unverändert |
| DSGVO | GDPR | Immer ausschreiben oder mit Klammern: "GDPR (EU)" |
| Reifegrad | Maturity Level | Zweiwörtig im EN |
| Gewichte / Gewichtung | Weights / Weighting | Im Use-Case-Scoring |
| Ergebnisse | Results | "Gespeicherte Ergebnisse" → "Saved Results" |
| Wissensbasis | Knowledge Base | GuidanceDrawer-Label |
| Handlungsempfehlungen | Recommendations | Nicht "Recommended Actions" |
| Prüfprotokoll | Review Protocol | Governance-Check-Protokoll |
| Risikoklasse | Risk Class | EU AI Act Kontext |
| Phasen-Übersicht | Phase Overview | Roadmap-Kontext |
| „Sie"-Form (formell) | Neutrales „you" | Kein „you all", kein „one" |
| Sofort umsetzbar | Ready to pilot | Use-Case-Quadrant-Kontext |
| Budgetieren | Budget for | Quadrant-Empfehlung |
| Zurückstellen | Defer | Quadrant-Empfehlung |
| Aufbauphase | Build Phase | Ampel-Status |
| Bereit zur Skalierung | Ready to Scale | Ampel-Status |
| Kritischer Handlungsbedarf | Critical Action Required | Ampel-Status |
| Strategische Empfehlungen | Strategic Recommendations | ES-PDF Seitenüberschrift |
| Architektur-Schichten | Architecture Layers | PDF-Kontext |
| Compliance-Überblick | Compliance Overview | ES-PDF-Seite 9 |
| Prüfkriterium | Criterion | Tabellen-Spalte |

## Kategorien (GuidanceDrawer — bleiben zweisprachig / technisch)

| Intern | Anzeige DE | Anzeige EN |
|---|---|---|
| `definition` | Definition | Definition |
| `best_practice` | Best Practice | Best Practice |
| `anti_pattern` | Anti-Pattern | Anti-Pattern |
| `policy_template` | Policy-Template | Policy Template |
| `checkliste` | Checkliste | Checklist |
| `hinweis` | Hinweis | Note |

> **Hinweis:** Die Kategorien-Labels in `GuidanceDrawer.tsx` sind bisher zweisprachig/technisch gehalten
> (EN-Kontext: "Best Practice", "Anti-Pattern" sind international verständlich).
> Vollständige Lokalisierung der Kategorie-Labels ist P6-Folgeaufgabe (geringes Priorität).

## Nicht übersetzen

- Impressum, Datenschutz, AGB — deutsches Recht, Seiten bleiben DE
- EU AI Act Artikel-Nummern (Art. 6, Art. 22 etc.) — bleiben wie sie sind
- Produktnamen: AI Navigator, Enterprise AI Navigator, Stripe, Supabase, PostHog
- Schaltflächen-Labels die internationale Standards sind: "PDF", "CSV", "JSON"

## Review-Pflicht (Daniel)

Folgende Namespaces enthalten Fachsprache mit Produktqualitäts-Relevanz
und müssen von Daniel vor Go-Live reviewt werden:

1. **Assessment-Fragen** — aus `src/config/assessment-data.ts` (LocaleString-Felder)
2. **Compliance-Inhalte** — aus `src/config/compliance-data.ts` (LocaleString-Felder)
3. **Governance-Fragen** — aus `src/config/governance-data.ts` (LocaleString-Felder)
4. **Content Library** — EN-Blöcke in `content_library`-Tabelle (Admin-Panel)

## Layout-QA Checkliste (375px Pflicht)

Nach jeder Phase prüfen (Chrome DevTools → Responsive → 375px):

- [ ] Keine abgeschnittenen Button-Texte ("Knowledge Base" ist länger als "Wissensbasis")
- [ ] GuidanceDrawer-Header bei EN nicht overflow
- [ ] Landing Page Hero-Text umbricht sauber
- [ ] Dashboard KPI-Karten überlaufen nicht bei EN-Labels
- [ ] Sidebar-Navigation: alle EN-Labels ohne Abschneidung

## Smoke-Test Locale-Wechsel

Manuell nach jedem Deployment:
1. DE → `https://enterprise-ai.biz/` — prüfe: Sprache = Deutsch, `<html lang="de">`
2. EN → `https://enterprise-ai.biz/en` — prüfe: Sprache = Englisch, `<html lang="en">`
3. Sprachwechsel via Switcher: DE→EN und EN→DE, je 1× Dashboard + 1× Landing
4. Kein hardcodierter DE-String im EN-Modus sichtbar (Stichprobe: Sidebar, GuidanceDrawer, Dashboard)
5. hreflang im `<head>` vorhanden: `<link rel="alternate" hreflang="de" ...>`
6. Sitemap unter `/sitemap.xml` erreichbar und enthält `/en/` URLs

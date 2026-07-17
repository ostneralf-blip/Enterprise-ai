# SEO/GEO-Konzept V1 — enterprise-ai.biz

> Verbindlichkeitsregel wie übrige Specs (1:1, Abweichungen nur nach Rücksprache).
> Stand 16.07.2026. Leitentscheidungen Daniel: (a) DACH primär, EN für den
> europäischen Markt gleich mitgeführt; (b) Produkt-Tools bleiben hinter Login —
> öffentliche Inhaltsfläche entsteht aus Buch-Content („Enterprise AI Leitfaden",
> Daniel Ostner, eigene Rechte); (c) Produktion: Daniel + KI, kein externes Budget.

## Lage 2026 (recherchiert)
AI Overviews bei ~82 % der B2B-Tech-Queries, −30–50 % CTR auf Info-Suchen; über die
Hälfte der B2B-Recherchen startet im KI-Chat. Konsequenz: Nicht „ranken", sondern
**zitiert werden** (GEO/AEO) + **BOFU-Seiten** mit Produktbezug + **Original-Daten**.
Info-Blog-Volumen ohne Eigenperspektive ist verlorene Mühe.

## Säule 1 — Technik-Basis (Hygiene, einmalig)
robots.txt (aktuell LEER!) mit Sitemap-Referenz + App-Routen-Disallow · Sitemap
automatisch aus öffentlichen Routen · Next.js Metadata je Route (Title-Muster
„{Thema} — AI Navigator", Description, Canonical) · **hreflang de/en + x-default** ·
OG-Images (Template mit Titel) · Schema.org: `Organization`, `SoftwareApplication`
(Landing), `FAQPage`/`Article`/`BreadcrumbList` (Hub), `Person` (Autor Daniel Ostner
— Entitäts-Aufbau: Buch-Autor = E-E-A-T-Signal) · Core Web Vitals der öffentlichen
Seiten · Search Console + Bing Webmaster (IndexNow) einrichten.

## Säule 2 — Öffentlicher Leitfaden-Hub (aus dem Buch)
`/de/leitfaden` + `/en/guide` — ohne Login, eigenes helles, ruhiges Lese-Design
(Public-Shell getrennt von der App-Shell; Token aus #201, Standards aus #205).

- **Struktur:** Kapitel-basierte Guides (allgemeines Hintergrundwissen aus dem Buch;
  KEINE Produkt-Interna): AI Readiness, Use-Case-Priorisierung, AI Governance,
  EU AI Act Grundlagen + Fristen (Digital Omnibus!), Referenzarchitekturen, RASIC,
  MLOps-Grundlagen, Glossar (aus Content-Library-Begriffen).
- **GEO-Format je Guide:** H1-Frage · Answer-first-Absatz (40–60 Wörter direkte
  Antwort) direkt unter jeder H2 · FAQ-Block am Ende (+FAQPage-Schema) · Autor-Box
  (Person-Schema, Buch-Referenz) · „Zuletzt geprüft"-Datum · ein CTA zum passenden
  Tool (Login) — nicht mehr.
- **Produktions-Workflow Daniel+KI:** Buchkapitel → KI-Aufbereitung ins GEO-Format
  (DE) → Daniel-Review → KI-Übersetzung EN → Review → Publish. Ziel-Kadenz: 1–2
  Guides/Woche; Start-Set 8 Guides vor Launch des Hubs.
- **Buch als Objekt:** eigene Seite („Das Buch zum Produkt") — Book-Schema,
  bidirektionale Verweise Buch↔Produkt stärken die Entität.

## Säule 3 — BOFU-Tool-Seiten (7)
Je Tool eine öffentliche Seite (`/de/tools/architektur-generator` …): Problem →
Screenshot/Kurzdemo → was das Tool liefert → Free/Pro → CTA. Keywords mit
Kaufabsicht („AI Readiness Assessment kostenlos", „KI-Referenzarchitektur SAP",
„AI Governance Check DSGVO", „EU AI Act Compliance Tool"). Diese Seiten dürfen
verkaufen — der Hub nicht.

## Säule 4 — GEO/Autorität (laufend, Daniel+KI)
- **Original-Daten-Reports** (quartalsweise, anonymisierte Telemetrie): „Komponenten-
  Wahl in Enterprise-KI-Architekturen", „Anteil Art.-6(3)-Ausnahmen" — zitierfähige
  Erstquelle, Kern des GEO-Plans.
- llms.txt mit Hub-Übersicht; Perplexity/ChatGPT-Zitierbarkeit beobachten (monatlich
  manuell prüfen: „Wie klassifiziere ich mein KI-System?" — werden wir genannt?).
- LinkedIn (Daniel, DE) als Distributions-Kanal je Guide; Einträge OMR Reviews /
  Capterra / G2 (B2B-KI-Recherche läuft dort).
- Vertrauens-Signale prominent: EU-Hosting · DSGVO · Cookieless — DACH-Differenzierer.

## Messung
Search Console (DE/EN getrennt) · Branded-Search-Volumen · Hub→Signup-Conversion ·
AI-Zitierungs-Log (manuell, monatlich) · PostHog-Events `guide_viewed`, `guide_cta`.

## Umsetzungs-Stufen
| Stufe | Inhalt | Issue |
|---|---|---|
| 1 | Technik-Basis komplett | #219 |
| 2 | Public-Shell + Leitfaden-Hub (Start-Set 8 Guides) | #220 |
| 3 | 7 BOFU-Tool-Seiten | #221 |
| 4 | Daten-Reports + llms.txt + Verzeichnisse | Folge-Issues nach Stufe 2 |

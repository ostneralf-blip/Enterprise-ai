# Unified Analysis — Verbindliches Konzept V1

> Verbindlichkeitsregel wie übrige Specs: 1:1-Umsetzung, Abweichungen nur nach
> Rücksprache mit Daniel. Stand 16.07.2026, beschlossen im Brainstorming.

## Problem

1. **Redundanz:** Jedes Modul hat eigene KI-Calls (canvas ai-enrich, architecture
   ai-narrative, künftig narrative je Sicht × 3, decision, roadmap …) — jeder Call
   schleppt denselben Kontext neu in den Prompt. Token-Verbrennung, träge UX.
2. **Konsistenz:** Ändert sich eine Komponente, rechnen deterministische Teile sofort
   neu (Validierung, Flags), aber KI-Texte bleiben still veraltet stehen — Compliance,
   RASIC und Narrativ passen nicht mehr zur Auswahl.

Ein einzelner „Alles"-Call ist NICHT die Lösung (Output-Truncation — maxTokens musste
bereits verdoppelt werden; Fehlerradius; bezahlte, nie angesehene Sektionen).

## Leitentscheidungen (Daniel, 16.07.2026)

- **Kein Auto-Refresh.** Veraltete KI-Ergebnisse werden sichtbar markiert; Refresh ist
  immer eine bewusste Nutzeraktion (Kontingent-Kontrolle beim Nutzer).
- **Cache-Transparenz:** Hit-Rate und Füllstand des KI-Caches müssen einsehbar sein
  (Admin).

## Architektur

### 1. Analyse-Kontext + Fingerprint
Zentrales Kontext-Objekt: aktive Komponenten (Namen + sources), Wizard-Antworten,
Canvas-Kern (relevante Felder), Assessment-/Governance-/Roadmap-Signale.
`contextHash = sha256(normalisierter Kontext)` — EINE Funktion (`lib/ai/context.ts`),
von allen Modulen konsumiert (Gate D sinngemäß: eine Quelle für „worauf basiert das?").

Jedes persistierte KI-Ergebnis speichert `based_on_hash`. UI-Regel: aktueller Hash ≠
gespeicherter Hash ⇒ Sektion erhält „veraltet"-Badge + Einzel-Refresh-Aktion.
Deterministische Kaskade (Validierung, Compliance-Flags, RASIC-Generator) läuft wie
bisher sofort — nur KI-Veredelung wird als stale markiert statt still falsch.

### 2. Ein Analyse-Endpoint mit Sektionen
`POST /api/analysis/{entity}` mit `sections: ['narrative_exec'|'narrative_architect'|
'narrative_compliance'|'rasic_suggestion'|'compliance_hints'|'decision'|'roadmap_hints']`.
Geteilter Kontext EINMAL im Prompt (stabiles Präfix), je Sektion ein kompakter
Auftrags-Block + eigenes Zod-Schema. Angefordert wird nur, was stale/gebraucht ist.
Bestehende Endpoints werden schrittweise auf den Endpoint umgezogen (Adapter), nicht
big-bang abgeschaltet.

### 3. Token-Hebel
- **Prompt-Caching (Anthropic/Bedrock):** stabiles Kontext-Präfix als gecachter Block
  (`cache_control` bzw. Bedrock promptCaching) — Folgesektionen zahlen überwiegend Output.
- **`ai_prompt_cache` mit contextHash** als Key-Bestandteil: identische Anfrage = 0 Token.
- Kontingent: 1 Analyse-Call = 1 Zähler (statt Topf je Modul); Free behält Teaser-Logik.

### 4. UI-Muster (Kommandozentrale = KI-Panel)
- Globaler Button „◆ Analysieren" im KI-Panel: zieht ALLE stale Sektionen in einem Call
- Stale-Badge je Sektion („veraltet — Auswahl geändert") mit Einzel-Refresh
- Provenienz-Zeile je Sektion: Modell · Provider · Zeitstempel · Cache-Hit · based_on_hash (kurz)

### 5. Cache-Transparenz (Admin)
Admin-Karte „KI-Cache": Hit-Rate (heute/7 Tage, aus ai_call-Telemetrie `cached`),
Einträge aktiv/abgelaufen, älteste/neueste, Größe (Byte-Schätzung), Top-Module nach
Hits; Aktion „Abgelaufene bereinigen". Kein Roh-Prompt-Einblick (Datenschutz) — nur
Metadaten.

## Beziehungen
- **#197 (Narrativ je Sicht) MUSS das Sektions-Schema vorwegnehmen** (ai_narrative als
  keyed JSONB = exakt die narrative_*-Sektionen) — sonst Doppelmigration. Hinweis in
  Sprint #206/WP4.
- Detection-Konzept: dieser Endpoint IST Pass 3 („Kontextanalyse nur fürs Delta").
- #158/#198-Panel-Umbau liefert den Ort für Kommandozentrale + Badges.

## Umsetzungs-Stufen
| Stufe | Inhalt | Issue |
|---|---|---|
| 1 | contextHash + based_on_hash + Stale-Badges (rein deterministisch, kein LLM-Change) | #209 |
| 2 | Unified Endpoint + Sektions-Schemata + Prompt-Caching + Umzug ai-narrative | #210 |
| 3 | Admin-Cache-Transparenz | #211 |
| 4 | Umzug übriger Calls (canvas enrich als Pass-3-Nutzer, roadmap, decision) | Folge-Sprint |

## Erfolgsmessung
`ai_call`-Telemetrie erweitert um `sections`, `cache_hit`, `prompt_cached_tokens` —
Ziel-Metriken: Cache-Hit-Rate ↑, Ø Input-Tokens/Analyse ↓, Anteil stale-angezeigter
Sektionen, die nie refresht werden (zeigt, wo KI-Veredelung verzichtbar ist).

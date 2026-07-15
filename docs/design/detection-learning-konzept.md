# Detection & Learning — Verbindliches Konzept V1

> **Verbindlichkeitsregel (wie architektur-generator-v2-spec):** Beauftragte Teile dieses
> Konzepts werden 1:1 umgesetzt. Abweichungen erfordern VORHER Rücksprache mit Daniel
> (Issue-Kommentar, Warten auf Freigabe). „Sinngemäß" gilt als nicht umgesetzt.

Stand: 15.07.2026 · Beschlossen im Brainstorming Daniel + Claude · Ersetzt konzeptionell
Teile von #188 (Prototyp PR #189 wird angepasst, siehe §7).

---

## 1. Ziel & Rationale

KI-Erkennung (Canvas-Kontextanalyse, Architektur-Prefill) soll so lernen und
persistieren, dass **auch Free-Nutzer** von guter Erkennung profitieren — und
Token-Kosten sinken, weil das LLM nur noch für das Delta gerufen wird, das die
lokale Erkennung nicht abdeckt. Kernprinzip: **teure KI-Ergebnisse werden zu
dauerhaftem, wiederverwendbarem Produktwissen.**

Live-Befund, der das Problem zeigt (Canvas „SAP Succcessfactor", 15.07.2026):
SAP nicht erkannt (Titel nicht in der Textbasis, kein Fuzzy, Singular/Plural),
OCR-Bedarf nicht erkannt (totes document-Signal, Winner-takes-all-Typ, keine
OCR-Komponenten im Katalog), AI-Act nur als „relevant"-Badge statt Klassifikation.
Root-Cause-Analyse: Issues #186/#187.

## 2. Leitentscheidungen (beschlossen 15.07.2026)

1. **Feld-Semantik als Prior:** Jeder Canvas-Block hat eine Bedeutung, die Kontext
   gibt — die Erkennung nutzt das Feld als Klassifikations-Prior (§3).
2. **Vorklassifikation vor Lernen:** Bevor ein Begriff gelernt wird, klassifiziert
   ein billiger LLM-Pass, WAS er ist (Produkt / Eigenname / Capability / Füllwort /
   mehrdeutig). Erst danach steht fest, auf welcher Lern-Stufe er verwertet werden
   darf. Der „Projekt Successfactor"-Fall (Projektname ≠ SAP-Produkt) wird so
   strukturell verhindert.
3. **Zwei-Zonen-Lernspeicher:** Client-eigene Mappings werden automatisch aktiv,
   aber nur im Client-Scope. Global wird nur kuratiert übernommen (Promotion-Queue
   mit Schwellen) — hält das Review-Volumen klein (Sorge Daniel) und schützt
   Client-Interna.
4. **Kein Auto-Approve für global** (Lehre aus #181). Füllwort-Blocks: Kandidaten
   wirken sofort als Soft-Block (werden nicht mehr vorgeschlagen), endgültig
   geblockt erst nach Admin-Bestätigung.
5. **Feld-Prior-Matrix lebt fix im Code** (testbar, ändert sich selten) — nicht
   admin-konfigurierbar. Synonyme/Blocklist bleiben admin-pflegbar.

## 3. Feld-Prior-Matrix

| Canvas-Feld | Erwartete Entities | Harvest? | Prior für |
|---|---|---|---|
| Titel | Produkt ODER Projektname (hohe Mehrdeutigkeit!) | ja, nur via Pass 1 | — |
| Problem | Prozess/Domäne, selten Produkte | ja, konservativ | Branche, Use-Case-Typ |
| AI-Lösung | Capabilities („auslesen" → OCR), Zielprodukte | ja | Capability, Use-Case-Typ |
| Datenquellen | **Produkte/Systeme (höchste Konfidenz)** — kurze Aufzählungen | ja, primär | Vendor/Produkt |
| Stakeholder | Rollen/Abteilungen | nein (keine Terme lernen) | Branche, **Anhang-III-Bereich (#187)** |
| KPIs | Metriken | **nein** (Füllwort-Quelle) | — |
| Risiken & Governance | Datenarten, Schutzbedarf | nein | Compliance (DSGVO/AI-Act) |
| Technische Architektur | Produkte/Technologien | ja, primär | Vendor/Produkt, Capability |
| Nächste Schritte | Aktionen | **nein** | — |

Wirkung: Ein unbekanntes Wort in *Datenquellen* ist ein starker Kandidat; dasselbe
Wort in *KPIs* wird gar nicht erst betrachtet. Viele Pass-1-Calls entfallen ersatzlos.

## 4. Die 4-Pass-Pipeline

### Pass 0 — Lokal (0 Token, Free, immer)
Deterministische Erkennung gegen: hartkodiertes Vokabular + Katalog-Aliases +
**aktive** Synonyme (global + client-eigen). Feldbewusst gemäß Matrix. Robustes
Matching (Fuzzy/Normalisierung) gemäß #186. Output: erkannte Signale + Liste
unbekannter Kandidaten-Terme (nicht bekannt, nicht geblockt, Feld mit Harvest-Prior).

### Pass 1 — Vorklassifikation (billig, haiku, batchbar)
**Trigger:** on-blur einer Canvas-Box (Signal „Eingabe beendet"), Nachzügler beim
Speichern. Nur wenn: Feldtext geändert UND Pass 0 Kandidaten fand UND Feld
Harvest-Prior hat. Ergebnis pro Feld-Text-Hash gecacht.
**Input:** NUR Kandidaten-Terme + ihr Satz-Kontext + Feld-Prior („Term steht in
'Datenquellen', dort stehen typischerweise Produkte") — nie das ganze Canvas.
**Output pro Term:** `produkt` (mit Vendor) · `projekt_eigenname` · `capability` ·
`fuellwort` · `mehrdeutig` + Konfidenz.
**Konsequenzen:** `produkt` → Lern-Stufe Synonym · `capability` → Stufe
Capability-Mapping · `fuellwort` → Block-Kandidat (Soft-Block sofort) ·
`projekt_eigenname`/`mehrdeutig` → kein Lernen ohne Pass 3.
**Tiering:** klein genug für Free mit engem Tageslimit (Vorfilterung senkt später
Pass-3-Kosten der Pro-Analyse).

### Pass 2 — Abgleich & Lernspeicher (0 Token)
Klassifizierte Terme gegen bestehende Mappings prüfen (client-eigen → global).
Vorhanden → nur `evidence_count`/`last_seen_at`. Neu → Kandidat mit
Pass-1-Klassifikation + Konfidenz als Metadaten (beschleunigt Review).
Upsert-Semantik: `is_active`/`review_status` werden NIE überschrieben; `rejected`
bleibt rejected.

### Pass 3 — Kontextanalyse (teuer, nur Delta)
Der heutige „Mit KI analysieren"-Call — aber verschlankt: bekommt die Ergebnisse
von Pass 0–2 mitgeliefert und analysiert nur noch, was offen ist (`mehrdeutig`-Fälle,
Quadrant/Komplexität/Compliance-Einordnung, höhere Lern-Stufen Capability-Ketten/
Archetypen). Pro primär; Free behält 1 Teaser.

## 5. Zwei-Zonen-Lernspeicher & Review-Governance

**Zone Client (auto-aktiv):** Mapping wirkt sofort, aber nur für den Client, der es
erzeugt hat (`client_id`-Scope auf canvas_synonyms). Schadensradius minimal,
selbstkorrigierend, kein Review-Aufwand. Beispiel: „unser HRSys" → SuccessFactors.

**Zone Global (kuratiert):** Promotion-Queue statt Einzelreview. Ein Kandidat
erscheint erst, wenn Schwellen gerissen sind: dasselbe Mapping unabhängig von ≥ 3
Clients gelernt UND Pass-1-Konfidenz hoch UND kein Eigennamen-Verdacht. Review
gruppiert nach Ziel-Vendor, Ein-Klick-Freigabe. In die Queue gelangt nur das
Term-Mapping, nie Canvas-Inhalt.

**Blocklist:** admin-pflegbare globale Liste (Seed: deutsche/englische Füllwörter,
u. a. „sollen"). Reject im Admin bietet optional „Begriff global blocken" an
(Pair-Reject ≠ Global-Block). Pass-1-`fuellwort`-Kandidaten: Soft-Block sofort,
Hard-Block nach Bestätigung.

## 6. Datenschutz-Leitplanken

1. Gelernt wird nur, was wörtlich im Text des Nutzers steht UND auf ein bekanntes
   kanonisches Ziel gemappt ist — nie Freitext, nie Personen-/Firmennamen (Prompt-
   Verbot + Server-Validierung + Eigennamen-Klasse in Pass 1).
2. Client-Zone verlässt den Client nie automatisch; Promotion ist ein bewusster
   Admin-Akt auf Basis des Mappings allein.
3. Pass-1-Prompts enthalten Satz-Kontext einzelner Felder — gleiche EU-/Provider-
   Regeln wie alle KI-Calls (callLLM-Pfad, Provenienz-Logging).

## 7. Erfolgsmessung (Telemetrie)

- `prefill_unchanged_rate`: Anteil der Wizard-Prefill-Felder, die der Nutzer
  unverändert lässt (primäre Qualitätsmetrik der Erkennung)
- `pass1_calls` / `pass1_skipped_local`: Wie oft reichte Pass 0 (= gesparte Tokens)
- `harvest_candidates` / `promoted` / `blocked`: Lernrate & Review-Last
- `ai_call_delta_size`: Promptgröße Pass 3 vor/nach Vorfilterung

## 8. Umsetzungs-Stufen (Issue-Schnitt)

| Stufe | Inhalt | Issue |
|---|---|---|
| 1 | Unified Engine + Fuzzy + Titel (Fundament) | #186 (gespecct) |
| 1b | Feld-Prior-Matrix + feldbewusster Pass 0 | #190 |
| 2 | Pass-1-Vorklassifikation (on-blur/on-save) + Blocklist + Anpassung Prototyp PR #189 | #191 |
| 3 | Zwei-Zonen-Lernspeicher (client_id-Scope, Promotion-Queue, Admin-Erweiterung) | #192 |
| 4 | Pass-3-Slimming (Delta-Prompt) + Capability-/Archetyp-Stufe | später (nach Telemetrie) |
| — | AI-Act-Klassifikator (nutzt Stakeholder-Prior aus 1b) | #187 (gespecct) |

**Status PR #189:** bleibt unge-merged; wird in Stufe 2 auf die Pipeline umgebaut
(detected_entities wandern vom Enrichment-Prompt in den Pass-1-Call; Migration wird
um client_id/Blocklist-Anteile erweitert). Die Guards (wörtlich-im-Text, Canonical-
Validierung, Upsert-Semantik) und die 11 Tests bleiben gültig.

# Sprintplan: UX-Review 22.07.2026 → Sprints 33–36

Ableitung aus `AI-Navigator_Sprintplanung_UX-Review.md` (10 UX-Punkte, Blöcke A–E).
Diese Datei übersetzt die Blöcke in konkrete, sequenzierte Sprints mit Abhängigkeiten.
Kein neuer Scope — nur Ordnung, Reihenfolge und Exit-Kriterien.

## Vorab zu klären (blockiert das Anlegen NICHT, aber vor Sprint 33 erledigen)

- **#205-Status widersprüchlich:** CLAUDE.md führt #205 als „DONE (`1bd36f2`)", GitHub
  hat #205 **OPEN**. Das Review behandelt #205 als offen (4 Punkte sind Ergänzungen).
  → Vor Sprint 33 klären: ist #205 inhaltlich erledigt und nur nicht geschlossen, oder
  fehlt der in Teil B beschriebene Rest tatsächlich noch? Danach CLAUDE.md ODER
  GitHub-Status korrigieren.
- **Sprint-Nummer gegenprüfen (Gate I):** `docs/sprints/` endet bei Sprint 32, CLAUDE.md
  bestätigt Sprint 32 (MERIDIAN) als erledigt. Nächste freie Nummer ist voraussichtlich
  **33** — vor dem Anlegen kurz gegen den letzten Sprint-Branch/Commit verifizieren.

## Abhängigkeitsgraph

```
#205-Ergänzung (Governance-Badge title)  ──┐
                                            ├──> Roadmap-Boxen-Merge (nutzt geteilten Banner)
UnifiedContextBanner-Extraktion  ──────────┘
Sidebar = AI-Pfad             (unabhängig)
Assessment-Autosave  ──┐
                        ├──  gleiche Wizard-Datei, gemeinsame PR-Serie
Assessment-Pro-Wahl  ──┘
Roadmap-Versionsdialog        (technisch unabhängig, jederzeit einschiebbar)
Executive-Summary-Dimensionstexte  (blockiert auf Daniels Textfreigabe)
```

---

## Sprint 33 — UI-Konsistenz & Navigation

**Thema:** Visuelle Vereinheitlichung + Navigationsreihenfolge. Durchgängig
`/frontend-design`-lastig, geringes Risiko, eine kohärente Design-Klammer.
Die einzige interne Abhängigkeit (#205-Badge → Roadmap-Banner) wird durch die
PR-Reihenfolge INNERHALB des Sprints aufgelöst.

**Reihenfolge der PRs:**
1. **#205-Ergänzung (Teil B)** — Block A, ein PR, niedrigstes Risiko:
   - `break-words` auf den `HintBox`-Textcontainer (`GovernancePageClient.tsx`)
   - Governance-Result-Badge (`UnifiedContextBanner` in `ArchitecturePageClient.tsx`)
     bekommt `title`-Attribut (bisher nur der Archetyp-Badge)
   - `InfoHint`-Ruhezustand dezent sichtbarer (`border border-line` statt reiner
     Hover-Akzent)
2. **Sidebar und geführter AI-Pfad angleichen** — unabhängig, parallel möglich:
   - `guidedSteps` (`dashboard/page.tsx`) um 8. Schritt „Roadmap" ergänzen, Position
     zwischen Governance und Compliance (identisch zur Sidebar)
   - Canvas-vor-Use-Case-Reihenfolge im Pfad angleichen (`MODULES` bleibt Referenz)
   - Fortschritt „X/7" → „X/8", zentrale Konstante (Gate D — nicht mehrfach hochzählen),
     `summary-priorities.ts` (`totalModules`) auf dieselbe Konstante prüfen
3. **Roadmap-Kontext-Boxen verschmelzen + Banner vereinheitlichen** — nach PR 1:
   - Drei getrennte Blöcke in `RoadmapPageClient.tsx` in EINE Card (Archetyp + Top-Use-
     Cases; Canvas-Kontext als eingebettete Teilbox mit Icon)
   - `UnifiedContextBanner` aus `ArchitecturePageClient.tsx` nach
     `src/components/shared/` extrahieren (reines Refactoring, Architektur-Seite
     verhält sich unverändert) und in Roadmap einsetzen
   - Governance-Badge-`title` NICHT doppelt bauen — kommt aus PR 1

**Gates:** B (Interaktion, wo neu), C (i18n DE+EN für neue `t()`-Keys), D (Zähler-
Konstante), visueller Abnahme-Gate 1440 + 375 (Screenshots vorher/nachher, inkl.
Regressions-Screenshot Architektur-Seite nach der Extraktion).

**Exit:** Sidebar- und Dashboard-Pfad-Reihenfolge identisch (Roadmap als 8. Schritt);
eine Roadmap-Card statt drei; #205-Element-Liste um die 3 Punkte ergänzt; Freigabe
Daniel vor Closes.

---

## Sprint 34 — Assessment-Flow

**Thema:** Beide Punkte fassen denselben `AssessmentWizard.tsx`-Flow an →
gemeinsame PR-Serie statt getrennt. `/fullstack-developer`-lastig. Berührt #222.

**Reihenfolge der PRs:**
1. **Assessment: Fortschritt pro Schritt zwischenspeichern** (das größere/riskantere,
   zuerst — es formt den Wizard-Flow):
   - Draft-Zeile in `assessment_sessions` (`completed=false`) beim Wizard-Start
   - Debounced Update der `answers`-JSONB je beantworteter Frage
   - Neue inkrementelle Speicher-Route (heute existiert nur DELETE unter
     `api/assessment/[id]/route.ts`)
   - Resume-Logik in `assessment/page.tsx` (offene Draft-Session erkennen,
     „Fortsetzen / Neu starten"-Hinweis)
   - Alte Drafts (>30 Tage) nicht in der Ergebnis-Historie
2. **Assessment: freiwillige Kurzversion für Pro-Nutzer** (baut auf dem Intro-Screen
   auf, den PR 1 ggf. anfasst):
   - Auswahl „Vollständig (42) / Schnell-Check (16)" NUR für Pro vor Wizard-Start
     (Free bleibt automatisch Quick Scan lt. #222)
   - Hinweistext zur geringeren Aussagekraft bei „Schnell-Check"
   - `assessment_sessions.type` (`quick`/`deep`) korrekt setzen — für spätere
     Auswertung (Dashboard, Executive Summary)

**Gates:** B (Draft-Update feuert nach Antwortauswahl; Interaktion Auswahlscreen),
C (i18n DE+EN), Migrations-Workflow falls Schema-Anpassung (voraussichtlich keine —
`answers`/`completed`/`type` existieren bereits).

**Exit:** GIF Frage-20-Abbruch → Fortsetzen ohne Datenverlust; Pro sieht Kurzversion-
Wahl, Free nicht; alte Drafts sauber getrennt; Freigabe Daniel vor Closes.

---

## Sprint 35 — Roadmap-Versionierung

**Thema:** Selbstständiges Feature auf bestehender Versionierungs-Infrastruktur
(`result_versions`, `POST /api/versions`, `VersionsPanel module="roadmap"`).
`/fullstack-developer`-lastig, eigene Testfläche → eigener Sprint. **Technisch
unabhängig — kann bei Kapazität vor Sprint 34 gezogen werden.**

**Umfang (ein Issue, zwei PRs möglich):**
1. Speichern-Dialog auf `/roadmap` ab der zweiten Speicherung: „Als neue Version
   sichern" (`POST /api/versions`) vs. „Aktuellen Stand aktualisieren"
   (`PATCH /api/roadmap/[id]` wie bisher)
2. `VersionCompare` um einen Roadmap-Zweig erweitern: Feld-Diff über
   `phases`/`milestones`, analog zur bestehenden Architektur-Tabelle (bisher nur
   `module === 'architecture'` echt, Roadmap = Platzhalter)
3. Prüfen, ob dieselbe Diff-Lücke Governance/Canvas betrifft → ggf. Folge-Issues
   vermerken, NICHT hier mitziehen

**Gates:** B (Speichern-Dialog beide Pfade), Test-Gate (Diff-Logik).

**Exit:** Dialog erscheint ab zweiter Speicherung; Diff zeigt echte Feldänderungen
zwischen zwei Roadmap-Versionen; Freigabe Daniel vor Closes.

---

## Sprint 36 — Executive-Summary-Content

**Thema:** Handlungsempfehlung je Assessment-Dimension. Content-lastig,
**blockiert auf Daniels Freigabe/Überarbeitung der Redaktionstexte** (24 Texte:
18 Schwach × Archetyp + 6 Gut) → bewusst als letzter/parallelisierbarer Sprint,
am ehesten mit der Konzeptpapier-Arbeit verzahnt.

**Umfang:**
- `dim_scores` in den Assessment-Select auf `zusammenfassung/page.tsx` aufnehmen
  (Gate D — bestehenden Selector-Zugriff von Dashboard/Architektur kopieren,
  nicht neu bauen)
- `generateSummaryBlock` (`summary-priorities.ts`) um `dimScores` erweitern
- Schwellwert „schwach" vs. „gut" je Dimension (an L1–L5-Reifegrad/Quick-Scan
  orientieren)
- Status-Text je Dimension: schwach → Empfehlung (archetypspezifisch),
  gut → Bestätigung (archetyp-neutral). Entwürfe im Review-Dokument, **Freigabe
  Daniel vor Übernahme.**
- Darstellung unterhalb der Top-3-Liste, klar als andere Kategorie erkennbar

**Vorarbeit möglich, ohne die Textfreigabe abzuwarten:** Select-Erweiterung,
`generateSummaryBlock`-Signatur, Schwellwert-Logik, UI-Gerüst mit Platzhaltertexten.
Erst die finale Textübernahme + i18n wartet auf Daniel.

**Gates:** C (i18n DE+EN), D (kein neuer Zähler, `dim_scores` aus bestehendem Select),
visueller Abnahme-Gate.

**Exit:** Alle 6 Dimensionen mit Status-Text (schwach → Empfehlung, gut →
Bestätigung); Freigabe Daniel inkl. Redaktionstexte vor Closes.

---

## Kompakt-Übersicht

| Sprint | Thema | Issues | Rolle | Blocker |
|---|---|---|---|---|
| 33 | UI-Konsistenz & Navigation | #205-Ergänzung + Sidebar=AI-Pfad + Roadmap-Merge | frontend-design | #205-Status klären |
| 34 | Assessment-Flow | Draft-Autosave + Pro-Kurzversion | fullstack | — (berührt #222) |
| 35 | Roadmap-Versionierung | Versions-Dialog + Diff | fullstack | — (vorziehbar) |
| 36 | Executive-Summary-Content | Handlungsempfehlung je Dimension | fullstack + Content | Daniels Textfreigabe |

**Nichts hiervon braucht ein neues Datenmodell** — `InfoHint`, `VersionsPanel`,
`result_versions`, `dim_scores`, `assessment_sessions.{answers,completed,type}`
existieren alle bereits. Der Aufwand liegt durchgängig in Verdrahtung und
Konsistenz, nicht in Neubau.

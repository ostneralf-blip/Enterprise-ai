# Sprint 2 — Plan & Modul-Priorisierung

**Stand:** 20. Juni 2026
**Status Sprint 1:** Assessment-Modul vollständig (Wizard, Ergebnis-Seite, PDF-Export, Speichern, Sharing-Grundlage), Login/Register/Dashboard funktionsfähig, Security-Checkliste 34/34 Tests bestanden, Mobile-Responsive-Grundlage gelegt, Design-System eingeführt.

---

## Sofort: Die nächsten 3 konkreten Schritte

### 1. Use-Case Scoring & Priorisierung (höchste Priorität)
**Warum zuerst:** Zweitwichtigstes Tool nach Assessment laut ursprünglichem MVP-Scope, baut auf bereits vorhandenen Patterns auf (Scoring-Engine-Logik ist strukturell ähnlich zum Assessment — Wiederverwendung von Test- und Komponentenmustern möglich).

**Umfang (MVP, siehe `docs/mvp-scope-enterprise-ai-toolset.md` für volle Spec):**
- Portfolio-Tabelle mit 5 gewichteten Kriterien (Value, Feasibility, Data Readiness, Risk, Speed)
- Value × Feasibility Matrix (visuell)
- Free: max. 3 Use Cases, Pro: unbegrenzt
- PDF-Export, Speichern, Versionierung (Pro)

**Test-Anforderung:** Gleiches Muster wie Assessment — Unit-Tests für Scoring-Logik, Security-Tests für die neue API-Route, Accessibility-Tests für die Eingabe-UI, Mobile-Verifikation bei 375/768/1440px vor Fertig-Meldung.

### 2. Einstellungsseite (aus Feature-Rückstand vorgezogen)
**Warum jetzt vorgezogen, nicht erst später:** Der Sidebar-Link zu `/settings` existiert bereits, ist aber aktuell tot — das ist eine sichtbare Lücke für jeden Nutzer. Außerdem macht das Fehlen einer Profil-Bearbeitung manuelle SQL-Eingriffe für simple Änderungen (Firmenname etc.) notwendig, was auf Dauer unpraktisch ist.

**Umfang (schlank halten, kein Over-Engineering):**
- Profil: Name, Firma, Rolle bearbeiten
- Stripe Customer Portal Link (Pro/Enterprise — Rechnungen, Zahlungsmethode)
- KEIN Sprachumschalter, KEIN Avatar-Upload in dieser Iteration — das wäre Stufe-2-Scope-Erweiterung ohne aktuellen Bedarf

### 3. Governance-Entscheidungsbaum
**Warum als drittes:** Dritthöchste Priorität im ursprünglichen MVP-Scope, unabhängig vom Use-Case-Modul entwickelbar, vergleichsweise simple Zustandslogik (Entscheidungsbaum mit 6 Gates, bereits im MVP-Scope-Dokument spezifiziert).

---

## Rückstand — eingeplant, Reihenfolge nach den ersten 3 noch offen

Diese werden NICHT im Detail vorab geplant — Detailplanung jeweils kurz vor Start, da sich Anforderungen durch Nutzerfeedback aus den ersten 3 Modulen noch verschieben können.

1. Roadmap-Generator
2. AI Use-Case Canvas
3. Governance & Compliance Center (EU AI Act, DSGVO) — Pro-Feature
4. AI-Architektur-Generator (Wizard) — Pro-Feature
5. SAP-Integration (Cloud SDK for JavaScript, Clean-Core-konform) — kein MVP-Blocker, siehe ursprüngliche Stack-Analyse zu Joule-Einschränkungen
6. Mobile-Nav-Polish (FeedbackWidget-Überlauf bei 393px und ähnliche Kleinigkeiten)

---

## Arbeitsweise für Sprint 2 (Claude Code)

1. **Vor jedem neuen Modul:** `CLAUDE.md` und `docs/design/design-system-handoff.md` lesen
2. **Während der Entwicklung:** Drei-Stufen-Klassifikation für aufkommende Korrekturen anwenden (siehe `CLAUDE.md`)
3. **Vor "fertig"-Meldung:** Test-Gate aus `CLAUDE.md` vollständig durchlaufen (Unit/Security/A11y-Tests + `npm run test && npx tsc --noEmit && npx eslint && npm run build`)
4. **Vor Git-Commit:** `git status` auf unerwartete Dateien prüfen (siehe Incident-Lektion vom 20.06.2026)
5. **Bei Unsicherheit über Stufe 2 vs. 3** (siehe CLAUDE.md-Klassifikation): lieber kurz nachfragen als voreilig entscheiden

# Sprint 30 — Design-Spec
_Erstellt: 14.07.2026_

## Ziel

Vollständiger Abschluss aller offenen #174-Reste (Sprint-29-Nachzügler) sowie Fertigstellung der Arch-V3-Feature-Tickets #166, #168, #169 und #170.

## Scope

### Phase 1 — Sichtbare Bugs (höchste Priorität)

**B1 — #174-Bug2: Use-Case-Tabelle overflow bei ~850px**
- Symptom: Tabelle bricht bei ca. 850px Viewport-Breite horizontal aus dem Container
- Fix: `overflow-x-auto` + `min-w-0` auf Tabellen-Container; ggf. responsive Column-Hiding
- Datei(en): Use-Case-Ergebnis-Komponente (konkrete Datei in Impl-Plan ermitteln)
- Abnahme: Screenshot bei 850px zeigt keine horizontale Scrollbar außerhalb des Containers

**B2 — #174-Bug3: Tab-Overflow ohne Fade-Indikator**
- Symptom: Tabs laufen über den Container hinaus ohne visuellen Hinweis (Fade/Pfeil)
- Fix: CSS `overflow-x-auto` + Fade-Overlay (`::after` Pseudo-Element oder Wrapper-Gradient) auf Tab-Leiste
- Datei(en): Tab-Komponente (konkrete Datei in Impl-Plan ermitteln)
- Abnahme: Screenshot bei 375px zeigt Fade-Indikator, wenn Tabs überlaufen

**B3 — #168: EAM Accept-Button ohne Funktion + Design**
- Symptom: Accept-Button im EAM-Waiver-Dialog reagiert nicht; Design weicht von restlichem Arch-UI ab
- Fix: Button-Handler verdrahten + Design angleichen
- Datei(en): EAM-Validierungskomponente in `src/components/modules/architecture/`
- Abnahme: Button funktioniert, Dialog schließt korrekt, Design-Konsistenz bestätigt per Screenshot

---

### Phase 2 — Code-Qualität & Bereinigung

**C1 — restliche `toFixed()`-Calls locale-aware**
- Betroffene Dateien: `ErgebnissePageClient.tsx`, `share/[token]/page.tsx`, `RadarChart.tsx`, `RoadmapPageClient.tsx`
- Muster: `value.toFixed(1)` → `Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)`
- Locale via `useLocale()` (Client-Komponenten) oder als Prop weitergereicht
- Abnahme: `npx tsc --noEmit` sauber; kein hardcodierter Dezimalpunkt in DE-Locale sichtbar

**C2 — informeller String `wizardResetConfirm` → Sie-Form**
- `messages/de.json`: Schlüssel `wizardResetConfirm` von „Deine bestehenden Ergebnisse…" → formelle „Sie"-Ansprache
- Gleichzeitig prüfen, ob `en.json`-Pendant vorhanden und korrekt

**C3 — Stripe-Footer „Dein AI Navigator Team" → formell**
- `stripe/webhook/route.ts` oder E-Mail-Template: „Dein AI Navigator Team" → „Ihr AI Navigator Team"

**C4 — CLAUDE.md: Sie-Form-Regel ergänzen**
- Unter Coding-Konventionen ergänzen: „Alle deutschen UI-Texte und E-Mails verwenden ausschließlich die formelle Sie-Ansprache. Keine informellen du/dein/deine-Formen."

---

### Phase 3 — Arch-V3 Features

**F1 — #169: Key Decisions & Next Steps → Roadmap-Generator**
- Key Decisions und Next Steps aus dem Architektur-Ergebnis sollen als vorausgefüllte Einträge in den Roadmap-Generator übernommen werden
- Mechanismus: Analog zu bestehendem `roadmapContext`-Pattern (Architektur liest bereits Assessment/Governance/Canvas) — neues Feld `architectureDecisions` in Context-Objekt
- UI: Optional „Aus Architektur übernehmen"-Button in Roadmap-Wizard oder automatische Vorbefüllung wenn Arch-Ergebnis vorhanden
- Datei(en): `roadmap/page.tsx`, Context-Übergabe aus `architecture/`-Ergebnis, Roadmap-Wizard-Komponente
- Abnahme: Key Decisions aus Arch erscheinen im Roadmap-Wizard vorausgefüllt; manuelles Überschreiben möglich

**F2 — #170: RASIC/Rollen — Single Source + Read-only-Spiegel**
- RASIC-Matrix und Rollen-Definitionen werden nur im Architektur-Modul gepflegt (Single Source of Truth)
- Governance und Compliance bekommen einen Read-only-Spiegel dieser Daten (kein Duplikat, kein Edit)
- Mechanismus: Neue API-Route oder Erweiterung von `/api/canvas/[id]` um RASIC-Daten; Governance/Compliance lesen per fetch
- Datei(en): `architecture/`-Ergebnis-Komponente (Edit), `governance/`- und `compliance/`-Komponenten (Read-only-View), ggf. neue API-Route
- Abnahme: Änderung in Architektur-RASIC spiegelt sich in Governance/Compliance ohne erneuten Input

**F3 — #166: Result-Layout — Kosten unter Toolbar + Drag&Drop**
- Investment/Kosten-Sektion direkt unter die Toolbar (bisher weiter unten)
- Sektionen im Result-View per Drag&Drop neu anordenbar (User-Präferenz, nicht persistiert in dieser Version)
- Drag&Drop-Bibliothek: `@dnd-kit/core` (bereits geprüft ob im Projekt vorhanden, sonst npm install)
- Datei(en): Architecture-Result-View-Komponente
- Abnahme: Kosten-Block erscheint direkt nach Toolbar; Drag&Drop funktioniert auf Desktop (375px: kein D&D, stattdessen feste Reihenfolge)

---

### GitHub-Hygiene-Regel

Issues nur schließen, wenn **beide** Bedingungen erfüllt sind:
1. Implementierung ist committed
2. Kein manueller Test steht aus (kein Screenshot-Gate, kein Produktions-Test)

Issues #148, #158, #159, #162, #163, #164 sind implementiert, brauchen aber noch visuelle Verifikation → bleiben offen bis eine Verifikations-Runde in Sprint 30 stattfindet.

---

## Reihenfolge & Abhängigkeiten

```
B1 → B2 → B3 (unabhängig, in Reihe wegen Fokus)
     ↓
C1 → C2 → C3 → C4 (unabhängig voneinander, kurz)
     ↓
F1 → F2 → F3 (F1+F2 unabhängig, F3 unabhängig)
```

F1 und F2 können parallel entwickelt werden; F3 ist unabhängig von beiden.

---

## Nicht in diesem Sprint

- #144 Canvas-Matching (P2, eigener Sprint)
- #145 Sharing API-Gap (P2, eigener Sprint)
- #146 Tier-Gating Zentralisierung (P2, Architektur-Entscheidung nötig)
- Per-route Canonical für Dashboard-Seiten (kein akuter SEO-Schaden)
- Externe Sync-Quellen AI-Katalog (kein konkreter Bedarf)
- Rechtstexte (externer Anwalt/eRecht24 nötig)

---

## Definition of Done

- `npx tsc --noEmit` sauber
- Kein neues `eslint --max-warnings 0`-Warning
- Screenshots bei 375px + 1440px für jede UI-Änderung
- Commit auf `main`, Push zu GitHub
- Issues schließen (nur wenn Screenshot-Gate bestanden)
- Obsidian Vault aktualisieren nach finalem Push

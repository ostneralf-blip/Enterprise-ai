# Architektur-Generator V2 — Verbindliche Design-Spezifikation

> **Verbindlichkeitsregel (gilt für alle beauftragten Design-Specs):**
> Wenn eine Design-Entscheidung getroffen und als Issue/Spec beauftragt wurde, ist die
> Erwartung eine **1:1-Umsetzung**. Weglassen, Vereinfachen oder Ersetzen einzelner
> Spec-Bestandteile ist KEINE zulässige Implementierungsentscheidung — jede Abweichung
> erfordert VORHER Rücksprache mit Daniel (Kommentar im Issue mit Begründung, Warten auf
> Freigabe). „Sinngemäß umgesetzt" gilt als nicht umgesetzt.

Referenz-Mockup: `docs/design/architektur-generator-v2-mockup.html` (im Browser öffnen —
jedes beschriebene Element ist dort interaktiv sichtbar). Epic: #150, Sub-Issues #151–#154.

## Soll/Ist-Stand nach Sprint 22–25 (Gap-Analyse 13.07.2026)

### ✅ Umgesetzt (verifiziert gegen Commits 2df9564, b64ce45)
- Sichten-Tabs Executive/Architektur/Compliance (`ResultAudience`)
- Detailtiefe-Umschalter L1–L3, `version_info` ab L2 (Migration 20260713073900)
- Exec-KPI-Strip + Exec-Empfehlungskarte; Compliance-Dimming der Komponenten
- RASIC-Matrix (`RasicSection.tsx`) + `runEamValidation` mit 3 Regeln
- KI-Panel (`AIPanelCard`), ◆-Marker in der Komponenten-Auswahl
- Präsentationsmodus book/board/blueprint inkl. `requireFeature('presentation_templates')` im PDF-Export
- `audience`-Parameter im ai-narrative-Endpoint

### ❌ Fehlt — muss 1:1 nachgezogen werden (Issue #155)

**1. EAM-Landkarte mit Bändern (Kernstück der Spec, Mockup-Abschnitt „Architektur-Landkarte")**
Das Ergebnis zeigt weiterhin nur das bisherige Diagramm. Die Spec fordert eine
ArchiMate-orientierte Bänder-Darstellung, exakt in dieser Struktur und Reihenfolge:

| Band | Inhalt | Pflicht-Elemente |
|---|---|---|
| Motivation & Vorgaben (gestrichelter Rahmen) | EU-AI-Act-Einstufung, DSGVO-Vorgabe, Business-Treiber | Badges (z. B. „Art. 50 Transparenz", „EU-Hosting Muss"); ab L2 Zusatzzeile (Fristen, Rechtsgrundlage) |
| Business | Capability-Karte + **Rollen-Chips** (Initialen-Avatar + Rollenname) | Rollen kommen aus `recommendFromCatalog().roleNames` |
| Applikation | gewählte Applikations-Komponenten als Karten | Name, Vendor-Zeile, Badges; ab L2 `version_info`; ab L3 Ops-Zeile + Owner |
| Daten & Technologie | Daten-/Modell-/Serving-Komponenten | wie Applikation |
| Querschnitt | Governance-/Security-Kontrollen (Gateway, HITL, Monitoring) | verknüpft mit Validierungsregel 3 |

Jede Karte mit KI-Herkunft trägt den ◆-Marker (oben rechts, `--color-ai`).

**2. Vierte Validierungsregel + L3-Datenbasis**
`runEamValidation` hat 3 von 4 Regeln. Es fehlt: „Jede gewählte Applikations-/Daten-
Komponente hat einen Owner (Rolle)". Dafür nötig: `owner_role` je gewählter Komponente
im Ergebnis-JSONB (Default aus Rollen-Mapping, editierbar) + `ops_notes` optional.
Ohne diese Daten ist L3 faktisch leer — L3 MUSS Owner + Betriebsinfos zeigen (Mockup).

**3. ◆-Herkunfts-Marker durchgängig**
Spec: Marker „bleibt bis ins fertige Diagramm, den PDF-Export und den Share-View
erhalten" — fehlt in `src/lib/pdf/templates.tsx` und `share/[token]/page.tsx`.
Dafür nötig: `source: 'rule' | 'ai' | 'manual'` je gewählter Komponente persistieren
(inkl. `rejected_suggestions[]` für die Divergenz-Analyse aus #144).

**4. Prüfen und ggf. nachziehen (im Issue abhaken, nicht stillschweigend):**
- Compliance-Sicht: Kontroll-Mapping-Tabelle „Anforderung → Kontrolle → Verantwortlicher (aus RASIC referenziert)"
- PostHog-Events aus Epic #150 vollständig: `arch_view_switched`, `arch_presentation_mode`, `rasic_edited`, `ai_suggestion_accepted/rejected`, `eam_validation`
- PDF: Executive-Sicht als 1-Seiter mit KPI-Strip; Validierungsstatus im PDF
- Free-Tier-Verhalten KI-Panel (1 Teaser + Upgrade-Hinweis)

## Abnahmeprozess (neu, verbindlich)

1. Vor „fertig": Screenshot der Umsetzung NEBEN Screenshot des Mockups (gleiche Sicht,
   gleiches Level, 1440 px + 375 px) als Issue-Kommentar.
2. Jedes Spec-Element aus der Checkliste einzeln abhaken; nicht Umgesetztes explizit
   als „Abweichung, Begründung, Rücksprache erbeten" markieren.
3. Erst nach Daniels Freigabe im Issue gilt das Issue als erledigt (`Closes #N` erst dann).

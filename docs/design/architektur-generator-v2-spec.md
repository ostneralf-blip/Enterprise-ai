# Architektur-Generator V2 — Verbindliche Design-Spezifikation

> **Verbindlichkeitsregel (gilt für alle beauftragten Design-Specs):**
> Wenn eine Design-Entscheidung getroffen und als Issue/Spec beauftragt wurde, ist die
> Erwartung eine **1:1-Umsetzung**. Weglassen, Vereinfachen oder Ersetzen einzelner
> Spec-Bestandteile ist KEINE zulässige Implementierungsentscheidung — jede Abweichung
> erfordert VORHER Rücksprache mit Daniel (Kommentar im Issue mit Begründung, Warten auf
> Freigabe). „Sinngemäß umgesetzt" gilt als nicht umgesetzt.

Referenz-Mockup: `docs/design/architektur-generator-v2-mockup.html` (im Browser öffnen —
jedes beschriebene Element ist dort interaktiv sichtbar). Epic: #150.

---

## ⭐ V3-Ergänzung (13.07.2026, entschieden von Daniel): Konsolidierung Variante B — #178/#179

**Problem:** 4–5 konkurrierende Bereiche für Technik-Architektur (Landkarte, Swimlane,
Managed AI Services, techOpt, Katalog-Karte) = fünf Listen derselben Daten.

**Entscheidung: Variante B „Landkarte + Werkbank" (4→2). Optik der aktuellen
Architecture Map ist gesetzt.** Verbindliche Struktur:

1. **Architecture Map** = einziges Ergebnisbild (read-only). Neu nur: Kopfzeilen-Filter
   `Alle · Managed · Eigenbetrieb` + „Managed"-Badge auf Karten. Karten-Klick → Detail-Modal.
2. **Technical Architecture Workbench** = einziger Interaktionsort, klappbar (Default zu),
   Header mit Live-Zusammenfassung „{n} aktiv · {m} KI-Vorschläge · {k} Konflikte" + Badges.
   Drei Tabs:
   - **Komponenten**: Layer-Blöcke mit Checkboxen, n/m-Zähler, Begründungszeile, Badges,
     Layer-Collapse (#164-Spez) + Konflikt-Banner (#157) + KI-Vorschlags-Aktionen (#176)
   - **Diagramm**: Swimlane READ-ONLY (Checkboxen entfernt!) + Vollbild
   - **Katalog**: durchsuchbare Liste + Detail-Modal (ersetzt CatalogRecommendationsCard)
3. **Ein zentraler Auswahl-State** — Landkarte, Tabs, Validierung lesen dieselbe Quelle.
4. **Funktions-Erhaltungs-Matrix in #179 ist verbindlich** — alle 12 Zeilen müssen im PR
   abgehakt sein, bevor eine alte Sektion gelöscht wird.
5. Entfallen ersatzlos als eigene Sektionen: Swimlane-Standalone, Managed AI Services,
   Empfohlene Katalog-Komponenten, techOpt-Standalone.

Variante A („Eine Landkarte, zwei Modi") bleibt dokumentiertes Zielbild — Entscheidung
erst nach Telemetrie (`workbench_tab`-Nutzung) aus B.

**Weitere V3-Entscheidungen (Issues):** Canvas-Auswahl-Schritt #162 · Wizard ohne
Komponenten-Frage #163 · KI-Fallback als Admin-Parameter #177 · i18n-CI-Gate #175 ·
KI-Panel-Aktionen funktional #176.

---

## Soll/Ist-Stand nach Sprint 22–25 (Gap-Analyse 13.07.2026)

### ✅ Umgesetzt (verifiziert gegen Commits 2df9564, b64ce45; Live-Test 13.07.)
- Sichten-Tabs Executive/Architektur/Compliance (`ResultAudience`)
- Detailtiefe-Umschalter L1–L3, `version_info` ab L2 (Migration 20260713073900)
- Exec-KPI-Strip + Exec-Empfehlungskarte; Compliance-Dimming der Komponenten
- RASIC-Matrix (`RasicSection.tsx`) + `runEamValidation` (3 Regeln, Waiver aus #168)
- EAM-Landkarte mit allen 5 Bändern inkl. Motivation (Live verifiziert 13.07.)
- KI-Panel (`AIPanelCard`), ◆-Marker in der Komponenten-Auswahl
- Präsentationsmodus book/board/blueprint inkl. `requireFeature('presentation_templates')` im PDF-Export
- `audience`-Parameter im ai-narrative-Endpoint; Katalog-Vendors korrigiert (#171)

### ❌ Offen — 1:1 nachzuziehen

**1. Executive-Sicht nicht spec-konform (#151):** zeigt volle Landkarte inkl.
Daten-&-Technologie-Band und Komponenten-Listen. Soll: KPIs + Empfehlung + nur
Business/Applikation-Band, maxLevel 1.

**2. Vierte Validierungsregel + L3-Datenbasis (#155):**
`validateComponentOwners` fehlt; `owner_role`/`ops_notes` je Komponente fehlen —
L3 ist gegenüber L2 faktisch leer.

**3. ◆-Herkunfts-Marker durchgängig (#155):** fehlt in PDF (`templates.tsx`) und
Share-View. `source: 'rule'|'ai'|'manual'` + `rejected_suggestions[]` persistieren.

**4. Workbench-Umbau (#179)** — siehe V3-Ergänzung oben; enthält #164-Restpunkte
(Zähler, Begründungen, Badges, i18n).

**5. Übergreifend prüfen:** Compliance-Kontroll-Mapping-Tabelle · PostHog-Events
vollständig · Exec-PDF als 1-Seiter · Free-Tier-KI-Panel (1 Teaser + Upgrade).

## Abnahmeprozess (verbindlich)

1. Vor „fertig": Screenshot der Umsetzung NEBEN Screenshot des Mockups (gleiche Sicht,
   gleiches Level, 1440 px + 375 px) als Issue-Kommentar.
2. Jedes Spec-Element aus der Checkliste einzeln abhaken; nicht Umgesetztes explizit
   als „Abweichung, Begründung, Rücksprache erbeten" markieren.
3. Erst nach Daniels Freigabe im Issue gilt das Issue als erledigt (`Closes #N` erst dann).

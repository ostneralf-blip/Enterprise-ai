# Design: Konfigurierbarer Architektur-Diagramm-Stil + Geteilte-Links-Übersicht

_Stand 24.07.2026 · Ergebnis der Brainstorming-Session · zwei „Demnächst"-Settings-Karten werden real._

## 1. Ausgangslage

**Architektur-Visualisierung heute:**
- `EamMap.tsx` — 5-Band-EAM-Landkarte (Motivation/Business/Applikation/Daten/Governance). Aktiv.
- `ArchitekturLandkarte.tsx` — alternative Karten-Sicht. Aktiv.
- `ArchitectureDiagram.tsx` (20 KB) — **verwaist, nirgends importiert** → wird entfernt.
- Ergebnisansicht rendert Sektionen (`cost`, `pattern`, `eam`, `rasic`, `decisions`) + hat einen Audience-Umschalter (`arch_view_switched`, `resultAudience`).
- Datenbasis: `activeComponents` (Katalog-Bausteine mit `architecture_layer`, `hosting`, `dsgvo_status`, `eu_ai_act_risk`, **`requires`/`suggests`/`incompatible_with`**), RASIC-Rollen, Cross-Modul-Kontext (Assessment/Canvas/Governance/Roadmap).

**Sharing heute:** `share_links`-Tabelle, `POST /api/share` (erstellt), `GET /api/share` (liefert bereits `token, module, entity_id, expires_at, view_count, created_at`), öffentliche `share/[token]`-Seite. Es fehlt: Übersicht + Widerruf.

## 2. Feature 1 — Architektur-Diagramm: konfigurierbarer Stil

### 2.1 Ziel
Der Anwender (bzw. seine Rolle) wählt, **wie** die Architektur dargestellt wird — EAM-gerecht, theme-sicher, von neutral-executiv bis detailliert-architektonisch.

### 2.2 Das Preset-Modell
Ein **Diagramm-Stil** (`DiagramStyle`) bündelt vier Dimensionen:

| Dimension | Werte |
|---|---|
| `art` | `schichten` · `togaf` · `datenfluss` · `capability` |
| `connections` | `bebauungsplan` (Default) · `uml` (opt-in) |
| `maturity`/`color` | theme-sicher, geordnete Skalen über **Füllgrad/Form** (Pips), **max. 1 Akzent** (Primary nur für Top-Zustand) |
| `density` | `sparsam` · `detailliert` |

**Persona-Presets** (Startpunkte, danach frei anpassbar):

| Preset | art | connections | density | Fokus |
|---|---|---|---|---|
| Executive (CIO/CEO) | `capability` | `bebauungsplan` | `sparsam` | Geschäftsfähigkeiten + Reifegrad |
| Enterprise-Architekt | `schichten` (oder `togaf`) | `uml` | `detailliert` | Struktur + Abhängigkeiten |
| Compliance / Risk | `schichten` | `bebauungsplan` | mittel | Status/Konformität je Baustein |
| Daten- / ML-Lead | `datenfluss` | `uml` | `detailliert` | Datenherkunft & -nutzung |

### 2.3 Die vier „Arten"
- **Schichten** (ArchiMate): horizontale Ebenen Business→Technik. Refactoring der heutigen `EamMap`.
- **TOGAF-Domänen** (BDAT): Business/Data/Application/Technology als Domänen. **Günstige Variante der Schichten-Sicht** (andere Gruppierung/Labels, gleiche Rendering-Basis) — kein eigener Renderer.
- **Datengetrieben**: Daten im Zentrum, Quellen → Datenplattform → Modelle → Konsum. Eigener Renderer; passt zum UML-Ausbau.
- **Capability** (portfolio-übergreifend, s. 2.6): Geschäftsfähigkeiten als verschachtelte Heatmap.

### 2.4 Reifegrad/Farbe — theme-sicheres Prinzip (verbindlich)
Geordnete Skalen (Reifegrad, Konformität) werden **NICHT über mehrere Farbtöne** kodiert, sondern über **Füllgrad/Form** — überlebt Dark-/Book-Theme + Farbsehschwäche:
- **Reifegrad-Pips**: 4 Kästchen, Füllzahl = Reife (geplant→evaluiert→Pilot→produktiv). Neutrale Tinte (`ink`/`line`), **Primary-Akzent ausschließlich für „produktiv"**.
- Wiederverwendbare Komponente `MaturityPips` (auch außerhalb Capability nutzbar, z. B. Status-Punkte).
- Bestehende Kategorie-/Layer-Tönung bleibt dezent (feiner farbiger Rand links = Schicht), Status per Pip/Punkt — nie beides als Vollfläche.

### 2.5 Verknüpfung (Bebauungsplan + UML, phasiert)
- **Bebauungsplan** (Default): Bausteine in Schicht-Bändern, keine Kanten. Deterministisch, skaliert, PDF-tauglich, executive-tauglich.
- **UML** (opt-in Architekten-Layer):
  - **Phase 2a — regelbasiert:** Schicht-Flüsse (Application → Serving/Modell → Daten). Fallback, nichts schwebt unverbunden.
  - **Phase 3 — echte Kanten:** aus Katalog-`requires`/`suggests` aktiver Bausteine (nutzt bestehende Abhängigkeitsmatrix). Regelbasiert bleibt Fallback, wo keine Katalog-Kante existiert. `incompatible_with` → Konflikt-Markierung.

### 2.6 Capability-Sicht — Datenherkunft (Design-Entscheidung)
Die Capability-Sicht ist **portfolio-übergreifend** (nicht auf die eine aktive Architektur beschränkt) — genau das erwartet ein CIO/CEO. Ableitung aus **vorhandenen** Daten, keine neue Taxonomie:
- **Fähigkeiten (L2)** = Use-Cases des Nutzers, gruppiert nach **L1 = `use_cases.domain`** (bzw. Geschäftsbereich).
- **Reifegrad je Fähigkeit** aus dem Lebenszyklus des Use-Cases: `produktiv` (Governance freigegeben **und** Architektur generiert) · `pilot` (Canvas/Architektur vorhanden) · `evaluiert` (Governance geprüft) · `geplant` (nur gescored). Genaue Schwellen im Plan.
- **Baustein-Zahl** = Anzahl zugeordneter Architektur-Komponenten der Fähigkeit.
- Darstellung: V2-Heatmap-Struktur (L1-Bereiche mit L2-Kacheln) + Baustein-Zahl + `MaturityPips`.
- **Platzierung:** primär im Architektur-Stil-Wähler; die Capability-Heatmap eignet sich zusätzlich für die Executive Summary (spätere Wiederverwendung, nicht MVP-Pflicht).

### 2.7 Wo gewählt wird & Persistenz
- **Settings-Karte „Architektur-Diagramm"** → Default-Preset setzen (Persona-Preset wählen oder Dimensionen einzeln).
- **Schnell-Umschalter in der Ergebnisansicht** (erweitert den bestehenden Audience-Umschalter) — Stil ad hoc wechseln.
- **Persistenz:** `user_preferences.diagram_style` (JSONB: `{art, connections, maturity, density}` oder Preset-Name). Fallback = Persona-Default bzw. `schichten/bebauungsplan/sparsam`.

### 2.8 Komponenten-Architektur (Units)
- `src/config/diagram-styles.ts` — `DiagramStyle`-Typ, `PERSONA_PRESETS`, Defaults, Auflösungslogik (Preset → DiagramStyle).
- `src/components/modules/architecture/diagram/`
  - `DiagramView.tsx` — Dispatcher: wählt Renderer nach `style.art`, legt optional `ConnectionLayer` darüber.
  - `LayeredView.tsx` — Schichten (+ `grouping="togaf"`-Prop für TOGAF). Übernimmt/ersetzt `EamMap`.
  - `DataFlowView.tsx` — Datengetrieben.
  - `CapabilityView.tsx` — Capability-Heatmap (portfolio).
  - `MaturityPips.tsx` — geteilte Reifegrad-Komponente.
  - `ConnectionLayer.tsx` — UML-Kanten (Phase 2/3), SVG-Overlay.
  - `DiagramStyleSwitcher.tsx` — Umschalter (Ergebnisansicht + Settings).
- **Aufräumen:** `src/components/modules/ArchitectureDiagram.tsx` löschen (verwaist).
- **i18n:** alle Labels (Art-Namen, Reifegrad-Stufen, Preset-Namen) DE (Sie-Form) + EN in `messages/*.json`.

### 2.9 Phasenplan
| Phase | Inhalt |
|---|---|
| **1 (MVP)** | `diagram-styles.ts` + Persona-Presets · `DiagramStyleSwitcher` (Settings + Ergebnis) · Persistenz (`user_preferences.diagram_style`) · **CapabilityView** (neu) · **LayeredView** (EamMap darauf umgestellt) · `MaturityPips` theme-sicher überall · Bebauungsplan-Modus · verwaisten ArchitectureDiagram entfernen |
| **2** | `DataFlowView` (Datengetrieben) · `ConnectionLayer` **regelbasiert** (Schicht-Flüsse) · TOGAF-Gruppierung (`LayeredView grouping`) |
| **3** | Echte Katalog-Kanten (`requires`/`suggests`) + Konflikte · PDF-Export je Stil · Capability in Executive Summary · Share-View je Stil |

**Graceful Degradation:** In Phase 1 existiert `connections: uml` als Präferenz-Wert, wird aber noch als `bebauungsplan` gerendert (kein Fehler, keine leere Fläche). Ab Phase 2 greift die UML-Darstellung automatisch für bereits gesetzte Presets. Ebenso rendert `art: datenfluss`/`togaf` in Phase 1 als `schichten`, bis der jeweilige Renderer/die Gruppierung existiert.

### 2.10 Fehlerbehandlung / Edge Cases
- Kein aktiver Baustein / leere Bänder → bestehender Empty-State je Sektion.
- Capability ohne Use-Cases → Hinweis „Noch keine Use-Cases im Portfolio" + Link zum Use-Case-Modul.
- Unbekannter/alter `diagram_style`-Wert in DB → auf Default zurückfallen (nie crashen).
- UML mit vielen Kanten → Kanten-Deckel/Bündelung, sonst „Spaghetti" (Phase 2 Detail).

### 2.11 Tests
- Unit: Preset→`DiagramStyle`-Auflösung; Reifegrad-Ableitung aus Use-Case-Lebenszyklus (Schwellen); Fallback bei unbekanntem Stil.
- Unit/Snapshot: `MaturityPips` (Füllzahl je Stufe, Primary-Akzent nur bei „produktiv").
- Accessibility (jest-axe): `DiagramStyleSwitcher` + Capability-Kacheln (Reifegrad als Text/aria, nicht nur visuell).
- Security: keine (rein clientseitige Darstellung; Persistenz über bestehende RLS-geschützte `user_preferences`).

## 3. Feature 2 — Geteilte Links: Übersicht

### 3.1 Ziel
Der Nutzer sieht alle **aktiven** Share-Links und kann sie widerrufen. Die Settings-Karte „Geteilte Links" wird zur echten Seite verlinkt.

### 3.2 UI
- Seite `/geteilte-links` (aus Settings-Karte verlinkt), Dashboard-Layout.
- Tabelle/Karten: **Modul · Titel/Entity · Ablaufdatum (bzw. „unbegrenzt") · Zugriffszahl · erstellt am · [Widerrufen]**.
- Abgelaufene Links optisch abgesetzt (theme-sichere Kennzeichnung, kein reines Rot).
- Leerer Zustand: „Sie haben noch keine Inhalte geteilt."

### 3.3 API & Datenfluss
- `GET /api/share` liefert die Liste bereits (nur Auflistung serverseitig absichern: eigene Links via RLS/`user_id`).
- **Neu:** `DELETE /api/share/[id]` (oder `?id=`) — Widerruf, nur eigener Link (RLS + serverseitiger `user_id`-Check), idempotent. Setzt Link inaktiv/löscht Zeile.
- Optimistisches UI-Update + Fehlerfall-Rollback.

### 3.4 Tests
- Security: `DELETE` nur für eigene Links (fremder Link → 403/404); Auth-Check.
- Unit: Ablauf-/„unbegrenzt"-Formatierung; abgelaufen-vs-aktiv-Logik.
- Accessibility: Tabelle + Widerrufen-Button.

## 4. Bewusst nicht enthalten (YAGNI)
- Keine frei zeichenbaren Diagramme / kein Drag-Editor.
- Kein voller ArchiMate-Notationssatz — nur die vier gewählten Arten.
- Keine neue Capability-Taxonomie — Ableitung aus vorhandenen Use-Case-Daten.
- Analytics/GA: separat zurückgestellt (Issue #255).

## 5. Offene Detailpunkte für die Planung
- Genaue Reifegrad-Schwellen (welcher Use-Case-Zustand = welche Stufe).
- `user_preferences`-Schema: JSONB-Feld vs. Einzelspalten.
- TOGAF wirklich als Label-Variante ausreichend, oder eigener Renderer? (Annahme: Variante genügt.)
- `DELETE`-Semantik: harte Löschung vs. `is_active=false` (Empfehlung: Soft-Delete/Inaktiv, damit `share/[token]` sauber „abgelaufen" zeigt).

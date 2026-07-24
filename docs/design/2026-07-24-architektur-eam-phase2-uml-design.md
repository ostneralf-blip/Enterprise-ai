# Architektur-EAM Phase 2 — UML-Verknüpfung, Datenfluss-Sicht, TOGAF-Gruppierung

_Design-Dokument, 24.07.2026. Baut auf `docs/design/2026-07-24-architektur-diagramm-stil-und-geteilte-links-design.md` (Phase-1-MVP ausgeliefert, `4672952`) auf. Setzt die dort als Phase 2 markierten Bausteine um._

## 1. Ziel & Umfang

Drei Bausteine, in einem Iterationsschritt (vom Nutzer als „ganzer Wurf" bestätigt):

1. **ConnectionLayer (regelbasiert)** — UML-Verknüpfungen als SVG-Overlay über der Schichten-/TOGAF-Sicht. Regelbasierte, gebündelte Schicht-Fluss-Pfeile (keine Einzel-Baustein-Spaghetti). Echte Katalog-Kanten (`requires`/`suggests`) bleiben Phase 3.
2. **DataFlowView (Datengetrieben)** — eigener Renderer, Daten im Zentrum: Quellen → Datenplattform → Modelle → Konsum (links→rechts), Querschnitt als Fußleiste.
3. **TOGAF-Gruppierung** — die Schichten-Sicht (EamMap) bekommt ein `grouping`-Prop; `togaf` regruppiert dieselben Bausteine in die TOGAF-Domänen Business/Data/Application/Technology (+ Querschnitt).

**Auswahl-UX (bestätigt):** Persona-Presets bleiben die primäre Wahl. Ein ausklappbares „Ansicht anpassen ▾" darunter enthält die sekundären Überschreibungen:
- **Art:** Schichten · TOGAF · Datenfluss · Capability
- **Verknüpfung:** Bebauungsplan · UML (nur sichtbar für Schichten/TOGAF)

Standardansicht bleibt schlank; das Preset setzt sinnvolle Defaults, der Override greift nur wenn aufgeklappt+geändert.

**Bewusst NICHT in Phase 2** (bleibt Phase 3): echte Katalog-Kanten `requires`/`suggests`/`incompatible_with`, PDF-Export je Stil, Capability in Executive Summary, Share-View je Stil. PDF/Share rendern in Phase 2 weiterhin die bestehende Layers-Bebauungsplan-Sicht (dokumentierte Graceful Degradation).

## 2. Datenmodell (unverändert genutzt)

Bausteine (`activeComponents`, Typ `CatalogComponent`) tragen `architecture_layer ∈ {application, data, model, serving, mlops, governance, security}`, dazu `hosting`, `dsgvo_status`, `eu_ai_act_risk`, `requires`/`suggests`/`incompatible_with` (Phase-3-relevant). RASIC-Rollen (`roleNames`), Cross-Modul-Kontext, `compliance`-Preset wie in EamMap heute.

## 3. Architektur der Komponenten

```
DiagramView (Dispatcher)
├─ art=capability          → CapabilityView            (Phase 1, unverändert)
├─ art=datenfluss          → DataFlowView              (NEU)
└─ art=schichten | togaf   → LayeredView (= EamMap)    (grouping-Prop NEU)
                              + ConnectionLayer         (NEU, wenn connections=uml)
```

- `renderableArt()` (in `config/diagram-styles.ts`) verliert die Phase-1-Kollabierung (togaf/datenfluss → schichten). Es liefert `art` jetzt 1:1 zurück (capability|datenfluss|schichten|togaf).
- `DiagramView.tsx` dispatcht wie oben. Für schichten/togaf reicht es `grouping = (art === 'togaf' ? 'togaf' : 'layers')` an EamMap durch und legt bei `connections === 'uml'` den `ConnectionLayer` als Geschwister-Overlay darüber (gemeinsamer Positionskontext).

### 3.1 EamMap (LayeredView) — `grouping`-Prop

Neues optionales Prop `grouping: 'layers' | 'togaf'` (Default `'layers'` → heutiges Verhalten unverändert). Die Band-Definition wird aus einer Konfiguration abgeleitet statt hartcodiert:

**`grouping='layers'` (heute, unverändert):**
| Band | Inhalt (architecture_layer) |
|---|---|
| Motivation & Vorgaben | Compliance/Business-Goal-Knoten (dashed) |
| Business | RASIC-Rollen |
| Applikation | `application` |
| Daten & Technologie | `data, model, serving, mlops` |
| Querschnitt | `governance, security` |

**`grouping='togaf'` (NEU) — TOGAF-Domänen:**
| Band | Inhalt |
|---|---|
| Business | RASIC-Rollen + Motivation/Business-Goal |
| Data | `data` |
| Application | `application, serving` |
| Technology | `model, mlops` |
| Querschnitt (Governance) | `governance, security` (dashed, spannt) |

Begründung Mapping: `serving` ist anwendungsnah (Bereitstellung) → Application; `model`/`mlops` sind Technologie-Fundament → Technology; `data` bekommt eine eigene Data-Domäne (in der Layers-Sicht mit Technik zusammengefasst). Governance/Security bleiben Querschnitt.

Leere Bänder: gleiche Regel wie heute (Applikation blendet bei 0 aus, andere zeigen `EmptyBandHint`).

### 3.2 DataFlowView (NEU) — `art=datenfluss`

Eigener Renderer, links→rechts, Daten im Zentrum:

| Stufe | Bausteine (architecture_layer) |
|---|---|
| Quellen | `data` |
| Datenplattform | `mlops` |
| Modelle | `model, serving` |
| Konsum | `application` |
| Querschnitt (Fußleiste) | `governance, security` (dashed, spannt alle Stufen) |

- 4 Spalten (responsive: auf Mobile untereinander mit Abwärtspfeilen statt Rechtspfeilen).
- Fluss-Pfeile zwischen den Stufen sind **inhärent** (kein Toggle) — Datenfluss IST die Verknüpfung. Umgesetzt als einfache CSS-/inline-SVG-Pfeile zwischen den festen Spalten (kein DOM-Messen nötig, weil das Grid fix ist).
- Bausteinkarten identisch zu EamMap (`ComponentCard`-Wiederverwendung), inkl. Reifegrad/Status/AI-Marker.
- Leere Stufe: `EmptyBandHint`.

### 3.3 ConnectionLayer (NEU) — regelbasierte Schicht-Flüsse

SVG-Overlay über EamMap (nur bei `connections='uml'` und `art ∈ {schichten, togaf}`).

**Mechanik (clientseitig):**
- EamMap gibt jedem fluss-relevanten Band eine `ref` (bzw. ein `data-band="<id>"`-Attribut) und rendert in einen Container mit `position: relative`.
- ConnectionLayer misst per `ref` + `getBoundingClientRect()` (relativ zum Container) die Band-Anker (Quelle: Unterkante-Mitte, Ziel: Oberkante-Mitte) und zeichnet ein absolut positioniertes `<svg>` mit gebündelten, gekrümmten Pfaden + Pfeilspitze.
- `ResizeObserver` auf dem Container → Neuberechnung bei Flex-Wrap-Umbruch/Resize. Erstmessung nach Mount (`useLayoutEffect`).
- **Gebündelt = eine Kante je Band-Paar**, nicht je Baustein → kein Spaghetti, skaliert unabhängig von der Baustein-Zahl.

**Regel-Kanten (welche Band-Paare):**
- `grouping='layers'`: Applikation → Daten&Technologie (Konsumfluss). (Motivation/Business/Querschnitt = keine Fluss-Kante.)
- `grouping='togaf'`: Application → Data, Application → Technology, Technology → Data.
- Eine Kante wird nur gezeichnet, wenn **beide** beteiligten Bänder nicht leer sind.

**Theme-Sicherheit:** Strich in semantischem Token (`--color-line-strong` / `text-ink-secondary`), eine Akzentfarbe max. Kein Farbton-Code für Semantik. Overlay ist `pointer-events: none` (klick-transparent), `aria-hidden` (dekorativ — die Bänder tragen die Struktur bereits im DOM).

### 3.4 DiagramStyleSwitcher — Erweiterung

Bisher: 4 Persona-Preset-Buttons, `onChange(presetKey)`.

Neu:
- Presets bleiben; Klick setzt vollständigen `DiagramStyle` (art+connections+density) aus dem Preset und schließt den Override-Bereich.
- Darunter ein `<button>` „Ansicht anpassen ▾" (aria-expanded), das einen Bereich aufklappt:
  - **Art** (segmentierte Buttons): Schichten · TOGAF · Datenfluss · Capability → setzt `style.art`.
  - **Verknüpfung** (nur wenn art ∈ {schichten, togaf}): Bebauungsplan · UML → setzt `style.connections`.
- Jede Änderung persistiert den vollständigen `DiagramStyle` via `PUT /api/preferences { diagram_style }`.
- Der aktive Persona-Preset-Button wird per Reverse-Match aus dem aktuellen `DiagramStyle` hervorgehoben; passt kein Preset (freie Kombination), ist kein Preset aktiv markiert.

### 3.5 State/Persistenz-Refactor

Heute hält `ArchitecturePageClient` `activePreset: string` und leitet `diagramStyle` daraus ab. Phase 2 braucht freie art/connections-Overrides:
- State wird `diagramStyle: DiagramStyle` (initial aus `initialDiagramStyle` bzw. Preset-Default).
- `activePreset` wird zu abgeleitetem Wert (Reverse-Match) statt Quelle der Wahrheit.
- `changeStyle(patch: Partial<DiagramStyle>)` merged + persistiert; `changePreset(key)` setzt den ganzen Preset-Style.
- `presetTouched`/Executive-Default-Logik (Phase-1-Fix) bleibt: im Executive-Tab Default = Capability, solange nicht manuell umgeschaltet.
- Settings-Seite nutzt denselben erweiterten Switcher (Default-Wahl inkl. Art/Verknüpfung).

## 4. i18n (de + en, Sie-Form)

Namespace `diagram` erweitern/anpassen:
- `artTogaf`/`artDatenfluss`: „(demnächst)" entfernen.
- Neu: `customizeView` („Ansicht anpassen"), `connectionsLabel` („Verknüpfung"), `connBebauungsplan`, `connUml`, `artLabel`.
- DataFlow-Stufen: `flowSources`, `flowPlatform`, `flowModels`, `flowConsumption`, `flowCross`.
- TOGAF-Bänder: `togafBusiness`, `togafData`, `togafApplication`, `togafTechnology`, `togafCross` (bzw. bestehende `eam*`-Keys wiederverwenden wo passend).
- ConnectionLayer: ggf. `flowArrowLabel` (falls doch aria genutzt statt aria-hidden).

## 5. Fehlerbehandlung / Edge Cases

- **Leere Bänder/Stufen** → keine Fluss-Kante zu/von leerem Band; DataFlow zeigt `EmptyBandHint`.
- **ResizeObserver nicht verfügbar** (alte Umgebung) → einmalige Messung nach Mount, kein Crash.
- **Sehr wenige Bausteine** (1) → Kante nur wenn Quell- und Zielband je ≥1 Baustein.
- **PDF-Export / Share** → unverändert Layers-Bebauungsplan (kein ConnectionLayer/DataFlow-Measuring serverseitig). Explizit dokumentiert; Phase 3 macht Stil-treuen Export.
- **Dark/Book-Theme** → SVG-Strich über semantische Tokens, in allen Themes geprüft.
- **Overlay-Positionierung** bei Scroll/Zoom → Messung relativ zum Container, nicht Viewport.

## 6. Tests (CLAUDE.md Test-Gate)

- Unit: `renderableArt()` liefert alle 4 Arten 1:1; Band-/Stufen-Mapping-Funktionen (Zuordnung `architecture_layer` → Band/Stufe) für layers/togaf/datenfluss.
- Unit: Regel-Kanten-Ableitung (welche Band-Paare bei layers vs togaf, Leer-Band-Unterdrückung).
- a11y (jest-axe): DataFlowView, erweiterter DiagramStyleSwitcher (Override aufgeklappt), EamMap mit grouping='togaf'.
- Bestehende EamMap-/DiagramView-Tests dürfen nicht brechen (grouping-Default = layers).

## 7. Dateien

- Ändern: `config/diagram-styles.ts` (renderableArt 1:1), `components/modules/architecture/diagram/DiagramView.tsx` (Dispatch + Overlay), `DiagramStyleSwitcher.tsx` (Override-Bereich), `architecture/EamMap.tsx` (grouping-Prop + Band-Refs), `ArchitecturePageClient.tsx` + `settings/*` (State-Refactor auf DiagramStyle), `messages/de.json`+`en.json`.
- Neu: `components/modules/architecture/diagram/DataFlowView.tsx`, `components/modules/architecture/diagram/ConnectionLayer.tsx`, ggf. `lib/architecture/diagram-grouping.ts` (reine Mapping-/Regel-Funktionen, testbar).

## 8. Umsetzungsreihenfolge (Vorschlag für den Plan)

1. Mapping-/Regel-Funktionen (`diagram-grouping.ts`) + Unit-Tests (reine Logik zuerst).
2. `renderableArt` 1:1 + DiagramView-Dispatch-Gerüst.
3. EamMap `grouping`-Prop (togaf) + Band-Refs.
4. DataFlowView.
5. ConnectionLayer (SVG-Overlay + ResizeObserver).
6. DiagramStyleSwitcher-Override + State-Refactor (Client + Settings).
7. i18n, a11y-Tests, Gate.

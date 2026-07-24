# Architektur-EAM Phase 2 — Implementierungsplan

> **Für agentische Umsetzung:** Sub-Skill superpowers:subagent-driven-development. Schritte als Checkbox (`- [ ]`).

**Ziel:** UML-Verknüpfung (regelbasierter ConnectionLayer), Datenfluss-Sicht (DataFlowView) und TOGAF-Gruppierung im Architektur-Generator, wählbar über Persona-Presets + „Ansicht anpassen"-Override.

**Architektur:** Reine Mapping-/Regel-Logik in `lib/architecture/diagram-grouping.ts` (testbar), neue Renderer `DataFlowView`/`ConnectionLayer`, EamMap um `grouping`-Prop erweitert, DiagramView-Dispatch + Switcher-Override, State auf vollständigen `DiagramStyle` umgestellt.

**Tech Stack:** Next.js 16, TypeScript strict, next-intl (de+en, Sie-Form), Tailwind (semantische Tokens), jest + jest-axe. Design: `docs/design/2026-07-24-architektur-eam-phase2-uml-design.md`.

**Baseline:** Jest 27 failed suites / 10 failed tests (pre-existing next-intl-ESM). Regression = mehr als das.

---

## Task 1: Mapping-/Regel-Logik (`diagram-grouping.ts`) + Tests

**Files:** Create `src/lib/architecture/diagram-grouping.ts`, Test `src/__tests__/unit/diagram-grouping.test.ts`

Reine Funktionen (keine React), damit testbar:
- `type BandId = 'motivation'|'business'|'application'|'data'|'technology'|'dataTech'|'cross'`
- `type FlowStage = 'sources'|'platform'|'models'|'consumption'|'cross'`
- `layersBands(comps)`: gibt die 5 Layers-Bänder mit ihren Bausteinen zurück (application; data,model,serving,mlops; governance,security).
- `togafBands(comps)`: Business(roles extern), Data(`data`), Application(`application`,`serving`), Technology(`model`,`mlops`), Cross(`governance`,`security`).
- `dataFlowStages(comps)`: sources(`data`), platform(`mlops`), models(`model`,`serving`), consumption(`application`), cross(`governance`,`security`).
- `ruleEdges(grouping, nonEmptyBandIds)`: liefert Band-Paar-Kanten. layers: `[['application','dataTech']]`; togaf: `[['application','data'],['application','technology'],['technology','data']]`. Nur wenn beide Bänder in `nonEmptyBandIds`.

- [ ] **Step 1:** Test schreiben — je eine Assertion pro Funktion (Beispiel-Komponenten mit `architecture_layer`), inkl. Leer-Band-Unterdrückung in `ruleEdges`.
- [ ] **Step 2:** Test rot laufen lassen (`npx jest diagram-grouping`).
- [ ] **Step 3:** `diagram-grouping.ts` implementieren (nur Array-Filter + Konstanten). Typ der Bausteine: `Pick<CatalogComponent,'architecture_layer'>[]` bzw. generisch `{architecture_layer: string|null}[]`.
- [ ] **Step 4:** Test grün. `npx tsc --noEmit` sauber.
- [ ] **Step 5:** Commit `feat(architecture): Diagramm-Gruppierungs- und Regelkanten-Logik`.

## Task 2: `renderableArt` 1:1 + DiagramView-Dispatch-Gerüst

**Files:** Modify `src/config/diagram-styles.ts`, `src/components/modules/architecture/diagram/DiagramView.tsx`; Test `src/__tests__/unit/diagram-styles.test.ts` (erweitern)

- [ ] **Step 1:** Test erweitern: `renderableArt('togaf')==='togaf'`, `renderableArt('datenfluss')==='datenfluss'` (statt bisher `'schichten'`).
- [ ] **Step 2:** Test rot.
- [ ] **Step 3:** `renderableArt()` so ändern, dass es `art` 1:1 zurückgibt (Phase-1-Kollabierung entfernen).
- [ ] **Step 4:** `DiagramView.tsx`: Dispatch erweitern — `capability`→CapabilityView, `datenfluss`→`DataFlowView` (in Task 4 real, hier zunächst Platzhalter-Import mit TODO NICHT erlaubt → Task 4 zuerst bauen ODER DataFlowView minimal in Task 4). **Reihenfolge:** Diesen Dispatch erst in Task 4/5 finalisieren; hier nur `renderableArt` ändern + Test. DiagramView-Änderung nach Task 4.
- [ ] **Step 5:** Test grün, tsc sauber, Commit `feat(architecture): renderableArt liefert alle Arten 1:1`.

## Task 3: EamMap `grouping`-Prop (TOGAF) + Band-Refs

**Files:** Modify `src/app/[locale]/(dashboard)/architecture/EamMap.tsx`, `messages/de.json`+`en.json`

- [ ] **Step 1:** i18n-Keys ergänzen (de+en): `togafBusiness`,`togafData`,`togafApplication`,`togafTechnology` (Cross nutzt bestehendes `eamCross`).
- [ ] **Step 2:** `EamMap` Prop `grouping?: 'layers'|'togaf'` (Default `'layers'`). Band-Rendering aus `layersBands`/`togafBands` (Task 1) ableiten statt hartcodiert. Jedes fluss-relevante Band bekommt `data-band="<id>"` + wird in einen Container mit `className="relative"` gerendert (für ConnectionLayer in Task 5). Bestehendes layers-Verhalten unverändert (visuelle Regression vermeiden).
- [ ] **Step 3:** `npx tsc --noEmit`, `npm run build` — sauber; bestehende EamMap-Tests grün.
- [ ] **Step 4:** Commit `feat(architecture): EamMap TOGAF-Gruppierung + Band-Anker`.

## Task 4: DataFlowView

**Files:** Create `src/components/modules/architecture/diagram/DataFlowView.tsx`; Test `src/__tests__/accessibility/dataflow-view-a11y.test.tsx`; Modify `messages/*`, `DiagramView.tsx`

- [ ] **Step 1:** i18n: `flowSources`,`flowPlatform`,`flowModels`,`flowConsumption`,`flowCross` (de+en, Sie-Form).
- [ ] **Step 2:** `DataFlowView` bauen: 4 Spalten (grid, responsive → Mobile gestapelt), Stufen aus `dataFlowStages` (Task 1), `ComponentCard`-Wiederverwendung, inline-SVG/CSS-Rechtspfeile zwischen Spalten (Abwärtspfeile auf Mobile), Querschnitt als dashed Fußleiste, `EmptyBandHint` bei leerer Stufe. Semantische Tokens, theme-sicher.
- [ ] **Step 3:** `DiagramView.tsx`: `datenfluss`→`<DataFlowView .../>` verdrahten (bekommt dieselben eamProps-Daten: activeComponents etc.).
- [ ] **Step 4:** a11y-Test (jest-axe, next-intl-Mock wie in bestehenden Tests). tsc/build sauber.
- [ ] **Step 5:** Commit `feat(architecture): DataFlowView (datengetriebene Sicht)`.

## Task 5: ConnectionLayer (SVG-Overlay, regelbasiert)

**Files:** Create `src/components/modules/architecture/diagram/ConnectionLayer.tsx`; Modify `DiagramView.tsx`

- [ ] **Step 1:** `ConnectionLayer` als Client-Komponente: Props `{ containerRef: RefObject<HTMLElement>, grouping: 'layers'|'togaf' }`. Misst per `data-band`-Attribut die Band-Rechtecke relativ zum Container (`getBoundingClientRect`), berechnet `ruleEdges` (Task 1, nur nicht-leere Bänder), zeichnet absolut positioniertes `<svg>` (pointer-events-none, aria-hidden) mit gekrümmten Pfaden (Quelle Unterkante-Mitte → Ziel Oberkante-Mitte) + Pfeilspitze (`<marker>`), Strich `stroke-[color:var(--color-line-strong)]` o. semantisch. `ResizeObserver` auf Container → Remeasure; `useLayoutEffect` Erstmessung; Cleanup.
- [ ] **Step 2:** `DiagramView.tsx`: für `art ∈ {schichten,togaf}` + `connections==='uml'` den EamMap-Wrapper mit `ref` versehen und `<ConnectionLayer containerRef grouping />` als Geschwister darüber legen.
- [ ] **Step 3:** tsc/build sauber. Manuell gedanklich: leere Bänder → keine Kante; Resize → Remeasure.
- [ ] **Step 4:** Commit `feat(architecture): ConnectionLayer — regelbasierte UML-Schichtflüsse`.

## Task 6: DiagramStyleSwitcher-Override + State-Refactor

**Files:** Modify `DiagramStyleSwitcher.tsx`, `ArchitecturePageClient.tsx`, `settings/SettingsPageClient.tsx`, `settings/page.tsx`, `messages/*`; Test `src/__tests__/accessibility/diagram-style-switcher-a11y.test.tsx` (erweitern)

- [ ] **Step 1:** i18n: `customizeView`,`artLabel`,`connectionsLabel`,`connBebauungsplan`,`connUml`; `artTogaf`/`artDatenfluss` „(demnächst)" entfernen.
- [ ] **Step 2:** `DiagramStyleSwitcher` Props erweitern: neben Presets `style: DiagramStyle` + `onStyleChange(patch: Partial<DiagramStyle>)`. Ausklappbarer „Ansicht anpassen ▾"-Bereich (aria-expanded) mit Art-Segmenten (Schichten/TOGAF/Datenfluss/Capability) + Verknüpfung-Toggle (nur bei art∈{schichten,togaf}). Aktiver Preset per Reverse-Match hervorgehoben.
- [ ] **Step 3:** `ArchitecturePageClient`: State von `activePreset:string` auf `diagramStyle:DiagramStyle` umstellen; `activePreset` abgeleitet (Reverse-Match); `changeStyle(patch)` merged+persistiert; `changePreset(key)` setzt Preset-Style. `presetTouched`/Executive-Capability-Default-Logik erhalten. Switcher-Aufrufe anpassen.
- [ ] **Step 4:** `settings/*`: denselben erweiterten Switcher nutzen (Default-Style-Wahl inkl. Art/Verknüpfung); page.tsx lädt `diagram_style` weiter.
- [ ] **Step 5:** a11y-Test erweitern (Override aufgeklappt). tsc/eslint/build sauber.
- [ ] **Step 6:** Commit `feat(architecture): Darstellungsart-Override im Diagramm-Umschalter + Style-State`.

## Task 7: Abschluss-Gate

- [ ] **Step 1:** `npm run test 2>&1 | tail -3 && npx tsc --noEmit && npx eslint src --max-warnings 0 && npm run build 2>&1 | grep -iE "Compiled|error TS"` — Baseline unverändert, tsc/eslint leer, „Compiled successfully".
- [ ] **Step 2:** Obsidian aktualisieren (Sprint-Log Phase 2).
- [ ] **Step 3:** finishing-a-development-branch → Merge nach main, Push, Deploy-Status prüfen.

---

## Self-Review (Autor)
- **Abdeckung:** ConnectionLayer (regelbasiert) ✓, DataFlowView ✓, TOGAF-Gruppierung ✓, Art-Override-UX ✓, Persistenz ✓, i18n ✓, a11y ✓. Phase 3 (Katalog-Kanten, PDF/Share je Stil) bewusst außen vor.
- **Typkonsistenz:** `DiagramStyle{art,connections,density}`, `BandId`/`FlowStage`, `grouping:'layers'|'togaf'` durchgängig.
- **Reihenfolge-Hinweis:** DiagramView-Dispatch für datenfluss erst in Task 4 final (Task 2 ändert nur renderableArt), ConnectionLayer-Verdrahtung in Task 5 — kein toter Import zwischendurch.

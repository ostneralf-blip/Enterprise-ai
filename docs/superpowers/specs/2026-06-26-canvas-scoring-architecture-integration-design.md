# Design: Canvas → Scoring → Architektur-Integration

**Datum:** 2026-06-26  
**Status:** Approved  
**GitHub Issue:** #45 (noch zu erstellen)

---

## Zusammenfassung

Canvas und Use-Case-Scoring werden als inhaltliche Vorstufe des Architektur-Generators verknüpft. Ein Nutzer erstellt zuerst einen Canvas (Use-Case-Definition), verknüpft diesen optional mit einem Scoring-Eintrag, und startet dann den Architektur-Wizard — der die Canvas- und Score-Daten nutzt, um Wizard-Felder vorzufüllen und Katalog-Komponenten dynamisch zu priorisieren.

---

## Entscheidungen (aus Brainstorming)

| Frage | Entscheidung |
|---|---|
| Modulreihenfolge | **B**: Canvas vor Scoring (Assessment → Canvas → Scoring → Governance → Compliance → Architektur → Summary) |
| Canvas-Scoring-Verknüpfung | **B**: Pull im Scoring — optionales `canvas_id`-Dropdown im Use-Case-Formular, 1:1-Relation, nachträglich wählbar |
| Architektur-Kontext | **B**: Kontext-Banner oben im Wizard — erkannte Tags sichtbar, Wizard-Felder vorausgefüllt, alles überschreibbar |

---

## Scope

**In Scope:**
- DB-Migration: `canvas_id` auf `use_cases`
- Menüreihenfolge tauschen (Canvas ↔ Scoring in `modules.ts`)
- Canvas-Dropdown im Use-Case-Formular
- `extractCanvasContext()` — catalog-driven Extraction-Funktion
- `recommendFromCatalog()` — ersetzt hardcoded Namen in `architecture-rules.ts`
- `ArchContextBanner`-Komponente im Architektur-Wizard
- Einstiegspunkt `/architecture?from=usecase&id=<id>`

**Out of Scope:**
- KI-basierte Extraction (deterministisch genug mit tag-basiertem Matching)
- Canvas-Felder strukturell erweitern (Freitext bleibt)
- Änderung am Canvas-Modul selbst

---

## Datenmodell

### Einzige DB-Änderung

```sql
ALTER TABLE use_cases
  ADD COLUMN canvas_id UUID REFERENCES canvases(id) ON DELETE SET NULL;
```

- Nullable — Canvas bleibt optional
- `ON DELETE SET NULL` — Canvas-Löschung zerstört keinen Scoring-Eintrag
- RLS: bestehende Policy auf `use_cases` deckt das ab (kein neues RLS nötig)

### Kein neues Canvas-Feld

Die Canvas-Felder (`problem`, `solution`, `data_sources`, `architecture`, `risks`, etc.) bleiben Freitext. Die Extraction liest sie kombiniert.

---

## Extraction-Architektur (`extractCanvasContext`)

### Interface

```typescript
// src/lib/canvas-context.ts (neue Datei)

interface CanvasContext {
  wizard_prefill: Partial<WizardAnswers>
  pre_scored_components: CatalogComponent[]      // Direkte Catalog-Treffer vor Wizard (Text-Matching)
  compliance_flags: CanvasComplianceFlag[]
  detected_tags: DetectedTag[]                   // Für den Banner
  confidence: number                             // 0–1 = (gesetzte wizard_prefill-Felder / 12 Gesamt-Felder)
}

type CanvasComplianceFlag = 'dsgvo_strict' | 'eu_ai_act_high' | 'eu_hosting_required'

interface DetectedTag {
  label: string
  type: 'score' | 'industry' | 'usecase' | 'platform' | 'compliance'
}

// Rollen kommen NICHT aus extractCanvasContext — sie hängen von den vollständigen WizardAnswers ab
// und werden ausschließlich über recommendFromCatalog() geliefert (nach Wizard-Abschluss).
export function extractCanvasContext(
  canvas: Canvas,
  useCase: UseCase,
  catalog: CatalogComponent[]       // roles-Parameter entfällt hier bewusst
): CanvasContext
```

### Schritt 1: Dynamisches Keyword-Vokabular aus Catalog

Statt hardcodierter Wortlisten werden Vokabulare aus dem Catalog gebaut:

```typescript
function buildVocabFromCatalog(catalog: CatalogComponent[]) {
  const byUseCaseType: Record<string, Set<string>> = {}
  for (const comp of catalog) {
    for (const uct of comp.use_case_types) {
      byUseCaseType[uct] ??= new Set()
      comp.tags.forEach(t => byUseCaseType[uct].add(t.toLowerCase()))
      byUseCaseType[uct].add(comp.name.toLowerCase())
      if (comp.vendor) byUseCaseType[uct].add(comp.vendor.toLowerCase())
    }
  }
  return byUseCaseType
}
```

Basiswörter als Fallback (wenn Catalog leer):

| UseCase-Typ | Basis-Keywords |
|---|---|
| `vision` | ocr, bildverarbeitung, dokument, scan, bild, erkennung, invoice |
| `generative` | llm, gpt, chat, genai, text, zusammenfassung, sprachmodell |
| `predictive` | forecast, prognose, anomalie, vorhersage, klassifikation |
| `automation` | rpa, workflow, automatisierung, prozess, roboter |

Neue Katalog-Einträge erweitern die Vokabulare automatisch — kein Code-Change nötig.

### Schritt 2: Canvas-Text gegen Catalog-Komponenten scoren

Kombinierter Canvas-Text: `canvas.solution + canvas.data_sources + canvas.architecture + canvas.problem`

```typescript
function scoreComponentAgainstText(
  component: CatalogComponent,
  canvasText: string
): number {
  const text = canvasText.toLowerCase()
  let score = 0
  if (text.includes(component.name.toLowerCase()))           score += 30
  if (component.vendor && text.includes(component.vendor.toLowerCase())) score += 15
  for (const tag of component.tags) {
    if (text.includes(tag.toLowerCase()))                    score += 5
  }
  return score
}
```

Komponenten mit `score >= 5` gelten als Direkttreffer → `pre_scored_components`.

### Schritt 3: WizardAnswers ableiten

`usecase`: Welche UseCase-Typ-Gruppe hat die meisten Keyword-Treffer im Canvas-Text?

`sap_landscape`:
- `canvas.data_sources + canvas.architecture` enthält "S/4HANA" oder "S4HANA" → `'full'`
- enthält "SAP" (ohne S/4) → `'partial'`
- `useCase.domain` enthält "SAP" → `'partial'`

`cloud_provider_hint`:
- Direkte Nennungen in `canvas.architecture`: Azure/Microsoft → `'azure'`, AWS/Amazon → `'aws'`, GCP/Google Cloud → `'gcp'`, SAP BTP → `'sap_btp'`
- Fallback: wenn SAP-Landscape erkannt → `'sap_btp'`

`industry`:
- `useCase.domain` gegen Mapping: Finance/Finanz → `'finance'`, Fertigung/Manufacturing → `'manufacturing'`, Gesundheit/Healthcare → `'healthcare_public'`, Handel/Retail → `'retail_consumer'`

`compliance`:
- `canvas.risks` enthält "DSGVO", "Datenschutz", "personenbezogen" → `'strict'`
- `canvas.risks` enthält "EU AI Act", "Hochrisiko" → `'strict'` + Flag `eu_ai_act_high`

### Schritt 4: Compliance-Flags

```typescript
const complianceFlags: CanvasComplianceFlag[] = []
const risks = canvas.data.risks.toLowerCase()
if (/dsgvo|datenschutz|personenbezogen/.test(risks))         complianceFlags.push('dsgvo_strict')
if (/eu ai act|hochrisiko|biometrisch/.test(risks))          complianceFlags.push('eu_ai_act_high')
if (/eu.hosting|frankfurt|on.premise|on-premise/.test(risks)) complianceFlags.push('eu_hosting_required')
```

Compliance-Flags haben zwei Effekte:
1. In `wizard_prefill`: `compliance: 'strict'`
2. In `recommendFromCatalog`: Komponenten mit `dsgvo_status: 'non_compliant'` werden harт ausgeschlossen (Score –1000)

---

## `recommendFromCatalog` (ersetzt hardcoded `recommendFromWizard`)

### Scoring einer Komponente gegen WizardAnswers

```typescript
function scoreComponentAgainstAnswers(
  component: CatalogComponent,
  answers: WizardAnswers
): number {
  let score = 0
  // Cloud-Provider (höchste Gewichtung)
  const providerMatch: Record<string, string> = {
    sap_btp: 'sap', azure: 'azure', aws: 'aws', gcp: 'gcp'
  }
  if (answers.cloud_provider_hint && providerMatch[answers.cloud_provider_hint] === component.cloud_provider)
    score += 20
  if (component.cloud_provider === 'independent') score += 5  // OSS immer relevant

  // Use-Case-Typ
  if (answers.usecase && component.use_case_types.includes(answers.usecase)) score += 15

  // SAP-Kompatibilität
  if (answers.sap_landscape && answers.sap_landscape !== 'none' && component.sap_compatible) score += 10

  // Infrastruktur
  if (answers.infra === 'onprem' && component.infra_types.includes('onprem')) score += 8
  if (answers.infra === 'hybrid' && component.infra_types.includes('hybrid')) score += 8
  if (answers.infra === 'cloud' && component.infra_types.includes('cloud'))   score += 5

  // Compliance
  if (answers.compliance === 'strict') {
    if (component.dsgvo_status === 'non_compliant') return -1000  // Hart ausschließen
    if (component.dsgvo_status === 'compliant')     score += 10
    if (component.hosting.some(h => ['eu', 'onprem'].includes(h))) score += 5
  }

  return score
}
```

### Rückgabe

```typescript
export function recommendFromCatalog(
  answers: WizardAnswers,
  catalog: CatalogComponent[],
  roles: CatalogRole[]
): {
  layers: { layer: ArchLayer; components: CatalogComponent[] }[]
  roles: CatalogRole[]
}
```

- Pro `architecture_layer`: top 4 Komponenten (Score > 0), absteigend sortiert
- Rollen: Score = +10 wenn `role.archetype_levels` den erkannten Archetyp (aus Assessment) enthält, +8 wenn `role.skills_required` zu `answers.usecase` passt (z.B. "Prompt Engineer" für generative), +5 für Basis-Rollen (AI Product Owner, Data Privacy Manager immer empfohlen)
- Backward-Kompatibilität: `recommendFromWizard` bleibt als Legacy-Fallback wenn `catalog.length === 0`

---

## Architektur-Wizard: Kontext-Banner

### Einstiegspunkt

`/architecture?from=usecase&id=<useCaseId>`

Beim Page-Load: UseCase laden → verknüpften Canvas laden (wenn `canvas_id` gesetzt) → `extractCanvasContext()` aufrufen.

### `ArchContextBanner`-Komponente

```
┌─────────────────────────────────────────────────────────────────┐
│  ◧ Kontext aus Canvas & Scoring erkannt                    [✕] │
│  ⊞ Quick Win · 4.2   🏢 Finance/SAP   👁 OCR/Vision           │
│  ⚖ DSGVO Strict   🔷 SAP BTP empfohlen                        │
│  5 von 12 Wizard-Schritten vorausgefüllt · Alle änderbar       │
└─────────────────────────────────────────────────────────────────┘
```

- Kollabierbar (default: offen)
- Tags kommen aus `context.detected_tags`
- "X von 12 vorausgefüllt" = Anzahl gesetzter Felder in `wizard_prefill`
- Jedes vorausgefüllte Wizard-Feld erhält einen kleinen `◧ Aus Canvas`-Marker
- Wenn kein Canvas verknüpft: Banner wird nicht gezeigt

### "Im Architektur-Generator öffnen"-Button

Im Use-Case-Scoring-Ergebnis/Detail:

```
[Im Architektur-Generator öffnen →]  → /architecture?from=usecase&id=<usecaseId>
```

---

## Modulreihenfolge

`src/config/modules.ts`: Canvas (Index 1) und Scoring/UseCase (Index 2) tauschen.

Sidebar und Guided Path zeigen dann:
1. Assessment
2. AI Use-Case Canvas
3. Use-Case Scoring
4. Governance Check
5. Compliance Check
6. Architektur-Generator
7. Executive Summary

---

## Canvas-Dropdown im Use-Case-Formular

`UseCaseForm.tsx` erhält ein optionales `canvases: Canvas[]`-Prop.

Ein neues Feld "Canvas verknüpfen (optional)":
- Dropdown mit allen Canvases des Nutzers
- Leer = kein Canvas verknüpft
- Bei Auswahl: `canvas_id` wird mit dem Use-Case gespeichert
- Kleiner Info-Text: "Verknüpfter Canvas wird im Architektur-Generator berücksichtigt."

API: `PUT /api/usecase/[id]` muss `canvas_id` als optionales Feld akzeptieren.

---

## Neue Datei: `src/lib/canvas-context.ts`

Enthält alle Extraction-Logik:
- `buildVocabFromCatalog(catalog)`
- `scoreComponentAgainstText(component, text)`
- `scoreComponentAgainstAnswers(component, answers)`
- `extractCanvasContext(canvas, useCase, catalog, roles)`
- `recommendFromCatalog(answers, catalog, roles)`

Max. ~200 Zeilen. Reine Funktionen, vollständig unit-testbar.

---

## Tests

| Ebene | Was |
|---|---|
| Unit | `extractCanvasContext` mit OCR+SAP-Fixture → erwartet `usecase: 'vision'`, `sap_landscape: 'partial'`, SAP AI Core in top components |
| Unit | `recommendFromCatalog` mit strict compliance → DSGVO-non-compliant Komponenten ausgeschlossen |
| Unit | `buildVocabFromCatalog` → neue Catalog-Einträge erweitern Vokabular |
| Security | `PUT /api/usecase/[id]` mit fremder `canvas_id` → 403 |
| A11y | `ArchContextBanner` kollabierbar via Tastatur |

---

## Migrations-Workflow

```bash
supabase migration new canvas_id_on_use_cases
# SQL: ALTER TABLE use_cases ADD COLUMN canvas_id UUID REFERENCES canvases(id) ON DELETE SET NULL;
supabase db push
supabase migration list  # beide Spalten müssen Wert zeigen
```

---

## Offene Fragen (keine Blocker)

- Soll der Banner auch erscheinen wenn Canvas-Text gematcht hat aber kein `canvas_id` gesetzt ist (d.h. Nutzer kommt direkt zu `/architecture` ohne Query-Param)? → Vorschlag: nein, nur bei explizitem Einstieg über Use-Case.
- Soll `recommendFromWizard` nach der Migration gelöscht oder als Deprecated markiert werden? → Vorschlag: Deprecated, erst löschen wenn alle Tests grün.

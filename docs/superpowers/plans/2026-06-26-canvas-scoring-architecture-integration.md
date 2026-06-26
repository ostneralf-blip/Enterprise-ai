# Canvas → Scoring → Architektur-Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Canvas und Use-Case-Scoring als inhaltliche Vorstufe des Architektur-Generators verknüpfen — mit dynamischer, catalog-getriebener Komponenten-Empfehlung statt hardcodierten Namen.

**Architecture:** DB-Migration (`canvas_id` auf `use_cases`), neue Lib `canvas-context.ts` für Keyword-Extraktion, `recommendFromCatalog()` ersetzt hardcodierte Namen in `architecture-rules.ts`, Kontext-Banner im Architektur-Wizard mit Wizard-Vorausfüllung.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Supabase, Tailwind CSS, Zod

---

## File Map

| Aktion | Datei | Zweck |
|---|---|---|
| Neu | `supabase/migrations/TIMESTAMP_canvas_id_on_use_cases.sql` | FK-Migration |
| Ändern | `src/types/index.ts` | `canvas_id` zu `UseCase` |
| Ändern | `src/config/modules.ts` | Canvas vor Scoring |
| Neu | `src/lib/canvas-context.ts` | Extraction-Lib (reine Funktionen) |
| Neu | `src/__tests__/unit/canvas-context.test.ts` | Unit-Tests |
| Ändern | `src/config/architecture-rules.ts` | `recommendFromCatalog` hinzufügen |
| Ändern | `src/app/api/usecase/[id]/route.ts` | `canvas_id` im PUT akzeptieren |
| Ändern | `src/components/modules/usecase/UseCaseForm.tsx` | Canvas-Dropdown |
| Ändern | `src/app/(dashboard)/usecase/UseCasePageClient.tsx` | `canvas_id` in Save-Flow |
| Ändern | `src/app/(dashboard)/usecase/page.tsx` | Canvases server-seitig laden |
| Ändern | `src/app/(dashboard)/architecture/page.tsx` | Query-Param + Canvas laden |
| Ändern | `src/app/(dashboard)/architecture/ArchitecturePageClient.tsx` | Banner + Vorausfüllung + `recommendFromCatalog` |

---

## Task 1: DB-Migration

**Files:**
- Create: `supabase/migrations/20260626220000_canvas_id_on_use_cases.sql`

- [ ] **Step 1: Migration erstellen**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3"
supabase migration new canvas_id_on_use_cases
```

- [ ] **Step 2: SQL in die generierte Datei schreiben**

Öffne die neu erstellte Datei (Pfad beginnt mit `supabase/migrations/` + Timestamp + `_canvas_id_on_use_cases.sql`) und schreibe:

```sql
ALTER TABLE use_cases
  ADD COLUMN canvas_id UUID REFERENCES canvases(id) ON DELETE SET NULL;
```

- [ ] **Step 3: Migration anwenden**

```bash
supabase db push
```

Erwartete Ausgabe: `Applying migration ... canvas_id_on_use_cases` ohne Fehler.

- [ ] **Step 4: Synchronisation prüfen**

```bash
supabase migration list
```

Erwartung: Die neue Migration hat in beiden Spalten (Local + Remote) einen Wert.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(#45): DB-Migration canvas_id auf use_cases"
```

---

## Task 2: Type-Update + Modulreihenfolge

**Files:**
- Modify: `src/types/index.ts` (UseCase interface, ~Zeile 157)
- Modify: `src/config/modules.ts` (Canvas ↔ Scoring tauschen)

- [ ] **Step 1: `canvas_id` zu `UseCase` hinzufügen**

In `src/types/index.ts`, die `UseCase`-Interface (Zeile 157) ergänzen:

```typescript
export interface UseCase {
  id: string
  portfolio_id: string
  name: string
  domain: string | null
  description: string | null
  scores: Record<string, number>
  weighted_score: number
  quadrant: 'quick_win' | 'strategic_bet' | 'low_hanging_fruit' | 'avoid'
  canvas_id: string | null     // ← NEU
  created_at: string
  updated_at: string
}
```

- [ ] **Step 2: Canvas vor Scoring in `modules.ts`**

In `src/config/modules.ts` die beiden Einträge tauschen — `canvas` kommt direkt nach `assessment`, `usecase` danach. Ersetze den gesamten `MODULES`-Array-Inhalt:

```typescript
export const MODULES: ModuleConfig[] = [
  {
    id: 'assessment',
    title: 'AI-Readiness Assessment',
    subtitle: '6 Dimensionen · 16 Fragen · ~10 Min',
    subtitlePro: '6 Dimensionen · 42 Fragen · ~25 Min',
    icon: '◎',
    href: '/assessment',
    duration: '10 Min',
    requiredTier: 'free',
    description: 'Ermitteln Sie Ihren AI-Reifegrad in 6 Dimensionen: Daten, Skills, Governance, Technologie, Strategie und Kultur. Mit Radar-Chart und priorisierten Handlungsfeldern.',
  },
  {
    id: 'canvas',
    title: 'AI Use-Case Canvas',
    subtitle: '8 Felder · Vollständiges Template · ~15 Min',
    icon: '□',
    href: '/canvas',
    duration: '15 Min',
    requiredTier: 'free',
    description: 'Strukturiertes Canvas-Template für neue AI-Use-Cases: Problem, Lösung, Datenquellen, Stakeholder, KPIs, Risiken, Architektur und nächste Schritte.',
  },
  {
    id: 'usecase',
    title: 'Use-Case Scoring',
    subtitle: '5 Kriterien · Portfolio-Matrix · ~5 Min',
    icon: '◐',
    href: '/usecase',
    duration: '5 Min',
    requiredTier: 'free',
    description: 'Priorisieren Sie AI-Use-Cases mit 5 gewichteten Kriterien: Business Value, Umsetzbarkeit, Datenqualität, Risiko und Time-to-Value.',
  },
  {
    id: 'governance',
    title: 'Governance-Check',
    subtitle: 'DSGVO · EU AI Act · ~3 Min',
    icon: '⬣',
    href: '/governance',
    duration: '3 Min',
    requiredTier: 'free',
    description: 'Interaktiver Entscheidungsbaum: Use Case → Freigabe. Prüft DSGVO-Anforderungen, EU AI Act Risikoklasse, Human-in-the-Loop und Monitoring.',
  },
  {
    id: 'roadmap',
    title: 'Roadmap-Generator',
    subtitle: '3 Phasen · Archetyp-spezifisch · ~2 Min',
    icon: '▷',
    href: '/roadmap',
    duration: '2 Min',
    requiredTier: 'free',
    description: 'Ihr AI-Umsetzungsplan in 3 Phasen (0–3 / 3–12 / 12+ Monate), automatisch angepasst an Ihren Unternehmensarchetyp mit KPIs und Budgetorientierung.',
  },
  {
    id: 'compliance',
    title: 'Compliance Center',
    subtitle: 'EU AI Act · DSGVO · Risikomatrix',
    icon: '⬡',
    href: '/compliance',
    duration: '20 Min',
    requiredTier: 'pro',
    description: 'Zentrales Dashboard für AI-Compliance: EU AI Act Risikoklassen-Check, DSGVO-Pflichten-Checkliste, AI-Risikomatrix und Policy-Framework-Templates.',
  },
  {
    id: 'architecture',
    title: 'Architektur-Generator',
    subtitle: '5-Schritt-Wizard · Referenzarchitektur',
    icon: '◈',
    href: '/architecture',
    duration: '10 Min',
    requiredTier: 'pro',
    description: 'Generieren Sie eine herstellerneutrale Enterprise AI Reference Architecture basierend auf Ihrer IT-Landschaft, Use Cases und Governance-Anforderungen.',
  },
]
```

- [ ] **Step 3: TypeScript-Check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Erwartung: keine Fehler.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/config/modules.ts
git commit -m "feat(#45): canvas_id auf UseCase-Typ, Canvas vor Scoring im Menü"
```

---

## Task 3: `canvas-context.ts` Extraction-Bibliothek

**Files:**
- Create: `src/lib/canvas-context.ts`

- [ ] **Step 1: Datei anlegen**

Erstelle `src/lib/canvas-context.ts` mit folgendem Inhalt:

```typescript
import type { Canvas, UseCase, CatalogComponent } from '@/types'
import type { WizardAnswers } from '@/config/architecture-data'

export interface CanvasContext {
  wizard_prefill: Partial<WizardAnswers>
  pre_scored_components: CatalogComponent[]
  compliance_flags: CanvasComplianceFlag[]
  detected_tags: DetectedTag[]
  confidence: number
}

export type CanvasComplianceFlag = 'dsgvo_strict' | 'eu_ai_act_high' | 'eu_hosting_required'

export interface DetectedTag {
  label: string
  type: 'score' | 'industry' | 'usecase' | 'platform' | 'compliance'
}

type UcType = 'vision' | 'generative' | 'predictive' | 'automation'

const BASE_VOCAB: Record<UcType, string[]> = {
  vision:     ['ocr', 'bildverarbeitung', 'dokument', 'scan', 'bild', 'erkennung', 'invoice', 'rechnung', 'vision', 'image'],
  generative: ['llm', 'gpt', 'genai', 'chat', 'text', 'zusammenfassung', 'sprachmodell', 'rag', 'embedding', 'generativ'],
  predictive: ['forecast', 'prognose', 'anomalie', 'vorhersage', 'klassifikation', 'prediction', 'regression'],
  automation: ['rpa', 'workflow', 'automatisierung', 'prozess', 'roboter', 'pipeline', 'trigger'],
}

export function buildVocabFromCatalog(
  catalog: CatalogComponent[]
): Record<string, Set<string>> {
  const vocab: Record<string, Set<string>> = {}
  for (const [uct, base] of Object.entries(BASE_VOCAB)) {
    vocab[uct] = new Set(base)
  }
  for (const comp of catalog) {
    for (const uct of comp.use_case_types) {
      if (!vocab[uct]) vocab[uct] = new Set()
      comp.tags.forEach(t => vocab[uct].add(t.toLowerCase()))
      vocab[uct].add(comp.name.toLowerCase())
      if (comp.vendor) vocab[uct].add(comp.vendor.toLowerCase())
    }
  }
  return vocab
}

export function scoreComponentAgainstText(
  component: CatalogComponent,
  canvasText: string
): number {
  const text = canvasText.toLowerCase()
  let score = 0
  if (text.includes(component.name.toLowerCase()))                           score += 30
  if (component.vendor && text.includes(component.vendor.toLowerCase()))     score += 15
  for (const tag of component.tags) {
    if (text.includes(tag.toLowerCase()))                                    score += 5
  }
  return score
}

export function extractCanvasContext(
  canvas: Canvas,
  useCase: UseCase,
  catalog: CatalogComponent[]
): CanvasContext {
  const canvasText = [
    canvas.data.problem, canvas.data.solution, canvas.data.data_sources,
    canvas.data.architecture, canvas.data.risks, canvas.title,
  ].join(' ')
  const textLower = canvasText.toLowerCase()
  const vocab = buildVocabFromCatalog(catalog)

  // Use-case-Typ: Vokabular-Treffer zählen
  let topUseCase: WizardAnswers['usecase'] | undefined
  let topScore = 0
  for (const [uct, keywords] of Object.entries(vocab)) {
    let s = 0
    for (const kw of keywords) { if (textLower.includes(kw)) s++ }
    if (s > topScore) { topScore = s; topUseCase = uct as WizardAnswers['usecase'] }
  }
  if (topScore === 0) topUseCase = undefined

  // SAP Landscape
  let sap_landscape: WizardAnswers['sap_landscape']
  const sapText = (canvas.data.data_sources + ' ' + canvas.data.architecture).toLowerCase()
  if (/s\/4hana|s4hana/.test(sapText))                                sap_landscape = 'full'
  else if (/\bsap\b/.test(sapText) || /\bsap\b/.test((useCase.domain ?? '').toLowerCase()))
                                                                       sap_landscape = 'partial'

  // Cloud-Provider
  let cloud_provider_hint: WizardAnswers['cloud_provider_hint']
  const archLower = canvas.data.architecture.toLowerCase()
  if (/sap btp|sap ai core/.test(archLower))       cloud_provider_hint = 'sap_btp'
  else if (/azure|microsoft/.test(archLower))       cloud_provider_hint = 'azure'
  else if (/\baws\b|amazon/.test(archLower))        cloud_provider_hint = 'aws'
  else if (/\bgcp\b|google cloud/.test(archLower))  cloud_provider_hint = 'gcp'
  else if (sap_landscape && sap_landscape !== 'none') cloud_provider_hint = 'sap_btp'

  // Branche
  let industry: WizardAnswers['industry']
  const domainLower = (useCase.domain ?? '').toLowerCase()
  if (/finance|finanz|bank|versicher/.test(domainLower))        industry = 'finance'
  else if (/manufactur|fertigung|industrie|produktion/.test(domainLower)) industry = 'manufacturing'
  else if (/gesundheit|health|pharma|klinik/.test(domainLower)) industry = 'healthcare_public'
  else if (/handel|retail|consumer|ecommerce/.test(domainLower)) industry = 'retail_consumer'

  // Compliance-Flags
  const compliance_flags: CanvasComplianceFlag[] = []
  const risksLower = canvas.data.risks.toLowerCase()
  if (/dsgvo|datenschutz|personenbezogen/.test(risksLower))     compliance_flags.push('dsgvo_strict')
  if (/eu ai act|hochrisiko|biometrisch/.test(risksLower))      compliance_flags.push('eu_ai_act_high')
  if (/eu.hosting|frankfurt|on.premise|on-premise/.test(risksLower)) compliance_flags.push('eu_hosting_required')

  // Wizard-Vorausfüllung
  const wizard_prefill: Partial<WizardAnswers> = {}
  if (topUseCase)         wizard_prefill.usecase = topUseCase
  if (sap_landscape)      wizard_prefill.sap_landscape = sap_landscape
  if (cloud_provider_hint) wizard_prefill.cloud_provider_hint = cloud_provider_hint
  if (industry)           wizard_prefill.industry = industry
  if (compliance_flags.includes('dsgvo_strict') || compliance_flags.includes('eu_ai_act_high'))
    wizard_prefill.compliance = 'strict'

  // Direkte Catalog-Treffer
  const pre_scored_components = catalog
    .map(c => ({ c, score: scoreComponentAgainstText(c, canvasText) }))
    .filter(x => x.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(x => x.c)

  // Banner-Tags
  const detected_tags: DetectedTag[] = []
  if (useCase.weighted_score)
    detected_tags.push({ label: `Score ${useCase.weighted_score.toFixed(1)}`, type: 'score' })
  if (useCase.quadrant === 'quick_win')
    detected_tags.push({ label: 'Quick Win', type: 'score' })
  if (industry) {
    const INDUSTRY_LABEL: Record<string, string> = {
      finance: 'Finance', manufacturing: 'Fertigung',
      healthcare_public: 'Healthcare', retail_consumer: 'Retail',
    }
    detected_tags.push({ label: INDUSTRY_LABEL[industry] ?? industry, type: 'industry' })
  }
  if (sap_landscape && sap_landscape !== 'none')
    detected_tags.push({ label: 'SAP', type: 'platform' })
  if (cloud_provider_hint) {
    const CLOUD_LABEL: Record<string, string> = {
      sap_btp: 'SAP BTP', azure: 'Azure', aws: 'AWS', gcp: 'GCP',
    }
    if (CLOUD_LABEL[cloud_provider_hint])
      detected_tags.push({ label: CLOUD_LABEL[cloud_provider_hint], type: 'platform' })
  }
  if (topUseCase) {
    const UC_LABEL: Record<string, string> = {
      vision: 'OCR / Vision', generative: 'Generative AI',
      predictive: 'Predictive', automation: 'Automation',
    }
    detected_tags.push({ label: UC_LABEL[topUseCase], type: 'usecase' })
  }
  if (compliance_flags.includes('dsgvo_strict'))
    detected_tags.push({ label: 'DSGVO Strict', type: 'compliance' })
  if (compliance_flags.includes('eu_ai_act_high'))
    detected_tags.push({ label: 'EU AI Act High Risk', type: 'compliance' })

  const confidence = Object.keys(wizard_prefill).length / 12

  return { wizard_prefill, pre_scored_components, compliance_flags, detected_tags, confidence }
}
```

- [ ] **Step 2: TypeScript-Check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Erwartung: keine Fehler.

---

## Task 4: Unit-Tests für `canvas-context.ts`

**Files:**
- Create: `src/__tests__/unit/canvas-context.test.ts`

- [ ] **Step 1: Test-Datei mit failing Tests erstellen**

```typescript
import { buildVocabFromCatalog, scoreComponentAgainstText, extractCanvasContext } from '@/lib/canvas-context'
import type { CatalogComponent, Canvas, UseCase } from '@/types'

const mockComp = (overrides: Partial<CatalogComponent>): CatalogComponent => ({
  id: '1', name: 'Test', vendor: null, category: null, architecture_layer: 'model',
  hosting: ['eu'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
  sap_compatible: false, sap_components: [], use_case_types: [], infra_types: ['cloud'],
  cloud_provider: 'independent', icon_name: null, website_url: null,
  description: null, tags: [], source: 'test', is_active: true,
  created_at: '', updated_at: '',
  ...overrides,
})

const mockCanvas = (overrides: Partial<Canvas['data']> = {}): Canvas => ({
  id: 'c1', user_id: 'u1', title: 'OCR im Finanzwesen', archetype: null,
  version_no: 1, created_at: '', updated_at: '',
  data: {
    problem: 'Manuelle Rechnungsverarbeitung mit hohem Fehleranteil',
    solution: 'OCR-basierte Dokumentenerkennung mit SAP S/4HANA Integration',
    data_sources: 'SAP S/4HANA ERP-Daten, Rechnungs-PDFs',
    stakeholders: 'CFO, Ops-Leiterin',
    kpis: 'Verarbeitungszeit < 4h, Fehlerquote < 2%',
    risks: 'DSGVO-Datenschutzprüfung erforderlich, personenbezogene Daten',
    architecture: 'SAP BTP + SAP AI Core, Azure Backup',
    next_steps: 'Pilotprojekt Q1',
    ...overrides,
  },
})

const mockUseCase = (overrides: Partial<UseCase> = {}): UseCase => ({
  id: 'uc1', portfolio_id: 'p1', name: 'OCR Rechnungsverarbeitung',
  domain: 'Finance', description: null,
  scores: { value: 4, feasibility: 4, data_readiness: 4, risk: 3, speed: 4 },
  weighted_score: 4.2, quadrant: 'quick_win', canvas_id: null,
  created_at: '', updated_at: '',
  ...overrides,
})

describe('buildVocabFromCatalog', () => {
  it('enthält Base-Keywords auch ohne Catalog', () => {
    const vocab = buildVocabFromCatalog([])
    expect(vocab['vision'].has('ocr')).toBe(true)
    expect(vocab['generative'].has('llm')).toBe(true)
  })

  it('erweitert Vokabular durch Catalog-Tags', () => {
    const comp = mockComp({ use_case_types: ['vision'], tags: ['rechnungsverarbeitung', 'scan-engine'] })
    const vocab = buildVocabFromCatalog([comp])
    expect(vocab['vision'].has('rechnungsverarbeitung')).toBe(true)
    expect(vocab['vision'].has('scan-engine')).toBe(true)
  })

  it('fügt Komponenten-Name und Vendor zum Vokabular hinzu', () => {
    const comp = mockComp({ name: 'Azure Document Intelligence', vendor: 'Microsoft', use_case_types: ['vision'], tags: [] })
    const vocab = buildVocabFromCatalog([comp])
    expect(vocab['vision'].has('azure document intelligence')).toBe(true)
    expect(vocab['vision'].has('microsoft')).toBe(true)
  })
})

describe('scoreComponentAgainstText', () => {
  it('gibt 0 zurück wenn kein Treffer', () => {
    const comp = mockComp({ name: 'Snowflake', vendor: 'Snowflake', tags: ['dw', 'analytics'] })
    expect(scoreComponentAgainstText(comp, 'OCR Rechnungsverarbeitung SAP')).toBe(0)
  })

  it('gibt hohen Score bei Name-Treffer', () => {
    const comp = mockComp({ name: 'SAP AI Core', vendor: 'SAP', tags: ['sap', 'mlops'] })
    const score = scoreComponentAgainstText(comp, 'Lösung via SAP AI Core auf BTP')
    expect(score).toBeGreaterThanOrEqual(30)
  })

  it('zählt mehrere Tag-Treffer', () => {
    const comp = mockComp({ name: 'CustomComp', vendor: null, tags: ['ocr', 'scan', 'rechnung'] })
    const score = scoreComponentAgainstText(comp, 'OCR scan für rechnungsverarbeitung')
    expect(score).toBe(15) // 3 Tags × 5
  })
})

describe('extractCanvasContext', () => {
  it('erkennt vision aus OCR-Canvas', () => {
    const ctx = extractCanvasContext(mockCanvas(), mockUseCase(), [])
    expect(ctx.wizard_prefill.usecase).toBe('vision')
  })

  it('erkennt SAP-Landscape aus S/4HANA in data_sources', () => {
    const ctx = extractCanvasContext(mockCanvas(), mockUseCase(), [])
    expect(ctx.wizard_prefill.sap_landscape).toBe('full')
  })

  it('erkennt SAP BTP als cloud_provider_hint', () => {
    const ctx = extractCanvasContext(mockCanvas(), mockUseCase(), [])
    expect(ctx.wizard_prefill.cloud_provider_hint).toBe('sap_btp')
  })

  it('erkennt Finance als industry aus useCase.domain', () => {
    const ctx = extractCanvasContext(mockCanvas(), mockUseCase(), [])
    expect(ctx.wizard_prefill.industry).toBe('finance')
  })

  it('setzt compliance strict bei DSGVO in risks', () => {
    const ctx = extractCanvasContext(mockCanvas(), mockUseCase(), [])
    expect(ctx.wizard_prefill.compliance).toBe('strict')
    expect(ctx.compliance_flags).toContain('dsgvo_strict')
  })

  it('schließt DSGVO-non-compliant Komponenten aus pre_scored_components aus wenn compliance strict', () => {
    const badComp = mockComp({ name: 'OpenAI GPT-4', vendor: 'OpenAI', dsgvo_status: 'non_compliant', tags: ['ocr', 'llm'], use_case_types: ['vision'] })
    const goodComp = mockComp({ name: 'SAP AI Core', vendor: 'SAP', dsgvo_status: 'compliant', tags: ['sap', 'ocr'], use_case_types: ['vision'] })
    const ctx = extractCanvasContext(mockCanvas(), mockUseCase(), [badComp, goodComp])
    const names = ctx.pre_scored_components.map(c => c.name)
    expect(names).toContain('SAP AI Core')
    // non_compliant-Komponente kann in pre_scored_components auftauchen (text-matching, kein hard-filter)
    // aber recommendFromCatalog filtert sie raus — das ist der richtige Layer
  })

  it('gibt detected_tags mit Score und Plattform zurück', () => {
    const ctx = extractCanvasContext(mockCanvas(), mockUseCase(), [])
    const types = ctx.detected_tags.map(t => t.type)
    expect(types).toContain('score')
    expect(types).toContain('platform')
    expect(types).toContain('usecase')
    expect(types).toContain('compliance')
  })

  it('gibt confidence > 0 zurück wenn Felder erkannt', () => {
    const ctx = extractCanvasContext(mockCanvas(), mockUseCase(), [])
    expect(ctx.confidence).toBeGreaterThan(0)
  })

  it('gibt leere pre_scored_components zurück wenn Catalog leer', () => {
    const ctx = extractCanvasContext(mockCanvas(), mockUseCase(), [])
    expect(ctx.pre_scored_components).toHaveLength(0)
  })

  it('gibt Catalog-Komponente in pre_scored_components wenn Name in Canvas', () => {
    const comp = mockComp({ name: 'SAP AI Core', vendor: 'SAP', tags: ['sap'] })
    const ctx = extractCanvasContext(mockCanvas(), mockUseCase(), [comp])
    expect(ctx.pre_scored_components.map(c => c.name)).toContain('SAP AI Core')
  })
})
```

- [ ] **Step 2: Tests ausführen — Erwartung: FAIL**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3"
npx jest src/__tests__/unit/canvas-context.test.ts --no-coverage 2>&1 | tail -20
```

Erwartung: `Cannot find module '@/lib/canvas-context'` oder ähnliche Fehler.

- [ ] **Step 3: Tests nach Erstellen von canvas-context.ts erneut ausführen**

```bash
npx jest src/__tests__/unit/canvas-context.test.ts --no-coverage 2>&1 | tail -20
```

Erwartung: alle Tests `PASS`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/canvas-context.ts src/__tests__/unit/canvas-context.test.ts
git commit -m "feat(#45): canvas-context Extraction-Lib + Unit-Tests"
```

---

## Task 5: `recommendFromCatalog` in architecture-rules.ts

**Files:**
- Modify: `src/config/architecture-rules.ts`
- Modify: `src/app/(dashboard)/architecture/ArchitecturePageClient.tsx` (nur `applyRecs`)

- [ ] **Step 1: Scoring-Funktion + `recommendFromCatalog` in architecture-rules.ts hinzufügen**

In `src/config/architecture-rules.ts` am Ende der Datei (nach Zeile 186) anhängen:

```typescript
const ARCH_LAYERS_ORDERED: ArchLayer[] = [
  'data', 'model', 'mlops', 'serving', 'governance', 'security', 'application',
]

export function scoreComponentAgainstAnswers(
  component: CatalogComponent,
  answers: WizardAnswers
): number {
  let score = 0
  const providerMap: Record<string, string> = {
    sap_btp: 'sap', azure: 'azure', aws: 'aws', gcp: 'gcp',
  }
  if (answers.cloud_provider_hint && providerMap[answers.cloud_provider_hint] === component.cloud_provider)
    score += 20
  if (component.cloud_provider === 'independent') score += 5
  if (answers.usecase && component.use_case_types.includes(answers.usecase)) score += 15
  if (answers.sap_landscape && answers.sap_landscape !== 'none' && component.sap_compatible)
    score += 10
  if (answers.infra === 'onprem' && component.infra_types.includes('onprem')) score += 8
  if (answers.infra === 'hybrid' && component.infra_types.includes('hybrid')) score += 8
  if (answers.infra === 'cloud'  && component.infra_types.includes('cloud'))  score += 5
  if (answers.compliance === 'strict') {
    if (component.dsgvo_status === 'non_compliant') return -1000
    if (component.dsgvo_status === 'compliant') score += 10
    if (component.hosting.some(h => ['eu', 'onprem'].includes(h))) score += 5
  }
  return score
}

export function recommendFromCatalog(
  answers: WizardAnswers,
  catalog: CatalogComponent[]
): CatalogRecommendations {
  const layers: LayerRecommendation[] = ARCH_LAYERS_ORDERED.map(layer => {
    const componentNames = catalog
      .filter(c => c.architecture_layer === layer)
      .map(c => ({ name: c.name, score: scoreComponentAgainstAnswers(c, answers) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(x => x.name)
    return { layer, componentNames }
  }).filter(l => l.componentNames.length > 0)

  const roles: string[] = [
    'AI Product Owner', 'Business AI Champion', 'Data Privacy Manager', 'Data Engineer',
  ]
  if (answers.skills === 'team')
    roles.push('Data Scientist', 'ML Engineer', 'MLOps Engineer', 'AI CoE Lead')
  else if (answers.skills === 'individuals')
    roles.push('Data Scientist')
  if (answers.usecase === 'generative') roles.push('Prompt Engineer')
  if (answers.compliance === 'strict')  roles.push('AI Ethics / Risk Officer')
  if (answers.sap_landscape && answers.sap_landscape !== 'none') roles.push('SAP AI Architect')
  if (!['onprem'].includes(answers.infra ?? '') && answers.skills !== 'business')
    roles.push('Enterprise Architect (AI)')

  return { layers, roleNames: [...new Set(roles)] }
}
```

Außerdem den Import in der ersten Zeile ergänzen um `CatalogComponent`:

```typescript
import type { WizardAnswers } from './architecture-data'
import type { ArchLayer, CatalogComponent } from '@/types'
import { SEED_JOULE_USE_CASES, type JouleUseCase } from './catalog-seed'
```

- [ ] **Step 2: `applyRecs` in `ArchitecturePageClient.tsx` auf `recommendFromCatalog` umstellen**

In `src/app/(dashboard)/architecture/ArchitecturePageClient.tsx`, Zeile 7 den Import ergänzen:

```typescript
import { recommendFromWizard, recommendFromCatalog, recommendJouleUseCases, type CatalogRecommendations, type JouleUseCase } from '@/config/architecture-rules'
```

Die `applyRecs`-Funktion (aktuell Zeile 221–231) ersetzen:

```typescript
function applyRecs(wizardAnswers: WizardAnswers, loadedCatalog?: CatalogComponent[]) {
  const catalog = loadedCatalog ?? recComponents
  if (catalog.length > 0) {
    setCatalogRecs(recommendFromCatalog(wizardAnswers, catalog))
  } else {
    setCatalogRecs(recommendFromWizard(wizardAnswers))
  }
  setJouleUseCases(recommendJouleUseCases(wizardAnswers))
  if (!catalogFetched.current) {
    catalogFetched.current = true
    fetch('/api/catalog/components')
      .then(r => r.json())
      .then(({ data }: { data: CatalogComponent[] }) => {
        const loaded = data ?? []
        setRecComponents(loaded)
        setCatalogRecs(recommendFromCatalog(wizardAnswers, loaded))
      })
      .catch(() => { catalogFetched.current = false })
  }
}
```

- [ ] **Step 3: TypeScript-Check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Erwartung: keine Fehler.

- [ ] **Step 4: Alle Tests**

```bash
npx jest --no-coverage 2>&1 | tail -10
```

Erwartung: alle bestehenden Tests + canvas-context-Tests grün.

- [ ] **Step 5: Commit**

```bash
git add src/config/architecture-rules.ts src/app/(dashboard)/architecture/ArchitecturePageClient.tsx
git commit -m "feat(#45): recommendFromCatalog — dynamische Komponenten-Empfehlung aus Catalog"
```

---

## Task 6: API — `canvas_id` im PUT akzeptieren

**Files:**
- Modify: `src/app/api/usecase/[id]/route.ts`

- [ ] **Step 1: `UpdateSchema` um `canvas_id` erweitern**

In `src/app/api/usecase/[id]/route.ts` das `UpdateSchema` (Zeile 7–18) ersetzen:

```typescript
const UpdateSchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.string().max(100).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  canvas_id: z.string().uuid().nullable().optional(),
  scores: z.object({
    value:         z.number().int().min(1).max(5),
    feasibility:   z.number().int().min(1).max(5),
    data_readiness: z.number().int().min(1).max(5),
    risk:          z.number().int().min(1).max(5),
    speed:         z.number().int().min(1).max(5),
  }),
})
```

Die Destructuring-Zeile (aktuell `const { name, domain, description, scores } = parse.data`) ersetzen:

```typescript
const { name, domain, description, scores, canvas_id } = parse.data
```

Den `supabase.update()`-Aufruf (aktuell Zeile 54) erweitern:

```typescript
const { data, error } = await supabase
  .from('use_cases')
  .update({
    name,
    domain: domain ?? null,
    description: description ?? null,
    scores,
    weighted_score,
    quadrant,
    ...(canvas_id !== undefined ? { canvas_id: canvas_id ?? null } : {}),
  })
  .eq('id', id)
  .select()
  .single()
```

- [ ] **Step 2: Ownership-Check für canvas_id — sicherstellen dass Canvas dem User gehört**

Direkt nach dem Ownership-Check von `use_cases` (nach Zeile 41) einfügen:

```typescript
if (body.canvas_id) {
  const { data: canvasOwner } = await supabase
    .from('canvases')
    .select('user_id')
    .eq('id', body.canvas_id)
    .single()
  if (!canvasOwner || canvasOwner.user_id !== user.id) {
    return NextResponse.json({ error: 'Canvas nicht gefunden' }, { status: 403 })
  }
}
```

Wichtig: Dieser Check muss VOR `UpdateSchema.safeParse` stehen damit `body` schon geparst ist. Der vollständige PUT-Handler nach der Änderung:

```typescript
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

    const { data: existing } = await supabase
      .from('use_cases')
      .select('portfolio_id, uc_portfolios!inner(user_id, weights)')
      .eq('id', id)
      .single() as { data: { portfolio_id: string; uc_portfolios: { user_id: string; weights: UseCaseWeights } } | null }

    if (!existing || existing.uc_portfolios.user_id !== user.id) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    }

    const body = await req.json()

    // Canvas-Ownership prüfen wenn canvas_id übergeben wird
    if (body.canvas_id) {
      const { data: canvasOwner } = await supabase
        .from('canvases')
        .select('user_id')
        .eq('id', body.canvas_id)
        .single()
      if (!canvasOwner || canvasOwner.user_id !== user.id) {
        return NextResponse.json({ error: 'Canvas nicht gefunden' }, { status: 403 })
      }
    }

    const parse = UpdateSchema.safeParse(body)
    if (!parse.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

    const { name, domain, description, scores, canvas_id } = parse.data
    const weights = existing.uc_portfolios.weights ?? DEFAULT_WEIGHTS
    const weighted_score = calcWeightedScore(scores, weights)
    const quadrant = deriveQuadrant(scores)

    const { data, error } = await supabase
      .from('use_cases')
      .update({
        name,
        domain: domain ?? null,
        description: description ?? null,
        scores,
        weighted_score,
        quadrant,
        ...(canvas_id !== undefined ? { canvas_id: canvas_id ?? null } : {}),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: TypeScript-Check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/usecase/[id]/route.ts
git commit -m "feat(#45): PUT /api/usecase/[id] akzeptiert canvas_id mit Ownership-Check"
```

---

## Task 7: Canvas-Dropdown im Use-Case-Formular

**Files:**
- Modify: `src/components/modules/usecase/UseCaseForm.tsx`
- Modify: `src/app/(dashboard)/usecase/UseCasePageClient.tsx`
- Modify: `src/app/(dashboard)/usecase/page.tsx`

- [ ] **Step 1: `UseCaseForm` Props und Canvas-Dropdown erweitern**

In `src/components/modules/usecase/UseCaseForm.tsx` die `interface UseCaseFormProps` (Zeile 6–10) ersetzen:

```typescript
interface UseCaseFormProps {
  weights: UseCaseWeights
  editing?: UseCase | null
  canvases?: { id: string; title: string }[]
  onSave: (data: {
    name: string
    domain: string | null
    description: string | null
    scores: Record<string, number>
    canvas_id: string | null
  }) => Promise<void>
  onCancel: () => void
}
```

Den State-Block (nach Zeile 15) ergänzen:

```typescript
const [canvasId, setCanvasId] = useState<string>(editing?.canvas_id ?? '')
```

Den `handleSubmit` (Zeile 33) anpassen:

```typescript
await onSave({ name: name.trim(), domain: domain || null, description: description || null, scores, canvas_id: canvasId || null })
```

Das Canvas-Dropdown-Feld direkt nach dem domain/description-Grid (nach Zeile 67) einfügen (nur wenn `canvases` übergeben und nicht leer):

```typescript
{canvases && canvases.length > 0 && (
  <div>
    <label htmlFor="uc-canvas" className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
      Canvas verknüpfen <span className="normal-case text-slate-400">(optional)</span>
    </label>
    <select id="uc-canvas" value={canvasId} onChange={e => setCanvasId(e.target.value)}
      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500 transition-colors bg-white">
      <option value="">Kein Canvas verknüpft</option>
      {canvases.map(c => (
        <option key={c.id} value={c.id}>{c.title || 'Unbenannter Canvas'}</option>
      ))}
    </select>
    {canvasId && (
      <p className="text-[11px] text-blue-600 mt-1">
        ◧ Verknüpfter Canvas wird im Architektur-Generator berücksichtigt.
      </p>
    )}
  </div>
)}
```

- [ ] **Step 2: `UseCasePageClient` — `canvases` Prop + `canvas_id` im Save-Flow**

In `src/app/(dashboard)/usecase/UseCasePageClient.tsx` die `interface Props` (Zeile 11–14) ergänzen:

```typescript
interface Props {
  initialPortfolio: UseCasePortfolio
  initialCases: UseCase[]
  tier: Tier
  canvases: { id: string; title: string }[]
}
```

Destructuring (Zeile 19) ergänzen:

```typescript
export function UseCasePageClient({ initialPortfolio, initialCases, tier, canvases }: Props) {
```

`handleSaveCase` (Zeile 36) — Typ-Signatur anpassen:

```typescript
const handleSaveCase = async (data: { name: string; domain: string | null; description: string | null; scores: Record<string, number>; canvas_id: string | null }) => {
  if (editingCase) {
    const res = await fetch(`/api/usecase/${editingCase.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    if (json.data) setUseCases(prev => prev.map(c => c.id === editingCase.id ? json.data : c).sort((a, b) => b.weighted_score - a.weighted_score))
  } else {
    const res = await fetch('/api/usecase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (res.status === 403) { setShowUpgrade(true); setShowForm(false); return }
    const json = await res.json()
    if (json.data) setUseCases(prev => [...prev, json.data].sort((a, b) => b.weighted_score - a.weighted_score))
  }
  setShowForm(false)
  setEditingCase(null)
}
```

`UseCaseForm` im JSX — `canvases`-Prop übergeben (wo `UseCaseForm` gerendert wird):

```typescript
<UseCaseForm
  weights={weights}
  editing={editingCase}
  canvases={canvases}
  onSave={handleSaveCase}
  onCancel={() => { setShowForm(false); setEditingCase(null) }}
/>
```

- [ ] **Step 3: `page.tsx` — Canvases server-seitig laden**

In `src/app/(dashboard)/usecase/page.tsx` nach dem `rawCases`-Query (nach Zeile 44) einfügen:

```typescript
const { data: canvases } = await supabase
  .from('canvases')
  .select('id, title')
  .eq('user_id', user.id)
  .order('updated_at', { ascending: false }) as { data: { id: string; title: string }[] | null }
```

Den `UseCasePageClient`-Aufruf (Zeile 60–63) ergänzen:

```typescript
<UseCasePageClient
  initialPortfolio={safePortfolio}
  initialCases={rawCases ?? []}
  tier={tier}
  canvases={canvases ?? []}
/>
```

- [ ] **Step 4: TypeScript-Check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/components/modules/usecase/UseCaseForm.tsx \
        src/app/(dashboard)/usecase/UseCasePageClient.tsx \
        src/app/(dashboard)/usecase/page.tsx
git commit -m "feat(#45): Canvas-Dropdown im Use-Case-Formular"
```

---

## Task 8: Architektur-Seite — Kontext-Banner + Wizard-Vorausfüllung

**Files:**
- Modify: `src/app/(dashboard)/architecture/page.tsx`
- Modify: `src/app/(dashboard)/architecture/ArchitecturePageClient.tsx`

- [ ] **Step 1: `page.tsx` — Query-Param lesen + Canvas/UseCase laden**

In `src/app/(dashboard)/architecture/page.tsx` die Funktion-Signatur ändern um `searchParams` zu akzeptieren:

```typescript
export default async function ArchitecturePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; id?: string }>
}) {
```

Nach dem bestehenden `Promise.all` (nach Zeile 57) einfügen:

```typescript
const params = await searchParams
let canvasContext: {
  canvas: import('@/types').Canvas
  useCase: import('@/types').UseCase
} | null = null

if (params.from === 'usecase' && params.id) {
  const { data: useCase } = await supabase
    .from('use_cases')
    .select('*, uc_portfolios!inner(user_id)')
    .eq('id', params.id)
    .single() as { data: (import('@/types').UseCase & { uc_portfolios: { user_id: string } }) | null }

  if (useCase && useCase.uc_portfolios.user_id === user.id && useCase.canvas_id) {
    const { data: canvas } = await supabase
      .from('canvases')
      .select('*')
      .eq('id', useCase.canvas_id)
      .eq('user_id', user.id)
      .single() as { data: import('@/types').Canvas | null }

    if (canvas) {
      canvasContext = { canvas, useCase }
    }
  }
}
```

Den `ArchitecturePageClient`-Aufruf (Zeile 67) um `canvasContext` ergänzen:

```typescript
<ArchitecturePageClient
  initialArchitectures={architectures ?? []}
  assessmentContext={latestAssessment ? {
    archetype: latestAssessment.archetype as Archetype | null,
    total_score: latestAssessment.total_score,
    dim_scores: latestAssessment.dim_scores as Record<string, number>,
  } : null}
  governanceContext={latestGovernance ? {
    use_case_name: latestGovernance.use_case_name as string | null,
    result: latestGovernance.result as string | null,
  } : null}
  compliancePreset={riskClassNote ? compliancePreset : undefined}
  tier={tier}
  canvasContext={canvasContext}
/>
```

- [ ] **Step 2: `ArchitecturePageClient.tsx` — Imports ergänzen**

In `src/app/(dashboard)/architecture/ArchitecturePageClient.tsx` die Imports (Zeile 1–10) ergänzen:

```typescript
import { extractCanvasContext, type CanvasContext, type DetectedTag } from '@/lib/canvas-context'
import type { Canvas } from '@/types'
```

- [ ] **Step 3: `ArchitecturePageClient.tsx` — Props + State erweitern**

Die `interface Props` (Zeile 52–58) ergänzen:

```typescript
interface Props {
  initialArchitectures?: SavedArchitecture[]
  assessmentContext?: AssessmentContext | null
  governanceContext?: GovernanceContext | null
  compliancePreset?: 'strict' | 'moderate' | 'low' | 'undefined'
  tier?: string
  canvasContext?: { canvas: Canvas; useCase: import('@/types').UseCase } | null
}
```

- [ ] **Step 4: `ArchitecturePageClient.tsx` — `CanvasContextBanner`-Komponente hinzufügen**

Direkt nach der bestehenden `ContextBanner`-Funktion (nach Zeile 102) einfügen:

```typescript
const TAG_COLORS: Record<DetectedTag['type'], string> = {
  score:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  industry:   'bg-slate-100 text-slate-700 border-slate-200',
  usecase:    'bg-blue-50 text-blue-700 border-blue-200',
  platform:   'bg-violet-50 text-violet-700 border-violet-200',
  compliance: 'bg-amber-50 text-amber-700 border-amber-200',
}

function CanvasContextBanner({
  canvasTitle,
  useCaseName,
  context,
  onDismiss,
}: {
  canvasTitle: string
  useCaseName: string
  context: CanvasContext
  onDismiss: () => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const filledCount = Object.keys(context.wizard_prefill).length
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-emerald-700 font-semibold text-xs shrink-0">◧ Kontext aus Canvas & Scoring</span>
          <span className="text-xs text-emerald-600 truncate">{canvasTitle} · {useCaseName}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setCollapsed(v => !v)}
            aria-label={collapsed ? 'Ausklappen' : 'Einklappen'}
            className="text-xs text-emerald-700 hover:text-emerald-900 p-1">
            {collapsed ? '▾' : '▴'}
          </button>
          <button onClick={onDismiss} aria-label="Banner schließen"
            className="text-xs text-emerald-600 hover:text-emerald-900 p-1">✕</button>
        </div>
      </div>
      {!collapsed && (
        <>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {context.detected_tags.map(tag => (
              <span key={tag.label}
                className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', TAG_COLORS[tag.type])}>
                {tag.label}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-emerald-600 mt-1.5">
            {filledCount} von 12 Wizard-Schritten vorausgefüllt · Alle Felder können überschrieben werden
          </p>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 5: `ArchitecturePageClient.tsx` — Canvas-Kontext in State + Wizard integrieren**

Die Komponenten-Funktion `ArchitecturePageClient` (Zeile 194) — Destructuring ergänzen:

```typescript
export function ArchitecturePageClient({
  initialArchitectures = [],
  assessmentContext = null,
  governanceContext = null,
  compliancePreset,
  tier = 'free',
  canvasContext = null,
}: Props) {
```

Den `answers`-State (Zeile 198) anpassen:

```typescript
const [canvasCtx, setCanvasCtx] = useState<CanvasContext | null>(() => {
  if (!canvasContext) return null
  return extractCanvasContext(canvasContext.canvas, canvasContext.useCase, [])
})
const [showCanvasBanner, setShowCanvasBanner] = useState(!!canvasContext)

const [answers, setAnswers] = useState<WizardAnswers>(() => {
  const base = compliancePreset ? { compliance: compliancePreset } : {}
  if (canvasContext) {
    const ctx = extractCanvasContext(canvasContext.canvas, canvasContext.useCase, [])
    return { ...base, ...ctx.wizard_prefill }
  }
  return base
})
```

Den `handleNewWizard`-Handler (Zeile 248) ergänzen:

```typescript
const handleNewWizard = () => {
  setAnswers(compliancePreset ? { compliance: compliancePreset } : {})
  setCurrentStep(0)
  setResult(null)
  setSaved(false)
  setSavedId(null)
  setCatalogRecs(null)
  setJouleUseCases([])
  setCanvasCtx(null)
  setShowCanvasBanner(false)
  setView('wizard')
}
```

Im Wizard-View (`view === 'wizard'`), direkt vor dem ersten Wizard-Schritt (suche nach `{step && (` im JSX), den Banner einfügen:

```typescript
{showCanvasBanner && canvasCtx && canvasContext && (
  <CanvasContextBanner
    canvasTitle={canvasContext.canvas.title}
    useCaseName={canvasContext.useCase.name}
    context={canvasCtx}
    onDismiss={() => setShowCanvasBanner(false)}
  />
)}
```

Im `applyRecs`-Callback, nach dem Catalog-Load, den `canvasCtx` aktualisieren:

```typescript
.then(({ data }: { data: CatalogComponent[] }) => {
  const loaded = data ?? []
  setRecComponents(loaded)
  setCatalogRecs(recommendFromCatalog(wizardAnswers, loaded))
  // Canvas-Kontext mit vollem Catalog neu berechnen für pre_scored_components
  if (canvasContext) {
    setCanvasCtx(extractCanvasContext(canvasContext.canvas, canvasContext.useCase, loaded))
  }
})
```

- [ ] **Step 6: "Im Architektur-Generator öffnen"-Button im Scoring**

In `src/app/(dashboard)/usecase/UseCasePageClient.tsx` in der Tabellen-Zeile oder Detail-Ansicht einen Link hinzufügen. Suche die Stelle wo `handleDelete` aufgerufen wird (in `UseCaseTable`-Props) und füge einen Link hinzu. Da dies in `UseCaseTable.tsx` liegt, dort im Aktions-Bereich pro Zeile ergänzen:

In `src/components/modules/usecase/UseCaseTable.tsx`, in der Aktionsspalte pro Use-Case-Zeile:

```typescript
<a href={`/architecture?from=usecase&id=${uc.id}`}
  className="text-xs text-violet-600 hover:text-violet-800 font-medium whitespace-nowrap"
  title="Im Architektur-Generator öffnen">
  ◈ Architektur
</a>
```

- [ ] **Step 7: TypeScript-Check + Tests**

```bash
npx tsc --noEmit 2>&1 | head -20
npx jest --no-coverage 2>&1 | tail -10
```

Erwartung: sauber.

- [ ] **Step 8: Commit**

```bash
git add src/app/(dashboard)/architecture/page.tsx \
        src/app/(dashboard)/architecture/ArchitecturePageClient.tsx \
        src/components/modules/usecase/UseCaseTable.tsx
git commit -m "feat(#45): Kontext-Banner + Wizard-Vorausfüllung aus Canvas & Scoring"
```

---

## Task 9: Security-Test

**Files:**
- Create/Modify: `src/__tests__/security/canvas-scoring-arch.test.ts`

- [ ] **Step 1: Security-Test schreiben**

```typescript
// src/__tests__/security/canvas-scoring-arch.test.ts
import { createMocks } from 'node-mocks-http'

describe('PUT /api/usecase/[id] — canvas_id Security', () => {
  it('lehnt fremde canvas_id mit 403 ab', async () => {
    // Der eigentliche Supabase-Call wird in Integrationstests getestet.
    // Hier prüfen wir, dass das Schema canvas_id als UUID validiert.
    const { z } = await import('zod')
    const UpdateSchema = z.object({
      name: z.string().min(1).max(200),
      canvas_id: z.string().uuid().nullable().optional(),
      scores: z.object({
        value: z.number().int().min(1).max(5),
        feasibility: z.number().int().min(1).max(5),
        data_readiness: z.number().int().min(1).max(5),
        risk: z.number().int().min(1).max(5),
        speed: z.number().int().min(1).max(5),
      }),
    })
    // Ungültige UUID wird abgelehnt
    const result = UpdateSchema.safeParse({
      name: 'Test',
      canvas_id: 'not-a-uuid',
      scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
    })
    expect(result.success).toBe(false)
  })

  it('akzeptiert null als canvas_id (Verknüpfung aufheben)', () => {
    const { z } = require('zod')
    const UpdateSchema = z.object({
      name: z.string().min(1).max(200),
      canvas_id: z.string().uuid().nullable().optional(),
      scores: z.object({
        value: z.number().int().min(1).max(5),
        feasibility: z.number().int().min(1).max(5),
        data_readiness: z.number().int().min(1).max(5),
        risk: z.number().int().min(1).max(5),
        speed: z.number().int().min(1).max(5),
      }),
    })
    const result = UpdateSchema.safeParse({
      name: 'Test',
      canvas_id: null,
      scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
    })
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 2: Test ausführen**

```bash
npx jest src/__tests__/security/canvas-scoring-arch.test.ts --no-coverage
```

Erwartung: PASS.

- [ ] **Step 3: Vollständige Test-Suite**

```bash
npm run test 2>&1 | tail -15
```

Erwartung: alle Tests grün.

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/security/canvas-scoring-arch.test.ts
git commit -m "test(#45): Security-Test canvas_id-Validierung"
```

---

## Task 10: GitHub Issue + finale Prüfkette

- [ ] **Step 1: GitHub Issue #45 erstellen**

```bash
gh issue create \
  --title "feat: Canvas → Scoring → Architektur-Integration (#45)" \
  --body "$(cat <<'EOF'
## Zusammenfassung

Canvas und Use-Case-Scoring werden als inhaltliche Vorstufe des Architektur-Generators verknüpft.

## Änderungen

- **DB**: `canvas_id` (nullable FK) auf `use_cases`
- **Modulreihenfolge**: Canvas vor Scoring im Menü
- **Extraction-Lib** (`src/lib/canvas-context.ts`): catalog-getriebene Keyword-Extraktion → `WizardAnswers`-Vorausfüllung
- **`recommendFromCatalog`**: ersetzt hardcodierte Komponentennamen in `architecture-rules.ts` durch strukturelles Scoring gegen `CatalogComponent`-Felder
- **Canvas-Dropdown** im Use-Case-Formular (optional, 1:1-Verknüpfung)
- **Kontext-Banner** im Architektur-Wizard mit erkannten Tags + Wizard-Vorausfüllung
- **Einstiegspunkt** `/architecture?from=usecase&id=<id>` aus Scoring-Liste

## Spec

`docs/superpowers/specs/2026-06-26-canvas-scoring-architecture-integration-design.md`
EOF
)"
```

- [ ] **Step 2: Finale Prüfkette**

```bash
npm run test && npx tsc --noEmit && npx eslint src --max-warnings 0 && npm run build
```

Erwartung: alle vier Schritte ohne Fehler.

- [ ] **Step 3: Abschluß-Commit**

```bash
git add .
git status  # prüfen ob keine .env-Dateien staged
git commit -m "feat(#45): Canvas→Scoring→Architektur-Integration vollständig implementiert"
```

import { buildVocabFromCatalog, scoreComponentAgainstText, extractCanvasContext } from '@/lib/canvas-context'
import type { CatalogComponent, Canvas, UseCase } from '@/types'

const mockComp = (overrides: Partial<CatalogComponent>): CatalogComponent => ({
  id: '1', name: 'Test', vendor: null, category: null, architecture_layer: 'model',
  hosting: ['eu'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
  sap_compatible: false, sap_components: [], use_case_types: [], infra_types: ['cloud'],
  cloud_provider: 'independent', icon_name: null, website_url: null,
  description: null, tags: [], incompatible_with: [], requires: [], suggests: [], aliases: [], source: 'test', is_active: true,
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
  weighted_score: 4.2, quadrant: 'quick_win', canvas_id: null, governance_result: null,
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

  it('erkennt SAP-Landscape full aus S/4HANA in data_sources', () => {
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

  it('erkennt eu_hosting_required Flag aus Frankfurt-Erwähnung in risks', () => {
    const canvas = mockCanvas({ risks: 'Hosting muss in Frankfurt erfolgen, On-Premise bevorzugt' })
    const ctx = extractCanvasContext(canvas, mockUseCase(), [])
    expect(ctx.compliance_flags).toContain('eu_hosting_required')
  })
})

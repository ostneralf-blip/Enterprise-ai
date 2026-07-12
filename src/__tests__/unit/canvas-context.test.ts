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

// ════════════════════════════════════════════════════════════════════════════
// Gold-Canvas-Evaluationsset — AC zu Issue #144
// Jede Änderung an Keywords/Synonymen muss diese Suite unverändert passieren.
// ════════════════════════════════════════════════════════════════════════════
describe('Gold-Canvas-Evaluationsset (Issue #144)', () => {

  // ── False-Positive-Guards ─────────────────────────────────────────────────

  it('FP-1: "Tax" erzeugt keinen Microsoft-Treffer ("ax" braucht Wortgrenze)', () => {
    const msComp = mockComp({ name: 'Dynamics AX', vendor: 'Microsoft', tags: [], aliases: ['ax'] })
    const score = scoreComponentAgainstText(msComp, 'tax compliance workflow automatisieren')
    expect(score).toBe(0)
  })

  it('FP-2: "Snowboard" erzeugt keinen Snowflake-Treffer', () => {
    const sfComp = mockComp({ name: 'Snowflake', vendor: 'Snowflake', tags: ['data-warehouse'], aliases: ['snowpark'] })
    const score = scoreComponentAgainstText(sfComp, 'snowboard-verleih digitalisieren buchungssystem optimieren')
    expect(score).toBe(0)
  })

  it('FP-3: "Delta-Wert" erzeugt keinen Databricks-Treffer (standalone "delta" entfernt)', () => {
    const dbComp = mockComp({ name: 'Delta Lake', vendor: 'Databricks', tags: ['datalake'], aliases: [] })
    const score = scoreComponentAgainstText(dbComp, 'delta-wert analyse kpi quartalsvergleich')
    expect(score).toBe(0)
  })

  it('FP-4: Governance-Canvas ohne Finanzbezug wird NICHT als Finance klassifiziert', () => {
    const canvas = mockCanvas({
      problem: 'AI Governance Framework fehlt im Unternehmen',
      solution: 'Audit-Trail und Compliance-Monitoring einführen, Risikomanagement-Framework aufbauen',
      data_sources: 'Governance-Dokumente, Audit-Logs, Controlling-Berichte',
    })
    const useCase = mockUseCase({ name: 'AI Governance', domain: 'IT-Governance', weighted_score: undefined, quadrant: undefined })
    const ctx = extractCanvasContext(canvas, useCase, [])
    expect(ctx.wizard_prefill.industry).not.toBe('finance')
  })

  // ── Confidence-Nenner-Fix ─────────────────────────────────────────────────

  it('CONF-1: Confidence ist immer ≤ 1.0 (Nenner = 8 Prefill-Felder)', () => {
    // Reichhaltigster Canvas — alle 8 Felder erkennbar
    const canvas = mockCanvas({
      problem: 'Predictive Maintenance Anlage via SAP S/4HANA',
      solution: 'ML-Modell via Azure OpenAI. On-Premise Infrastruktur hybrid.',
      data_sources: 'SAP Datasphere, Azure Synapse. DSGVO: personenbezogene Sensordaten.',
      architecture: 'SAP BTP + SAP AI Core.',
    })
    const useCase = mockUseCase({ name: 'Predictive Maintenance', domain: 'Fertigung' })
    const ctx = extractCanvasContext(canvas, useCase, [])
    expect(ctx.confidence).toBeLessThanOrEqual(1.0)
    // Regression gegen alten Nenner 12 (max war 0.67)
    expect(ctx.confidence).toBeGreaterThan(0.67)
  })

  it('CONF-2: Canvas ohne erkennbare Felder hat Confidence 0', () => {
    const minimalCanvas: import('@/types').Canvas = {
      id: 'x', user_id: 'u', title: '', archetype: null, version_no: 1,
      created_at: '', updated_at: '',
      data: { problem: '', solution: '', data_sources: '', stakeholders: '', kpis: '', risks: '', architecture: '', next_steps: '' },
    }
    const minimalUc = mockUseCase({ name: '', domain: null, weighted_score: undefined, quadrant: undefined })
    const ctx = extractCanvasContext(minimalCanvas, minimalUc, [])
    expect(ctx.confidence).toBe(0)
  })

  // ── Richtige Erkennungen ──────────────────────────────────────────────────

  it('GS-1: Manufacturing-Canvas → industry = manufacturing', () => {
    const canvas = mockCanvas({
      problem: 'Predictive Maintenance für Produktionsanlage',
      solution: 'Sensordaten von PLCs auswerten, Maschinendaten analysieren',
      data_sources: 'MES-Daten, Schichtpläne, Fertigungsplanung',
    })
    const useCase = mockUseCase({ name: 'Predictive Maintenance', domain: 'Fertigung', weighted_score: undefined, quadrant: undefined })
    const ctx = extractCanvasContext(canvas, useCase, [])
    expect(ctx.wizard_prefill.industry).toBe('manufacturing')
  })

  it('GS-2: Echter Finance-Canvas (Bank/Fraud) → industry = finance', () => {
    const canvas = mockCanvas({
      problem: 'Kreditvergabe dauert zu lang, Fraud-Risiko steigt',
      solution: 'ML-Scoring für Kreditrisikoanalyse, Fraud Detection',
      data_sources: 'Bankdaten, Zahlungsabwicklung, Treasury-Berichte, Jahresabschluss, Bilanzdaten',
    })
    const useCase = mockUseCase({ name: 'Fraud Detection', domain: 'Banking', weighted_score: undefined, quadrant: undefined })
    const ctx = extractCanvasContext(canvas, useCase, [])
    expect(ctx.wizard_prefill.industry).toBe('finance')
  })

  it('GS-3: Azure OpenAI Chatbot → cloud_provider_hint = azure', () => {
    const canvas = mockCanvas({
      problem: 'Mitarbeiter finden Informationen nicht schnell genug',
      solution: 'FAQ-Chatbot mit Azure OpenAI und Teams-Integration',
      data_sources: 'SharePoint-Dokumente, Microsoft 365',
      architecture: 'Azure Cloud Infrastruktur',   // override SAP-Default aus mockCanvas
    })
    const useCase = mockUseCase({ name: 'Knowledge Bot', domain: null, weighted_score: undefined, quadrant: undefined })
    const ctx = extractCanvasContext(canvas, useCase, [])
    expect(ctx.wizard_prefill.cloud_provider_hint).toBe('azure')
  })

  it('GS-4: DSGVO+Frankfurt → dsgvo_strict + eu_hosting_required gesetzt', () => {
    const canvas = mockCanvas({
      risks: 'Verarbeitung personenbezogener Daten (DSGVO). EU-Hosting in Frankfurt verpflichtend.',
    })
    const ctx = extractCanvasContext(canvas, mockUseCase(), [])
    expect(ctx.compliance_flags).toContain('dsgvo_strict')
    expect(ctx.compliance_flags).toContain('eu_hosting_required')
  })

  it('GS-5: "ax" als eigenständiges Wort matcht Microsoft-Komponente', () => {
    const msComp = mockComp({ name: 'Dynamics AX', vendor: 'Microsoft', tags: [], aliases: ['ax'] })
    const score = scoreComponentAgainstText(msComp, 'wir nutzen ax für hr und personalwesen')
    expect(score).toBeGreaterThan(0)
  })

  it('GS-6: "delta lake" als Langform matcht Databricks-Komponente', () => {
    const dbComp = mockComp({ name: 'Delta Lake', vendor: 'Databricks', tags: ['datalake'], aliases: [] })
    const score = scoreComponentAgainstText(dbComp, 'delta lake als storage layer im lakehouse')
    expect(score).toBeGreaterThanOrEqual(30)
  })
})

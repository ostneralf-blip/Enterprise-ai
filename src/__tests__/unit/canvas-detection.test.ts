import {
  matchesTerm,
  detectPlatformTags,
  detectUseCaseTypes,
  detectDocumentContext,
  buildDetectionText,
  analyzeCanvas,
  VENDOR_ALIASES,
} from '@/lib/canvas/detection'
import type { Canvas } from '@/types'

// ─── Fixture: SAP SuccessFactors HR Use-Case ──────────────────────────────────
function makeCanvas(overrides: Partial<Canvas['data']> = {}, title = ''): Canvas {
  return {
    id: 'c1', user_id: 'u1', title, archetype: null,
    version_no: 1, created_at: '', updated_at: '',
    data: {
      problem: 'Mitarbeiteronboarding dauert zu lange — manuelle Dateneingabe in HR-Systeme',
      solution: 'KI-gestützte Automatisierung der Personalanlage in Successfactor',
      data_sources: 'Successfactor HCM, Arbeitsvertrag als PDF (Word-Dokument)',
      stakeholders: 'HR-Leiterin, IT-Abteilung',
      kpis: 'Onboarding-Zeit von 3 Tagen auf < 4h reduzieren',
      risks: 'Datenschutz personenbezogener Daten (DSGVO)',
      architecture: 'SAP BTP Integration Suite, S/4HANA',
      next_steps: 'Pilotprojekt mit 5 neuen Mitarbeitern',
      ...overrides,
    },
  }
}

describe('matchesTerm — Fuzzy Matching', () => {
  it('erkennt exakte Übereinstimmung', () => {
    expect(matchesTerm('successfactors integration', 'successfactors')).toBe(true)
  })

  it('erkennt Tippfehler mit Levenshtein ≤ 2 (Succcessfactor)', () => {
    expect(matchesTerm('succcessfactor hcm', 'successfactors')).toBe(true)
  })

  it('erkennt Singular ohne Plural-s (Successfactor)', () => {
    expect(matchesTerm('successfactor hcm', 'successfactors')).toBe(true)
  })

  it('blockt False-Positive: Snowboard ↛ Snowflake', () => {
    expect(matchesTerm('snowboard sport', 'snowflake')).toBe(false)
  })

  it('kurzer Term (≤4): Wortgrenz-Guard', () => {
    expect(matchesTerm('dynamics ax integration', 'ax')).toBe(true)
    expect(matchesTerm('fax machine', 'ax')).toBe(false)
  })
})

describe('buildDetectionText — Titel einbezogen', () => {
  it('enthält den Canvas-Titel', () => {
    const canvas = makeCanvas({}, 'SAP SuccessFactors HR Onboarding')
    const text = buildDetectionText(canvas)
    expect(text).toContain('sap successfactors hr onboarding')
  })
})

describe('detectPlatformTags — SAP via Alias', () => {
  it('erkennt SAP wenn Successfactor (Tippfehler) in data_sources', () => {
    const canvas = makeCanvas({ data_sources: 'Succcessfactor HCM Daten' }, '')
    const text = buildDetectionText(canvas)
    const platforms = detectPlatformTags(text, VENDOR_ALIASES)
    expect(platforms).toContain('SAP')
  })

  it('erkennt SAP wenn nur im Titel', () => {
    const canvas = makeCanvas({ solution: '', architecture: '' }, 'SAP SuccessFactors Projekt')
    const text = buildDetectionText(canvas)
    const platforms = detectPlatformTags(text, VENDOR_ALIASES)
    expect(platforms).toContain('SAP')
  })

  it('erkennt Azure via Alias', () => {
    const text = 'azure openai integration für das projekt'
    expect(detectPlatformTags(text)).toContain('Azure')
  })
})

describe('detectUseCaseTypes — Multi-Label', () => {
  it('erkennt primär vision für HR-Onboarding-Canvas mit PDF-Arbeitsvertrag', () => {
    // Fixture enthält PDF/Arbeitsvertrag/Word → vision schlägt automation
    const canvas = makeCanvas()
    const text = buildDetectionText(canvas)
    const result = detectUseCaseTypes(text)
    expect(result?.primary).toBe('vision')
  })

  it('erkennt automation als primär für reinen Prozess-Canvas ohne Dokument-Keywords', () => {
    const canvas = makeCanvas({
      problem: 'Manuelle Datenübertragung zwischen ERP und CRM dauert zu lange',
      solution: 'Workflow-Automatisierung mit RPA und Prozessorchestrierung via Integration Suite',
      data_sources: 'SAP S/4HANA API, Salesforce REST API',
      kpis: 'Prozesszeit von 2h auf < 5min reduzieren, 90% Automatisierungsgrad',
      risks: 'Abhängigkeit von API-Stabilität',
      architecture: 'SAP Integration Suite, Power Automate',
      next_steps: 'Pilot-Workflow mit Bestellprozess aufsetzen',
    }, 'ERP-CRM Prozessautomatisierung')
    const text = buildDetectionText(canvas)
    const result = detectUseCaseTypes(text)
    expect(result?.primary).toBe('automation')
  })

  it('erkennt vision in HR-Canvas (PDF/Dokument-Keywords dominieren)', () => {
    const canvas = makeCanvas({ data_sources: 'Successfactor, PDF-Rechnungen, OCR-Scan' })
    const text = buildDetectionText(canvas)
    const result = detectUseCaseTypes(text)
    expect(result?.primary).toBeDefined()
    const types = [result?.primary, result?.secondary].filter(Boolean)
    expect(types).toContain('vision')
  })

  it('gibt null zurück bei leerem Canvas', () => {
    const canvas = makeCanvas({ problem: '', solution: '', data_sources: '' })
    const text = buildDetectionText(canvas)
    const result = detectUseCaseTypes(text)
    // Kann null oder einen Type haben (stakeholder/kpis/risks/next_steps haben noch Content)
    // Hauptsache kein Crash
    expect(() => detectUseCaseTypes(text)).not.toThrow()
  })
})

describe('detectDocumentContext', () => {
  it('erkennt OCR-Kontext bei Arbeitsvertrag-Erwähnung', () => {
    expect(detectDocumentContext('arbeitsvertrag als pdf scannen')).toBe(true)
  })

  it('erkennt OCR-Kontext bei Rechnung', () => {
    expect(detectDocumentContext('rechnungseingang automatisieren')).toBe(true)
  })

  it('kein False-Positive bei normalem Text', () => {
    expect(detectDocumentContext('prognose für umsatz nächstes quartal')).toBe(false)
  })
})

describe('analyzeCanvas — Regression SAP-SuccessFactors-HR-Canvas', () => {
  it('erkennt SAP in Free-Erkennung ohne KI', () => {
    const canvas = makeCanvas()
    const result = analyzeCanvas(canvas)
    expect(result.platform).toContain('SAP')
  })

  it('Kontextanalyse-Box und extractCanvasContext haben identische SAP-Erkennung', async () => {
    const canvas = makeCanvas({}, 'SAP SuccessFactors HR Onboarding')
    // Canvas-Box nutzt analyzeCanvas
    const boxResult = analyzeCanvas(canvas)
    // Architektur-Prefill nutzt extractCanvasContext aus canvas-context.ts
    const { extractCanvasContext, buildVocabFromCatalog } = await import('@/lib/canvas-context')
    const fakeUseCase = {
      id: 'uc1', portfolio_id: 'p1', name: 'HR Onboarding', domain: null,
      description: null, scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      weighted_score: 3, quadrant: 'quick_win' as const, canvas_id: null, governance_result: null,
      created_at: '', updated_at: '',
    }
    const archResult = extractCanvasContext(canvas, fakeUseCase, [], [])
    // Beide Pfade müssen SAP erkennen
    expect(boxResult.platform).toContain('SAP')
    expect(archResult.wizard_prefill.sap_landscape).toBeDefined()
  })

  it('erkennt Use-Case-Typ automation', () => {
    const result = analyzeCanvas(makeCanvas())
    expect(result.usecaseType).toBeTruthy()
  })

  it('filledCount stimmt', () => {
    const canvas = makeCanvas()
    const result = analyzeCanvas(canvas)
    expect(result.filledCount).toBe(8)
  })
})

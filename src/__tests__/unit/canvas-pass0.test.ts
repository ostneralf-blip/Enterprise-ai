import {
  extractStakeholderSignals,
  extractUnknownCandidates,
  extractComplianceSignals,
  analyzeCanvasPass0,
} from '@/lib/canvas/pass0'
import { FIELD_PRIORS, FIELD_PRIOR_MAP, isHarvestField } from '@/lib/canvas/field-priors'
import type { Canvas } from '@/types'

function makeCanvas(overrides: Partial<Canvas['data']> = {}, title = ''): Canvas {
  return {
    id: 'c1', user_id: 'u1', title, archetype: null,
    version_no: 1, created_at: '', updated_at: '',
    data: {
      problem: 'Mitarbeiteronboarding dauert zu lange',
      solution: 'KI-Lösung sollen Arbeitsvertrag auslesen und Daten in SuccessFactors übertragen',
      data_sources: 'Successfactor HCM, PDF-Arbeitsvertrag',
      stakeholders: 'HR-Leiterin, IT-Abteilung',
      kpis: 'Onboarding-Zeit auf wenige Minuten reduzieren',
      risks: 'Datenschutz personenbezogener Daten (DSGVO)',
      architecture: 'SAP BTP Integration Suite',
      next_steps: 'Pilotprojekt starten',
      ...overrides,
    },
  }
}

// ─── §3 Feld-Prior-Matrix ─────────────────────────────────────────────────────
describe('FIELD_PRIORS — Matrix-Integrität', () => {
  const harvestKeys = ['title', 'problem', 'solution', 'data_sources', 'architecture']
  const nonHarvestKeys = ['stakeholders', 'kpis', 'risks', 'next_steps']

  it('genau 9 Felder — vollständige Matrix', () => {
    expect(FIELD_PRIORS).toHaveLength(9)
  })

  it.each(harvestKeys)('%s ist harvest-Feld', (key) => {
    const prior = FIELD_PRIOR_MAP[key]
    expect(prior).toBeDefined()
    expect(isHarvestField(prior)).toBe(true)
  })

  it.each(nonHarvestKeys)('%s ist KEIN harvest-Feld', (key) => {
    const prior = FIELD_PRIOR_MAP[key]
    expect(prior).toBeDefined()
    expect(isHarvestField(prior)).toBe(false)
  })

  it('data_sources und architecture haben höchste scoreWeight (1.5)', () => {
    expect(FIELD_PRIOR_MAP['data_sources'].scoreWeight).toBe(1.5)
    expect(FIELD_PRIOR_MAP['architecture'].scoreWeight).toBe(1.5)
  })

  it('risks hat complianceBoost: true', () => {
    expect(FIELD_PRIOR_MAP['risks'].complianceBoost).toBe(true)
  })

  it('stakeholders liefert annex_iii-SignalPrior', () => {
    expect(FIELD_PRIOR_MAP['stakeholders'].signalPrior).toContain('annex_iii')
  })

  it('kpis und next_steps haben scoreWeight 0', () => {
    expect(FIELD_PRIOR_MAP['kpis'].scoreWeight).toBe(0)
    expect(FIELD_PRIOR_MAP['next_steps'].scoreWeight).toBe(0)
  })
})

// ─── extractStakeholderSignals ────────────────────────────────────────────────
describe('extractStakeholderSignals — Anhang-III-Erkennung', () => {
  it('HR-Leiterin → employment (Anhang III)', () => {
    const { annexIII } = extractStakeholderSignals('HR-Leiterin, IT-Abteilung')
    expect(annexIII).toContain('employment')
  })

  it('Richter → justice (Anhang III)', () => {
    const { annexIII } = extractStakeholderSignals('Richter, Staatsanwalt')
    expect(annexIII).toContain('justice')
  })

  it('Polizei → law_enforcement (Anhang III)', () => {
    const { annexIII } = extractStakeholderSignals('Polizist, Ermittler BKA')
    expect(annexIII).toContain('law_enforcement')
  })

  it('kein Anhang-III bei neutralen IT-Stakeholdern', () => {
    const { annexIII } = extractStakeholderSignals('IT-Architekt, Product Owner, DevOps Engineer')
    expect(annexIII).toHaveLength(0)
  })

  it('erkennt Branche Gesundheitswesen bei Arzt', () => {
    const { industries } = extractStakeholderSignals('Ärztin, Pfleger, Klinikleitung')
    expect(industries).toContain('Gesundheitswesen')
  })

  it('leerer Text → keine Signale', () => {
    const result = extractStakeholderSignals('')
    expect(result.industries).toHaveLength(0)
    expect(result.annexIII).toHaveLength(0)
  })
})

// ─── extractUnknownCandidates ─────────────────────────────────────────────────
describe('extractUnknownCandidates — feldbewusste Kandidaten-Extraktion', () => {
  it('„Successfactor" aus data_sources ist Kandidat (kein knownTerms-Eintrag)', () => {
    const canvas = makeCanvas({ data_sources: 'Successfactor HCM, SAP BTP' })
    // knownTerms enthält nichts → Successfactor ist unbekannt
    const candidates = extractUnknownCandidates(canvas, new Set(), new Set())
    const terms = candidates.map(c => c.term.toLowerCase())
    expect(terms.some(t => t.includes('successfactor'))).toBe(true)
  })

  it('„Successfactor" aus data_sources ist KEIN Kandidat wenn in knownTerms', () => {
    const canvas = makeCanvas({ data_sources: 'Successfactor HCM' })
    const known = new Set(['successfactors'])
    const candidates = extractUnknownCandidates(canvas, known)
    const terms = candidates.map(c => c.term.toLowerCase())
    expect(terms.some(t => t.includes('successfactor'))).toBe(false)
  })

  it('„sollen" aus solution ist Kandidat (harvest-Feld, noch nicht in Blocklist)', () => {
    const canvas = makeCanvas({
      solution: 'KI-Lösung sollen Prozesse automatisieren',
    })
    const candidates = extractUnknownCandidates(canvas, new Set())
    const terms = candidates.map(c => c.term.toLowerCase())
    // "sollen" ist Füllwort, aber Pass 1 (nicht Pass 0) blockt es
    expect(terms).toContain('sollen')
  })

  it('„sollen" ist KEIN Kandidat wenn in Blocklist', () => {
    const canvas = makeCanvas({ solution: 'KI-Lösung sollen Prozesse automatisieren' })
    const candidates = extractUnknownCandidates(canvas, new Set(), new Set(['sollen']))
    const terms = candidates.map(c => c.term.toLowerCase())
    expect(terms).not.toContain('sollen')
  })

  it('„wenige Minuten" aus kpis wird nie Kandidat (kein harvest-Feld)', () => {
    const canvas = makeCanvas({ kpis: 'Onboarding auf wenige Minuten reduzieren' })
    const candidates = extractUnknownCandidates(canvas, new Set())
    // kpis ist harvest:false — keine Terme aus diesem Feld
    const fromKpis = candidates.filter(c => c.field === 'kpis')
    expect(fromKpis).toHaveLength(0)
  })

  it('Kandidat aus data_sources hat höhere scoreWeight als aus solution', () => {
    const canvas = makeCanvas({
      data_sources: 'UnbekanntesSystemXYZ',
      solution: 'UnbekanntesSystemXYZ nutzen',
    })
    const candidates = extractUnknownCandidates(canvas, new Set())
    const found = candidates.find(c => c.term.toLowerCase() === 'unbekanntessystemxyz')
    // Bestes Vorkommen: data_sources (scoreWeight 1.5) > solution (0.8)
    expect(found?.field).toBe('data_sources')
    expect(found?.scoreWeight).toBe(1.5)
  })

  it('Kandidat enthält Satz-Kontext (±1 Satz)', () => {
    const canvas = makeCanvas({
      data_sources: 'Erster Satz. UnbekanntesSystemABC als Datenquelle. Dritter Satz.',
    })
    const candidates = extractUnknownCandidates(canvas, new Set())
    const found = candidates.find(c => c.term.toLowerCase() === 'unbekanntessystemabc')
    expect(found?.context).toContain('Erster Satz')
    expect(found?.context).toContain('Dritter Satz')
  })

  it('keine Kandidaten aus next_steps (nicht harvest)', () => {
    const canvas = makeCanvas({ next_steps: 'UnbekanntesSystemDEF deployen' })
    const candidates = extractUnknownCandidates(canvas, new Set())
    const fromNext = candidates.filter(c => c.field === 'next_steps')
    expect(fromNext).toHaveLength(0)
  })
})

// ─── extractComplianceSignals ─────────────────────────────────────────────────
describe('extractComplianceSignals — Risiken-Feld boosted', () => {
  it('DSGVO in risks-Feld → fromRisksField: true', () => {
    const canvas = makeCanvas({ risks: 'Datenschutz personenbezogener Daten (DSGVO)' })
    const signals = extractComplianceSignals(canvas)
    const dsgvo = signals.find(s => s.flag === 'dsgvo_strict')
    expect(dsgvo).toBeDefined()
    expect(dsgvo?.fromRisksField).toBe(true)
  })

  it('DSGVO nur im solution-Feld → fromRisksField: false', () => {
    const canvas = makeCanvas({
      solution: 'DSGVO-konformer Ansatz',
      risks: 'Technische Risiken',
    })
    const signals = extractComplianceSignals(canvas)
    const dsgvo = signals.find(s => s.flag === 'dsgvo_strict')
    expect(dsgvo).toBeDefined()
    expect(dsgvo?.fromRisksField).toBe(false)
  })

  it('kein Compliance-Signal bei neutralem Canvas', () => {
    const canvas = makeCanvas({
      problem: 'Lagerverwaltung verbessern',
      solution: 'Computer Vision für Inventar',
      risks: 'Systemausfall',
    })
    const signals = extractComplianceSignals(canvas)
    expect(signals.every(s => s.flag !== 'dsgvo_strict')).toBe(true)
  })
})

// ─── analyzeCanvasPass0 — Regressionstest ─────────────────────────────────────
describe('analyzeCanvasPass0 — kombiniertes Pass-0-Ergebnis', () => {
  it('gibt base-Erkennung + Stakeholder-Signale + Kandidaten zurück', () => {
    const canvas = makeCanvas()
    const result = analyzeCanvasPass0(canvas, new Set())
    expect(result.platform).toBeDefined()
    expect(result.stakeholderSignals.annexIII).toContain('employment')
    expect(result.candidates).toBeDefined()
    expect(result.complianceSignals.some(s => s.flag === 'dsgvo_strict')).toBe(true)
  })

  it('Kandidaten-Liste hat keine Einträge aus KPIs / Nächste Schritte / Risiken', () => {
    const canvas = makeCanvas({
      kpis: 'SpeziellKPI Reduktion',
      next_steps: 'SpeziellStep deployen',
      risks: 'SpeziellRisk berücksichtigen',
    })
    const { candidates } = analyzeCanvasPass0(canvas, new Set())
    const fieldsInCandidates = candidates.map(c => c.field)
    expect(fieldsInCandidates).not.toContain('kpis')
    expect(fieldsInCandidates).not.toContain('next_steps')
    expect(fieldsInCandidates).not.toContain('risks')
  })
})

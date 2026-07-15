import {
  detectAiActDomain,
  classifyAiAct,
  generateDocumentationText,
  AI_ACT_DATES,
} from '@/lib/eu-ai-act/classifier'
import type { AiActAnswers } from '@/lib/eu-ai-act/classifier'

// ─── Domain Detection ────────────────────────────────────────────────────────

describe('detectAiActDomain', () => {
  it('returns employment for HR-related text', () => {
    expect(detectAiActDomain('Wir nutzen AI im Personalmanagement für Recruiting')).toBe('employment')
    expect(detectAiActDomain('Bewerbungsscreening mit KI')).toBe('employment')
    expect(detectAiActDomain('SAP HCM für Leistungsbeurteilung')).toBe('employment')
    expect(detectAiActDomain('HR-System für Onboarding und Mitarbeiterentwicklung')).toBe('employment')
  })

  it('returns none for non-employment text', () => {
    expect(detectAiActDomain('Produktionsoptimierung in der Fertigungslinie')).toBe('none')
    expect(detectAiActDomain('Customer churn prediction with machine learning')).toBe('none')
    expect(detectAiActDomain('')).toBe('none')
  })
})

// ─── Classification Logic ────────────────────────────────────────────────────

describe('classifyAiAct', () => {
  const baseAnswers: AiActAnswers = {
    affectsPersons: true,
    involvesProfiling: false,
    isNarrowProcedural: false,
    humanReviewsBefore: false,
  }

  it('returns nicht_anhang_iii when domain is none', () => {
    const result = classifyAiAct('none', baseAnswers)
    expect(result.result).toBe('nicht_anhang_iii')
    expect(result.profilingOverride).toBe(false)
  })

  it('returns hochrisiko with profilingOverride when profiling is true (regardless of other answers)', () => {
    const result = classifyAiAct('employment', { ...baseAnswers, involvesProfiling: true, isNarrowProcedural: true, humanReviewsBefore: true })
    expect(result.result).toBe('hochrisiko')
    expect(result.profilingOverride).toBe(true)
  })

  it('returns nicht_anhang_iii when affectsPersons is false', () => {
    const result = classifyAiAct('employment', { ...baseAnswers, affectsPersons: false })
    expect(result.result).toBe('nicht_anhang_iii')
    expect(result.profilingOverride).toBe(false)
  })

  it('returns anhang_iii_ausgenommen lit. a for narrow procedural task', () => {
    const result = classifyAiAct('employment', { ...baseAnswers, isNarrowProcedural: true })
    expect(result.result).toBe('anhang_iii_ausgenommen')
    expect(result.exemption).toBe('a')
  })

  it('returns anhang_iii_ausgenommen lit. b when human reviews before effect', () => {
    const result = classifyAiAct('employment', { ...baseAnswers, humanReviewsBefore: true })
    expect(result.result).toBe('anhang_iii_ausgenommen')
    expect(result.exemption).toBe('b')
  })

  it('returns hochrisiko when all exemptions fail', () => {
    const result = classifyAiAct('employment', baseAnswers)
    expect(result.result).toBe('hochrisiko')
    expect(result.profilingOverride).toBe(false)
    expect(result.exemption).toBeUndefined()
  })

  it('narrow procedural takes precedence over human review (order: profiling → affectsPersons → narrow → human)', () => {
    const result = classifyAiAct('employment', { ...baseAnswers, isNarrowProcedural: true, humanReviewsBefore: true })
    expect(result.result).toBe('anhang_iii_ausgenommen')
    expect(result.exemption).toBe('a')
  })
})

// ─── Documentation Text ──────────────────────────────────────────────────────

describe('generateDocumentationText', () => {
  const title = 'Testprojekt'
  const baseAnswers: AiActAnswers = { affectsPersons: true, involvesProfiling: false, isNarrowProcedural: false, humanReviewsBefore: false }

  it('mentions correct deadline from AI_ACT_DATES for hochrisiko', () => {
    const classification = classifyAiAct('employment', baseAnswers)
    const { de, en } = generateDocumentationText('employment', classification, baseAnswers, title)
    expect(de).toContain(AI_ACT_DATES.annex3_deadline)
    expect(en).toContain(AI_ACT_DATES.annex3_deadline)
    expect(de).toContain('Hochrisiko')
    expect(en).toContain('high-risk')
  })

  it('mentions profiling for profilingOverride case', () => {
    const classification = classifyAiAct('employment', { ...baseAnswers, involvesProfiling: true })
    const { de } = generateDocumentationText('employment', classification, { ...baseAnswers, involvesProfiling: true }, title)
    expect(de).toContain('Profiling')
  })

  it('mentions exemption lit. a for narrow procedural', () => {
    const narrowAnswers: AiActAnswers = { ...baseAnswers, isNarrowProcedural: true }
    const classification = classifyAiAct('employment', narrowAnswers)
    const { de, en } = generateDocumentationText('employment', classification, narrowAnswers, title)
    expect(de).toContain('lit. a')
    expect(en).toContain('(a)')
  })

  it('mentions exemption lit. b for human review', () => {
    const humanAnswers: AiActAnswers = { ...baseAnswers, humanReviewsBefore: true }
    const classification = classifyAiAct('employment', humanAnswers)
    const { de, en } = generateDocumentationText('employment', classification, humanAnswers, title)
    expect(de).toContain('lit. b')
    expect(en).toContain('(b)')
  })

  it('mentions no Annex III for non-employment domain', () => {
    const classification = classifyAiAct('none', baseAnswers)
    const { de, en } = generateDocumentationText('none', classification, baseAnswers, title)
    expect(de).toContain('nicht in den Anwendungsbereich')
    expect(en).toContain('does not fall within')
  })

  it('includes canvas title in documentation text', () => {
    const classification = classifyAiAct('employment', baseAnswers)
    const { de, en } = generateDocumentationText('employment', classification, baseAnswers, 'Mein Canvas')
    expect(de).toContain('Mein Canvas')
    expect(en).toContain('Mein Canvas')
  })
})

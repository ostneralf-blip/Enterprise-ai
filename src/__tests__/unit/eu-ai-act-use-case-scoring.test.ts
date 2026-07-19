import { computeEuAiActStatusV2 } from '@/lib/compliance/eu-ai-act-use-case-scoring'
import type { UseCaseForScoring, CanvasForScoring } from '@/lib/compliance/eu-ai-act-use-case-scoring'
import type { CategoryProgress } from '@/lib/compliance/category-scoring'

// EU-AI-Act-Use-Case-Scoring V2 (19.07.2026, mit Daniel abgestimmt) — Basis
// aus der echten Art.-6-Klassifikation (canvas.ai_act_assessment) statt nur
// governance_result, plus Zuschlag pro aktiver Compliance-Kategorie
// basierend auf kontoweitem Checklisten-Fortschritt. Fallback auf V1
// (governance_result) für Use-Cases ohne Canvas oder ohne Assessment.

function canvas(overrides: Partial<CanvasForScoring> & { complianceText?: string }): CanvasForScoring {
  const { complianceText, ...rest } = overrides
  return {
    id: 'canvas-1',
    title: 'Test Canvas',
    data: {
      problem: complianceText ?? '',
      solution: '', data_sources: '', stakeholders: '', kpis: '', risks: '', architecture: '', next_steps: '',
    },
    ai_act_assessment: null,
    ...rest,
  }
}

describe('computeEuAiActStatusV2 — Basis aus Art.-6-Klassifikation', () => {
  it('gibt null zurück bei leerer Use-Case-Liste', () => {
    expect(computeEuAiActStatusV2([], new Map())).toBeNull()
  })

  it('stuft hochrisiko ohne aktive Kategorien als Hochrisiko ein (Basis 100)', () => {
    const useCases: UseCaseForScoring[] = [{
      governance_result: null,
      canvas: canvas({ ai_act_assessment: { classification: { result: 'hochrisiko' } } }),
    }]
    const result = computeEuAiActStatusV2(useCases, new Map())
    expect(result).toEqual({ highCount: 1, limitedCount: 0, minimalCount: 0, classifiedCount: 1, gapCount: 0 })
  })

  it('stuft nicht_anhang_iii ohne aktive Kategorien als Minimal ein (Basis 0)', () => {
    const useCases: UseCaseForScoring[] = [{
      governance_result: null,
      canvas: canvas({ ai_act_assessment: { classification: { result: 'nicht_anhang_iii' } } }),
    }]
    const result = computeEuAiActStatusV2(useCases, new Map())
    expect(result).toEqual({ highCount: 0, limitedCount: 0, minimalCount: 1, classifiedCount: 1, gapCount: 0 })
  })

  it('stuft anhang_iii_ausgenommen wie nicht_anhang_iii als Minimal ein (mit Daniel abgestimmtes Mapping)', () => {
    const useCases: UseCaseForScoring[] = [{
      governance_result: null,
      canvas: canvas({ ai_act_assessment: { classification: { result: 'anhang_iii_ausgenommen' } } }),
    }]
    const result = computeEuAiActStatusV2(useCases, new Map())
    expect(result?.minimalCount).toBe(1)
    expect(result?.highCount).toBe(0)
  })
})

describe('computeEuAiActStatusV2 — Kategorie-Zuschläge', () => {
  it('ein aktivierter, komplett unbearbeiteter Kategorie-Zuschlag (0 % Fortschritt) reicht allein nicht für Hochrisiko', () => {
    const useCases: UseCaseForScoring[] = [{
      governance_result: null,
      canvas: canvas({
        complianceText: 'Verarbeitet personenbezogene Daten (DSGVO)',
        ai_act_assessment: { classification: { result: 'nicht_anhang_iii' } },
      }),
    }]
    const categoryProgress = new Map<string, CategoryProgress>([
      ['DSGVO relevant', { completed: 0, total: 12, pct: 0 }],
    ])
    const result = computeEuAiActStatusV2(useCases, categoryProgress)
    // Basis 0 + (100-0)*0.3 = 30 → unter der Begrenzt-Schwelle (34)
    expect(result?.minimalCount).toBe(1)
  })

  it('drei gleichzeitig aktive, komplett unbearbeitete Kategorien stufen einen technisch unkritischen Use-Case als Hochrisiko ein', () => {
    const useCases: UseCaseForScoring[] = [{
      governance_result: null,
      canvas: canvas({
        complianceText: 'DSGVO personenbezogene Daten, NIS2 kritische Infrastruktur, ISO 27001 informationssicherheit',
        ai_act_assessment: { classification: { result: 'nicht_anhang_iii' } },
      }),
    }]
    const categoryProgress = new Map<string, CategoryProgress>([
      ['DSGVO relevant', { completed: 0, total: 12, pct: 0 }],
      ['NIS2 / KRITIS relevant', { completed: 0, total: 8, pct: 0 }],
      ['ISO 27001 / IT-Sicherheit relevant', { completed: 0, total: 8, pct: 0 }],
    ])
    const result = computeEuAiActStatusV2(useCases, categoryProgress)
    // Basis 0 + 3 × (100-0)*0.3 = 90 → über der Hochrisiko-Schwelle (67)
    expect(result?.highCount).toBe(1)
  })

  it('vollständig abgeschlossene Kategorie (100 % Fortschritt) fügt keinen Zuschlag hinzu', () => {
    const useCases: UseCaseForScoring[] = [{
      governance_result: null,
      canvas: canvas({
        complianceText: 'DSGVO personenbezogene Daten',
        ai_act_assessment: { classification: { result: 'nicht_anhang_iii' } },
      }),
    }]
    const categoryProgress = new Map<string, CategoryProgress>([
      ['DSGVO relevant', { completed: 12, total: 12, pct: 100 }],
    ])
    const result = computeEuAiActStatusV2(useCases, categoryProgress)
    expect(result?.minimalCount).toBe(1)
  })
})

describe('computeEuAiActStatusV2 — Fallback ohne Canvas', () => {
  it('fällt für Use-Cases ohne Canvas auf V1 (governance_result) zurück', () => {
    const useCases: UseCaseForScoring[] = [
      { governance_result: 'stop_dsgvo', canvas: null },
      { governance_result: 'approve', canvas: null },
    ]
    const result = computeEuAiActStatusV2(useCases, new Map())
    expect(result).toEqual({ highCount: 1, limitedCount: 0, minimalCount: 1, classifiedCount: 2, gapCount: 0 })
  })

  it('fällt für Use-Cases mit Canvas ohne ai_act_assessment ebenfalls auf V1 zurück', () => {
    const useCases: UseCaseForScoring[] = [{
      governance_result: 'improve',
      canvas: canvas({ ai_act_assessment: null }),
    }]
    const result = computeEuAiActStatusV2(useCases, new Map())
    expect(result?.limitedCount).toBe(1)
  })

  it('markiert Use-Cases ohne Canvas UND ohne governance_result als Gap', () => {
    const useCases: UseCaseForScoring[] = [{ governance_result: null, canvas: null }]
    const result = computeEuAiActStatusV2(useCases, new Map())
    expect(result).toEqual({ highCount: 0, limitedCount: 0, minimalCount: 0, classifiedCount: 0, gapCount: 1 })
  })

  it('kombiniert V2-Use-Cases (mit Canvas) und V1-Fallback-Use-Cases (ohne Canvas) korrekt in einer Zusammenfassung', () => {
    const useCases: UseCaseForScoring[] = [
      { governance_result: null, canvas: canvas({ ai_act_assessment: { classification: { result: 'hochrisiko' } } }) },
      { governance_result: 'approve', canvas: null },
    ]
    const result = computeEuAiActStatusV2(useCases, new Map())
    expect(result).toEqual({ highCount: 1, limitedCount: 0, minimalCount: 1, classifiedCount: 2, gapCount: 0 })
  })
})

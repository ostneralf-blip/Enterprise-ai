import { computeEuAiActStatusV2 } from '@/lib/compliance/eu-ai-act-use-case-scoring'
import type { UseCaseForScoring, CanvasForScoring } from '@/lib/compliance/eu-ai-act-use-case-scoring'
import { surchargeFromProgress } from '@/lib/compliance/category-scoring'
import type { RegulationProgress } from '@/lib/compliance/category-scoring'

// EU-AI-Act-Use-Case-Scoring V2 (19.07.2026, mit Daniel abgestimmt) — Basis aus
// der echten Art.-6-Klassifikation (canvas.ai_act_assessment), plus GLOBALER
// Zuschlag aus dem Fortschritt aller aktivierten Regularien (identisch für
// jeden Use-Case). Fallback auf V1 (governance_result) NUR für Use-Cases ganz
// ohne Canvas.

function canvas(overrides: Partial<CanvasForScoring>): CanvasForScoring {
  return {
    id: 'canvas-1',
    title: 'Test Canvas',
    data: {
      problem: '', solution: '', data_sources: '', stakeholders: '', kpis: '', risks: '', architecture: '', next_steps: '',
    },
    ai_act_assessment: null,
    ...overrides,
  }
}

describe('computeEuAiActStatusV2 — Basis aus Art.-6-Klassifikation', () => {
  it('gibt null zurück bei leerer Use-Case-Liste', () => {
    expect(computeEuAiActStatusV2([], 0)).toBeNull()
  })

  it('stuft hochrisiko ohne Zuschlag als Hochrisiko ein (Basis 100)', () => {
    const useCases: UseCaseForScoring[] = [{
      governance_result: null,
      canvas: canvas({ ai_act_assessment: { classification: { result: 'hochrisiko' } } }),
    }]
    expect(computeEuAiActStatusV2(useCases, 0)).toEqual({ highCount: 1, limitedCount: 0, minimalCount: 0, classifiedCount: 1, gapCount: 0 })
  })

  it('stuft nicht_anhang_iii ohne Zuschlag als Minimal ein (Basis 0)', () => {
    const useCases: UseCaseForScoring[] = [{
      governance_result: null,
      canvas: canvas({ ai_act_assessment: { classification: { result: 'nicht_anhang_iii' } } }),
    }]
    expect(computeEuAiActStatusV2(useCases, 0)).toEqual({ highCount: 0, limitedCount: 0, minimalCount: 1, classifiedCount: 1, gapCount: 0 })
  })

  it('bewertet einen Canvas OHNE Art.-6-Einordnung mit Basis 0 (statt ihn als Gap auszuschließen)', () => {
    const useCases: UseCaseForScoring[] = [{
      governance_result: null,
      canvas: canvas({ ai_act_assessment: null }),
    }]
    // Basis 0 + kein Zuschlag → minimal, KEIN Gap
    expect(computeEuAiActStatusV2(useCases, 0)).toEqual({ highCount: 0, limitedCount: 0, minimalCount: 1, classifiedCount: 1, gapCount: 0 })
  })
})

describe('computeEuAiActStatusV2 — globaler Regulierungs-Zuschlag', () => {
  it('ein niedriger Zuschlag (unter 34) lässt einen Basis-0-Use-Case Minimal', () => {
    const useCases: UseCaseForScoring[] = [{ governance_result: null, canvas: canvas({ ai_act_assessment: null }) }]
    expect(computeEuAiActStatusV2(useCases, 30)?.minimalCount).toBe(1)
  })

  it('ein mittlerer Zuschlag (34–66) stuft einen Basis-0-Use-Case als Begrenzt ein', () => {
    const useCases: UseCaseForScoring[] = [{ governance_result: null, canvas: canvas({ ai_act_assessment: null }) }]
    expect(computeEuAiActStatusV2(useCases, 40)?.limitedCount).toBe(1)
  })

  it('ein hoher Zuschlag (≥67) stuft auch einen technisch unkritischen Use-Case als Hochrisiko ein', () => {
    const useCases: UseCaseForScoring[] = [{ governance_result: null, canvas: canvas({ ai_act_assessment: { classification: { result: 'nicht_anhang_iii' } } }) }]
    expect(computeEuAiActStatusV2(useCases, 70)?.highCount).toBe(1)
  })

  it('deckelt den kombinierten Score bei 100 (Basis 100 + Zuschlag bleibt Hochrisiko)', () => {
    const useCases: UseCaseForScoring[] = [{ governance_result: null, canvas: canvas({ ai_act_assessment: { classification: { result: 'hochrisiko' } } }) }]
    expect(computeEuAiActStatusV2(useCases, 90)?.highCount).toBe(1)
  })
})

describe('computeEuAiActStatusV2 — Fallback ohne Canvas', () => {
  it('fällt für Use-Cases ohne Canvas auf V1 (governance_result) zurück', () => {
    const useCases: UseCaseForScoring[] = [
      { governance_result: 'stop_dsgvo', canvas: null },
      { governance_result: 'approve', canvas: null },
    ]
    expect(computeEuAiActStatusV2(useCases, 0)).toEqual({ highCount: 1, limitedCount: 0, minimalCount: 1, classifiedCount: 2, gapCount: 0 })
  })

  it('markiert Use-Cases ohne Canvas UND ohne governance_result als Gap', () => {
    const useCases: UseCaseForScoring[] = [{ governance_result: null, canvas: null }]
    expect(computeEuAiActStatusV2(useCases, 0)).toEqual({ highCount: 0, limitedCount: 0, minimalCount: 0, classifiedCount: 0, gapCount: 1 })
  })

  it('kombiniert Canvas-Use-Cases (V2) und canvas-lose Use-Cases (V1-Fallback) korrekt', () => {
    const useCases: UseCaseForScoring[] = [
      { governance_result: null, canvas: canvas({ ai_act_assessment: { classification: { result: 'hochrisiko' } } }) },
      { governance_result: 'approve', canvas: null },
    ]
    expect(computeEuAiActStatusV2(useCases, 0)).toEqual({ highCount: 1, limitedCount: 0, minimalCount: 1, classifiedCount: 2, gapCount: 0 })
  })
})

describe('surchargeFromProgress — Zuschlag aus Regulierungs-Fortschritt', () => {
  const reg = (id: string, pct: number): RegulationProgress => ({ id, label: { de: id, en: id }, completed: 0, total: 10, pct })

  it('liefert 0 bei vollständig abgeschlossenen Regularien', () => {
    expect(surchargeFromProgress([reg('dsgvo', 100), reg('nis2', 100)])).toBe(0)
  })

  it('gewichtet jede Regularie gleich (0,3 pro 100 % Unvollständigkeit)', () => {
    // 1 Regularie bei 0 % → (100-0)*0.3 = 30
    expect(surchargeFromProgress([reg('dsgvo', 0)])).toBe(30)
    // 3 Regularien bei 0 % → 90
    expect(surchargeFromProgress([reg('dsgvo', 0), reg('eu_ai_act', 0), reg('nis2', 0)])).toBe(90)
  })

  it('liefert 0 bei leerer Regularien-Liste', () => {
    expect(surchargeFromProgress([])).toBe(0)
  })
})

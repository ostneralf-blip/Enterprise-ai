import {
  calcWeightedScore,
  deriveQuadrant,
  weightsAreValid,
  DEFAULT_WEIGHTS,
  FREE_LIMIT,
  CRITERIA,
} from '@/config/usecase-data'

describe('Use-Case Scoring Engine', () => {

  describe('calcWeightedScore', () => {
    it('ergibt 3.0 bei allen Scores = 3 mit Default-Gewichten', () => {
      const scores = { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 }
      expect(calcWeightedScore(scores, DEFAULT_WEIGHTS)).toBeCloseTo(3.0, 2)
    })

    it('ergibt 5.0 bei allen Scores = 5', () => {
      const scores = { value: 5, feasibility: 5, data_readiness: 5, risk: 5, speed: 5 }
      expect(calcWeightedScore(scores, DEFAULT_WEIGHTS)).toBeCloseTo(5.0, 2)
    })

    it('ergibt 1.0 bei allen Scores = 1', () => {
      const scores = { value: 1, feasibility: 1, data_readiness: 1, risk: 1, speed: 1 }
      expect(calcWeightedScore(scores, DEFAULT_WEIGHTS)).toBeCloseTo(1.0, 2)
    })

    it('berechnet korrekt mit benutzerdefinierten Gewichten', () => {
      const scores = { value: 5, feasibility: 1, data_readiness: 1, risk: 1, speed: 1 }
      const weights = { value: 1.0, feasibility: 0, data_readiness: 0, risk: 0, speed: 0 }
      expect(calcWeightedScore(scores, weights)).toBeCloseTo(5.0, 2)
    })

    it('fällt auf Standardwert 3 zurück bei fehlendem Score', () => {
      const scores = {} as Record<string, number>
      const result = calcWeightedScore(scores, DEFAULT_WEIGHTS)
      expect(result).toBeCloseTo(3.0, 2)
    })

    it('Default-Gewichte summieren sich exakt auf 1.0', () => {
      const sum = Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1.0, 10)
    })
  })

  describe('deriveQuadrant', () => {
    it('Quick Win bei hohem Value und hoher Feasibility', () => {
      expect(deriveQuadrant({ value: 4, feasibility: 4 })).toBe('quick_win')
    })

    it('Quick Win genau an der Grenze (3/3)', () => {
      expect(deriveQuadrant({ value: 3, feasibility: 3 })).toBe('quick_win')
    })

    it('Strategic Bet bei hohem Value und niedriger Feasibility', () => {
      expect(deriveQuadrant({ value: 5, feasibility: 2 })).toBe('strategic_bet')
    })

    it('Low Hanging Fruit bei niedrigem Value und hoher Feasibility', () => {
      expect(deriveQuadrant({ value: 2, feasibility: 4 })).toBe('low_hanging_fruit')
    })

    it('Avoid bei niedrigem Value und niedriger Feasibility', () => {
      expect(deriveQuadrant({ value: 1, feasibility: 1 })).toBe('avoid')
    })

    it('Grenzwert: value=2 und feasibility=3 → Low Hanging Fruit', () => {
      expect(deriveQuadrant({ value: 2, feasibility: 3 })).toBe('low_hanging_fruit')
    })

    it('Keine Überlappung: alle 4 Quadranten sind disjunkt', () => {
      const results = new Set([
        deriveQuadrant({ value: 5, feasibility: 5 }),
        deriveQuadrant({ value: 5, feasibility: 1 }),
        deriveQuadrant({ value: 1, feasibility: 5 }),
        deriveQuadrant({ value: 1, feasibility: 1 }),
      ])
      expect(results.size).toBe(4)
    })
  })

  describe('weightsAreValid', () => {
    it('akzeptiert Default-Gewichte (Summe = 1.0)', () => {
      expect(weightsAreValid(DEFAULT_WEIGHTS)).toBe(true)
    })

    it('akzeptiert Gewichte mit Fließkommaungenauigkeit (< 1 %)', () => {
      expect(weightsAreValid({ value: 0.34, feasibility: 0.33, data_readiness: 0.33, risk: 0, speed: 0 })).toBe(true)
    })

    it('lehnt Gewichte ab, die > 1 % von 1.0 abweichen', () => {
      expect(weightsAreValid({ value: 0.5, feasibility: 0.3, data_readiness: 0.1, risk: 0.05, speed: 0.0 })).toBe(false)
    })

    it('lehnt leere Gewichte (Summe = 0) ab', () => {
      expect(weightsAreValid({ value: 0, feasibility: 0, data_readiness: 0, risk: 0, speed: 0 })).toBe(false)
    })
  })

  describe('Datenintegrität', () => {
    it('genau 5 Kriterien vorhanden', () => {
      expect(CRITERIA.length).toBe(5)
    })

    it('alle Kriterien haben eindeutige IDs', () => {
      const ids = CRITERIA.map(c => c.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('alle Kriterien haben Low- und High-Label', () => {
      CRITERIA.forEach(c => {
        expect(c.lowLabel.de.length).toBeGreaterThan(0)
        expect(c.highLabel.de.length).toBeGreaterThan(0)
      })
    })

    it('FREE_LIMIT ist 3', () => {
      expect(FREE_LIMIT).toBe(3)
    })

    it('Default-Gewichte decken alle 5 Kriterien ab', () => {
      CRITERIA.forEach(c => {
        expect(DEFAULT_WEIGHTS[c.id]).toBeGreaterThan(0)
      })
    })
  })
})

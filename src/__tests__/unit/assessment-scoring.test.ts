import { calcDimScore, calcTotalScore, deriveArchetype, getMaturityLevel, ASSESSMENT_DIMENSIONS, ALL_QUESTIONS } from '@/config/assessment-data'

describe('Assessment Scoring Engine', () => {

  describe('calcDimScore', () => {
    it('berechnet den korrekten Durchschnitt für eine vollständig beantwortete Dimension', () => {
      const answers = { data_1: 4, data_2: 4, data_3: 4 }
      expect(calcDimScore(answers, 'data')).toBe(4)
    })

    it('berechnet korrekt bei unterschiedlichen Werten', () => {
      const answers = { data_1: 1, data_2: 3, data_3: 5 }
      expect(calcDimScore(answers, 'data')).toBe(3) // (1+3+5)/3 = 3
    })

    it('gibt null zurück wenn keine Frage der Dimension beantwortet wurde', () => {
      expect(calcDimScore({}, 'data')).toBeNull()
    })

    it('gibt null zurück bei unbekannter Dimension-ID', () => {
      expect(calcDimScore({ data_1: 5 }, 'nonexistent')).toBeNull()
    })
  })

  describe('calcTotalScore', () => {
    it('gibt null zurück wenn keine Antworten vorhanden sind', () => {
      expect(calcTotalScore({})).toBeNull()
    })

    it('berechnet einen gewichteten Score über alle Dimensionen bei vollständigen Antworten', () => {
      const fullAnswers: Record<string, number> = {}
      ALL_QUESTIONS.forEach(q => { fullAnswers[q.id] = 3 })
      const score = calcTotalScore(fullAnswers)
      expect(score).toBeCloseTo(3, 1)
    })

    it('liegt immer zwischen 1 und 5 bei gültigen Eingaben', () => {
      const fullAnswers: Record<string, number> = {}
      ALL_QUESTIONS.forEach(q => { fullAnswers[q.id] = 5 })
      const score = calcTotalScore(fullAnswers)
      expect(score).toBeGreaterThanOrEqual(1)
      expect(score).toBeLessThanOrEqual(5)
    })

    it('Summe aller Gewichte ergibt 1.0 (Datenintegrität der Konfiguration)', () => {
      const sum = ASSESSMENT_DIMENSIONS.reduce((acc, d) => acc + d.weight, 0)
      expect(sum).toBeCloseTo(1.0, 5)
    })
  })

  describe('deriveArchetype', () => {
    it('ordnet niedrige Scores "starter" zu', () => {
      expect(deriveArchetype(1.5)).toBe('starter')
      expect(deriveArchetype(2.4)).toBe('starter')
    })

    it('ordnet mittlere Scores "scaler" zu', () => {
      expect(deriveArchetype(2.5)).toBe('scaler')
      expect(deriveArchetype(3.7)).toBe('scaler')
    })

    it('ordnet hohe Scores "transformer" zu', () => {
      expect(deriveArchetype(3.8)).toBe('transformer')
      expect(deriveArchetype(5.0)).toBe('transformer')
    })

    it('Grenzwerte sind eindeutig (keine Überlappung)', () => {
      expect(deriveArchetype(2.49)).toBe('starter')
      expect(deriveArchetype(2.5)).toBe('scaler')
      expect(deriveArchetype(3.79)).toBe('scaler')
      expect(deriveArchetype(3.8)).toBe('transformer')
    })
  })

  describe('getMaturityLevel', () => {
    it('ordnet allen 5 Stufen korrekt zu', () => {
      expect(getMaturityLevel(1.0).level).toBe(1)
      expect(getMaturityLevel(2.0).level).toBe(2)
      expect(getMaturityLevel(3.0).level).toBe(3)
      expect(getMaturityLevel(4.0).level).toBe(4)
      expect(getMaturityLevel(5.0).level).toBe(5)
    })

    it('gibt für jede Stufe ein Label und eine Farbe zurück', () => {
      for (let s = 1; s <= 5; s += 0.5) {
        const result = getMaturityLevel(s)
        expect(result.label).toBeTruthy()
        expect(result.color).toBeTruthy()
        expect(result.bgColor).toBeTruthy()
      }
    })
  })

  describe('Datenintegrität der Konfiguration', () => {
    it('hat genau 16 Fragen total (MVP-Spezifikation)', () => {
      expect(ALL_QUESTIONS.length).toBe(16)
    })

    it('jede Frage hat eine eindeutige ID', () => {
      const ids = ALL_QUESTIONS.map(q => q.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('jede Dimension hat mindestens 2 Fragen', () => {
      ASSESSMENT_DIMENSIONS.forEach(dim => {
        expect(dim.questions.length).toBeGreaterThanOrEqual(2)
      })
    })

    it('jede Frage hat Low- und High-Label definiert', () => {
      ALL_QUESTIONS.forEach(q => {
        expect(q.lowLabel).toBeTruthy()
        expect(q.highLabel).toBeTruthy()
        expect(q.lowLabel).not.toBe(q.highLabel)
      })
    })
  })
})

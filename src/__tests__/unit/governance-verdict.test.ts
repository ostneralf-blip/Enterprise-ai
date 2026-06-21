import { calculateVerdict, GOVERNANCE_GATES, getGateReviews } from '@/config/governance-data'
import type { GateAnswers } from '@/config/governance-data'

// Helper: Antwortet immer mit der grünen Option
function allGreenAnswers(): GateAnswers {
  const answers: GateAnswers = {}
  for (const gate of GOVERNANCE_GATES) {
    const green = gate.options.find(o => o.weight === 'green')
    if (green) answers[gate.id] = green.id
  }
  return answers
}

describe('Governance: Verdict-Berechnung', () => {

  describe('Freigabe empfohlen', () => {
    it('gibt "approved" zurück wenn alle Antworten grün sind', () => {
      expect(calculateVerdict(allGreenAnswers()).level).toBe('approved')
    })

    it('gibt "approved"-Icon und grüne Farbe zurück', () => {
      const v = calculateVerdict(allGreenAnswers())
      expect(v.icon).toBe('🟢')
      expect(v.color).toBe('green')
    })
  })

  describe('Unzulässig', () => {
    it('gibt "unlawful" zurück wenn risk_class = unacceptable', () => {
      const answers = { ...allGreenAnswers(), risk_class: 'unacceptable' }
      expect(calculateVerdict(answers).level).toBe('unlawful')
    })

    it('"unlawful" hat rotes Icon und Farbe', () => {
      const v = calculateVerdict({ ...allGreenAnswers(), risk_class: 'unacceptable' })
      expect(v.icon).toBe('⛔')
      expect(v.color).toBe('red')
    })
  })

  describe('Deployment nicht empfohlen', () => {
    it('gibt "stop" zurück bei 3 roten Antworten', () => {
      const answers = {
        ...allGreenAnswers(),
        personal_data: 'sensitive',    // red
        human_impact: 'autonomous',    // red
        documentation: 'missing',      // red
      }
      expect(calculateVerdict(answers).level).toBe('stop')
    })

    it('"stop" hat rotes Icon', () => {
      const answers = {
        ...allGreenAnswers(),
        personal_data: 'sensitive',
        human_impact: 'autonomous',
        documentation: 'missing',
      }
      expect(calculateVerdict(answers).icon).toBe('🔴')
    })
  })

  describe('Bedingtes Deployment', () => {
    it('gibt "conditional" zurück bei 1 roten Antwort', () => {
      const answers = { ...allGreenAnswers(), documentation: 'missing' }
      expect(calculateVerdict(answers).level).toBe('conditional')
    })

    it('gibt "conditional" zurück bei 4 gelben Antworten', () => {
      const answers: GateAnswers = {}
      // 4 gelbe Antworten
      let yellowCount = 0
      for (const gate of GOVERNANCE_GATES) {
        const yellow = gate.options.find(o => o.weight === 'yellow')
        const green = gate.options.find(o => o.weight === 'green')
        if (yellow && yellowCount < 4) { answers[gate.id] = yellow.id; yellowCount++ }
        else if (green) { answers[gate.id] = green.id }
      }
      expect(calculateVerdict(answers).level).toBe('conditional')
    })

    it('"conditional" hat gelbes Icon', () => {
      const answers = { ...allGreenAnswers(), documentation: 'missing' }
      expect(calculateVerdict(answers).icon).toBe('🟡')
    })
  })

  describe('GOVERNANCE_GATES Datenintegrität', () => {
    it('enthält genau 6 Gates', () => {
      expect(GOVERNANCE_GATES).toHaveLength(6)
    })

    it('jedes Gate hat eine eindeutige step-Nummer 1-6', () => {
      const steps = GOVERNANCE_GATES.map(g => g.step).sort()
      expect(steps).toEqual([1, 2, 3, 4, 5, 6])
    })

    it('jedes Gate hat mindestens eine grüne Option', () => {
      GOVERNANCE_GATES.forEach(gate => {
        const hasGreen = gate.options.some(o => o.weight === 'green')
        expect(hasGreen).toBe(true)
      })
    })

    it('alle Optionen haben id, label, description und weight', () => {
      GOVERNANCE_GATES.forEach(gate => {
        gate.options.forEach(option => {
          expect(option.id).toBeTruthy()
          expect(option.label).toBeTruthy()
          expect(option.description).toBeTruthy()
          expect(['red', 'yellow', 'green']).toContain(option.weight)
        })
      })
    })
  })

  describe('getGateReviews', () => {
    it('gibt für jedes Gate eine Review zurück', () => {
      const reviews = getGateReviews(allGreenAnswers())
      expect(reviews).toHaveLength(GOVERNANCE_GATES.length)
    })

    it('reviews enthalten gate und option', () => {
      const reviews = getGateReviews(allGreenAnswers())
      reviews.forEach(r => {
        expect(r.gate).toBeDefined()
        expect(r.option).toBeDefined()
        expect(r.option.weight).toBeDefined()
      })
    })
  })
})

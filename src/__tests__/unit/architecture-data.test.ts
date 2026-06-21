import { WIZARD_STEPS, generateArchitecture, selectPattern, type WizardAnswers } from '@/config/architecture-data'

describe('Architektur-Daten: Integrität', () => {

  describe('Wizard-Schritte', () => {
    it('genau 5 Wizard-Schritte sind definiert', () => {
      expect(WIZARD_STEPS).toHaveLength(5)
    })

    it('jeder Schritt hat id, step, question, context und options', () => {
      WIZARD_STEPS.forEach(step => {
        expect(step.id).toBeTruthy()
        expect(step.step).toBeGreaterThan(0)
        expect(step.question).toBeTruthy()
        expect(step.context).toBeTruthy()
        expect(step.options.length).toBeGreaterThanOrEqual(2)
      })
    })

    it('Schritte sind von 1–5 durchnummeriert', () => {
      WIZARD_STEPS.forEach((step, i) => {
        expect(step.step).toBe(i + 1)
      })
    })

    it('jede Option hat id, label und description', () => {
      WIZARD_STEPS.forEach(step => {
        step.options.forEach(opt => {
          expect(opt.id).toBeTruthy()
          expect(opt.label).toBeTruthy()
          expect(opt.description).toBeTruthy()
        })
      })
    })
  })

  describe('Pattern-Selektion', () => {
    it('strenge Compliance → onprem', () => {
      expect(selectPattern({ compliance: 'strict' })).toBe('onprem')
    })

    it('On-Premise-Infra → onprem', () => {
      expect(selectPattern({ infra: 'onprem' })).toBe('onprem')
    })

    it('fehlende Datenbasis → data_first', () => {
      expect(selectPattern({ data: 'to_build' })).toBe('data_first')
    })

    it('Silos-Daten → data_first', () => {
      expect(selectPattern({ data: 'silos' })).toBe('data_first')
    })

    it('business-only Skills → managed', () => {
      expect(selectPattern({ skills: 'business', infra: 'cloud' })).toBe('managed')
    })

    it('Cloud + eigenes Team → cloud_native', () => {
      expect(selectPattern({ infra: 'cloud', skills: 'team' })).toBe('cloud_native')
    })

    it('Hybrid-Infra → hybrid', () => {
      expect(selectPattern({ infra: 'hybrid', skills: 'individuals' })).toBe('hybrid')
    })

    it('keine Antworten → default hybrid', () => {
      expect(selectPattern({})).toBe('hybrid')
    })
  })

  describe('Architektur-Generierung', () => {
    const ALL_COMBINATIONS: WizardAnswers[] = [
      { infra: 'cloud', data: 'centralized', skills: 'team', usecase: 'predictive', compliance: 'moderate' },
      { infra: 'cloud', data: 'centralized', skills: 'business', usecase: 'generative', compliance: 'low' },
      { infra: 'hybrid', data: 'distributed', skills: 'individuals', usecase: 'automation', compliance: 'moderate' },
      { infra: 'onprem', data: 'centralized', skills: 'team', usecase: 'vision', compliance: 'strict' },
      { infra: 'cloud', data: 'to_build', skills: 'individuals', usecase: 'predictive', compliance: 'moderate' },
    ]

    ALL_COMBINATIONS.forEach((answers, i) => {
      it(`Kombination ${i + 1} produziert valides Ergebnis`, () => {
        const result = generateArchitecture(answers)
        expect(result.patternId).toBeTruthy()
        expect(result.pattern).toBeTruthy()
        expect(result.summary).toBeTruthy()
        expect(result.layers).toHaveLength(4)
        expect(result.keyDecisions.length).toBeGreaterThanOrEqual(3)
        expect(result.nextSteps.length).toBeGreaterThanOrEqual(3)
      })
    })

    it('jede Schicht hat name, role, components und examples', () => {
      const result = generateArchitecture({ infra: 'cloud', skills: 'team', data: 'centralized' })
      result.layers.forEach(layer => {
        expect(layer.name).toBeTruthy()
        expect(layer.role).toBeTruthy()
        expect(layer.components.length).toBeGreaterThan(0)
        expect(layer.examples).toBeTruthy()
      })
    })

    it('Ergebnis hat color-Objekt mit bg, border, badge und title', () => {
      const result = generateArchitecture({ infra: 'hybrid' })
      expect(result.color.bg).toBeTruthy()
      expect(result.color.border).toBeTruthy()
      expect(result.color.badge).toBeTruthy()
      expect(result.color.title).toBeTruthy()
    })
  })
})

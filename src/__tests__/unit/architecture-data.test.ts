import { WIZARD_STEPS, generateArchitecture, selectPattern, type WizardAnswers } from '@/config/architecture-data'

describe('Architektur-Daten: Integrität', () => {

  describe('Wizard-Schritte', () => {
    it('genau 12 Wizard-Schritte sind definiert', () => {
      expect(WIZARD_STEPS).toHaveLength(12)
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

    it('Schritte sind von 1–12 durchnummeriert', () => {
      WIZARD_STEPS.forEach((step, i) => {
        expect(step.step).toBe(i + 1)
      })
    })

    it('Schritt 5 fragt nach SAP-Landschaft', () => {
      const step = WIZARD_STEPS[4]
      expect(step.id).toBe('sap_landscape')
      expect(step.options.some(o => o.id === 'full')).toBe(true)
      expect(step.options.some(o => o.id === 'none')).toBe(true)
    })

    it('Schritt 6 fragt nach Cloud-Anbieter', () => {
      const step = WIZARD_STEPS[5]
      expect(step.id).toBe('cloud_provider_hint')
      expect(step.options.some(o => o.id === 'azure')).toBe(true)
      expect(step.options.some(o => o.id === 'aws')).toBe(true)
      expect(step.options.some(o => o.id === 'sap_btp')).toBe(true)
    })

    it('Schritt 7 fragt nach Branche', () => {
      const step = WIZARD_STEPS[6]
      expect(step.id).toBe('industry')
      expect(step.options.some(o => o.id === 'finance')).toBe(true)
      expect(step.options.some(o => o.id === 'manufacturing')).toBe(true)
    })

    it('Schritt 8 fragt nach Unternehmensgröße', () => {
      const step = WIZARD_STEPS[7]
      expect(step.id).toBe('company_size')
      expect(step.options.some(o => o.id === 'small')).toBe(true)
      expect(step.options.some(o => o.id === 'enterprise')).toBe(true)
    })

    it('Schritt 10 fragt nach Data-Plattform', () => {
      const step = WIZARD_STEPS[9]
      expect(step.id).toBe('data_platform')
      expect(step.options.some(o => o.id === 'sap_bw')).toBe(true)
      expect(step.options.some(o => o.id === 'snowflake')).toBe(true)
    })

    it('Schritt 11 fragt nach Model-Plattform', () => {
      const step = WIZARD_STEPS[10]
      expect(step.id).toBe('model_platform')
      expect(step.options.some(o => o.id === 'sap_ai_core')).toBe(true)
      expect(step.options.some(o => o.id === 'cloud_ml')).toBe(true)
    })

    it('Schritt 12 fragt nach Monitoring-Ansatz', () => {
      const step = WIZARD_STEPS[11]
      expect(step.id).toBe('monitoring')
      expect(step.options.some(o => o.id === 'enterprise')).toBe(true)
      expect(step.options.some(o => o.id === 'open_source_monitor')).toBe(true)
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

    it('data_platform=snowflake ersetzt Layer-0-Beispiele durch Snowflake-spezifische Tools', () => {
      const result = generateArchitecture({ infra: 'cloud', skills: 'team', data: 'centralized', data_platform: 'snowflake' })
      expect(result.layers[0].examples).toContain('Snowflake')
      expect(result.layers[0].examples).toContain('dbt')
    })

    it('model_platform=sap_ai_core ersetzt Layer-1-Beispiele durch SAP-Tools', () => {
      const result = generateArchitecture({ infra: 'cloud', skills: 'team', data_platform: 'sap_bw', model_platform: 'sap_ai_core' })
      expect(result.layers[1].examples).toContain('SAP AI Core')
    })

    it('monitoring=open_source_monitor ersetzt Layer-2-Beispiele durch Open-Source-Tools', () => {
      const result = generateArchitecture({ infra: 'hybrid', monitoring: 'open_source_monitor' })
      expect(result.layers[2].examples).toContain('Evidently AI')
    })

    it('ohne Technologie-Schritte bleiben generische Beispiele erhalten', () => {
      const result = generateArchitecture({ infra: 'cloud', skills: 'team', data: 'centralized' })
      // Generische Beispiele sollten noch vorhanden sein
      expect(result.layers[0].examples).toContain('z. B.')
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

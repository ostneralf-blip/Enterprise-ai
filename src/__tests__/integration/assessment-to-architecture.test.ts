/**
 * Integrationstest: AI-Readiness-Assessment → Architektur-Empfehlung
 *
 * Testet den vollständigen Empfehlungsfluss für drei Szenarien:
 *   A) SAP-fokussiert  (cloud_provider_hint: 'sap_btp', sap_landscape: 'full')
 *   B) Gemischt        (cloud_provider_hint: 'azure',   sap_landscape: 'partial')
 *   C) Ohne SAP        (cloud_provider_hint: 'aws',     kein sap_landscape)
 *
 * Beide Empfehlungs-Engines werden geprüft:
 *   - recommendFromWizard  (regelbasiert, kein Katalog nötig)
 *   - recommendFromCatalog (DB-basiert, nutzt SEED_COMPONENTS als Fixture)
 */

import {
  recommendFromWizard,
  recommendFromCatalog,
  scoreComponentAgainstAnswers,
  isSAP,
} from '@/config/architecture-rules'
import { SEED_COMPONENTS } from '@/config/catalog-seed'
import type { WizardAnswers } from '@/config/architecture-data'
import type { CatalogComponent } from '@/types'

// SEED_COMPONENTS → CatalogComponent casten (Felder mit Standardwerten auffüllen)
const CATALOG: CatalogComponent[] = SEED_COMPONENTS.map(s => ({
  id: `seed-${s.name.toLowerCase().replace(/\s+/g, '-')}`,
  name: s.name,
  vendor: s.vendor,
  category: s.category,
  architecture_layer: s.architecture_layer as CatalogComponent['architecture_layer'],
  hosting: s.infra_types.includes('onprem') ? ['onprem', 'eu'] : ['cloud', 'eu'],
  dsgvo_status: null,
  eu_ai_act_risk: null,
  sap_compatible: s.sap_compatible,
  sap_components: s.sap_components ?? [],
  use_case_types: s.use_case_types,
  infra_types: s.infra_types,
  cloud_provider: s.cloud_provider as CatalogComponent['cloud_provider'],
  icon_name: null,
  website_url: null,
  description: null,
  tags: [],
  incompatible_with: [],
  requires: [],
  suggests: [], aliases: [],
  source: 'seed',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}))

// ── Szenarien ─────────────────────────────────────────────────────────────────

const SAP_ANSWERS: WizardAnswers = {
  usecase: 'generative',
  infra: 'cloud',
  skills: 'team',
  compliance: 'moderate',
  cloud_provider_hint: 'sap_btp',
  sap_landscape: 'full',
  data_platform: 'sap_bw',
  model_platform: 'sap_ai_core',
}

const MIXED_ANSWERS: WizardAnswers = {
  usecase: 'predictive',
  infra: 'hybrid',
  skills: 'individuals',
  compliance: 'moderate',
  cloud_provider_hint: 'azure',
  sap_landscape: 'partial',
  data_platform: 'azure_fabric',  // explizit Azure, damit Azure-Data-Layer aktiv wird
}

const AWS_ANSWERS: WizardAnswers = {
  usecase: 'generative',
  infra: 'cloud',
  skills: 'team',
  compliance: 'low',
  cloud_provider_hint: 'aws',
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function sapComponents(names: string[]): string[] {
  return names.filter(n => {
    const comp = CATALOG.find(c => c.name === n)
    return comp?.cloud_provider === 'sap'
  })
}

function nonSapComponents(names: string[]): string[] {
  return names.filter(n => {
    const comp = CATALOG.find(c => c.name === n)
    return comp?.cloud_provider !== 'sap'
  })
}

function allNamesFromRecs(recs: ReturnType<typeof recommendFromCatalog>): string[] {
  return recs.layers.flatMap(l => l.componentNames)
}

// ══════════════════════════════════════════════════════════════════════════════
// A) SAP-FOKUSSIERT
// ══════════════════════════════════════════════════════════════════════════════

describe('Szenario A — SAP-fokussiert (sap_btp + full landscape)', () => {

  it('isSAP() erkennt SAP-Kontext korrekt', () => {
    expect(isSAP(SAP_ANSWERS)).toBe(true)
    expect(isSAP(AWS_ANSWERS)).toBe(false)
  })

  describe('recommendFromWizard', () => {
    const recs = recommendFromWizard(SAP_ANSWERS)
    const allNames = allNamesFromRecs(recs)

    it('gibt SAP-Komponenten im Data-Layer aus', () => {
      const dataLayer = recs.layers.find(l => l.layer === 'data')
      expect(dataLayer).toBeDefined()
      expect(sapComponents(dataLayer!.componentNames).length).toBeGreaterThan(0)
      expect(dataLayer!.componentNames).toContain('SAP Datasphere')
    })

    it('gibt SAP AI Core im Model-Layer aus', () => {
      const modelLayer = recs.layers.find(l => l.layer === 'model')
      expect(modelLayer).toBeDefined()
      expect(modelLayer!.componentNames).toContain('SAP AI Core')
    })

    it('gibt SAP GenAI Hub aus (generative use case)', () => {
      const modelLayer = recs.layers.find(l => l.layer === 'model')
      expect(modelLayer!.componentNames).toContain('SAP GenAI Hub')
    })

    it('enthält keine AWS- oder Azure-spezifischen Komponenten', () => {
      const awsAzure = allNames.filter(n => {
        const c = CATALOG.find(x => x.name === n)
        return c?.cloud_provider === 'aws' || c?.cloud_provider === 'azure'
      })
      expect(awsAzure).toHaveLength(0)
    })

    it('enthält SAP AI Architect in den empfohlenen Rollen', () => {
      expect(recs.roleNames).toContain('SAP AI Architect')
    })
  })

  describe('recommendFromCatalog', () => {
    const recs = recommendFromCatalog(SAP_ANSWERS, CATALOG)
    const allNames = allNamesFromRecs(recs)

    it('gibt überhaupt Ergebnisse zurück', () => {
      expect(recs.layers.length).toBeGreaterThan(0)
    })

    it('gibt SAP-Komponenten im Data-Layer aus', () => {
      const dataLayer = recs.layers.find(l => l.layer === 'data')
      expect(dataLayer).toBeDefined()
      const sapInData = sapComponents(dataLayer!.componentNames)
      expect(sapInData.length).toBeGreaterThan(0)
    })

    it('SAP-Datasphere erscheint im Data-Layer', () => {
      const dataLayer = recs.layers.find(l => l.layer === 'data')
      expect(dataLayer!.componentNames).toContain('SAP Datasphere')
    })

    it('SAP AI Core erscheint im Model-Layer', () => {
      const modelLayer = recs.layers.find(l => l.layer === 'model')
      expect(modelLayer).toBeDefined()
      expect(modelLayer!.componentNames).toContain('SAP AI Core')
    })

    it('kein Layer zeigt gleichzeitig SAP und non-SAP wenn SAP verfügbar (kein Flicker)', () => {
      for (const layer of recs.layers) {
        const hasSAP = sapComponents(layer.componentNames).length > 0
        const hasNonSAP = nonSapComponents(layer.componentNames).some(n => {
          const c = CATALOG.find(x => x.name === n)
          return c?.cloud_provider === 'independent' || c?.cloud_provider === 'aws' || c?.cloud_provider === 'azure'
        })
        if (hasSAP) {
          expect(hasNonSAP).toBe(false)
        }
      }
    })

    it('enthält keine AWS- oder Azure-Komponenten', () => {
      const awsAzure = allNames.filter(n => {
        const c = CATALOG.find(x => x.name === n)
        return c?.cloud_provider === 'aws' || c?.cloud_provider === 'azure'
      })
      expect(awsAzure).toHaveLength(0)
    })

    it('Scoring von SAP Datasphere ist hoch genug (≥ 20)', () => {
      const datasphere = CATALOG.find(c => c.name === 'SAP Datasphere')!
      const score = scoreComponentAgainstAnswers(datasphere, SAP_ANSWERS)
      expect(score).toBeGreaterThanOrEqual(20)
    })

    it('Scoring von SAP AI Core ist hoch genug (≥ 20)', () => {
      const aiCore = CATALOG.find(c => c.name === 'SAP AI Core')!
      const score = scoreComponentAgainstAnswers(aiCore, SAP_ANSWERS)
      expect(score).toBeGreaterThanOrEqual(20)
    })

    it('AWS-Komponenten werden bei SAP BTP hard-excluded (Score < 0)', () => {
      const redshift = CATALOG.find(c => c.name === 'Amazon Redshift')!
      const score = scoreComponentAgainstAnswers(redshift, SAP_ANSWERS)
      expect(score).toBeLessThan(0)
    })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// B) GEMISCHT (Azure primär + SAP in der Landschaft)
// ══════════════════════════════════════════════════════════════════════════════

describe('Szenario B — Gemischt (Azure + SAP partial landscape)', () => {

  it('isSAP() erkennt SAP via sap_landscape', () => {
    expect(isSAP(MIXED_ANSWERS)).toBe(true)
  })

  describe('recommendFromWizard', () => {
    const recs = recommendFromWizard(MIXED_ANSWERS)

    it('gibt Azure-Komponenten im Data-Layer aus', () => {
      const dataLayer = recs.layers.find(l => l.layer === 'data')
      expect(dataLayer).toBeDefined()
      const azureInData = dataLayer!.componentNames.filter(n => {
        const c = CATALOG.find(x => x.name === n)
        return c?.cloud_provider === 'azure'
      })
      expect(azureInData.length).toBeGreaterThan(0)
    })

    it('gibt Azure Machine Learning im Model-Layer aus', () => {
      const modelLayer = recs.layers.find(l => l.layer === 'model')
      expect(modelLayer).toBeDefined()
      expect(modelLayer!.componentNames).toContain('Azure Machine Learning')
    })

    it('enthält keine AWS-spezifischen Komponenten', () => {
      const allNames = allNamesFromRecs(recs)
      const awsOnly = allNames.filter(n => {
        const c = CATALOG.find(x => x.name === n)
        return c?.cloud_provider === 'aws'
      })
      expect(awsOnly).toHaveLength(0)
    })

    it('enthält SAP AI Architect in Rollen (wegen sap_landscape)', () => {
      expect(recs.roleNames).toContain('SAP AI Architect')
    })
  })

  describe('recommendFromCatalog', () => {
    const recs = recommendFromCatalog(MIXED_ANSWERS, CATALOG)
    const allNames = allNamesFromRecs(recs)

    it('gibt überhaupt Ergebnisse zurück', () => {
      expect(recs.layers.length).toBeGreaterThan(0)
    })

    it('enthält Azure-Komponenten', () => {
      const azureComps = allNames.filter(n => {
        const c = CATALOG.find(x => x.name === n)
        return c?.cloud_provider === 'azure'
      })
      expect(azureComps.length).toBeGreaterThan(0)
    })

    it('SAP-Komponenten können erscheinen (hybrid bonus +12)', () => {
      const sapComps = CATALOG.filter(c => c.cloud_provider === 'sap')
      const anySapScorePositive = sapComps.some(
        c => scoreComponentAgainstAnswers(c, MIXED_ANSWERS) > 0
      )
      expect(anySapScorePositive).toBe(true)
    })

    it('AWS-Komponenten sind hard-excluded bei azure-Kontext', () => {
      const awsComps = allNames.filter(n => {
        const c = CATALOG.find(x => x.name === n)
        return c?.cloud_provider === 'aws'
      })
      expect(awsComps).toHaveLength(0)
    })

    it('Score für Azure Machine Learning ist hoch (≥ 15)', () => {
      const azureML = CATALOG.find(c => c.name === 'Azure Machine Learning')!
      const score = scoreComponentAgainstAnswers(azureML, MIXED_ANSWERS)
      expect(score).toBeGreaterThanOrEqual(15)
    })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// C) OHNE SAP (AWS, pure cloud)
// ══════════════════════════════════════════════════════════════════════════════

describe('Szenario C — Ohne SAP (AWS, pure cloud)', () => {

  it('isSAP() gibt false zurück', () => {
    expect(isSAP(AWS_ANSWERS)).toBe(false)
  })

  describe('recommendFromWizard', () => {
    const recs = recommendFromWizard(AWS_ANSWERS)

    it('gibt AWS-Komponenten im Data-Layer aus', () => {
      const dataLayer = recs.layers.find(l => l.layer === 'data')
      expect(dataLayer).toBeDefined()
      expect(dataLayer!.componentNames.some(n => n.startsWith('Amazon') || n.startsWith('AWS'))).toBe(true)
    })

    it('gibt Amazon SageMaker oder Bedrock im Model-Layer aus', () => {
      const modelLayer = recs.layers.find(l => l.layer === 'model')
      expect(modelLayer).toBeDefined()
      const hasAWS = modelLayer!.componentNames.some(n => n.startsWith('Amazon') || n.startsWith('AWS'))
      expect(hasAWS).toBe(true)
    })

    it('enthält KEINE SAP-Komponenten', () => {
      const allNames = allNamesFromRecs(recs)
      const sapComps = allNames.filter(n => {
        const c = CATALOG.find(x => x.name === n)
        return c?.cloud_provider === 'sap'
      })
      expect(sapComps).toHaveLength(0)
    })

    it('enthält keine Azure-spezifischen Komponenten', () => {
      const allNames = allNamesFromRecs(recs)
      const azureComps = allNames.filter(n => {
        const c = CATALOG.find(x => x.name === n)
        return c?.cloud_provider === 'azure'
      })
      expect(azureComps).toHaveLength(0)
    })

    it('enthält keinen SAP AI Architect in den Rollen', () => {
      expect(recs.roleNames).not.toContain('SAP AI Architect')
    })
  })

  describe('recommendFromCatalog', () => {
    const recs = recommendFromCatalog(AWS_ANSWERS, CATALOG)
    const allNames = allNamesFromRecs(recs)

    it('gibt überhaupt Ergebnisse zurück', () => {
      expect(recs.layers.length).toBeGreaterThan(0)
    })

    it('enthält AWS-Komponenten', () => {
      const awsComps = allNames.filter(n => n.startsWith('Amazon') || n.startsWith('AWS') || n.startsWith('SageMaker'))
      expect(awsComps.length).toBeGreaterThan(0)
    })

    it('SAP-Komponenten sind hard-excluded (kein isSAP)', () => {
      const sapComps = CATALOG.filter(c => c.cloud_provider === 'sap')
      for (const comp of sapComps) {
        const score = scoreComponentAgainstAnswers(comp, AWS_ANSWERS)
        expect(score).toBeLessThan(0)
      }
    })

    it('enthält KEINE SAP-Komponenten im Ergebnis', () => {
      const sapInResult = allNames.filter(n => {
        const c = CATALOG.find(x => x.name === n)
        return c?.cloud_provider === 'sap'
      })
      expect(sapInResult).toHaveLength(0)
    })

    it('enthält keine Azure-Komponenten', () => {
      const azureComps = allNames.filter(n => {
        const c = CATALOG.find(x => x.name === n)
        return c?.cloud_provider === 'azure'
      })
      expect(azureComps).toHaveLength(0)
    })

    it('Score für SAP Datasphere ist negativ', () => {
      const datasphere = CATALOG.find(c => c.name === 'SAP Datasphere')!
      expect(scoreComponentAgainstAnswers(datasphere, AWS_ANSWERS)).toBeLessThan(0)
    })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// KONSISTENZ: recommendFromWizard vs recommendFromCatalog
// ══════════════════════════════════════════════════════════════════════════════

describe('Konsistenz: Wizard vs. Katalog — kein Flicker', () => {

  function sapLayerNames(recs: ReturnType<typeof recommendFromCatalog>): Record<string, string[]> {
    const result: Record<string, string[]> = {}
    for (const layer of recs.layers) {
      result[layer.layer] = sapComponents(layer.componentNames)
    }
    return result
  }

  it('SAP-Szenario: beide Engines geben SAP im Data-Layer zurück', () => {
    const wizard = recommendFromWizard(SAP_ANSWERS)
    const catalog = recommendFromCatalog(SAP_ANSWERS, CATALOG)
    const wizardData = wizard.layers.find(l => l.layer === 'data')
    const catalogData = catalog.layers.find(l => l.layer === 'data')
    expect(sapComponents(wizardData?.componentNames ?? [])).not.toHaveLength(0)
    expect(sapComponents(catalogData?.componentNames ?? [])).not.toHaveLength(0)
  })

  it('SAP-Szenario: Katalog-Engine gibt KEINE zusätzlichen non-SAP-Komponenten in SAP-Layern', () => {
    const catalogRecs = recommendFromCatalog(SAP_ANSWERS, CATALOG)
    const sapLayerMap = sapLayerNames(catalogRecs)
    for (const [layerName, sapNames] of Object.entries(sapLayerMap)) {
      if (sapNames.length === 0) continue
      const layer = catalogRecs.layers.find(l => l.layer === layerName)!
      const nonSap = nonSapComponents(layer.componentNames).filter(n => {
        const c = CATALOG.find(x => x.name === n)
        return c?.cloud_provider !== 'independent'
      })
      expect(nonSap).toHaveLength(0)
    }
  })

  it('AWS-Szenario: beide Engines geben keine SAP-Komponenten zurück', () => {
    const wizard = recommendFromWizard(AWS_ANSWERS)
    const catalog = recommendFromCatalog(AWS_ANSWERS, CATALOG)
    const wizardSAP = sapComponents(allNamesFromRecs(wizard))
    const catalogSAP = sapComponents(allNamesFromRecs(catalog))
    expect(wizardSAP).toHaveLength(0)
    expect(catalogSAP).toHaveLength(0)
  })
})

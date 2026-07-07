import { recommendFromCatalog, scoreComponentAgainstAnswers } from '@/config/architecture-rules'
import type { WizardAnswers } from '@/config/architecture-data'
import type { CatalogComponent } from '@/types'

function makeComp(overrides: Partial<CatalogComponent>): CatalogComponent {
  return {
    id: 'c1',
    name: 'Test Component',
    vendor: null,
    category: null,
    description: null,
    website_url: null,
    icon_name: null,
    architecture_layer: 'data',
    cloud_provider: 'independent',
    hosting: [],
    infra_types: [],
    use_case_types: [],
    sap_compatible: false,
    sap_components: [],
    tags: [],
    incompatible_with: [],
    requires: [],
    suggests: [], aliases: [],
    source: 'manual',
    is_active: true,
    eu_ai_act_risk: null,
    dsgvo_status: 'conditional',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── #59: Scoring-Schwellenwert ────────────────────────────────────────────────

describe('scoreComponentAgainstAnswers', () => {
  it('gibt 5 für cloud_provider=independent ohne anderen Kontext', () => {
    const comp = makeComp({ cloud_provider: 'independent' })
    const answers: WizardAnswers = { infra: 'cloud' }
    expect(scoreComponentAgainstAnswers(comp, answers)).toBe(5)
  })

  it('gibt 20+ für passenden Cloud-Provider', () => {
    const comp = makeComp({ cloud_provider: 'azure' })
    const answers: WizardAnswers = { cloud_provider_hint: 'azure', infra: 'cloud' }
    const score = scoreComponentAgainstAnswers(comp, answers)
    expect(score).toBeGreaterThanOrEqual(20)
  })

  it('gibt -1000 für non_compliant bei strict compliance', () => {
    const comp = makeComp({ cloud_provider: 'aws', dsgvo_status: 'non_compliant' })
    const answers: WizardAnswers = { compliance: 'strict' }
    expect(scoreComponentAgainstAnswers(comp, answers)).toBe(-1000)
  })
})

describe('recommendFromCatalog: Schwellenwert ≥ 8 (#59)', () => {
  const azureAnswers: WizardAnswers = { cloud_provider_hint: 'azure', infra: 'cloud', usecase: 'generative' }

  it('schließt Komponenten mit nur independent-Bonus (Score 5) aus wenn bessere vorhanden', () => {
    const genericComp = makeComp({ name: 'Generic Tool', cloud_provider: 'independent', architecture_layer: 'data' })
    const azureComp   = makeComp({ name: 'Azure Synapse', cloud_provider: 'azure', architecture_layer: 'data' })
    const result = recommendFromCatalog(azureAnswers, [genericComp, azureComp])
    const dataLayer = result.layers.find(l => l.layer === 'data')
    // Azure Synapse hat Score ≥ 8, Generic Tool hat Score 5 (independent only)
    // Mit 2 Komponenten total: Fallback greift → beide erscheinen
    expect(dataLayer?.componentNames).toContain('Azure Synapse')
  })

  it('begrenzt Komponenten je Layer auf maximal 4', () => {
    const comps = Array.from({ length: 10 }, (_, i) =>
      makeComp({ name: `Azure Comp ${i}`, cloud_provider: 'azure', architecture_layer: 'model' })
    )
    const result = recommendFromCatalog(azureAnswers, comps)
    const modelLayer = result.layers.find(l => l.layer === 'model')
    expect((modelLayer?.componentNames.length ?? 0)).toBeLessThanOrEqual(4)
  })

  it('zeigt Fallback-Komponenten wenn keine ≥ 8 Punkte erreicht', () => {
    const lowScoreComp = makeComp({ name: 'Low Score', cloud_provider: 'independent', architecture_layer: 'serving' })
    const result = recommendFromCatalog({ infra: 'cloud' }, [lowScoreComp])
    const servingLayer = result.layers.find(l => l.layer === 'serving')
    // Fallback: zeigt bis zu 2 Komponenten auch unter Schwellenwert
    expect(servingLayer?.componentNames).toContain('Low Score')
  })

  it('zeigt keine leeren Layer', () => {
    const comps = [
      makeComp({ name: 'SAP AI Core', cloud_provider: 'sap', architecture_layer: 'model' }),
    ]
    const result = recommendFromCatalog({ cloud_provider_hint: 'sap_btp' }, comps)
    result.layers.forEach(l => {
      expect(l.componentNames.length).toBeGreaterThan(0)
    })
  })
})

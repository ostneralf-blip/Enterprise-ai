import { recommendFromWizard, recommendPackagedApps, scoreComponentAgainstAnswers, recommendFromCatalog } from '@/config/architecture-rules'
import type { CatalogComponent } from '@/types'

const mkComp = (overrides: Partial<CatalogComponent>): CatalogComponent => ({
  id: 'test-id',
  name: 'Test Component',
  vendor: null,
  category: null,
  architecture_layer: 'model',
  hosting: ['eu'],
  dsgvo_status: 'compliant',
  eu_ai_act_risk: 'minimal',
  sap_compatible: false,
  sap_components: [],
  use_case_types: [],
  infra_types: ['cloud'],
  cloud_provider: 'independent',
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
  ...overrides,
})

describe('architecture-rules: recommendFromWizard', () => {
  it('SAP-Stack empfiehlt SAP-Komponenten', () => {
    const recs = recommendFromWizard({ data_platform: 'sap_bw', model_platform: 'sap_ai_core', usecase: 'generative' })
    const allNames = recs.layers.flatMap(l => l.componentNames)
    expect(allNames).toContain('SAP Datasphere')
    expect(allNames).toContain('SAP AI Core')
    expect(allNames).toContain('SAP GenAI Hub')
    expect(allNames).toContain('SAP Integration Suite')
    expect(allNames).toContain('SAP Joule Studio')
  })

  it('Azure-Stack empfiehlt Azure-Komponenten', () => {
    const recs = recommendFromWizard({ infra: 'cloud', data_platform: 'azure_fabric', model_platform: 'cloud_ml', usecase: 'predictive' })
    const allNames = recs.layers.flatMap(l => l.componentNames)
    expect(allNames).toContain('Microsoft Fabric')
    expect(allNames).toContain('Azure Machine Learning')
    expect(allNames).toContain('Azure ML Pipelines')
    expect(allNames).toContain('Microsoft Purview')
  })

  it('AWS-Stack empfiehlt AWS-Komponenten', () => {
    const recs = recommendFromWizard({ infra: 'cloud', model_platform: 'cloud_ml', usecase: 'predictive' })
    const allNames = recs.layers.flatMap(l => l.componentNames)
    expect(allNames).toContain('Amazon SageMaker')
    expect(allNames).toContain('SageMaker Pipelines')
  })

  it('strenge Compliance + On-Prem → EU-LLMs', () => {
    const recs = recommendFromWizard({ infra: 'onprem', compliance: 'strict', usecase: 'generative' })
    const allNames = recs.layers.flatMap(l => l.componentNames)
    expect(allNames).toContain('Aleph Alpha')
    expect(allNames).toContain('Ollama')
    expect(allNames).toContain('Keycloak')
  })

  it('Open-Source MLOps-Stack empfiehlt Kubeflow + ZenML', () => {
    const recs = recommendFromWizard({ model_platform: 'open_mlops' })
    const allNames = recs.layers.flatMap(l => l.componentNames)
    expect(allNames).toContain('Kubeflow')
    expect(allNames).toContain('ZenML')
    expect(allNames).toContain('MLflow')
  })

  it('jedes Ergebnis enthält AI Product Owner + Data Engineer', () => {
    const recs = recommendFromWizard({ infra: 'cloud' })
    expect(recs.roleNames).toContain('AI Product Owner')
    expect(recs.roleNames).toContain('Data Engineer')
  })

  it('Team-Skills → Data Scientist + ML Engineer in Rollen', () => {
    const recs = recommendFromWizard({ skills: 'team', data_platform: 'snowflake' })
    expect(recs.roleNames).toContain('Data Scientist')
    expect(recs.roleNames).toContain('ML Engineer')
    expect(recs.roleNames).toContain('MLOps Engineer')
  })

  it('strenge Compliance → AI Ethics Officer in Rollen', () => {
    const recs = recommendFromWizard({ compliance: 'strict' })
    expect(recs.roleNames).toContain('AI Ethics / Risk Officer')
  })

  it('alle Layers haben mindestens eine Komponente', () => {
    const recs = recommendFromWizard({
      infra: 'cloud', data_platform: 'snowflake', model_platform: 'cloud_ml',
      usecase: 'generative', monitoring: 'open_source_monitor',
    })
    expect(recs.layers.length).toBeGreaterThan(0)
    recs.layers.forEach(l => expect(l.componentNames.length).toBeGreaterThan(0))
  })

  it('keine doppelten Rollennamen', () => {
    const recs = recommendFromWizard({ skills: 'team', compliance: 'strict', usecase: 'generative', data_platform: 'sap_bw' })
    const unique = new Set(recs.roleNames)
    expect(unique.size).toBe(recs.roleNames.length)
  })

  it('cloud_provider_hint=azure → Azure-Komponenten auch ohne data_platform', () => {
    const recs = recommendFromWizard({ infra: 'cloud', cloud_provider_hint: 'azure' })
    const allNames = recs.layers.flatMap(l => l.componentNames)
    expect(allNames).toContain('Azure Machine Learning')
  })

  it('cloud_provider_hint=sap_btp → SAP-Pfad auch ohne data_platform', () => {
    const recs = recommendFromWizard({ cloud_provider_hint: 'sap_btp' })
    const allNames = recs.layers.flatMap(l => l.componentNames)
    expect(allNames).toContain('SAP Integration Suite')
  })

  it('sap_landscape=full → SAP-Pfad erkannt', () => {
    const recs = recommendFromWizard({ sap_landscape: 'full', usecase: 'generative' })
    const allNames = recs.layers.flatMap(l => l.componentNames)
    expect(allNames).toContain('SAP Datasphere')
    expect(allNames).toContain('SAP Integration Suite')
  })
})

describe('architecture-rules: scoreComponentAgainstAnswers (#59)', () => {
  const sapComp = mkComp({ name: 'SAP GenAI Hub', cloud_provider: 'sap', use_case_types: ['generative'], sap_compatible: true })
  const azureComp = mkComp({ name: 'Azure OpenAI Service', cloud_provider: 'azure', use_case_types: ['generative'] })
  const awsComp = mkComp({ name: 'Amazon SageMaker', cloud_provider: 'aws', use_case_types: ['predictive', 'generative'] })
  const independentComp = mkComp({ name: 'MLflow', cloud_provider: 'independent', use_case_types: ['predictive', 'generative'] })

  it('SAP-Komponente: Score < 0 für Azure-Nutzer (generative)', () => {
    expect(scoreComponentAgainstAnswers(sapComp, { cloud_provider_hint: 'azure', infra: 'cloud', usecase: 'generative' })).toBeLessThan(0)
  })

  it('SAP-Komponente: Score < 0 für Nutzer ohne SAP-Kontext', () => {
    expect(scoreComponentAgainstAnswers(sapComp, { infra: 'cloud', usecase: 'generative' })).toBeLessThan(0)
  })

  it('SAP-Komponente: Score > 0 für SAP-Nutzer (cloud_provider_hint=sap_btp)', () => {
    expect(scoreComponentAgainstAnswers(sapComp, { cloud_provider_hint: 'sap_btp', sap_landscape: 'full', usecase: 'generative' })).toBeGreaterThan(0)
  })

  it('SAP-Komponente: Score > 0 für Nutzer mit sap_landscape (ohne cloud_provider_hint)', () => {
    expect(scoreComponentAgainstAnswers(sapComp, { sap_landscape: 'full', usecase: 'generative' })).toBeGreaterThan(0)
  })

  it('Azure-Komponente: Score < 0 für SAP-Nutzer', () => {
    expect(scoreComponentAgainstAnswers(azureComp, { cloud_provider_hint: 'sap_btp', usecase: 'generative' })).toBeLessThan(0)
  })

  it('AWS-Komponente: Score < 0 für Azure-Nutzer', () => {
    expect(scoreComponentAgainstAnswers(awsComp, { cloud_provider_hint: 'azure', infra: 'cloud', usecase: 'generative' })).toBeLessThan(0)
  })

  it('Independent-Komponente: Score > 0 für Azure-Nutzer mit passendem usecase', () => {
    expect(scoreComponentAgainstAnswers(independentComp, { cloud_provider_hint: 'azure', infra: 'cloud', usecase: 'generative' })).toBeGreaterThan(0)
  })

  it('Independent-Komponente: Score > 0 für SAP-Nutzer', () => {
    expect(scoreComponentAgainstAnswers(independentComp, { cloud_provider_hint: 'sap_btp', usecase: 'generative' })).toBeGreaterThan(0)
  })

  it('Independent-Komponente: Score > 0 für AWS-Nutzer', () => {
    expect(scoreComponentAgainstAnswers(independentComp, { cloud_provider_hint: 'aws', infra: 'cloud', usecase: 'generative' })).toBeGreaterThan(0)
  })
})

describe('architecture-rules: recommendFromCatalog (#59)', () => {
  const catalog: CatalogComponent[] = [
    mkComp({ id: 'sap-gen', name: 'SAP GenAI Hub', architecture_layer: 'model', cloud_provider: 'sap', use_case_types: ['generative'], sap_compatible: true }),
    mkComp({ id: 'sap-ai', name: 'SAP AI Core', architecture_layer: 'model', cloud_provider: 'sap', use_case_types: ['predictive', 'generative'], sap_compatible: true }),
    mkComp({ id: 'az-oai', name: 'Azure OpenAI Service', architecture_layer: 'model', cloud_provider: 'azure', use_case_types: ['generative'] }),
    mkComp({ id: 'az-ml', name: 'Azure Machine Learning', architecture_layer: 'model', cloud_provider: 'azure', use_case_types: ['predictive', 'generative'] }),
    mkComp({ id: 'aws-sm', name: 'Amazon SageMaker', architecture_layer: 'model', cloud_provider: 'aws', use_case_types: ['predictive', 'generative'] }),
    mkComp({ id: 'mlflow', name: 'MLflow', architecture_layer: 'mlops', cloud_provider: 'independent', use_case_types: ['predictive', 'generative'] }),
  ]

  it('Azure-Nutzer sieht keine SAP-Plattform-Komponenten', () => {
    const recs = recommendFromCatalog({ cloud_provider_hint: 'azure', infra: 'cloud', usecase: 'generative' }, catalog)
    const allNames = recs.layers.flatMap(l => l.componentNames)
    expect(allNames).not.toContain('SAP GenAI Hub')
    expect(allNames).not.toContain('SAP AI Core')
  })

  it('Azure-Nutzer sieht keine AWS-Komponenten', () => {
    const recs = recommendFromCatalog({ cloud_provider_hint: 'azure', infra: 'cloud', usecase: 'predictive' }, catalog)
    const allNames = recs.layers.flatMap(l => l.componentNames)
    expect(allNames).not.toContain('Amazon SageMaker')
  })

  it('Azure-Nutzer sieht Azure-Komponenten', () => {
    const recs = recommendFromCatalog({ cloud_provider_hint: 'azure', infra: 'cloud', usecase: 'generative' }, catalog)
    const allNames = recs.layers.flatMap(l => l.componentNames)
    expect(allNames).toContain('Azure OpenAI Service')
  })

  it('SAP-Nutzer sieht SAP-Komponenten aber keine Azure- oder AWS-Komponenten', () => {
    const recs = recommendFromCatalog({ cloud_provider_hint: 'sap_btp', sap_landscape: 'full', infra: 'cloud', usecase: 'generative' }, catalog)
    const allNames = recs.layers.flatMap(l => l.componentNames)
    expect(allNames).toContain('SAP GenAI Hub')
    expect(allNames).not.toContain('Azure OpenAI Service')
    expect(allNames).not.toContain('Amazon SageMaker')
  })

  it('Independent-Komponenten erscheinen für Azure- und SAP-Nutzer', () => {
    const azureRecs = recommendFromCatalog({ cloud_provider_hint: 'azure', infra: 'cloud', usecase: 'generative' }, catalog)
    const sapRecs = recommendFromCatalog({ cloud_provider_hint: 'sap_btp', sap_landscape: 'full', usecase: 'generative' }, catalog)
    expect(azureRecs.layers.flatMap(l => l.componentNames)).toContain('MLflow')
    expect(sapRecs.layers.flatMap(l => l.componentNames)).toContain('MLflow')
  })

  it('packaged_app-Einträge verdrängen keine regulären Layer-Empfehlungen (eigene Auswahl via recommendPackagedApps)', () => {
    const withPackagedApp = [
      ...catalog,
      mkComp({ id: 'joule-x', name: 'SAP Joule — Receipt Analysis', architecture_layer: 'application', category: 'packaged_app', cloud_provider: 'sap', use_case_types: ['automation'], sap_compatible: true }),
    ]
    const recs = recommendFromCatalog({ cloud_provider_hint: 'sap_btp', sap_landscape: 'full', usecase: 'generative' }, withPackagedApp)
    expect(recs.layers.flatMap(l => l.componentNames)).not.toContain('SAP Joule — Receipt Analysis')
  })
})

// Ersetzt SEED_JOULE_USE_CASES / recommendJouleUseCases (18.07.2026, Katalog-
// Migration): fertige AI-Anwendungen sind jetzt category: 'packaged_app' im
// echten Katalog, domain/complexity stecken als 'domain:'/'complexity:'-Tags.
describe('architecture-rules: recommendPackagedApps', () => {
  const packagedAppCatalog: CatalogComponent[] = [
    mkComp({ id: 'p1', name: 'SAP Joule — Receipt Analysis', vendor: 'SAP', category: 'packaged_app', tags: ['domain:finance', 'complexity:starter'] }),
    mkComp({ id: 'p2', name: 'SAP Joule — Cash Management AI', vendor: 'SAP', category: 'packaged_app', tags: ['domain:finance', 'complexity:transformer'] }),
    mkComp({ id: 'p3', name: 'SAP Joule — Field Service Dispatcher', vendor: 'SAP', category: 'packaged_app', tags: ['domain:supply_chain', 'complexity:scaler'] }),
    // Vendor-neutral: nicht-SAP-Hersteller sind nicht an SAP-Kontext gebunden.
    mkComp({ id: 'p4', name: 'Acme Vision Inspector', vendor: 'Acme', category: 'packaged_app', tags: ['domain:supply_chain', 'complexity:scaler'] }),
  ]

  it('leerer Katalog → leere Liste', () => {
    expect(recommendPackagedApps({ sap_landscape: 'full' }, [])).toHaveLength(0)
  })

  it('kein SAP-Kontext → SAP-Apps ausgeblendet, vendor-neutrale App bleibt', () => {
    const apps = recommendPackagedApps({ sap_landscape: 'none' }, packagedAppCatalog)
    const names = apps.map(a => a.name)
    expect(names).not.toContain('SAP Joule — Receipt Analysis')
    expect(names).toContain('Acme Vision Inspector')
  })

  it('SAP full → SAP-Apps zurückgegeben', () => {
    const apps = recommendPackagedApps({ sap_landscape: 'full' }, packagedAppCatalog)
    expect(apps.map(a => a.name)).toContain('SAP Joule — Receipt Analysis')
    expect(apps.length).toBeLessThanOrEqual(6)
  })

  it('Finance-Branche → nur Finance/Procurement-Domain-Apps', () => {
    const apps = recommendPackagedApps({ sap_landscape: 'full', industry: 'finance' }, packagedAppCatalog)
    expect(apps.every(a => a.tags.includes('domain:finance') || a.tags.includes('domain:procurement'))).toBe(true)
    expect(apps.map(a => a.name)).not.toContain('SAP Joule — Field Service Dispatcher')
  })

  it('cloud_provider_hint=sap_btp → Apps auch ohne sap_landscape', () => {
    const apps = recommendPackagedApps({ cloud_provider_hint: 'sap_btp', industry: 'retail_consumer' }, packagedAppCatalog)
    expect(apps.length).toBeGreaterThan(0)
    expect(apps.every(a => ['domain:cx', 'domain:procurement', 'domain:supply_chain'].some(d => a.tags.includes(d)))).toBe(true)
  })

  it('max 6 Apps zurückgegeben', () => {
    const apps = recommendPackagedApps({ sap_landscape: 'full', industry: 'other' }, packagedAppCatalog)
    expect(apps.length).toBeLessThanOrEqual(6)
  })
})

import { recommendFromWizard, recommendJouleUseCases } from '@/config/architecture-rules'

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

describe('architecture-rules: recommendJouleUseCases', () => {
  it('kein SAP → leere Liste', () => {
    expect(recommendJouleUseCases({ sap_landscape: 'none' })).toHaveLength(0)
    expect(recommendJouleUseCases({ infra: 'cloud' })).toHaveLength(0)
  })

  it('SAP full → Use Cases zurückgegeben', () => {
    const ucs = recommendJouleUseCases({ sap_landscape: 'full' })
    expect(ucs.length).toBeGreaterThan(0)
    expect(ucs.length).toBeLessThanOrEqual(6)
  })

  it('Finance-Branche → Finance/Procurement-Use-Cases', () => {
    const ucs = recommendJouleUseCases({ sap_landscape: 'full', industry: 'finance' })
    expect(ucs.every(uc => ['Finance', 'Procurement'].includes(uc.domain))).toBe(true)
  })

  it('Manufacturing-Branche → Supply Chain/Finance-Use-Cases', () => {
    const ucs = recommendJouleUseCases({ sap_landscape: 'full', industry: 'manufacturing' })
    expect(ucs.every(uc => ['Supply Chain', 'Finance'].includes(uc.domain))).toBe(true)
  })

  it('cloud_provider_hint=sap_btp → Use Cases auch ohne sap_landscape', () => {
    const ucs = recommendJouleUseCases({ cloud_provider_hint: 'sap_btp', industry: 'retail_consumer' })
    expect(ucs.length).toBeGreaterThan(0)
    expect(ucs.every(uc => ['CX', 'Procurement', 'Supply Chain'].includes(uc.domain))).toBe(true)
  })

  it('max 6 Use Cases zurückgegeben', () => {
    const ucs = recommendJouleUseCases({ sap_landscape: 'full', industry: 'other' })
    expect(ucs.length).toBeLessThanOrEqual(6)
  })
})

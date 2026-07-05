import type { WizardAnswers } from './architecture-data'
import type { ArchLayer, CatalogComponent } from '@/types'
import { SEED_JOULE_USE_CASES, type JouleUseCase } from './catalog-seed'

export type { JouleUseCase }

export interface LayerRecommendation {
  layer: ArchLayer
  componentNames: string[]
}

export interface CatalogRecommendations {
  layers: LayerRecommendation[]
  roleNames: string[]
}

function isSAP(a: WizardAnswers) {
  return a.cloud_provider_hint === 'sap_btp'
      || a.data_platform === 'sap_bw'
      || a.model_platform === 'sap_ai_core'
      || (a.sap_landscape !== undefined && a.sap_landscape !== 'none')
}
function isAzure(a: WizardAnswers) {
  return a.cloud_provider_hint === 'azure' || a.data_platform === 'azure_fabric'
}
function isAWS(a: WizardAnswers) {
  return a.cloud_provider_hint === 'aws'
      || (!isSAP(a) && !isAzure(a) && a.cloud_provider_hint !== 'gcp'
          && (a.infra === 'cloud' || a.infra === 'multicloud'))
}
function isOnprem(a: WizardAnswers){ return a.infra === 'onprem' }
function isHybrid(a: WizardAnswers){ return a.infra === 'hybrid' }

const INDUSTRY_DOMAINS: Record<string, string[]> = {
  finance:            ['Finance', 'Procurement'],
  manufacturing:      ['Supply Chain', 'Finance'],
  healthcare_public:  ['HR', 'Finance'],
  retail_consumer:    ['CX', 'Procurement', 'Supply Chain'],
  other:              ['Finance', 'Supply Chain', 'HR', 'Procurement', 'CX', 'Transformation'],
}

const COMPLEXITY_GATE: Record<string, Set<JouleUseCase['complexity']>> = {
  starter:     new Set(['starter']),
  scaler:      new Set(['starter', 'scaler']),
  transformer: new Set(['starter', 'scaler', 'transformer']),
}

export function recommendJouleUseCases(
  answers: WizardAnswers,
  archetype?: string | null,
  canvasIndustry?: string | null
): JouleUseCase[] {
  if (!isSAP(answers) || answers.sap_landscape === 'none') return []

  const primaryDomains = answers.industry ? INDUSTRY_DOMAINS[answers.industry] : INDUSTRY_DOMAINS.other
  const canvasDomains  = canvasIndustry ? (INDUSTRY_DOMAINS[canvasIndustry] ?? []) : []
  const allDomains     = [...new Set([...primaryDomains, ...canvasDomains])]

  const candidates = SEED_JOULE_USE_CASES.filter(uc => allDomains.includes(uc.domain))
  if (!archetype || !COMPLEXITY_GATE[archetype]) return candidates.slice(0, 6)

  const allowed = COMPLEXITY_GATE[archetype]
  return candidates
    .sort((a, b) => (allowed.has(a.complexity) ? 0 : 1) - (allowed.has(b.complexity) ? 0 : 1))
    .slice(0, 6)
}

export function recommendFromWizard(answers: WizardAnswers): CatalogRecommendations {
  const sap    = isSAP(answers)
  const azure  = isAzure(answers)
  const aws    = isAWS(answers)
  const onprem = isOnprem(answers)
  const hybrid = isHybrid(answers)
  const gen    = answers.usecase === 'generative'
  const strict = answers.compliance === 'strict'

  // ── DATA ─────────────────────────────────────────────────────────────────
  const data: string[] = []
  if (answers.data_platform === 'sap_bw' || (sap && !answers.data_platform)) {
    data.push('SAP Datasphere', 'SAP HANA Cloud')
    if (!onprem) data.push('Apache Kafka')
  } else if (answers.data_platform === 'azure_fabric') {
    data.push('Microsoft Fabric', 'Azure Synapse Analytics', 'Apache Kafka')
  } else if (answers.data_platform === 'snowflake') {
    data.push('Snowflake', 'Databricks', 'Apache Kafka')
  } else if (answers.data_platform === 'open_source') {
    data.push('Databricks', 'Apache Kafka')
  } else if (aws) {
    data.push('Amazon Redshift', 'Amazon S3', 'AWS Glue', 'Apache Kafka')
  } else {
    data.push('Apache Kafka')
  }
  if (aws && !data.includes('Amazon S3')) data.push('Amazon S3', 'AWS Glue')

  // ── MODEL ─────────────────────────────────────────────────────────────────
  const model: string[] = []
  if (answers.model_platform === 'sap_ai_core' || (sap && !answers.model_platform)) {
    model.push('SAP AI Core')
    if (gen) model.push('SAP GenAI Hub')
  } else if (answers.model_platform === 'cloud_ml') {
    if (azure) model.push('Azure Machine Learning')
    else if (aws) model.push('Amazon SageMaker')
    else model.push('Azure Machine Learning', 'Amazon SageMaker')
  } else if (answers.model_platform === 'open_mlops') {
    model.push('MLflow')
  } else if (answers.model_platform === 'no_code') {
    if (azure) model.push('Azure OpenAI Service')
    else if (sap) model.push('SAP GenAI Hub')
    else model.push('AWS Bedrock')
  } else if (azure) {
    model.push('Azure Machine Learning')
  } else if (aws) {
    model.push('Amazon SageMaker')
  }
  if (gen) {
    if (strict || onprem) {
      if (!model.includes('Aleph Alpha')) model.push('Aleph Alpha')
      if (!model.includes('Mistral AI')) model.push('Mistral AI')
      if (onprem) model.push('Ollama')
    } else if (!model.some(c => ['SAP GenAI Hub','Azure OpenAI Service','AWS Bedrock','Mistral AI'].includes(c))) {
      if (azure) model.push('Azure OpenAI Service')
      else if (sap) model.push('SAP GenAI Hub')
      else model.push('AWS Bedrock', 'Mistral AI')
    }
  }

  // ── MLOPS ─────────────────────────────────────────────────────────────────
  const mlops: string[] = []
  if (answers.model_platform === 'sap_ai_core') {
    mlops.push('MLflow')
  } else if (answers.model_platform === 'cloud_ml') {
    if (azure) mlops.push('Azure ML Pipelines', 'MLflow')
    else mlops.push('SageMaker Pipelines', 'MLflow')
  } else if (answers.model_platform === 'open_mlops') {
    mlops.push('MLflow', 'Kubeflow', 'ZenML')
  } else {
    mlops.push('MLflow', 'GitHub Actions')
  }
  if (!mlops.includes('Grafana')) mlops.push('Grafana')
  if (answers.monitoring !== 'basic' && answers.monitoring !== 'cloud_native_monitor') {
    if (!mlops.includes('Evidently AI')) mlops.push('Evidently AI')
  }

  // ── SERVING ───────────────────────────────────────────────────────────────
  const serving: string[] = []
  if (answers.model_platform === 'sap_ai_core') {
    serving.push('SAP AI Launchpad')
  } else if (onprem || hybrid) {
    if (gen) serving.push('vLLM')
    serving.push('BentoML', 'Kong Gateway')
  } else if (answers.model_platform === 'cloud_ml') {
    if (aws) serving.push('SageMaker Endpoints')
    serving.push('BentoML')
  } else {
    serving.push('BentoML', 'Kong Gateway')
  }

  // ── GOVERNANCE ────────────────────────────────────────────────────────────
  const governance: string[] = []
  if (sap)        governance.push('SAP MDG', 'OpenMetadata')
  else if (azure) governance.push('Microsoft Purview', 'OpenMetadata')
  else if (aws)   governance.push('AWS DataZone', 'OpenMetadata')
  else            governance.push('OpenMetadata')

  // ── SECURITY ──────────────────────────────────────────────────────────────
  const security: string[] = []
  if (sap)                    security.push('SAP BTP Auth & Trust', 'HashiCorp Vault')
  else if (azure)             security.push('Microsoft Entra ID', 'HashiCorp Vault')
  else if (onprem || hybrid)  security.push('Keycloak', 'HashiCorp Vault')
  else                        security.push('HashiCorp Vault')

  // ── APPLICATION ───────────────────────────────────────────────────────────
  const application: string[] = []
  if (sap) {
    application.push('SAP Integration Suite')
    if (gen) application.push('SAP Joule Studio')
  } else if (aws)   application.push('AWS API Gateway', 'Kong Gateway')
  else if (azure)   application.push('Azure API Management', 'Kong Gateway')
  else              application.push('Kong Gateway')

  // ── ROLES ─────────────────────────────────────────────────────────────────
  const roles: string[] = ['AI Product Owner', 'Business AI Champion', 'Data Privacy Manager', 'Data Engineer']

  if (answers.skills === 'team') {
    roles.push('Data Scientist', 'ML Engineer', 'MLOps Engineer')
    if (answers.data_platform) roles.push('AI CoE Lead', 'Chief Data Officer (CDO)')
  } else if (answers.skills === 'individuals') {
    roles.push('Data Scientist')
  }
  if (gen) roles.push('Prompt Engineer')
  if (strict) roles.push('AI Ethics / Risk Officer')
  if (!onprem && answers.skills !== 'business') roles.push('Enterprise Architect (AI)')

  return {
    layers: ([
      { layer: 'data'        as ArchLayer, componentNames: data },
      { layer: 'model'       as ArchLayer, componentNames: model },
      { layer: 'mlops'       as ArchLayer, componentNames: mlops },
      { layer: 'serving'     as ArchLayer, componentNames: serving },
      { layer: 'governance'  as ArchLayer, componentNames: governance },
      { layer: 'security'    as ArchLayer, componentNames: security },
      { layer: 'application' as ArchLayer, componentNames: application },
    ] as LayerRecommendation[]).filter(l => l.componentNames.length > 0),
    roleNames: [...new Set(roles)],
  }
}

const ARCH_LAYERS_ORDERED: ArchLayer[] = [
  'data', 'model', 'mlops', 'serving', 'governance', 'security', 'application',
]

export function scoreComponentAgainstAnswers(
  component: CatalogComponent,
  answers: WizardAnswers
): number {
  const providerMap: Record<string, string> = {
    sap_btp: 'sap', azure: 'azure', aws: 'aws', gcp: 'gcp',
  }

  // Hard-exclude: SAP-platform components require SAP context
  if (component.cloud_provider === 'sap' && !isSAP(answers)) return -1

  // Hard-exclude: if user explicitly chose a vendor, exclude other vendors' specific components.
  // Exception: SAP components are never excluded when SAP is part of the landscape (hybrid scenario).
  if (answers.cloud_provider_hint) {
    const targetProvider = providerMap[answers.cloud_provider_hint] ?? answers.cloud_provider_hint
    if (component.cloud_provider !== null
        && component.cloud_provider !== 'independent'
        && component.cloud_provider !== targetProvider
        && !(component.cloud_provider === 'sap' && isSAP(answers))) {
      return -1
    }
  }

  let score = 0
  if (answers.cloud_provider_hint && providerMap[answers.cloud_provider_hint] === component.cloud_provider)
    score += 20
  // SAP hybrid bonus: SAP in landscape but not as primary cloud provider → still surface SAP components
  if (component.cloud_provider === 'sap' && isSAP(answers) && answers.cloud_provider_hint !== 'sap_btp')
    score += 12
  if (component.cloud_provider === 'independent') score += 5
  if (answers.usecase && component.use_case_types.includes(answers.usecase)) score += 15
  if (answers.sap_landscape && answers.sap_landscape !== 'none' && component.sap_compatible)
    score += 10
  if (answers.infra === 'onprem' && component.infra_types.includes('onprem')) score += 8
  if (answers.infra === 'hybrid' && component.infra_types.includes('hybrid')) score += 8
  if (answers.infra === 'cloud'  && component.infra_types.includes('cloud'))  score += 5
  if (answers.compliance === 'strict') {
    if (component.dsgvo_status === 'non_compliant') return -1000
    if (component.dsgvo_status === 'compliant') score += 10
    if (component.hosting.some(h => ['eu', 'onprem'].includes(h))) score += 5
  }
  return score
}

export function recommendFromCatalog(
  answers: WizardAnswers,
  catalog: CatalogComponent[]
): CatalogRecommendations {
  const layers: LayerRecommendation[] = ARCH_LAYERS_ORDERED.map(layer => {
    const scored = catalog
      .filter(c => c.architecture_layer === layer)
      .map(c => ({ name: c.name, score: scoreComponentAgainstAnswers(c, answers) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
    // Require contextual relevance (≥ 8 pts) — "cloud_provider independent" alone (+5) is insufficient.
    // Fallback: show top 2 by score if nothing reaches threshold, so diagram is never empty.
    const relevant = scored.filter(x => x.score >= 8)
    const componentNames = (relevant.length >= 2 ? relevant : scored.slice(0, 2))
      .slice(0, 4)
      .map(x => x.name)
    return { layer, componentNames }
  }).filter(l => l.componentNames.length > 0)

  const roles: string[] = [
    'AI Product Owner', 'Business AI Champion', 'Data Privacy Manager', 'Data Engineer',
  ]
  if (answers.skills === 'team')
    roles.push('Data Scientist', 'ML Engineer', 'MLOps Engineer', 'AI CoE Lead')
  else if (answers.skills === 'individuals')
    roles.push('Data Scientist')
  if (answers.usecase === 'generative') roles.push('Prompt Engineer')
  if (answers.compliance === 'strict')  roles.push('AI Ethics / Risk Officer')
  if (answers.sap_landscape && answers.sap_landscape !== 'none') roles.push('SAP AI Architect')
  if (!['onprem'].includes(answers.infra ?? '') && answers.skills !== 'business')
    roles.push('Enterprise Architect (AI)')

  return { layers, roleNames: [...new Set(roles)] }
}

export function generateDynamicKeyDecisions(components: CatalogComponent[]): string[] {
  const vendors = new Set(components.map(c => c.vendor))
  const decisions: string[] = []

  if (vendors.has('SAP')) {
    decisions.push('SAP BTP Lizenzmodell und AI Core Service-Tier vorab klären — Kosten skalieren mit Inferenz-Volumen')
    decisions.push('SAP AI Core Deployment-Quota (GPU-Ressourcen) rechtzeitig beim SAP-Account-Team beantragen')
  }
  if (vendors.has('Microsoft')) {
    decisions.push('Azure OpenAI Service Agreement: EU-Datenspeicherung (West Europe) und Zero-Retention-Option vertraglich sichern')
  }
  if (vendors.has('AWS')) {
    decisions.push('AWS Bedrock Model Access in eu-central-1 (Frankfurt) vorab beantragen — nicht alle Modelle in EU verfügbar')
  }
  if (components.some(c => c.dsgvo_status === 'conditional')) {
    decisions.push('DSGVO-Risiko: Mindestens eine Komponente mit bedingter Konformität — Auftragsverarbeitungsvertrag (AVV) zwingend abschließen')
  }
  if (components.some(c => c.eu_ai_act_risk === 'high' || c.eu_ai_act_risk === 'limited')) {
    decisions.push('EU AI Act: Hochrisiko-Einstufung prüfen — Technische Dokumentation und Risk Assessment vorbereiten')
  }

  return decisions
}

export function generateDynamicNextSteps(components: CatalogComponent[]): string[] {
  const vendors = new Set(components.map(c => c.vendor))
  const steps: string[] = []

  if (vendors.has('SAP')) {
    steps.push('SAP BTP Trial-Account oder Productive Account einrichten → AI Core Service aktivieren → ersten Deployment-Workspace anlegen')
  }
  if (vendors.has('Microsoft')) {
    steps.push('Azure OpenAI Service in West Europe beantragen → Modell-Quota konfigurieren → Content-Filter-Policy festlegen')
  }
  if (vendors.has('AWS')) {
    steps.push('AWS Bedrock Konsole: Zugriff auf Wunschmodelle in eu-central-1 aktivieren → IAM-Rollen für Least Privilege einrichten')
  }
  if (components.some(c => c.dsgvo_status === 'conditional')) {
    steps.push('AVV mit allen Drittanbietern mit bedingter DSGVO-Konformität abschließen — Vorlage beim Datenschutzbeauftragten anfordern')
  }
  if (vendors.size > 0 && !vendors.has('SAP') && !vendors.has('Microsoft') && !vendors.has('AWS')) {
    steps.push('Proof-of-Concept mit gewählten Komponenten aufsetzen und interne Akzeptanzkriterien definieren')
  }

  return steps
}

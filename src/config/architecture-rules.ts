import type { WizardAnswers } from './architecture-data'
import type { ArchLayer, CatalogComponent, RasicMatrix, RasicPhase } from '@/types'

export interface LayerRecommendation {
  layer: ArchLayer
  componentNames: string[]
  componentReasons: Record<string, { de: string; en: string }>
}

export interface CatalogRecommendations {
  layers: LayerRecommendation[]
  roleNames: string[]
}

export function isSAP(a: WizardAnswers) {
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

// Geschäftsbereich (domain:<slug>) je Branche — vendor-neutral, gilt für JEDEN
// Hersteller mit packaged_app-Katalogeinträgen, nicht nur SAP.
const PACKAGED_APP_INDUSTRY_DOMAINS: Record<string, string[]> = {
  finance:            ['finance', 'procurement'],
  manufacturing:      ['supply_chain', 'finance'],
  healthcare_public:  ['hr', 'finance'],
  retail_consumer:    ['cx', 'procurement', 'supply_chain'],
  other:              ['finance', 'supply_chain', 'hr', 'procurement', 'cx', 'transformation'],
}

type PackagedAppComplexity = 'starter' | 'scaler' | 'transformer'
const COMPLEXITY_GATE: Record<string, Set<PackagedAppComplexity>> = {
  starter:     new Set(['starter']),
  scaler:      new Set(['starter', 'scaler']),
  transformer: new Set(['starter', 'scaler', 'transformer']),
}

function tagValue(tags: string[], prefix: string): string | undefined {
  return tags.find(t => t.startsWith(prefix))?.slice(prefix.length)
}

// Ersetzt das ehemalige recommendJouleUseCases() / SEED_JOULE_USE_CASES (#71) —
// fertige AI-Anwendungen (category: 'packaged_app', z. B. SAP Joule Use Cases)
// leben jetzt als echte Katalog-Einträge und stehen damit automatisch auch dem
// AI Use Case Canvas (Textscoring in canvas-context.ts durchsucht den ganzen
// Katalog) und dem KI-Vorschlags-Panel (getSelectionStats-Katalogabgleich) zur
// Verfügung — nicht mehr nur einer isolierten, SAP-exklusiven Kachel. SAP-
// Herkunft wird weiterhin nur bei SAP-Kontext vorgeschlagen; andere Hersteller
// sind vendor-neutral gegen dieselbe Branchen-/Komplexitäts-Logik gematcht.
export function recommendPackagedApps(
  answers: WizardAnswers,
  catalog: CatalogComponent[],
  archetype?: string | null,
  canvasIndustry?: string | null
): CatalogComponent[] {
  const packagedApps = catalog.filter(c => c.category === 'packaged_app')
  if (packagedApps.length === 0) return []

  const primaryDomains = answers.industry ? PACKAGED_APP_INDUSTRY_DOMAINS[answers.industry] : PACKAGED_APP_INDUSTRY_DOMAINS.other
  const canvasDomains  = canvasIndustry ? (PACKAGED_APP_INDUSTRY_DOMAINS[canvasIndustry] ?? []) : []
  const allDomains     = new Set([...primaryDomains, ...canvasDomains])

  const candidates = packagedApps.filter(c => {
    if (c.vendor === 'SAP' && (!isSAP(answers) || answers.sap_landscape === 'none')) return false
    const domain = tagValue(c.tags, 'domain:')
    return domain ? allDomains.has(domain) : true
  })

  if (!archetype || !COMPLEXITY_GATE[archetype]) return candidates.slice(0, 6)

  const allowed = COMPLEXITY_GATE[archetype]
  return candidates
    .sort((a, b) => {
      const aOk = allowed.has(tagValue(a.tags, 'complexity:') as PackagedAppComplexity)
      const bOk = allowed.has(tagValue(b.tags, 'complexity:') as PackagedAppComplexity)
      return (aOk ? 0 : 1) - (bOk ? 0 : 1)
    })
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

  // sapPrimary = SAP als primärer Cloud-Provider (sap_btp oder SAP-Landschaft ohne anderen Hint).
  // Verhindert, dass sap_landscape: 'partial' + cloud_provider_hint: 'azure' zu SAP-Komponenten führt.
  const sapPrimary = answers.cloud_provider_hint === 'sap_btp'
    || (sap && !answers.cloud_provider_hint)

  // ── DATA ─────────────────────────────────────────────────────────────────
  const data: string[] = []
  if (answers.data_platform === 'sap_bw' || (sapPrimary && !answers.data_platform)) {
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
  if (answers.model_platform === 'sap_ai_core' || (sapPrimary && !answers.model_platform)) {
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
    else if (sapPrimary) model.push('SAP GenAI Hub')
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
      else if (sapPrimary) model.push('SAP GenAI Hub')
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
  if (sapPrimary)  governance.push('SAP MDG', 'OpenMetadata')
  else if (azure)  governance.push('Microsoft Purview', 'OpenMetadata')
  else if (aws)    governance.push('AWS DataZone', 'OpenMetadata')
  else             governance.push('OpenMetadata')

  // ── SECURITY ──────────────────────────────────────────────────────────────
  const security: string[] = []
  if (sapPrimary)             security.push('SAP BTP Auth & Trust', 'HashiCorp Vault')
  else if (azure)             security.push('Microsoft Entra ID', 'HashiCorp Vault')
  else if (onprem || hybrid)  security.push('Keycloak', 'HashiCorp Vault')
  else                        security.push('HashiCorp Vault')

  // ── APPLICATION ───────────────────────────────────────────────────────────
  const application: string[] = []
  if (sapPrimary) {
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
  if (sap) roles.push('SAP AI Architect')
  if (!onprem && answers.skills !== 'business') roles.push('Enterprise Architect (AI)')

  return {
    layers: ([
      { layer: 'data'        as ArchLayer, componentNames: [...new Set(data)],        componentReasons: {} },
      { layer: 'model'       as ArchLayer, componentNames: [...new Set(model)],       componentReasons: {} },
      { layer: 'mlops'       as ArchLayer, componentNames: [...new Set(mlops)],       componentReasons: {} },
      { layer: 'serving'     as ArchLayer, componentNames: [...new Set(serving)],     componentReasons: {} },
      { layer: 'governance'  as ArchLayer, componentNames: [...new Set(governance)],  componentReasons: {} },
      { layer: 'security'    as ArchLayer, componentNames: [...new Set(security)],    componentReasons: {} },
      { layer: 'application' as ArchLayer, componentNames: [...new Set(application)], componentReasons: {} },
    ] as LayerRecommendation[]).filter(l => l.componentNames.length > 0),
    roleNames: [...new Set(roles)],
  }
}

const ARCH_LAYERS_ORDERED: ArchLayer[] = [
  'data', 'model', 'mlops', 'serving', 'governance', 'security', 'application',
]

function reasonForComponent(comp: CatalogComponent, answers: WizardAnswers): { de: string; en: string } {
  const de: string[] = []
  const en: string[] = []
  const providerMap: Record<string, string> = { sap_btp: 'sap', azure: 'azure', aws: 'aws', gcp: 'gcp' }
  if (answers.cloud_provider_hint && comp.cloud_provider === (providerMap[answers.cloud_provider_hint] ?? answers.cloud_provider_hint)) {
    de.push(`${comp.cloud_provider?.toUpperCase()}-nativ`); en.push(`${comp.cloud_provider?.toUpperCase()} native`)
  }
  if (comp.cloud_provider === 'sap' && isSAP(answers)) { de.push('SAP-Landschaft'); en.push('SAP landscape') }
  if (answers.usecase && comp.use_case_types.includes(answers.usecase)) { de.push('Use-Case-Treffer'); en.push('Use case match') }
  if (answers.compliance === 'strict' && comp.hosting.some(h => ['eu', 'onprem'].includes(h))) { de.push('EU-Hosting Pflicht'); en.push('EU hosting required') }
  if (answers.infra === 'onprem' && comp.infra_types.includes('onprem')) { de.push('On-Premise'); en.push('On-premise') }
  if (answers.sap_landscape && answers.sap_landscape !== 'none' && comp.sap_compatible) { de.push('SAP-kompatibel'); en.push('SAP compatible') }
  return { de: de.length > 0 ? de.join(' · ') : 'Regelbasierte Empfehlung', en: en.length > 0 ? en.join(' · ') : 'Rule-based recommendation' }
}

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
  const byName = new Map(catalog.map(c => [c.name, c]))
  // Bei SAP BTP als primärem Provider bekommen SAP-Komponenten exklusive Slots —
  // independent-Komponenten erscheinen nur als Fallback wenn kein SAP im Layer vorhanden.
  const sapPrimary = isSAP(answers) && answers.cloud_provider_hint === 'sap_btp'

  const layers: LayerRecommendation[] = ARCH_LAYERS_ORDERED.map(layer => {
    const scored = catalog
      // packaged_app (fertige AI-Anwendungen wie SAP Joule Use Cases) konkurriert
      // nicht um die generischen Infra-Slots — eigene Auswahl via recommendPackagedApps().
      .filter(c => c.architecture_layer === layer && c.category !== 'packaged_app')
      .map(c => ({ name: c.name, score: scoreComponentAgainstAnswers(c, answers) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
    const relevant = scored.filter(x => x.score >= 8)

    let componentNames: string[]
    if (sapPrimary) {
      const sapRelevant = relevant.filter(x => byName.get(x.name)?.cloud_provider === 'sap')
      if (sapRelevant.length > 0) {
        componentNames = [...new Set(sapRelevant.slice(0, 4).map(x => x.name))]
      } else {
        componentNames = [...new Set((relevant.length >= 2 ? relevant : scored.slice(0, 2)).slice(0, 4).map(x => x.name))]
      }
    } else {
      componentNames = [...new Set((relevant.length >= 2 ? relevant : scored.slice(0, 2)).slice(0, 4).map(x => x.name))]
    }

    const componentReasons: Record<string, { de: string; en: string }> = {}
    for (const name of componentNames) {
      const comp = byName.get(name)
      if (comp) componentReasons[name] = reasonForComponent(comp, answers)
    }
    return { layer, componentNames, componentReasons }
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

export function generateDynamicKeyDecisions(components: CatalogComponent[]): { de: string; en: string }[] {
  const vendors = new Set(components.map(c => c.vendor))
  const decisions: { de: string; en: string }[] = []

  if (vendors.has('SAP')) {
    decisions.push({ de: 'SAP BTP Lizenzmodell und AI Core Service-Tier vorab klären — Kosten skalieren mit Inferenz-Volumen', en: 'Clarify SAP BTP licence model and AI Core service tier upfront — costs scale with inference volume' })
    decisions.push({ de: 'SAP AI Core Deployment-Quota (GPU-Ressourcen) rechtzeitig beim SAP-Account-Team beantragen', en: 'Request SAP AI Core deployment quota (GPU resources) from the SAP account team in good time' })
  }
  if (vendors.has('Microsoft')) {
    decisions.push({ de: 'Azure OpenAI Service Agreement: EU-Datenspeicherung (West Europe) und Zero-Retention-Option vertraglich sichern', en: 'Azure OpenAI Service Agreement: contractually secure EU data residency (West Europe) and the zero-retention option' })
  }
  if (vendors.has('AWS')) {
    decisions.push({ de: 'AWS Bedrock Model Access in eu-central-1 (Frankfurt) vorab beantragen — nicht alle Modelle in EU verfügbar', en: 'Request AWS Bedrock model access in eu-central-1 (Frankfurt) upfront — not all models are available in the EU' })
  }
  if (components.some(c => c.dsgvo_status === 'conditional')) {
    decisions.push({ de: 'DSGVO-Risiko: Mindestens eine Komponente mit bedingter Konformität — Auftragsverarbeitungsvertrag (AVV) zwingend abschließen', en: 'GDPR risk: at least one component with conditional compliance — a Data Processing Agreement (DPA) is mandatory' })
  }
  if (components.some(c => c.eu_ai_act_risk === 'high' || c.eu_ai_act_risk === 'limited')) {
    decisions.push({ de: 'EU AI Act: Hochrisiko-Einstufung prüfen — Technische Dokumentation und Risk Assessment vorbereiten', en: 'EU AI Act: review high-risk classification — prepare technical documentation and risk assessment' })
  }

  return decisions
}

export function generateDynamicNextSteps(components: CatalogComponent[]): { de: string; en: string }[] {
  const vendors = new Set(components.map(c => c.vendor))
  const steps: { de: string; en: string }[] = []

  if (vendors.has('SAP')) {
    steps.push({ de: 'SAP BTP Trial-Account oder Productive Account einrichten → AI Core Service aktivieren → ersten Deployment-Workspace anlegen', en: 'Set up SAP BTP Trial or Productive account → activate AI Core service → create first deployment workspace' })
  }
  if (vendors.has('Microsoft')) {
    steps.push({ de: 'Azure OpenAI Service in West Europe beantragen → Modell-Quota konfigurieren → Content-Filter-Policy festlegen', en: 'Apply for Azure OpenAI Service in West Europe → configure model quota → define Content Filter policy' })
  }
  if (vendors.has('AWS')) {
    steps.push({ de: 'AWS Bedrock Konsole: Zugriff auf Wunschmodelle in eu-central-1 aktivieren → IAM-Rollen für Least Privilege einrichten', en: 'AWS Bedrock console: enable access to target models in eu-central-1 → configure IAM roles for least privilege' })
  }
  if (components.some(c => c.dsgvo_status === 'conditional')) {
    steps.push({ de: 'AVV mit allen Drittanbietern mit bedingter DSGVO-Konformität abschließen — Vorlage beim Datenschutzbeauftragten anfordern', en: 'Conclude DPAs with all third-party vendors with conditional GDPR compliance — request template from Data Protection Officer' })
  }
  if (vendors.size > 0 && !vendors.has('SAP') && !vendors.has('Microsoft') && !vendors.has('AWS')) {
    steps.push({ de: 'Proof-of-Concept mit gewählten Komponenten aufsetzen und interne Akzeptanzkriterien definieren', en: 'Set up a proof of concept with selected components and define internal acceptance criteria' })
  }

  return steps
}

// ─── EAM VALIDATION ──────────────────────────────────────────────────────────
export interface EamValidationResult {
  ruleId: string
  passed: boolean
  message: { de: string; en: string }
  anchor: string
}

const CROSS_CUTTING_KEYWORDS = ['monitor', 'gateway', 'hitl', 'audit', 'grafana', 'evidently', 'kong', 'observ']

const PHASE_LABEL: Record<RasicPhase, { de: string; en: string }> = {
  konzeption: { de: 'Konzeption', en: 'Conception' },
  daten:      { de: 'Daten', en: 'Data' },
  build:      { de: 'Build', en: 'Build' },
  freigabe:   { de: 'Freigabe', en: 'Release' },
  betrieb:    { de: 'Betrieb', en: 'Operations' },
}

export function validateRasicAccountability(rasic: RasicMatrix | undefined): EamValidationResult {
  const ruleId = 'r1'; const anchor = 'rasic-matrix'
  if (!rasic) return { ruleId, anchor, passed: false, message: { de: 'RASIC-Matrix nicht generiert', en: 'RASIC matrix not generated' } }

  const violations: RasicPhase[] = []
  for (const phase of rasic.phases as RasicPhase[]) {
    const count = rasic.entries.filter(e => e.assignments[phase] === 'A').length
    if (count !== 1) violations.push(phase)
  }
  return {
    ruleId, anchor, passed: violations.length === 0,
    message: violations.length === 0
      ? { de: 'Genau eine Verantwortung (A) pro Phase', en: 'Exactly one accountable (A) per phase' }
      : {
          de: `Fehlende/doppelte Verantwortung (A) in: ${violations.map(p => PHASE_LABEL[p].de).join(', ')}`,
          en: `Missing or duplicate accountable (A) in: ${violations.map(p => PHASE_LABEL[p].en).join(', ')}`,
        },
  }
}

export function validateCrossControls(activeComponents: CatalogComponent[]): EamValidationResult {
  const ruleId = 'r3'; const anchor = 'catalog-recs'
  const riskComps = activeComponents.filter(c => c.eu_ai_act_risk === 'high' || c.eu_ai_act_risk === 'limited' || c.dsgvo_status === 'conditional')
  if (riskComps.length === 0) return { ruleId, anchor, passed: true, message: { de: 'Keine Risikokomponenten aktiv', en: 'No risk-rated components active' } }

  const hasCrossControl = activeComponents.some(c =>
    CROSS_CUTTING_KEYWORDS.some(kw => c.name.toLowerCase().includes(kw) || (c.tags ?? []).some(t => t.toLowerCase().includes(kw)))
  )
  return {
    ruleId, anchor, passed: hasCrossControl,
    message: hasCrossControl
      ? { de: 'Querschnittskontrollen vorhanden', en: 'Cross-cutting controls present' }
      : { de: 'Keine Querschnittskontrolle (Monitoring/Gateway/HITL) für Hochrisiko-Komponenten', en: 'No cross-cutting control (Monitoring/Gateway/HITL) for high-risk components' },
  }
}

export function validateEuHosting(activeComponents: CatalogComponent[], compliance?: string): EamValidationResult {
  const ruleId = 'r4'; const anchor = 'catalog-recs'
  if (compliance !== 'strict') return { ruleId, anchor, passed: true, message: { de: 'Kein strikter Compliance-Modus aktiv', en: 'Strict compliance mode not active' } }

  const nonEU = activeComponents.filter(c =>
    c.cloud_provider && !['sap', 'independent'].includes(c.cloud_provider) &&
    !(c.hosting ?? []).some(h => h.toLowerCase().includes('eu'))
  )
  return {
    ruleId, anchor, passed: nonEU.length === 0,
    message: nonEU.length === 0
      ? { de: 'Alle Komponenten EU-konform', en: 'All components EU-compliant' }
      : { de: `Nicht-EU-Verarbeitung bei striktem Modus: ${nonEU.map(c => c.name).join(', ')}`, en: `Non-EU processing in strict mode: ${nonEU.map(c => c.name).join(', ')}` },
  }
}

export function validateComponentOwners(
  rasic: RasicMatrix | undefined,
  activeComponents: CatalogComponent[],
  activeCount?: number,
): EamValidationResult {
  const ruleId = 'r2'; const anchor = 'rasic-matrix'
  const count = activeCount ?? activeComponents.length
  if (count === 0) {
    return { ruleId, anchor, passed: false, message: { de: 'Keine Komponenten gewählt — Architektur unvollständig', en: 'No components selected — architecture incomplete' } }
  }
  if (!rasic) {
    return { ruleId, anchor, passed: false, message: { de: 'Eigentümer nicht prüfbar — RASIC-Matrix fehlt', en: 'Owners cannot be checked — RASIC matrix missing' } }
  }
  const hasBuildOwner = rasic.entries.some(e => e.assignments['build'] === 'R' || e.assignments['build'] === 'A')
  const hasBetriebOwner = rasic.entries.some(e => e.assignments['betrieb'] === 'R' || e.assignments['betrieb'] === 'A')
  const passed = hasBuildOwner && hasBetriebOwner
  const missingDe = [!hasBuildOwner && 'Build', !hasBetriebOwner && 'Betrieb'].filter(Boolean).join(', ')
  const missingEn = [!hasBuildOwner && 'Build', !hasBetriebOwner && 'Operations'].filter(Boolean).join(', ')
  return {
    ruleId, anchor, passed,
    message: passed
      ? { de: `${count} Komponente(n) — Build & Betrieb mit Eigentümer belegt`, en: `${count} component(s) — Build & Operations have owners` }
      : { de: `Fehlende Eigentümer (R/A) in: ${missingDe}`, en: `Missing owners (R/A) in: ${missingEn}` },
  }
}

export function runEamValidation(
  rasic: RasicMatrix | undefined,
  activeComponents: CatalogComponent[],
  compliance?: string,
  // #182: Zahl aus getSelectionStats — Namen zählen, nicht Katalog-Matches,
  // damit Validierung und Workbench-Header dieselbe Quelle lesen (Gate D).
  activeCount?: number,
): EamValidationResult[] {
  return [
    validateRasicAccountability(rasic),
    validateComponentOwners(rasic, activeComponents, activeCount),
    validateCrossControls(activeComponents),
    validateEuHosting(activeComponents, compliance),
  ]
}

// ─── CROSS-MODULE DECISIONS ───────────────────────────────────────────────────
interface CrossModuleContext {
  assessment?: { archetype: string | null; total_score: number; dim_scores: Record<string, number> } | null
  canvas?: { canvas: { title: string }; useCase: { name: string; quadrant?: string } } | null
  governance?: { use_case_name: string | null; result: string | null } | null
  roadmap?: { title: string; phasesCount: number } | null
}

export function generateCrossModuleDecisions(ctx: CrossModuleContext): { de: string; en: string }[] {
  const items: { de: string; en: string }[] = []

  if (ctx.assessment) {
    const { archetype, dim_scores } = ctx.assessment
    if (archetype === 'starter') {
      items.push({ de: 'Managed Services priorisieren — AI Readiness Assessment zeigt frühe Phase: Keine eigene ML-Infrastruktur aufbauen, bevor Datenbasis und Team-Kompetenzen etabliert sind', en: 'Prioritise managed services — AI Readiness Assessment shows early stage: do not build custom ML infrastructure before data foundation and team skills are established' })
    } else if (archetype === 'scaler') {
      items.push({ de: 'MLOps-Automatisierung als nächste Investitionsstufe — Assessment zeigt etablierte Basis: CI/CD für Modelle und Feature Store als kritische nächste Architektur-Ebene', en: 'MLOps automation as the next investment tier — Assessment shows an established base: CI/CD for models and a Feature Store as the critical next architectural layer' })
    } else if (archetype === 'transformer') {
      items.push({ de: 'Multi-Modell-Betrieb und Enterprise-Governance — Assessment zeigt hohe KI-Reife: AI Registry, Modell-Versionierung und zentrales Monitoring jetzt konsequent umsetzen', en: 'Multi-model operations and enterprise governance — Assessment shows high AI maturity: implement AI Registry, model versioning, and centralised monitoring consistently now' })
    }
    const dataScore = dim_scores?.data ?? dim_scores?.Daten ?? null
    if (dataScore !== null && dataScore < 50) {
      items.push({ de: 'Datenqualität als Architekturblocker — Assessment zeigt Datenbasis als schwächste Dimension: Datenplattform vor ML-Infrastruktur priorisieren', en: 'Data quality is an architecture blocker — Assessment identifies data foundation as the weakest dimension: prioritise data platform before ML infrastructure' })
    }
  }

  if (ctx.canvas) {
    const { useCase } = ctx.canvas
    if (useCase.quadrant === 'quick_win') {
      items.push({ de: `Use Case "${useCase.name}" als Quick Win starten — Canvas-Analyse zeigt hohes Potenzial bei geringem Aufwand: Als erstes Pilot-Deployment in dieser Architektur wählen`, en: `Start use case "${useCase.name}" as a quick win — Canvas analysis shows high potential with low effort: select it as the first pilot deployment in this architecture` })
    } else {
      items.push({ de: `Use Case "${useCase.name}" als Pilot-Maßstab — konkrete Anforderungen aus dem Canvas bei Architekturentscheidungen berücksichtigen`, en: `Use case "${useCase.name}" as the pilot benchmark — incorporate concrete requirements from the Canvas into architecture decisions` })
    }
  }

  if (ctx.governance?.result && (ctx.governance.result === 'critical' || ctx.governance.result === 'high_risk')) {
    const name = ctx.governance.use_case_name ?? 'Use Case'
    items.push({ de: `Governance-Check zeigt erhöhtes Risiko für "${name}" — Compliance-Anforderungen in Architektur-Design einbeziehen, nicht nachträglich ergänzen`, en: `Governance check flags elevated risk for "${name}" — embed compliance requirements in the architecture design upfront, not as an afterthought` })
  }

  // BDSG-Relevanz aus dem Use-Case-Kontext (Beschäftigtendaten/Scoring) — das
  // deutsche BDSG konkretisiert die DSGVO. Signal aus Canvas-/Governance-Use-Case-Namen.
  const ctxNames = `${ctx.canvas?.useCase.name ?? ''} ${ctx.governance?.use_case_name ?? ''}`
  if (/beschäftigt|mitarbeiter|arbeitnehmer|bewerber|recruiting|human resources|\bhr\b|personal(akte|daten|verwaltung)|leistungsbeurteilung|\bscoring\b|bonität|kreditwürdig/i.test(ctxNames)) {
    items.push({ de: 'BDSG in der Architektur berücksichtigen — der Use-Case berührt Beschäftigtendaten oder Scoring: §§ 26/31 BDSG konkretisieren die DSGVO. Menschliche Kontrolle, Zweckbindung und Protokollierung von Anfang an einplanen.', en: 'Factor the BDSG into the architecture — the use case touches employee data or scoring: §§ 26/31 BDSG specify the GDPR. Plan human oversight, purpose limitation and logging in from the start.' })
  }

  if (ctx.roadmap && ctx.roadmap.phasesCount > 0) {
    items.push({ de: `Architektur-Entscheidungen mit Roadmap "${ctx.roadmap.title}" abstimmen — ${ctx.roadmap.phasesCount} Phasen als Umsetzungs-Zeitrahmen für schrittweise Komponenten-Einführung nutzen`, en: `Align architecture decisions with roadmap "${ctx.roadmap.title}" — use its ${ctx.roadmap.phasesCount} phases as the rollout schedule for incremental component adoption` })
  }

  return items
}

export function generateCrossModuleNextSteps(ctx: CrossModuleContext): { de: string; en: string }[] {
  const items: { de: string; en: string }[] = []

  if (ctx.assessment && ctx.assessment.total_score < 2.5) {
    const scorePct = Math.round((ctx.assessment.total_score / 5) * 100)
    items.push({ de: `AI Readiness Score (${scorePct} %) ausbauen — parallel zur Architektur-Implementierung Datenstrategie und Team-Kompetenzen stärken, bevor komplexe ML-Infrastruktur aufgebaut wird`, en: `Raise AI Readiness Score (${scorePct} %) — strengthen data strategy and team skills in parallel with architecture implementation, before building complex ML infrastructure` })
  }

  if (ctx.canvas) {
    const { useCase } = ctx.canvas
    items.push({ de: `Use Case "${useCase.name}" als erstes Architektur-Pilotprojekt umsetzen — Canvas-Blueprint als Anforderungsspezifikation für das erste Deployment nutzen`, en: `Implement use case "${useCase.name}" as the first architecture pilot — use the Canvas blueprint as the requirements specification for the initial deployment` })
  }

  if (ctx.roadmap && ctx.roadmap.phasesCount > 0) {
    items.push({ de: `Roadmap-Meilensteine mit Architektur-Komponenten verknüpfen — Phase-1-Aktivitäten aus "${ctx.roadmap.title}" mit konkreten Technologien aus diesem Architektur-Plan synchronisieren`, en: `Link roadmap milestones to architecture components — synchronise phase-1 activities from "${ctx.roadmap.title}" with concrete technologies from this architecture plan` })
  }

  if (ctx.governance?.result === 'approved' || ctx.governance?.result === 'low_risk') {
    const name = ctx.governance.use_case_name ?? 'Use Case'
    items.push({ de: `"${name}" direkt in Architektur-Pilot integrieren — Governance-Check bestätigt Freigabe: Keine weiteren Compliance-Hürden vor erstem Deployment`, en: `Integrate "${name}" directly into the architecture pilot — Governance check confirms approval: no further compliance hurdles before first deployment` })
  }

  return items
}

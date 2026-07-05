import type { Canvas, UseCase, CatalogComponent } from '@/types'
import type { WizardAnswers } from '@/config/architecture-data'

export interface CanvasContext {
  wizard_prefill: Partial<WizardAnswers>
  pre_scored_components: CatalogComponent[]
  compliance_flags: CanvasComplianceFlag[]
  detected_tags: DetectedTag[]
  confidence: number
}

export type CanvasComplianceFlag = 'dsgvo_strict' | 'eu_ai_act_high' | 'eu_hosting_required'

export interface DetectedTag {
  label: string
  type: 'score' | 'industry' | 'usecase' | 'platform' | 'compliance'
}

type UcType = 'vision' | 'generative' | 'predictive' | 'automation'

// Alias-Begriffe die auf einen Vendor hindeuten, ohne den Vendor-Namen zu nennen.
// Wenn Canvas "S/4HANA" enthält, sollen SAP-Komponenten trotzdem gescort werden.
const VENDOR_ALIASES: Record<string, string[]> = {
  'SAP': ['s/4hana', 's4hana', 'fiori', 'btp', 'hana', 'datasphere', 'bw/4hana', 'joule', 'ariba', 'successfactors', 'sap cloud', 'ai core', 'genai hub'],
  'Microsoft': ['azure', 'm365', 'teams', 'copilot studio', 'power platform', 'power bi', 'fabric'],
  'AWS': ['amazon', 'bedrock', 'sagemaker', 'aws lambda', 'ec2'],
  'Google': ['gcp', 'vertex ai', 'bigquery', 'google cloud'],
}

const BASE_VOCAB: Record<UcType, string[]> = {
  vision:     ['ocr', 'bildverarbeitung', 'dokument', 'scan', 'bild', 'erkennung', 'invoice', 'rechnung', 'vision', 'image'],
  generative: ['llm', 'gpt', 'genai', 'chat', 'text', 'zusammenfassung', 'sprachmodell', 'rag', 'embedding', 'generativ'],
  predictive: ['forecast', 'prognose', 'anomalie', 'vorhersage', 'klassifikation', 'prediction', 'regression'],
  automation: ['rpa', 'workflow', 'automatisierung', 'prozess', 'roboter', 'pipeline', 'trigger'],
}

export function buildVocabFromCatalog(
  catalog: CatalogComponent[]
): Record<string, Set<string>> {
  const vocab: Record<string, Set<string>> = {}
  for (const [uct, base] of Object.entries(BASE_VOCAB)) {
    vocab[uct] = new Set(base)
  }
  for (const comp of catalog) {
    for (const uct of comp.use_case_types) {
      if (!vocab[uct]) vocab[uct] = new Set()
      comp.tags.forEach(t => vocab[uct].add(t.toLowerCase()))
      vocab[uct].add(comp.name.toLowerCase())
      if (comp.vendor) vocab[uct].add(comp.vendor.toLowerCase())
    }
  }
  return vocab
}

export function scoreComponentAgainstText(
  component: CatalogComponent,
  canvasText: string,
  clusterBonus = 0
): number {
  const text = canvasText.toLowerCase()
  let score = 0

  if (text.includes(component.name.toLowerCase()))                            score += 30

  if (component.vendor) {
    const vendorLower = component.vendor.toLowerCase()
    if (text.includes(vendorLower)) {
      score += 15
    } else {
      // Alias-Treffer: wenn ein Alias-Begriff im Text, gilt als Vendor-Hinweis
      const aliases = VENDOR_ALIASES[component.vendor] ?? []
      if (aliases.some(alias => text.includes(alias))) score += 10
    }
  }

  for (const tag of component.tags) {
    if (text.includes(tag.toLowerCase()))                                     score += 5
  }

  // Cluster-Bonus: wenn der Canvas stark auf diesen Vendor hindeutet (3+ Alias-Treffer)
  score += clusterBonus

  return score
}

export function extractCanvasContext(
  canvas: Canvas,
  useCase: UseCase,
  catalog: CatalogComponent[]
): CanvasContext {
  const canvasText = [
    canvas.data.problem, canvas.data.solution, canvas.data.data_sources,
    canvas.data.architecture, canvas.data.risks, canvas.title,
  ].join(' ')
  const textLower = canvasText.toLowerCase()
  const vocab = buildVocabFromCatalog(catalog)

  // Use-case-Typ: Vokabular-Treffer zählen
  let topUseCase: WizardAnswers['usecase'] | undefined
  let topScore = 0
  for (const [uct, keywords] of Object.entries(vocab)) {
    let s = 0
    for (const kw of keywords) { if (textLower.includes(kw)) s++ }
    if (s > topScore) { topScore = s; topUseCase = uct as WizardAnswers['usecase'] }
  }
  if (topScore === 0) topUseCase = undefined

  // SAP Landscape
  let sap_landscape: WizardAnswers['sap_landscape']
  const sapText = (canvas.data.data_sources + ' ' + canvas.data.architecture).toLowerCase()
  if (/s\/4hana|s4hana/.test(sapText))                                sap_landscape = 'full'
  else if (/\bsap\b/.test(sapText) || /\bsap\b/.test((useCase.domain ?? '').toLowerCase()))
                                                                       sap_landscape = 'partial'

  // Cloud-Provider
  let cloud_provider_hint: WizardAnswers['cloud_provider_hint']
  const archLower = canvas.data.architecture.toLowerCase()
  if (/sap btp|sap ai core/.test(archLower))       cloud_provider_hint = 'sap_btp'
  else if (/azure|microsoft/.test(archLower))       cloud_provider_hint = 'azure'
  else if (/\baws\b|amazon/.test(archLower))        cloud_provider_hint = 'aws'
  else if (/\bgcp\b|google cloud/.test(archLower))  cloud_provider_hint = 'gcp'
  else if (sap_landscape && sap_landscape !== 'none') cloud_provider_hint = 'sap_btp'

  // Branche
  let industry: WizardAnswers['industry']
  const domainLower = (useCase.domain ?? '').toLowerCase()
  if (/finance|finanz|bank|versicher/.test(domainLower))        industry = 'finance'
  else if (/manufactur|fertigung|industrie|produktion/.test(domainLower)) industry = 'manufacturing'
  else if (/gesundheit|health|pharma|klinik/.test(domainLower)) industry = 'healthcare_public'
  else if (/handel|retail|consumer|ecommerce/.test(domainLower)) industry = 'retail_consumer'

  // Compliance-Flags
  const compliance_flags: CanvasComplianceFlag[] = []
  const risksLower = canvas.data.risks.toLowerCase()
  if (/dsgvo|datenschutz|personenbezogen/.test(risksLower))     compliance_flags.push('dsgvo_strict')
  if (/eu ai act|hochrisiko|biometrisch/.test(risksLower))      compliance_flags.push('eu_ai_act_high')
  if (/eu[\s-]?hosting|frankfurt|on[\s-]?premise|on-premise/.test(risksLower)) compliance_flags.push('eu_hosting_required')

  // Wizard-Vorausfüllung
  const wizard_prefill: Partial<WizardAnswers> = {}
  if (topUseCase)         wizard_prefill.usecase = topUseCase
  if (sap_landscape)      wizard_prefill.sap_landscape = sap_landscape
  if (cloud_provider_hint) wizard_prefill.cloud_provider_hint = cloud_provider_hint
  if (industry)           wizard_prefill.industry = industry
  if (compliance_flags.includes('dsgvo_strict') || compliance_flags.includes('eu_ai_act_high'))
    wizard_prefill.compliance = 'strict'

  // Cluster-Bonus: Anzahl Alias-Treffer pro Vendor zählen.
  // Wenn 3+ SAP-Begriffe im Canvas → SAP-Komponenten erhalten +10 Bonus.
  const clusterBonusPerVendor: Record<string, number> = {}
  for (const [vendor, aliases] of Object.entries(VENDOR_ALIASES)) {
    const vendorLower = vendor.toLowerCase()
    const hits = (textLower.includes(vendorLower) ? 1 : 0) +
      aliases.filter(a => textLower.includes(a)).length
    if (hits >= 3) clusterBonusPerVendor[vendor] = 10
  }

  // Direkte Catalog-Treffer
  const pre_scored_components = catalog
    .map(c => ({
      c,
      score: scoreComponentAgainstText(c, canvasText, clusterBonusPerVendor[c.vendor ?? ''] ?? 0),
    }))
    .filter(x => x.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(x => x.c)

  // Banner-Tags
  const detected_tags: DetectedTag[] = []
  if (useCase.weighted_score)
    detected_tags.push({ label: `Score ${useCase.weighted_score.toFixed(1)}`, type: 'score' })
  if (useCase.quadrant === 'quick_win')
    detected_tags.push({ label: 'Quick Win', type: 'score' })
  if (industry) {
    const INDUSTRY_LABEL: Record<string, string> = {
      finance: 'Finance', manufacturing: 'Fertigung',
      healthcare_public: 'Healthcare', retail_consumer: 'Retail',
    }
    detected_tags.push({ label: INDUSTRY_LABEL[industry] ?? industry, type: 'industry' })
  }
  if (sap_landscape && sap_landscape !== 'none')
    detected_tags.push({ label: 'SAP', type: 'platform' })
  if (cloud_provider_hint) {
    const CLOUD_LABEL: Record<string, string> = {
      sap_btp: 'SAP BTP', azure: 'Azure', aws: 'AWS', gcp: 'GCP',
    }
    if (CLOUD_LABEL[cloud_provider_hint])
      detected_tags.push({ label: CLOUD_LABEL[cloud_provider_hint], type: 'platform' })
  }
  if (topUseCase) {
    const UC_LABEL: Record<string, string> = {
      vision: 'OCR / Vision', generative: 'Generative AI',
      predictive: 'Predictive', automation: 'Automation',
    }
    detected_tags.push({ label: UC_LABEL[topUseCase], type: 'usecase' })
  }
  if (compliance_flags.includes('dsgvo_strict'))
    detected_tags.push({ label: 'DSGVO Strict', type: 'compliance' })
  if (compliance_flags.includes('eu_ai_act_high'))
    detected_tags.push({ label: 'EU AI Act High Risk', type: 'compliance' })

  const confidence = Object.keys(wizard_prefill).length / 12

  return { wizard_prefill, pre_scored_components, compliance_flags, detected_tags, confidence }
}

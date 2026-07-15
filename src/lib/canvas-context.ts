import type { Canvas, UseCase, CatalogComponent, CanvasSynonym } from '@/types'
import type { WizardAnswers } from '@/config/architecture-data'
import {
  VENDOR_ALIASES,
  PLATFORM_CATEGORY_KEYWORDS,
  BASE_VOCAB,
  matchesTerm,
  buildDetectionText,
  detectCompliance,
  detectUseCaseTypes,
  UC_DISPLAY_LABEL,
  type CanvasComplianceFlag,
} from '@/lib/canvas/detection'

// Re-export für Backward-Kompatibilität (admin/synonyms/learn/route.ts)
export { VENDOR_ALIASES, PLATFORM_CATEGORY_KEYWORDS }

// Felder, die maximal in wizard_prefill gesetzt werden können (8 Stück).
// Confidence = gefüllte Felder / PREFILL_FIELDS.length — niemals > 1.
const PREFILL_FIELDS = [
  'usecase', 'sap_landscape', 'cloud_provider_hint', 'industry',
  'data_platform', 'model_platform', 'compliance', 'infra',
] as const

// Re-export CanvasComplianceFlag aus detection.ts für externe Konsumenten
export type { CanvasComplianceFlag } from '@/lib/canvas/detection'

export interface CanvasContext {
  wizard_prefill: Partial<WizardAnswers>
  pre_scored_components: CatalogComponent[]
  compliance_flags: CanvasComplianceFlag[]
  detected_tags: DetectedTag[]
  confidence: number
}

export interface DetectedTag {
  label: string
  type: 'score' | 'industry' | 'usecase' | 'platform' | 'compliance'
}

// ─── Branchen-Keywords ─────────────────────────────────────────────────────────
// Mehrsprachig (DE + EN), abgestimmt auf IndustryOption-Enum.
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'manufacturing': [
    'fertigung', 'produktion', 'montage', 'qualitätssicherung', 'qm',
    'instandhaltung', 'wartung', 'anlage', 'maschine', 'maschinenpark',
    'predictive maintenance', 'werksplanung', 'werkssteuerung',
    'iot', 'sensordaten', 'plc', 'scada', 'automatisierungstechnik',
    'manufacturing', 'production', 'factory', 'plant', 'industrie 4.0',
    'industrie4.0', 'fertigungsplanung', 'rüstzeit', 'ableitung',
    'schicht', 'produktionsplanung', 'mes', 'erp fertigung',
  ],
  'finance': [
    // 'compliance', 'audit', 'controlling', 'risikomanagement' entfernt —
    // erscheinen in praktisch jedem Governance-Canvas und kippen Finance fälschlich
    'finanz', 'finance', 'bank', 'versicher', 'buchhaltung',
    'kreditoren', 'debitoren', 'hauptbuch', 'bilanz', 'rechnungswesen',
    'treasury', 'fraud', 'zahlungsabwicklung', 'fibu', 'jahresabschluss',
    'konzernabschluss', 'reporting finance', 'finanzplanung', 'liquidität',
    'kostenrechnung', 'kalkulation', 'steuer', 'steuern',
  ],
  'healthcare_public': [
    'gesundheit', 'health', 'pharma', 'klinik', 'krankenhaus', 'patient',
    'medizin', 'pflege', 'arzt', 'diagnose', 'labordaten', 'öffentlich',
    'behörde', 'verwaltung', 'public', 'krankenkasse', 'abrechnungssystem',
    'klinikum', 'ambulanz', 'notaufnahme', 'medizintechnik', 'medtech',
  ],
  'retail_consumer': [
    'handel', 'retail', 'consumer', 'ecommerce', 'e-commerce', 'shop',
    'onlinehandel', 'bestellung', 'retoure', 'lager', 'inventory',
    'nachfrage', 'demand', 'sortiment', 'warenkorb', 'kundenbindung',
    'loyalty', 'pos', 'filiale', 'stationärer handel',
  ],
  'other': [
    'logistik', 'lieferkette', 'beschaffung', 'einkauf', 'transport',
    'spedition', 'last mile', 'routenoptimierung', 'personal', 'hr',
    'recruiting', 'onboarding', 'lohnabrechnung', 'workforce',
  ],
}

// ─── Data-Platform-Hints → wizard_prefill.data_platform ───────────────────────
const DATA_PLATFORM_HINTS: Array<{ pattern: RegExp; value: WizardAnswers['data_platform'] }> = [
  { pattern: /sap bw|bw\/4hana|sap datasphere|sap hana/i,    value: 'sap_bw' },
  { pattern: /snowflake|snowpark/i,                           value: 'snowflake' },
  { pattern: /azure fabric|azure synapse|microsoft fabric/i,  value: 'azure_fabric' },
  { pattern: /databricks|delta lake|spark|mlflow/i,           value: 'open_source' },
  { pattern: /bigquery|vertex ai|looker/i,                    value: 'open_source' },
]

// ─── Model-Platform-Hints → wizard_prefill.model_platform ─────────────────────
const MODEL_PLATFORM_HINTS: Array<{ pattern: RegExp; value: WizardAnswers['model_platform'] }> = [
  { pattern: /sap ai core|genai hub|sap build ai|sap joule/i, value: 'sap_ai_core' },
  { pattern: /azure openai|azure ml|azure cognitive|azure ai studio/i, value: 'cloud_ml' },
  { pattern: /sagemaker|vertex ai|google ai|bedrock/i,        value: 'cloud_ml' },
  { pattern: /hugging face|mlflow|kubeflow|open[\s-]?source/i, value: 'open_mlops' },
  { pattern: /power automate|power platform|low[\s-]?code|no[\s-]?code/i, value: 'no_code' },
]

export function buildVocabFromCatalog(
  catalog: CatalogComponent[],
  synonyms: CanvasSynonym[] = []
): Record<string, Set<string>> {
  const vocab: Record<string, Set<string>> = {}
  for (const [uct, base] of Object.entries(BASE_VOCAB as Record<string, string[]>)) {
    vocab[uct] = new Set(base)
  }
  // Usecase-Synonyms aus DB
  for (const syn of synonyms) {
    if (!syn.is_active || syn.synonym_type !== 'usecase') continue
    if (!vocab[syn.term]) vocab[syn.term] = new Set()
    vocab[syn.term].add(syn.synonym.toLowerCase())
  }
  for (const comp of catalog) {
    for (const uct of comp.use_case_types) {
      if (!vocab[uct]) vocab[uct] = new Set()
      comp.tags.forEach(t => vocab[uct].add(t.toLowerCase()))
      vocab[uct].add(comp.name.toLowerCase())
      if (comp.vendor) vocab[uct].add(comp.vendor.toLowerCase())
      // Komponenten-eigene Aliases → Use-Case-Vocab
      ;(comp.aliases ?? []).forEach(a => vocab[uct].add(a.toLowerCase()))
    }
  }
  return vocab
}

export function scoreComponentAgainstText(
  component: CatalogComponent,
  canvasText: string,
  clusterBonus = 0,
  vendorAliases: Record<string, string[]> = VENDOR_ALIASES
): number {
  const text = canvasText.toLowerCase()
  let score = 0

  if (matchesTerm(text, component.name.toLowerCase()))                        score += 30

  for (const alias of (component.aliases ?? [])) {
    if (matchesTerm(text, alias.toLowerCase())) { score += 20; break }
  }

  if (component.vendor) {
    const vendorLower = component.vendor.toLowerCase()
    if (matchesTerm(text, vendorLower)) {
      score += 15
    } else {
      const aliases = vendorAliases[component.vendor] ?? []
      if (aliases.some(alias => matchesTerm(text, alias))) score += 12
    }
  }

  for (const tag of component.tags) {
    if (matchesTerm(text, tag.toLowerCase()))                                  score += 5
  }

  score += clusterBonus
  return score
}

// ─── Hilfsfunktion: Anzahl Alias-Treffer für einen Vendor im Text zählen ───────
function countVendorHits(vendor: string, text: string, vendorAliases: Record<string, string[]> = VENDOR_ALIASES): number {
  const vendorLower = vendor.toLowerCase()
  const aliases = vendorAliases[vendor] ?? []
  return (matchesTerm(text, vendorLower) ? 1 : 0) +
    aliases.filter(a => matchesTerm(text, a)).length
}

// ─── Merged Vendor-Aliases aufbauen ───────────────────────────────────────────
// Kombiniert: hardcodierte Basis + Katalog-Aliases + DB-Synonyms
function buildMergedVendorAliases(
  catalog: CatalogComponent[],
  synonyms: CanvasSynonym[]
): Record<string, string[]> {
  const merged: Record<string, string[]> = {}
  // 1. Hardcodierte Basis
  for (const [vendor, aliases] of Object.entries(VENDOR_ALIASES)) {
    merged[vendor] = [...aliases]
  }
  // 2. Katalog-eigene Aliases (pro Komponente)
  for (const comp of catalog) {
    if (!comp.vendor || !comp.aliases?.length) continue
    if (!merged[comp.vendor]) merged[comp.vendor] = []
    for (const alias of comp.aliases) {
      const a = alias.toLowerCase()
      if (!merged[comp.vendor].includes(a)) merged[comp.vendor].push(a)
    }
  }
  // 3. Admin-konfigurierte Synonyms (synonym_type='vendor')
  for (const syn of synonyms) {
    if (!syn.is_active || syn.synonym_type !== 'vendor') continue
    if (!merged[syn.term]) merged[syn.term] = []
    const s = syn.synonym.toLowerCase()
    if (!merged[syn.term].includes(s)) merged[syn.term].push(s)
  }
  return merged
}

// ─── Merged Platform-Category-Keywords aufbauen ───────────────────────────────
function buildMergedCategoryKeywords(synonyms: CanvasSynonym[]): Record<string, string[]> {
  const merged: Record<string, string[]> = {}
  for (const [cat, kws] of Object.entries(PLATFORM_CATEGORY_KEYWORDS)) {
    merged[cat] = [...kws]
  }
  for (const syn of synonyms) {
    if (!syn.is_active || syn.synonym_type !== 'category') continue
    if (!merged[syn.term]) merged[syn.term] = []
    const s = syn.synonym.toLowerCase()
    if (!merged[syn.term].includes(s)) merged[syn.term].push(s)
  }
  return merged
}

export function extractCanvasContext(
  canvas: Canvas,
  useCase: UseCase,
  catalog: CatalogComponent[],
  synonyms: CanvasSynonym[] = []
): CanvasContext {
  // Einheitliche Textbasis (alle 8 Felder + Titel) aus detection.ts
  const canvasText = [
    buildDetectionText(canvas),
    useCase.name.toLowerCase(),
    (useCase.domain ?? '').toLowerCase(),
  ].filter(Boolean).join(' ')
  const textLower = canvasText
  const allVendorAliases = buildMergedVendorAliases(catalog, synonyms)
  const allCategoryKeywords = buildMergedCategoryKeywords(synonyms)
  const vocab = buildVocabFromCatalog(catalog, synonyms)

  // ── Use-Case-Typ (Multi-Label: primär + sekundär) ────────────────────────────
  const ucResult = detectUseCaseTypes(textLower, vocab)
  const topUseCase = ucResult?.primary as WizardAnswers['usecase'] | undefined
  const secondaryUseCase = ucResult?.secondary as WizardAnswers['usecase'] | undefined

  // ── SAP Landscape ────────────────────────────────────────────────────────────
  let sap_landscape: WizardAnswers['sap_landscape']
  const sapHits = countVendorHits('SAP', textLower, allVendorAliases)
  if (/s\/4hana|s4hana/.test(textLower))
    sap_landscape = 'full'
  else if (sapHits >= 2 || /\bsap\b/.test(textLower))
    sap_landscape = 'partial'

  // ── Cloud-Provider ───────────────────────────────────────────────────────────
  let cloud_provider_hint: WizardAnswers['cloud_provider_hint']
  if (/sap btp|sap ai core|sap joule|sap build/i.test(textLower))
    cloud_provider_hint = 'sap_btp'
  else if (/azure|microsoft fabric|power platform|dynamics|navision/i.test(textLower))
    cloud_provider_hint = 'azure'
  else if (/\baws\b|amazon sagemaker|bedrock|redshift/i.test(textLower))
    cloud_provider_hint = 'aws'
  else if (/\bgcp\b|google cloud|vertex ai|bigquery/i.test(textLower))
    cloud_provider_hint = 'gcp'
  else if (sap_landscape && sap_landscape !== 'none')
    cloud_provider_hint = 'sap_btp'

  // ── Branche ──────────────────────────────────────────────────────────────────
  let industry: WizardAnswers['industry']
  let bestIndustry: string | undefined
  let bestIndustryScore = 0
  let secondBestScore = 0
  for (const [ind, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (ind === 'other') continue
    const hits = keywords.filter(kw => matchesTerm(textLower, kw)).length
    if (hits > bestIndustryScore) {
      secondBestScore = bestIndustryScore
      bestIndustryScore = hits
      bestIndustry = ind
    } else if (hits > secondBestScore) {
      secondBestScore = hits
    }
  }
  // Finance-Bias-Guard: Finance nur wenn ≥2 Hits Vorsprung vor zweitbester Branche
  if (bestIndustry === 'finance' && bestIndustryScore - secondBestScore < 2) {
    bestIndustry = undefined
    bestIndustryScore = 0
  }
  if (bestIndustry && bestIndustryScore > 0) {
    industry = bestIndustry as WizardAnswers['industry']
  } else {
    const otherHits = (INDUSTRY_KEYWORDS['other'] ?? []).filter(kw => matchesTerm(textLower, kw)).length
    if (otherHits > 0) industry = 'other'
  }

  // ── Data-Platform ────────────────────────────────────────────────────────────
  let data_platform: WizardAnswers['data_platform']
  for (const hint of DATA_PLATFORM_HINTS) {
    if (hint.pattern.test(textLower)) { data_platform = hint.value; break }
  }

  // ── Model-Platform ───────────────────────────────────────────────────────────
  let model_platform: WizardAnswers['model_platform']
  for (const hint of MODEL_PLATFORM_HINTS) {
    if (hint.pattern.test(textLower)) { model_platform = hint.value; break }
  }

  // ── Compliance-Flags ─────────────────────────────────────────────────────────
  const compliance_flags = detectCompliance(textLower)

  // ── Wizard-Vorausfüllung ──────────────────────────────────────────────────────
  const wizard_prefill: Partial<WizardAnswers> = {}
  if (topUseCase)     wizard_prefill.usecase = topUseCase
  if (sap_landscape)  wizard_prefill.sap_landscape = sap_landscape
  if (cloud_provider_hint) wizard_prefill.cloud_provider_hint = cloud_provider_hint
  if (industry)       wizard_prefill.industry = industry
  if (data_platform)  wizard_prefill.data_platform = data_platform
  if (model_platform) wizard_prefill.model_platform = model_platform
  if (compliance_flags.includes('dsgvo_strict') || compliance_flags.includes('eu_ai_act_high'))
    wizard_prefill.compliance = 'strict'
  // On-Premise-Infrastruktur-Hinweis
  if (/on[\s-]?premise|on-prem|eigene server|inhouse|rechenzentrum/i.test(textLower))
    wizard_prefill.infra = 'onprem'
  else if (/hybrid/i.test(textLower))
    wizard_prefill.infra = 'hybrid'

  // ── Cluster-Bonus ─────────────────────────────────────────────────────────────
  const clusterBonusPerVendor: Record<string, number> = {}
  for (const vendor of Object.keys(allVendorAliases)) {
    const hits = countVendorHits(vendor, textLower, allVendorAliases)
    if (hits >= 2) clusterBonusPerVendor[vendor] = 12
  }

  // ── Komponenten-Scoring ───────────────────────────────────────────────────────
  const platformContext = new Set<string>()
  for (const [cat, keywords] of Object.entries(allCategoryKeywords)) {
    if (keywords.some(kw => matchesTerm(textLower, kw))) platformContext.add(cat)
  }

  const pre_scored_components = catalog
    .map(c => {
      let score = scoreComponentAgainstText(c, canvasText, clusterBonusPerVendor[c.vendor ?? ''] ?? 0, allVendorAliases)
      if (platformContext.has('erp') && c.tags.some(t => ['erp', 'integration', 'connector'].includes(t.toLowerCase())))
        score += 8
      if (platformContext.has('iot') && c.tags.some(t => ['iot', 'edge', 'sensor'].includes(t.toLowerCase())))
        score += 8
      // Dokument-Context-Bonus für OCR/IDP-Komponenten
      if (platformContext.has('document') && c.tags.some(t => ['ocr', 'idp', 'document', 'document_processing'].includes(t.toLowerCase())))
        score += 8
      // Sekundärer Use-Case-Typ fließt ebenfalls in Scoring ein
      if (secondaryUseCase && c.use_case_types.includes(secondaryUseCase)) score += 5
      return { c, score }
    })
    .filter(x => x.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(x => x.c)

  // ── Banner-Tags ───────────────────────────────────────────────────────────────
  const detected_tags: DetectedTag[] = []
  if (useCase.weighted_score)
    detected_tags.push({ label: `Score ${useCase.weighted_score.toFixed(1)}`, type: 'score' })
  if (useCase.quadrant === 'quick_win')
    detected_tags.push({ label: 'Quick Win', type: 'score' })
  if (industry) {
    const INDUSTRY_LABEL: Record<string, string> = {
      finance: 'Finance', manufacturing: 'Fertigung',
      healthcare_public: 'Healthcare', retail_consumer: 'Retail', other: 'Sonstige',
    }
    detected_tags.push({ label: INDUSTRY_LABEL[industry] ?? industry, type: 'industry' })
  }
  if (sap_landscape && sap_landscape !== 'none')
    detected_tags.push({ label: 'SAP', type: 'platform' })
  if (cloud_provider_hint && cloud_provider_hint !== 'none_or_multi') {
    const CLOUD_LABEL: Record<string, string> = { sap_btp: 'SAP BTP', azure: 'Azure', aws: 'AWS', gcp: 'GCP' }
    if (CLOUD_LABEL[cloud_provider_hint])
      detected_tags.push({ label: CLOUD_LABEL[cloud_provider_hint], type: 'platform' })
  }
  if (platformContext.has('erp'))            detected_tags.push({ label: 'ERP', type: 'platform' })
  if (platformContext.has('iot'))            detected_tags.push({ label: 'IoT', type: 'platform' })
  if (platformContext.has('data_warehouse')) detected_tags.push({ label: 'Data Warehouse', type: 'platform' })
  if (platformContext.has('document'))       detected_tags.push({ label: 'Dokumente / OCR', type: 'platform' })
  if (topUseCase)
    detected_tags.push({ label: UC_DISPLAY_LABEL[topUseCase] ?? topUseCase, type: 'usecase' })
  if (secondaryUseCase)
    detected_tags.push({ label: UC_DISPLAY_LABEL[secondaryUseCase] ?? secondaryUseCase, type: 'usecase' })
  if (compliance_flags.includes('dsgvo_strict'))
    detected_tags.push({ label: 'DSGVO Strict', type: 'compliance' })
  if (compliance_flags.includes('eu_ai_act_high'))
    detected_tags.push({ label: 'EU AI Act High Risk', type: 'compliance' })

  const confidence = Object.keys(wizard_prefill).length / PREFILL_FIELDS.length

  return { wizard_prefill, pre_scored_components, compliance_flags, detected_tags, confidence }
}

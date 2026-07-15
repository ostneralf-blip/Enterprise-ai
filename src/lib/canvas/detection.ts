import type { Canvas } from '@/types'

// ─── Vendor-Aliases ────────────────────────────────────────────────────────────
export const VENDOR_ALIASES: Record<string, string[]> = {
  'SAP': [
    's/4hana', 's4hana', 'fiori', 'btp', 'hana', 'datasphere', 'bw/4hana',
    'joule', 'ariba', 'successfactors', 'sap cloud', 'ai core', 'genai hub',
    'business one', 'b1', 'concur', 'fieldglass', 'hybris', 'commerce cloud',
    'sap erp', 'r/3', 'ecc', 'netweaver', 'abap', 'sap cx', 'sap analytics',
    'sap datasphere', 'sap bw', 'sap basis', 'rise with sap', 'grow with sap',
    'sap build', 'sap integration suite', 'sap event mesh',
  ],
  'Microsoft': [
    'azure', 'm365', 'microsoft 365', 'teams', 'copilot studio', 'power platform',
    'power bi', 'fabric', 'microsoft fabric',
    'navision', 'dynamics', 'dynamics 365', 'd365', 'business central',
    'dynamics ax', 'dynamics nav', 'ax', 'dynamics crm', 'dynamics 365 crm',
    'dynamics erp', 'ms dynamics',
    'sharepoint', 'power automate', 'power apps', 'azure openai', 'azure ml',
    'azure machine learning', 'azure ai', 'cognitive services', 'azure cognitive',
    'azure synapse', 'ms sql', 'sql server', 'azure data factory',
    'azure databricks', 'copilot', 'bing', 'azure bot',
  ],
  'AWS': [
    'amazon', 'bedrock', 'sagemaker', 'aws lambda', 'ec2', 's3', 'redshift',
    'aws comprehend', 'aws rekognition', 'aws textract', 'aws lex',
    'aws glue', 'kinesis', 'emr', 'aws step functions',
  ],
  'Google': [
    'gcp', 'vertex ai', 'bigquery', 'google cloud', 'gemini', 'document ai',
    'dialogflow', 'google workspace', 'looker', 'google ai', 'bard',
    'cloud run', 'cloud functions', 'dataflow', 'google analytics',
  ],
  'Salesforce': [
    'salesforce', 'sfdc', 'force.com', 'einstein ai', 'tableau',
    'mulesoft', 'salesforce crm', 'service cloud', 'marketing cloud',
  ],
  'IBM': [
    'watson', 'watsonx', 'ibm cloud', 'db2', 'ibm maximo',
    'ibm cognos', 'ibm planning analytics', 'ibm rhapsody',
  ],
  'Oracle': [
    'oracle', 'netsuite', 'peoplesoft', 'oracle cloud', 'oracle erp',
    'oracle fusion', 'oracle hcm', 'oracle scm', 'oracle financials',
    'jd edwards', 'siebel',
  ],
  'Databricks': [
    'databricks', 'delta lake', 'mlflow', 'unity catalog', 'apache spark',
  ],
  'Snowflake': [
    'snowflake', 'snowpark',
  ],
  'Siemens': [
    'siemens', 'teamcenter', 'mindsphere', 'industrial edge', 'opcenter',
    'xcelerator', 'mendix',
  ],
}

// Maps vendor key → chip display label in Kontextanalyse-Box
const VENDOR_DISPLAY: Record<string, string> = {
  'SAP': 'SAP',
  'Microsoft': 'Azure',
  'AWS': 'AWS',
  'Google': 'GCP',
  'Salesforce': 'Salesforce',
  'IBM': 'IBM Watson',
  'Oracle': 'Oracle',
  'Databricks': 'Databricks',
  'Snowflake': 'Snowflake',
  'Siemens': 'Siemens',
}

// ─── Plattform-Kategorie-Keywords ──────────────────────────────────────────────
export const PLATFORM_CATEGORY_KEYWORDS: Record<string, string[]> = {
  'erp': [
    'erp', 'warenwirtschaft', 'wawi', 'enterprise resource planning',
    'buchhaltungssoftware', 'fibu', 'finanzbuchhaltung', 'controlling',
    'kreditoren', 'debitoren', 'hauptbuch', 'buchführung',
  ],
  'crm': [
    'crm', 'kundenmanagement', 'kundendaten', 'vertriebssystem',
    'opportunity', 'leads', 'kundenpflege',
  ],
  'data_warehouse': [
    'data warehouse', 'dwh', 'datawarehouse', 'lakehouse',
    'datalake', 'data lake', 'data vault',
  ],
  'iot': [
    'iot', 'sensor', 'maschinendaten', 'plc', 'scada', 'opc-ua',
    'edge computing', 'industrie 4.0', 'industrie4.0', 'iiot', 'telemetrie',
  ],
  'document': [
    'rechnung', 'invoice', 'dokument', 'vertrag', 'beleg', 'formular',
    'scan', 'ocr', 'dokumentenmanagement', 'dms',
    'word', 'docx', 'auslesen', 'texterkennung', 'arbeitsvertrag',
    'stammblatt', 'pdf-verarbeitung', 'rechnungseingang',
  ],
}

// ─── Levenshtein-Distanz ───────────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const temp = dp[j]
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1])
      prev = temp
    }
  }
  return dp[n]
}

// ─── matchesTerm ──────────────────────────────────────────────────────────────
// Wortgrenz-Matching für kurze Terme (≤ 4 Zeichen), includes() für mittlere,
// zusätzlich Fuzzy (Levenshtein ≤ 2) für Terme ≥ 6 Zeichen gegen einzelne Tokens.
export function matchesTerm(text: string, term: string): boolean {
  const t = term.toLowerCase()
  if (t.length <= 4) {
    const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\b${esc}\\b`, 'i').test(text)
  }
  if (text.includes(t)) return true
  if (t.length >= 6) {
    const tokens = text.split(/[\s,;./()\-]+/)
    for (const token of tokens) {
      const w = token.toLowerCase()
      if (Math.abs(w.length - t.length) <= 2 && levenshtein(w, t) <= 2) return true
    }
  }
  return false
}

// ─── buildDetectionText ───────────────────────────────────────────────────────
// Einheitliche Textbasis für alle Erkennungspfade: 8 Felder + Titel.
export function buildDetectionText(canvas: Canvas): string {
  return [
    canvas.title,
    canvas.data.problem,
    canvas.data.solution,
    canvas.data.data_sources,
    canvas.data.stakeholders,
    canvas.data.kpis,
    canvas.data.risks,
    canvas.data.architecture,
    canvas.data.next_steps,
  ].filter(Boolean).join(' ').toLowerCase()
}

// ─── detectPlatformTags ───────────────────────────────────────────────────────
// Gibt Chip-Display-Labels zurück (z.B. "SAP", "Azure"). Nutzt Fuzzy-Matching
// — fängt Tippfehler wie "Succcessfactor" → SAP.
export function detectPlatformTags(
  text: string,
  vendorAliases: Record<string, string[]> = VENDOR_ALIASES,
): string[] {
  const result = new Set<string>()
  for (const [vendor, aliases] of Object.entries(vendorAliases)) {
    const matched =
      matchesTerm(text, vendor.toLowerCase()) ||
      aliases.some(a => matchesTerm(text, a))
    if (matched) result.add(VENDOR_DISPLAY[vendor] ?? vendor)
  }
  if (/on[\s-]?prem|eigene server|inhouse|rechenzentrum/i.test(text)) {
    result.add('On-Premises')
  }
  return [...result]
}

// ─── detectUseCaseTypes ───────────────────────────────────────────────────────
export type UcType = 'vision' | 'generative' | 'predictive' | 'automation'

export const BASE_VOCAB: Record<UcType, string[]> = {
  vision: [
    'ocr', 'bildverarbeitung', 'dokument', 'scan', 'bild', 'erkennung',
    'invoice', 'rechnung', 'vision', 'image', 'kamera', 'foto', 'pdf',
    'dokumentenanalyse', 'qualitätsprüfung', 'sichtprüfung', 'inspektion',
    'object detection', 'bilderkennung', 'barcode', 'qr-code',
    'word', 'docx', 'auslesen', 'texterkennung', 'arbeitsvertrag', 'stammblatt',
    'formular', 'rechnungseingang',
  ],
  generative: [
    'llm', 'gpt', 'genai', 'chat', 'text', 'zusammenfassung', 'sprachmodell',
    'rag', 'embedding', 'generativ', 'chatbot', 'assistent', 'copilot',
    'textgenerierung', 'übersetzung', 'wissensdatenbank', 'faq',
    'wissensmanagement', 'semantic search', 'semantische suche',
    'joule', 'claude', 'gemini', 'gpt-4', 'generative ai',
    'knowledge base', 'prompt', 'fine-tuning', 'finetune',
  ],
  predictive: [
    'forecast', 'prognose', 'anomalie', 'vorhersage', 'klassifikation',
    'prediction', 'regression', 'predictive', 'score', 'scoring',
    'churn', 'abwanderung', 'nachfrageprognose', 'demand forecast',
    'bestandsoptimierung', 'preisoptimierung', 'risikomodell',
    'predictive maintenance', 'zustandsüberwachung', 'zeitreihe',
    'time series', 'machine learning', 'ml modell', 'ml-modell',
  ],
  automation: [
    'rpa', 'workflow', 'automatisierung', 'prozess', 'roboter',
    'pipeline', 'trigger', 'regelbasiert', 'entscheidungsbaum',
    'orchestrierung', 'integration', 'api-anbindung', 'middleware',
    'automatisch', 'automate', 'low-code', 'no-code', 'bpmn',
    'geschäftsprozess', 'prozessoptimierung', 'delegation',
  ],
}

export const UC_DISPLAY_LABEL: Record<string, string> = {
  vision: 'OCR / Vision',
  generative: 'Generative AI',
  predictive: 'Predictive Analytics',
  automation: 'Prozessautomatisierung',
}

// Gibt primären und ggf. sekundären Use-Case-Typ zurück (Multi-Label).
export function detectUseCaseTypes(
  text: string,
  extraVocab?: Record<string, Set<string>>,
): { primary: UcType; secondary?: UcType } | null {
  const scores: Record<string, number> = {}
  for (const [uct, keywords] of Object.entries(BASE_VOCAB)) {
    let s = 0
    for (const kw of keywords) { if (matchesTerm(text, kw)) s++ }
    if (extraVocab?.[uct]) {
      for (const kw of extraVocab[uct]) { if (matchesTerm(text, kw)) s++ }
    }
    scores[uct] = s
  }
  const sorted = (Object.entries(scores) as [UcType, number][])
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
  if (sorted.length === 0) return null
  const [primary, topScore] = sorted[0]
  const secondary =
    sorted.length > 1 && sorted[1][1] >= Math.ceil(topScore * 0.5)
      ? sorted[1][0]
      : undefined
  return { primary, secondary }
}

// ─── detectDocumentContext ────────────────────────────────────────────────────
export function detectDocumentContext(text: string): boolean {
  return PLATFORM_CATEGORY_KEYWORDS['document']?.some(kw => matchesTerm(text, kw)) ?? false
}

// ─── detectCompliance ─────────────────────────────────────────────────────────
export type CanvasComplianceFlag = 'dsgvo_strict' | 'eu_ai_act_high' | 'eu_hosting_required'

export function detectCompliance(text: string): CanvasComplianceFlag[] {
  const flags: CanvasComplianceFlag[] = []
  if (/dsgvo|datenschutz|personenbezogen|gdpr/i.test(text)) flags.push('dsgvo_strict')
  if (/eu ai act|hochrisiko|biometrisch|verbotene ki/i.test(text)) flags.push('eu_ai_act_high')
  if (/eu[\s-]?hosting|frankfurt|on[\s-]?premise|on-premise|datensouveränität/i.test(text)) flags.push('eu_hosting_required')
  return flags
}

// ─── analyzeCanvas ────────────────────────────────────────────────────────────
// Drop-in-Ersatz für analyzeCanvasData() in CanvasPageClient.
// Nutzt dieselbe Textbasis und dieselben Algorithmen wie extractCanvasContext.
export interface CanvasDetectionResult {
  platform: string[]
  usecaseType: string | null
  usecaseSecondary: string | null
  compliance: string[]
  hasDocumentContext: boolean
  filledCount: number
}

/** Fügt DB-Synonyme zu den statischen VENDOR_ALIASES hinzu (Client ergänzt, überschreibt nie). */
export function mergeAliases(
  base: Record<string, string[]>,
  extra: Record<string, string[]>,
): Record<string, string[]> {
  const result: Record<string, string[]> = { ...base }
  for (const [vendor, aliases] of Object.entries(extra)) {
    const existing = result[vendor] ?? []
    const toAdd = aliases.filter(a => !existing.includes(a.toLowerCase()))
    result[vendor] = toAdd.length ? [...existing, ...toAdd.map(a => a.toLowerCase())] : existing
  }
  return result
}

export function analyzeCanvas(canvas: Canvas, extraAliases?: Record<string, string[]>): CanvasDetectionResult {
  const text = buildDetectionText(canvas)
  const aliases = extraAliases ? mergeAliases(VENDOR_ALIASES, extraAliases) : VENDOR_ALIASES
  const platform = detectPlatformTags(text, aliases)
  const ucTypes = detectUseCaseTypes(text)
  const complianceFlags = detectCompliance(text)
  const hasDocumentContext = detectDocumentContext(text)

  // Compliance → display strings (kompatibel mit normalizeComplianceFlag in CanvasPageClient)
  const complianceDisplay: string[] = []
  if (complianceFlags.includes('dsgvo_strict')) complianceDisplay.push('DSGVO relevant')
  if (complianceFlags.includes('eu_ai_act_high')) complianceDisplay.push('EU AI Act relevant')
  if (complianceFlags.includes('eu_hosting_required')) complianceDisplay.push('EU-Hosting / Datensouveränität')
  // Extended compliance from canvas text (analog zu analyzeCanvasData)
  if (/iso.?27001|isms|informationssicherheit|soc.?2|pentest/i.test(text))
    complianceDisplay.push('ISO 27001 / IT-Sicherheit relevant')
  if (/nis.?2|kritis|kritische infrastruktur/i.test(text))
    complianceDisplay.push('NIS2 / KRITIS relevant')
  if (/gesundheit|patientendaten|medizin|klinik|hipaa|\bmdr\b/i.test(text))
    complianceDisplay.push('Gesundheitsdaten / MDR relevant')
  if (/finanz|banking|zahlungs|psd2|mifid|bafin/i.test(text))
    complianceDisplay.push('Finanzregulierung relevant')

  const filledCount = Object.values(canvas.data).filter(v => v?.trim()).length

  return {
    platform,
    usecaseType: ucTypes ? UC_DISPLAY_LABEL[ucTypes.primary] ?? ucTypes.primary : null,
    usecaseSecondary: ucTypes?.secondary ? UC_DISPLAY_LABEL[ucTypes.secondary] ?? ucTypes.secondary : null,
    hasDocumentContext,
    compliance: complianceDisplay,
    filledCount,
  }
}

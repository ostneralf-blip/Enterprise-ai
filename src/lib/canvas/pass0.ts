// Pass 0 — Feldbewusster Kandidaten-Extraktor + Signal-Auswertung (#190)
// Baut auf detection.ts (Unified Engine, #186) + field-priors.ts (§3) auf.
// Keine Token-Kosten: rein deterministisch, läuft immer (Free + Pro).

import type { Canvas } from '@/types'
import { matchesTerm, type CanvasComplianceFlag } from './detection'
import { FIELD_PRIORS, FIELD_PRIOR_MAP, isHarvestField, type EntityPrior } from './field-priors'

// ─── Anhang-III-Bereiche (EU AI Act, Hochrisiko-Kategorien) ───────────────────
export type AnnexIIIArea =
  | 'education'
  | 'employment'
  | 'essential_services'
  | 'law_enforcement'
  | 'border_control'
  | 'justice'
  | 'critical_infrastructure'
  | 'biometric'

const ANNEX_III_KEYWORDS: Record<AnnexIIIArea, string[]> = {
  education: [
    'schule', 'lehrer', 'lehrerin', 'student', 'ausbildung', 'hochschule',
    'universität', 'lernender', 'prüfung', 'bildung', 'berufsschule',
  ],
  employment: [
    'hr', 'personalwesen', 'mitarbeiter', 'personal', 'recruiter', 'recruiting',
    'bewerbung', 'einstellung', 'kündigung', 'onboarding', 'personalleitung',
    'hr-leiterin', 'human resources', 'personalentwicklung',
  ],
  essential_services: [
    'sozialamt', 'jobcenter', 'krankenversicherung', 'sozialleistung',
    'behörde', 'öffentliche verwaltung', 'arbeitsamt',
  ],
  law_enforcement: [
    'polizei', 'ermittler', 'staatsanwalt', 'strafverfolgung',
    'kriminalamt', 'bka', 'lka', 'kripo',
  ],
  border_control: [
    'grenzschutz', 'zoll', 'migration', 'asyl', 'grenzkontrolle',
    'einwanderung', 'bundespolizei', 'grenzübergang',
  ],
  justice: [
    'richter', 'richterin', 'gericht', 'rechtsanwalt', 'anwalt', 'notar',
    'justizbehörde', 'tribunal', 'justiz',
  ],
  critical_infrastructure: [
    'energieversorger', 'wasserwerk', 'kritis', 'stromversorgung',
    'kritische infrastruktur', 'netzwerkbetreiber',
  ],
  biometric: [
    'biometrie', 'gesichtserkennung', 'fingerabdruck', 'iris',
    'biometrisch', 'gesichtsscanner',
  ],
}

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'Gesundheitswesen': [
    'arzt', 'ärztin', 'klinik', 'krankenhaus', 'patient', 'pflege',
    'medizin', 'chirurg', 'radiologie', 'apotheke', 'pfleger',
  ],
  'Finanzwesen': [
    'bank', 'finanzberater', 'treasury', 'controller', 'buchhalter',
    'versicherung', 'fondmanager', 'investment',
  ],
  'Recht & Compliance': [
    'compliance', 'datenschutzbeauftragter', 'dpo', 'legal', 'jurist',
    'datenschutz', 'compliance-officer',
  ],
  'Logistik & SCM': [
    'logistik', 'lager', 'lieferkette', 'disposition', 'einkauf', 'scm',
    'lagerleiter', 'spediteur',
  ],
  'Produktion & Fertigung': [
    'werksleiter', 'produktionsleiter', 'qualitätssicherung', 'instandhaltung',
    'maschinenbediener', 'fertigung', 'montage',
  ],
  'Öffentliche Verwaltung': [
    'amt', 'behörde', 'sachbearbeiter', 'bürgermeister', 'ministerium',
    'verwaltungsleiter', 'öffentlicher dienst',
  ],
}

export interface StakeholderSignals {
  industries: string[]
  annexIII: AnnexIIIArea[]
}

export function extractStakeholderSignals(stakeholderText: string): StakeholderSignals {
  const text = stakeholderText.toLowerCase()
  const industries: string[] = []
  const annexIII: AnnexIIIArea[] = []

  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (keywords.some(kw => matchesTerm(text, kw))) industries.push(industry)
  }
  for (const [area, keywords] of Object.entries(ANNEX_III_KEYWORDS)) {
    if (keywords.some(kw => matchesTerm(text, kw))) annexIII.push(area as AnnexIIIArea)
  }
  return { industries, annexIII }
}

// ─── Compliance-Signal mit Quellenangabe ──────────────────────────────────────
export interface ComplianceSignal {
  flag: CanvasComplianceFlag
  fromRisksField: boolean
}

export function extractComplianceSignals(canvas: Canvas): ComplianceSignal[] {
  const risksText = (canvas.data.risks ?? '').toLowerCase()
  const allText = [canvas.title, ...Object.values(canvas.data)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const flagsFromRisks = new Set<CanvasComplianceFlag>()
  const flagsFromOther = new Set<CanvasComplianceFlag>()

  function checkFlag(text: string, flag: CanvasComplianceFlag, pattern: RegExp) {
    if (pattern.test(text)) {
      if (text === risksText) flagsFromRisks.add(flag)
      else flagsFromOther.add(flag)
    }
  }

  const checks: [CanvasComplianceFlag, RegExp][] = [
    ['dsgvo_strict', /dsgvo|datenschutz|personenbezogen|gdpr/i],
    ['eu_ai_act_high', /eu ai act|hochrisiko|biometrisch|verbotene ki/i],
    ['eu_hosting_required', /eu[\s-]?hosting|frankfurt|on[\s-]?premise|on-premise|datensouveränität/i],
  ]

  for (const [flag, pattern] of checks) {
    checkFlag(risksText, flag, pattern)
    checkFlag(allText, flag, pattern)
  }

  const result: ComplianceSignal[] = []
  const allFlags = new Set([...flagsFromRisks, ...flagsFromOther])
  for (const flag of allFlags) {
    result.push({ flag, fromRisksField: flagsFromRisks.has(flag) })
  }
  return result
}

// ─── Kandidaten-Extraktion für Pass 1 ────────────────────────────────────────
export interface CandidateTerm {
  term: string
  field: string
  fieldLabel: string
  context: string  // ±1 Satz für Pass-1-Prompt
  entityPrior: EntityPrior
  scoreWeight: number
}

// Minimale Stopp-Liste: nur die kürzesten grammatikalischen Funktionswörter.
// Längere Kandidaten (z.B. "sollen") bleiben erhalten — Pass 1 klassifiziert sie als fuellwort.
const STOP_WORDS = new Set([
  // Artikel & Präpositionen
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer', 'einem', 'einen',
  'und', 'oder', 'aber', 'für', 'mit', 'auf', 'bei', 'von', 'aus', 'nach', 'zur',
  'zum', 'als', 'ist', 'sind', 'hat', 'den', 'via', 'per', 'bzw', 'inkl',
  'the', 'and', 'or', 'but', 'for', 'with', 'from',
])

function getFieldText(canvas: Canvas, key: string): string {
  if (key === 'title') return canvas.title ?? ''
  return (canvas.data as unknown as Record<string, string | undefined>)[key] ?? ''
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?\n])\s*/).map(s => s.trim()).filter(Boolean)
}

function extractTokens(sentence: string): string[] {
  return sentence
    .split(/[\s,;:()\-–/\\|]+/)
    .map(t => t.replace(/^["'„"]+|["'""]+$/g, '').trim())
    .filter(t => t.length >= 3)
}

function isKnownTerm(token: string, knownTerms: Set<string>): boolean {
  const t = token.toLowerCase()
  for (const known of knownTerms) {
    if (matchesTerm(t, known)) return true
  }
  return false
}

export function extractUnknownCandidates(
  canvas: Canvas,
  knownTerms: Set<string> = new Set(),
  blocklist: Set<string> = new Set(),
): CandidateTerm[] {
  // term (normalized) → best occurrence (highest scoreWeight field)
  const best = new Map<string, CandidateTerm>()

  for (const prior of FIELD_PRIORS) {
    if (!isHarvestField(prior)) continue

    const text = getFieldText(canvas, prior.key)
    if (!text.trim()) continue

    const sentences = splitSentences(text)

    for (let si = 0; si < sentences.length; si++) {
      for (const token of extractTokens(sentences[si])) {
        const normalized = token.toLowerCase()
        if (STOP_WORDS.has(normalized)) continue
        if (blocklist.has(normalized)) continue
        if (isKnownTerm(normalized, knownTerms)) continue

        const context = [sentences[si - 1], sentences[si], sentences[si + 1]]
          .filter(Boolean)
          .join(' ')

        const existing = best.get(normalized)
        if (!existing || prior.scoreWeight > existing.scoreWeight) {
          best.set(normalized, {
            term: token,
            field: prior.key,
            fieldLabel: prior.label,
            context,
            entityPrior: prior.entityPrior,
            scoreWeight: prior.scoreWeight,
          })
        }
      }
    }
  }

  return [...best.values()].sort((a, b) => b.scoreWeight - a.scoreWeight)
}

// ─── Kombiniertes Pass-0-Ergebnis ─────────────────────────────────────────────
import type { CanvasDetectionResult } from './detection'
import { analyzeCanvas } from './detection'

export interface CanvasPass0Result extends CanvasDetectionResult {
  stakeholderSignals: StakeholderSignals
  complianceSignals: ComplianceSignal[]
  candidates: CandidateTerm[]
}

export function analyzeCanvasPass0(
  canvas: Canvas,
  knownTerms: Set<string> = new Set(),
  blocklist: Set<string> = new Set(),
): CanvasPass0Result {
  const base = analyzeCanvas(canvas)
  const stakeholderSignals = extractStakeholderSignals(canvas.data.stakeholders ?? '')
  const complianceSignals = extractComplianceSignals(canvas)
  const candidates = extractUnknownCandidates(canvas, knownTerms, blocklist)
  return { ...base, stakeholderSignals, complianceSignals, candidates }
}

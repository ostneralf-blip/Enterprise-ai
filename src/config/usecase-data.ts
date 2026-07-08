import type { UseCaseWeights } from '@/types'
import type { LocaleString } from '@/lib/utils/locale-data'

export const DEFAULT_WEIGHTS: UseCaseWeights = {
  value: 0.30,
  feasibility: 0.25,
  data_readiness: 0.20,
  risk: 0.15,
  speed: 0.10,
}

export type CriterionId = 'value' | 'feasibility' | 'data_readiness' | 'risk' | 'speed'

export const CRITERIA: Array<{
  id: CriterionId
  label: LocaleString
  description: LocaleString
  lowLabel: LocaleString
  highLabel: LocaleString
}> = [
  {
    id: 'value',
    label: { de: 'Business Value', en: 'Business Value' },
    description: { de: 'Erwarteter Geschäftswert & strategische Bedeutung', en: 'Expected business value & strategic importance' },
    lowLabel: { de: 'Kaum messbarer Nutzen', en: 'Barely measurable benefit' },
    highLabel: { de: 'Kritischer Wettbewerbsvorteil', en: 'Critical competitive advantage' },
  },
  {
    id: 'feasibility',
    label: { de: 'Umsetzbarkeit', en: 'Feasibility' },
    description: { de: 'Technische & organisatorische Machbarkeit', en: 'Technical & organizational feasibility' },
    lowLabel: { de: 'Sehr komplex, viele Abhängigkeiten', en: 'Very complex, many dependencies' },
    highLabel: { de: 'Klar definiert, Team bereit', en: 'Clearly defined, team ready' },
  },
  {
    id: 'data_readiness',
    label: { de: 'Datenqualität', en: 'Data Quality' },
    description: { de: 'Verfügbarkeit, Qualität & Zugänglichkeit der Daten', en: 'Availability, quality & accessibility of data' },
    lowLabel: { de: 'Daten fehlen oder sind nicht nutzbar', en: 'Data missing or unusable' },
    highLabel: { de: 'Strukturierte, qualitätsgesicherte Daten vorhanden', en: 'Structured, quality-assured data available' },
  },
  {
    id: 'risk',
    label: { de: 'Risikoabsicherung', en: 'Risk Control' },
    description: { de: 'Beherrschbarkeit von Risiken (5 = niedriges Risiko)', en: 'Manageability of risks (5 = low risk)' },
    lowLabel: { de: 'Hohe rechtliche / reputationelle Risiken', en: 'High legal / reputational risks' },
    highLabel: { de: 'Risiken gut kontrollierbar', en: 'Risks well manageable' },
  },
  {
    id: 'speed',
    label: { de: 'Time-to-Value', en: 'Time-to-Value' },
    description: { de: 'Wie schnell ist ein erster Mehrwert erzielbar?', en: 'How quickly can first value be achieved?' },
    lowLabel: { de: '> 12 Monate bis erste Ergebnisse', en: '> 12 months to first results' },
    highLabel: { de: '< 3 Monate bis messbarer Nutzen', en: '< 3 months to measurable benefit' },
  },
]

export const DOMAINS = [
  'Vertrieb & Marketing',
  'Kundenservice',
  'Operations & Logistik',
  'Finanzen & Controlling',
  'HR & Personalentwicklung',
  'Produkt & Innovation',
  'IT & Infrastruktur',
  'Compliance & Risiko',
  'Sonstiges',
]

type QuadrantKey = 'quick_win' | 'strategic_bet' | 'low_hanging_fruit' | 'avoid'

export const QUADRANT_META: Record<QuadrantKey, {
  label: LocaleString
  desc: LocaleString
  color: 'emerald' | 'blue' | 'amber' | 'slate'
  icon: string
}> = {
  quick_win: {
    label: { de: 'Quick Win', en: 'Quick Win' },
    desc: { de: 'Hoher Wert, gut umsetzbar — jetzt starten', en: 'High value, feasible — start now' },
    color: 'emerald',
    icon: '⚡',
  },
  strategic_bet: {
    label: { de: 'Strategic Bet', en: 'Strategic Bet' },
    desc: { de: 'Hoher Wert, aber komplex — mittelfristig angehen', en: 'High value, but complex — tackle mid-term' },
    color: 'blue',
    icon: '🎯',
  },
  low_hanging_fruit: {
    label: { de: 'Low Hanging Fruit', en: 'Low Hanging Fruit' },
    desc: { de: 'Leicht umsetzbar, aber geringer Wert — optional', en: 'Easy to implement, but low value — optional' },
    color: 'amber',
    icon: '🍎',
  },
  avoid: {
    label: { de: 'Vermeiden', en: 'Avoid' },
    desc: { de: 'Niedriger Wert, schwer umsetzbar — deprioritisieren', en: 'Low value, hard to implement — deprioritize' },
    color: 'slate',
    icon: '⚠️',
  },
}

export const FREE_LIMIT = 3

export function calcWeightedScore(
  scores: Record<string, number>,
  weights: UseCaseWeights
): number {
  const raw = CRITERIA.reduce((acc, c) => acc + (scores[c.id] ?? 3) * weights[c.id], 0)
  return Math.round(raw * 100) / 100
}

export function deriveQuadrant(
  scores: Record<string, number>
): QuadrantKey {
  const v = scores.value ?? 3
  const f = scores.feasibility ?? 3
  if (v >= 3 && f >= 3) return 'quick_win'
  if (v >= 3 && f < 3) return 'strategic_bet'
  if (v < 3 && f >= 3) return 'low_hanging_fruit'
  return 'avoid'
}

export function weightsAreValid(w: Record<string, number>): boolean {
  const sum = Object.values(w).reduce((a, b) => a + b, 0)
  return Math.abs(sum - 1.0) < 0.011
}

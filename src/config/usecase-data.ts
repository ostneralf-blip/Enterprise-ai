import type { UseCaseWeights } from '@/types'

export const DEFAULT_WEIGHTS: UseCaseWeights = {
  value: 0.30,
  feasibility: 0.25,
  data_readiness: 0.20,
  risk: 0.15,
  speed: 0.10,
}

export const CRITERIA = [
  {
    id: 'value' as const,
    label: 'Business Value',
    description: 'Erwarteter Geschäftswert & strategische Bedeutung',
    lowLabel: 'Kaum messbarer Nutzen',
    highLabel: 'Kritischer Wettbewerbsvorteil',
  },
  {
    id: 'feasibility' as const,
    label: 'Umsetzbarkeit',
    description: 'Technische & organisatorische Machbarkeit',
    lowLabel: 'Sehr komplex, viele Abhängigkeiten',
    highLabel: 'Klar definiert, Team bereit',
  },
  {
    id: 'data_readiness' as const,
    label: 'Datenqualität',
    description: 'Verfügbarkeit, Qualität & Zugänglichkeit der Daten',
    lowLabel: 'Daten fehlen oder sind nicht nutzbar',
    highLabel: 'Strukturierte, qualitätsgesicherte Daten vorhanden',
  },
  {
    id: 'risk' as const,
    label: 'Risikoabsicherung',
    description: 'Beherrschbarkeit von Risiken (5 = niedriges Risiko)',
    lowLabel: 'Hohe rechtliche / reputationelle Risiken',
    highLabel: 'Risiken gut kontrollierbar',
  },
  {
    id: 'speed' as const,
    label: 'Time-to-Value',
    description: 'Wie schnell ist ein erster Mehrwert erzielbar?',
    lowLabel: '> 12 Monate bis erste Ergebnisse',
    highLabel: '< 3 Monate bis messbarer Nutzen',
  },
] as const

export type CriterionId = (typeof CRITERIA)[number]['id']

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

export const QUADRANT_META = {
  quick_win: {
    label: 'Quick Win',
    desc: 'Hoher Wert, gut umsetzbar — jetzt starten',
    color: 'emerald',
    icon: '⚡',
  },
  strategic_bet: {
    label: 'Strategic Bet',
    desc: 'Hoher Wert, aber komplex — mittelfristig angehen',
    color: 'blue',
    icon: '🎯',
  },
  low_hanging_fruit: {
    label: 'Low Hanging Fruit',
    desc: 'Leicht umsetzbar, aber geringer Wert — optional',
    color: 'amber',
    icon: '🍎',
  },
  avoid: {
    label: 'Vermeiden',
    desc: 'Niedriger Wert, schwer umsetzbar — deprioritisieren',
    color: 'slate',
    icon: '⚠️',
  },
} as const

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
): 'quick_win' | 'strategic_bet' | 'low_hanging_fruit' | 'avoid' {
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

import type { AssessmentDimension } from '@/types'

export const ASSESSMENT_DIMENSIONS: AssessmentDimension[] = [
  {
    id: 'data',
    label: 'Datenqualität & -zugriff',
    weight: 0.25,
    questions: [
      {
        id: 'data_1',
        text: 'Sind Kerndaten strukturiert und einheitlich modelliert?',
        lowLabel: 'Datensilos, kein Masterkonzept',
        highLabel: 'Einheitliches Datenmodell, Data Catalog vorhanden',
      },
      {
        id: 'data_2',
        text: 'Gibt es definierte Datenzugriffsrechte (RBAC/ABAC)?',
        lowLabel: 'Keine Rollenkonzepte vorhanden',
        highLabel: 'Granulare, auditierbare Zugriffssteuerung',
      },
      {
        id: 'data_3',
        text: 'Wie hoch ist die Datenqualität in Kernprozessen?',
        lowLabel: 'Unter 60 % valide Einträge',
        highLabel: 'Über 90 % valide, aktuell und vollständig',
      },
    ],
  },
  {
    id: 'skills',
    label: 'Skills & Kompetenzen',
    weight: 0.20,
    questions: [
      {
        id: 'skills_1',
        text: 'Gibt es AI/ML-Kompetenz im eigenen Team?',
        lowLabel: 'Keine internen AI-Skills vorhanden',
        highLabel: 'Dediziertes AI-Team mit MLOps-Kompetenz',
      },
      {
        id: 'skills_2',
        text: 'Sind Business-Stakeholder AI-literat?',
        lowLabel: 'Kaum Wissen über AI-Potenziale',
        highLabel: 'Aktive AI-Champions in allen Business Units',
      },
      {
        id: 'skills_3',
        text: 'Existiert ein Schulungsprogramm für AI-Skills?',
        lowLabel: 'Kein Programm geplant oder vorhanden',
        highLabel: 'Laufendes strukturiertes Upskilling-Programm',
      },
    ],
  },
  {
    id: 'governance',
    label: 'Governance & Prozesse',
    weight: 0.20,
    questions: [
      {
        id: 'gov_1',
        text: 'Gibt es eine AI-Policy oder ein Governance-Rahmenwerk?',
        lowLabel: 'Keine Policy vorhanden',
        highLabel: 'Dokumentiertes, aktiv genutztes Governance-Framework',
      },
      {
        id: 'gov_2',
        text: 'Sind Verantwortlichkeiten für AI klar definiert?',
        lowLabel: 'Unklar, wer Ownership hat',
        highLabel: 'RACI definiert, AI Owner in jeder Business Unit',
      },
      {
        id: 'gov_3',
        text: 'Existiert ein Risikobewertungsprozess für AI-Projekte?',
        lowLabel: 'Kein strukturierter Prozess vorhanden',
        highLabel: 'Standardisiertes AI-Risk-Assessment etabliert',
      },
    ],
  },
  {
    id: 'tech',
    label: 'Technische Infrastruktur',
    weight: 0.20,
    questions: [
      {
        id: 'tech_1',
        text: 'Ist die IT-Infrastruktur cloud-ready?',
        lowLabel: 'Rein on-premise, keine Cloud-Strategie',
        highLabel: 'Hybrid/Cloud-native, horizontal skalierbar',
      },
      {
        id: 'tech_2',
        text: 'Gibt es API-Schnittstellen für Kernsysteme?',
        lowLabel: 'Kaum APIs, monolithische Legacy-Systeme',
        highLabel: 'Vollständige API-Strategie mit Event-Bus',
      },
      {
        id: 'tech_3',
        text: 'Wird MLOps oder DevOps bereits praktiziert?',
        lowLabel: 'Manuelles Deployment, keine CI/CD-Pipelines',
        highLabel: 'Vollständige MLOps-Pipeline produktiv',
      },
    ],
  },
  {
    id: 'strategy',
    label: 'Strategie & Zielbild',
    weight: 0.10,
    questions: [
      {
        id: 'strat_1',
        text: 'Gibt es eine dokumentierte AI-Strategie?',
        lowLabel: 'Keine Strategie, reaktives Vorgehen',
        highLabel: 'Klare AI-Vision mit messbaren OKRs',
      },
      {
        id: 'strat_2',
        text: 'Ist AI im Budget- und Planungsprozess verankert?',
        lowLabel: 'Kein dediziertes AI-Budget',
        highLabel: 'AI als Linienkostenposition im Jahresbudget',
      },
    ],
  },
  {
    id: 'culture',
    label: 'Kultur & Leadership',
    weight: 0.05,
    questions: [
      {
        id: 'cult_1',
        text: 'Besteht aktive Executive-Sponsorship für AI?',
        lowLabel: 'Kein C-Level-Commitment erkennbar',
        highLabel: 'AI steht auf Vorstandsagenda, dedizierter CDO',
      },
      {
        id: 'cult_2',
        text: 'Ist die Organisation offen für KI-getriebenen Wandel?',
        lowLabel: 'Hoher Widerstand gegen Veränderungen',
        highLabel: 'Etablierte Change-Management-Kultur',
      },
    ],
  },
]

export const ALL_QUESTIONS = ASSESSMENT_DIMENSIONS.flatMap(d => d.questions)
export const TOTAL_QUESTIONS = ALL_QUESTIONS.length // 16

export function calcDimScore(answers: Record<string, number>, dimId: string): number | null {
  const dim = ASSESSMENT_DIMENSIONS.find(d => d.id === dimId)
  if (!dim) return null
  const scores = dim.questions.map(q => answers[q.id]).filter((v): v is number => v !== undefined)
  if (scores.length === 0) return null
  return scores.reduce((a, b) => a + b, 0) / dim.questions.length
}

export function calcTotalScore(answers: Record<string, number>): number | null {
  const answeredDims = ASSESSMENT_DIMENSIONS.filter(d =>
    d.questions.some(q => answers[q.id] !== undefined)
  )
  if (answeredDims.length === 0) return null

  let weightSum = 0
  let scoreSum = 0
  for (const dim of ASSESSMENT_DIMENSIONS) {
    const score = calcDimScore(answers, dim.id)
    if (score !== null) {
      scoreSum += score * dim.weight
      weightSum += dim.weight
    }
  }
  return weightSum > 0 ? scoreSum / weightSum : null
}

export function deriveArchetype(totalScore: number): 'starter' | 'scaler' | 'transformer' {
  if (totalScore < 2.5) return 'starter'
  if (totalScore < 3.8) return 'scaler'
  return 'transformer'
}

export function getMaturityLevel(score: number): {
  level: number; label: string; color: string; bgColor: string
} {
  if (score < 1.5) return { level: 1, label: 'Level 1 — Initial',      color: 'text-red-600',    bgColor: 'bg-red-50 border-red-200'     }
  if (score < 2.5) return { level: 2, label: 'Level 2 — Emerging',     color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200'}
  if (score < 3.5) return { level: 3, label: 'Level 3 — Defined',      color: 'text-amber-600',  bgColor: 'bg-amber-50 border-amber-200' }
  if (score < 4.5) return { level: 4, label: 'Level 4 — Managed',      color: 'text-emerald-600',bgColor: 'bg-emerald-50 border-emerald-200'}
  return             { level: 5, label: 'Level 5 — Optimizing',   color: 'text-emerald-700',bgColor: 'bg-emerald-100 border-emerald-300'}
}

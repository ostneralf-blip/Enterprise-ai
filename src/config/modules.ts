import type { ModuleConfig } from '@/types'

export const MODULES: ModuleConfig[] = [
  {
    id: 'assessment',
    title: { de: 'AI-Readiness Assessment', en: 'AI Readiness Assessment' },
    subtitle: { de: '6 Dimensionen · 16 Fragen · ~10 Min', en: '6 dimensions · 16 questions · ~10 min' },
    subtitlePro: { de: '6 Dimensionen · 42 Fragen · ~25 Min', en: '6 dimensions · 42 questions · ~25 min' },
    icon: '◎',
    href: '/assessment',
    duration: '10 Min',
    requiredTier: 'free',
    description: {
      de: 'Ermitteln Sie Ihren AI-Reifegrad in 6 Dimensionen: Daten, Skills, Governance, Technologie, Strategie und Kultur. Mit Radar-Chart und priorisierten Handlungsfeldern.',
      en: 'Assess your AI maturity across 6 dimensions: data, skills, governance, technology, strategy and culture. Includes radar chart and prioritized action areas.',
    },
  },
  {
    id: 'canvas',
    title: { de: 'AI Use-Case Canvas', en: 'AI Use-Case Canvas' },
    subtitle: { de: '8 Felder · Vollständiges Template · ~15 Min', en: '8 fields · Complete template · ~15 min' },
    icon: '□',
    href: '/canvas',
    duration: '15 Min',
    requiredTier: 'free',
    description: {
      de: 'Strukturiertes Canvas-Template für neue AI-Use-Cases: Problem, Lösung, Datenquellen, Stakeholder, KPIs, Risiken, Architektur und nächste Schritte.',
      en: 'Structured canvas template for new AI use cases: problem, solution, data sources, stakeholders, KPIs, risks, architecture and next steps.',
    },
  },
  {
    id: 'usecase',
    title: { de: 'Use-Case Scoring', en: 'Use-Case Scoring' },
    subtitle: { de: '5 Kriterien · Portfolio-Matrix · ~5 Min', en: '5 criteria · Portfolio matrix · ~5 min' },
    icon: '◐',
    href: '/usecase',
    duration: '5 Min',
    requiredTier: 'free',
    description: {
      de: 'Priorisieren Sie AI-Use-Cases mit 5 gewichteten Kriterien: Business Value, Umsetzbarkeit, Datenqualität, Risiko und Time-to-Value.',
      en: 'Prioritize AI use cases using 5 weighted criteria: business value, feasibility, data quality, risk and time-to-value.',
    },
  },
  {
    id: 'governance',
    title: { de: 'Governance-Check', en: 'Governance Check' },
    subtitle: { de: 'DSGVO · EU AI Act · ~3 Min', en: 'GDPR · EU AI Act · ~3 min' },
    icon: '⬣',
    href: '/governance',
    duration: '3 Min',
    requiredTier: 'free',
    description: {
      de: 'Interaktiver Entscheidungsbaum: Use Case → Freigabe. Prüft DSGVO-Anforderungen, EU AI Act Risikoklasse, Human-in-the-Loop und Monitoring.',
      en: 'Interactive decision tree: use case → approval. Checks GDPR requirements, EU AI Act risk class, human-in-the-loop and monitoring.',
    },
  },
  {
    id: 'roadmap',
    title: { de: 'Roadmap-Generator', en: 'Roadmap Generator' },
    subtitle: { de: '3 Phasen · Archetyp-spezifisch · ~2 Min', en: '3 phases · Archetype-specific · ~2 min' },
    icon: '▷',
    href: '/roadmap',
    duration: '2 Min',
    requiredTier: 'free',
    description: {
      de: 'Ihr AI-Umsetzungsplan in 3 Phasen (0–3 / 3–12 / 12+ Monate), automatisch angepasst an Ihren Unternehmensarchetyp mit KPIs und Budgetorientierung.',
      en: 'Your AI implementation plan in 3 phases (0–3 / 3–12 / 12+ months), automatically tailored to your company archetype with KPIs and budget guidance.',
    },
  },
  {
    id: 'compliance',
    title: { de: 'Compliance Center', en: 'Compliance Center' },
    subtitle: { de: 'EU AI Act · DSGVO · Risikomatrix', en: 'EU AI Act · GDPR · Risk matrix' },
    icon: '⬡',
    href: '/compliance',
    duration: '20 Min',
    requiredTier: 'pro',
    description: {
      de: 'Zentrales Dashboard für AI-Compliance: EU AI Act Risikoklassen-Check, DSGVO-Pflichten-Checkliste, AI-Risikomatrix und Policy-Framework-Templates.',
      en: 'Central dashboard for AI compliance: EU AI Act risk class check, GDPR obligations checklist, AI risk matrix and policy framework templates.',
    },
  },
  {
    id: 'architecture',
    title: { de: 'Architektur-Generator', en: 'Architecture Generator' },
    subtitle: { de: '5-Schritt-Wizard · Referenzarchitektur', en: '5-step wizard · Reference architecture' },
    icon: '◈',
    href: '/architecture',
    duration: '10 Min',
    requiredTier: 'pro',
    description: {
      de: 'Generieren Sie eine herstellerneutrale Enterprise AI Reference Architecture basierend auf Ihrer IT-Landschaft, Use Cases und Governance-Anforderungen.',
      en: 'Generate a vendor-neutral Enterprise AI Reference Architecture based on your IT landscape, use cases and governance requirements.',
    },
  },
]

export const FREE_MODULES = MODULES.filter(m => m.requiredTier === 'free')
export const PRO_MODULES = MODULES.filter(m => m.requiredTier === 'pro')

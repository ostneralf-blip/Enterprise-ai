export type SummaryUrgency = 'critical' | 'recommended' | 'next'

export type SummaryAction = {
  title: string
  description: string
  href: string
  urgency: SummaryUrgency
}

export type SummaryBlock = {
  headline: string
  subtext: string
  actions: SummaryAction[]
}

const ARCHETYPE_HEADLINE: Record<string, string> = {
  starter:     'Einstiegsphase — Quick Wins identifizieren',
  scaler:      'Ausbauphase — KI-Potenzial systematisch erschließen',
  transformer: 'Transformationsphase — skalierbare KI-Architektur aufbauen',
}

const ARCHETYPE_SUBTEXT: Record<string, string> = {
  starter:     'Ihr Reifegrad ist noch im Aufbau. Starten Sie mit ein bis zwei Use Cases mit hohem Nutzen und geringem Risiko.',
  scaler:      'Sie haben eine solide Basis. Jetzt geht es darum, Use Cases zu skalieren und in Governance-Strukturen einzubetten.',
  transformer: 'Sie sind bereit für komplexe, unternehmensweite KI-Initiativen. Priorisieren Sie End-to-End-Automatisierung und Compliance-Konformität.',
}

export function generateSummaryBlock(p: {
  archetype: string | null
  totalScore: number | null
  usecaseCount: number
  topUsecase: { name: string; weighted_score: number } | null
  governanceResult: string | null
  governanceUseCaseName: string | null
  complianceRisk: string | null
  completedModules: number
  totalModules: number
}): SummaryBlock {
  const actions: SummaryAction[] = []

  // Critical: Compliance verboten oder Hochrisiko
  if (p.complianceRisk === 'prohibited') {
    actions.push({
      title: 'EU AI Act: Verbotene KI-Anwendung erkannt',
      description: 'Der Compliance-Check hat einen Use-Case-Typ identifiziert, der laut EU AI Act verboten ist. Eine Umsetzung ist rechtlich nicht zulässig.',
      href: '/compliance',
      urgency: 'critical',
    })
  } else if (p.complianceRisk === 'high') {
    actions.push({
      title: 'EU AI Act Hochrisiko — Governance-Gates einplanen',
      description: 'Ihr Use-Case-Typ fällt in die Hochrisiko-Kategorie. Vor dem Deployment müssen Governance-Anforderungen und Transparenzpflichten erfüllt sein.',
      href: '/governance',
      urgency: 'critical',
    })
  }

  // Critical: Governance gestoppt
  if (p.governanceResult === 'stop_dsgvo' || p.governanceResult === 'stop_risk') {
    const ucName = p.governanceUseCaseName ? `„${p.governanceUseCaseName}"` : 'ein Use Case'
    actions.push({
      title: `Governance-Stop: ${ucName} nicht freigegeben`,
      description: p.governanceResult === 'stop_dsgvo'
        ? 'DSGVO-Anforderungen sind nicht erfüllt. Klären Sie Datenschutzmaßnahmen bevor Sie fortfahren.'
        : 'Das Risikoprofil ist zu hoch für ein Go-Live. Beheben Sie die kritischen Gates.',
      href: '/governance',
      urgency: 'critical',
    })
  }

  // Recommended: Kein Assessment → starten
  if (!p.archetype) {
    actions.push({
      title: 'AI-Readiness Assessment durchführen',
      description: 'Bestimmen Sie Ihren Reifegrad und Archetyp — er steuert alle weiteren Empfehlungen im Navigator.',
      href: '/assessment',
      urgency: 'recommended',
    })
  }

  // Recommended: Assessment vorhanden, aber keine Use Cases
  if (p.archetype && p.usecaseCount === 0) {
    actions.push({
      title: 'Ersten Use Case erfassen und bewerten',
      description: 'Sie kennen Ihren Archetyp — jetzt priorisieren Sie Ihren ersten KI-Use-Case anhand von 5 Kriterien.',
      href: '/usecase',
      urgency: 'recommended',
    })
  }

  // Recommended: Use Cases vorhanden, Governance aber noch ausstehend oder nur "improve"
  if (p.usecaseCount > 0 && !p.governanceResult) {
    actions.push({
      title: 'Governance-Check für Top-Use-Case durchführen',
      description: p.topUsecase
        ? `„${p.topUsecase.name}" (Score ${p.topUsecase.weighted_score.toFixed(1)}) ist Ihr Top-Kandidat — prüfen Sie ihn auf ethische und rechtliche Compliance.`
        : 'Prüfen Sie Ihren priorisierten Use Case auf Compliance und Risiko vor dem Deployment.',
      href: '/governance',
      urgency: 'recommended',
    })
  }

  // Next: Compliance noch nicht durchgeführt (kein prohibit/high, aber auch kein Risk-Check gemacht)
  if (!p.complianceRisk && p.usecaseCount > 0) {
    actions.push({
      title: 'Compliance Center: EU AI Act und DSGVO prüfen',
      description: 'Bestimmen Sie die Risikoklasse Ihrer KI-Anwendung und prüfen Sie DSGVO-Pflichten.',
      href: '/compliance',
      urgency: 'next',
    })
  }

  // Next: Architektur fehlt noch
  if (p.archetype && p.usecaseCount > 0 && p.completedModules < p.totalModules - 1) {
    actions.push({
      title: 'Enterprise AI Architektur generieren',
      description: 'Übersetzen Sie Ihren Use Case in eine herstellerneutrale Referenzarchitektur — mit Komponenten-Empfehlungen und Compliance-Voreinstellung.',
      href: '/architecture',
      urgency: 'next',
    })
  }

  // Top 3: critical first, then recommended, then next
  const sorted = actions.sort((a, b) => {
    const order = { critical: 0, recommended: 1, next: 2 }
    return order[a.urgency] - order[b.urgency]
  }).slice(0, 3)

  const headline = p.archetype
    ? ARCHETYPE_HEADLINE[p.archetype] ?? 'Ihr AI-Navigations-Überblick'
    : 'Noch kein Überblick verfügbar'

  const subtext = p.archetype
    ? ARCHETYPE_SUBTEXT[p.archetype] ?? ''
    : `${p.completedModules} von ${p.totalModules} Modulen abgeschlossen. Starten Sie mit dem Assessment um personalisierte Empfehlungen zu erhalten.`

  return { headline, subtext, actions: sorted }
}

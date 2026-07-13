import type { LocaleString } from '@/lib/utils/locale-data'

export type VerdictLevel = 'unlawful' | 'stop' | 'conditional' | 'approved'
export type AnswerWeight = 'red' | 'yellow' | 'green'

export interface GateOption {
  id: string
  label: LocaleString
  description: LocaleString
  weight: AnswerWeight
  recommendation?: LocaleString
}

export interface Gate {
  id: string
  step: number
  question: LocaleString
  context: LocaleString
  options: GateOption[]
}

export type GateAnswers = Record<string, string>

export interface VerdictResult {
  level: VerdictLevel
  title: LocaleString
  summary: LocaleString
  color: string
  icon: string
}

export interface GateReview {
  gate: Gate
  option: GateOption
}

export const GOVERNANCE_GATES: Gate[] = [
  {
    id: 'risk_class',
    step: 1,
    question: {
      de: 'Wie klassifizieren Sie Ihr AI-System nach dem EU AI Act?',
      en: 'How do you classify your AI system under the EU AI Act?',
    },
    context: {
      de: 'Der EU AI Act (ab August 2026 vollständig in Kraft) stuft KI-Systeme in 4 Risikoklassen ein, die unterschiedliche Pflichten auslösen.',
      en: 'The EU AI Act (fully in force from August 2026) classifies AI systems into 4 risk categories, each triggering different obligations.',
    },
    options: [
      {
        id: 'unacceptable',
        label: { de: 'Unzulässig', en: 'Unacceptable' },
        description: { de: 'z. B. Social Scoring, biometrische Echtzeitüberwachung öffentlicher Räume, Manipulation von Verhalten', en: 'e.g. social scoring, real-time biometric surveillance of public spaces, manipulation of behavior' },
        weight: 'red',
        recommendation: { de: 'Dieses System fällt unter das Verbot nach Art. 5 EU AI Act. Deployment ist rechtlich nicht möglich.', en: 'This system falls under the prohibition of Art. 5 EU AI Act. Deployment is legally not possible.' },
      },
      {
        id: 'high',
        label: { de: 'Hochrisiko', en: 'High-Risk' },
        description: { de: 'z. B. HR-Entscheidungen, Kreditvergabe, medizinische Diagnose, kritische Infrastruktur, Strafverfolgung', en: 'e.g. HR decisions, credit assessment, medical diagnosis, critical infrastructure, law enforcement' },
        weight: 'yellow',
        recommendation: { de: 'Hochrisiko-Systeme erfordern Konformitätsbewertung, CE-Kennzeichnung, HRMS-Eintrag und laufendes Monitoring (Art. 9–17 EU AI Act).', en: 'High-risk systems require a conformity assessment, CE marking, HRMS entry and ongoing monitoring (Art. 9–17 EU AI Act).' },
      },
      {
        id: 'limited',
        label: { de: 'Begrenztes Risiko', en: 'Limited Risk' },
        description: { de: 'z. B. Chatbots, Emotionserkennung, KI-generierte Inhalte (Deepfakes)', en: 'e.g. chatbots, emotion recognition, AI-generated content (deepfakes)' },
        weight: 'yellow',
        recommendation: { de: 'Transparenzpflicht: Nutzer müssen informiert werden, dass sie mit einem KI-System interagieren (Art. 50 EU AI Act).', en: 'Transparency obligation: users must be informed that they are interacting with an AI system (Art. 50 EU AI Act).' },
      },
      {
        id: 'minimal',
        label: { de: 'Minimales / kein Risiko', en: 'Minimal / No Risk' },
        description: { de: 'z. B. Spam-Filter, Empfehlungssysteme, KI-Komponenten in Spielen', en: 'e.g. spam filters, recommendation systems, AI components in games' },
        weight: 'green',
      },
    ],
  },
  {
    id: 'personal_data',
    step: 2,
    question: {
      de: 'Verarbeitet das System personenbezogene oder besonders sensitive Daten?',
      en: 'Does the system process personal or particularly sensitive data?',
    },
    context: {
      de: 'Die DSGVO regelt die Verarbeitung personenbezogener Daten (Art. 4 Nr. 1). Besondere Kategorien (Art. 9) — z. B. Gesundheit, Biometrie, politische Meinung — unterliegen strengeren Regeln.',
      en: 'The GDPR governs the processing of personal data (Art. 4 No. 1). Special categories (Art. 9) — e.g. health, biometrics, political opinion — are subject to stricter rules.',
    },
    options: [
      {
        id: 'sensitive',
        label: { de: 'Ja, besonders sensitive Daten', en: 'Yes, particularly sensitive data' },
        description: { de: 'Gesundheitsdaten, biometrische Daten, politische/religiöse Überzeugungen, ethnische Herkunft', en: 'Health data, biometric data, political/religious beliefs, ethnic origin' },
        weight: 'red',
        recommendation: { de: 'Verarbeitung besonderer Kategorien erfordert explizite Einwilligung oder gesetzliche Grundlage (Art. 9 DSGVO). DPIA ist Pflicht.', en: 'Processing special categories requires explicit consent or a legal basis (Art. 9 GDPR). A DPIA is mandatory.' },
      },
      {
        id: 'personal',
        label: { de: 'Ja, allgemeine personenbezogene Daten', en: 'Yes, general personal data' },
        description: { de: 'Name, E-Mail, IP-Adresse, Nutzerverhalten, berufliche Daten', en: 'Name, email, IP address, user behavior, professional data' },
        weight: 'yellow',
        recommendation: { de: 'Rechtsgrundlage nach Art. 6 DSGVO prüfen und dokumentieren. Betroffenenrechte sicherstellen.', en: 'Check and document legal basis under Art. 6 GDPR. Ensure data subject rights are upheld.' },
      },
      {
        id: 'none',
        label: { de: 'Nein, keine personenbezogenen Daten', en: 'No, no personal data' },
        description: { de: 'Nur aggregierte, anonymisierte oder rein technische Daten', en: 'Only aggregated, anonymized or purely technical data' },
        weight: 'green',
      },
    ],
  },
  {
    id: 'legal_basis',
    step: 3,
    question: {
      de: 'Ist die Rechtsgrundlage für die Datenverarbeitung dokumentiert?',
      en: 'Is the legal basis for data processing documented?',
    },
    context: {
      de: 'Art. 6 DSGVO verlangt eine explizite Rechtsgrundlage für jede Verarbeitung personenbezogener Daten. Ohne dokumentierte Rechtsgrundlage ist der Betrieb unzulässig.',
      en: 'Art. 6 GDPR requires an explicit legal basis for every processing of personal data. Without a documented legal basis, operation is not permitted.',
    },
    options: [
      {
        id: 'documented',
        label: { de: 'Ja, vollständig dokumentiert', en: 'Yes, fully documented' },
        description: { de: 'Rechtsgrundlage im VVT eingetragen, Datenschutzhinweise aktualisiert', en: 'Legal basis recorded in RoPA, privacy notices updated' },
        weight: 'green',
      },
      {
        id: 'in_progress',
        label: { de: 'In Bearbeitung', en: 'In progress' },
        description: { de: 'Rechtsgrundlage identifiziert, Dokumentation läuft', en: 'Legal basis identified, documentation in progress' },
        weight: 'yellow',
        recommendation: { de: 'Dokumentation vor Go-Live abschließen. VVT-Eintrag und Datenschutzhinweise aktualisieren.', en: 'Complete documentation before go-live. Update RoPA entry and privacy notices.' },
      },
      {
        id: 'missing',
        label: { de: 'Nein / nicht relevant (keine personenbezogenen Daten)', en: 'No / not applicable (no personal data)' },
        description: { de: 'Keine Verarbeitung personenbezogener Daten oder Dokumentation fehlt noch', en: 'No processing of personal data or documentation still missing' },
        weight: 'yellow',
        recommendation: { de: 'Falls personenbezogene Daten verarbeitet werden: Rechtsgrundlage vor Deployment dokumentieren.', en: 'If personal data is processed: document the legal basis before deployment.' },
      },
    ],
  },
  {
    id: 'human_impact',
    step: 4,
    question: {
      de: 'Hat das System direkten Einfluss auf Entscheidungen, die natürliche Personen betreffen?',
      en: 'Does the system directly influence decisions affecting natural persons?',
    },
    context: {
      de: 'Vollautomatisierte Entscheidungen mit wesentlicher Auswirkung auf Personen unterliegen Art. 22 DSGVO und erfordern besondere Schutzmaßnahmen.',
      en: 'Fully automated decisions with significant impact on persons are subject to Art. 22 GDPR and require special safeguards.',
    },
    options: [
      {
        id: 'autonomous',
        label: { de: 'Ja, das System entscheidet autonom', en: 'Yes, the system decides autonomously' },
        description: { de: 'Keine manuelle Prüfung — z. B. automatische Kreditablehnung, Stellenauswahl', en: 'No manual review — e.g. automatic credit rejection, candidate selection' },
        weight: 'red',
        recommendation: { de: 'Vollautomatisierte Entscheidungen mit wesentlicher Wirkung erfordern nach Art. 22 DSGVO das Recht auf menschliche Überprüfung. Prozess anpassen.', en: 'Fully automated decisions with significant effect require the right to human review under Art. 22 GDPR. Adapt the process.' },
      },
      {
        id: 'support',
        label: { de: 'Ja, als Entscheidungsunterstützung', en: 'Yes, as decision support' },
        description: { de: 'Mensch trifft finale Entscheidung, KI liefert Empfehlung/Score', en: 'Human makes the final decision, AI provides recommendation/score' },
        weight: 'yellow',
        recommendation: { de: 'Sicherstellen, dass die menschliche Entscheidungskompetenz nicht de-facto durch KI-Outputs ausgehöhlt wird (Automation Bias).', en: 'Ensure that human decision-making authority is not de-facto undermined by AI outputs (automation bias).' },
      },
      {
        id: 'no_impact',
        label: { de: 'Nein, keine personenbezogenen Entscheidungen', en: 'No, no personal decisions' },
        description: { de: 'Prozessoptimierung, rein technische Automatisierung, interne Daten', en: 'Process optimization, purely technical automation, internal data' },
        weight: 'green',
      },
    ],
  },
  {
    id: 'human_oversight',
    step: 5,
    question: {
      de: 'Ist eine menschliche Aufsicht (Human-in-the-Loop) im Prozess verankert?',
      en: 'Is human oversight (Human-in-the-Loop) anchored in the process?',
    },
    context: {
      de: 'Der EU AI Act fordert für Hochrisiko-Systeme effektive menschliche Aufsicht (Art. 14). Auch für andere Systeme ist Oversight eine Best Practice für sichere KI.',
      en: 'The EU AI Act requires effective human oversight for high-risk systems (Art. 14). Oversight is also a best practice for safe AI in other systems.',
    },
    options: [
      {
        id: 'always',
        label: { de: 'Ja, bei jeder relevanten Ausgabe', en: 'Yes, for every relevant output' },
        description: { de: 'Menschliche Prüfung ist fest im Prozess verankert', en: 'Human review is firmly embedded in the process' },
        weight: 'green',
      },
      {
        id: 'risk_cases',
        label: { de: 'Ja, bei risikoreichen oder unklaren Fällen', en: 'Yes, in high-risk or unclear cases' },
        description: { de: 'Schwellenwert-basiertes Eskalationsmodell vorhanden', en: 'Threshold-based escalation model in place' },
        weight: 'yellow',
        recommendation: { de: 'Eskalationsschwellen dokumentieren und regelmäßig auf Wirksamkeit prüfen.', en: 'Document escalation thresholds and regularly review their effectiveness.' },
      },
      {
        id: 'none',
        label: { de: 'Nein, vollautomatisch ohne Oversight', en: 'No, fully automated without oversight' },
        description: { de: 'Kein menschlicher Review-Schritt vorgesehen', en: 'No human review step planned' },
        weight: 'red',
        recommendation: { de: 'Für Hochrisiko-Systeme ist Oversight nach Art. 14 EU AI Act Pflicht. Human-in-the-Loop einplanen.', en: 'For high-risk systems, oversight is mandatory under Art. 14 EU AI Act. Plan for Human-in-the-Loop.' },
      },
    ],
  },
  {
    id: 'documentation',
    step: 6,
    question: {
      de: 'Liegt technische Dokumentation und eine Risikobewertung vor?',
      en: 'Is technical documentation and a risk assessment in place?',
    },
    context: {
      de: 'Hochrisiko-Systeme brauchen technische Dokumentation nach Anhang IV EU AI Act. Für alle Systeme ist eine Risikobewertung gute Praxis und schützt vor Haftung.',
      en: 'High-risk systems require technical documentation per Annex IV EU AI Act. For all systems, a risk assessment is good practice and protects against liability.',
    },
    options: [
      {
        id: 'complete',
        label: { de: 'Vollständig — Doku und Risikobewertung abgeschlossen', en: 'Complete — documentation and risk assessment finished' },
        description: { de: 'Systemkarte, Datenherkunft, Modellbeschreibung, Risiken dokumentiert', en: 'System card, data provenance, model description, risks documented' },
        weight: 'green',
      },
      {
        id: 'partial',
        label: { de: 'Teilweise vorhanden', en: 'Partially in place' },
        description: { de: 'Teile der Dokumentation fehlen noch oder sind veraltet', en: 'Parts of the documentation are still missing or outdated' },
        weight: 'yellow',
        recommendation: { de: 'Dokumentationslücken vor Deployment schließen. Für Hochrisiko-Systeme ist vollständige Doku nach Anhang IV EU AI Act verpflichtend.', en: 'Close documentation gaps before deployment. For high-risk systems, full documentation per Annex IV EU AI Act is mandatory.' },
      },
      {
        id: 'missing',
        label: { de: 'Nicht vorhanden', en: 'Not in place' },
        description: { de: 'Keine technische Dokumentation oder Risikobewertung', en: 'No technical documentation or risk assessment' },
        weight: 'red',
        recommendation: { de: 'Technische Dokumentation und Risikobewertung erstellen. Ohne Dokumentation ist Compliance nicht nachweisbar.', en: 'Create technical documentation and risk assessment. Without documentation, compliance cannot be demonstrated.' },
      },
    ],
  },
]

export function calculateVerdict(answers: GateAnswers): VerdictResult {
  const riskClassAnswer = answers['risk_class']

  if (riskClassAnswer === 'unacceptable') {
    return {
      level: 'unlawful',
      title: { de: 'Deployment unzulässig', en: 'Deployment Not Permitted' },
      summary: { de: 'Das System fällt unter das Verbot nach Art. 5 EU AI Act. Ein Deployment ist rechtlich nicht möglich.', en: 'The system falls under the prohibition of Art. 5 EU AI Act. Deployment is legally not possible.' },
      color: 'red',
      icon: '⛔',
    }
  }

  let reds = 0
  let yellows = 0

  for (const gate of GOVERNANCE_GATES) {
    const answerId = answers[gate.id]
    if (!answerId) continue
    const option = gate.options.find(o => o.id === answerId)
    if (!option) continue
    if (option.weight === 'red') reds++
    if (option.weight === 'yellow') yellows++
  }

  if (reds >= 3) {
    return {
      level: 'stop',
      title: { de: 'Deployment nicht empfohlen', en: 'Deployment Not Recommended' },
      summary: { de: 'Mehrere kritische Governance-Anforderungen sind nicht erfüllt. Vor Deployment sind umfangreiche Maßnahmen erforderlich.', en: 'Several critical governance requirements are not met. Extensive measures are required before deployment.' },
      color: 'red',
      icon: '🔴',
    }
  }

  if (reds >= 1 || yellows >= 4) {
    return {
      level: 'conditional',
      title: { de: 'Bedingtes Deployment', en: 'Conditional Deployment' },
      summary: { de: 'Deployment ist möglich, aber es bestehen offene Punkte, die vor oder parallel zum Go-Live adressiert werden müssen.', en: 'Deployment is possible, but there are open items that must be addressed before or in parallel with go-live.' },
      color: 'yellow',
      icon: '🟡',
    }
  }

  return {
    level: 'approved',
    title: { de: 'Freigabe empfohlen', en: 'Approval Recommended' },
    summary: { de: 'Alle wesentlichen Governance-Anforderungen sind erfüllt. Deployment kann unter laufendem Monitoring stattfinden.', en: 'All essential governance requirements are met. Deployment can proceed under ongoing monitoring.' },
    color: 'green',
    icon: '🟢',
  }
}

export function getGateReviews(answers: GateAnswers): GateReview[] {
  return GOVERNANCE_GATES.map(gate => {
    const answerId = answers[gate.id]
    const option = gate.options.find(o => o.id === answerId) ?? gate.options[0]
    return { gate, option }
  })
}

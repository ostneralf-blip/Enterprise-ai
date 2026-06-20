export type VerdictLevel = 'unlawful' | 'stop' | 'conditional' | 'approved'
export type AnswerWeight = 'red' | 'yellow' | 'green'

export interface GateOption {
  id: string
  label: string
  description: string
  weight: AnswerWeight
  recommendation?: string
}

export interface Gate {
  id: string
  step: number
  question: string
  context: string
  options: GateOption[]
}

export type GateAnswers = Record<string, string>

export interface VerdictResult {
  level: VerdictLevel
  title: string
  summary: string
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
    question: 'Wie klassifizierst du dein AI-System nach dem EU AI Act?',
    context: 'Der EU AI Act (ab August 2026 vollständig in Kraft) stuft KI-Systeme in 4 Risikoklassen ein, die unterschiedliche Pflichten auslösen.',
    options: [
      {
        id: 'unacceptable',
        label: 'Unzulässig',
        description: 'z. B. Social Scoring, biometrische Echtzeitüberwachung öffentlicher Räume, Manipulation von Verhalten',
        weight: 'red',
        recommendation: 'Dieses System fällt unter das Verbot nach Art. 5 EU AI Act. Deployment ist rechtlich nicht möglich.',
      },
      {
        id: 'high',
        label: 'Hochrisiko',
        description: 'z. B. HR-Entscheidungen, Kreditvergabe, medizinische Diagnose, kritische Infrastruktur, Strafverfolgung',
        weight: 'yellow',
        recommendation: 'Hochrisiko-Systeme erfordern Konformitätsbewertung, CE-Kennzeichnung, HRMS-Eintrag und laufendes Monitoring (Art. 9–17 EU AI Act).',
      },
      {
        id: 'limited',
        label: 'Begrenztes Risiko',
        description: 'z. B. Chatbots, Emotionserkennung, KI-generierte Inhalte (Deepfakes)',
        weight: 'yellow',
        recommendation: 'Transparenzpflicht: Nutzer müssen informiert werden, dass sie mit einem KI-System interagieren (Art. 50 EU AI Act).',
      },
      {
        id: 'minimal',
        label: 'Minimales / kein Risiko',
        description: 'z. B. Spam-Filter, Empfehlungssysteme, KI-Komponenten in Spielen',
        weight: 'green',
      },
    ],
  },
  {
    id: 'personal_data',
    step: 2,
    question: 'Verarbeitet das System personenbezogene oder besonders sensitive Daten?',
    context: 'Die DSGVO regelt die Verarbeitung personenbezogener Daten (Art. 4 Nr. 1). Besondere Kategorien (Art. 9) — z. B. Gesundheit, Biometrie, politische Meinung — unterliegen strengeren Regeln.',
    options: [
      {
        id: 'sensitive',
        label: 'Ja, besonders sensitive Daten',
        description: 'Gesundheitsdaten, biometrische Daten, politische/religiöse Überzeugungen, ethnische Herkunft',
        weight: 'red',
        recommendation: 'Verarbeitung besonderer Kategorien erfordert explizite Einwilligung oder gesetzliche Grundlage (Art. 9 DSGVO). DPIA ist Pflicht.',
      },
      {
        id: 'personal',
        label: 'Ja, allgemeine personenbezogene Daten',
        description: 'Name, E-Mail, IP-Adresse, Nutzerverhalten, berufliche Daten',
        weight: 'yellow',
        recommendation: 'Rechtsgrundlage nach Art. 6 DSGVO prüfen und dokumentieren. Betroffenenrechte sicherstellen.',
      },
      {
        id: 'none',
        label: 'Nein, keine personenbezogenen Daten',
        description: 'Nur aggregierte, anonymisierte oder rein technische Daten',
        weight: 'green',
      },
    ],
  },
  {
    id: 'legal_basis',
    step: 3,
    question: 'Ist die Rechtsgrundlage für die Datenverarbeitung dokumentiert?',
    context: 'Art. 6 DSGVO verlangt eine explizite Rechtsgrundlage für jede Verarbeitung personenbezogener Daten. Ohne dokumentierte Rechtsgrundlage ist der Betrieb unzulässig.',
    options: [
      {
        id: 'documented',
        label: 'Ja, vollständig dokumentiert',
        description: 'Rechtsgrundlage im VVT eingetragen, Datenschutzhinweise aktualisiert',
        weight: 'green',
      },
      {
        id: 'in_progress',
        label: 'In Bearbeitung',
        description: 'Rechtsgrundlage identifiziert, Dokumentation läuft',
        weight: 'yellow',
        recommendation: 'Dokumentation vor Go-Live abschließen. VVT-Eintrag und Datenschutzhinweise aktualisieren.',
      },
      {
        id: 'missing',
        label: 'Nein / nicht relevant (keine personenbezogenen Daten)',
        description: 'Keine Verarbeitung personenbezogener Daten oder Dokumentation fehlt noch',
        weight: 'yellow',
        recommendation: 'Falls personenbezogene Daten verarbeitet werden: Rechtsgrundlage vor Deployment dokumentieren.',
      },
    ],
  },
  {
    id: 'human_impact',
    step: 4,
    question: 'Hat das System direkten Einfluss auf Entscheidungen, die natürliche Personen betreffen?',
    context: 'Vollautomatisierte Entscheidungen mit wesentlicher Auswirkung auf Personen unterliegen Art. 22 DSGVO und erfordern besondere Schutzmaßnahmen.',
    options: [
      {
        id: 'autonomous',
        label: 'Ja, das System entscheidet autonom',
        description: 'Keine manuelle Prüfung — z. B. automatische Kreditablehnung, Stellenauswahl',
        weight: 'red',
        recommendation: 'Vollautomatisierte Entscheidungen mit wesentlicher Wirkung erfordern nach Art. 22 DSGVO das Recht auf menschliche Überprüfung. Prozess anpassen.',
      },
      {
        id: 'support',
        label: 'Ja, als Entscheidungsunterstützung',
        description: 'Mensch trifft finale Entscheidung, KI liefert Empfehlung/Score',
        weight: 'yellow',
        recommendation: 'Sicherstellen, dass die menschliche Entscheidungskompetenz nicht de-facto durch KI-Outputs ausgehöhlt wird (Automation Bias).',
      },
      {
        id: 'no_impact',
        label: 'Nein, keine personenbezogenen Entscheidungen',
        description: 'Prozessoptimierung, rein technische Automatisierung, interne Daten',
        weight: 'green',
      },
    ],
  },
  {
    id: 'human_oversight',
    step: 5,
    question: 'Ist eine menschliche Aufsicht (Human-in-the-Loop) im Prozess verankert?',
    context: 'Der EU AI Act fordert für Hochrisiko-Systeme effektive menschliche Aufsicht (Art. 14). Auch für andere Systeme ist Oversight eine Best Practice für sichere KI.',
    options: [
      {
        id: 'always',
        label: 'Ja, bei jeder relevanten Ausgabe',
        description: 'Menschliche Prüfung ist fest im Prozess verankert',
        weight: 'green',
      },
      {
        id: 'risk_cases',
        label: 'Ja, bei risikoreichen oder unklaren Fällen',
        description: 'Schwellenwert-basiertes Eskalationsmodell vorhanden',
        weight: 'yellow',
        recommendation: 'Eskalationsschwellen dokumentieren und regelmäßig auf Wirksamkeit prüfen.',
      },
      {
        id: 'none',
        label: 'Nein, vollautomatisch ohne Oversight',
        description: 'Kein menschlicher Review-Schritt vorgesehen',
        weight: 'red',
        recommendation: 'Für Hochrisiko-Systeme ist Oversight nach Art. 14 EU AI Act Pflicht. Human-in-the-Loop einplanen.',
      },
    ],
  },
  {
    id: 'documentation',
    step: 6,
    question: 'Liegt technische Dokumentation und eine Risikobewertung vor?',
    context: 'Hochrisiko-Systeme brauchen technische Dokumentation nach Anhang IV EU AI Act. Für alle Systeme ist eine Risikobewertung gute Praxis und schützt vor Haftung.',
    options: [
      {
        id: 'complete',
        label: 'Vollständig — Doku und Risikobewertung abgeschlossen',
        description: 'Systemkarte, Datenherkunft, Modellbeschreibung, Risiken dokumentiert',
        weight: 'green',
      },
      {
        id: 'partial',
        label: 'Teilweise vorhanden',
        description: 'Teile der Dokumentation fehlen noch oder sind veraltet',
        weight: 'yellow',
        recommendation: 'Dokumentationslücken vor Deployment schließen. Für Hochrisiko-Systeme ist vollständige Doku nach Anhang IV EU AI Act verpflichtend.',
      },
      {
        id: 'missing',
        label: 'Nicht vorhanden',
        description: 'Keine technische Dokumentation oder Risikobewertung',
        weight: 'red',
        recommendation: 'Technische Dokumentation und Risikobewertung erstellen. Ohne Dokumentation ist Compliance nicht nachweisbar.',
      },
    ],
  },
]

export function calculateVerdict(answers: GateAnswers): VerdictResult {
  const riskClassAnswer = answers['risk_class']

  if (riskClassAnswer === 'unacceptable') {
    return {
      level: 'unlawful',
      title: 'Deployment unzulässig',
      summary: 'Das System fällt unter das Verbot nach Art. 5 EU AI Act. Ein Deployment ist rechtlich nicht möglich.',
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
      title: 'Deployment nicht empfohlen',
      summary: 'Mehrere kritische Governance-Anforderungen sind nicht erfüllt. Vor Deployment sind umfangreiche Maßnahmen erforderlich.',
      color: 'red',
      icon: '🔴',
    }
  }

  if (reds >= 1 || yellows >= 4) {
    return {
      level: 'conditional',
      title: 'Bedingtes Deployment',
      summary: 'Deployment ist möglich, aber es bestehen offene Punkte, die vor oder parallel zum Go-Live adressiert werden müssen.',
      color: 'yellow',
      icon: '🟡',
    }
  }

  return {
    level: 'approved',
    title: 'Freigabe empfohlen',
    summary: 'Alle wesentlichen Governance-Anforderungen sind erfüllt. Deployment kann unter laufendem Monitoring stattfinden.',
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

// ─── TYPEN ────────────────────────────────────────────────────────────────────

export type CheckStatus = 'pending' | 'compliant' | 'non_compliant' | 'partial'
export type Regulation = 'eu_ai_act' | 'dsgvo' | 'risk_matrix'
export type EuAiActRiskClass = 'prohibited' | 'high' | 'limited' | 'minimal'

export interface ChecklistItem {
  id: string          // wird als check_type in DB gespeichert
  article?: string
  label: string
  description?: string
  relevance?: string  // warum relevant für AI
  category?: string   // für Regelwerke ohne Artikel-Referenz (ISO, NIS-2 etc.)
}

export interface CheckRow {
  regulation: string
  check_type: string
  status: CheckStatus
  notes: string | null
  completed_at: string | null
  updated_at?: string | null
}

// ─── EU AI ACT — RISIKOKLASSEN (Art. 5, 6, 50, Minimal) ─────────────────────

export interface EuAiActRiskClassDef {
  id: EuAiActRiskClass
  title: string
  badge: string
  articleRef: string
  summary: string
  color: { bg: string; border: string; badge: string; title: string }
  examples: string[]
}

export const EU_AI_ACT_RISK_CLASSES: EuAiActRiskClassDef[] = [
  {
    id: 'prohibited',
    title: 'Verboten',
    badge: 'Keine Ausnahmen',
    articleRef: 'Art. 5 EU AI Act',
    summary: 'Systeme dieser Kategorie dürfen in der EU nicht eingesetzt werden. Kein Übergangsrecht, keine Ausnahmen.',
    color: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', title: 'text-red-800' },
    examples: [
      'Social Scoring durch staatliche oder behördliche Stellen',
      'Biometrische Echtzeit-Fernidentifikation in öffentlichen Räumen (mit engen Ausnahmen)',
      'Manipulation durch unterschwellige Techniken oder Ausnutzung von Schwachstellen',
      'Predictive Policing auf Basis persönlicher Merkmale',
      'Emotionserkennung am Arbeitsplatz und in Bildungseinrichtungen',
      'Anlegen biometrischer Datenbanken durch Scraping',
    ],
  },
  {
    id: 'high',
    title: 'Hochrisiko',
    badge: 'Umfangreiche Pflichten',
    articleRef: 'Art. 6, Anhang III EU AI Act',
    summary: 'Einsatz nur mit vollständiger Dokumentation, Konformitätsbewertung und registriertem System. Gilt für KI mit wesentlichen Auswirkungen auf Grundrechte oder Sicherheit.',
    color: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', title: 'text-amber-800' },
    examples: [
      'HR: Einstellungen, Beförderungen, Leistungsbewertung, Entlassung (Anhang III Nr. 4)',
      'Kredit- und Bonitätsprüfung, Versicherungseinstufung (Anhang III Nr. 5)',
      'Medizinische Diagnose als Medizinprodukt (Anhang III Nr. 6)',
      'Kritische Infrastruktur (Energie, Wasser, Verkehr) (Anhang III Nr. 2)',
      'Bildung: Prüfungsautomatisierung, Zugangsentscheidungen (Anhang III Nr. 3)',
      'Strafverfolgung, Grenzkontrolle, Justiz (Anhang III Nr. 6–8)',
    ],
  },
  {
    id: 'limited',
    title: 'Begrenztes Risiko',
    badge: 'Transparenzpflichten',
    articleRef: 'Art. 50 EU AI Act',
    summary: 'Nutzer müssen wissen, dass sie mit einem KI-System interagieren. KI-generierte Inhalte sind maschinenlesbar zu kennzeichnen.',
    color: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', title: 'text-blue-800' },
    examples: [
      'Chatbots und virtuelle Assistenten mit Kundenkontakt',
      'KI-generierte Texte, Bilder, Videos (Deepfakes, synthetische Medien)',
      'Emotionserkennung (außer in verbotenen Kontexten)',
      'Biometrische Kategorisierungssysteme',
    ],
  },
  {
    id: 'minimal',
    title: 'Minimales Risiko',
    badge: 'Freiwillige Maßnahmen',
    articleRef: 'Erwägungsgrund 48 EU AI Act',
    summary: 'Keine gesetzlichen Pflichten. Freiwilliger Code of Practice und interne AI-Governance empfohlen.',
    color: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', title: 'text-emerald-800' },
    examples: [
      'Spam-Filter, Empfehlungssysteme, Suchfunktionen',
      'KI in Spielen und Unterhaltungsanwendungen',
      'Einfache Prozessautomatisierung ohne Personenbezug',
    ],
  },
]

// ─── EU AI ACT — PFLICHTEN-CHECKLISTE (nach Risikoklasse) ────────────────────

export const EU_AI_ACT_OBLIGATIONS: Record<EuAiActRiskClass, ChecklistItem[]> = {
  prohibited: [],
  minimal: [],
  limited: [
    {
      id: 'euaiact_art50_1',
      article: 'Art. 50 Abs. 1',
      label: 'Nutzer über KI-Interaktion informieren',
      description: 'Natürliche Personen müssen bei Chatbots und interaktiven KI-Systemen klar und verständlich informiert werden, dass sie mit einem KI-System interagieren.',
      relevance: 'Pflicht bei jedem KI-System mit direktem Nutzerkontakt, auch intern.',
    },
    {
      id: 'euaiact_art50_2',
      article: 'Art. 50 Abs. 2',
      label: 'KI-generierte Inhalte maschinenlesbar kennzeichnen',
      description: 'Synthetische Audio-, Bild-, Video- und Textinhalte (Deep Fakes, generierte Medien) müssen mit einem maschinenlesbaren Marker versehen werden.',
      relevance: 'Gilt für alle Systeme, die synthetische Inhalte erzeugen, unabhängig vom Verwendungszweck.',
    },
    {
      id: 'euaiact_art50_3',
      article: 'Art. 50 Abs. 3',
      label: 'Deepfakes und synthetische Medien kennzeichnen (sichtbar)',
      description: 'Erzeugte Bilder, Videos oder Audios, die reale Personen, Orte oder Ereignisse täuschend nachahmen, müssen für Empfänger erkennbar als KI-generiert markiert sein.',
      relevance: 'Auch relevant bei internen Kommunikationsmaterialien oder Marketinginhalten.',
    },
  ],
  high: [
    {
      id: 'euaiact_art9',
      article: 'Art. 9',
      label: 'Risikomanagementsystem implementieren',
      description: 'Fortlaufendes Risikomanagementsystem für den gesamten Lebenszyklus des Hochrisiko-KI-Systems einrichten. Bekannte und vorhersehbare Risiken identifizieren, analysieren und mitigieren.',
      relevance: 'Grundvoraussetzung: ohne Art. 9 sind alle weiteren Hochrisiko-Pflichten nicht erfüllbar.',
    },
    {
      id: 'euaiact_art10',
      article: 'Art. 10',
      label: 'Daten-Governance: Trainings- und Validierungsdaten dokumentieren',
      description: 'Datenverwaltungspraktiken festlegen: Herkunft, Erhebungsmethoden, vorgesehene Zwecke, bekannte Lücken. Trainingsdaten müssen hinsichtlich Bias geprüft sein.',
      relevance: 'Betrifft alle genutzten oder selbst entwickelten ML-Modelle für Hochrisiko-Anwendungen.',
    },
    {
      id: 'euaiact_art11',
      article: 'Art. 11 + Anhang IV',
      label: 'Technische Dokumentation nach Anhang IV erstellen',
      description: 'Vollständige technische Dokumentation vor Inbetriebnahme erstellen und aktuell halten: Zweck, Design, Algorithmen, Daten, Testergebnisse, Risikomaßnahmen.',
      relevance: 'Muss für Marktüberwachungsbehörden auf Anfrage bereitstehen.',
    },
    {
      id: 'euaiact_art12',
      article: 'Art. 12',
      label: 'Automatische Ereignisprotokollierung (Logging) einrichten',
      description: 'Hochrisiko-KI-Systeme müssen automatisch Ereignisse protokollieren (Log-Level), die Rückverfolgbarkeit über den Lebenszyklus ermöglichen.',
      relevance: 'Kritisch für Post-Incident-Analysen und Konformitätsnachweise.',
    },
    {
      id: 'euaiact_art13',
      article: 'Art. 13',
      label: 'Transparenz und Nutzerinformation sicherstellen',
      description: 'Nutzende von Hochrisiko-KI-Systemen müssen ausreichende Informationen erhalten: Zweck, Fähigkeiten und Grenzen, Überwachungshinweise.',
      relevance: 'Betrifft die Gebrauchsanweisung und Nutzer-Onboarding-Dokumentation.',
    },
    {
      id: 'euaiact_art14',
      article: 'Art. 14',
      label: 'Human Oversight verankern',
      description: 'Das System muss so gestaltet sein, dass natürliche Personen Entscheidungen wirksam überwachen, verstehen, eingreifen, stoppen oder überstimmen können.',
      relevance: 'Human-in-the-Loop ist Pflicht, keine Option.',
    },
    {
      id: 'euaiact_art15',
      article: 'Art. 15',
      label: 'Genauigkeit, Robustheit und Cybersicherheit gewährleisten',
      description: 'System muss ausreichende Genauigkeit, Konsistenz und Widerstandsfähigkeit gegen Angriffe (Adversarial Inputs, Datenmanipulation) während des gesamten Lebenszyklus aufweisen.',
      relevance: 'Regelmäßige Tests und Monitoring-Prozesse sind erforderlich.',
    },
    {
      id: 'euaiact_art43',
      article: 'Art. 43',
      label: 'Konformitätsbewertung durchführen',
      description: 'Vor Inbetriebnahme: interne Kontrolle (für die meisten Systeme) oder Prüfung durch benannte Stelle (für besonders kritische Systeme wie biometrische Identifikation).',
      relevance: 'Voraussetzung für CE-Kennzeichnung und Marktzulassung.',
    },
    {
      id: 'euaiact_art46',
      article: 'Art. 46',
      label: 'CE-Kennzeichnung anbringen',
      description: 'Nach bestandener Konformitätsbewertung muss das KI-System mit der CE-Kennzeichnung versehen werden.',
      relevance: 'Rechtliche Voraussetzung für das Inverkehrbringen in der EU.',
    },
    {
      id: 'euaiact_art71',
      article: 'Art. 71',
      label: 'System in EU-AI-Datenbank registrieren',
      description: 'Betreiber von Hochrisiko-KI-Systemen müssen diese vor Inbetriebnahme in der öffentlichen EU-KI-Datenbank (ai-act.eu) registrieren.',
      relevance: 'Ausnahme: Behörden in den Bereichen Strafverfolgung und Migration (nicht-öffentliche Datenbank).',
    },
    {
      id: 'euaiact_art72',
      article: 'Art. 72',
      label: 'Post-Market Monitoring einrichten',
      description: 'Fortlaufendes System zur Überwachung der Leistung nach Inbetriebnahme. Wesentliche Änderungen melden; Zwischenfälle (serious incidents) der Marktüberwachungsbehörde berichten.',
      relevance: 'Gilt auch für eingesetzte Drittanbieter-Modelle, wenn diese für Hochrisiko-Zwecke genutzt werden.',
    },
  ],
}

// ─── DSGVO — CHECKLISTE ──────────────────────────────────────────────────────

export const DSGVO_CHECKLIST: ChecklistItem[] = [
  {
    id: 'dsgvo_art6',
    article: 'Art. 6 DSGVO',
    label: 'Rechtsgrundlage für Datenverarbeitung dokumentiert',
    description: 'Einwilligung, Vertrag, rechtliche Verpflichtung, berechtigte Interessen oder lebenswichtige Interessen — schriftlich festgehalten und im VVT hinterlegt.',
    relevance: 'KI-Systeme verarbeiten oft große Datenmengen zu neuen Zwecken — Zweckbindung und Rechtsgrundlage müssen explizit für den KI-Use-Case gelten.',
  },
  {
    id: 'dsgvo_art9',
    article: 'Art. 9 DSGVO',
    label: 'Besondere Datenkategorien geprüft und dokumentiert',
    description: 'Gesundheitsdaten, biometrische Daten, ethnische Herkunft, politische Meinungen, Gewerkschaftszugehörigkeit, religiöse Überzeugungen — erhöhte Anforderungen gelten.',
    relevance: 'Viele ML-Modelle erkennen oder inferieren besondere Datenkategorien indirekt (z. B. Gesundheitsstatus aus Kaufverhalten).',
  },
  {
    id: 'dsgvo_art13',
    article: 'Art. 13 / 14 DSGVO',
    label: 'Informationspflichten erfüllt (Datenschutzhinweis aktuell)',
    description: 'Betroffene Personen müssen über Zweck, Rechtsgrundlage, Empfänger, Speicherdauer und ihre Rechte informiert werden — bei Direkterhebung (Art. 13) oder Drittquelle (Art. 14).',
    relevance: 'Datenschutzhinweis muss explizit auf KI-Verarbeitung und automatisierte Entscheidungsfindung hinweisen.',
  },
  {
    id: 'dsgvo_art22',
    article: 'Art. 22 DSGVO',
    label: 'Automatisierte Einzelentscheidungen: menschlicher Review verankert',
    description: 'Entscheidungen mit wesentlicher rechtlicher oder ähnlicher Wirkung (Kredit, Einstellung, Versicherung) dürfen nicht ausschließlich automatisiert getroffen werden.',
    relevance: 'Gilt direkt für KI-Entscheidungssysteme. Human-in-the-Loop ist DSGVO-Pflicht, nicht nur AI-Act-Anforderung.',
  },
  {
    id: 'dsgvo_art25',
    article: 'Art. 25 DSGVO',
    label: 'Privacy by Design & by Default implementiert',
    description: 'Datensparsamkeit und datenschutzfreundliche Voreinstellungen ab dem Zeitpunkt der Systemplanung technisch umgesetzt — nicht nachträglich angehängt.',
    relevance: 'Muss bei der KI-Systemarchitektur berücksichtigt werden: minimale Daten, keine unnecessäre Datenspeicherung.',
  },
  {
    id: 'dsgvo_art28',
    article: 'Art. 28 DSGVO',
    label: 'AV-Verträge mit allen Dienstleistern abgeschlossen',
    description: 'Auftragsverarbeitungsverträge (AVV) mit allen Cloud-Anbietern, ML-Plattformanbietern und Datenverarbeitern vorhanden und geprüft.',
    relevance: 'OpenAI, AWS, Azure, GCP, Snowflake etc. als Auftragsverarbeiter → AVV Pflicht. Daten dürfen nicht für Modelltraining genutzt werden.',
  },
  {
    id: 'dsgvo_art30',
    article: 'Art. 30 DSGVO',
    label: 'Verarbeitungsverzeichnis (VVT) mit KI-Aktivitäten aktuell',
    description: 'Alle KI-Verarbeitungstätigkeiten im VVT eingetragen: Zweck, Kategorien, Empfänger, Speicherdauer, technisch-organisatorische Maßnahmen.',
    relevance: 'KI-Systeme als eigenständige Verarbeitungstätigkeiten eintragen — nicht einfach unter bestehende IT-Prozesse subsumieren.',
  },
  {
    id: 'dsgvo_art32',
    article: 'Art. 32 DSGVO',
    label: 'TOMs dokumentiert (Verschlüsselung, Zugriffskontrolle, Pseudonymisierung)',
    description: 'Technisch-organisatorische Maßnahmen dem Stand der Technik entsprechend und dem Risiko angemessen schriftlich festgehalten.',
    relevance: 'Für KI-Systeme: Pseudonymisierung von Trainingsdaten, Verschlüsselung at-rest und in-transit, rollenbasierte Zugriffskontrollen.',
  },
  {
    id: 'dsgvo_art35',
    article: 'Art. 35 DSGVO',
    label: 'DPIA durchgeführt (wenn erforderlich)',
    description: 'Datenschutz-Folgenabschätzung bei systematischer und umfangreicher Bewertung natürlicher Personen, umfangreicher Verarbeitung besonderer Kategorien oder systematischer Überwachung.',
    relevance: 'Hochrisiko-KI-Systeme (EU AI Act) erfordern fast immer auch eine DPIA. Beide Anforderungen gleichzeitig beachten.',
  },
  {
    id: 'dsgvo_art15_22',
    article: 'Art. 15–22 DSGVO',
    label: 'Betroffenenrechte technisch und organisatorisch umsetzbar',
    description: 'Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und Datenportabilität müssen für Betroffene praktisch zugänglich und innerhalb der Fristen umsetzbar sein.',
    relevance: 'KI-Systeme müssen "vergessen" können — Daten aus Trainingsdaten und Inferenz-Logs löschbar gestalten.',
  },
  {
    id: 'dsgvo_art44',
    article: 'Art. 44–49 DSGVO',
    label: 'Drittlandstransfers geregelt (SCCs oder Angemessenheitsbeschluss)',
    description: 'Übermittlung von Daten außerhalb des EWR nur mit gültigem Mechanismus: Angemessenheitsbeschluss (z. B. EU-US Data Privacy Framework), SCCs oder Binding Corporate Rules.',
    relevance: 'US-Cloud-Dienste und KI-APIs (OpenAI, Anthropic, Google AI) = Drittlandstransfer. SCCs prüfen und in AVV verankern.',
  },
]

// ─── RISIKOMATRIX ─────────────────────────────────────────────────────────────

export interface RiskMatrixConfig {
  impactLabels: string[]
  probabilityLabels: string[]
  quadrants: {
    maxImpact: number
    maxProbability: number
    label: string
    color: { bg: string; border: string; badge: string }
    action: string
    examples: string[]
  }[]
}

export const RISK_MATRIX: RiskMatrixConfig = {
  impactLabels: ['Vernachlässigbar', 'Gering', 'Signifikant', 'Kritisch'],
  probabilityLabels: ['Selten', 'Möglich', 'Wahrscheinlich', 'Fast sicher'],
  quadrants: [
    {
      maxImpact: 2, maxProbability: 4,
      label: 'Niedrig', color: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
      action: 'Akzeptieren und beobachten',
      examples: ['Dokumentationslücken', 'UI-Inkonsistenzen', 'Edge-Case-Fehler ohne Personenbezug'],
    },
    {
      maxImpact: 4, maxProbability: 2,
      label: 'Moderat', color: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
      action: 'Monitoring einrichten',
      examples: ['Performance-Degradation', 'Modell-Drift', 'Nutzerbeschwerden'],
    },
    {
      maxImpact: 3, maxProbability: 3,
      label: 'Signifikant', color: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
      action: 'Mitigation planen und umsetzen',
      examples: ['Drittanbieter-Ausfall', 'Reputationsrisiko durch Modellfehler', 'Unbemerkte Bias-Einführung'],
    },
    {
      maxImpact: 4, maxProbability: 4,
      label: 'Kritisch', color: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
      action: 'Sofortiger Handlungsbedarf — System ggf. stoppen',
      examples: ['Bias in Hochrisiko-Entscheidung', 'Datenpanne mit sensiblen Daten', 'DSGVO-Verstoß mit Meldepflicht'],
    },
  ],
}

export function getRiskLevel(impact: number, probability: number): typeof RISK_MATRIX.quadrants[0] {
  const score = impact * probability
  if (impact <= 2) return RISK_MATRIX.quadrants[0]
  if (probability <= 2) return RISK_MATRIX.quadrants[1]
  if (score <= 9) return RISK_MATRIX.quadrants[2]
  return RISK_MATRIX.quadrants[3]
}

// ─── POLICY TEMPLATES (unverändert) ──────────────────────────────────────────

export interface PolicyTemplate {
  id: string
  title: string
  subtitle: string
  content: string
}

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'ai_usage',
    title: 'AI Usage Policy',
    subtitle: 'Unternehmensweite Richtlinie für den Einsatz von KI-Systemen',
    content: `# AI Usage Policy — [Unternehmen]
Version: 1.0 | Stand: [Datum] | Verantwortlich: [Name/Rolle]

## 1. Geltungsbereich
Gilt für alle Mitarbeitenden und Dienstleister, die KI-Systeme im Unternehmenskontext nutzen.

## 2. Genehmigte KI-Systeme
Nur durch die IT freigegebene KI-Tools dürfen für Geschäftsdaten genutzt werden.
Aktuelle Freigabeliste: [Link zum internen Verzeichnis]

## 3. Verbotene Anwendungen
- Eingabe von Kundendaten in nicht-genehmigte KI-Dienste
- Autonome Entscheidungen mit wesentlichen Personenauswirkungen ohne Human Review
- Einsatz für Täuschung, Diskriminierung oder Datenschutzverletzungen

## 4. Pflichten der Nutzenden
- KI-Ergebnisse kritisch prüfen — keine blinde Übernahme
- Transparenz gegenüber Kunden bei KI-Einsatz (Art. 50 EU AI Act)
- Fehler und Auffälligkeiten dem AI-Verantwortlichen melden

## 5. Verantwortlichkeit
KI-Outputs bleiben Verantwortung der nutzenden Person oder des Teams.

## 6. Überprüfung: Jährlich durch [Rolle/Team]`,
  },
  {
    id: 'model_card',
    title: 'Model Card Template',
    subtitle: 'Technischer Steckbrief nach EU AI Act Anhang IV',
    content: `# Model Card — [Modellname]
Stand: [Datum] | Eigentümer: [Team/Person]

## Modell-Übersicht
- Aufgabe: [z. B. Dokumentenklassifikation, Prognose]
- Typ: [z. B. Supervised, LLM, Regelbasiert]
- EU AI Act Risikoklasse: [ ] Hochrisiko  [ ] Begrenztes Risiko  [ ] Minimal

## Anwendungsfall & Grenzen
- Vorgesehen für: [Konkrete Beschreibung]
- Nicht vorgesehen für: [Ausschlüsse]
- Bekannte Limitierungen: [Schwächen, Bias, Datenlücken]

## Trainingsdaten (Art. 10 EU AI Act)
- Quellen: [Beschreibung] | Zeitraum: [von–bis]
- Besondere Datenkategorien (Art. 9 DSGVO): [ ] Ja  [ ] Nein
- Bias-Prüfung durchgeführt: [ ] Ja  [ ] Nein | Methode: [Beschreibung]

## Performance-Metriken
| Metrik | Trainingsdaten | Testdaten | Produktiv |
|--------|----------------|-----------|-----------|
| [z. B. F1] | [Wert] | [Wert] | [Wert] |

## Human Oversight (Art. 14 EU AI Act)
Überprüfungsschritt: [Beschreibung wer, wann, wie überprüft]

## Monitoring: Intervall [wöchentlich/monatlich] | Verantwortlich: [Name]`,
  },
  {
    id: 'incident_response',
    title: 'AI Incident Response Plan',
    subtitle: 'Eskalationsprozess — inkl. Art. 73 EU AI Act Meldepflicht',
    content: `# AI Incident Response Plan — [Unternehmen]

## Stufe 1 — Geringfügig (keine Personenbeeinträchtigung)
Beispiele: Performance-Degradation, Empfehlungsfehler
Reaktionszeit: 5 Werktage | Verantwortlich: Produktteam

## Stufe 2 — Erheblich (Beeinträchtigung von Entscheidungen)
Beispiele: Falschklassifikation mit Konsequenzen, Datenpanne ohne Meldepflicht
Reaktionszeit: 24 Stunden | Verantwortlich: AI-Verantwortlicher + IT-Security

## Stufe 3 — Kritisch (EU AI Act Art. 73 / DSGVO Art. 33 Meldepflicht)
Beispiele: Ernsthafter Zwischenfall (serious incident) Hochrisiko-KI, DSGVO-Datenpanne
Reaktionszeit: < 2 Stunden
- DSGVO Art. 33: Meldung an Aufsichtsbehörde binnen 72h
- EU AI Act Art. 73: Meldung an Marktüberwachungsbehörde (schwerwiegende Vorfälle)
Verantwortlich: Geschäftsführung + Datenschutzbeauftragter

## Incident-Dokumentation
Für jeden Vorfall: Datum, System, betroffene Personen, Ursache, Maßnahmen, Lessons Learned.

## Kontakte
- AI-Verantwortlicher: [Name, E-Mail]
- Datenschutzbeauftragter (DSB): [Name, E-Mail]
- Marktüberwachungsbehörde: BNetzA / BSI [je nach Sektor]`,
  },
  {
    id: 'supplier_checklist',
    title: 'AI-Lieferanten Due Diligence',
    subtitle: 'Checkliste für die Bewertung externer AI-Anbieter',
    content: `# AI Supplier Due Diligence — [Anbieter] | [Datum]

## Datenschutz & DSGVO
[ ] AVV vorhanden und unterschrieben
[ ] Datenspeicherort: EU/EWR oder gültige SCCs für Drittlandstransfer
[ ] Daten werden NICHT für Modelltraining genutzt (vertraglich)
[ ] Löschfristen definiert und technisch umgesetzt

## Sicherheit
[ ] ISO 27001 Zertifizierung oder SOC 2 Type II vorhanden
[ ] Penetrationstests < 12 Monate alt
[ ] SLA mit Verfügbarkeitsgarantie ≥ 99,5%
[ ] Verschlüsselung at-rest und in-transit

## EU AI Act
[ ] AI Act Compliance-Roadmap des Anbieters vorhanden
[ ] Risikoklasse des angebotenen Systems dokumentiert
[ ] Technische Dokumentation nach Anhang IV auf Anfrage verfügbar
[ ] Registrierung in EU-AI-Datenbank (wenn Hochrisiko)

## Vertragsrecht
[ ] Haftungsregelungen für AI-Fehler und Diskriminierung geklärt
[ ] Exit-Strategie und vollständige Datenrückgabe vereinbart
[ ] Audit-Rechte vertraglich gesichert
[ ] Sub-Auftragsverarbeiter transparent und genehmigt

Bewertung: [ ] Freigegeben  [ ] Bedingt freigegeben (mit Auflagen)  [ ] Abgelehnt`,
  },
]

// ── Optionale / erweiterbare Regelwerke ──────────────────────────────────────

export interface AdditionalRegulation {
  id: string
  label: string
  shortLabel: string
  description: string
  applicability: string
  items: ChecklistItem[]
}

export const ADDITIONAL_REGULATIONS: AdditionalRegulation[] = [
  {
    id: 'iso_42001',
    shortLabel: 'ISO 42001',
    label: 'ISO 42001 — KI-Managementsystem',
    description:
      'Internationaler Standard für den Aufbau, Betrieb und die kontinuierliche Verbesserung eines KI-Managementsystems (AIMS). Adressiert Governance, Risiko, Transparenz und ethische Aspekte.',
    applicability:
      'Empfohlen für Unternehmen, die AI-Systeme entwickeln oder betreiben und eine zertifizierbare Governance-Grundlage anstreben.',
    items: [
      { id: 'iso42001_context', label: 'Organisationskontext und interessierte Parteien für AI dokumentiert', category: 'Governance' },
      { id: 'iso42001_policy', label: 'AI-Richtlinie (AI Policy) durch Leitung verabschiedet', category: 'Governance' },
      { id: 'iso42001_risk', label: 'AI-Risikobewertungsprozess etabliert und dokumentiert', category: 'Risiko' },
      { id: 'iso42001_objectives', label: 'Messbare AI-Ziele definiert und überwacht', category: 'Governance' },
      { id: 'iso42001_data', label: 'Datenqualitäts- und Daten-Governance-Anforderungen definiert', category: 'Daten' },
      { id: 'iso42001_transparency', label: 'Transparenz- und Erklärbarkeitsanforderungen je System festgelegt', category: 'Transparenz' },
      { id: 'iso42001_monitoring', label: 'Kontinuierliche Überwachung und Verbesserung (Plan-Do-Check-Act) eingerichtet', category: 'Betrieb' },
      { id: 'iso42001_audit', label: 'Interne Audits geplant und dokumentiert', category: 'Audit' },
    ],
  },
  {
    id: 'nis2',
    shortLabel: 'NIS-2',
    label: 'NIS-2 — Cybersicherheitsrichtlinie',
    description:
      'EU-Richtlinie 2022/2555 erweitert den Geltungsbereich auf mehr Sektoren und verschärft Anforderungen an Risikomanagement, Meldepflichten und Lieferkettensicherheit.',
    applicability:
      'Gilt für „wesentliche" und „wichtige" Einrichtungen in 18 Sektoren (u. a. Energie, Finanzen, Gesundheit, Digitale Infrastruktur) ab Oktober 2024.',
    items: [
      { id: 'nis2_governance', label: 'Leitungsebene für Cybersicherheitsmaßnahmen verantwortlich gemacht', category: 'Governance' },
      { id: 'nis2_risk', label: 'Cybersicherheits-Risikobewertung durchgeführt und dokumentiert', category: 'Risiko' },
      { id: 'nis2_incident', label: 'Meldeprozess für erhebliche Sicherheitsvorfälle (24h-Erstmeldung) eingerichtet', category: 'Incident' },
      { id: 'nis2_supply_chain', label: 'Sicherheitsanforderungen an Lieferanten und Dienstleister vertraglich fixiert', category: 'Lieferkette' },
      { id: 'nis2_access', label: 'Zugangskontrollen und Least-Privilege-Prinzip umgesetzt', category: 'Zugang' },
      { id: 'nis2_encryption', label: 'Verschlüsselung sensibler Daten in Ruhe und in Übertragung sichergestellt', category: 'Kryptographie' },
      { id: 'nis2_bcp', label: 'Business Continuity Plan (BCP) für kritische Dienste vorhanden', category: 'Betrieb' },
      { id: 'nis2_training', label: 'Regelmäßige Cybersicherheits-Schulungen für alle Mitarbeitenden', category: 'Schulung' },
    ],
  },
  {
    id: 'iso_27001',
    shortLabel: 'ISO 27001',
    label: 'ISO 27001 — Informationssicherheit',
    description:
      'International anerkannter Standard für Informationssicherheits-Managementsysteme (ISMS). Definiert Anforderungen für den systematischen Schutz von Informationswerten.',
    applicability:
      'Relevant für alle Unternehmen, die Kundendaten verarbeiten oder in regulierten Branchen tätig sind. Häufige Voraussetzung in Enterprise-Ausschreibungen.',
    items: [
      { id: 'iso27001_scope', label: 'ISMS-Anwendungsbereich definiert und dokumentiert', category: 'Governance' },
      { id: 'iso27001_assets', label: 'Informationsasset-Inventar erstellt und klassifiziert', category: 'Assets' },
      { id: 'iso27001_risk_treatment', label: 'Risiken identifiziert, bewertet und Behandlungspläne erstellt', category: 'Risiko' },
      { id: 'iso27001_soa', label: 'Statement of Applicability (SoA) für Anhang-A-Maßnahmen erstellt', category: 'Dokumentation' },
      { id: 'iso27001_access_mgmt', label: 'Zugriffsmanagement-Richtlinie und -prozesse dokumentiert', category: 'Zugang' },
      { id: 'iso27001_physical', label: 'Physische Sicherheitsmaßnahmen für Serverräume/Büros umgesetzt', category: 'Physisch' },
      { id: 'iso27001_incident', label: 'Incident-Response-Prozess definiert und geübt', category: 'Incident' },
      { id: 'iso27001_review', label: 'Management-Review mindestens jährlich durchgeführt', category: 'Audit' },
    ],
  },
  {
    id: 'bait',
    shortLabel: 'BAIT',
    label: 'BAIT — Bankaufsichtliche IT-Anforderungen',
    description:
      'BaFin-Rundschreiben zu IT-Governance, Informationssicherheit und IT-Risikomanagement für Kreditinstitute. Ergänzt MaRisk im IT-Bereich.',
    applicability:
      'Verpflichtend für Kreditinstitute und Finanzdienstleister unter BaFin-Aufsicht. Besonders relevant beim Einsatz von AI in Kredit-, Scoring- oder Risikomodellen.',
    items: [
      { id: 'bait_strategy', label: 'IT-Strategie mit Vorstand abgestimmt und dokumentiert', category: 'Governance' },
      { id: 'bait_governance', label: 'IT-Governance-Struktur mit klaren Verantwortlichkeiten etabliert', category: 'Governance' },
      { id: 'bait_risk', label: 'IT-Risikoanalyse durchgeführt und in Gesamtrisikomanagement integriert', category: 'Risiko' },
      { id: 'bait_it_ops', label: 'IT-Betrieb mit definierten SLAs und Kapazitätsplanung dokumentiert', category: 'Betrieb' },
      { id: 'bait_outsourcing', label: 'IT-Dienstleister-Steuerung (inkl. Cloud) nach BAIT-Anforderungen eingerichtet', category: 'Lieferkette' },
      { id: 'bait_iam', label: 'Identitäts- und Berechtigungsmanagement (IAM) revisionssicher implementiert', category: 'Zugang' },
      { id: 'bait_model_risk', label: 'Modell-Risikomanagement für KI/ML-Modelle etabliert', category: 'KI-Modelle' },
      { id: 'bait_audit_trail', label: 'Vollständiger Audit Trail für kritische AI-Entscheidungen vorhanden', category: 'Audit' },
    ],
  },
  {
    id: 'lksg',
    shortLabel: 'LkSG',
    label: 'LkSG — Lieferkettensorgfaltspflichtengesetz',
    description:
      'Deutsches Gesetz zur Sorgfaltspflicht in Lieferketten (ab 1.000 MA). Verpflichtet Unternehmen, Menschenrechts- und Umweltrisiken bei direkten und indirekten Zulieferern zu identifizieren und zu beheben.',
    applicability:
      'Gilt für Unternehmen mit ≥ 1.000 Beschäftigten in Deutschland (ab 2024). Relevant für AI-Projekte mit externen Datenbeschaffungs- oder Annotierungs-Dienstleistern.',
    items: [
      { id: 'lksg_policy', label: 'Grundsatzerklärung zur Achtung der Menschenrechte verabschiedet', category: 'Governance' },
      { id: 'lksg_risk_analysis', label: 'Risikoanalyse für direkte Zulieferer durchgeführt', category: 'Risiko' },
      { id: 'lksg_preventive', label: 'Präventivmaßnahmen in Lieferantenverträgen (CoC, Audits) verankert', category: 'Lieferkette' },
      { id: 'lksg_remediation', label: 'Abhilfemaßnahmen bei festgestellten Verstößen definiert', category: 'Incident' },
      { id: 'lksg_complaint', label: 'Beschwerdemechanismus für Hinweisgeber eingerichtet', category: 'Governance' },
      { id: 'lksg_documentation', label: 'Sorgfaltspflichten vollständig dokumentiert (7-Jahres-Aufbewahrung)', category: 'Dokumentation' },
      { id: 'lksg_ai_supply_chain', label: 'AI-spezifische Lieferkette auf Menschenrechtsrisiken geprüft (Datenerhebung, Annotation)', category: 'KI-spezifisch' },
      { id: 'lksg_reporting', label: 'Jahresbericht über Sorgfaltspflichten erstellt und veröffentlicht', category: 'Reporting' },
    ],
  },
]

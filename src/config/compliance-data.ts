import type { LocaleString } from '@/lib/utils/locale-data'

// ─── TYPEN ────────────────────────────────────────────────────────────────────

export type CheckStatus = 'pending' | 'compliant' | 'non_compliant' | 'partial'
export type Regulation = 'eu_ai_act' | 'dsgvo' | 'risk_matrix'
export type EuAiActRiskClass = 'prohibited' | 'high' | 'limited' | 'minimal'

export interface ChecklistItem {
  id: string          // wird als check_type in DB gespeichert
  article?: string
  label: LocaleString
  description?: LocaleString
  relevance?: LocaleString
  category?: string   // Gruppierungsschlüssel (z. B. 'Governance', 'Risiko') — kein Übersetzungsbedarf
  sourceUrl?: string
  lastVerified?: string
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
  title: LocaleString
  badge: LocaleString
  articleRef: string
  summary: LocaleString
  color: { bg: string; border: string; badge: string; title: string }
  examples: LocaleString[]
}

export const EU_AI_ACT_RISK_CLASSES: EuAiActRiskClassDef[] = [
  {
    id: 'prohibited',
    title:  { de: 'Verboten',        en: 'Prohibited' },
    badge:  { de: 'Keine Ausnahmen', en: 'No exceptions' },
    articleRef: 'Art. 5 EU AI Act',
    summary: {
      de: 'Systeme dieser Kategorie dürfen in der EU nicht eingesetzt werden. Kein Übergangsrecht, keine Ausnahmen.',
      en: 'Systems in this category may not be deployed in the EU. No transitional provisions, no exceptions.',
    },
    color: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', title: 'text-red-800' },
    examples: [
      { de: 'Social Scoring durch staatliche oder behördliche Stellen',                                                 en: 'Social scoring by public authorities or government agencies' },
      { de: 'Biometrische Echtzeit-Fernidentifikation in öffentlichen Räumen (mit engen Ausnahmen)',                    en: 'Real-time remote biometric identification in public spaces (with narrow exceptions)' },
      { de: 'Manipulation durch unterschwellige Techniken oder Ausnutzung von Schwachstellen',                          en: 'Manipulation through subliminal techniques or exploitation of vulnerabilities' },
      { de: 'Predictive Policing auf Basis persönlicher Merkmale',                                                      en: 'Predictive policing based on personal characteristics' },
      { de: 'Emotionserkennung am Arbeitsplatz und in Bildungseinrichtungen',                                            en: 'Emotion recognition in the workplace and educational institutions' },
      { de: 'Anlegen biometrischer Datenbanken durch Scraping',                                                          en: 'Compiling biometric databases through scraping' },
    ],
  },
  {
    id: 'high',
    title:  { de: 'Hochrisiko',              en: 'High-Risk' },
    badge:  { de: 'Umfangreiche Pflichten',  en: 'Extensive obligations' },
    articleRef: 'Art. 6, Anhang III EU AI Act',
    summary: {
      de: 'Einsatz nur mit vollständiger Dokumentation, Konformitätsbewertung und registriertem System. Gilt für KI mit wesentlichen Auswirkungen auf Grundrechte oder Sicherheit.',
      en: 'Deployment only with full documentation, conformity assessment and registered system. Applies to AI with significant impact on fundamental rights or safety.',
    },
    color: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', title: 'text-amber-800' },
    examples: [
      { de: 'HR: Einstellungen, Beförderungen, Leistungsbewertung, Entlassung (Anhang III Nr. 4)',     en: 'HR: Hiring, promotions, performance assessment, dismissal (Annex III No. 4)' },
      { de: 'Kredit- und Bonitätsprüfung, Versicherungseinstufung (Anhang III Nr. 5)',                  en: 'Credit and creditworthiness assessment, insurance classification (Annex III No. 5)' },
      { de: 'Medizinische Diagnose als Medizinprodukt (Anhang III Nr. 6)',                              en: 'Medical diagnosis as a medical device (Annex III No. 6)' },
      { de: 'Kritische Infrastruktur (Energie, Wasser, Verkehr) (Anhang III Nr. 2)',                   en: 'Critical infrastructure (energy, water, transport) (Annex III No. 2)' },
      { de: 'Bildung: Prüfungsautomatisierung, Zugangsentscheidungen (Anhang III Nr. 3)',               en: 'Education: exam automation, access decisions (Annex III No. 3)' },
      { de: 'Strafverfolgung, Grenzkontrolle, Justiz (Anhang III Nr. 6–8)',                            en: 'Law enforcement, border control, justice (Annex III No. 6–8)' },
    ],
  },
  {
    id: 'limited',
    title:  { de: 'Begrenztes Risiko',    en: 'Limited Risk' },
    badge:  { de: 'Transparenzpflichten', en: 'Transparency obligations' },
    articleRef: 'Art. 50 EU AI Act',
    summary: {
      de: 'Nutzer müssen wissen, dass sie mit einem KI-System interagieren. KI-generierte Inhalte sind maschinenlesbar zu kennzeichnen.',
      en: 'Users must know they are interacting with an AI system. AI-generated content must be labeled in a machine-readable format.',
    },
    color: { bg: 'bg-primary-soft', border: 'border-primary-border', badge: 'bg-blue-100 text-primary-hover', title: 'text-blue-800' },
    examples: [
      { de: 'Chatbots und virtuelle Assistenten mit Kundenkontakt',                     en: 'Chatbots and virtual assistants with customer contact' },
      { de: 'KI-generierte Texte, Bilder, Videos (Deepfakes, synthetische Medien)',     en: 'AI-generated text, images, videos (deepfakes, synthetic media)' },
      { de: 'Emotionserkennung (außer in verbotenen Kontexten)',                         en: 'Emotion recognition (except in prohibited contexts)' },
      { de: 'Biometrische Kategorisierungssysteme',                                     en: 'Biometric categorization systems' },
    ],
  },
  {
    id: 'minimal',
    title:  { de: 'Minimales Risiko',       en: 'Minimal Risk' },
    badge:  { de: 'Freiwillige Maßnahmen',  en: 'Voluntary measures' },
    articleRef: 'Erwägungsgrund 48 EU AI Act',
    summary: {
      de: 'Keine gesetzlichen Pflichten. Freiwilliger Code of Practice und interne AI-Governance empfohlen.',
      en: 'No statutory obligations. Voluntary code of practice and internal AI governance recommended.',
    },
    color: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', title: 'text-emerald-800' },
    examples: [
      { de: 'Spam-Filter, Empfehlungssysteme, Suchfunktionen',                         en: 'Spam filters, recommendation systems, search functions' },
      { de: 'KI in Spielen und Unterhaltungsanwendungen',                               en: 'AI in games and entertainment applications' },
      { de: 'Einfache Prozessautomatisierung ohne Personenbezug',                       en: 'Simple process automation without personal data' },
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
      label:       { de: 'Nutzer über KI-Interaktion informieren',                                  en: 'Inform users about AI interaction' },
      description: {
        de: 'Natürliche Personen müssen bei Chatbots und interaktiven KI-Systemen klar und verständlich informiert werden, dass sie mit einem KI-System interagieren.',
        en: 'Natural persons must be clearly and comprehensibly informed when interacting with chatbots and interactive AI systems that they are engaging with an AI system.',
      },
      relevance: {
        de: 'Pflicht bei jedem KI-System mit direktem Nutzerkontakt, auch intern.',
        en: 'Mandatory for every AI system with direct user contact, including internal systems.',
      },
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689',
      lastVerified: '2026-07-07',
    },
    {
      id: 'euaiact_art50_2',
      article: 'Art. 50 Abs. 2',
      label:       { de: 'KI-generierte Inhalte maschinenlesbar kennzeichnen',                      en: 'Label AI-generated content in machine-readable format' },
      description: {
        de: 'Synthetische Audio-, Bild-, Video- und Textinhalte (Deep Fakes, generierte Medien) müssen mit einem maschinenlesbaren Marker versehen werden.',
        en: 'Synthetic audio, image, video and text content (deep fakes, generated media) must be marked with a machine-readable marker.',
      },
      relevance: {
        de: 'Gilt für alle Systeme, die synthetische Inhalte erzeugen, unabhängig vom Verwendungszweck.',
        en: 'Applies to all systems that generate synthetic content, regardless of purpose.',
      },
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689',
      lastVerified: '2026-07-07',
    },
    {
      id: 'euaiact_art50_3',
      article: 'Art. 50 Abs. 3',
      label:       { de: 'Deepfakes und synthetische Medien kennzeichnen (sichtbar)',                en: 'Label deepfakes and synthetic media (visibly)' },
      description: {
        de: 'Erzeugte Bilder, Videos oder Audios, die reale Personen, Orte oder Ereignisse täuschend nachahmen, müssen für Empfänger erkennbar als KI-generiert markiert sein.',
        en: 'Generated images, videos or audio that deceptively imitate real persons, places or events must be recognizably marked as AI-generated for recipients.',
      },
      relevance: {
        de: 'Auch relevant bei internen Kommunikationsmaterialien oder Marketinginhalten.',
        en: 'Also relevant for internal communication materials or marketing content.',
      },
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689',
      lastVerified: '2026-07-07',
    },
  ],
  high: [
    {
      id: 'euaiact_art9',
      article: 'Art. 9',
      label:       { de: 'Risikomanagementsystem implementieren',                                    en: 'Implement a risk management system' },
      description: {
        de: 'Fortlaufendes Risikomanagementsystem für den gesamten Lebenszyklus des Hochrisiko-KI-Systems einrichten. Bekannte und vorhersehbare Risiken identifizieren, analysieren und mitigieren.',
        en: 'Establish a continuous risk management system for the entire lifecycle of the high-risk AI system. Identify, analyze and mitigate known and foreseeable risks.',
      },
      relevance: {
        de: 'Grundvoraussetzung: ohne Art. 9 sind alle weiteren Hochrisiko-Pflichten nicht erfüllbar.',
        en: 'Prerequisite: without Art. 9, none of the other high-risk obligations can be fulfilled.',
      },
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689',
      lastVerified: '2026-07-07',
    },
    {
      id: 'euaiact_art10',
      article: 'Art. 10',
      label:       { de: 'Daten-Governance: Trainings- und Validierungsdaten dokumentieren',        en: 'Data governance: document training and validation data' },
      description: {
        de: 'Datenverwaltungspraktiken festlegen: Herkunft, Erhebungsmethoden, vorgesehene Zwecke, bekannte Lücken. Trainingsdaten müssen hinsichtlich Bias geprüft sein.',
        en: 'Define data management practices: origin, collection methods, intended purposes, known gaps. Training data must be examined for bias.',
      },
      relevance: {
        de: 'Betrifft alle genutzten oder selbst entwickelten ML-Modelle für Hochrisiko-Anwendungen.',
        en: 'Applies to all ML models used or developed in-house for high-risk applications.',
      },
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689',
      lastVerified: '2026-07-07',
    },
    {
      id: 'euaiact_art11',
      article: 'Art. 11 + Anhang IV',
      label:       { de: 'Technische Dokumentation nach Anhang IV erstellen',                       en: 'Create technical documentation per Annex IV' },
      description: {
        de: 'Vollständige technische Dokumentation vor Inbetriebnahme erstellen und aktuell halten: Zweck, Design, Algorithmen, Daten, Testergebnisse, Risikomaßnahmen.',
        en: 'Create and maintain complete technical documentation before deployment: purpose, design, algorithms, data, test results, risk measures.',
      },
      relevance: {
        de: 'Muss für Marktüberwachungsbehörden auf Anfrage bereitstehen.',
        en: 'Must be available to market surveillance authorities upon request.',
      },
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689',
      lastVerified: '2026-07-07',
    },
    {
      id: 'euaiact_art12',
      article: 'Art. 12',
      label:       { de: 'Automatische Ereignisprotokollierung (Logging) einrichten',               en: 'Implement automatic event logging' },
      description: {
        de: 'Hochrisiko-KI-Systeme müssen automatisch Ereignisse protokollieren (Log-Level), die Rückverfolgbarkeit über den Lebenszyklus ermöglichen.',
        en: 'High-risk AI systems must automatically log events (log level) enabling traceability across the lifecycle.',
      },
      relevance: {
        de: 'Kritisch für Post-Incident-Analysen und Konformitätsnachweise.',
        en: 'Critical for post-incident analysis and conformity evidence.',
      },
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689',
      lastVerified: '2026-07-07',
    },
    {
      id: 'euaiact_art13',
      article: 'Art. 13',
      label:       { de: 'Transparenz und Nutzerinformation sicherstellen',                         en: 'Ensure transparency and user information' },
      description: {
        de: 'Nutzende von Hochrisiko-KI-Systemen müssen ausreichende Informationen erhalten: Zweck, Fähigkeiten und Grenzen, Überwachungshinweise.',
        en: 'Users of high-risk AI systems must receive adequate information: purpose, capabilities and limitations, supervision instructions.',
      },
      relevance: {
        de: 'Betrifft die Gebrauchsanweisung und Nutzer-Onboarding-Dokumentation.',
        en: 'Applies to the instructions for use and user onboarding documentation.',
      },
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689',
      lastVerified: '2026-07-07',
    },
    {
      id: 'euaiact_art14',
      article: 'Art. 14',
      label:       { de: 'Human Oversight verankern',                                               en: 'Establish human oversight' },
      description: {
        de: 'Das System muss so gestaltet sein, dass natürliche Personen Entscheidungen wirksam überwachen, verstehen, eingreifen, stoppen oder überstimmen können.',
        en: 'The system must be designed so that natural persons can effectively monitor, understand, intervene in, stop or override decisions.',
      },
      relevance: {
        de: 'Human-in-the-Loop ist Pflicht, keine Option.',
        en: 'Human-in-the-loop is mandatory, not optional.',
      },
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689',
      lastVerified: '2026-07-07',
    },
    {
      id: 'euaiact_art15',
      article: 'Art. 15',
      label:       { de: 'Genauigkeit, Robustheit und Cybersicherheit gewährleisten',               en: 'Ensure accuracy, robustness and cybersecurity' },
      description: {
        de: 'System muss ausreichende Genauigkeit, Konsistenz und Widerstandsfähigkeit gegen Angriffe (Adversarial Inputs, Datenmanipulation) während des gesamten Lebenszyklus aufweisen.',
        en: 'The system must demonstrate adequate accuracy, consistency and resilience against attacks (adversarial inputs, data manipulation) throughout its lifecycle.',
      },
      relevance: {
        de: 'Regelmäßige Tests und Monitoring-Prozesse sind erforderlich.',
        en: 'Regular testing and monitoring processes are required.',
      },
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689',
      lastVerified: '2026-07-07',
    },
    {
      id: 'euaiact_art43',
      article: 'Art. 43',
      label:       { de: 'Konformitätsbewertung durchführen',                                       en: 'Conduct conformity assessment' },
      description: {
        de: 'Vor Inbetriebnahme: interne Kontrolle (für die meisten Systeme) oder Prüfung durch benannte Stelle (für besonders kritische Systeme wie biometrische Identifikation).',
        en: 'Before deployment: internal control (for most systems) or examination by a notified body (for particularly critical systems such as biometric identification).',
      },
      relevance: {
        de: 'Voraussetzung für CE-Kennzeichnung und Marktzulassung.',
        en: 'Prerequisite for CE marking and market clearance.',
      },
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689',
      lastVerified: '2026-07-07',
    },
    {
      id: 'euaiact_art46',
      article: 'Art. 46',
      label:       { de: 'CE-Kennzeichnung anbringen',                                              en: 'Affix CE marking' },
      description: {
        de: 'Nach bestandener Konformitätsbewertung muss das KI-System mit der CE-Kennzeichnung versehen werden.',
        en: 'After a successful conformity assessment, the AI system must be affixed with the CE marking.',
      },
      relevance: {
        de: 'Rechtliche Voraussetzung für das Inverkehrbringen in der EU.',
        en: 'Legal prerequisite for placing the system on the EU market.',
      },
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689',
      lastVerified: '2026-07-07',
    },
    {
      id: 'euaiact_art71',
      article: 'Art. 71',
      label:       { de: 'System in EU-AI-Datenbank registrieren',                                  en: 'Register system in the EU AI database' },
      description: {
        de: 'Betreiber von Hochrisiko-KI-Systemen müssen diese vor Inbetriebnahme in der öffentlichen EU-KI-Datenbank (ai-act.eu) registrieren.',
        en: 'Operators of high-risk AI systems must register them in the public EU AI database (ai-act.eu) before deployment.',
      },
      relevance: {
        de: 'Ausnahme: Behörden in den Bereichen Strafverfolgung und Migration (nicht-öffentliche Datenbank).',
        en: 'Exception: authorities in law enforcement and migration (non-public database).',
      },
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689',
      lastVerified: '2026-07-07',
    },
    {
      id: 'euaiact_art72',
      article: 'Art. 72',
      label:       { de: 'Post-Market Monitoring einrichten',                                       en: 'Implement post-market monitoring' },
      description: {
        de: 'Fortlaufendes System zur Überwachung der Leistung nach Inbetriebnahme. Wesentliche Änderungen melden; Zwischenfälle (serious incidents) der Marktüberwachungsbehörde berichten.',
        en: 'Continuous system for monitoring performance after deployment. Report substantial modifications; report serious incidents to the market surveillance authority.',
      },
      relevance: {
        de: 'Gilt auch für eingesetzte Drittanbieter-Modelle, wenn diese für Hochrisiko-Zwecke genutzt werden.',
        en: 'Also applies to third-party models deployed for high-risk purposes.',
      },
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689',
      lastVerified: '2026-07-07',
    },
  ],
}

// ─── DSGVO — CHECKLISTE ──────────────────────────────────────────────────────

export const DSGVO_CHECKLIST: ChecklistItem[] = [
  {
    id: 'dsgvo_art6',
    article: 'Art. 6 DSGVO',
    label:       { de: 'Rechtsgrundlage für Datenverarbeitung dokumentiert',                        en: 'Legal basis for data processing documented' },
    description: {
      de: 'Einwilligung, Vertrag, rechtliche Verpflichtung, berechtigte Interessen oder lebenswichtige Interessen — schriftlich festgehalten und im VVT hinterlegt.',
      en: 'Consent, contract, legal obligation, legitimate interests or vital interests — recorded in writing and documented in the RoPA.',
    },
    relevance: {
      de: 'KI-Systeme verarbeiten oft große Datenmengen zu neuen Zwecken — Zweckbindung und Rechtsgrundlage müssen explizit für den KI-Use-Case gelten.',
      en: 'AI systems often process large amounts of data for new purposes — purpose limitation and legal basis must explicitly apply to the AI use case.',
    },
  },
  {
    id: 'dsgvo_art9',
    article: 'Art. 9 DSGVO',
    label:       { de: 'Besondere Datenkategorien geprüft und dokumentiert',                        en: 'Special categories of data reviewed and documented' },
    description: {
      de: 'Gesundheitsdaten, biometrische Daten, ethnische Herkunft, politische Meinungen, Gewerkschaftszugehörigkeit, religiöse Überzeugungen — erhöhte Anforderungen gelten.',
      en: 'Health data, biometric data, ethnic origin, political opinions, trade union membership, religious beliefs — enhanced requirements apply.',
    },
    relevance: {
      de: 'Viele ML-Modelle erkennen oder inferieren besondere Datenkategorien indirekt (z. B. Gesundheitsstatus aus Kaufverhalten).',
      en: 'Many ML models recognize or infer special categories of data indirectly (e.g. health status from purchasing behavior).',
    },
  },
  {
    id: 'dsgvo_art13',
    article: 'Art. 13 / 14 DSGVO',
    label:       { de: 'Informationspflichten erfüllt (Datenschutzhinweis aktuell)',                en: 'Information obligations fulfilled (privacy notice up to date)' },
    description: {
      de: 'Betroffene Personen müssen über Zweck, Rechtsgrundlage, Empfänger, Speicherdauer und ihre Rechte informiert werden — bei Direkterhebung (Art. 13) oder Drittquelle (Art. 14).',
      en: 'Data subjects must be informed about purpose, legal basis, recipients, retention period and their rights — on direct collection (Art. 13) or from third-party sources (Art. 14).',
    },
    relevance: {
      de: 'Datenschutzhinweis muss explizit auf KI-Verarbeitung und automatisierte Entscheidungsfindung hinweisen.',
      en: 'Privacy notice must explicitly reference AI processing and automated decision-making.',
    },
  },
  {
    id: 'dsgvo_art22',
    article: 'Art. 22 DSGVO',
    label:       { de: 'Automatisierte Einzelentscheidungen: menschlicher Review verankert',        en: 'Automated individual decisions: human review established' },
    description: {
      de: 'Entscheidungen mit wesentlicher rechtlicher oder ähnlicher Wirkung (Kredit, Einstellung, Versicherung) dürfen nicht ausschließlich automatisiert getroffen werden.',
      en: 'Decisions with significant legal or similarly significant effect (credit, hiring, insurance) may not be made solely by automated means.',
    },
    relevance: {
      de: 'Gilt direkt für KI-Entscheidungssysteme. Human-in-the-Loop ist DSGVO-Pflicht, nicht nur AI-Act-Anforderung.',
      en: 'Applies directly to AI decision-making systems. Human-in-the-loop is a GDPR obligation, not just an AI Act requirement.',
    },
  },
  {
    id: 'dsgvo_art25',
    article: 'Art. 25 DSGVO',
    label:       { de: 'Privacy by Design & by Default implementiert',                             en: 'Privacy by Design & by Default implemented' },
    description: {
      de: 'Datensparsamkeit und datenschutzfreundliche Voreinstellungen ab dem Zeitpunkt der Systemplanung technisch umgesetzt — nicht nachträglich angehängt.',
      en: 'Data minimization and privacy-friendly defaults implemented technically from the point of system design — not retrofitted.',
    },
    relevance: {
      de: 'Muss bei der KI-Systemarchitektur berücksichtigt werden: minimale Daten, keine unnecessäre Datenspeicherung.',
      en: 'Must be considered in AI system architecture: minimal data, no unnecessary data storage.',
    },
  },
  {
    id: 'dsgvo_art28',
    article: 'Art. 28 DSGVO',
    label:       { de: 'AV-Verträge mit allen Dienstleistern abgeschlossen',                       en: 'Data processing agreements concluded with all service providers' },
    description: {
      de: 'Auftragsverarbeitungsverträge (AVV) mit allen Cloud-Anbietern, ML-Plattformanbietern und Datenverarbeitern vorhanden und geprüft.',
      en: 'Data processing agreements (DPAs) with all cloud providers, ML platform providers and data processors in place and reviewed.',
    },
    relevance: {
      de: 'OpenAI, AWS, Azure, GCP, Snowflake etc. als Auftragsverarbeiter → AVV Pflicht. Daten dürfen nicht für Modelltraining genutzt werden.',
      en: 'OpenAI, AWS, Azure, GCP, Snowflake etc. as processors → DPA mandatory. Data must not be used for model training.',
    },
  },
  {
    id: 'dsgvo_art30',
    article: 'Art. 30 DSGVO',
    label:       { de: 'Verarbeitungsverzeichnis (VVT) mit KI-Aktivitäten aktuell',                en: 'Record of Processing Activities (RoPA) including AI activities up to date' },
    description: {
      de: 'Alle KI-Verarbeitungstätigkeiten im VVT eingetragen: Zweck, Kategorien, Empfänger, Speicherdauer, technisch-organisatorische Maßnahmen.',
      en: 'All AI processing activities recorded in the RoPA: purpose, categories, recipients, retention period, technical and organizational measures.',
    },
    relevance: {
      de: 'KI-Systeme als eigenständige Verarbeitungstätigkeiten eintragen — nicht einfach unter bestehende IT-Prozesse subsumieren.',
      en: 'AI systems must be recorded as independent processing activities — not simply subsumed under existing IT processes.',
    },
  },
  {
    id: 'dsgvo_art32',
    article: 'Art. 32 DSGVO',
    label:       { de: 'TOMs dokumentiert (Verschlüsselung, Zugriffskontrolle, Pseudonymisierung)', en: 'TOMs documented (encryption, access control, pseudonymization)' },
    description: {
      de: 'Technisch-organisatorische Maßnahmen dem Stand der Technik entsprechend und dem Risiko angemessen schriftlich festgehalten.',
      en: 'Technical and organizational measures documented in writing, appropriate to the state of the art and proportionate to the risk.',
    },
    relevance: {
      de: 'Für KI-Systeme: Pseudonymisierung von Trainingsdaten, Verschlüsselung at-rest und in-transit, rollenbasierte Zugriffskontrollen.',
      en: 'For AI systems: pseudonymization of training data, encryption at rest and in transit, role-based access controls.',
    },
  },
  {
    id: 'dsgvo_art35',
    article: 'Art. 35 DSGVO',
    label:       { de: 'DPIA durchgeführt (wenn erforderlich)',                                     en: 'DPIA conducted (where required)' },
    description: {
      de: 'Datenschutz-Folgenabschätzung bei systematischer und umfangreicher Bewertung natürlicher Personen, umfangreicher Verarbeitung besonderer Kategorien oder systematischer Überwachung.',
      en: 'Data Protection Impact Assessment required for systematic and extensive profiling of natural persons, large-scale processing of special categories, or systematic monitoring.',
    },
    relevance: {
      de: 'Hochrisiko-KI-Systeme (EU AI Act) erfordern fast immer auch eine DPIA. Beide Anforderungen gleichzeitig beachten.',
      en: 'High-risk AI systems (EU AI Act) almost always also require a DPIA. Both requirements must be addressed simultaneously.',
    },
  },
  {
    id: 'dsgvo_art15_22',
    article: 'Art. 15–22 DSGVO',
    label:       { de: 'Betroffenenrechte technisch und organisatorisch umsetzbar',                 en: 'Data subject rights technically and organizationally exercisable' },
    description: {
      de: 'Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und Datenportabilität müssen für Betroffene praktisch zugänglich und innerhalb der Fristen umsetzbar sein.',
      en: 'Access, rectification, erasure, restriction, objection and data portability must be practically accessible for data subjects and fulfillable within the statutory deadlines.',
    },
    relevance: {
      de: 'KI-Systeme müssen "vergessen" können — Daten aus Trainingsdaten und Inferenz-Logs löschbar gestalten.',
      en: 'AI systems must be able to "forget" — data in training sets and inference logs must be deletable.',
    },
  },
  {
    id: 'dsgvo_art44',
    article: 'Art. 44–49 DSGVO',
    label:       { de: 'Drittlandstransfers geregelt (SCCs oder Angemessenheitsbeschluss)',         en: 'Third-country transfers regulated (SCCs or adequacy decision)' },
    description: {
      de: 'Übermittlung von Daten außerhalb des EWR nur mit gültigem Mechanismus: Angemessenheitsbeschluss (z. B. EU-US Data Privacy Framework), SCCs oder Binding Corporate Rules.',
      en: 'Transfer of data outside the EEA only with a valid mechanism: adequacy decision (e.g. EU-US Data Privacy Framework), SCCs or Binding Corporate Rules.',
    },
    relevance: {
      de: 'US-Cloud-Dienste und KI-APIs (OpenAI, Anthropic, Google AI) = Drittlandstransfer. SCCs prüfen und in AVV verankern.',
      en: 'US cloud services and AI APIs (OpenAI, Anthropic, Google AI) = third-country transfer. Review SCCs and anchor in DPA.',
    },
  },
  {
    id: 'dsgvo_edpb_cef2026',
    article: 'Art. 12–14 DSGVO',
    label:       { de: 'Transparenz- und Informationspflichten EDPB-prüfsicher (Schwerpunkt 2026)', en: 'Transparency and information obligations EDPB audit-proof (2026 enforcement focus)' },
    description: {
      de:
        'Der EDPB hat die Einhaltung der Transparenz- und Informationspflichten zum ' +
        'EU-weiten Prüfschwerpunkt 2026 erklärt (Coordinated Enforcement Framework). ' +
        'Datenschutzhinweise werden 2026 verstärkt auf Klarheit, Vollständigkeit und ' +
        'korrekte KI-Kennzeichnung geprüft.',
      en:
        'The EDPB has designated compliance with transparency and information obligations as the ' +
        'EU-wide enforcement focus for 2026 (Coordinated Enforcement Framework). ' +
        'Privacy notices will be increasingly scrutinized in 2026 for clarity, completeness and ' +
        'correct AI disclosure.',
    },
    relevance: {
      de:
        'KI-Systeme (Chatbots, Scoring, Profiling) müssen im Datenschutzhinweis ' +
        'explizit benannt werden — inkl. Angabe, ob Trainingsdaten oder Profiling ' +
        'betroffen sind. Copy-Paste-Datenschutzerklärungen ohne KI-Bezug sind das ' +
        'häufigste Prüfrisiko.',
      en:
        'AI systems (chatbots, scoring, profiling) must be explicitly named in the privacy notice ' +
        '— including whether training data or profiling is involved. ' +
        'Copy-paste privacy policies without AI reference are the most common audit risk.',
    },
    sourceUrl: 'https://www.edpb.europa.eu/news_de',
    lastVerified: '2026-07-07',
  },
]

// ─── RISIKOMATRIX ─────────────────────────────────────────────────────────────

export interface RiskMatrixConfig {
  impactLabels: LocaleString[]
  probabilityLabels: LocaleString[]
  quadrants: {
    maxImpact: number
    maxProbability: number
    label: LocaleString
    color: { bg: string; border: string; badge: string }
    action: LocaleString
    examples: LocaleString[]
  }[]
}

export const RISK_MATRIX: RiskMatrixConfig = {
  impactLabels: [
    { de: 'Vernachlässigbar', en: 'Negligible'   },
    { de: 'Gering',           en: 'Low'          },
    { de: 'Signifikant',      en: 'Significant'  },
    { de: 'Kritisch',         en: 'Critical'     },
  ],
  probabilityLabels: [
    { de: 'Selten',        en: 'Rare'          },
    { de: 'Möglich',       en: 'Possible'      },
    { de: 'Wahrscheinlich', en: 'Likely'       },
    { de: 'Fast sicher',   en: 'Almost certain'},
  ],
  quadrants: [
    {
      maxImpact: 2, maxProbability: 4,
      label:  { de: 'Niedrig',  en: 'Low'      },
      color:  { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
      action: { de: 'Akzeptieren und beobachten', en: 'Accept and monitor' },
      examples: [
        { de: 'Dokumentationslücken',                        en: 'Documentation gaps'                  },
        { de: 'UI-Inkonsistenzen',                           en: 'UI inconsistencies'                  },
        { de: 'Edge-Case-Fehler ohne Personenbezug',         en: 'Edge-case errors without personal data'},
      ],
    },
    {
      maxImpact: 4, maxProbability: 2,
      label:  { de: 'Moderat',  en: 'Moderate' },
      color:  { bg: 'bg-primary-soft', border: 'border-primary-border', badge: 'bg-blue-100 text-primary-hover' },
      action: { de: 'Monitoring einrichten', en: 'Set up monitoring' },
      examples: [
        { de: 'Performance-Degradation', en: 'Performance degradation' },
        { de: 'Modell-Drift',            en: 'Model drift'             },
        { de: 'Nutzerbeschwerden',       en: 'User complaints'         },
      ],
    },
    {
      maxImpact: 3, maxProbability: 3,
      label:  { de: 'Signifikant', en: 'Significant' },
      color:  { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
      action: { de: 'Mitigation planen und umsetzen', en: 'Plan and implement mitigation' },
      examples: [
        { de: 'Drittanbieter-Ausfall',                      en: 'Third-party provider outage'         },
        { de: 'Reputationsrisiko durch Modellfehler',        en: 'Reputational risk from model errors' },
        { de: 'Unbemerkte Bias-Einführung',                  en: 'Undetected bias introduction'        },
      ],
    },
    {
      maxImpact: 4, maxProbability: 4,
      label:  { de: 'Kritisch', en: 'Critical' },
      color:  { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
      action: { de: 'Sofortiger Handlungsbedarf — System ggf. stoppen', en: 'Immediate action required — consider stopping the system' },
      examples: [
        { de: 'Bias in Hochrisiko-Entscheidung',             en: 'Bias in high-risk decision'          },
        { de: 'Datenpanne mit sensiblen Daten',              en: 'Data breach involving sensitive data' },
        { de: 'DSGVO-Verstoß mit Meldepflicht',             en: 'GDPR violation with notification obligation'},
      ],
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

// ─── POLICY TEMPLATES ────────────────────────────────────────────────────────
// title + subtitle bilingual; content bleibt als string (langer Markdown-Text)

export interface PolicyTemplate {
  id: string
  title: LocaleString
  subtitle: LocaleString
  content: string
}

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'ai_usage',
    title:    { de: 'AI Usage Policy',                                              en: 'AI Usage Policy'                                          },
    subtitle: { de: 'Unternehmensweite Richtlinie für den Einsatz von KI-Systemen', en: 'Company-wide policy for the use of AI systems'            },
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
    title:    { de: 'Model Card Template',                                          en: 'Model Card Template'                                      },
    subtitle: { de: 'Technischer Steckbrief nach EU AI Act Anhang IV',              en: 'Technical fact sheet per EU AI Act Annex IV'              },
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
    title:    { de: 'AI Incident Response Plan',                                    en: 'AI Incident Response Plan'                                },
    subtitle: { de: 'Eskalationsprozess — inkl. Art. 73 EU AI Act Meldepflicht',    en: 'Escalation process — incl. Art. 73 EU AI Act notification obligation'},
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
    title:    { de: 'AI-Lieferanten Due Diligence',                                 en: 'AI Supplier Due Diligence'                                },
    subtitle: { de: 'Checkliste für die Bewertung externer AI-Anbieter',             en: 'Checklist for evaluating external AI providers'           },
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
  label: LocaleString
  shortLabel: LocaleString
  description: LocaleString
  applicability: LocaleString
  items: ChecklistItem[]
}

export const ADDITIONAL_REGULATIONS: AdditionalRegulation[] = [
  {
    id: 'iso_42001',
    shortLabel:   { de: 'ISO 42001',                       en: 'ISO 42001'                         },
    label:        { de: 'ISO 42001 — KI-Managementsystem', en: 'ISO 42001 — AI Management System'  },
    description: {
      de: 'Internationaler Standard für den Aufbau, Betrieb und die kontinuierliche Verbesserung eines KI-Managementsystems (AIMS). Adressiert Governance, Risiko, Transparenz und ethische Aspekte.',
      en: 'International standard for establishing, operating and continuously improving an AI Management System (AIMS). Addresses governance, risk, transparency and ethical aspects.',
    },
    applicability: {
      de: 'Empfohlen für Unternehmen, die AI-Systeme entwickeln oder betreiben und eine zertifizierbare Governance-Grundlage anstreben.',
      en: 'Recommended for organizations developing or operating AI systems that seek a certifiable governance foundation.',
    },
    items: [
      { id: 'iso42001_context',      label: { de: 'Organisationskontext und interessierte Parteien für AI dokumentiert',              en: 'Organizational context and interested parties for AI documented'              }, category: 'Governance'    },
      { id: 'iso42001_policy',       label: { de: 'AI-Richtlinie (AI Policy) durch Leitung verabschiedet',                           en: 'AI policy approved by management'                                             }, category: 'Governance'    },
      { id: 'iso42001_risk',         label: { de: 'AI-Risikobewertungsprozess etabliert und dokumentiert',                           en: 'AI risk assessment process established and documented'                         }, category: 'Risiko'        },
      { id: 'iso42001_objectives',   label: { de: 'Messbare AI-Ziele definiert und überwacht',                                       en: 'Measurable AI objectives defined and monitored'                               }, category: 'Governance'    },
      { id: 'iso42001_data',         label: { de: 'Datenqualitäts- und Daten-Governance-Anforderungen definiert',                    en: 'Data quality and data governance requirements defined'                         }, category: 'Daten'         },
      { id: 'iso42001_transparency', label: { de: 'Transparenz- und Erklärbarkeitsanforderungen je System festgelegt',               en: 'Transparency and explainability requirements defined per system'               }, category: 'Transparenz'   },
      { id: 'iso42001_monitoring',   label: { de: 'Kontinuierliche Überwachung und Verbesserung (Plan-Do-Check-Act) eingerichtet',   en: 'Continuous monitoring and improvement (Plan-Do-Check-Act) established'        }, category: 'Betrieb'       },
      { id: 'iso42001_audit',        label: { de: 'Interne Audits geplant und dokumentiert',                                         en: 'Internal audits planned and documented'                                        }, category: 'Audit'         },
    ],
  },
  {
    id: 'nis2',
    shortLabel:   { de: 'NIS-2',                                en: 'NIS-2'                                     },
    label:        { de: 'NIS-2 — Cybersicherheitsrichtlinie',   en: 'NIS-2 — Cybersecurity Directive'           },
    description: {
      de: 'EU-Richtlinie 2022/2555 erweitert den Geltungsbereich auf mehr Sektoren und verschärft Anforderungen an Risikomanagement, Meldepflichten und Lieferkettensicherheit.',
      en: 'EU Directive 2022/2555 expands the scope to more sectors and tightens requirements for risk management, reporting obligations and supply chain security.',
    },
    applicability: {
      de: 'Gilt für „wesentliche" und „wichtige" Einrichtungen in 18 Sektoren (u. a. Energie, Finanzen, Gesundheit, Digitale Infrastruktur) ab Oktober 2024.',
      en: 'Applies to "essential" and "important" entities in 18 sectors (incl. energy, finance, health, digital infrastructure) from October 2024.',
    },
    items: [
      { id: 'nis2_governance',    label: { de: 'Leitungsebene für Cybersicherheitsmaßnahmen verantwortlich gemacht',               en: 'Management made accountable for cybersecurity measures'                       }, category: 'Governance'    },
      { id: 'nis2_risk',          label: { de: 'Cybersicherheits-Risikobewertung durchgeführt und dokumentiert',                   en: 'Cybersecurity risk assessment conducted and documented'                       }, category: 'Risiko'        },
      { id: 'nis2_incident',      label: { de: 'Meldeprozess für erhebliche Sicherheitsvorfälle (24h-Erstmeldung) eingerichtet',  en: 'Reporting process for significant security incidents (24h initial report) established' }, category: 'Incident'  },
      { id: 'nis2_supply_chain',  label: { de: 'Sicherheitsanforderungen an Lieferanten und Dienstleister vertraglich fixiert',   en: 'Security requirements for suppliers and service providers contractually fixed' }, category: 'Lieferkette'  },
      { id: 'nis2_access',        label: { de: 'Zugangskontrollen und Least-Privilege-Prinzip umgesetzt',                         en: 'Access controls and least-privilege principle implemented'                     }, category: 'Zugang'        },
      { id: 'nis2_encryption',    label: { de: 'Verschlüsselung sensibler Daten in Ruhe und in Übertragung sichergestellt',       en: 'Encryption of sensitive data at rest and in transit ensured'                  }, category: 'Kryptographie' },
      { id: 'nis2_bcp',           label: { de: 'Business Continuity Plan (BCP) für kritische Dienste vorhanden',                  en: 'Business Continuity Plan (BCP) for critical services in place'               }, category: 'Betrieb'       },
      { id: 'nis2_training',      label: { de: 'Regelmäßige Cybersicherheits-Schulungen für alle Mitarbeitenden',                 en: 'Regular cybersecurity training for all employees'                             }, category: 'Schulung'      },
    ],
  },
  {
    id: 'iso_27001',
    shortLabel:   { de: 'ISO 27001',                          en: 'ISO 27001'                                   },
    label:        { de: 'ISO 27001 — Informationssicherheit', en: 'ISO 27001 — Information Security'            },
    description: {
      de: 'International anerkannter Standard für Informationssicherheits-Managementsysteme (ISMS). Definiert Anforderungen für den systematischen Schutz von Informationswerten.',
      en: 'Internationally recognized standard for Information Security Management Systems (ISMS). Defines requirements for the systematic protection of information assets.',
    },
    applicability: {
      de: 'Relevant für alle Unternehmen, die Kundendaten verarbeiten oder in regulierten Branchen tätig sind. Häufige Voraussetzung in Enterprise-Ausschreibungen.',
      en: 'Relevant for all organizations processing customer data or operating in regulated industries. Frequently required in enterprise procurement.',
    },
    items: [
      { id: 'iso27001_scope',          label: { de: 'ISMS-Anwendungsbereich definiert und dokumentiert',                          en: 'ISMS scope defined and documented'                                            }, category: 'Governance'    },
      { id: 'iso27001_assets',         label: { de: 'Informationsasset-Inventar erstellt und klassifiziert',                      en: 'Information asset inventory created and classified'                           }, category: 'Assets'        },
      { id: 'iso27001_risk_treatment', label: { de: 'Risiken identifiziert, bewertet und Behandlungspläne erstellt',              en: 'Risks identified, assessed and treatment plans created'                       }, category: 'Risiko'        },
      { id: 'iso27001_soa',            label: { de: 'Statement of Applicability (SoA) für Anhang-A-Maßnahmen erstellt',          en: 'Statement of Applicability (SoA) for Annex A controls created'               }, category: 'Dokumentation' },
      { id: 'iso27001_access_mgmt',    label: { de: 'Zugriffsmanagement-Richtlinie und -prozesse dokumentiert',                   en: 'Access management policy and processes documented'                            }, category: 'Zugang'        },
      { id: 'iso27001_physical',       label: { de: 'Physische Sicherheitsmaßnahmen für Serverräume/Büros umgesetzt',             en: 'Physical security measures for server rooms/offices implemented'              }, category: 'Physisch'      },
      { id: 'iso27001_incident',       label: { de: 'Incident-Response-Prozess definiert und geübt',                             en: 'Incident response process defined and practiced'                              }, category: 'Incident'      },
      { id: 'iso27001_review',         label: { de: 'Management-Review mindestens jährlich durchgeführt',                        en: 'Management review conducted at least annually'                                }, category: 'Audit'         },
    ],
  },
  {
    id: 'bait',
    shortLabel:   { de: 'BAIT',                                                en: 'BAIT'                                                      },
    label:        { de: 'BAIT — Bankaufsichtliche IT-Anforderungen',            en: 'BAIT — Banking Supervisory IT Requirements'                 },
    description: {
      de: 'BaFin-Rundschreiben zu IT-Governance, Informationssicherheit und IT-Risikomanagement für Kreditinstitute. Ergänzt MaRisk im IT-Bereich.',
      en: 'BaFin circular on IT governance, information security and IT risk management for credit institutions. Supplements MaRisk in the IT domain.',
    },
    applicability: {
      de: 'Verpflichtend für Kreditinstitute und Finanzdienstleister unter BaFin-Aufsicht. Besonders relevant beim Einsatz von AI in Kredit-, Scoring- oder Risikomodellen.',
      en: 'Mandatory for credit institutions and financial services firms under BaFin supervision. Particularly relevant when using AI in credit, scoring or risk models.',
    },
    items: [
      { id: 'bait_strategy',     label: { de: 'IT-Strategie mit Vorstand abgestimmt und dokumentiert',                           en: 'IT strategy aligned with the board and documented'                            }, category: 'Governance'    },
      { id: 'bait_governance',   label: { de: 'IT-Governance-Struktur mit klaren Verantwortlichkeiten etabliert',                en: 'IT governance structure with clear responsibilities established'               }, category: 'Governance'    },
      { id: 'bait_risk',         label: { de: 'IT-Risikoanalyse durchgeführt und in Gesamtrisikomanagement integriert',          en: 'IT risk analysis conducted and integrated into overall risk management'        }, category: 'Risiko'        },
      { id: 'bait_it_ops',       label: { de: 'IT-Betrieb mit definierten SLAs und Kapazitätsplanung dokumentiert',              en: 'IT operations documented with defined SLAs and capacity planning'             }, category: 'Betrieb'       },
      { id: 'bait_outsourcing',  label: { de: 'IT-Dienstleister-Steuerung (inkl. Cloud) nach BAIT-Anforderungen eingerichtet',  en: 'IT service provider management (incl. cloud) established per BAIT requirements'}, category: 'Lieferkette'  },
      { id: 'bait_iam',          label: { de: 'Identitäts- und Berechtigungsmanagement (IAM) revisionssicher implementiert',     en: 'Identity and access management (IAM) implemented in audit-proof manner'        }, category: 'Zugang'        },
      { id: 'bait_model_risk',   label: { de: 'Modell-Risikomanagement für KI/ML-Modelle etabliert',                            en: 'Model risk management for AI/ML models established'                           }, category: 'KI-Modelle'    },
      { id: 'bait_audit_trail',  label: { de: 'Vollständiger Audit Trail für kritische AI-Entscheidungen vorhanden',             en: 'Complete audit trail for critical AI decisions in place'                      }, category: 'Audit'         },
    ],
  },
  {
    id: 'lksg',
    shortLabel:   { de: 'LkSG',                                                          en: 'LkSG'                                                                    },
    label:        { de: 'LkSG — Lieferkettensorgfaltspflichtengesetz',                   en: 'LkSG — Supply Chain Due Diligence Act'                                    },
    description: {
      de: 'Deutsches Gesetz zur Sorgfaltspflicht in Lieferketten (ab 1.000 MA). Verpflichtet Unternehmen, Menschenrechts- und Umweltrisiken bei direkten und indirekten Zulieferern zu identifizieren und zu beheben.',
      en: 'German act on corporate due diligence in supply chains (from 1,000 employees). Requires companies to identify and remediate human rights and environmental risks at direct and indirect suppliers.',
    },
    applicability: {
      de: 'Gilt für Unternehmen mit ≥ 1.000 Beschäftigten in Deutschland (ab 2024). Relevant für AI-Projekte mit externen Datenbeschaffungs- oder Annotierungs-Dienstleistern.',
      en: 'Applies to companies with ≥ 1,000 employees in Germany (from 2024). Relevant for AI projects with external data collection or annotation service providers.',
    },
    items: [
      { id: 'lksg_policy',          label: { de: 'Grundsatzerklärung zur Achtung der Menschenrechte verabschiedet',              en: 'Policy statement on respect for human rights adopted'                         }, category: 'Governance'    },
      { id: 'lksg_risk_analysis',   label: { de: 'Risikoanalyse für direkte Zulieferer durchgeführt',                            en: 'Risk analysis for direct suppliers conducted'                                 }, category: 'Risiko'        },
      { id: 'lksg_preventive',      label: { de: 'Präventivmaßnahmen in Lieferantenverträgen (CoC, Audits) verankert',           en: 'Preventive measures anchored in supplier contracts (CoC, audits)'             }, category: 'Lieferkette'   },
      { id: 'lksg_remediation',     label: { de: 'Abhilfemaßnahmen bei festgestellten Verstößen definiert',                      en: 'Remediation measures defined for identified violations'                       }, category: 'Incident'      },
      { id: 'lksg_complaint',       label: { de: 'Beschwerdemechanismus für Hinweisgeber eingerichtet',                          en: 'Complaint mechanism for whistleblowers established'                           }, category: 'Governance'    },
      { id: 'lksg_documentation',   label: { de: 'Sorgfaltspflichten vollständig dokumentiert (7-Jahres-Aufbewahrung)',          en: 'Due diligence obligations fully documented (7-year retention)'                }, category: 'Dokumentation' },
      { id: 'lksg_ai_supply_chain', label: { de: 'AI-spezifische Lieferkette auf Menschenrechtsrisiken geprüft (Datenerhebung, Annotation)', en: 'AI-specific supply chain reviewed for human rights risks (data collection, annotation)'}, category: 'KI-spezifisch'},
      { id: 'lksg_reporting',       label: { de: 'Jahresbericht über Sorgfaltspflichten erstellt und veröffentlicht',            en: 'Annual due diligence report prepared and published'                           }, category: 'Reporting'     },
    ],
  },
]

// ─── BEOBACHTUNGSLISTE — LAUFENDE GESETZGEBUNG (NICHT VERBINDLICH) ──────────
// Diese Einträge sind KEINE Compliance-Pflichten. Sie zeigen an, was sich
// ändern könnte. Erst nach Veröffentlichung im EU-Amtsblatt (EUR-Lex) in
// DSGVO_CHECKLIST / EU_AI_ACT_OBLIGATIONS verschieben.

export type WatchlistStatus = 'in_gesetzgebung' | 'angekuendigt' | 'final'

export interface WatchlistItem {
  id: string
  title: LocaleString
  status: WatchlistStatus
  summary: LocaleString
  potentialImpact: LocaleString
  sourceUrl: string
  lastChecked: string
  deadline?: string
}

export const REGULATORY_WATCHLIST: WatchlistItem[] = [
  {
    id: 'digital_omnibus_hrais_delay',
    title:  {
      de: 'EU AI Act: Verschiebung der Hochrisiko-Pflichten (Annex III)',
      en: 'EU AI Act: Delay of High-Risk Obligations (Annex III)',
    },
    status: 'in_gesetzgebung',
    summary: {
      de:
        'Vorläufige Einigung vom 7. Mai 2026 (Digital Omnibus on AI) verschiebt die ' +
        'Annex-III-Hochrisiko-Pflichten von August 2026 auf Dezember 2027. Noch nicht ' +
        'final im Amtsblatt veröffentlicht.',
      en:
        'Provisional agreement of 7 May 2026 (Digital Omnibus on AI) delays the ' +
        'Annex III high-risk obligations from August 2026 to December 2027. Not yet ' +
        'published in final form in the Official Journal.',
    },
    potentialImpact: {
      de:
        'Betrifft Fristangaben im Roadmap-Generator und Governance-Entscheidungsbaum ' +
        'für Hochrisiko-Use-Cases. Bei finaler Verabschiedung: Fristen dort anpassen.',
      en:
        'Affects deadline information in the roadmap generator and governance decision tree ' +
        'for high-risk use cases. Upon final adoption: update deadlines accordingly.',
    },
    sourceUrl: 'https://www.insideglobaltech.com/2026/05/28/eu-ai-act-update-timeline-relief-targeted-simplification-and-new-prohibitions/',
    lastChecked: '2026-07-07',
    deadline: '2027-12-01',
  },
  {
    id: 'bdsg_dsb_threshold',
    title:  {
      de: 'BDSG: Mögliche Lockerung der DSB-Bestellpflicht',
      en: 'BDSG: Possible relaxation of the DPO appointment obligation',
    },
    status: 'angekuendigt',
    summary: {
      de:
        'Koalitionsausschuss kündigte am 2. Juli 2026 ein Reformpaket an, das die ' +
        'deutsche 20-Personen-Sonderschwelle für die DSB-Bestellpflicht auf ' +
        'DSGVO-Niveau (Art. 37) zurückführen könnte. Bislang nur Ankündigung, kein ' +
        'Gesetzentwurf.',
      en:
        'The coalition committee announced on 2 July 2026 a reform package that could bring the ' +
        'German 20-person special threshold for the DPO appointment obligation back to ' +
        'GDPR level (Art. 37). So far only an announcement, no draft legislation.',
    },
    potentialImpact: {
      de:
        'Falls verabschiedet: DSB-Pflicht-Check in der DSGVO-Checkliste für kleinere ' +
        'Kunden anpassen — Schwellenwert-Logik im Compliance Center betroffen.',
      en:
        'If adopted: adjust the DPO obligation check in the GDPR checklist for smaller ' +
        'customers — threshold logic in the Compliance Center affected.',
    },
    sourceUrl: 'https://www.datenschutz-nordost.de/reformpaket-der-bundesregierung/',
    lastChecked: '2026-07-07',
  },
  {
    id: 'breach_96h_single_entry',
    title:  {
      de: 'Meldefrist für Datenschutzverletzungen: 96h + zentraler Meldepunkt',
      en: 'Data breach notification deadline: 96h + central single entry point',
    },
    status: 'in_gesetzgebung',
    summary: {
      de:
        'Digital-Omnibus-Vorschlag verlängert die Meldefrist von 72 auf 96 Stunden ' +
        'und plant einen zentralen „Single Entry Point" für Meldungen aus NIS-2, ' +
        'DSGVO, DORA, eIDAS und CRA.',
      en:
        'Digital Omnibus proposal extends the notification deadline from 72 to 96 hours ' +
        'and plans a central "Single Entry Point" for notifications under NIS-2, ' +
        'GDPR, DORA, eIDAS and CRA.',
    },
    potentialImpact: {
      de:
        'Betrifft die Eskalationspfade und Fristangaben im Governance-Modul ' +
        '(Auslöser „Datenpanne" — aktuell 72h/DSGVO hinterlegt).',
      en:
        'Affects the escalation paths and deadline information in the Governance module ' +
        '(trigger "data breach" — currently set to 72h/GDPR).',
    },
    sourceUrl: 'https://caralegal.eu/blog/datenschutz-2026-trends/',
    lastChecked: '2026-07-07',
  },
]

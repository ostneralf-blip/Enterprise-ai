// Content data for the 7 public BOFU tool landing pages (/tools/{slug} + EN).
// Buy-intent oriented (Issue #221, Stufe 3 aus docs/design/seo-geo-konzept.md).
// Long-form marketing content — bewusst getrennt von messages/*.json (kurze UI-Strings),
// analog zu leitfaden-data.ts. Bi-Typ + AMAZON_BOOK_URL werden wiederverwendet.

import { type Bi, AMAZON_BOOK_URL } from './leitfaden-data'

export type { Bi }
export { AMAZON_BOOK_URL }

export interface ToolFaq {
  q: Bi
  a: Bi
}

export interface ToolLanding {
  slug: string
  /** App-Route hinter Auth — als „Tool öffnen"-Ziel (leitet Nicht-Eingeloggte auf /register). */
  appHref: string
  icon: string
  eyebrow: Bi
  navLabel: Bi
  title: Bi
  metaDescription: Bi
  /** Kaufabsicht-Keywords (DE-first) — für <meta keywords> + Dokumentation. */
  keywords: Bi
  problemHook: Bi
  whatYouGet: Bi[]
  free: Bi[]
  pro: Bi[]
  /** Feature-Liste für SoftwareApplication-JSON-LD. */
  featureList: Bi[]
  faq: ToolFaq[]
  /** 2 passende Leitfaden-Guides (interne Verlinkung Hub ↔ Tools ↔ Landing). */
  relatedGuideSlugs: string[]
  /** Optionaler realer Screenshot (Data-URI oder /public-Pfad). Ohne: gebrandeter Platzhalter. */
  screenshot?: string
}

export const TOOLS: ToolLanding[] = [
  // ─── 1. AI-Readiness Assessment ──────────────────────────────────────────
  {
    slug: 'ai-readiness-assessment',
    appHref: '/assessment',
    icon: '◎',
    eyebrow: { de: 'AI-Readiness', en: 'AI Readiness' },
    navLabel: { de: 'AI-Readiness Assessment', en: 'AI Readiness Assessment' },
    title: {
      de: 'AI-Readiness Assessment — kostenlos Ihren KI-Reifegrad bestimmen',
      en: 'AI Readiness Assessment — Measure Your AI Maturity for Free',
    },
    metaDescription: {
      de: 'Bestimmen Sie in wenigen Minuten Ihren KI-Reifegrad über 6 Dimensionen und erhalten Sie Ihren Archetyp (Starter, Scaler, Transformer) mit konkreten nächsten Schritten. Kostenlos, ohne Beratung.',
      en: 'Determine your AI maturity across 6 dimensions in minutes and get your archetype (Starter, Scaler, Transformer) with concrete next steps. Free, no consulting required.',
    },
    keywords: {
      de: 'AI Readiness Assessment kostenlos, KI Reifegrad Test, AI Maturity Assessment, KI Readiness Check',
      en: 'AI readiness assessment free, AI maturity test, AI readiness check, AI maturity assessment',
    },
    problemHook: {
      de: 'Die meisten KI-Vorhaben scheitern nicht an der Technik, sondern an fehlender Reife bei Daten, Skills, Governance und Strategie. Ohne ehrliche Standortbestimmung investieren Sie in Use Cases, für die Ihre Organisation noch nicht bereit ist.',
      en: 'Most AI initiatives fail not because of technology but because of missing maturity in data, skills, governance and strategy. Without an honest baseline you invest in use cases your organization is not ready for.',
    },
    whatYouGet: [
      { de: 'Reifegrad-Score über 6 Dimensionen (Daten, Skills, Governance, Technik, Strategie, Kultur)', en: 'A maturity score across 6 dimensions (data, skills, governance, technology, strategy, culture)' },
      { de: 'Ihren Archetyp — Starter, Scaler oder Transformer — als Grundlage für alle weiteren Empfehlungen', en: 'Your archetype — Starter, Scaler or Transformer — as the basis for all further recommendations' },
      { de: 'Eine konkrete Handlungsempfehlung je schwacher Dimension statt allgemeiner Ratschläge', en: 'A concrete recommendation per weak dimension instead of generic advice' },
      { de: 'Eine belastbare Ausgangsbasis, auf der Canvas, Scoring und Roadmap automatisch aufbauen', en: 'A solid baseline that canvas, scoring and roadmap build on automatically' },
    ],
    free: [
      { de: 'Vollständiges Assessment & Archetyp-Ergebnis', en: 'Full assessment & archetype result' },
      { de: 'Handlungsempfehlung je Dimension', en: 'Recommendation per dimension' },
      { de: 'Ergebnis speichern (limitiert pro Tag)', en: 'Save result (limited per day)' },
    ],
    pro: [
      { de: 'Ergebnis speichern & versionieren', en: 'Save & version your result' },
      { de: 'PDF-Report im MERIDIAN-Design', en: 'PDF report in MERIDIAN design' },
      { de: 'Verlauf & Vergleich über die Zeit', en: 'History & comparison over time' },
    ],
    featureList: [
      { de: '6-Dimensionen-Reifegradmodell', en: '6-dimension maturity model' },
      { de: 'Archetyp-Bestimmung', en: 'Archetype determination' },
      { de: 'Dimensions-Empfehlungen', en: 'Dimension recommendations' },
      { de: 'PDF-Export', en: 'PDF export' },
    ],
    faq: [
      {
        q: { de: 'Ist das AI-Readiness Assessment wirklich kostenlos?', en: 'Is the AI readiness assessment really free?' },
        a: { de: 'Ja. Das vollständige Assessment inklusive Archetyp und Empfehlungen nutzen Sie mit einem kostenlosen Konto. Ergebnisse können Sie auch mit Free speichern (limitierte Anzahl pro Tag); PDF-Export und Verlauf sind Pro-Funktionen.', en: 'Yes. You use the full assessment including archetype and recommendations with a free account. You can also save results on Free (a limited number per day); PDF export and history are Pro features.' },
      },
      {
        q: { de: 'Wie lange dauert das Assessment?', en: 'How long does the assessment take?' },
        a: { de: 'Für den vollständigen Durchlauf mit 42 Fragen planen Sie rund 10–15 Minuten ein. Pro-Nutzer können optional eine 16-Fragen-Kurzversion wählen.', en: 'Plan around 10–15 minutes for the full 42-question run. Pro users can optionally choose a 16-question short version.' },
      },
      {
        q: { de: 'Ersetzt das eine Beratung?', en: 'Does this replace consulting?' },
        a: { de: 'Nein. Das Assessment liefert eine strukturierte Standortbestimmung als Grundlage für interne Entscheidungen — keine Rechts- oder Unternehmensberatung.', en: 'No. The assessment provides a structured baseline for internal decisions — not legal or management consulting.' },
      },
    ],
    relatedGuideSlugs: ['warum-ai-projekte-scheitern', 'ai-readiness-quick-scan'],
  },

  // ─── 2. AI Use-Case Canvas ───────────────────────────────────────────────
  {
    slug: 'ai-use-case-canvas',
    appHref: '/canvas',
    icon: '□',
    eyebrow: { de: 'Use-Case-Design', en: 'Use-Case Design' },
    navLabel: { de: 'AI Use-Case Canvas', en: 'AI Use-Case Canvas' },
    title: {
      de: 'AI Use-Case Canvas — Ihren KI-Anwendungsfall strukturiert dokumentieren',
      en: 'AI Use-Case Canvas — Document Your AI Use Case in a Structured Way',
    },
    metaDescription: {
      de: 'Beschreiben Sie Ihren KI-Use-Case entlang von Nutzen, Daten, Risiken und Komponenten in einer klaren Vorlage — inklusive automatischer Komponentenerkennung und Compliance-Einordnung.',
      en: 'Describe your AI use case along value, data, risks and components in a clear template — including automatic component detection and compliance classification.',
    },
    keywords: {
      de: 'AI Use Case Canvas Vorlage, KI Anwendungsfall dokumentieren, AI Value Canvas, KI Use Case Template',
      en: 'AI use case canvas template, document AI use case, AI value canvas, AI use case template',
    },
    problemHook: {
      de: 'KI-Ideen leben oft nur in Köpfen und Präsentationen — ohne gemeinsame Struktur reden Fachbereich, IT und Compliance aneinander vorbei. Ein Canvas macht Nutzen, Daten, Risiken und benötigte Komponenten für alle sichtbar.',
      en: 'AI ideas often live only in heads and slide decks — without a shared structure, business, IT and compliance talk past each other. A canvas makes value, data, risks and required components visible to everyone.',
    },
    whatYouGet: [
      { de: 'Eine klare Vorlage vom Problem über Nutzen und Daten bis zu Risiken und Erfolgskriterien', en: 'A clear template from problem to value, data, risks and success criteria' },
      { de: 'Automatische Erkennung genutzter Technologien und Komponenten aus Ihrer Beschreibung', en: 'Automatic detection of technologies and components from your description' },
      { de: 'Eine erste Compliance-Einordnung nach EU AI Act (7 Kategorien)', en: 'A first compliance classification under the EU AI Act (7 categories)' },
      { de: 'Eine Basis, die Scoring, Governance und Architektur direkt weiterverwenden', en: 'A basis that scoring, governance and architecture reuse directly' },
    ],
    free: [
      { de: 'Canvas vollständig ausfüllen', en: 'Fill in the full canvas' },
      { de: 'Komponenten- & Compliance-Erkennung', en: 'Component & compliance detection' },
      { de: 'Canvas speichern (limitiert pro Tag)', en: 'Save canvas (limited per day)' },
    ],
    pro: [
      { de: 'Canvas speichern & versionieren', en: 'Save & version your canvas' },
      { de: 'PDF-Export & Sharing-Link', en: 'PDF export & sharing link' },
      { de: 'Mehrere Canvases verwalten', en: 'Manage multiple canvases' },
    ],
    featureList: [
      { de: 'Strukturierte Use-Case-Vorlage', en: 'Structured use-case template' },
      { de: 'Automatische Komponentenerkennung', en: 'Automatic component detection' },
      { de: 'EU-AI-Act-Einordnung', en: 'EU AI Act classification' },
      { de: 'PDF-Export & Sharing', en: 'PDF export & sharing' },
    ],
    faq: [
      {
        q: { de: 'Wofür brauche ich ein AI Use-Case Canvas?', en: 'Why do I need an AI use-case canvas?' },
        a: { de: 'Um eine KI-Idee bewertbar und umsetzbar zu machen: Das Canvas hält Nutzen, Daten, Risiken und Komponenten so fest, dass Fachbereich, IT und Compliance auf derselben Grundlage arbeiten.', en: 'To make an AI idea assessable and actionable: the canvas captures value, data, risks and components so that business, IT and compliance work from the same basis.' },
      },
      {
        q: { de: 'Erkennt das Canvas automatisch Technologien?', en: 'Does the canvas detect technologies automatically?' },
        a: { de: 'Ja. Aus Ihrer Beschreibung erkennt das Canvas genutzte Komponenten und Anbieter und ordnet sie ein — das speist später den Architektur-Generator.', en: 'Yes. From your description the canvas detects components and vendors and classifies them — this later feeds the architecture generator.' },
      },
      {
        q: { de: 'Kann ich mehrere Use Cases dokumentieren?', en: 'Can I document multiple use cases?' },
        a: { de: 'Ja. Mit einem Pro-Konto verwalten und vergleichen Sie beliebig viele Canvases; kostenlos füllen Sie ein Canvas vollständig aus.', en: 'Yes. With a Pro account you manage and compare any number of canvases; for free you fill in one canvas completely.' },
      },
    ],
    relatedGuideSlugs: ['ai-business-case', 'ai-reifegrad-starter-scaler-transformer'],
  },

  // ─── 3. Use-Case Scoring ─────────────────────────────────────────────────
  {
    slug: 'use-case-scoring',
    appHref: '/usecase',
    icon: '◐',
    eyebrow: { de: 'Priorisierung', en: 'Prioritization' },
    navLabel: { de: 'Use-Case Scoring', en: 'Use-Case Scoring' },
    title: {
      de: 'Use-Case Scoring — KI-Anwendungsfälle objektiv priorisieren',
      en: 'Use-Case Scoring — Prioritize AI Use Cases Objectively',
    },
    metaDescription: {
      de: 'Priorisieren Sie Ihre KI-Use-Cases nach Nutzen, Machbarkeit, Daten, Risiko und strategischem Fit — mit gewichtetem Scoring und einer klaren Rangfolge statt Bauchgefühl.',
      en: 'Prioritize your AI use cases by value, feasibility, data, risk and strategic fit — with weighted scoring and a clear ranking instead of gut feeling.',
    },
    keywords: {
      de: 'KI Use Case priorisieren Vorlage, AI Use Case Scoring Tool, KI Anwendungsfälle bewerten, AI Priorisierung',
      en: 'prioritize AI use cases, AI use case scoring tool, evaluate AI use cases, AI prioritization',
    },
    problemHook: {
      de: 'Zu viele KI-Ideen, zu wenig Kapazität: Ohne objektive Kriterien gewinnt der lauteste Stakeholder, nicht der wertvollste Use Case. Ein gewichtetes Scoring macht Priorisierung nachvollziehbar und verteidigbar.',
      en: 'Too many AI ideas, too little capacity: without objective criteria the loudest stakeholder wins, not the most valuable use case. Weighted scoring makes prioritization transparent and defensible.',
    },
    whatYouGet: [
      { de: 'Bewertung je Use Case über fünf Kriterien: Nutzen, Machbarkeit, Datenreife, Risiko und strategischer Fit', en: 'Scoring per use case across five criteria: value, feasibility, data readiness, risk and strategic fit' },
      { de: 'Eine gewichtete Rangfolge Ihres gesamten Use-Case-Portfolios', en: 'A weighted ranking of your entire use-case portfolio' },
      { de: 'Eine nachvollziehbare Entscheidungsgrundlage für Steering und Budget', en: 'A transparent decision basis for steering and budget' },
      { de: 'Den Top-Kandidaten, der direkt in Governance-Check und Roadmap übernommen wird', en: 'The top candidate that flows directly into governance check and roadmap' },
    ],
    free: [
      { de: 'Use Cases erfassen & bewerten', en: 'Capture & score use cases' },
      { de: 'Gewichtete Rangfolge', en: 'Weighted ranking' },
      { de: 'Portfolio speichern (limitiert pro Tag)', en: 'Save portfolio (limited per day)' },
    ],
    pro: [
      { de: 'Portfolio speichern & versionieren', en: 'Save & version your portfolio' },
      { de: 'PDF-Report & Sharing', en: 'PDF report & sharing' },
      { de: 'Portfolio-Matrix im Report', en: 'Portfolio matrix in the report' },
    ],
    featureList: [
      { de: '5-Kriterien-Scoring-Modell', en: '5-criteria scoring model' },
      { de: 'Gewichtete Priorisierung', en: 'Weighted prioritization' },
      { de: 'Portfolio-Rangfolge', en: 'Portfolio ranking' },
      { de: 'PDF-Export', en: 'PDF export' },
    ],
    faq: [
      {
        q: { de: 'Nach welchen Kriterien wird bewertet?', en: 'Which criteria are used for scoring?' },
        a: { de: 'Nach Nutzen, Machbarkeit, Datenreife, Risiko und strategischem Fit. Die Gewichtung ergibt einen vergleichbaren Score je Use Case.', en: 'Value, feasibility, data readiness, risk and strategic fit. The weighting yields a comparable score per use case.' },
      },
      {
        q: { de: 'Kann ich ein ganzes Portfolio vergleichen?', en: 'Can I compare a whole portfolio?' },
        a: { de: 'Ja. Sie erfassen beliebig viele Use Cases und erhalten eine gewichtete Rangfolge; im Pro-Report zusätzlich eine Portfolio-Matrix.', en: 'Yes. You capture any number of use cases and get a weighted ranking; the Pro report additionally includes a portfolio matrix.' },
      },
      {
        q: { de: 'Was passiert mit dem Top-Use-Case?', en: 'What happens to the top use case?' },
        a: { de: 'Er wird automatisch für den Governance-Check und die Roadmap vorgeschlagen — die Werkzeuge bauen aufeinander auf.', en: 'It is automatically suggested for the governance check and the roadmap — the tools build on each other.' },
      },
    ],
    relatedGuideSlugs: ['ai-business-case', 'warum-ai-projekte-scheitern'],
  },

  // ─── 4. Governance-Check ─────────────────────────────────────────────────
  {
    slug: 'governance-check',
    appHref: '/governance',
    icon: '⬣',
    eyebrow: { de: 'Governance', en: 'Governance' },
    navLabel: { de: 'Governance-Check', en: 'Governance Check' },
    title: {
      de: 'AI Governance Check — KI-Use-Cases auf DSGVO & EU AI Act prüfen',
      en: 'AI Governance Check — Assess AI Use Cases for GDPR & the EU AI Act',
    },
    metaDescription: {
      de: 'Prüfen Sie Ihren KI-Use-Case entlang von 6 ethischen und rechtlichen Gates — von der Rechtmäßigkeit der Datenverarbeitung bis zu Transparenz und Risikomanagement. Fundierte Orientierung für interne Freigaben.',
      en: 'Assess your AI use case along 6 ethical and legal gates — from lawfulness of data processing to transparency and risk management. Solid orientation for internal approvals.',
    },
    keywords: {
      de: 'AI Governance Check DSGVO, KI Governance Tool, EU AI Act Prüfung, KI Freigabe Prozess',
      en: 'AI governance check GDPR, AI governance tool, EU AI Act assessment, AI approval process',
    },
    problemHook: {
      de: 'Ob ein KI-Use-Case live gehen darf, entscheidet sich an Datenschutz, Transparenz und Risiko — nicht am Modell. Ohne strukturierte Prüfung riskieren Sie Stopp-Schilder erst kurz vor dem Go-Live.',
      en: 'Whether an AI use case may go live is decided by data protection, transparency and risk — not by the model. Without a structured check you risk stop signs only shortly before go-live.',
    },
    whatYouGet: [
      { de: 'Eine strukturierte Prüfung über 6 ethische und rechtliche Gates', en: 'A structured assessment across 6 ethical and legal gates' },
      { de: 'Ein klares Verdikt: Freigabe, Nachbessern oder Stopp — mit Begründung je Gate', en: 'A clear verdict: approve, improve or stop — with a rationale per gate' },
      { de: 'Verknüpfung mit Ihrem Use Case und der Compliance-Risikoklasse', en: 'A link to your use case and the compliance risk class' },
      { de: 'Eine dokumentierte Grundlage für interne Freigabeprozesse', en: 'A documented basis for internal approval processes' },
    ],
    free: [
      { de: 'Vollständiger Governance-Check', en: 'Full governance check' },
      { de: 'Verdikt & Gate-Begründung', en: 'Verdict & gate rationale' },
      { de: 'Ergebnis speichern (limitiert pro Tag)', en: 'Save result (limited per day)' },
    ],
    pro: [
      { de: 'Ergebnis speichern & versionieren', en: 'Save & version your result' },
      { de: 'PDF-Report & Sharing', en: 'PDF report & sharing' },
      { de: 'RACI-Verantwortlichkeiten', en: 'RACI responsibilities' },
    ],
    featureList: [
      { de: '6-Gate-Prüfmodell', en: '6-gate assessment model' },
      { de: 'DSGVO- & EU-AI-Act-Bezug', en: 'GDPR & EU AI Act reference' },
      { de: 'Freigabe-Verdikt', en: 'Approval verdict' },
      { de: 'PDF-Export', en: 'PDF export' },
    ],
    faq: [
      {
        q: { de: 'Ist der Governance-Check eine Rechtsberatung?', en: 'Is the governance check legal advice?' },
        a: { de: 'Nein. Er liefert eine fundierte, strukturierte Orientierung für interne Freigabeprozesse — keine Rechtsberatung.', en: 'No. It provides solid, structured orientation for internal approval processes — not legal advice.' },
      },
      {
        q: { de: 'Welche Gates werden geprüft?', en: 'Which gates are assessed?' },
        a: { de: 'Sechs Gates von der Rechtmäßigkeit der Datenverarbeitung über Transparenz und Fairness bis zu Risiko- und Verantwortungsmanagement.', en: 'Six gates from lawfulness of data processing through transparency and fairness to risk and accountability management.' },
      },
      {
        q: { de: 'Hängt das mit meinem Compliance-Check zusammen?', en: 'Is this connected to my compliance check?' },
        a: { de: 'Ja. Der Governance-Check berücksichtigt die im Compliance Center bestimmte Risikoklasse und Ihren Use Case.', en: 'Yes. The governance check takes the risk class determined in the Compliance Center and your use case into account.' },
      },
    ],
    relatedGuideSlugs: ['ai-governance-aufbauen', 'governance-entscheidungsbaum'],
  },

  // ─── 5. Roadmap-Generator ────────────────────────────────────────────────
  {
    slug: 'roadmap-generator',
    appHref: '/roadmap',
    icon: '▷',
    eyebrow: { de: 'Umsetzung', en: 'Execution' },
    navLabel: { de: 'Roadmap-Generator', en: 'Roadmap Generator' },
    title: {
      de: 'AI Roadmap Generator — Ihre KI-Umsetzung in Phasen planen',
      en: 'AI Roadmap Generator — Plan Your AI Execution in Phases',
    },
    metaDescription: {
      de: 'Erzeugen Sie aus Ihrem Reifegrad und Ihren priorisierten Use Cases eine phasenbasierte KI-Roadmap mit Maßnahmen, KPIs und Meilensteinen — statt einer leeren Vorlage.',
      en: 'Generate a phased AI roadmap with measures, KPIs and milestones from your maturity and prioritized use cases — instead of an empty template.',
    },
    keywords: {
      de: 'KI Roadmap Vorlage, AI Roadmap Generator, KI Umsetzungsplan, AI Transformation Roadmap',
      en: 'AI roadmap template, AI roadmap generator, AI implementation plan, AI transformation roadmap',
    },
    problemHook: {
      de: 'Eine KI-Strategie ohne Umsetzungsplan bleibt eine Absichtserklärung. Der Sprung von „wir sollten KI nutzen" zu konkreten, terminierten Maßnahmen ist genau die Stelle, an der die meisten Initiativen stecken bleiben.',
      en: 'An AI strategy without an execution plan stays a statement of intent. The jump from "we should use AI" to concrete, scheduled measures is exactly where most initiatives get stuck.',
    },
    whatYouGet: [
      { de: 'Eine phasenbasierte Roadmap, abgeleitet aus Ihrem Archetyp und Reifegrad', en: 'A phased roadmap derived from your archetype and maturity' },
      { de: 'Konkrete Maßnahmen, KPIs und Meilensteine je Phase statt einer leeren Vorlage', en: 'Concrete measures, KPIs and milestones per phase instead of an empty template' },
      { de: 'Governance-Badges an den Use Cases, die eine Freigabe brauchen', en: 'Governance badges on the use cases that need approval' },
      { de: 'Einen Fortschritts-Überblick, den Sie über die Zeit fortschreiben', en: 'A progress overview you keep updating over time' },
    ],
    free: [
      { de: 'Roadmap generieren & anpassen', en: 'Generate & adjust your roadmap' },
      { de: 'Maßnahmen, KPIs & Meilensteine', en: 'Measures, KPIs & milestones' },
      { de: 'Roadmap speichern (limitiert pro Tag)', en: 'Save roadmap (limited per day)' },
    ],
    pro: [
      { de: 'Roadmap speichern & versionieren', en: 'Save & version your roadmap' },
      { de: 'Versionsvergleich (Diff)', en: 'Version comparison (diff)' },
      { de: 'PDF-Report & Sharing', en: 'PDF report & sharing' },
    ],
    featureList: [
      { de: 'Archetyp-basierte Phasenplanung', en: 'Archetype-based phase planning' },
      { de: 'Maßnahmen, KPIs & Meilensteine', en: 'Measures, KPIs & milestones' },
      { de: 'Versionsvergleich', en: 'Version comparison' },
      { de: 'PDF-Export', en: 'PDF export' },
    ],
    faq: [
      {
        q: { de: 'Woraus wird die Roadmap erzeugt?', en: 'What is the roadmap generated from?' },
        a: { de: 'Aus Ihrem Archetyp und Reifegrad sowie Ihren priorisierten Use Cases — die Roadmap ist damit auf Ihre Ausgangslage zugeschnitten, nicht generisch.', en: 'From your archetype and maturity plus your prioritized use cases — so the roadmap is tailored to your situation, not generic.' },
      },
      {
        q: { de: 'Kann ich die Roadmap anpassen?', en: 'Can I adjust the roadmap?' },
        a: { de: 'Ja. Maßnahmen und Meilensteine sind editierbar; Pro-Nutzer speichern Versionen und vergleichen Änderungen über die Zeit.', en: 'Yes. Measures and milestones are editable; Pro users save versions and compare changes over time.' },
      },
      {
        q: { de: 'Enthält die Roadmap Compliance-Hinweise?', en: 'Does the roadmap include compliance hints?' },
        a: { de: 'Ja. Use Cases, die eine Governance-Freigabe brauchen, erhalten Badges — so gehen keine rechtlichen Schritte in der Planung unter.', en: 'Yes. Use cases that need governance approval get badges — so no legal steps are lost in planning.' },
      },
    ],
    relatedGuideSlugs: ['ai-reifegrad-starter-scaler-transformer', 'ai-readiness-quick-scan'],
  },

  // ─── 6. Compliance Center ────────────────────────────────────────────────
  {
    slug: 'compliance-center',
    appHref: '/compliance',
    icon: '⬡',
    eyebrow: { de: 'Compliance', en: 'Compliance' },
    navLabel: { de: 'Compliance Center', en: 'Compliance Center' },
    title: {
      de: 'EU AI Act Compliance Tool — Risikoklasse & Pflichten bestimmen',
      en: 'EU AI Act Compliance Tool — Determine Risk Class & Obligations',
    },
    metaDescription: {
      de: 'Bestimmen Sie die Risikoklasse Ihrer KI-Anwendung nach EU AI Act, prüfen Sie DSGVO- und weitere Pflichten (NIS2, ISO 27001) und verfolgen Sie Ihren Dokumentationsstand je Regulierung.',
      en: 'Determine your AI application’s risk class under the EU AI Act, check GDPR and further obligations (NIS2, ISO 27001) and track your documentation status per regulation.',
    },
    keywords: {
      de: 'EU AI Act Compliance Tool, KI Compliance Check, EU AI Act Risikoklasse, DSGVO KI Prüfung',
      en: 'EU AI Act compliance tool, AI compliance check, EU AI Act risk class, GDPR AI assessment',
    },
    problemHook: {
      de: 'Der EU AI Act bringt gestaffelte Pflichten je Risikoklasse — und die Fristen laufen. Wer nicht weiß, ob eine Anwendung als Hochrisiko gilt, plant entweder zu viel Aufwand ein oder übersieht verpflichtende Maßnahmen.',
      en: 'The EU AI Act brings staggered obligations per risk class — and the deadlines are running. Not knowing whether an application counts as high-risk means either over-planning effort or missing mandatory measures.',
    },
    whatYouGet: [
      { de: 'Die Risikoklasse Ihrer KI-Anwendung nach EU AI Act (verboten, hoch, begrenzt, minimal)', en: 'Your AI application’s risk class under the EU AI Act (prohibited, high, limited, minimal)' },
      { de: 'Aktivierbare Regulierungen: DSGVO, EU AI Act, NIS2, ISO 27001 und weitere', en: 'Activatable regulations: GDPR, EU AI Act, NIS2, ISO 27001 and more' },
      { de: 'Checklisten je Pflicht mit sichtbarem Dokumentationsstand je Regulierung', en: 'Checklists per obligation with a visible documentation status per regulation' },
      { de: 'Eine Einordnung, die in Governance-Check und Executive Summary einfließt', en: 'A classification that feeds into the governance check and executive summary' },
    ],
    free: [
      { de: 'Nur in Pro verfügbar', en: 'Available in Pro only' },
    ],
    pro: [
      { de: 'Checklisten-Fortschritt speichern', en: 'Save checklist progress' },
      { de: 'Weitere Regularien (NIS2, ISO …)', en: 'Further regulations (NIS2, ISO …)' },
      { de: 'PDF-Report je Regulierung', en: 'PDF report per regulation' },
    ],
    featureList: [
      { de: 'EU-AI-Act-Risikoklassifizierung', en: 'EU AI Act risk classification' },
      { de: 'Pflichten-Checklisten je Regulierung', en: 'Obligation checklists per regulation' },
      { de: 'Dokumentationsstand-Tracking', en: 'Documentation status tracking' },
      { de: 'PDF-Export', en: 'PDF export' },
    ],
    faq: [
      {
        q: { de: 'Bestimmt das Tool verbindlich meine EU-AI-Act-Klasse?', en: 'Does the tool bindingly determine my EU AI Act class?' },
        a: { de: 'Es liefert eine fundierte Einordnung als Orientierung für interne Entscheidungen. Die rechtsverbindliche Bewertung bleibt Sache Ihrer Rechtsfunktion.', en: 'It provides a solid classification as orientation for internal decisions. The legally binding assessment remains with your legal function.' },
      },
      {
        q: { de: 'Werden DSGVO und NIS2 mit abgedeckt?', en: 'Are GDPR and NIS2 covered too?' },
        a: { de: 'Ja. DSGVO und EU AI Act sind immer aktiv; NIS2, ISO 27001 und weitere Regularien schalten Sie bei Bedarf zu — mit eigenem Fortschritts-Tracking.', en: 'Yes. GDPR and the EU AI Act are always active; you enable NIS2, ISO 27001 and further regulations as needed — each with its own progress tracking.' },
      },
      {
        q: { de: 'Sehe ich meinen Dokumentationsfortschritt?', en: 'Can I see my documentation progress?' },
        a: { de: 'Ja. Je aktivierter Regulierung sehen Sie den erledigten Anteil der Pflichten — auch im Compliance-PDF-Report.', en: 'Yes. Per activated regulation you see the completed share of obligations — also in the compliance PDF report.' },
      },
    ],
    relatedGuideSlugs: ['eu-ai-act-risikoklassen', 'ai-governance-aufbauen'],
  },

  // ─── 7. Architektur-Generator ────────────────────────────────────────────
  {
    slug: 'architektur-generator',
    appHref: '/architecture',
    icon: '◈',
    eyebrow: { de: 'Architektur', en: 'Architecture' },
    navLabel: { de: 'Architektur-Generator', en: 'Architecture Generator' },
    title: {
      de: 'Enterprise-AI-Architektur-Generator — Referenzarchitektur mit SAP-Fokus',
      en: 'Enterprise AI Architecture Generator — Reference Architecture with SAP Focus',
    },
    metaDescription: {
      de: 'Übersetzen Sie Ihren Use Case in eine herstellerneutrale KI-Referenzarchitektur — mit 5-Band-Landkarte, Komponenten-Empfehlungen, Konflikterkennung und Compliance-Voreinstellung.',
      en: 'Translate your use case into a vendor-neutral AI reference architecture — with a 5-band map, component recommendations, conflict detection and compliance defaults.',
    },
    keywords: {
      de: 'KI-Referenzarchitektur SAP, Enterprise AI Architektur Generator, KI Architektur Vorlage, AI Reference Architecture',
      en: 'AI reference architecture SAP, enterprise AI architecture generator, AI architecture template, AI reference architecture',
    },
    problemHook: {
      de: 'Zwischen Use Case und lauffähiger KI-Lösung liegt die Architektur — Daten, Modelle, Serving, MLOps, Anwendung, Sicherheit und Governance müssen zusammenpassen. Ohne Referenz landen Teams bei zufälligen Tool-Stacks mit versteckten Konflikten.',
      en: 'Between the use case and a running AI solution lies the architecture — data, models, serving, MLOps, application, security and governance must fit together. Without a reference, teams end up with random tool stacks and hidden conflicts.',
    },
    whatYouGet: [
      { de: 'Eine herstellerneutrale Referenzarchitektur als 5-Band-Landkarte', en: 'A vendor-neutral reference architecture as a 5-band map' },
      { de: 'Komponenten-Empfehlungen inklusive SAP-Fokus und Konflikterkennung', en: 'Component recommendations including SAP focus and conflict detection' },
      { de: 'Eine Compliance-Voreinstellung, abgeleitet aus Ihrer Risikoklasse', en: 'A compliance default derived from your risk class' },
      { de: 'Eine KI-Einordnung mit grobem Investitionsrahmen und Empfehlung für die Entscheidung', en: 'An AI assessment with a rough investment frame and a recommendation for the decision' },
    ],
    free: [
      { de: 'Nur in Pro verfügbar', en: 'Available in Pro only' },
    ],
    pro: [
      { de: 'Architektur speichern & versionieren', en: 'Save & version your architecture' },
      { de: 'KI-Einordnung & Investitionsrahmen', en: 'AI assessment & investment frame' },
      { de: 'PDF-Report & Sharing', en: 'PDF report & sharing' },
    ],
    featureList: [
      { de: '5-Band-Architektur-Landkarte', en: '5-band architecture map' },
      { de: 'Komponenten-Empfehlungen (SAP-Fokus)', en: 'Component recommendations (SAP focus)' },
      { de: 'Konflikt- & Kompatibilitätserkennung', en: 'Conflict & compatibility detection' },
      { de: 'PDF-Export', en: 'PDF export' },
    ],
    faq: [
      {
        q: { de: 'Ist die Architektur an einen Anbieter gebunden?', en: 'Is the architecture tied to one vendor?' },
        a: { de: 'Nein. Die Referenzarchitektur ist herstellerneutral; auf Wunsch legt der Generator einen SAP-Fokus, ohne Sie darauf festzulegen.', en: 'No. The reference architecture is vendor-neutral; on request the generator applies an SAP focus without locking you in.' },
      },
      {
        q: { de: 'Erkennt der Generator Konflikte zwischen Komponenten?', en: 'Does the generator detect conflicts between components?' },
        a: { de: 'Ja. Inkompatible, sich voraussetzende oder empfohlene Komponenten werden markiert — inklusive Badges in der Landkarte.', en: 'Yes. Incompatible, required or recommended components are flagged — including badges on the map.' },
      },
      {
        q: { de: 'Baut die Architektur auf meinen anderen Ergebnissen auf?', en: 'Does the architecture build on my other results?' },
        a: { de: 'Ja. Assessment, Governance, Canvas und Compliance-Risikoklasse fließen ein — die Architektur ist auf Ihren Kontext zugeschnitten.', en: 'Yes. Assessment, governance, canvas and the compliance risk class feed in — the architecture is tailored to your context.' },
      },
    ],
    relatedGuideSlugs: ['8-architekturprinzipien', 'ai-business-case'],
  },
]

export function getTool(slug: string): ToolLanding | undefined {
  return TOOLS.find((t) => t.slug === slug)
}

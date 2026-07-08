import type { LocaleString } from '@/lib/utils/locale-data'

export interface ChangelogFeature {
  title: LocaleString
  description: LocaleString
  bookContext: LocaleString
}

export interface ChangelogEntry {
  version: string
  date: LocaleString
  label: LocaleString
  features: ChangelogFeature[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.5.0',
    date: { de: '3. Juli 2026', en: 'July 3, 2026' },
    label: { de: 'Katalog-Management', en: 'Catalog Management' },
    features: [
      {
        title: { de: 'Upload-Verlaufsprotokoll', en: 'Upload History Log' },
        description: {
          de: 'Jeder Katalog-Import (CSV/JSON-Upload oder Seed-Daten) wird jetzt mit Dateiname, Format, Zeilenanzahl und Zeitstempel protokolliert. Der Admin sieht eine vollständige Import-Historie.',
          en: 'Every catalog import (CSV/JSON upload or seed data) is now logged with filename, format, row count and timestamp. The admin sees a complete import history.',
        },
        bookContext: {
          de: 'Das Kapitel "AI-Komponenten-Katalog" im Enterprise AI Leitfaden beschreibt, wie Unternehmen ihren KI-Baukasten systematisch aufbauen und versionieren. Transparenz über Datenquellen und Import-Zeitpunkte ist Grundlage für einen vertrauenswürdigen Katalog.',
          en: 'The "AI Component Catalog" chapter in the Enterprise AI Guide describes how companies systematically build and version their AI toolbox. Transparency about data sources and import timestamps is the foundation of a trustworthy catalog.',
        },
      },
      {
        title: { de: 'Tag-Editor für Katalog-Komponenten', en: 'Tag Editor for Catalog Components' },
        description: {
          de: 'Admins können Katalog-Komponenten jetzt mit vordefinierten Tags versehen (z. B. "llm", "rag", "gdpr-ready") oder bestehende Tags einzeln entfernen — direkt in der Tabelle ohne Modal.',
          en: 'Admins can now label catalog components with predefined tags (e.g. "llm", "rag", "gdpr-ready") or remove existing tags individually — directly in the table without a modal.',
        },
        bookContext: {
          de: 'Tags ermöglichen die Kontextualisierung von Technologien entlang der AI-Strategie: "Ist diese Komponente für unsere SAP-Landschaft geeignet?" oder "Erfüllt sie unsere DSGVO-Anforderungen?" — Fragen, die im Buch als zentrale Entscheidungsdimensionen beim Architektur-Design beschrieben werden.',
          en: 'Tags enable contextualization of technologies along the AI strategy: "Is this component suitable for our SAP landscape?" or "Does it meet our GDPR requirements?" — questions the book describes as central decision dimensions in architecture design.',
        },
      },
    ],
  },
  {
    version: '0.4.3',
    date: { de: '3. Juli 2026', en: 'July 3, 2026' },
    label: { de: 'Canvas Intelligence', en: 'Canvas Intelligence' },
    features: [
      {
        title: { de: 'Katalog-Vorschläge im Canvas', en: 'Catalog Suggestions in Canvas' },
        description: {
          de: 'Das Kontextanalyse-Panel im AI Use-Case Canvas zeigt jetzt passende Katalog-Komponenten als Chips an — basierend auf der erkannten Cloud-Plattform (z. B. Azure, SAP) und dem Use-Case-Typ.',
          en: 'The context analysis panel in the AI Use-Case Canvas now shows matching catalog components as chips — based on the detected cloud platform (e.g. Azure, SAP) and use case type.',
        },
        bookContext: {
          de: 'Der "Canvas → Architektur"-Pfad ist ein Kernprinzip des Enterprise AI Leitfadens: Von der Problemdefinition (Canvas) direkt zur passenden technischen Lösung (Katalog). Kein Medienbruch zwischen Strategie und Umsetzung.',
          en: 'The "Canvas → Architecture" path is a core principle of the Enterprise AI Guide: from problem definition (Canvas) directly to the right technical solution (catalog). No gap between strategy and implementation.',
        },
      },
      {
        title: { de: 'Canvas-Kontext in Roadmap-Phasen', en: 'Canvas Context in Roadmap Phases' },
        description: {
          de: 'Wenn eine Roadmap mit einem Canvas verknüpft ist, erscheinen Problem-Statement und KPIs aus dem Canvas im Banner der Roadmap. In Phase 1 werden die Next Steps und KPIs des Canvas direkt als ergänzende Inhalte eingeblendet.',
          en: 'When a roadmap is linked to a canvas, the problem statement and KPIs from the canvas appear in the roadmap banner. In phase 1, the canvas next steps and KPIs are displayed directly as supplementary content.',
        },
        bookContext: {
          de: 'Die Roadmap ist im Buch als "lebendiges Dokument" beschrieben: Sie soll den Canvas nicht ignorieren, sondern konkretisieren. Die Verknüpfung stellt sicher, dass Roadmap-Maßnahmen immer auf das ursprüngliche Business-Problem zurückzuführen sind.',
          en: 'The roadmap is described in the book as a "living document": it should not ignore the canvas, but concretize it. The link ensures that roadmap measures can always be traced back to the original business problem.',
        },
      },
    ],
  },
  {
    version: '0.4.2',
    date: { de: '3. Juli 2026', en: 'July 3, 2026' },
    label: { de: 'Kontext-Filterung Katalog', en: 'Catalog Context Filtering' },
    features: [
      {
        title: { de: 'Architektur-Kontext filtert Katalog-Vorschläge', en: 'Architecture Context Filters Catalog Suggestions' },
        description: {
          de: 'SAP-Komponenten und Vendor-spezifische Einträge werden nur noch Nutzern vorgeschlagen, deren Architektur-Profil diese Technologien einschließt. Falsche Vorschläge (z. B. SAP Joule für reine Azure-Stacks) werden unterdrückt.',
          en: 'SAP components and vendor-specific entries are now only suggested to users whose architecture profile includes these technologies. Incorrect suggestions (e.g. SAP Joule for pure Azure stacks) are suppressed.',
        },
        bookContext: {
          de: 'Das Buch warnt vor dem "Technologie-Zoo": Zu viele Tools ohne klaren Kontext überfordern Entscheider. Kontextbewusste Filterung ist ein Qualitätsmerkmal eines reifen AI-Katalogs.',
          en: 'The book warns against the "technology zoo": too many tools without clear context overwhelm decision-makers. Context-aware filtering is a quality feature of a mature AI catalog.',
        },
      },
    ],
  },
  {
    version: '0.4.1',
    date: { de: '3. Juli 2026', en: 'July 3, 2026' },
    label: { de: 'UX-Vernetzung', en: 'UX Networking' },
    features: [
      {
        title: { de: 'Canvas-Badge in Use-Case-Liste', en: 'Canvas Badge in Use Case List' },
        description: {
          de: 'Wenn ein Use Case mit einem Canvas verknüpft ist, erscheint ein kleines Canvas-Icon in der Tabelle. So sieht man auf einen Blick, welche Use Cases bereits ausgearbeitet wurden.',
          en: 'When a use case is linked to a canvas, a small canvas icon appears in the table. This shows at a glance which use cases have already been elaborated.',
        },
        bookContext: {
          de: 'Der Leitfaden beschreibt die Use-Case-Priorisierung als ersten Schritt — der Canvas als nächste Stufe der Ausarbeitung ist der Beweis, dass ein Use Case ernst genommen wird. Die Badge-Verknüpfung macht diesen Reifegrad-Unterschied sichtbar.',
          en: 'The guide describes use case prioritization as the first step — the canvas as the next level of elaboration is proof that a use case is being taken seriously. The badge link makes this maturity difference visible.',
        },
      },
      {
        title: { de: 'Governance Quick-Start vom Use Case', en: 'Governance Quick-Start from Use Case' },
        description: {
          de: 'Ein "→ Governance"-Button im Use Case öffnet das Governance-Modul und füllt die wichtigsten Felder automatisch vor. Kein Copy-Paste zwischen Modulen.',
          en: 'A "→ Governance" button in the use case opens the governance module and automatically pre-fills the most important fields. No copy-paste between modules.',
        },
        bookContext: {
          de: '"Governance by Design, not by Accident" — das Buch fordert, dass Governance-Überlegungen so früh wie möglich in den Use-Case-Prozess integriert werden. Der direkte Link eliminiert die Ausrede "dafür war keine Zeit".',
          en: '"Governance by Design, not by Accident" — the book demands that governance considerations be integrated into the use case process as early as possible. The direct link eliminates the excuse "there was no time for that".',
        },
      },
    ],
  },
  {
    version: '0.4.0',
    date: { de: '3. Juli 2026', en: 'July 3, 2026' },
    label: { de: 'Vergleichs-Funktionen', en: 'Comparison Functions' },
    features: [
      {
        title: { de: 'Architektur-Vergleich', en: 'Architecture Comparison' },
        description: {
          de: 'Zwei gespeicherte Architektur-Ergebnisse können jetzt direkt verglichen werden: Pattern, Layer-Verteilung und Empfehlungen nebeneinander.',
          en: 'Two saved architecture results can now be compared directly: pattern, layer distribution and recommendations side by side.',
        },
        bookContext: {
          de: '"Welche Architektur passt zu uns?" ist oft keine einmalige Entscheidung. Das Buch empfiehlt, mindestens zwei Szenarien zu entwickeln und systematisch zu vergleichen — Build vs. Buy, Cloud-native vs. Hybrid.',
          en: '"Which architecture suits us?" is often not a one-time decision. The book recommends developing at least two scenarios and comparing them systematically — Build vs. Buy, Cloud-native vs. Hybrid.',
        },
      },
      {
        title: { de: 'Roadmap-Vergleich mit Phaseninhalt', en: 'Roadmap Comparison with Phase Content' },
        description: {
          de: 'Der Roadmap-Vergleich zeigt jetzt nicht nur Phasenzahlen, sondern den tatsächlichen Inhalt jeder Phase — Maßnahmen, KPIs, Rollen.',
          en: 'The roadmap comparison now shows not just phase numbers, but the actual content of each phase — measures, KPIs, roles.',
        },
        bookContext: {
          de: 'Eine Roadmap ist nur dann wertvoll, wenn sie konkrete Maßnahmen enthält. Der Vergleich auf Inhaltsebene ermöglicht eine ehrliche Bewertung: "Was unterscheidet Plan A wirklich von Plan B?"',
          en: 'A roadmap is only valuable if it contains concrete measures. Comparison at content level enables an honest assessment: "What really distinguishes Plan A from Plan B?"',
        },
      },
    ],
  },
  {
    version: '0.3.2',
    date: { de: '2. Juli 2026', en: 'July 2, 2026' },
    label: { de: 'Admin-Katalog-Upload', en: 'Admin Catalog Upload' },
    features: [
      {
        title: { de: 'CSV/JSON-Import für Komponenten-Katalog', en: 'CSV/JSON Import for Component Catalog' },
        description: {
          de: 'Der Admin kann Komponenten-Daten als CSV oder JSON hochladen. Das System erkennt automatisch SAP AI Discovery Center-Exports und mappt sie korrekt. Duplikate werden bereinigt, ein Backup der vorherigen Daten wird erstellt.',
          en: 'The admin can upload component data as CSV or JSON. The system automatically recognizes SAP AI Discovery Center exports and maps them correctly. Duplicates are cleaned up, a backup of the previous data is created.',
        },
        bookContext: {
          de: 'Der AI-Komponenten-Katalog ist der "Werkzeugkasten" des Enterprise AI Navigators. Das Buch beschreibt ihn als kuratierte, intern gepflegte Wissensbasis — kein statisches Dokument, sondern ein lebendiges System, das mit dem Markt wächst.',
          en: 'The AI component catalog is the "toolbox" of the Enterprise AI Navigator. The book describes it as a curated, internally maintained knowledge base — not a static document, but a living system that grows with the market.',
        },
      },
    ],
  },
  {
    version: '0.3.1',
    date: { de: '2. Juli 2026', en: 'July 2, 2026' },
    label: { de: 'Canvas Intelligence (Grundlage)', en: 'Canvas Intelligence (Foundation)' },
    features: [
      {
        title: { de: 'Canvas-Kontext-Analyse Bibliothek', en: 'Canvas Context Analysis Library' },
        description: {
          de: 'Eine interne Bibliothek (canvas-context.ts) analysiert Canvas-Texte und extrahiert erkannte Plattformen, Use-Case-Typen und Komplexitätsindikatoren. Basis für alle Canvas-basierten Empfehlungen.',
          en: 'An internal library (canvas-context.ts) analyzes canvas texts and extracts recognized platforms, use case types and complexity indicators. The basis for all canvas-based recommendations.',
        },
        bookContext: {
          de: 'Das Buch beschreibt den Canvas als "Brücke zwischen Business und Technik". Damit diese Brücke funktioniert, muss das System den Canvas-Inhalt verstehen — nicht nur speichern.',
          en: 'The book describes the canvas as a "bridge between business and technology". For this bridge to work, the system must understand the canvas content — not just store it.',
        },
      },
    ],
  },
  {
    version: '0.3.0',
    date: { de: '27. Juni 2026', en: 'June 27, 2026' },
    label: { de: 'Sicherheit & Executive Summary', en: 'Security & Executive Summary' },
    features: [
      {
        title: { de: 'Executive Summary PDF', en: 'Executive Summary PDF' },
        description: {
          de: 'Alle 7 Module werden in einem PDF zusammengefasst: Assessment-Ergebnis, Use-Case-Portfolio, Canvas-Details, Governance-Status, Compliance-Check, Architektur-Empfehlung und Roadmap-Phasen.',
          en: 'All 7 modules are summarized in one PDF: assessment result, use case portfolio, canvas details, governance status, compliance check, architecture recommendation and roadmap phases.',
        },
        bookContext: {
          de: 'Das Buch schließt mit einem Kapitel über "Kommunikation nach oben": Vorstände und Aufsichtsräte brauchen eine verdichtete, handlungsorientierte Zusammenfassung — kein 80-Seiten-Konzept. Das Executive Summary PDF ist genau das.',
          en: 'The book concludes with a chapter on "communicating upward": executives and boards need a condensed, action-oriented summary — not an 80-page concept. The Executive Summary PDF is exactly that.',
        },
      },
      {
        title: { de: 'User-Lock-Mechanismus', en: 'User Lock Mechanism' },
        description: {
          de: 'Gesperrte Nutzer werden nach dem Login sofort erkannt und zur Login-Seite weitergeleitet, statt Fehlermeldungen zu zeigen.',
          en: 'Locked users are immediately recognized after login and redirected to the login page, instead of showing error messages.',
        },
        bookContext: {
          de: 'Plattform-Integrität ist Voraussetzung für Vertrauen — besonders bei sensiblen Strategie-Daten.',
          en: 'Platform integrity is a prerequisite for trust — especially with sensitive strategy data.',
        },
      },
    ],
  },
  {
    version: '0.2.0',
    date: { de: '22.–24. Juni 2026', en: 'June 22–24, 2026' },
    label: { de: 'Assessment & Onboarding', en: 'Assessment & Onboarding' },
    features: [
      {
        title: { de: '42-Fragen Assessment mit L1–L5 Reifegradmodell', en: '42-Question Assessment with L1–L5 Maturity Model' },
        description: {
          de: 'Das AI-Readiness Assessment wurde von 16 auf 42 Fragen erweitert und misst jetzt 5 Reifegrade (L1 Experimentell bis L5 Transformativ) über 7 Dimensionen.',
          en: 'The AI Readiness Assessment was expanded from 16 to 42 questions and now measures 5 maturity levels (L1 Experimental to L5 Transformative) across 7 dimensions.',
        },
        bookContext: {
          de: 'Das Reifegradmodell ist das Herzstück des Enterprise AI Leitfadens. "Wo stehen wir?" ist die wichtigste Frage vor jeder AI-Investitionsentscheidung. Die 42 Fragen decken alle im Buch beschriebenen Dimensionen ab: Strategie, Daten, Technik, Prozesse, Talent, Governance und Kultur.',
          en: 'The maturity model is the centerpiece of the Enterprise AI Guide. "Where do we stand?" is the most important question before any AI investment decision. The 42 questions cover all dimensions described in the book: strategy, data, technology, processes, talent, governance and culture.',
        },
      },
      {
        title: { de: 'Geführter Onboarding-Wizard', en: 'Guided Onboarding Wizard' },
        description: {
          de: '7-stufiger geführter Pfad durch alle Module — Assessment zuerst, dann Use-Case Scoring, Canvas, Governance, Compliance, Architektur, Executive Summary. Mit Fortschrittsanzeige und Modul-Verknüpfungen.',
          en: '7-step guided path through all modules — assessment first, then use case scoring, canvas, governance, compliance, architecture, executive summary. With progress indicator and module links.',
        },
        bookContext: {
          de: 'Das Buch empfiehlt einen strukturierten "30-Tage-Aktionsplan" für die AI-Strategieentwicklung. Der Guided Path ist die digitale Umsetzung dieses Plans: kein Modul steht allein, jedes Ergebnis fließt in das nächste.',
          en: 'The book recommends a structured "30-day action plan" for AI strategy development. The Guided Path is the digital implementation of this plan: no module stands alone, every result flows into the next.',
        },
      },
    ],
  },
  {
    version: '0.1.0',
    date: { de: '20.–21. Juni 2026', en: 'June 20–21, 2026' },
    label: { de: 'Produktions-Launch', en: 'Production Launch' },
    features: [
      {
        title: { de: 'Erste produktionsreife Version', en: 'First production-ready version' },
        description: {
          de: 'Auth (E-Mail + Passwort), 7 Module (Assessment, Use-Case, Canvas, Governance, Compliance, Architektur, Roadmap), Tier-System (Free/Pro/Enterprise), Stripe-Anbindung, PDF-Export, RLS-Sicherheit, Vercel-Deployment.',
          en: 'Auth (email + password), 7 modules (Assessment, Use Case, Canvas, Governance, Compliance, Architecture, Roadmap), tier system (Free/Pro/Enterprise), Stripe integration, PDF export, RLS security, Vercel deployment.',
        },
        bookContext: {
          de: 'Enterprise AI Navigator ist die digitale Begleitung zum Enterprise AI Leitfaden von Daniel Ostner. Das Buch beschreibt den strategischen Rahmen — die Plattform macht ihn interaktiv, messbar und exportierbar.',
          en: 'Enterprise AI Navigator is the digital companion to the Enterprise AI Guide by Daniel Ostner. The book describes the strategic framework — the platform makes it interactive, measurable and exportable.',
        },
      },
    ],
  },
]

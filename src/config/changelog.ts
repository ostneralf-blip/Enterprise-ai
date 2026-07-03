export interface ChangelogFeature {
  title: string
  description: string
  bookContext: string
}

export interface ChangelogEntry {
  version: string
  date: string
  label: string
  features: ChangelogFeature[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.5.0',
    date: '3. Juli 2026',
    label: 'Katalog-Management',
    features: [
      {
        title: 'Upload-Verlaufsprotokoll',
        description: 'Jeder Katalog-Import (CSV/JSON-Upload oder Seed-Daten) wird jetzt mit Dateiname, Format, Zeilenanzahl und Zeitstempel protokolliert. Der Admin sieht eine vollständige Import-Historie.',
        bookContext: 'Das Kapitel "AI-Komponenten-Katalog" im Enterprise AI Leitfaden beschreibt, wie Unternehmen ihren KI-Baukasten systematisch aufbauen und versionieren. Transparenz über Datenquellen und Import-Zeitpunkte ist Grundlage für einen vertrauenswürdigen Katalog.',
      },
      {
        title: 'Tag-Editor für Katalog-Komponenten',
        description: 'Admins können Katalog-Komponenten jetzt mit vordefinierten Tags versehen (z. B. "llm", "rag", "gdpr-ready") oder bestehende Tags einzeln entfernen — direkt in der Tabelle ohne Modal.',
        bookContext: 'Tags ermöglichen die Kontextualisierung von Technologien entlang der AI-Strategie: "Ist diese Komponente für unsere SAP-Landschaft geeignet?" oder "Erfüllt sie unsere DSGVO-Anforderungen?" — Fragen, die im Buch als zentrale Entscheidungsdimensionen beim Architektur-Design beschrieben werden.',
      },
    ],
  },
  {
    version: '0.4.3',
    date: '3. Juli 2026',
    label: 'Canvas Intelligence',
    features: [
      {
        title: 'Katalog-Vorschläge im Canvas',
        description: 'Das Kontextanalyse-Panel im AI Use-Case Canvas zeigt jetzt passende Katalog-Komponenten als Chips an — basierend auf der erkannten Cloud-Plattform (z. B. Azure, SAP) und dem Use-Case-Typ.',
        bookContext: 'Der "Canvas → Architektur"-Pfad ist ein Kernprinzip des Enterprise AI Leitfadens: Von der Problemdefinition (Canvas) direkt zur passenden technischen Lösung (Katalog). Kein Medienbruch zwischen Strategie und Umsetzung.',
      },
      {
        title: 'Canvas-Kontext in Roadmap-Phasen',
        description: 'Wenn eine Roadmap mit einem Canvas verknüpft ist, erscheinen Problem-Statement und KPIs aus dem Canvas im Banner der Roadmap. In Phase 1 werden die Next Steps und KPIs des Canvas direkt als ergänzende Inhalte eingeblendet.',
        bookContext: 'Die Roadmap ist im Buch als "lebendiges Dokument" beschrieben: Sie soll den Canvas nicht ignorieren, sondern konkretisieren. Die Verknüpfung stellt sicher, dass Roadmap-Maßnahmen immer auf das ursprüngliche Business-Problem zurückzuführen sind.',
      },
    ],
  },
  {
    version: '0.4.2',
    date: '3. Juli 2026',
    label: 'Kontext-Filterung Katalog',
    features: [
      {
        title: 'Architektur-Kontext filtert Katalog-Vorschläge',
        description: 'SAP-Komponenten und Vendor-spezifische Einträge werden nur noch Nutzern vorgeschlagen, deren Architektur-Profil diese Technologien einschließt. Falsche Vorschläge (z. B. SAP Joule für reine Azure-Stacks) werden unterdrückt.',
        bookContext: 'Das Buch warnt vor dem "Technologie-Zoo": Zu viele Tools ohne klaren Kontext überfordern Entscheider. Kontextbewusste Filterung ist ein Qualitätsmerkmal eines reifen AI-Katalogs.',
      },
    ],
  },
  {
    version: '0.4.1',
    date: '3. Juli 2026',
    label: 'UX-Vernetzung',
    features: [
      {
        title: 'Canvas-Badge in Use-Case-Liste',
        description: 'Wenn ein Use Case mit einem Canvas verknüpft ist, erscheint ein kleines Canvas-Icon in der Tabelle. So sieht man auf einen Blick, welche Use Cases bereits ausgearbeitet wurden.',
        bookContext: 'Der Leitfaden beschreibt die Use-Case-Priorisierung als ersten Schritt — der Canvas als nächste Stufe der Ausarbeitung ist der Beweis, dass ein Use Case ernst genommen wird. Die Badge-Verknüpfung macht diesen Reifegrad-Unterschied sichtbar.',
      },
      {
        title: 'Governance Quick-Start vom Use Case',
        description: 'Ein "→ Governance"-Button im Use Case öffnet das Governance-Modul und füllt die wichtigsten Felder automatisch vor. Kein Copy-Paste zwischen Modulen.',
        bookContext: '"Governance by Design, not by Accident" — das Buch fordert, dass Governance-Überlegungen so früh wie möglich in den Use-Case-Prozess integriert werden. Der direkte Link eliminiert die Ausrede "dafür war keine Zeit".',
      },
    ],
  },
  {
    version: '0.4.0',
    date: '3. Juli 2026',
    label: 'Vergleichs-Funktionen',
    features: [
      {
        title: 'Architektur-Vergleich',
        description: 'Zwei gespeicherte Architektur-Ergebnisse können jetzt direkt verglichen werden: Pattern, Layer-Verteilung und Empfehlungen nebeneinander.',
        bookContext: '"Welche Architektur passt zu uns?" ist oft keine einmalige Entscheidung. Das Buch empfiehlt, mindestens zwei Szenarien zu entwickeln und systematisch zu vergleichen — Build vs. Buy, Cloud-native vs. Hybrid.',
      },
      {
        title: 'Roadmap-Vergleich mit Phaseninhalt',
        description: 'Der Roadmap-Vergleich zeigt jetzt nicht nur Phasenzahlen, sondern den tatsächlichen Inhalt jeder Phase — Maßnahmen, KPIs, Rollen.',
        bookContext: 'Eine Roadmap ist nur dann wertvoll, wenn sie konkrete Maßnahmen enthält. Der Vergleich auf Inhaltsebene ermöglicht eine ehrliche Bewertung: "Was unterscheidet Plan A wirklich von Plan B?"',
      },
    ],
  },
  {
    version: '0.3.2',
    date: '2. Juli 2026',
    label: 'Admin-Katalog-Upload',
    features: [
      {
        title: 'CSV/JSON-Import für Komponenten-Katalog',
        description: 'Der Admin kann Komponenten-Daten als CSV oder JSON hochladen. Das System erkennt automatisch SAP AI Discovery Center-Exports und mappt sie korrekt. Duplikate werden bereinigt, ein Backup der vorherigen Daten wird erstellt.',
        bookContext: 'Der AI-Komponenten-Katalog ist der "Werkzeugkasten" des Enterprise AI Navigators. Das Buch beschreibt ihn als kuratierte, intern gepflegte Wissensbasis — kein statisches Dokument, sondern ein lebendiges System, das mit dem Markt wächst.',
      },
    ],
  },
  {
    version: '0.3.1',
    date: '2. Juli 2026',
    label: 'Canvas Intelligence (Grundlage)',
    features: [
      {
        title: 'Canvas-Kontext-Analyse Bibliothek',
        description: 'Eine interne Bibliothek (canvas-context.ts) analysiert Canvas-Texte und extrahiert erkannte Plattformen, Use-Case-Typen und Komplexitätsindikatoren. Basis für alle Canvas-basierten Empfehlungen.',
        bookContext: 'Das Buch beschreibt den Canvas als "Brücke zwischen Business und Technik". Damit diese Brücke funktioniert, muss das System den Canvas-Inhalt verstehen — nicht nur speichern.',
      },
    ],
  },
  {
    version: '0.3.0',
    date: '27. Juni 2026',
    label: 'Sicherheit & Executive Summary',
    features: [
      {
        title: 'Executive Summary PDF',
        description: 'Alle 7 Module werden in einem PDF zusammengefasst: Assessment-Ergebnis, Use-Case-Portfolio, Canvas-Details, Governance-Status, Compliance-Check, Architektur-Empfehlung und Roadmap-Phasen.',
        bookContext: 'Das Buch schließt mit einem Kapitel über "Kommunikation nach oben": Vorstände und Aufsichtsräte brauchen eine verdichtete, handlungsorientierte Zusammenfassung — kein 80-Seiten-Konzept. Das Executive Summary PDF ist genau das.',
      },
      {
        title: 'User-Lock-Mechanismus',
        description: 'Gesperrte Nutzer werden nach dem Login sofort erkannt und zur Login-Seite weitergeleitet, statt Fehlermeldungen zu zeigen.',
        bookContext: 'Plattform-Integrität ist Voraussetzung für Vertrauen — besonders bei sensiblen Strategie-Daten.',
      },
    ],
  },
  {
    version: '0.2.0',
    date: '22.–24. Juni 2026',
    label: 'Assessment & Onboarding',
    features: [
      {
        title: '42-Fragen Assessment mit L1–L5 Reifegradmodell',
        description: 'Das AI-Readiness Assessment wurde von 16 auf 42 Fragen erweitert und misst jetzt 5 Reifegrade (L1 Experimentell bis L5 Transformativ) über 7 Dimensionen.',
        bookContext: 'Das Reifegradmodell ist das Herzstück des Enterprise AI Leitfadens. "Wo stehen wir?" ist die wichtigste Frage vor jeder AI-Investitionsentscheidung. Die 42 Fragen decken alle im Buch beschriebenen Dimensionen ab: Strategie, Daten, Technik, Prozesse, Talent, Governance und Kultur.',
      },
      {
        title: 'Geführter Onboarding-Wizard',
        description: '7-stufiger geführter Pfad durch alle Module — Assessment zuerst, dann Use-Case Scoring, Canvas, Governance, Compliance, Architektur, Executive Summary. Mit Fortschrittsanzeige und Modul-Verknüpfungen.',
        bookContext: 'Das Buch empfiehlt einen strukturierten "30-Tage-Aktionsplan" für die AI-Strategieentwicklung. Der Guided Path ist die digitale Umsetzung dieses Plans: kein Modul steht allein, jedes Ergebnis fließt in das nächste.',
      },
    ],
  },
  {
    version: '0.1.0',
    date: '20.–21. Juni 2026',
    label: 'Produktions-Launch',
    features: [
      {
        title: 'Erste produktionsreife Version',
        description: 'Auth (E-Mail + Passwort), 7 Module (Assessment, Use-Case, Canvas, Governance, Compliance, Architektur, Roadmap), Tier-System (Free/Pro/Enterprise), Stripe-Anbindung, PDF-Export, RLS-Sicherheit, Vercel-Deployment.',
        bookContext: 'Enterprise AI Navigator ist die digitale Begleitung zum Enterprise AI Leitfaden von Daniel Ostner. Das Buch beschreibt den strategischen Rahmen — die Plattform macht ihn interaktiv, messbar und exportierbar.',
      },
    ],
  },
]

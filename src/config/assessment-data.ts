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
        l2Label: 'Einzelne Bereiche modelliert, kein unternehmensweiter Standard',
        l3Label: 'Teilweise harmonisiertes Datenmodell in wichtigen Domänen',
        l4Label: 'Weitgehend einheitliches Modell, Data Catalog im Aufbau',
        highLabel: 'Einheitliches Datenmodell, vollständiger Data Catalog vorhanden',
      },
      {
        id: 'data_2',
        text: 'Gibt es definierte Datenzugriffsrechte (RBAC/ABAC)?',
        lowLabel: 'Keine Rollenkonzepte vorhanden',
        l3Label: 'Rollenbasierte Zugriffssteuerung in Kernsystemen etabliert',
        highLabel: 'Granulare, auditierbare Zugriffssteuerung in allen Systemen',
      },
      {
        id: 'data_3',
        text: 'Wie hoch ist die Datenqualität in Kernprozessen?',
        lowLabel: 'Unter 60 % valide Einträge, häufige Fehler',
        l2Label: '60–70 % valide, Qualitätsprobleme bekannt aber ungelöst',
        l3Label: '70–80 % valide, punktuelle Qualitätssicherung vorhanden',
        l4Label: '80–90 % valide, systematisches DQ-Monitoring im Aufbau',
        highLabel: 'Über 90 % valide, aktuell und vollständig — automatisch überwacht',
      },
      {
        id: 'data_4',
        text: 'Ist ein Data Catalog oder Metadaten-Management im Einsatz?',
        lowLabel: 'Keine Metadaten-Dokumentation vorhanden',
        l2Label: 'Informelle Dokumentation in Wikis oder Tabellen',
        l3Label: 'Teilautomatisiertes Metadaten-Tool für wichtigste Datenquellen',
        l4Label: 'Data Catalog produktiv, Abdeckung wird schrittweise erweitert',
        highLabel: 'Vollständiger Data Catalog mit Lineage, Business Glossary und Self-Service',
      },
      {
        id: 'data_5',
        text: 'Sind Datenpipelines aus Kernsystemen (ERP, CRM) stabil, automatisiert und dokumentiert?',
        lowLabel: 'Manuelle Exporte per CSV/Excel, keine Automatisierung',
        l2Label: 'Einige automatisierte Exporte, kaum dokumentiert',
        l3Label: 'ETL/ELT-Pipelines für wichtigste Quellen, teils unzuverlässig',
        l4Label: 'Stabile Pipelines mit Monitoring, SAP BTP oder Middleware im Einsatz',
        highLabel: 'Vollautomatisierte, monitored Pipelines aus allen Kernsystemen mit SLA',
      },
      {
        id: 'data_6',
        text: 'Sind Dateneigentümer (Data Owner/Data Steward) für alle kritischen Datenbereiche benannt?',
        lowLabel: 'Keine Dateneigentümerschaft definiert — Niemand ist verantwortlich',
        l3Label: 'Dateneigentümer für einige Kernbereiche benannt, kein Data Board',
        highLabel: 'Data Owner und Stewards für alle Domänen, aktives Data Governance Board',
      },
      {
        id: 'data_7',
        text: 'Gibt es Near-Realtime-Datenverfügbarkeit für zeitkritische KI-Anwendungsfälle?',
        lowLabel: 'Nur Batch-Daten, Latenz von Stunden bis Tagen',
        l2Label: 'Tägliche Batch-Transfers, Latenz noch zu hoch für AI-Use-Cases',
        l3Label: 'Stündliche Batches, Streaming für einzelne Prozesse evaluiert',
        l4Label: 'Streaming in Pilotanwendungen produktiv, Ausbau geplant',
        highLabel: 'Streaming-Architektur (Kafka, Event Hub) für Sub-Minuten-Latenz operativ',
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
        l2Label: 'Einzelne Personen mit Grundkenntnissen, kein AI-Team',
        l3Label: 'Kleine Gruppe mit ML-Kenntnissen, erste Projekte umgesetzt',
        l4Label: 'Data Science Team etabliert, einzelne MLOps-Lücken',
        highLabel: 'Dediziertes AI-Team mit Data Scientists, ML Engineers und MLOps',
      },
      {
        id: 'skills_2',
        text: 'Sind Business-Stakeholder AI-literat und kennen AI-Potenziale in ihrer Domäne?',
        lowLabel: 'Kaum Wissen über AI-Potenziale im Business',
        l3Label: 'Einzelne AI-Champions in manchen Business Units vorhanden',
        highLabel: 'Aktive AI-Champions in allen Business Units, gezielte AI-Literacy-Programme',
      },
      {
        id: 'skills_3',
        text: 'Existiert ein strukturiertes Schulungsprogramm für AI-Skills auf allen Ebenen?',
        lowLabel: 'Kein AI-Schulungsprogramm geplant oder vorhanden',
        l2Label: 'Vereinzelte externe Kurse, kein strukturierter Ansatz',
        l3Label: 'Schulungsangebot vorhanden, Teilnahme freiwillig und sporadisch',
        l4Label: 'Strukturiertes Programm läuft, Abdeckung noch nicht vollständig',
        highLabel: 'Laufendes, rollenspezifisches Upskilling mit Kompetenz-Tracking',
      },
      {
        id: 'skills_4',
        text: 'Sind Data Engineers vorhanden, die Datenpipelines für AI-Projekte aufbauen und betreiben?',
        lowLabel: 'Keine Data Engineers im Haus, vollständige externe Abhängigkeit',
        l2Label: 'Einige Entwickler mit Datenkenntnissen, keine dedizierten Data Engineers',
        l3Label: 'Erste Data Engineers eingestellt, Team im Aufbau',
        l4Label: 'Data Engineering Team etabliert, MLOps-Kenntnisse werden aufgebaut',
        highLabel: 'Erfahrenes Data-Engineering-Team mit MLOps-Kompetenz und CI/CD für Daten',
      },
      {
        id: 'skills_5',
        text: 'Können Mitarbeiter AI-Assistenzwerkzeuge (Copilot, LLM-Tools, AI-Suche) produktiv nutzen?',
        lowLabel: 'Kaum Nutzung, fehlendes Wissen und Vertrauen in AI-Tools',
        l2Label: 'Einzelne Vorreiter nutzen AI-Tools, kein unternehmensweites Rollout',
        l3Label: 'AI-Tools im Pilotbetrieb für ausgewählte Teams, erste Produktivitätsnachweise',
        l4Label: 'Breite Nutzung, interne Guidelines vorhanden, Adoption wächst',
        highLabel: 'Breite Adoption mit dokumentierten Best Practices und messbarem Produktivitätsgewinn',
      },
      {
        id: 'skills_6',
        text: 'Gibt es AI Product Manager oder AI Translator, die Business und Technik verbinden?',
        lowLabel: 'Keine Verbindungsrolle — Kommunikationslücke zwischen Business und Technik',
        l2Label: 'Informelle Vermittler, keine dedizierte Rolle',
        l3Label: 'Einzelne Personen übernehmen Translator-Funktion neben Hauptrolle',
        l4Label: 'AI Product Manager in zentraler Funktion, Business Units noch nicht abgedeckt',
        highLabel: 'Dedizierte AI-Translator-Rollen oder AI Product Manager in allen Business Units',
      },
      {
        id: 'skills_7',
        text: 'Ist MLOps-Kompetenz für Deployment, Versionierung und Monitoring von KI-Modellen vorhanden?',
        lowLabel: 'Kein MLOps-Know-how, manuelle oder gar keine Modell-Deployments',
        l2Label: 'Modelle werden manuell deployed, keine Versionierung oder Monitoring',
        l3Label: 'Erste MLOps-Praktiken eingeführt, CI/CD für Modelle in Pilotprojekten',
        l4Label: 'MLOps-Prozesse für die meisten Modelle etabliert, einige Lücken beim Monitoring',
        highLabel: 'Vollständige MLOps-Pipeline: automatisches Retraining, Drift-Detection, Rollback',
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
        lowLabel: 'Keine Policy vorhanden, Ad-hoc-Entscheidungen',
        l2Label: 'Erste informelle Regeln, nicht schriftlich fixiert',
        l3Label: 'Policy im Entwurf oder für einzelne Use Cases definiert',
        l4Label: 'Policy vorhanden, noch nicht in allen Bereichen verankert',
        highLabel: 'Dokumentiertes, aktiv genutztes Governance-Framework — regelmäßig überprüft',
      },
      {
        id: 'gov_2',
        text: 'Sind Verantwortlichkeiten für AI klar definiert (Ownership, RACI, Entscheidungsrechte)?',
        lowLabel: 'Unklar, wer Ownership für AI hat — niemand fühlt sich zuständig',
        l3Label: 'Verantwortlichkeiten zentral definiert, Business Units noch nicht eingebunden',
        highLabel: 'RACI definiert, AI Owner in jeder Business Unit, klare Eskalationspfade',
      },
      {
        id: 'gov_3',
        text: 'Existiert ein strukturierter Risikobewertungsprozess für AI-Projekte?',
        lowLabel: 'Kein strukturierter Prozess — Risiken werden nicht systematisch bewertet',
        l2Label: 'Einzelne Risiken werden ad-hoc diskutiert, kein Standard',
        l3Label: 'Risiko-Checkliste für neue AI-Projekte vorhanden, nicht durchgängig genutzt',
        l4Label: 'Standardisiertes Risk Assessment, Anwendung noch nicht vollständig',
        highLabel: 'Standardisiertes AI-Risk-Assessment etabliert, in Projektprozess integriert',
      },
      {
        id: 'gov_4',
        text: 'Werden KI-Modelle, Trainingsquellen und Entscheidungen dokumentiert und auditierbar gestaltet?',
        lowLabel: 'Keine Modell-Dokumentation, Black-Box-Einsatz',
        l2Label: 'Informelle Notizen, keine strukturierte Dokumentation',
        l3Label: 'Modell-Dokumentation für produktive Systeme, Lücken vorhanden',
        l4Label: 'Model Cards für die meisten Modelle, Audit-Log im Aufbau',
        highLabel: 'Vollständige Model Cards, Lineage-Tracking und lückenloser Audit-Log',
      },
      {
        id: 'gov_5',
        text: 'Gibt es einen strukturierten Prozess zur ethischen Prüfung von KI-Anwendungsfällen?',
        lowLabel: 'Kein Ethik-Prüfprozess — Projekte starten ohne ethische Bewertung',
        l2Label: 'Ethik wird punktuell diskutiert, kein fester Prozess',
        l3Label: 'Ethik-Checkliste vorhanden, Anwendung nicht verbindlich',
        l4Label: 'Ethics Review für neue AI-Projekte etabliert, Board in Aufbau',
        highLabel: 'Etablierter Ethics Review Board mit definierten Kriterien und Freigabeprozess',
      },
      {
        id: 'gov_6',
        text: 'Ist der EU AI Act analysiert und in der internen Risikoklassifizierung berücksichtigt?',
        lowLabel: 'EU AI Act noch nicht bewertet, kein Maßnahmenplan',
        l2Label: 'EU AI Act bekannt, erste informelle Einschätzung vorhanden',
        l3Label: 'Risikoklassifizierung für wesentliche Use Cases in Arbeit',
        l4Label: 'Klassifizierung abgeschlossen, Compliance-Lücken identifiziert',
        highLabel: 'Risikoklassifizierung abgeschlossen, Compliance-Roadmap aktiv umgesetzt',
      },
      {
        id: 'gov_7',
        text: 'Existieren definierte Prozesse für den Umgang mit KI-Fehlern oder unerwarteten Modellausgaben?',
        lowLabel: 'Kein Incident-Prozess für AI-Fehler — reaktives Handeln',
        l2Label: 'AI-Fehler werden wie allgemeine IT-Incidents behandelt',
        l3Label: 'Erste AI-spezifische Reaktionspfade definiert, nicht getestet',
        l4Label: 'AI-Incident-Prozess etabliert, Eskalationspfade definiert',
        highLabel: 'AI-spezifisches Incident-Management mit Eskalation, Post-Mortem-Prozess und Stakeholder-Kommunikation',
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
        text: 'Ist die IT-Infrastruktur cloud-ready oder bereits in der Cloud?',
        lowLabel: 'Rein on-premise, keine Cloud-Strategie vorhanden',
        l2Label: 'Cloud-Strategie definiert, Migration noch nicht begonnen',
        l3Label: 'Einzelne Workloads in der Cloud, Hybridansatz etabliert',
        l4Label: 'Mehrheit der Workloads cloud-fähig, MLOps in der Cloud evaluiert',
        highLabel: 'Hybrid/Cloud-native, horizontal skalierbar, AI-Workloads on-demand',
      },
      {
        id: 'tech_2',
        text: 'Gibt es API-Schnittstellen für Kernsysteme (ERP, CRM, Dokumentenmanagement)?',
        lowLabel: 'Kaum APIs — monolithische Legacy-Systeme, manuelle Datentransfers',
        l2Label: 'Einige REST-APIs vorhanden, kein einheitlicher Standard',
        l3Label: 'API-Strategie definiert, Kernsysteme schrittweise erschlossen',
        l4Label: 'Mehrheit der Kernsysteme über APIs zugänglich, Event-Bus in Planung',
        highLabel: 'Vollständige API-Strategie mit Event-Bus und API-Gateway produktiv',
      },
      {
        id: 'tech_3',
        text: 'Wird MLOps oder DevOps bereits praktiziert (CI/CD, automatisiertes Testen, Monitoring)?',
        lowLabel: 'Manuelles Deployment, keine CI/CD-Pipelines vorhanden',
        l2Label: 'DevOps für Software, kein MLOps für Modelle etabliert',
        l3Label: 'CI/CD für Software etabliert, ML-Pipeline im Aufbau',
        l4Label: 'MLOps-Praktiken für einige Modelle, vollständige Pipeline fehlt noch',
        highLabel: 'Vollständige MLOps-Pipeline produktiv: CI/CD, Tests, Monitoring, Auto-Rollback',
      },
      {
        id: 'tech_4',
        text: 'Ist skalierbare Rechenkapazität für KI-Workloads (GPU, Managed AI Services) zugänglich?',
        lowLabel: 'Kein Zugang zu GPU oder AI-optimierter Infrastruktur',
        l2Label: 'Einzelne GPU-Ressourcen on-premise, kein skalierbarerer Zugang',
        l3Label: 'Cloud-GPU on-demand nutzbar, noch kein strukturiertes FinOps-Modell',
        l4Label: 'GPU-Infrastruktur verfügbar, Kostenoptimierung wird adressiert',
        highLabel: 'Flexible GPU-Infrastruktur on-demand oder managed, kostenoptimiert mit FinOps',
      },
      {
        id: 'tech_5',
        text: 'Sind ERP- und Kernsysteme (z. B. SAP S/4HANA) über sichere APIs oder Konnektoren für KI zugänglich?',
        lowLabel: 'Keine AI-taugliche Anbindung — Daten nur über manuelle Exporte',
        l2Label: 'RFC/BAPI-Schnittstellen vorhanden, keine modernen REST-APIs',
        l3Label: 'OData-APIs oder SAP BTP-Konnektoren für einige Prozesse in Betrieb',
        l4Label: 'SAP BTP oder Middleware-Schicht etabliert, AI-Anbindung in Piloten',
        highLabel: 'Vollständige API-Exposition mit SAP BTP oder ESB — AI-Integration produktiv',
      },
      {
        id: 'tech_6',
        text: 'Gibt es eine einheitliche Identitäts- und Zugriffsmanagement-Lösung (IAM/SSO) für alle Systeme inkl. AI?',
        lowLabel: 'Kein zentrales IAM — Insellösungen mit separaten Passwörtern je System',
        l2Label: 'Active Directory vorhanden, kein SSO für alle Anwendungen',
        l3Label: 'SSO für die meisten Anwendungen, AI-Systeme noch nicht integriert',
        l4Label: 'Zentrales IAM mit SSO, AI-Systemintegration in Arbeit',
        highLabel: 'Zentrales IAM mit Federated Identity und RBAC — vollständig auch für AI-Systeme',
      },
      {
        id: 'tech_7',
        text: 'Ist eine Laufzeit-Umgebung für KI-Modelle (Serving-Infrastruktur, API-Endpoints) vorhanden oder geplant?',
        lowLabel: 'Kein Konzept für Modell-Serving — Modelle nur in Notebooks',
        l2Label: 'Modelle als Ad-hoc-Skripte deployed, kein strukturiertes Serving',
        l3Label: 'Erster Modell-Serving-Ansatz (z. B. FastAPI) produktiv, ohne Monitoring',
        l4Label: 'Serving-Infrastruktur vorhanden, Monitoring und Rollback im Aufbau',
        highLabel: 'Produktive Serving-Infrastruktur mit Monitoring, A/B-Testing und Rollback-Fähigkeit',
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
        text: 'Gibt es eine dokumentierte AI-Strategie mit klarem Zielbild?',
        lowLabel: 'Keine Strategie — reaktives, opportunistisches Vorgehen',
        l2Label: 'Erste Ideen vorhanden, nicht dokumentiert oder abgestimmt',
        l3Label: 'AI-Strategie im Entwurf, noch nicht vom Management verabschiedet',
        l4Label: 'Strategie verabschiedet, Umsetzungsplanung läuft',
        highLabel: 'Klare, verabschiedete AI-Vision mit messbaren OKRs und Tracking',
      },
      {
        id: 'strat_2',
        text: 'Ist AI im Budget- und Planungsprozess verankert?',
        lowLabel: 'Kein dediziertes AI-Budget, Einzelprojekte werden ad-hoc finanziert',
        l2Label: 'Projektbudgets für einzelne AI-Initiativen, kein Gesamtbudget',
        l3Label: 'AI-Budgetlinie im IT-Budget vorhanden, noch kein eigener Planungsposten',
        l4Label: 'AI als eigenständige Budgetposition, mittelfristige Planung vorhanden',
        highLabel: 'AI als Linienkostenposition im Jahresbudget, Mehrjahresplanung mit Investment-Roadmap',
      },
      {
        id: 'strat_3',
        text: 'Sind konkrete KI-Anwendungsfälle mit messbarem Business-Impact priorisiert und dokumentiert?',
        lowLabel: 'Keine priorisierten Use Cases — Aktivitäten unstrukturiert und reaktiv',
        l2Label: 'Use Cases auf Zuruf, kein systematisches Scoring oder Priorisierung',
        l3Label: 'Use-Case-Liste vorhanden, Priorisierung nach Aufwand/Nutzen in Arbeit',
        l4Label: 'Priorisiertes Portfolio, ROI-Schätzungen für Top-Cases vorhanden',
        highLabel: 'Strukturiertes Use-Case-Portfolio mit ROI-Tracking und regelmäßigen Portfolio-Reviews',
      },
      {
        id: 'strat_4',
        text: 'Gibt es eine AI-Roadmap mit klaren Meilensteinen für die nächsten 12–24 Monate?',
        lowLabel: 'Keine Roadmap vorhanden — Projekte entstehen ohne Planungsrahmen',
        l2Label: 'Grober Zeitplan für laufende Projekte, keine systematische Roadmap',
        l3Label: 'Roadmap-Entwurf für wichtigste Initiativen, nicht offiziell abgestimmt',
        l4Label: 'Detaillierte Roadmap vorhanden, Quartals-Reviews noch nicht etabliert',
        highLabel: 'Detaillierte, abgestimmte Roadmap mit Quartals-Reviews und Anpassungsprozess',
      },
      {
        id: 'strat_5',
        text: 'Ist die KI-Strategie mit der übergeordneten Unternehmens- und Digitalstrategie verknüpft?',
        lowLabel: 'AI-Aktivitäten isoliert — kein Bezug zur Gesamtstrategie erkennbar',
        l2Label: 'Einzelne Verbindungspunkte, keine formale Verknüpfung',
        l3Label: 'AI als Teil der Digitalstrategie erwähnt, operative Verknüpfung fehlt',
        l4Label: 'Formale Verknüpfung, AI-Ziele in einigen strategischen OKRs abgebildet',
        highLabel: 'AI ist expliziter Bestandteil der Unternehmensstrategie mit messbaren strategischen OKRs',
      },
      {
        id: 'strat_6',
        text: 'Werden externe AI-Entwicklungen und Regulatorik (EU AI Act, DSGVO-Updates) systematisch beobachtet?',
        lowLabel: 'Kein systematisches Monitoring externer AI-Entwicklungen',
        l2Label: 'Einzelne Personen verfolgen Trends, kein strukturierter Prozess',
        l3Label: 'Regelmäßiges informelles Monitoring, gelegentliche Briefings',
        l4Label: 'Strukturierter Trend-Radar-Prozess etabliert, Board noch nicht regelmäßig informiert',
        highLabel: 'Dedizierter Trend-Radar-Prozess mit regelmäßigem Board-Briefing und konkreten Handlungsableitungen',
      },
      {
        id: 'strat_7',
        text: 'Gibt es eine klare Positionierung zu Make-or-Buy bei KI-Investitionen (Eigenentwicklung vs. SaaS/Platform)?',
        lowLabel: 'Keine Entscheidungsmatrix — reaktive Einzelentscheidungen ohne Kriterien',
        l2Label: 'Implizite Präferenz vorhanden, nicht formalisiert',
        l3Label: 'Erste Kriterien definiert, noch keine einheitliche Entscheidungsmatrix',
        l4Label: 'Entscheidungsrahmen etabliert, wird konsistent für neue Investitionen genutzt',
        highLabel: 'Klarer Entscheidungsrahmen mit Kriterien für Eigenentwicklung vs. Lizenzierung vs. Partnership',
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
        text: 'Besteht aktive Executive-Sponsorship für KI auf C-Level oder Vorstandsebene?',
        lowLabel: 'Kein C-Level-Commitment erkennbar, AI gilt als IT-Thema',
        l2Label: 'Einzelne Führungskraft interessiert, kein aktives Sponsoring',
        l3Label: 'AI-Sponsor benannt, Engagement noch nicht durchgängig sichtbar',
        l4Label: 'Aktives C-Level-Sponsoring, AI auf Führungsagenda verankert',
        highLabel: 'AI auf Vorstandsagenda, dedizierter CDO oder CAIO, öffentliches Commitment',
      },
      {
        id: 'cult_2',
        text: 'Ist die Organisation offen für KI-getriebenen Wandel und aktives Veränderungsmanagement?',
        lowLabel: 'Hoher Widerstand gegen Veränderungen, Wandel wird gebremst',
        l2Label: 'Widerstand vorhanden, Change-Kommunikation beginnt',
        l3Label: 'Teile der Organisation aufgeschlossen, Change-Initiativen laufen',
        l4Label: 'Mehrheitlich offene Haltung, Change-Management-Kompetenzen aufgebaut',
        highLabel: 'Etablierte Change-Management-Kultur, Organisation initiiert aktiv Transformation',
      },
      {
        id: 'cult_3',
        text: 'Werden KI-Projektergebnisse mit definierten KPIs gemessen und transparent kommuniziert?',
        lowLabel: 'Kein Erfolgs-Tracking, keine Kommunikation von Ergebnissen',
        l2Label: 'Einzelne Projekte mit KPIs, keine systematische Kommunikation',
        l3Label: 'KPIs für wichtigste Projekte definiert, Kommunikation punktuell',
        l4Label: 'Regelmäßige Ergebniskommunikation, Dashboard in Aufbau',
        highLabel: 'Regelmäßige AI-Impact-Reports an Stakeholder, KPIs im Management-Dashboard',
      },
      {
        id: 'cult_4',
        text: 'Gibt es eine Fehlerkultur, die Experimente und schnelle Iterationen bei KI-Projekten fördert?',
        lowLabel: 'Fehler werden bestraft, Risikovermeidung dominiert — Innovation gehemmt',
        l2Label: 'Fehlertoleranz in Einzelbereichen, kulturell noch nicht verankert',
        l3Label: 'Experiment-Mindset sichtbar, psychologische Sicherheit im Aufbau',
        l4Label: 'Fehlerkultur etabliert, strukturierte Retrospektiven für AI-Projekte',
        highLabel: 'Psychologische Sicherheit verankert, strukturiertes Experiment-Framework mit Lernprozessen',
      },
      {
        id: 'cult_5',
        text: 'Werden KI-Erfolgsgeschichten intern kommuniziert und als Inspiration für weitere Teams genutzt?',
        lowLabel: 'Keine interne Kommunikation zu KI-Projekten und -Ergebnissen',
        l2Label: 'Ad-hoc-Kommunikation bei größeren Erfolgen, kein strukturiertes Format',
        l3Label: 'Gelegentliche Showcases, kein regelmäßiger Rhythmus',
        l4Label: 'Regelmäßige AI-Showcases, Community of Practice im Aufbau',
        highLabel: 'Regelmäßige Showcases, AI-Newsletter, aktive Community of Practice mit externen Impulsen',
      },
      {
        id: 'cult_6',
        text: 'Gibt es dedizierte Zeit oder Budget für KI-Experimente (Innovation Labs, Hackathons, 20%-Zeit)?',
        lowLabel: 'Keine Ressourcen für Experimente — Innovation entsteht nur im Tagesgeschäft',
        l2Label: 'Einzelne Hackathons, kein kontinuierliches Experimentierbudget',
        l3Label: 'Kleineres Innovations-Budget vorhanden, Nutzung noch opportunistisch',
        l4Label: 'Strukturiertes Innovations-Budget und -Format, Teilnahme wächst',
        highLabel: 'Formalisiertes Innovations-Budget mit strukturierten Experiment-Prozessen und Erfolgs-Tracking',
      },
      {
        id: 'cult_7',
        text: 'Werden betroffene Mitarbeiter proaktiv in die Gestaltung von KI-Projekten einbezogen?',
        lowLabel: 'Mitarbeiter werden nicht einbezogen — Top-down-Einführung ohne Beteiligung',
        l2Label: 'Information nachgelagert, keine aktive Mitgestaltung',
        l3Label: 'Ausgewählte Mitarbeiter in Pilotprojekte einbezogen, kein Standard',
        l4Label: 'Regelmäßige Einbindung in Projektteams, Co-Creation wird aufgebaut',
        highLabel: 'Co-Creation mit Mitarbeitern als Standard, Change-Agents in jeder Einheit aktiv',
      },
    ],
  },
]

export const ALL_QUESTIONS = ASSESSMENT_DIMENSIONS.flatMap(d => d.questions)
export const TOTAL_QUESTIONS = ALL_QUESTIONS.length // 42

// Free-Tier: 3 Fragen aus den 4 Hauptdimensionen + 2 aus Strategie/Kultur = 16
export const FREE_QUESTIONS = ASSESSMENT_DIMENSIONS.flatMap(d =>
  d.questions.slice(0, d.id === 'strategy' || d.id === 'culture' ? 2 : 3)
)

export function calcDimScore(answers: Record<string, number>, dimId: string): number | null {
  const dim = ASSESSMENT_DIMENSIONS.find(d => d.id === dimId)
  if (!dim) return null
  const scores = dim.questions.map(q => answers[q.id]).filter((v): v is number => v !== undefined)
  if (scores.length === 0) return null
  return scores.reduce((a, b) => a + b, 0) / scores.length
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

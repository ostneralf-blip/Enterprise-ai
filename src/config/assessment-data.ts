import type { AssessmentDimension } from '@/types'

export const ASSESSMENT_DIMENSIONS: AssessmentDimension[] = [
  {
    id: 'data',
    label: { de: 'Datenqualität & -zugriff', en: 'Data Quality & Access' },
    weight: 0.25,
    questions: [
      {
        id: 'data_1',
        text:      { de: 'Sind Kerndaten strukturiert und einheitlich modelliert?',                                              en: 'Are core data assets structured and uniformly modeled?' },
        lowLabel:  { de: 'Datensilos, kein Masterkonzept',                                                                      en: 'Data silos, no master data concept' },
        l2Label:   { de: 'Einzelne Bereiche modelliert, kein unternehmensweiter Standard',                                      en: 'Individual areas modeled, no company-wide standard' },
        l3Label:   { de: 'Teilweise harmonisiertes Datenmodell in wichtigen Domänen',                                           en: 'Partially harmonized data model in key domains' },
        l4Label:   { de: 'Weitgehend einheitliches Modell, Data Catalog im Aufbau',                                             en: 'Largely unified model, Data Catalog in progress' },
        highLabel: { de: 'Einheitliches Datenmodell, vollständiger Data Catalog vorhanden',                                     en: 'Unified data model, complete Data Catalog in place' },
      },
      {
        id: 'data_2',
        text:      { de: 'Gibt es definierte Datenzugriffsrechte (RBAC/ABAC)?',                                                 en: 'Are defined data access rights (RBAC/ABAC) in place?' },
        lowLabel:  { de: 'Keine Rollenkonzepte vorhanden',                                                                      en: 'No role concepts in place' },
        l3Label:   { de: 'Rollenbasierte Zugriffssteuerung in Kernsystemen etabliert',                                          en: 'Role-based access control established in core systems' },
        highLabel: { de: 'Granulare, auditierbare Zugriffssteuerung in allen Systemen',                                         en: 'Granular, auditable access control across all systems' },
      },
      {
        id: 'data_3',
        text:      { de: 'Wie hoch ist die Datenqualität in Kernprozessen?',                                                    en: 'What is the data quality level in core processes?' },
        lowLabel:  { de: 'Unter 60 % valide Einträge, häufige Fehler',                                                         en: 'Under 60% valid entries, frequent errors' },
        l2Label:   { de: '60–70 % valide, Qualitätsprobleme bekannt aber ungelöst',                                             en: '60–70% valid, quality issues known but unresolved' },
        l3Label:   { de: '70–80 % valide, punktuelle Qualitätssicherung vorhanden',                                             en: '70–80% valid, targeted quality assurance in place' },
        l4Label:   { de: '80–90 % valide, systematisches DQ-Monitoring im Aufbau',                                              en: '80–90% valid, systematic DQ monitoring being built' },
        highLabel: { de: 'Über 90 % valide, aktuell und vollständig — automatisch überwacht',                                   en: 'Over 90% valid, current and complete — automatically monitored' },
      },
      {
        id: 'data_4',
        text:      { de: 'Ist ein Data Catalog oder Metadaten-Management im Einsatz?',                                          en: 'Is a Data Catalog or metadata management in use?' },
        lowLabel:  { de: 'Keine Metadaten-Dokumentation vorhanden',                                                             en: 'No metadata documentation available' },
        l2Label:   { de: 'Informelle Dokumentation in Wikis oder Tabellen',                                                     en: 'Informal documentation in wikis or spreadsheets' },
        l3Label:   { de: 'Teilautomatisiertes Metadaten-Tool für wichtigste Datenquellen',                                      en: 'Partially automated metadata tool for key data sources' },
        l4Label:   { de: 'Data Catalog produktiv, Abdeckung wird schrittweise erweitert',                                       en: 'Data Catalog in production, coverage being expanded' },
        highLabel: { de: 'Vollständiger Data Catalog mit Lineage, Business Glossary und Self-Service',                          en: 'Full Data Catalog with lineage, business glossary and self-service' },
      },
      {
        id: 'data_5',
        text:      { de: 'Sind Datenpipelines aus Kernsystemen (ERP, CRM) stabil, automatisiert und dokumentiert?',             en: 'Are data pipelines from core systems (ERP, CRM) stable, automated and documented?' },
        lowLabel:  { de: 'Manuelle Exporte per CSV/Excel, keine Automatisierung',                                               en: 'Manual exports via CSV/Excel, no automation' },
        l2Label:   { de: 'Einige automatisierte Exporte, kaum dokumentiert',                                                    en: 'Some automated exports, barely documented' },
        l3Label:   { de: 'ETL/ELT-Pipelines für wichtigste Quellen, teils unzuverlässig',                                      en: 'ETL/ELT pipelines for key sources, partly unreliable' },
        l4Label:   { de: 'Stabile Pipelines mit Monitoring, SAP BTP oder Middleware im Einsatz',                                en: 'Stable pipelines with monitoring, SAP BTP or middleware in use' },
        highLabel: { de: 'Vollautomatisierte, monitored Pipelines aus allen Kernsystemen mit SLA',                              en: 'Fully automated, monitored pipelines from all core systems with SLAs' },
      },
      {
        id: 'data_6',
        text:      { de: 'Sind Dateneigentümer (Data Owner/Data Steward) für alle kritischen Datenbereiche benannt?',           en: 'Are data owners (Data Owner/Data Steward) designated for all critical data domains?' },
        lowLabel:  { de: 'Keine Dateneigentümerschaft definiert — Niemand ist verantwortlich',                                   en: 'No data ownership defined — nobody is responsible' },
        l3Label:   { de: 'Dateneigentümer für einige Kernbereiche benannt, kein Data Board',                                    en: 'Data owners named for some core areas, no Data Board' },
        highLabel: { de: 'Data Owner und Stewards für alle Domänen, aktives Data Governance Board',                             en: 'Data Owners and Stewards for all domains, active Data Governance Board' },
      },
      {
        id: 'data_7',
        text:      { de: 'Gibt es Near-Realtime-Datenverfügbarkeit für zeitkritische KI-Anwendungsfälle?',                      en: 'Is near-real-time data availability in place for time-critical AI use cases?' },
        lowLabel:  { de: 'Nur Batch-Daten, Latenz von Stunden bis Tagen',                                                       en: 'Only batch data, latency of hours to days' },
        l2Label:   { de: 'Tägliche Batch-Transfers, Latenz noch zu hoch für AI-Use-Cases',                                      en: 'Daily batch transfers, latency still too high for AI use cases' },
        l3Label:   { de: 'Stündliche Batches, Streaming für einzelne Prozesse evaluiert',                                       en: 'Hourly batches, streaming evaluated for individual processes' },
        l4Label:   { de: 'Streaming in Pilotanwendungen produktiv, Ausbau geplant',                                             en: 'Streaming in pilot applications live, expansion planned' },
        highLabel: { de: 'Streaming-Architektur (Kafka, Event Hub) für Sub-Minuten-Latenz operativ',                            en: 'Streaming architecture (Kafka, Event Hub) delivering sub-minute latency — in production' },
      },
    ],
  },
  {
    id: 'skills',
    label: { de: 'Skills & Kompetenzen', en: 'Skills & Competencies' },
    weight: 0.20,
    questions: [
      {
        id: 'skills_1',
        text:      { de: 'Gibt es AI/ML-Kompetenz im eigenen Team?',                                                            en: 'Is AI/ML expertise available internally?' },
        lowLabel:  { de: 'Keine internen AI-Skills vorhanden',                                                                   en: 'No internal AI skills available' },
        l2Label:   { de: 'Einzelne Personen mit Grundkenntnissen, kein AI-Team',                                                en: 'Individual people with basic knowledge, no AI team' },
        l3Label:   { de: 'Kleine Gruppe mit ML-Kenntnissen, erste Projekte umgesetzt',                                          en: 'Small group with ML knowledge, first projects completed' },
        l4Label:   { de: 'Data Science Team etabliert, einzelne MLOps-Lücken',                                                  en: 'Data Science team established, some MLOps gaps' },
        highLabel: { de: 'Dediziertes AI-Team mit Data Scientists, ML Engineers und MLOps',                                     en: 'Dedicated AI team with Data Scientists, ML Engineers and MLOps specialists' },
      },
      {
        id: 'skills_2',
        text:      { de: 'Sind Business-Stakeholder AI-literat und kennen AI-Potenziale in ihrer Domäne?',                      en: 'Are business stakeholders AI-literate and aware of AI potential in their domain?' },
        lowLabel:  { de: 'Kaum Wissen über AI-Potenziale im Business',                                                          en: 'Little knowledge of AI potential in the business' },
        l3Label:   { de: 'Einzelne AI-Champions in manchen Business Units vorhanden',                                           en: 'Individual AI champions in some business units' },
        highLabel: { de: 'Aktive AI-Champions in allen Business Units, gezielte AI-Literacy-Programme',                         en: 'Active AI champions in all business units, targeted AI literacy programs' },
      },
      {
        id: 'skills_3',
        text:      { de: 'Existiert ein strukturiertes Schulungsprogramm für AI-Skills auf allen Ebenen?',                      en: 'Does a structured training program for AI skills exist at all levels?' },
        lowLabel:  { de: 'Kein AI-Schulungsprogramm geplant oder vorhanden',                                                    en: 'No AI training program planned or in place' },
        l2Label:   { de: 'Vereinzelte externe Kurse, kein strukturierter Ansatz',                                               en: 'Occasional external courses, no structured approach' },
        l3Label:   { de: 'Schulungsangebot vorhanden, Teilnahme freiwillig und sporadisch',                                     en: 'Training offerings available, participation voluntary and sporadic' },
        l4Label:   { de: 'Strukturiertes Programm läuft, Abdeckung noch nicht vollständig',                                     en: 'Structured program running, coverage not yet complete' },
        highLabel: { de: 'Laufendes, rollenspezifisches Upskilling mit Kompetenz-Tracking',                                     en: 'Ongoing, role-specific upskilling with competency tracking' },
      },
      {
        id: 'skills_4',
        text:      { de: 'Sind Data Engineers vorhanden, die Datenpipelines für AI-Projekte aufbauen und betreiben?',           en: 'Are Data Engineers available to build and operate data pipelines for AI projects?' },
        lowLabel:  { de: 'Keine Data Engineers im Haus, vollständige externe Abhängigkeit',                                     en: 'No Data Engineers in-house, complete external dependency' },
        l2Label:   { de: 'Einige Entwickler mit Datenkenntnissen, keine dedizierten Data Engineers',                            en: 'Some developers with data knowledge, no dedicated Data Engineers' },
        l3Label:   { de: 'Erste Data Engineers eingestellt, Team im Aufbau',                                                    en: 'First Data Engineers hired, team growing' },
        l4Label:   { de: 'Data Engineering Team etabliert, MLOps-Kenntnisse werden aufgebaut',                                  en: 'Data Engineering team established, MLOps skills being built' },
        highLabel: { de: 'Erfahrenes Data-Engineering-Team mit MLOps-Kompetenz und CI/CD für Daten',                            en: 'Experienced Data Engineering team with MLOps expertise and CI/CD for data' },
      },
      {
        id: 'skills_5',
        text:      { de: 'Können Mitarbeiter AI-Assistenzwerkzeuge (Copilot, LLM-Tools, AI-Suche) produktiv nutzen?',           en: 'Can employees productively use AI assistant tools (Copilot, LLM tools, AI search)?' },
        lowLabel:  { de: 'Kaum Nutzung, fehlendes Wissen und Vertrauen in AI-Tools',                                            en: 'Minimal use, lacking knowledge and trust in AI tools' },
        l2Label:   { de: 'Einzelne Vorreiter nutzen AI-Tools, kein unternehmensweites Rollout',                                 en: 'Individual early adopters use AI tools, no company-wide rollout' },
        l3Label:   { de: 'AI-Tools im Pilotbetrieb für ausgewählte Teams, erste Produktivitätsnachweise',                       en: 'AI tools in pilot mode for selected teams, first productivity evidence' },
        l4Label:   { de: 'Breite Nutzung, interne Guidelines vorhanden, Adoption wächst',                                       en: 'Broad usage, internal guidelines in place, adoption growing' },
        highLabel: { de: 'Breite Adoption mit dokumentierten Best Practices und messbarem Produktivitätsgewinn',                 en: 'Broad adoption with documented best practices and measurable productivity gains' },
      },
      {
        id: 'skills_6',
        text:      { de: 'Gibt es AI Product Manager oder AI Translator, die Business und Technik verbinden?',                  en: 'Are AI Product Managers or AI Translators bridging business and technology?' },
        lowLabel:  { de: 'Keine Verbindungsrolle — Kommunikationslücke zwischen Business und Technik',                          en: 'No bridging role — communication gap between business and tech' },
        l2Label:   { de: 'Informelle Vermittler, keine dedizierte Rolle',                                                       en: 'Informal mediators, no dedicated role' },
        l3Label:   { de: 'Einzelne Personen übernehmen Translator-Funktion neben Hauptrolle',                                   en: 'Individuals take on translator function alongside main role' },
        l4Label:   { de: 'AI Product Manager in zentraler Funktion, Business Units noch nicht abgedeckt',                       en: 'AI Product Manager in central function, business units not yet covered' },
        highLabel: { de: 'Dedizierte AI-Translator-Rollen oder AI Product Manager in allen Business Units',                     en: 'Dedicated AI Translator roles or AI Product Managers in all business units' },
      },
      {
        id: 'skills_7',
        text:      { de: 'Ist MLOps-Kompetenz für Deployment, Versionierung und Monitoring von KI-Modellen vorhanden?',         en: 'Is MLOps expertise available for deployment, versioning and monitoring of AI models?' },
        lowLabel:  { de: 'Kein MLOps-Know-how, manuelle oder gar keine Modell-Deployments',                                     en: 'No MLOps know-how, manual or no model deployments' },
        l2Label:   { de: 'Modelle werden manuell deployed, keine Versionierung oder Monitoring',                                en: 'Models deployed manually, no versioning or monitoring' },
        l3Label:   { de: 'Erste MLOps-Praktiken eingeführt, CI/CD für Modelle in Pilotprojekten',                               en: 'First MLOps practices introduced, CI/CD for models in pilot projects' },
        l4Label:   { de: 'MLOps-Prozesse für die meisten Modelle etabliert, einige Lücken beim Monitoring',                     en: 'MLOps processes established for most models, some monitoring gaps' },
        highLabel: { de: 'Vollständige MLOps-Pipeline: automatisches Retraining, Drift-Detection, Rollback',                    en: 'Full MLOps pipeline: automated retraining, drift detection, rollback' },
      },
    ],
  },
  {
    id: 'governance',
    label: { de: 'Governance & Prozesse', en: 'Governance & Processes' },
    weight: 0.20,
    questions: [
      {
        id: 'gov_1',
        text:      { de: 'Gibt es eine AI-Policy oder ein Governance-Rahmenwerk?',                                              en: 'Is an AI policy or governance framework in place?' },
        lowLabel:  { de: 'Keine Policy vorhanden, Ad-hoc-Entscheidungen',                                                       en: 'No policy in place, ad-hoc decisions' },
        l2Label:   { de: 'Erste informelle Regeln, nicht schriftlich fixiert',                                                   en: 'First informal rules, not in writing' },
        l3Label:   { de: 'Policy im Entwurf oder für einzelne Use Cases definiert',                                             en: 'Policy in draft or defined for individual use cases' },
        l4Label:   { de: 'Policy vorhanden, noch nicht in allen Bereichen verankert',                                           en: 'Policy in place, not yet embedded across all areas' },
        highLabel: { de: 'Dokumentiertes, aktiv genutztes Governance-Framework — regelmäßig überprüft',                         en: 'Documented, actively used governance framework — regularly reviewed' },
      },
      {
        id: 'gov_2',
        text:      { de: 'Sind Verantwortlichkeiten für AI klar definiert (Ownership, RACI, Entscheidungsrechte)?',             en: 'Are responsibilities for AI clearly defined (ownership, RACI, decision rights)?' },
        lowLabel:  { de: 'Unklar, wer Ownership für AI hat — niemand fühlt sich zuständig',                                     en: 'Unclear who owns AI — nobody feels responsible' },
        l3Label:   { de: 'Verantwortlichkeiten zentral definiert, Business Units noch nicht eingebunden',                       en: 'Responsibilities defined centrally, business units not yet included' },
        highLabel: { de: 'RACI definiert, AI Owner in jeder Business Unit, klare Eskalationspfade',                             en: 'RACI defined, AI Owner in each business unit, clear escalation paths' },
      },
      {
        id: 'gov_3',
        text:      { de: 'Existiert ein strukturierter Risikobewertungsprozess für AI-Projekte?',                               en: 'Is a structured risk assessment process in place for AI projects?' },
        lowLabel:  { de: 'Kein strukturierter Prozess — Risiken werden nicht systematisch bewertet',                            en: 'No structured process — risks are not systematically assessed' },
        l2Label:   { de: 'Einzelne Risiken werden ad-hoc diskutiert, kein Standard',                                            en: 'Individual risks discussed ad hoc, no standard' },
        l3Label:   { de: 'Risiko-Checkliste für neue AI-Projekte vorhanden, nicht durchgängig genutzt',                         en: 'Risk checklist for new AI projects available, not consistently used' },
        l4Label:   { de: 'Standardisiertes Risk Assessment, Anwendung noch nicht vollständig',                                  en: 'Standardized risk assessment, not yet fully applied' },
        highLabel: { de: 'Standardisiertes AI-Risk-Assessment etabliert, in Projektprozess integriert',                         en: 'Standardized AI risk assessment established, integrated into project process' },
      },
      {
        id: 'gov_4',
        text:      { de: 'Werden KI-Modelle, Trainingsquellen und Entscheidungen dokumentiert und auditierbar gestaltet?',      en: 'Are AI models, training sources and decisions documented and made auditable?' },
        lowLabel:  { de: 'Keine Modell-Dokumentation, Black-Box-Einsatz',                                                       en: 'No model documentation, black-box deployment' },
        l2Label:   { de: 'Informelle Notizen, keine strukturierte Dokumentation',                                               en: 'Informal notes, no structured documentation' },
        l3Label:   { de: 'Modell-Dokumentation für produktive Systeme, Lücken vorhanden',                                       en: 'Model documentation for production systems, gaps exist' },
        l4Label:   { de: 'Model Cards für die meisten Modelle, Audit-Log im Aufbau',                                            en: 'Model Cards for most models, audit log under construction' },
        highLabel: { de: 'Vollständige Model Cards, Lineage-Tracking und lückenloser Audit-Log',                                en: 'Full Model Cards, lineage tracking and complete audit log' },
      },
      {
        id: 'gov_5',
        text:      { de: 'Gibt es einen strukturierten Prozess zur ethischen Prüfung von KI-Anwendungsfällen?',                 en: 'Is a structured process for ethical review of AI use cases in place?' },
        lowLabel:  { de: 'Kein Ethik-Prüfprozess — Projekte starten ohne ethische Bewertung',                                   en: 'No ethics review process — projects start without ethical assessment' },
        l2Label:   { de: 'Ethik wird punktuell diskutiert, kein fester Prozess',                                                en: 'Ethics discussed occasionally, no fixed process' },
        l3Label:   { de: 'Ethik-Checkliste vorhanden, Anwendung nicht verbindlich',                                             en: 'Ethics checklist available, use not mandatory' },
        l4Label:   { de: 'Ethics Review für neue AI-Projekte etabliert, Board in Aufbau',                                       en: 'Ethics review for new AI projects established, board being built' },
        highLabel: { de: 'Etablierter Ethics Review Board mit definierten Kriterien und Freigabeprozess',                       en: 'Established Ethics Review Board with defined criteria and approval process' },
      },
      {
        id: 'gov_6',
        text:      { de: 'Ist der EU AI Act analysiert und in der internen Risikoklassifizierung berücksichtigt?',              en: 'Has the EU AI Act been analyzed and incorporated into internal risk classification?' },
        lowLabel:  { de: 'EU AI Act noch nicht bewertet, kein Maßnahmenplan',                                                   en: 'EU AI Act not yet assessed, no action plan' },
        l2Label:   { de: 'EU AI Act bekannt, erste informelle Einschätzung vorhanden',                                          en: 'EU AI Act known, first informal assessment available' },
        l3Label:   { de: 'Risikoklassifizierung für wesentliche Use Cases in Arbeit',                                           en: 'Risk classification for key use cases in progress' },
        l4Label:   { de: 'Klassifizierung abgeschlossen, Compliance-Lücken identifiziert',                                      en: 'Classification completed, compliance gaps identified' },
        highLabel: { de: 'Risikoklassifizierung abgeschlossen, Compliance-Roadmap aktiv umgesetzt',                             en: 'Risk classification completed, compliance roadmap actively being implemented' },
      },
      {
        id: 'gov_7',
        text:      { de: 'Existieren definierte Prozesse für den Umgang mit KI-Fehlern oder unerwarteten Modellausgaben?',      en: 'Are defined processes in place for handling AI errors or unexpected model outputs?' },
        lowLabel:  { de: 'Kein Incident-Prozess für AI-Fehler — reaktives Handeln',                                             en: 'No incident process for AI errors — reactive handling only' },
        l2Label:   { de: 'AI-Fehler werden wie allgemeine IT-Incidents behandelt',                                               en: 'AI errors treated as general IT incidents' },
        l3Label:   { de: 'Erste AI-spezifische Reaktionspfade definiert, nicht getestet',                                       en: 'First AI-specific response paths defined, not tested' },
        l4Label:   { de: 'AI-Incident-Prozess etabliert, Eskalationspfade definiert',                                           en: 'AI incident process established, escalation paths defined' },
        highLabel: { de: 'AI-spezifisches Incident-Management mit Eskalation, Post-Mortem-Prozess und Stakeholder-Kommunikation', en: 'AI-specific incident management with escalation, post-mortem process and stakeholder communication' },
      },
    ],
  },
  {
    id: 'tech',
    label: { de: 'Technische Infrastruktur', en: 'Technical Infrastructure' },
    weight: 0.20,
    questions: [
      {
        id: 'tech_1',
        text:      { de: 'Ist die IT-Infrastruktur cloud-ready oder bereits in der Cloud?',                                     en: 'Is the IT infrastructure cloud-ready or already in the cloud?' },
        lowLabel:  { de: 'Rein on-premise, keine Cloud-Strategie vorhanden',                                                    en: 'Purely on-premise, no cloud strategy in place' },
        l2Label:   { de: 'Cloud-Strategie definiert, Migration noch nicht begonnen',                                            en: 'Cloud strategy defined, migration not yet started' },
        l3Label:   { de: 'Einzelne Workloads in der Cloud, Hybridansatz etabliert',                                             en: 'Individual workloads in the cloud, hybrid approach established' },
        l4Label:   { de: 'Mehrheit der Workloads cloud-fähig, MLOps in der Cloud evaluiert',                                    en: 'Majority of workloads cloud-capable, MLOps in the cloud being evaluated' },
        highLabel: { de: 'Hybrid/Cloud-native, horizontal skalierbar, AI-Workloads on-demand',                                  en: 'Hybrid/cloud-native, horizontally scalable, AI workloads on-demand' },
      },
      {
        id: 'tech_2',
        text:      { de: 'Gibt es API-Schnittstellen für Kernsysteme (ERP, CRM, Dokumentenmanagement)?',                       en: 'Are API interfaces available for core systems (ERP, CRM, document management)?' },
        lowLabel:  { de: 'Kaum APIs — monolithische Legacy-Systeme, manuelle Datentransfers',                                   en: 'Barely any APIs — monolithic legacy systems, manual data transfers' },
        l2Label:   { de: 'Einige REST-APIs vorhanden, kein einheitlicher Standard',                                             en: 'Some REST APIs available, no unified standard' },
        l3Label:   { de: 'API-Strategie definiert, Kernsysteme schrittweise erschlossen',                                       en: 'API strategy defined, core systems being progressively opened' },
        l4Label:   { de: 'Mehrheit der Kernsysteme über APIs zugänglich, Event-Bus in Planung',                                 en: 'Majority of core systems accessible via APIs, event bus being planned' },
        highLabel: { de: 'Vollständige API-Strategie mit Event-Bus und API-Gateway produktiv',                                  en: 'Complete API strategy with event bus and API gateway in production' },
      },
      {
        id: 'tech_3',
        text:      { de: 'Wird MLOps oder DevOps bereits praktiziert (CI/CD, automatisiertes Testen, Monitoring)?',            en: 'Is MLOps or DevOps already practiced (CI/CD, automated testing, monitoring)?' },
        lowLabel:  { de: 'Manuelles Deployment, keine CI/CD-Pipelines vorhanden',                                               en: 'Manual deployment, no CI/CD pipelines in place' },
        l2Label:   { de: 'DevOps für Software, kein MLOps für Modelle etabliert',                                               en: 'DevOps for software, no MLOps for models established' },
        l3Label:   { de: 'CI/CD für Software etabliert, ML-Pipeline im Aufbau',                                                 en: 'CI/CD for software established, ML pipeline under construction' },
        l4Label:   { de: 'MLOps-Praktiken für einige Modelle, vollständige Pipeline fehlt noch',                                en: 'MLOps practices for some models, full pipeline not yet complete' },
        highLabel: { de: 'Vollständige MLOps-Pipeline produktiv: CI/CD, Tests, Monitoring, Auto-Rollback',                      en: 'Full MLOps pipeline in production: CI/CD, tests, monitoring, auto-rollback' },
      },
      {
        id: 'tech_4',
        text:      { de: 'Ist skalierbare Rechenkapazität für KI-Workloads (GPU, Managed AI Services) zugänglich?',            en: 'Is scalable compute capacity for AI workloads (GPU, managed AI services) accessible?' },
        lowLabel:  { de: 'Kein Zugang zu GPU oder AI-optimierter Infrastruktur',                                                en: 'No access to GPU or AI-optimized infrastructure' },
        l2Label:   { de: 'Einzelne GPU-Ressourcen on-premise, kein skalierbarerer Zugang',                                      en: 'Individual GPU resources on-premise, no scalable access' },
        l3Label:   { de: 'Cloud-GPU on-demand nutzbar, noch kein strukturiertes FinOps-Modell',                                 en: 'Cloud GPU available on-demand, no structured FinOps model yet' },
        l4Label:   { de: 'GPU-Infrastruktur verfügbar, Kostenoptimierung wird adressiert',                                      en: 'GPU infrastructure available, cost optimization being addressed' },
        highLabel: { de: 'Flexible GPU-Infrastruktur on-demand oder managed, kostenoptimiert mit FinOps',                       en: 'Flexible GPU infrastructure on-demand or managed, cost-optimized with FinOps' },
      },
      {
        id: 'tech_5',
        text:      { de: 'Sind ERP- und Kernsysteme (z. B. SAP S/4HANA) über sichere APIs oder Konnektoren für KI zugänglich?', en: 'Are ERP and core systems (e.g. SAP S/4HANA) accessible for AI via secure APIs or connectors?' },
        lowLabel:  { de: 'Keine AI-taugliche Anbindung — Daten nur über manuelle Exporte',                                      en: 'No AI-suitable connection — data only via manual exports' },
        l2Label:   { de: 'RFC/BAPI-Schnittstellen vorhanden, keine modernen REST-APIs',                                         en: 'RFC/BAPI interfaces available, no modern REST APIs' },
        l3Label:   { de: 'OData-APIs oder SAP BTP-Konnektoren für einige Prozesse in Betrieb',                                  en: 'OData APIs or SAP BTP connectors for some processes in operation' },
        l4Label:   { de: 'SAP BTP oder Middleware-Schicht etabliert, AI-Anbindung in Piloten',                                  en: 'SAP BTP or middleware layer established, AI integration in pilots' },
        highLabel: { de: 'Vollständige API-Exposition mit SAP BTP oder ESB — AI-Integration produktiv',                         en: 'Full API exposure with SAP BTP or ESB — AI integration in production' },
      },
      {
        id: 'tech_6',
        text:      { de: 'Gibt es eine einheitliche Identitäts- und Zugriffsmanagement-Lösung (IAM/SSO) für alle Systeme inkl. AI?', en: 'Is a unified identity and access management solution (IAM/SSO) in place for all systems including AI?' },
        lowLabel:  { de: 'Kein zentrales IAM — Insellösungen mit separaten Passwörtern je System',                              en: 'No central IAM — island solutions with separate passwords per system' },
        l2Label:   { de: 'Active Directory vorhanden, kein SSO für alle Anwendungen',                                           en: 'Active Directory available, no SSO for all applications' },
        l3Label:   { de: 'SSO für die meisten Anwendungen, AI-Systeme noch nicht integriert',                                   en: 'SSO for most applications, AI systems not yet integrated' },
        l4Label:   { de: 'Zentrales IAM mit SSO, AI-Systemintegration in Arbeit',                                               en: 'Central IAM with SSO, AI system integration in progress' },
        highLabel: { de: 'Zentrales IAM mit Federated Identity und RBAC — vollständig auch für AI-Systeme',                     en: 'Central IAM with Federated Identity and RBAC — fully covering AI systems too' },
      },
      {
        id: 'tech_7',
        text:      { de: 'Ist eine Laufzeit-Umgebung für KI-Modelle (Serving-Infrastruktur, API-Endpoints) vorhanden oder geplant?', en: 'Is a runtime environment for AI models (serving infrastructure, API endpoints) in place or planned?' },
        lowLabel:  { de: 'Kein Konzept für Modell-Serving — Modelle nur in Notebooks',                                          en: 'No concept for model serving — models only in notebooks' },
        l2Label:   { de: 'Modelle als Ad-hoc-Skripte deployed, kein strukturiertes Serving',                                    en: 'Models deployed as ad-hoc scripts, no structured serving' },
        l3Label:   { de: 'Erster Modell-Serving-Ansatz (z. B. FastAPI) produktiv, ohne Monitoring',                             en: 'First model serving approach (e.g. FastAPI) in production, without monitoring' },
        l4Label:   { de: 'Serving-Infrastruktur vorhanden, Monitoring und Rollback im Aufbau',                                  en: 'Serving infrastructure available, monitoring and rollback being built' },
        highLabel: { de: 'Produktive Serving-Infrastruktur mit Monitoring, A/B-Testing und Rollback-Fähigkeit',                 en: 'Production serving infrastructure with monitoring, A/B testing and rollback capability' },
      },
    ],
  },
  {
    id: 'strategy',
    label: { de: 'Strategie & Zielbild', en: 'Strategy & Target Vision' },
    weight: 0.10,
    questions: [
      {
        id: 'strat_1',
        text:      { de: 'Gibt es eine dokumentierte AI-Strategie mit klarem Zielbild?',                                        en: 'Is a documented AI strategy with a clear target vision in place?' },
        lowLabel:  { de: 'Keine Strategie — reaktives, opportunistisches Vorgehen',                                             en: 'No strategy — reactive, opportunistic approach' },
        l2Label:   { de: 'Erste Ideen vorhanden, nicht dokumentiert oder abgestimmt',                                           en: 'First ideas available, not documented or aligned' },
        l3Label:   { de: 'AI-Strategie im Entwurf, noch nicht vom Management verabschiedet',                                    en: 'AI strategy in draft, not yet approved by management' },
        l4Label:   { de: 'Strategie verabschiedet, Umsetzungsplanung läuft',                                                    en: 'Strategy approved, implementation planning underway' },
        highLabel: { de: 'Klare, verabschiedete AI-Vision mit messbaren OKRs und Tracking',                                     en: 'Clear, approved AI vision with measurable OKRs and tracking' },
      },
      {
        id: 'strat_2',
        text:      { de: 'Ist AI im Budget- und Planungsprozess verankert?',                                                    en: 'Is AI embedded in the budget and planning process?' },
        lowLabel:  { de: 'Kein dediziertes AI-Budget, Einzelprojekte werden ad-hoc finanziert',                                 en: 'No dedicated AI budget, individual projects financed ad hoc' },
        l2Label:   { de: 'Projektbudgets für einzelne AI-Initiativen, kein Gesamtbudget',                                       en: 'Project budgets for individual AI initiatives, no overall budget' },
        l3Label:   { de: 'AI-Budgetlinie im IT-Budget vorhanden, noch kein eigener Planungsposten',                             en: 'AI budget line in IT budget, not yet a separate planning item' },
        l4Label:   { de: 'AI als eigenständige Budgetposition, mittelfristige Planung vorhanden',                               en: 'AI as standalone budget item, medium-term planning in place' },
        highLabel: { de: 'AI als Linienkostenposition im Jahresbudget, Mehrjahresplanung mit Investment-Roadmap',               en: 'AI as a line-item in the annual budget, multi-year planning with investment roadmap' },
      },
      {
        id: 'strat_3',
        text:      { de: 'Sind konkrete KI-Anwendungsfälle mit messbarem Business-Impact priorisiert und dokumentiert?',        en: 'Are concrete AI use cases with measurable business impact prioritized and documented?' },
        lowLabel:  { de: 'Keine priorisierten Use Cases — Aktivitäten unstrukturiert und reaktiv',                              en: 'No prioritized use cases — activities unstructured and reactive' },
        l2Label:   { de: 'Use Cases auf Zuruf, kein systematisches Scoring oder Priorisierung',                                 en: 'Use cases identified ad hoc, no systematic scoring or prioritization' },
        l3Label:   { de: 'Use-Case-Liste vorhanden, Priorisierung nach Aufwand/Nutzen in Arbeit',                               en: 'Use case list available, prioritization by effort/benefit in progress' },
        l4Label:   { de: 'Priorisiertes Portfolio, ROI-Schätzungen für Top-Cases vorhanden',                                    en: 'Prioritized portfolio, ROI estimates for top cases available' },
        highLabel: { de: 'Strukturiertes Use-Case-Portfolio mit ROI-Tracking und regelmäßigen Portfolio-Reviews',               en: 'Structured use case portfolio with ROI tracking and regular portfolio reviews' },
      },
      {
        id: 'strat_4',
        text:      { de: 'Gibt es eine AI-Roadmap mit klaren Meilensteinen für die nächsten 12–24 Monate?',                    en: 'Is an AI roadmap with clear milestones for the next 12–24 months in place?' },
        lowLabel:  { de: 'Keine Roadmap vorhanden — Projekte entstehen ohne Planungsrahmen',                                    en: 'No roadmap — projects emerge without a planning framework' },
        l2Label:   { de: 'Grober Zeitplan für laufende Projekte, keine systematische Roadmap',                                  en: 'Rough timeline for ongoing projects, no systematic roadmap' },
        l3Label:   { de: 'Roadmap-Entwurf für wichtigste Initiativen, nicht offiziell abgestimmt',                              en: 'Roadmap draft for key initiatives, not officially aligned' },
        l4Label:   { de: 'Detaillierte Roadmap vorhanden, Quartals-Reviews noch nicht etabliert',                               en: 'Detailed roadmap in place, quarterly reviews not yet established' },
        highLabel: { de: 'Detaillierte, abgestimmte Roadmap mit Quartals-Reviews und Anpassungsprozess',                        en: 'Detailed, aligned roadmap with quarterly reviews and adaptation process' },
      },
      {
        id: 'strat_5',
        text:      { de: 'Ist die KI-Strategie mit der übergeordneten Unternehmens- und Digitalstrategie verknüpft?',          en: 'Is the AI strategy linked to the overarching corporate and digital strategy?' },
        lowLabel:  { de: 'AI-Aktivitäten isoliert — kein Bezug zur Gesamtstrategie erkennbar',                                  en: 'AI activities isolated — no connection to overall strategy visible' },
        l2Label:   { de: 'Einzelne Verbindungspunkte, keine formale Verknüpfung',                                               en: 'Individual connection points, no formal linkage' },
        l3Label:   { de: 'AI als Teil der Digitalstrategie erwähnt, operative Verknüpfung fehlt',                               en: 'AI mentioned as part of digital strategy, operational linkage missing' },
        l4Label:   { de: 'Formale Verknüpfung, AI-Ziele in einigen strategischen OKRs abgebildet',                              en: 'Formal linkage, AI goals reflected in some strategic OKRs' },
        highLabel: { de: 'AI ist expliziter Bestandteil der Unternehmensstrategie mit messbaren strategischen OKRs',            en: 'AI is an explicit part of corporate strategy with measurable strategic OKRs' },
      },
      {
        id: 'strat_6',
        text:      { de: 'Werden externe AI-Entwicklungen und Regulatorik (EU AI Act, DSGVO-Updates) systematisch beobachtet?', en: 'Are external AI developments and regulation (EU AI Act, GDPR updates) systematically monitored?' },
        lowLabel:  { de: 'Kein systematisches Monitoring externer AI-Entwicklungen',                                            en: 'No systematic monitoring of external AI developments' },
        l2Label:   { de: 'Einzelne Personen verfolgen Trends, kein strukturierter Prozess',                                     en: 'Individuals follow trends, no structured process' },
        l3Label:   { de: 'Regelmäßiges informelles Monitoring, gelegentliche Briefings',                                        en: 'Regular informal monitoring, occasional briefings' },
        l4Label:   { de: 'Strukturierter Trend-Radar-Prozess etabliert, Board noch nicht regelmäßig informiert',                en: 'Structured trend radar process established, board not yet regularly informed' },
        highLabel: { de: 'Dedizierter Trend-Radar-Prozess mit regelmäßigem Board-Briefing und konkreten Handlungsableitungen',  en: 'Dedicated trend radar process with regular board briefing and clear actionable next steps' },
      },
      {
        id: 'strat_7',
        text:      { de: 'Gibt es eine klare Positionierung zu Make-or-Buy bei KI-Investitionen (Eigenentwicklung vs. SaaS/Platform)?', en: 'Is there a clear make-or-buy positioning for AI investments (build vs. SaaS/Platform)?' },
        lowLabel:  { de: 'Keine Entscheidungsmatrix — reaktive Einzelentscheidungen ohne Kriterien',                            en: 'No decision matrix — reactive individual decisions without criteria' },
        l2Label:   { de: 'Implizite Präferenz vorhanden, nicht formalisiert',                                                   en: 'Implicit preference exists, not formalized' },
        l3Label:   { de: 'Erste Kriterien definiert, noch keine einheitliche Entscheidungsmatrix',                               en: 'First criteria defined, no unified decision matrix yet' },
        l4Label:   { de: 'Entscheidungsrahmen etabliert, wird konsistent für neue Investitionen genutzt',                       en: 'Decision framework established, used consistently for new investments' },
        highLabel: { de: 'Klarer Entscheidungsrahmen mit Kriterien für Eigenentwicklung vs. Lizenzierung vs. Partnership',      en: 'Clear decision framework with criteria for build vs. license vs. partnership' },
      },
    ],
  },
  {
    id: 'culture',
    label: { de: 'Kultur & Leadership', en: 'Culture & Leadership' },
    weight: 0.05,
    questions: [
      {
        id: 'cult_1',
        text:      { de: 'Besteht aktive Executive-Sponsorship für KI auf C-Level oder Vorstandsebene?',                        en: 'Is there active executive sponsorship for AI at C-level or board level?' },
        lowLabel:  { de: 'Kein C-Level-Commitment erkennbar, AI gilt als IT-Thema',                                             en: 'No C-level commitment visible, AI seen as an IT topic' },
        l2Label:   { de: 'Einzelne Führungskraft interessiert, kein aktives Sponsoring',                                        en: 'Individual leader interested, no active sponsorship' },
        l3Label:   { de: 'AI-Sponsor benannt, Engagement noch nicht durchgängig sichtbar',                                      en: 'AI sponsor named, engagement not yet consistently visible' },
        l4Label:   { de: 'Aktives C-Level-Sponsoring, AI auf Führungsagenda verankert',                                         en: 'Active C-level sponsorship, AI on leadership agenda' },
        highLabel: { de: 'AI auf Vorstandsagenda, dedizierter CDO oder CAIO, öffentliches Commitment',                          en: 'AI on board agenda, dedicated CDO or CAIO, public commitment' },
      },
      {
        id: 'cult_2',
        text:      { de: 'Ist die Organisation offen für KI-getriebenen Wandel und aktives Veränderungsmanagement?',            en: 'Is the organization open to AI-driven change and active change management?' },
        lowLabel:  { de: 'Hoher Widerstand gegen Veränderungen, Wandel wird gebremst',                                          en: 'High resistance to change, transformation being slowed' },
        l2Label:   { de: 'Widerstand vorhanden, Change-Kommunikation beginnt',                                                  en: 'Resistance present, change communication beginning' },
        l3Label:   { de: 'Teile der Organisation aufgeschlossen, Change-Initiativen laufen',                                    en: 'Parts of the organization receptive, change initiatives underway' },
        l4Label:   { de: 'Mehrheitlich offene Haltung, Change-Management-Kompetenzen aufgebaut',                                en: 'Majority open mindset, change management competencies built' },
        highLabel: { de: 'Etablierte Change-Management-Kultur, Organisation initiiert aktiv Transformation',                     en: 'Established change management culture, organization actively initiates transformation' },
      },
      {
        id: 'cult_3',
        text:      { de: 'Werden KI-Projektergebnisse mit definierten KPIs gemessen und transparent kommuniziert?',              en: 'Are AI project results measured with defined KPIs and communicated transparently?' },
        lowLabel:  { de: 'Kein Erfolgs-Tracking, keine Kommunikation von Ergebnissen',                                          en: 'No success tracking, no communication of results' },
        l2Label:   { de: 'Einzelne Projekte mit KPIs, keine systematische Kommunikation',                                       en: 'Individual projects with KPIs, no systematic communication' },
        l3Label:   { de: 'KPIs für wichtigste Projekte definiert, Kommunikation punktuell',                                     en: 'KPIs defined for key projects, communication sporadic' },
        l4Label:   { de: 'Regelmäßige Ergebniskommunikation, Dashboard in Aufbau',                                              en: 'Regular results communication, dashboard in progress' },
        highLabel: { de: 'Regelmäßige AI-Impact-Reports an Stakeholder, KPIs im Management-Dashboard',                          en: 'Regular AI impact reports to stakeholders, KPIs in management dashboard' },
      },
      {
        id: 'cult_4',
        text:      { de: 'Gibt es eine Fehlerkultur, die Experimente und schnelle Iterationen bei KI-Projekten fördert?',       en: 'Is there an error culture that encourages experimentation and fast iteration in AI projects?' },
        lowLabel:  { de: 'Fehler werden bestraft, Risikovermeidung dominiert — Innovation gehemmt',                             en: 'Errors are punished, risk avoidance dominates — innovation inhibited' },
        l2Label:   { de: 'Fehlertoleranz in Einzelbereichen, kulturell noch nicht verankert',                                   en: 'Error tolerance in individual areas, not yet culturally embedded' },
        l3Label:   { de: 'Experiment-Mindset sichtbar, psychologische Sicherheit im Aufbau',                                    en: 'Experiment mindset visible, psychological safety being built' },
        l4Label:   { de: 'Fehlerkultur etabliert, strukturierte Retrospektiven für AI-Projekte',                                en: 'Error culture established, structured retrospectives for AI projects' },
        highLabel: { de: 'Psychologische Sicherheit verankert, strukturiertes Experiment-Framework mit Lernprozessen',          en: 'Psychological safety embedded, structured experimentation framework with learning processes' },
      },
      {
        id: 'cult_5',
        text:      { de: 'Werden KI-Erfolgsgeschichten intern kommuniziert und als Inspiration für weitere Teams genutzt?',     en: 'Are AI success stories communicated internally and used as inspiration for other teams?' },
        lowLabel:  { de: 'Keine interne Kommunikation zu KI-Projekten und -Ergebnissen',                                        en: 'No internal communication about AI projects and results' },
        l2Label:   { de: 'Ad-hoc-Kommunikation bei größeren Erfolgen, kein strukturiertes Format',                              en: 'Ad-hoc communication on major successes, no structured format' },
        l3Label:   { de: 'Gelegentliche Showcases, kein regelmäßiger Rhythmus',                                                 en: 'Occasional showcases, no regular rhythm' },
        l4Label:   { de: 'Regelmäßige AI-Showcases, Community of Practice im Aufbau',                                           en: 'Regular AI showcases, community of practice being built' },
        highLabel: { de: 'Regelmäßige Showcases, AI-Newsletter, aktive Community of Practice mit externen Impulsen',            en: 'Regular showcases, AI newsletter, active Community of Practice with external input' },
      },
      {
        id: 'cult_6',
        text:      { de: 'Gibt es dedizierte Zeit oder Budget für KI-Experimente (Innovation Labs, Hackathons, 20%-Zeit)?',     en: 'Is dedicated time or budget available for AI experiments (innovation labs, hackathons, 20%-time)?' },
        lowLabel:  { de: 'Keine Ressourcen für Experimente — Innovation entsteht nur im Tagesgeschäft',                         en: 'No resources for experimentation — innovation only happens in day-to-day work' },
        l2Label:   { de: 'Einzelne Hackathons, kein kontinuierliches Experimentierbudget',                                      en: 'Occasional hackathons, no continuous experiment budget' },
        l3Label:   { de: 'Kleineres Innovations-Budget vorhanden, Nutzung noch opportunistisch',                                en: 'Smaller innovation budget available, use still opportunistic' },
        l4Label:   { de: 'Strukturiertes Innovations-Budget und -Format, Teilnahme wächst',                                     en: 'Structured innovation budget and format, participation growing' },
        highLabel: { de: 'Formalisiertes Innovations-Budget mit strukturierten Experiment-Prozessen und Erfolgs-Tracking',      en: 'Formalized innovation budget with structured experimentation processes and success tracking' },
      },
      {
        id: 'cult_7',
        text:      { de: 'Werden betroffene Mitarbeiter proaktiv in die Gestaltung von KI-Projekten einbezogen?',               en: 'Are affected employees proactively involved in shaping AI projects?' },
        lowLabel:  { de: 'Mitarbeiter werden nicht einbezogen — Top-down-Einführung ohne Beteiligung',                          en: 'Employees not included — top-down rollout without participation' },
        l2Label:   { de: 'Information nachgelagert, keine aktive Mitgestaltung',                                                en: 'Information provided after the fact, no active co-design' },
        l3Label:   { de: 'Ausgewählte Mitarbeiter in Pilotprojekte einbezogen, kein Standard',                                  en: 'Selected employees included in pilot projects, no standard' },
        l4Label:   { de: 'Regelmäßige Einbindung in Projektteams, Co-Creation wird aufgebaut',                                  en: 'Regular involvement in project teams, co-creation being built' },
        highLabel: { de: 'Co-Creation mit Mitarbeitern als Standard, Change-Agents in jeder Einheit aktiv',                     en: 'Co-creation with employees as standard, change agents active in every unit' },
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
  level: number; label: { de: string; en: string }; color: string; bgColor: string
} {
  if (score < 1.5) return { level: 1, label: { de: 'Level 1 — Initial',     en: 'Level 1 — Initial'     }, color: 'text-red-600',    bgColor: 'bg-red-50 border-red-200'     }
  if (score < 2.5) return { level: 2, label: { de: 'Level 2 — Emerging',    en: 'Level 2 — Emerging'    }, color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200'}
  if (score < 3.5) return { level: 3, label: { de: 'Level 3 — Defined',     en: 'Level 3 — Defined'     }, color: 'text-amber-600',  bgColor: 'bg-amber-50 border-amber-200' }
  if (score < 4.5) return { level: 4, label: { de: 'Level 4 — Managed',     en: 'Level 4 — Managed'     }, color: 'text-emerald-600',bgColor: 'bg-emerald-50 border-emerald-200'}
  return             { level: 5, label: { de: 'Level 5 — Optimizing', en: 'Level 5 — Optimizing' }, color: 'text-emerald-700',bgColor: 'bg-emerald-100 border-emerald-300'}
}

export type InfraOption = 'cloud' | 'hybrid' | 'onprem' | 'multicloud'
export type DataOption = 'centralized' | 'distributed' | 'silos' | 'to_build'
export type SkillsOption = 'team' | 'individuals' | 'business' | 'external'
export type UseCaseOption = 'predictive' | 'generative' | 'vision' | 'automation'
export type ComplianceOption = 'strict' | 'moderate' | 'low' | 'undefined'
export type PatternId = 'cloud_native' | 'managed' | 'hybrid' | 'onprem' | 'data_first'

export interface WizardAnswers {
  infra?: InfraOption
  data?: DataOption
  skills?: SkillsOption
  usecase?: UseCaseOption
  compliance?: ComplianceOption
}

export interface WizardOption {
  id: string
  label: string
  description: string
}

export interface WizardStep {
  id: keyof WizardAnswers
  step: number
  question: string
  context: string
  options: WizardOption[]
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'infra',
    step: 1,
    question: 'Wo läuft Ihre aktuelle IT-Infrastruktur?',
    context: 'Die Infrastruktur-Basis bestimmt maßgeblich, welche AI-Architektur-Muster praktikabel sind.',
    options: [
      { id: 'cloud', label: 'Public Cloud', description: 'Hauptsächlich AWS, Azure oder GCP — Workloads laufen in der Cloud' },
      { id: 'hybrid', label: 'Hybrid (Cloud + On-Premise)', description: 'Teile on-premise, Teile in der Cloud — verbunden über VPN oder Private Link' },
      { id: 'onprem', label: 'Hauptsächlich On-Premise', description: 'Eigene Rechenzentren oder Private Cloud, wenig externer Cloud-Einsatz' },
      { id: 'multicloud', label: 'Multi-Cloud', description: 'Mehrere Cloud-Anbieter parallel im Einsatz' },
    ],
  },
  {
    id: 'data',
    step: 2,
    question: 'Wie schätzen Sie Ihre aktuelle Datensituation ein?',
    context: 'Datenqualität und -verfügbarkeit sind der häufigste Engpass bei AI-Projekten.',
    options: [
      { id: 'centralized', label: 'Zentralisiert und strukturiert', description: 'Data Warehouse oder Data Lake vorhanden, Daten gut dokumentiert und zugänglich' },
      { id: 'distributed', label: 'Verteilt in Quellsystemen', description: 'Daten in ERP, CRM, etc. — Zugang möglich, aber keine zentrale Plattform' },
      { id: 'silos', label: 'Siloisiert, wenig Austausch', description: 'Daten in Abteilungssilos, technische und organisatorische Barrieren' },
      { id: 'to_build', label: 'Infrastruktur muss noch aufgebaut werden', description: 'Kaum strukturierte Daten vorhanden — Foundation fehlt noch' },
    ],
  },
  {
    id: 'skills',
    step: 3,
    question: 'Welche AI/ML-Kompetenzen sind intern verfügbar?',
    context: 'Eigene Kompetenzen bestimmen, wie viel Eigenentwicklung vs. Managed Services sinnvoll ist.',
    options: [
      { id: 'team', label: 'Dediziertes Data-Science/MLOps-Team', description: 'Mehrere Data Scientists, ML Engineers oder AI-Spezialisten im Haus' },
      { id: 'individuals', label: 'Einzelne Data Scientists / Analysten', description: 'Einige Personen mit ML-Kenntnissen, kein vollständiges Team' },
      { id: 'business', label: 'Business-Verständnis, wenig Technik', description: 'Domänenwissen vorhanden, AI/ML-Umsetzungskompetenz fehlt noch' },
      { id: 'external', label: 'Primär externe Partner', description: 'Umsetzung hauptsächlich über Dienstleister und Beratung' },
    ],
  },
  {
    id: 'usecase',
    step: 4,
    question: 'Welcher AI-Use-Case-Typ steht im Fokus?',
    context: 'Unterschiedliche Use-Case-Typen erfordern unterschiedliche Technologie-Stacks.',
    options: [
      { id: 'predictive', label: 'Predictive Analytics / Machine Learning', description: 'Prognosen, Klassifikation, Anomalie-Erkennung auf strukturierten Daten' },
      { id: 'generative', label: 'Generative AI / LLM', description: 'Chatbots, Dokumentenanalyse, Textgenerierung, RAG-Systeme' },
      { id: 'vision', label: 'Computer Vision', description: 'Bildanalyse, Qualitätskontrolle, OCR, visuelle Inspektion' },
      { id: 'automation', label: 'Prozessautomatisierung (RPA + AI)', description: 'Intelligente Dokument-Verarbeitung, Workflow-Automatisierung' },
    ],
  },
  {
    id: 'compliance',
    step: 5,
    question: 'Welche Compliance- und Datenschutz-Anforderungen gelten?',
    context: 'Regulatorische Anforderungen begrenzen manche Architektur-Optionen und beeinflussen die Datenhaltung.',
    options: [
      { id: 'strict', label: 'Strenge Regulierung', description: 'Hochrisiko (EU AI Act), Finanz (BAFIN), Medizin (MDR), HR-Entscheidungen — On-Premise oder Private Cloud oft Pflicht' },
      { id: 'moderate', label: 'Moderate Anforderungen', description: 'DSGVO-konform, interne Richtlinien, ISO 27001 — Cloud mit EU-Rechenzentrum akzeptiert' },
      { id: 'low', label: 'Geringe Anforderungen', description: 'Rein interner Einsatz, keine personenbezogenen Daten, kein Kundenkontakt' },
      { id: 'undefined', label: 'Noch nicht definiert', description: 'Compliance-Anforderungen müssen noch geklärt werden' },
    ],
  },
]

export interface ArchitectureLayer {
  name: string
  role: string
  components: string[]
  examples: string
}

export interface ArchitectureResult {
  patternId: PatternId
  pattern: string
  summary: string
  color: { bg: string; border: string; badge: string; title: string }
  layers: ArchitectureLayer[]
  keyDecisions: string[]
  nextSteps: string[]
}

const PATTERNS: Record<PatternId, Omit<ArchitectureResult, 'patternId'>> = {
  cloud_native: {
    pattern: 'Cloud-native AI Platform',
    summary: 'Vollständig cloud-basierte ML-Plattform mit eigenem Team. Maximale Skalierbarkeit und Entwicklungsgeschwindigkeit — bei bewusstem Umgang mit Cloud-Abhängigkeit.',
    color: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', title: 'text-blue-800' },
    layers: [
      { name: 'Daten-Infrastruktur', role: 'Zentrale Datenbasis für Training und Inference', components: ['Cloud Data Warehouse', 'Object Storage (Data Lake)', 'Stream Processing', 'Data Catalog'], examples: 'z. B. Snowflake/BigQuery + S3/GCS + Kafka + Apache Atlas' },
      { name: 'Modell & Entwicklung', role: 'Training, Experimente, Feature Engineering', components: ['Cloud ML Platform', 'Feature Store', 'Model Registry', 'Experiment Tracking'], examples: 'z. B. Azure ML / SageMaker / Vertex AI + MLflow' },
      { name: 'Serving & Monitoring', role: 'Modell-Deployment und Betriebsüberwachung', components: ['Container Orchestration', 'API Gateway', 'Model Monitoring', 'CI/CD für Modelle'], examples: 'z. B. Kubernetes/KServe + Kong + Prometheus/Grafana' },
      { name: 'Anwendung & Governance', role: 'Business-Integration und Compliance', components: ['Interne Anwendungen', 'AI Registry', 'Audit Logging', 'Cloud-native Observability'], examples: 'z. B. Power Apps + MLflow Registry + Cloud Monitor' },
    ],
    keyDecisions: ['Cloud-Anbieter-Auswahl: Azure vs. AWS vs. GCP — Lock-in vs. Kostenstruktur abwägen', 'Zentrales Data Warehouse oder dezentrales Data Mesh?', 'Eigene MLOps-Pipeline oder Cloud-nativer Managed Service?', 'Feature Store: Zentralisiert (Feast/Tecton) oder Ad-hoc?', 'Multi-Tenant oder Single-Tenant für ML-Workloads?'],
    nextSteps: ['Cloud-Anbieter evaluieren und ML-Plattform-PoC aufsetzen (Monat 1–2)', 'Data Lake und Warehouse Migration/Aufbau (Monat 2–4)', 'Erstes Modell mit Cloud-Services in Produktion bringen (Monat 3–5)', 'MLOps-Pipeline: CI/CD für Modelle, Monitoring, automatisches Retraining (Monat 4–6)', 'Governance-Framework und AI Registry einrichten (parallel)'],
  },
  managed: {
    pattern: 'Managed AI Services',
    summary: 'Maximale Nutzung von vortrainierten Modellen und Managed Services. Geringer Infrastrukturaufwand, schnelle Time-to-Value — ideal für Teams ohne eigene ML-Expertise.',
    color: { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700', title: 'text-violet-800' },
    layers: [
      { name: 'Daten-Infrastruktur', role: 'Managed Storage und ETL ohne Eigenaufwand', components: ['Managed Cloud Storage', 'ETL-as-a-Service', 'Datenbank (managed)', 'Basis-Datenqualität'], examples: 'z. B. Azure Blob + AWS Glue + RDS/CosmosDB' },
      { name: 'Modell & Entwicklung', role: 'Pre-built Modelle und No-/Low-Code-ML', components: ['Foundation Models (LLM/Vision)', 'No-Code ML Tools', 'Prompt Engineering / RAG', 'Fine-Tuning nach Bedarf'], examples: 'z. B. Azure OpenAI + AWS Bedrock + Google Vertex AI' },
      { name: 'Serving & Monitoring', role: 'Managed Endpoints und Built-in Observability', components: ['Managed API Endpoints', 'Built-in Monitoring', 'Rate Limiting', 'Basis-Audit-Log'], examples: 'z. B. Azure AI Studio / Bedrock Endpoints + CloudWatch' },
      { name: 'Anwendung & Governance', role: 'Schnelle Business-Integration mit Low-Code', components: ['Low-Code-Integrationen', 'Workflow-Automation', 'Basis-Audit-Trail', 'Datenschutz-konforme Konfiguration'], examples: 'z. B. Power Automate + Teams Bot + Azure Policy' },
    ],
    keyDecisions: ['Welche Foundation Models? (GPT-4o, Llama, Gemini) — Kosten, Datenschutz, Qualität', 'Prompt Engineering vs. Fine-Tuning vs. RAG — welcher Ansatz für den Use Case?', 'Single-Provider oder Multi-Provider? Lock-in vs. Flexibilität', 'Datenschutz: Private Deployment oder Managed Service mit DPA?', 'Ausstiegsstrategie bei Vendor-Problemen oder Kostenexplosion planen'],
    nextSteps: ['Provider-Evaluierung und DPA/Datenschutz-Assessment (Monat 1)', 'Pilotprojekt mit einem Use Case aufsetzen (Monat 1–2)', 'Prompt Engineering / RAG-Architektur für Use Case entwickeln (Monat 2–3)', 'Rollout mit Business-KPIs und Monitoring (Monat 3–4)', 'FinOps: Token-Kosten überwachen und optimieren (ab Monat 2)'],
  },
  hybrid: {
    pattern: 'Hybrid AI Platform',
    summary: 'Kombination aus on-premise Kerninfrastruktur und Cloud für skalierbare Workloads. Maximale Flexibilität bei kontrollierten Compliance-Anforderungen.',
    color: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', title: 'text-amber-800' },
    layers: [
      { name: 'Daten-Infrastruktur', role: 'Hybride Datenhaltung mit klarer Klassifikation', components: ['On-Premise Data Lake / Warehouse', 'Cloud-Tier für unkritische Daten', 'Datenkatalog mit Klassifikation', 'Sichere Daten-Replikation'], examples: 'z. B. Hadoop/Spark on-premise + Azure Data Lake + Apache Atlas' },
      { name: 'Modell & Entwicklung', role: 'Training on-premise, Cloud-Burst für GPU-intensive Workloads', components: ['On-Premise Training Cluster', 'Cloud Burst für GPU-Training', 'Shared Model Registry', 'Einheitlicher Experiment-Tracker'], examples: 'z. B. Kubeflow on-premise + Cloud GPU Spot Instances + MLflow' },
      { name: 'Serving & Monitoring', role: 'Lokales Serving mit Cloud-Failover-Option', components: ['On-Premise Model Serving', 'Cloud Failover / Burst Serving', 'Zentrales Monitoring', 'VPN/Private Link'], examples: 'z. B. Seldon/TorchServe + KServe Cloud + Grafana' },
      { name: 'Anwendung & Governance', role: 'Hybride Apps mit zentralem Audit-Trail', components: ['Hybride Unternehmensanwendungen', 'Zentrales Identity Management', 'Data Lineage', 'Einheitliches Audit-Log'], examples: 'z. B. Internal apps + Azure AD + Apache Atlas + ELK Stack' },
    ],
    keyDecisions: ['Workload-Klassifikation: Was bleibt on-premise? (Datenschutz-Kriterien definieren)', 'Cloud für Training + On-Premise für Inference — oder umgekehrt?', 'Netzwerklatenz und Bandbreite zwischen Standorten messen und planen', 'Single Identity Provider für Cloud und On-Premise (Azure AD, Okta)', 'FinOps-Modell für Cloud-Kosten-Chargeback definieren'],
    nextSteps: ['Workload-Klassifizierung und Datenschutz-Assessment (Monat 1)', 'Netzwerk- und Security-Architektur für Hybrid-Konnektivität (Monat 1–2)', 'Einheitliche Identity- und Access-Management-Lösung einrichten (Monat 2)', 'Pilotprojekt in der Hybrid-Architektur mit repräsentativem Use Case (Monat 2–4)', 'FinOps-Dashboard für Cloud-Kosten-Transparenz (ab Monat 3)'],
  },
  onprem: {
    pattern: 'On-Premise AI (Data Sovereignty)',
    summary: 'Vollständig on-premise AI-Infrastruktur für maximale Datenkontrolle und Compliance. Höherer Infrastrukturaufwand, aber volle Transparenz und Regulierungskonformität.',
    color: { bg: 'bg-slate-50', border: 'border-slate-300', badge: 'bg-slate-100 text-slate-700', title: 'text-slate-800' },
    layers: [
      { name: 'Daten-Infrastruktur', role: 'Lokale, vollständig kontrollierte Datenbasis', components: ['Enterprise Data Warehouse', 'On-Premise Object Storage', 'Lokale Stream Processing', 'Air-Gap-fähige Datenpipelines'], examples: 'z. B. PostgreSQL/Greenplum + MinIO + Kafka on-premise' },
      { name: 'Modell & Entwicklung', role: 'Privates GPU-Cluster und lokales MLOps', components: ['Privater GPU-Cluster', 'Lokale MLOps-Plattform', 'Private Model Registry', 'Internes Container-Registry'], examples: 'z. B. Bare-metal GPU + Kubeflow/MLflow + Harbor' },
      { name: 'Serving & Monitoring', role: 'Interne Microservices ohne Cloud-Abhängigkeit', components: ['Interne Model Serving', 'Lokales API Gateway', 'SIEM-Integration', 'On-Premise Monitoring Stack'], examples: 'z. B. TorchServe/Triton + Kong on-premise + Splunk + Prometheus' },
      { name: 'Anwendung & Governance', role: 'Interne Apps mit vollständigem Audit-Trail', components: ['On-Premise Anwendungen', 'Vollständiger Audit-Trail', 'Air-Gap-Deployment-Option', 'Interne Zertifizierungsstelle'], examples: 'z. B. Interne Web-Apps + Splunk SIEM + GitLab (lokal)' },
    ],
    keyDecisions: ['GPU-Infrastruktur: Kauf, Leasing oder Private Cloud (z. B. Nutanix, VMware)?', 'MLOps-Platform: Kubeflow vs. MLflow vs. kommerzielle Lösung (Weights & Biases on-premise)', 'Datenzugangs-Governance: Wer darf welche Daten für Training nutzen?', 'Update-Strategie: Wie werden Modelle aktualisiert ohne externe Abhängigkeit?', 'Air-Gap-Option: Ist vollständige Netzwerk-Isolation für bestimmte Systeme erforderlich?'],
    nextSteps: ['GPU-Infrastruktur-Assessment: Anforderungen definieren, Angebote einholen (Monat 1)', 'Netzwerk-Segregation und Security-Konzept (Monat 1–2)', 'MLOps-Platform-Auswahl und Pilotinstallation (Monat 2–3)', 'Daten-Governance-Framework und Zugangskontrollen (Monat 2–3)', 'Erstes Modell vollständig on-premise trainieren und deployen (Monat 4–6)'],
  },
  data_first: {
    pattern: 'Data-First Approach',
    summary: 'Bevor AI sinnvoll ist, muss die Datenbasis stimmen. Investition in Datenplattform, -qualität und -governance jetzt — AI-Use-Cases auf stabiler Basis in 3–6 Monaten.',
    color: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', title: 'text-emerald-800' },
    layers: [
      { name: 'Daten-Infrastruktur', role: 'Foundation zuerst: Einheitliche, qualitätsgesicherte Datenbasis aufbauen', components: ['Cloud Data Warehouse als Fundament', 'Ingestion Pipelines (ELT)', 'Data Quality Monitoring', 'Data Catalog & Lineage'], examples: 'z. B. Snowflake/BigQuery + dbt + Great Expectations + Alation' },
      { name: 'Erste AI-Ebene: Managed Services', role: 'Quick Wins mit Managed AI während Datenplattform wächst', components: ['Managed ML Services (No-Code)', 'Business Intelligence & Analytics', 'Einfache Automatisierungen', 'A/B-Testing-Framework'], examples: 'z. B. Azure ML Studio + Power BI + Power Automate' },
      { name: 'Serving & Monitoring', role: 'Einfach starten, dann ausbauen', components: ['REST-API-Layer', 'Basis-Monitoring', 'Datenqualitäts-Dashboards', 'Alerts bei Datenproblemen'], examples: 'z. B. FastAPI + Azure Monitor + dbt-Docs' },
      { name: 'Governance als Fundament', role: 'Governance von Anfang an — nicht nachträglich', components: ['Master Data Management', 'Dateneigentümerschaft definieren', 'DSGVO-Compliance in Datenpipelines', 'AI-Governance-Framework (vorbereiten)'], examples: 'z. B. Atlan/Collibra + Internal data owners + GDPR-Annotation' },
    ],
    keyDecisions: ['Datenplattform-Architektur: Data Warehouse, Data Lake oder Lakehouse (z. B. Delta Lake)?', 'Datenqualität und Master Data Management als erste Investition priorisieren', 'Self-Service Analytics vor KI: BI-Tools zuerst für Business-Value', 'AI-Ready-Kriterien definieren: Wann sind Daten gut genug für ML?', 'Team-Entwicklung: Data Engineer zuerst, dann Data Scientist'],
    nextSteps: ['Data Audit: Welche Daten existieren, wo, welche Qualität? (Monat 1)', 'Datenplattform-Architektur entscheiden und Cloud-Anbieter wählen (Monat 1–2)', 'Core-Ingestion-Pipelines für 2–3 wichtigste Quellsysteme (Monat 2–4)', 'Data Catalog, Governance und Qualitäts-Monitoring einrichten (Monat 3–5)', 'Ersten AI Use Case auf stabiler Datenbasis umsetzen (Monat 5+)'],
  },
}

export function selectPattern(answers: WizardAnswers): PatternId {
  if (answers.compliance === 'strict' || answers.infra === 'onprem') return 'onprem'
  if (answers.data === 'to_build' || answers.data === 'silos') return 'data_first'
  if (answers.skills === 'business' || answers.skills === 'external') return 'managed'
  if (answers.usecase === 'generative' && answers.skills !== 'team') return 'managed'
  if (answers.infra === 'hybrid') return 'hybrid'
  if (answers.infra === 'cloud' || answers.infra === 'multicloud') return 'cloud_native'
  return 'hybrid'
}

export function generateArchitecture(answers: WizardAnswers): ArchitectureResult {
  const patternId = selectPattern(answers)
  return { patternId, ...PATTERNS[patternId] }
}

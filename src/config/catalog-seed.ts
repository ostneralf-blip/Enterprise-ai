// Seed data for component_catalog and roles_catalog.
// Applied via POST /api/admin/catalog/seed (admin-only, idempotent upsert).

export type SeedComponent = {
  name: string; vendor: string; category: string; architecture_layer: string
  hosting: string[]; dsgvo_status: string; eu_ai_act_risk: string
  sap_compatible: boolean; sap_components?: string[]
  use_case_types: string[]; infra_types: string[]; cloud_provider: string
  icon_name: string | null; website_url?: string; description: string
  tags: string[]
  suggests?: string[]
  incompatible_with?: string[]
}

export const SEED_COMPONENTS: SeedComponent[] = [
  // ── DATA LAYER — SAP ──────────────────────────────────────────────────────
  { name: 'SAP Datasphere', vendor: 'SAP', category: 'data_platform', architecture_layer: 'data',
    hosting: ['eu','us','hybrid'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: true, sap_components: ['datasphere','btp'],
    use_case_types: ['predictive','generative'], infra_types: ['cloud','hybrid'], cloud_provider: 'sap',
    icon_name: 'simple-icons:sap', website_url: 'https://www.sap.com/datasphere',
    description: 'Unternehmensweite Datenplattform von SAP auf BTP — Data Fabric, semantische Modelle, Datenmarktplatz.',
    tags: ['sap','data','btp','dw','s4hana','datasphere'],
    suggests: ['SAP HANA Cloud', 'SAP AI Core', 'SAP MDG', 'SAP Integration Suite'],
    incompatible_with: [] },

  { name: 'SAP HANA Cloud', vendor: 'SAP', category: 'data_platform', architecture_layer: 'data',
    hosting: ['eu','us','hybrid'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: true, sap_components: ['btp'],
    use_case_types: ['predictive','automation'], infra_types: ['cloud'], cloud_provider: 'sap',
    icon_name: 'simple-icons:sap', website_url: 'https://www.sap.com/hana',
    description: 'In-memory Cloud-Datenbank auf SAP BTP für Echtzeit-Analytik und transaktionale Workloads.',
    tags: ['sap','hana','in-memory','btp','s4hana'],
    suggests: ['SAP Datasphere', 'SAP AI Core', 'SAP BTP Auth & Trust'],
    incompatible_with: [] },

  // ── DATA LAYER — AWS ──────────────────────────────────────────────────────
  { name: 'Amazon Redshift', vendor: 'AWS', category: 'data_platform', architecture_layer: 'data',
    hosting: ['us','eu'], dsgvo_status: 'conditional', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['predictive','generative'], infra_types: ['cloud'], cloud_provider: 'aws',
    icon_name: 'logos:aws', website_url: 'https://aws.amazon.com/redshift',
    description: 'Vollständig verwaltetes Cloud-Data-Warehouse für petabyte-skalige Analytik.',
    tags: ['aws','dw','analytics'] },

  { name: 'Amazon S3', vendor: 'AWS', category: 'data_platform', architecture_layer: 'data',
    hosting: ['us','eu'], dsgvo_status: 'conditional', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['predictive','generative','vision'], infra_types: ['cloud'], cloud_provider: 'aws',
    icon_name: 'logos:aws', website_url: 'https://aws.amazon.com/s3',
    description: 'Objektspeicher für Data Lakes, ML-Datasets und Modell-Artefakte.',
    tags: ['aws','storage','data-lake'] },

  { name: 'AWS Glue', vendor: 'AWS', category: 'data_platform', architecture_layer: 'data',
    hosting: ['us','eu'], dsgvo_status: 'conditional', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['predictive','automation'], infra_types: ['cloud'], cloud_provider: 'aws',
    icon_name: 'logos:aws', website_url: 'https://aws.amazon.com/glue',
    description: 'Serverloser ETL-Dienst für Datenvorbereitung und -integration.',
    tags: ['aws','etl','data-prep'] },

  // ── DATA LAYER — Azure ────────────────────────────────────────────────────
  { name: 'Microsoft Fabric', vendor: 'Microsoft', category: 'data_platform', architecture_layer: 'data',
    hosting: ['eu','us'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['predictive','generative'], infra_types: ['cloud'], cloud_provider: 'azure',
    icon_name: 'logos:microsoft', website_url: 'https://www.microsoft.com/fabric',
    description: 'Einheitliche Analytik-Plattform: Data Factory, Synapse, Power BI und OneLake in einer SaaS-Umgebung.',
    tags: ['azure','fabric','analytics','onelake'] },

  { name: 'Azure Synapse Analytics', vendor: 'Microsoft', category: 'data_platform', architecture_layer: 'data',
    hosting: ['eu','us'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['predictive'], infra_types: ['cloud'], cloud_provider: 'azure',
    icon_name: 'logos:microsoft', website_url: 'https://azure.microsoft.com/synapse',
    description: 'Analytik-Service für Data Warehousing und Big Data.',
    tags: ['azure','synapse','dw'] },

  // ── DATA LAYER — Open Source ──────────────────────────────────────────────
  { name: 'Apache Kafka', vendor: 'Apache', category: 'integration', architecture_layer: 'data',
    hosting: ['eu','us','onprem','hybrid'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: true, use_case_types: ['predictive','automation'], infra_types: ['cloud','onprem','hybrid'], cloud_provider: 'independent',
    icon_name: 'logos:kafka', website_url: 'https://kafka.apache.org',
    description: 'Verteiltes Event-Streaming-System für Echtzeit-Datenpipelines und ML-Feature-Feeds.',
    tags: ['kafka','streaming','events','oss'] },

  { name: 'Snowflake', vendor: 'Snowflake', category: 'data_platform', architecture_layer: 'data',
    hosting: ['eu','us'], dsgvo_status: 'conditional', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['predictive','generative'], infra_types: ['cloud'], cloud_provider: 'independent',
    icon_name: 'logos:snowflake-icon', website_url: 'https://www.snowflake.com',
    description: 'Cloud Data Platform mit nativer AI/ML-Integration und Snowpark für Python/Java.',
    tags: ['snowflake','dw','cloud'] },

  { name: 'Databricks', vendor: 'Databricks', category: 'data_platform', architecture_layer: 'data',
    hosting: ['eu','us'], dsgvo_status: 'conditional', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['predictive','generative'], infra_types: ['cloud','hybrid'], cloud_provider: 'independent',
    icon_name: 'simple-icons:databricks', website_url: 'https://databricks.com',
    description: 'Lakehouse-Plattform auf Delta Lake — vereint Data Engineering, ML und Analytics.',
    tags: ['databricks','lakehouse','spark','ml'] },

  // ── MODEL LAYER — SAP ─────────────────────────────────────────────────────
  { name: 'SAP AI Core', vendor: 'SAP', category: 'ml_platform', architecture_layer: 'model',
    hosting: ['eu','us'], dsgvo_status: 'compliant', eu_ai_act_risk: 'limited',
    sap_compatible: true, sap_components: ['ai_core','btp'],
    use_case_types: ['generative','predictive'], infra_types: ['cloud'], cloud_provider: 'sap',
    icon_name: 'simple-icons:sap', website_url: 'https://www.sap.com/ai-core',
    description: 'ML Operations und Modell-Serving auf SAP BTP — trainiert, verwaltet und deployed AI-Modelle in SAP-Landschaften.',
    tags: ['sap','mlops','model','btp','ai-core'],
    suggests: ['SAP GenAI Hub', 'SAP AI Launchpad', 'SAP Datasphere', 'SAP BTP Auth & Trust'],
    incompatible_with: [] },

  { name: 'SAP GenAI Hub', vendor: 'SAP', category: 'llm', architecture_layer: 'model',
    hosting: ['eu','us'], dsgvo_status: 'compliant', eu_ai_act_risk: 'limited',
    sap_compatible: true, sap_components: ['genai_hub','ai_core','btp'],
    use_case_types: ['generative'], infra_types: ['cloud'], cloud_provider: 'sap',
    icon_name: 'simple-icons:sap', website_url: 'https://www.sap.com/genai-hub',
    description: 'Einheitlicher Zugriff auf LLMs (GPT-4o, Llama, Mistral) über SAP BTP mit eingebautem Prompt-Management und Usage Tracking.',
    tags: ['sap','llm','genai','btp','joule'],
    suggests: ['SAP AI Core', 'SAP AI Launchpad', 'SAP Datasphere'],
    incompatible_with: [] },

  // ── MODEL LAYER — AWS ─────────────────────────────────────────────────────
  { name: 'Amazon SageMaker', vendor: 'AWS', category: 'ml_platform', architecture_layer: 'model',
    hosting: ['us','eu'], dsgvo_status: 'conditional', eu_ai_act_risk: 'limited',
    sap_compatible: false, use_case_types: ['predictive','generative','vision'], infra_types: ['cloud'], cloud_provider: 'aws',
    icon_name: 'logos:aws', website_url: 'https://aws.amazon.com/sagemaker',
    description: 'Vollständig verwaltete ML-Plattform: Datenaufbereitung, Training, Tuning und Deployment in einer Umgebung.',
    tags: ['aws','ml','sagemaker'] },

  { name: 'AWS Bedrock', vendor: 'AWS', category: 'llm', architecture_layer: 'model',
    hosting: ['us','eu'], dsgvo_status: 'conditional', eu_ai_act_risk: 'limited',
    sap_compatible: false, use_case_types: ['generative'], infra_types: ['cloud'], cloud_provider: 'aws',
    icon_name: 'logos:aws', website_url: 'https://aws.amazon.com/bedrock',
    description: 'Serverloser LLM-Zugriff auf Claude (Anthropic), Llama, Titan und weitere Modelle via API.',
    tags: ['aws','llm','bedrock','claude'] },

  // ── MODEL LAYER — Azure ───────────────────────────────────────────────────
  { name: 'Azure Machine Learning', vendor: 'Microsoft', category: 'ml_platform', architecture_layer: 'model',
    hosting: ['eu','us'], dsgvo_status: 'compliant', eu_ai_act_risk: 'limited',
    sap_compatible: false, use_case_types: ['predictive','generative','vision'], infra_types: ['cloud'], cloud_provider: 'azure',
    icon_name: 'logos:microsoft', website_url: 'https://azure.microsoft.com/machine-learning',
    description: 'Enterprise ML-Plattform mit Responsible AI-Tooling, AutoML und integriertem MLOps.',
    tags: ['azure','ml','automl'] },

  { name: 'Azure OpenAI Service', vendor: 'Microsoft', category: 'llm', architecture_layer: 'model',
    hosting: ['eu','us'], dsgvo_status: 'compliant', eu_ai_act_risk: 'limited',
    sap_compatible: false, use_case_types: ['generative'], infra_types: ['cloud'], cloud_provider: 'azure',
    icon_name: 'logos:microsoft', website_url: 'https://azure.microsoft.com/openai',
    description: 'GPT-4o, o3 und weitere OpenAI-Modelle in Azure-Infrastruktur mit DSGVO-Verträgen und EU-Hosting-Option.',
    tags: ['azure','gpt','openai','llm'] },

  // ── MODEL LAYER — EU-first LLMs ───────────────────────────────────────────
  { name: 'Mistral AI', vendor: 'Mistral AI', category: 'llm', architecture_layer: 'model',
    hosting: ['eu'], dsgvo_status: 'compliant', eu_ai_act_risk: 'limited',
    sap_compatible: true, sap_components: ['genai_hub'],
    use_case_types: ['generative'], infra_types: ['cloud','onprem'], cloud_provider: 'independent',
    icon_name: null, website_url: 'https://mistral.ai',
    description: 'Europäisches LLM (Paris, FR) — Mistral Large, Mixtral und offene Modelle. DSGVO-konform, EU-Hosting.',
    tags: ['llm','eu','france','open-source'] },

  { name: 'Aleph Alpha', vendor: 'Aleph Alpha', category: 'llm', architecture_layer: 'model',
    hosting: ['eu','onprem'], dsgvo_status: 'compliant', eu_ai_act_risk: 'limited',
    sap_compatible: false, use_case_types: ['generative'], infra_types: ['cloud','onprem'], cloud_provider: 'independent',
    icon_name: null, website_url: 'https://aleph-alpha.com',
    description: 'Deutsches KI-Unternehmen (Heidelberg) — Luminous Modelle, souveräne KI-Option für DSGVO-kritische Anwendungen.',
    tags: ['llm','eu','germany','sovereign'] },

  { name: 'Ollama', vendor: 'Ollama', category: 'llm', architecture_layer: 'model',
    hosting: ['onprem'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['generative'], infra_types: ['onprem'], cloud_provider: 'independent',
    icon_name: null, website_url: 'https://ollama.com',
    description: 'Lokales LLM-Serving auf eigener Hardware — Llama, Mistral, Phi und weitere Modelle ohne Cloud-Abhängigkeit.',
    tags: ['onprem','llm','local','privacy'] },

  // ── SERVING LAYER ─────────────────────────────────────────────────────────
  { name: 'SAP AI Launchpad', vendor: 'SAP', category: 'serving', architecture_layer: 'serving',
    hosting: ['eu','us'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: true, sap_components: ['ai_core','btp'],
    use_case_types: ['predictive','generative'], infra_types: ['cloud'], cloud_provider: 'sap',
    icon_name: 'simple-icons:sap', description: 'UI-Werkzeug für Verwaltung von AI-Szenarien und Deployments auf SAP AI Core.',
    tags: ['sap','serving','launchpad','btp'],
    suggests: ['SAP AI Core', 'SAP GenAI Hub'],
    incompatible_with: [] },

  { name: 'SageMaker Endpoints', vendor: 'AWS', category: 'serving', architecture_layer: 'serving',
    hosting: ['us','eu'], dsgvo_status: 'conditional', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['predictive','generative'], infra_types: ['cloud'], cloud_provider: 'aws',
    icon_name: 'logos:aws', description: 'Verwaltete Echtzeit- und Batch-Inference-Endpoints auf AWS SageMaker.',
    tags: ['aws','serving','inference'] },

  { name: 'vLLM', vendor: 'vLLM', category: 'serving', architecture_layer: 'serving',
    hosting: ['onprem','hybrid'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['generative'], infra_types: ['onprem','hybrid'], cloud_provider: 'independent',
    icon_name: null, website_url: 'https://vllm.ai', description: 'Hochperformantes LLM-Serving-Framework mit PagedAttention — für OnPrem-GPU-Cluster.',
    tags: ['serving','llm','onprem','gpu'] },

  { name: 'BentoML', vendor: 'BentoML', category: 'serving', architecture_layer: 'serving',
    hosting: ['eu','us','onprem','hybrid'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['predictive','generative','vision'], infra_types: ['cloud','onprem','hybrid'], cloud_provider: 'independent',
    icon_name: null, website_url: 'https://bentoml.com', description: 'Unified Model Serving Framework — verpackt ML-Modelle in produktionsreife APIs.',
    tags: ['serving','ml','oss','api'] },

  // ── MLOPS LAYER ───────────────────────────────────────────────────────────
  { name: 'MLflow', vendor: 'Linux Foundation', category: 'mlops', architecture_layer: 'mlops',
    hosting: ['eu','us','onprem','hybrid'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['predictive','generative'], infra_types: ['cloud','onprem','hybrid'], cloud_provider: 'independent',
    icon_name: 'simple-icons:mlflow', website_url: 'https://mlflow.org', description: 'Open-Source ML Lifecycle Management: Experiment Tracking, Model Registry, Deployment.',
    tags: ['mlops','tracking','registry','oss'] },

  { name: 'Kubeflow', vendor: 'CNCF', category: 'mlops', architecture_layer: 'mlops',
    hosting: ['onprem','hybrid'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['predictive'], infra_types: ['onprem','hybrid'], cloud_provider: 'independent',
    icon_name: 'simple-icons:kubeflow', website_url: 'https://kubeflow.org', description: 'Kubernetes-native ML Pipelines und Experiment Tracking.',
    tags: ['mlops','kubernetes','pipelines','cncf'] },

  { name: 'SageMaker Pipelines', vendor: 'AWS', category: 'mlops', architecture_layer: 'mlops',
    hosting: ['us','eu'], dsgvo_status: 'conditional', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['predictive','generative'], infra_types: ['cloud'], cloud_provider: 'aws',
    icon_name: 'logos:aws', description: 'Verwaltete CI/CD-Pipeline für ML auf AWS — automatisiert Training, Evaluation und Deployment.',
    tags: ['aws','mlops','pipelines'] },

  { name: 'Azure ML Pipelines', vendor: 'Microsoft', category: 'mlops', architecture_layer: 'mlops',
    hosting: ['eu','us'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['predictive','generative'], infra_types: ['cloud'], cloud_provider: 'azure',
    icon_name: 'logos:microsoft', description: 'Automatisierte ML-Workflows in Azure mit Responsible AI-Integration.',
    tags: ['azure','mlops','pipelines'] },

  { name: 'ZenML', vendor: 'ZenML', category: 'mlops', architecture_layer: 'mlops',
    hosting: ['eu','us','onprem','hybrid'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['predictive','generative'], infra_types: ['cloud','onprem','hybrid'], cloud_provider: 'independent',
    icon_name: null, website_url: 'https://zenml.io', description: 'Framework-agnostisches MLOps-Framework — verbindet Datenpipelines mit jedem Cloud oder OnPrem-Stack.',
    tags: ['mlops','pipelines','oss'] },

  { name: 'GitHub Actions', vendor: 'GitHub', category: 'mlops', architecture_layer: 'mlops',
    hosting: ['eu','us','onprem'], dsgvo_status: 'conditional', eu_ai_act_risk: 'minimal',
    sap_compatible: true, use_case_types: ['predictive','generative','automation'], infra_types: ['cloud','onprem','hybrid'], cloud_provider: 'independent',
    icon_name: 'logos:github-actions', website_url: 'https://github.com/features/actions', description: 'CI/CD-Automatisierung für ML-Pipelines, Tests und Model-Deployments.',
    tags: ['ci-cd','automation','github'] },

  // ── MONITORING LAYER ──────────────────────────────────────────────────────
  { name: 'Grafana', vendor: 'Grafana Labs', category: 'monitoring', architecture_layer: 'mlops',
    hosting: ['eu','us','onprem','hybrid'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['predictive','generative'], infra_types: ['cloud','onprem','hybrid'], cloud_provider: 'independent',
    icon_name: 'logos:grafana', website_url: 'https://grafana.com', description: 'Open-Source Monitoring- und Observability-Plattform für AI-Inference-Metriken.',
    tags: ['monitoring','observability','oss'] },

  { name: 'Evidently AI', vendor: 'Evidently', category: 'monitoring', architecture_layer: 'mlops',
    hosting: ['eu','us','onprem','hybrid'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['predictive'], infra_types: ['cloud','onprem','hybrid'], cloud_provider: 'independent',
    icon_name: null, website_url: 'https://evidentlyai.com', description: 'ML-Modell-Monitoring: Data Drift, Modell-Performance und Fairness-Metriken.',
    tags: ['monitoring','drift','ml-ops','oss'] },

  // ── GOVERNANCE LAYER ──────────────────────────────────────────────────────
  { name: 'SAP MDG', vendor: 'SAP', category: 'governance', architecture_layer: 'governance',
    hosting: ['eu','us','onprem'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: true, sap_components: ['mdg'],
    use_case_types: ['automation'], infra_types: ['cloud','onprem'], cloud_provider: 'sap',
    icon_name: 'simple-icons:sap', description: 'SAP Master Data Governance — zentrales Stammdaten-Management für AI-Trainingsdaten-Qualität.',
    tags: ['sap','mdm','governance','data-quality','s4hana'],
    suggests: ['SAP Datasphere', 'SAP HANA Cloud'],
    incompatible_with: [] },

  { name: 'Microsoft Purview', vendor: 'Microsoft', category: 'governance', architecture_layer: 'governance',
    hosting: ['eu','us'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['automation'], infra_types: ['cloud'], cloud_provider: 'azure',
    icon_name: 'logos:microsoft', website_url: 'https://azure.microsoft.com/purview', description: 'Unified Data Governance: Datenkatalog, Data Lineage, Compliance und Klassifizierung.',
    tags: ['azure','governance','catalog','compliance'] },

  { name: 'OpenMetadata', vendor: 'OpenMetadata', category: 'governance', architecture_layer: 'governance',
    hosting: ['eu','us','onprem','hybrid'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['automation'], infra_types: ['cloud','onprem','hybrid'], cloud_provider: 'independent',
    icon_name: null, website_url: 'https://open-metadata.org', description: 'Open-Source Datenkatalog mit Data Lineage, Collaboration und Qualitäts-Checks.',
    tags: ['governance','catalog','lineage','oss'] },

  { name: 'AWS DataZone', vendor: 'AWS', category: 'governance', architecture_layer: 'governance',
    hosting: ['us','eu'], dsgvo_status: 'conditional', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['automation'], infra_types: ['cloud'], cloud_provider: 'aws',
    icon_name: 'logos:aws', description: 'Verwalteter Datenkatalog und -marktplatz für sicheres Datensharing im Unternehmen.',
    tags: ['aws','governance','catalog'] },

  // ── SECURITY LAYER ────────────────────────────────────────────────────────
  { name: 'SAP BTP Auth & Trust', vendor: 'SAP', category: 'security', architecture_layer: 'security',
    hosting: ['eu','us'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: true, sap_components: ['btp'],
    use_case_types: ['automation'], infra_types: ['cloud'], cloud_provider: 'sap',
    icon_name: 'simple-icons:sap', description: 'Identity & Access Management auf SAP BTP — SAML, OAuth 2.0, OIDC für SAP-Anwendungen.',
    tags: ['sap','iam','auth','btp','oauth','oidc'],
    suggests: ['SAP Integration Suite', 'SAP AI Core'],
    incompatible_with: [] },

  { name: 'Microsoft Entra ID', vendor: 'Microsoft', category: 'security', architecture_layer: 'security',
    hosting: ['eu','us'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: true, use_case_types: ['automation'], infra_types: ['cloud','hybrid'], cloud_provider: 'azure',
    icon_name: 'logos:microsoft', description: 'Enterprise Identity Platform (vormals Azure AD) — SSO, MFA, Conditional Access für AI-Anwendungen.',
    tags: ['azure','iam','sso','entra'] },

  { name: 'HashiCorp Vault', vendor: 'HashiCorp', category: 'security', architecture_layer: 'security',
    hosting: ['eu','us','onprem','hybrid'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['automation'], infra_types: ['cloud','onprem','hybrid'], cloud_provider: 'independent',
    icon_name: 'logos:vault', website_url: 'https://vaultproject.io', description: 'Secrets Management und Datenverschlüsselung — zentrale Verwaltung von API-Keys, Zertifikaten und Credentials.',
    tags: ['security','secrets','vault','oss'] },

  { name: 'Keycloak', vendor: 'Red Hat', category: 'security', architecture_layer: 'security',
    hosting: ['eu','us','onprem','hybrid'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['automation'], infra_types: ['onprem','hybrid'], cloud_provider: 'independent',
    icon_name: 'logos:keycloak', website_url: 'https://keycloak.org', description: 'Open-Source Identity & Access Management — SSO, OAuth 2.0, OIDC für OnPrem-Deployments.',
    tags: ['iam','sso','onprem','oss'] },

  // ── APPLICATION / INTEGRATION ─────────────────────────────────────────────
  { name: 'SAP Integration Suite', vendor: 'SAP', category: 'integration', architecture_layer: 'application',
    hosting: ['eu','us'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: true, sap_components: ['btp'],
    use_case_types: ['automation'], infra_types: ['cloud','hybrid'], cloud_provider: 'sap',
    icon_name: 'simple-icons:sap', description: 'Integrationsplattform für SAP- und Non-SAP-Systeme auf BTP — API Management, Event Mesh, Integration Flows.',
    tags: ['sap','integration','btp','api','event-mesh','s4hana'],
    suggests: ['SAP BTP Auth & Trust', 'SAP Datasphere', 'SAP AI Core'],
    incompatible_with: [] },

  { name: 'SAP Joule Studio', vendor: 'SAP', category: 'application', architecture_layer: 'application',
    hosting: ['eu','us'], dsgvo_status: 'compliant', eu_ai_act_risk: 'limited',
    sap_compatible: true, sap_components: ['joule','btp','genai_hub'],
    use_case_types: ['generative','automation'], infra_types: ['cloud'], cloud_provider: 'sap',
    icon_name: 'simple-icons:sap', description: 'Low-Code-Entwicklungsumgebung für Joule AI Agents in SAP-Prozessen.',
    tags: ['sap','joule','agent','low-code','btp'],
    suggests: ['SAP GenAI Hub', 'SAP AI Core', 'SAP Integration Suite'],
    incompatible_with: [] },

  { name: 'AWS API Gateway', vendor: 'AWS', category: 'integration', architecture_layer: 'application',
    hosting: ['us','eu'], dsgvo_status: 'conditional', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['generative','automation'], infra_types: ['cloud'], cloud_provider: 'aws',
    icon_name: 'logos:aws', description: 'Vollständig verwaltetes API Gateway für REST, HTTP und WebSocket APIs.',
    tags: ['aws','api','gateway'] },

  { name: 'Azure API Management', vendor: 'Microsoft', category: 'integration', architecture_layer: 'application',
    hosting: ['eu','us'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['generative','automation'], infra_types: ['cloud','hybrid'], cloud_provider: 'azure',
    icon_name: 'logos:microsoft', description: 'Hybrides API Management mit LLM-Gateway-Funktion für Azure OpenAI.',
    tags: ['azure','api','gateway','llm'] },

  { name: 'Kong Gateway', vendor: 'Kong', category: 'integration', architecture_layer: 'application',
    hosting: ['eu','us','onprem','hybrid'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    sap_compatible: false, use_case_types: ['generative','automation'], infra_types: ['cloud','onprem','hybrid'], cloud_provider: 'independent',
    icon_name: 'logos:kong', website_url: 'https://konghq.com', description: 'Open-Source API Gateway mit AI-Plugin-Ökosystem und LLM-Proxy-Funktionalität.',
    tags: ['api','gateway','oss','llm-proxy'] },
]

// ── SEED: Roles Catalog ────────────────────────────────────────────────────────
export type SeedRole = {
  role_name: string; role_category: string; archetype_levels: string[]
  description: string; responsibilities: string[]; skills_required: string[]
  fte_range: string; priority_per_archetype: Record<string, string>
}

export const SEED_ROLES: SeedRole[] = [
  { role_name: 'Chief AI Officer (CAIO)', role_category: 'strategic',
    archetype_levels: ['transformer'],
    description: 'Verantwortet die unternehmensweite KI-Strategie, Governance und Priorisierung von AI-Investitionen.',
    responsibilities: ['AI-Strategie & Roadmap', 'AI-Governance-Rahmen', 'Stakeholder-Management C-Level', 'ROI-Verantwortung AI-Portfolio'],
    skills_required: ['AI/ML Grundlagen', 'Strategisches Management', 'Change Management', 'Risk Management'],
    fte_range: '1 FTE', priority_per_archetype: { starter: 'optional', scaler: 'should', transformer: 'must' } },

  { role_name: 'Chief Data Officer (CDO)', role_category: 'strategic',
    archetype_levels: ['scaler', 'transformer'],
    description: 'Strategische Verantwortung für Daten als Unternehmensressource — Datenstrategie, Qualität und Governance.',
    responsibilities: ['Datenstrategie', 'Data Governance Framework', 'Datenqualitätsprogramme', 'Regulatorik & Compliance'],
    skills_required: ['Data Management', 'Governance', 'Strategie', 'DSGVO'],
    fte_range: '1 FTE', priority_per_archetype: { starter: 'optional', scaler: 'must', transformer: 'must' } },

  { role_name: 'AI CoE Lead', role_category: 'strategic',
    archetype_levels: ['scaler', 'transformer'],
    description: 'Leitet das AI Center of Excellence — koordiniert Use-Case-Portfolio, Best Practices und Enablement.',
    responsibilities: ['Use-Case-Portfolio-Management', 'AI-Methodiken & Standards', 'Cross-funktionale Koordination', 'Team-Aufbau'],
    skills_required: ['AI/ML', 'Projektmanagement', 'Kommunikation', 'Facilitation'],
    fte_range: '1 FTE', priority_per_archetype: { starter: 'optional', scaler: 'must', transformer: 'must' } },

  { role_name: 'Data Engineer', role_category: 'technical',
    archetype_levels: ['starter', 'scaler', 'transformer'],
    description: 'Entwickelt und betreibt Datenpipelines, Data Lakes und Feature Stores für ML-Modelle.',
    responsibilities: ['ETL/ELT-Pipelines', 'Data Lake Architektur', 'Feature Engineering', 'Datenqualitäts-Checks'],
    skills_required: ['Python/SQL', 'Spark/dbt', 'Cloud Data Services', 'Orchestration (Airflow/Prefect)'],
    fte_range: '1–3 FTE', priority_per_archetype: { starter: 'must', scaler: 'must', transformer: 'must' } },

  { role_name: 'Data Scientist', role_category: 'technical',
    archetype_levels: ['starter', 'scaler', 'transformer'],
    description: 'Entwickelt und trainiert ML-Modelle, führt explorative Datenanalysen durch und bewertet Modellqualität.',
    responsibilities: ['Modell-Entwicklung', 'Experiment Design', 'Feature Engineering', 'Modell-Evaluation'],
    skills_required: ['Python', 'ML-Frameworks (sklearn/PyTorch)', 'Statistik', 'MLflow'],
    fte_range: '1–5 FTE', priority_per_archetype: { starter: 'must', scaler: 'must', transformer: 'must' } },

  { role_name: 'ML Engineer', role_category: 'technical',
    archetype_levels: ['scaler', 'transformer'],
    description: 'Bringt ML-Modelle in Produktion — Serving, Optimierung, A/B-Testing und Performance-Monitoring.',
    responsibilities: ['Model Serving & Deployment', 'API-Entwicklung', 'Performance-Optimierung', 'A/B-Testing'],
    skills_required: ['Python', 'Docker/Kubernetes', 'ML Serving (vLLM/BentoML)', 'CI/CD'],
    fte_range: '1–3 FTE', priority_per_archetype: { starter: 'optional', scaler: 'must', transformer: 'must' } },

  { role_name: 'MLOps Engineer', role_category: 'technical',
    archetype_levels: ['scaler', 'transformer'],
    description: 'Aufbau und Betrieb der ML-Infrastruktur — Pipelines, Monitoring, Model Registry und Automatisierung.',
    responsibilities: ['ML-Pipeline-Automatisierung', 'Model Monitoring & Drift Detection', 'Infrastructure as Code', 'MLflow/Kubeflow'],
    skills_required: ['DevOps', 'Kubernetes', 'ML Platforms', 'Monitoring (Grafana/Prometheus)'],
    fte_range: '1–2 FTE', priority_per_archetype: { starter: 'optional', scaler: 'must', transformer: 'must' } },

  { role_name: 'Prompt Engineer', role_category: 'technical',
    archetype_levels: ['starter', 'scaler', 'transformer'],
    description: 'Optimiert LLM-Prompts, entwickelt RAG-Systeme und bewertet Ausgabequalität generativer Modelle.',
    responsibilities: ['Prompt Design & Optimierung', 'RAG-Architektur', 'Evaluation & Benchmarking', 'Few-Shot / Fine-Tuning'],
    skills_required: ['LLM-Kenntnisse', 'Python', 'Evaluation Frameworks', 'Domänenwissen'],
    fte_range: '0.5–2 FTE', priority_per_archetype: { starter: 'should', scaler: 'must', transformer: 'must' } },

  { role_name: 'AI Ethics / Risk Officer', role_category: 'governance',
    archetype_levels: ['scaler', 'transformer'],
    description: 'Bewertet AI-Systeme auf Risiken, Fairness und EU-AI-Act-Konformität — pflegt das AI-Risiko-Register.',
    responsibilities: ['AI Risk Assessment', 'EU AI Act Compliance', 'Bias & Fairness Audits', 'Ethik-Guidelines'],
    skills_required: ['EU AI Act', 'DSGVO', 'Risk Management', 'AI/ML Grundlagen'],
    fte_range: '1 FTE', priority_per_archetype: { starter: 'optional', scaler: 'should', transformer: 'must' } },

  { role_name: 'Data Privacy Manager', role_category: 'governance',
    archetype_levels: ['starter', 'scaler', 'transformer'],
    description: 'Sichert DSGVO-Konformität bei der Verarbeitung personenbezogener Daten in AI-Systemen.',
    responsibilities: ['DSGVO-Impact-Assessments (DSFA)', 'Auftragsverarbeitungsverträge', 'Datenschutz-by-Design', 'Behördenkommunikation'],
    skills_required: ['DSGVO', 'Datenschutzrecht', 'AI/ML Grundlagen', 'Risikobewertung'],
    fte_range: '0.5–1 FTE', priority_per_archetype: { starter: 'should', scaler: 'must', transformer: 'must' } },

  { role_name: 'AI Product Owner', role_category: 'operational',
    archetype_levels: ['starter', 'scaler', 'transformer'],
    description: 'Verantwortet Produkt-Backlog und Use-Case-Priorisierung für AI-Produkte — Brücke zwischen Business und Tech.',
    responsibilities: ['Use-Case-Priorisierung', 'Anforderungsanalyse', 'Stakeholder-Abstimmung', 'Sprint-Planung'],
    skills_required: ['Produktmanagement', 'Agile', 'Domänenwissen', 'AI/ML Grundlagen'],
    fte_range: '1 FTE', priority_per_archetype: { starter: 'should', scaler: 'must', transformer: 'must' } },

  { role_name: 'Business AI Champion', role_category: 'operational',
    archetype_levels: ['starter', 'scaler', 'transformer'],
    description: 'Treibt AI-Adoption im Fachbereich — identifiziert Use Cases, koordiniert Piloten und sammelt Feedback.',
    responsibilities: ['Use-Case-Identifikation im Fachbereich', 'Change Management', 'User Training', 'Feedback-Koordination'],
    skills_required: ['Domänenwissen', 'Change Management', 'Kommunikation', 'AI-Grundlagen'],
    fte_range: '0.5 FTE (pro Fachbereich)', priority_per_archetype: { starter: 'must', scaler: 'must', transformer: 'must' } },

  { role_name: 'Enterprise Architect (AI)', role_category: 'technical',
    archetype_levels: ['scaler', 'transformer'],
    description: 'Definiert die übergreifende AI-Architektur — Integration mit bestehenden Systemen, Cloud-Strategie und Datenflüsse.',
    responsibilities: ['AI-Architektur-Design', 'Technology Selection', 'Integration-Patterns', 'SAP-Landschaft + AI-Stack'],
    skills_required: ['Enterprise Architecture', 'Cloud (SAP BTP / AWS / Azure)', 'Integrationsmuster', 'AI/ML'],
    fte_range: '1 FTE', priority_per_archetype: { starter: 'optional', scaler: 'should', transformer: 'must' } },
]

// ── SEED: Joule Use Cases ─────────────────────────────────────────────────────
export type JouleUseCase = {
  name: string
  domain: string
  description: string
  sap_products: string[]
  complexity: 'starter' | 'scaler' | 'transformer'
}

export const SEED_JOULE_USE_CASES: JouleUseCase[] = [
  // Finance
  { name: 'Receipt Analysis',      domain: 'Finance', complexity: 'starter',     description: 'Automatische Belegerfassung und -kategorisierung via Joule Agent.',                                    sap_products: ['joule', 'concur'] },
  { name: 'Expense Validation',    domain: 'Finance', complexity: 'starter',     description: 'Automatisierte Compliance-Prüfung von Reisekostenabrechnungen.',                                        sap_products: ['joule', 'concur'] },
  { name: 'Dispute Resolution',    domain: 'Finance', complexity: 'scaler',      description: 'KI-gestützte Klärung von Zahlungsstreitigkeiten mit automatisierten Vorschlägen.',                      sap_products: ['joule', 's4hana'] },
  { name: 'Accounting Accruals',   domain: 'Finance', complexity: 'scaler',      description: 'KI-Unterstützung bei der Abgrenzungsbuchung auf Basis historischer Daten.',                            sap_products: ['joule', 's4hana'] },
  { name: 'Cash Management AI',    domain: 'Finance', complexity: 'transformer', description: 'Liquiditätsprognosen und automatisierte Cash-Flow-Optimierungsvorschläge.',                            sap_products: ['joule', 's4hana', 'datasphere'] },
  // Supply Chain
  { name: 'Supplier Onboarding',       domain: 'Supply Chain', complexity: 'starter',     description: 'Automatisiertes Onboarding neuer Lieferanten mit Risikobewertung.',                          sap_products: ['joule', 'ariba'] },
  { name: 'Field Service Dispatcher',  domain: 'Supply Chain', complexity: 'scaler',      description: 'Intelligente Disposition von Servicetechnikern basierend auf Skills und Standort.',          sap_products: ['joule', 'field-service-mgmt'] },
  { name: 'Maintenance Planner',       domain: 'Supply Chain', complexity: 'scaler',      description: 'Prädiktive Wartungsplanung auf Basis von Sensordaten und SAP PM.',                          sap_products: ['joule', 's4hana', 'iot'] },
  { name: 'Production Planning AI',    domain: 'Supply Chain', complexity: 'transformer', description: 'Optimierte Produktionsplanung mit KI-gestützter Bedarfsprognose.',                          sap_products: ['joule', 'ibp', 's4hana'] },
  // HR
  { name: 'HR Service Agent',       domain: 'HR', complexity: 'starter',     description: 'Konversationeller HR-Assistent für Mitarbeiteranfragen zu Urlaub, Benefits und Policies.',              sap_products: ['joule', 'successfactors'] },
  { name: 'Performance Preparation',domain: 'HR', complexity: 'scaler',      description: 'KI-Unterstützung bei Vorbereitung von Performance-Reviews mit Daten aus SAP SuccessFactors.',          sap_products: ['joule', 'successfactors'] },
  { name: 'People Intelligence',    domain: 'HR', complexity: 'transformer', description: 'Workforce Analytics und Skill-Gap-Analyse für strategische Personalplanung.',                          sap_products: ['joule', 'successfactors', 'datasphere'] },
  // Procurement
  { name: 'Bid Analysis',       domain: 'Procurement', complexity: 'starter', description: 'Automatisierte Analyse und Vergleich von Lieferantenangeboten.',                sap_products: ['joule', 'ariba'] },
  { name: 'Sourcing Events AI', domain: 'Procurement', complexity: 'scaler',  description: 'KI-gestützte Vorbereitung und Auswertung von Ausschreibungen.',                sap_products: ['joule', 'ariba'] },
  // Customer Experience
  { name: 'Case Classification',   domain: 'CX', complexity: 'starter',     description: 'Automatische Klassifizierung und Routing von Kundenservice-Anfragen.',                                  sap_products: ['joule', 'service-cloud'] },
  { name: 'Digital Service Agent', domain: 'CX', complexity: 'scaler',      description: 'KI-Assistent für Self-Service-Kundeninteraktionen im Web- und Mobile-Kanal.',                          sap_products: ['joule', 'cx', 'service-cloud'] },
  { name: 'Quote Creation',        domain: 'CX', complexity: 'transformer', description: 'Intelligente Angebotserstellung mit Konfigurationsvorschlägen aus SAP CPQ.',                          sap_products: ['joule', 'cpq', 'crm'] },
  // Transformation
  { name: 'Process Content Recommender', domain: 'Transformation', complexity: 'starter',     description: 'Empfiehlt Best-Practice-Prozesse aus SAP Signavio basierend auf Unternehmenskontext.', sap_products: ['joule', 'signavio'] },
  { name: 'Value Case Creation',         domain: 'Transformation', complexity: 'scaler',      description: 'KI-gestützte Erstellung von Business Cases für SAP-Transformationsprojekte.',          sap_products: ['joule', 'leanix'] },
  { name: 'Dashboard Analyzer',          domain: 'Transformation', complexity: 'transformer', description: 'Natürlichsprachliche Analyse und Interpretation von SAP Analytics Cloud Dashboards.',  sap_products: ['joule', 'sac', 'datasphere'] },
]

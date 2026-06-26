export type FieldType = 'text' | 'password' | 'url'

export interface ConfigField {
  key: string
  label: string
  type: FieldType
  placeholder: string
  required: boolean
  helpText?: string
  helpUrl?: string
}

export interface SourceTypeSchema {
  label: string
  technology: 'REST API' | 'YAML' | 'JSON' | 'SDK'
  description: string
  defaultUrl: string
  docUrl?: string
  fields: ConfigField[]
}

export const SOURCE_TYPE_SCHEMAS: Record<string, SourceTypeSchema> = {
  huggingface: {
    label: 'HuggingFace Hub',
    technology: 'REST API',
    description: 'Open-Source Modelle mit Apache-2.0-Filter',
    defaultUrl: 'https://huggingface.co/api/models',
    docUrl: 'https://huggingface.co/docs/hub/api',
    fields: [
      { key: 'api_key', label: 'API Token (optional)', type: 'password', placeholder: 'hf_...', required: false, helpText: 'Erhöht das Rate-Limit auf 1000 Req/h', helpUrl: 'https://huggingface.co/settings/tokens' },
    ],
  },
  cncf_landscape: {
    label: 'CNCF Landscape',
    technology: 'YAML',
    description: 'Cloud Native Computing Foundation — kuratierte Tool-Übersicht',
    defaultUrl: 'https://raw.githubusercontent.com/cncf/landscape/HEAD/landscape.yml',
    docUrl: 'https://landscape.cncf.io',
    fields: [],
  },
  papers_with_code: {
    label: 'Papers With Code',
    technology: 'REST API',
    description: 'ML-Methoden aus wissenschaftlichen Publikationen, kein Key nötig',
    defaultUrl: 'https://paperswithcode.com/api/v1',
    docUrl: 'https://paperswithcode.com/api/v1/docs',
    fields: [],
  },
  nvidia_ngc: {
    label: 'NVIDIA NGC',
    technology: 'REST API',
    description: 'GPU-optimierte NVIDIA-Modelle und Container',
    defaultUrl: 'https://api.ngc.nvidia.com/v2',
    docUrl: 'https://docs.ngc.nvidia.com',
    fields: [
      { key: 'api_key', label: 'NGC API Key (optional)', type: 'password', placeholder: 'ngc-...', required: false, helpText: 'Öffentliche Modelle ohne Key abrufbar', helpUrl: 'https://ngc.nvidia.com/setup/api-key' },
    ],
  },
  openai_models: {
    label: 'OpenAI Models',
    technology: 'REST API',
    description: 'GPT-4o, GPT-4o-mini, DALL-E, Whisper — Bearer-Token-Auth',
    defaultUrl: 'https://api.openai.com/v1/models',
    docUrl: 'https://platform.openai.com/docs/api-reference/models',
    fields: [
      { key: 'api_key', label: 'OpenAI API Key', type: 'password', placeholder: 'sk-...', required: true, helpUrl: 'https://platform.openai.com/api-keys' },
    ],
  },
  anthropic_models: {
    label: 'Anthropic Models',
    technology: 'REST API',
    description: 'Claude-Modelle — x-api-key Header',
    defaultUrl: 'https://api.anthropic.com/v1/models',
    docUrl: 'https://docs.anthropic.com/en/api/models-list',
    fields: [
      { key: 'api_key', label: 'Anthropic API Key', type: 'password', placeholder: 'sk-ant-...', required: true, helpUrl: 'https://console.anthropic.com/settings/keys' },
    ],
  },
  google_gemini: {
    label: 'Google Gemini',
    technology: 'REST API',
    description: 'Gemini-Modelle via Generative Language API — Key als Query-Parameter',
    defaultUrl: 'https://generativelanguage.googleapis.com/v1/models',
    docUrl: 'https://ai.google.dev/api',
    fields: [
      { key: 'api_key', label: 'Google AI Studio API Key', type: 'password', placeholder: 'AIza...', required: true, helpText: 'Kostenlos unter aistudio.google.com', helpUrl: 'https://aistudio.google.com/app/apikey' },
    ],
  },
  mistral_ai: {
    label: 'Mistral AI',
    technology: 'REST API',
    description: 'Europäische LLMs — Bearer-Token-Auth, API kompatibel zu OpenAI',
    defaultUrl: 'https://api.mistral.ai/v1/models',
    docUrl: 'https://docs.mistral.ai/api',
    fields: [
      { key: 'api_key', label: 'Mistral API Key', type: 'password', placeholder: '...', required: true, helpUrl: 'https://console.mistral.ai/api-keys' },
    ],
  },
  github_search: {
    label: 'GitHub ML Repos',
    technology: 'REST API',
    description: 'Top ML-Repositories nach Sterne — optionales Token für höheres Rate-Limit',
    defaultUrl: 'https://api.github.com/search/repositories',
    docUrl: 'https://docs.github.com/en/rest/search',
    fields: [
      { key: 'api_key', label: 'GitHub Token (optional)', type: 'password', placeholder: 'ghp_...', required: false, helpText: 'Erhöht Rate-Limit von 10 auf 30 Req/min', helpUrl: 'https://github.com/settings/tokens' },
    ],
  },
  openml: {
    label: 'OpenML',
    technology: 'REST API',
    description: 'Offene ML-Bibliothek mit Algorithmen — kein Key nötig',
    defaultUrl: 'https://www.openml.org/api/v1/json',
    docUrl: 'https://www.openml.org/apis',
    fields: [],
  },
  sap_api: {
    label: 'SAP API Hub',
    technology: 'REST API',
    description: 'SAP BTP KI-Dienste — APIKey-Header',
    defaultUrl: 'https://api.sap.com',
    docUrl: 'https://api.sap.com',
    fields: [
      { key: 'api_key', label: 'SAP API Hub Key', type: 'password', placeholder: '...', required: true, helpText: 'Kostenlos unter api.sap.com → Profil → API Key', helpUrl: 'https://api.sap.com' },
    ],
  },
  digitalocean: {
    label: 'DigitalOcean',
    technology: 'REST API',
    description: 'GPU Droplets und KI-Infrastruktur — Bearer-Token-Auth',
    defaultUrl: 'https://api.digitalocean.com/v2',
    docUrl: 'https://docs.digitalocean.com/reference/api',
    fields: [
      { key: 'api_key', label: 'DigitalOcean API Token', type: 'password', placeholder: 'dop_v1_...', required: true, helpUrl: 'https://cloud.digitalocean.com/account/api/tokens' },
    ],
  },
  vultr: {
    label: 'Vultr',
    technology: 'REST API',
    description: 'GPU Cloud-Instanzen — Bearer-Token-Auth',
    defaultUrl: 'https://api.vultr.com/v2',
    docUrl: 'https://www.vultr.com/api',
    fields: [
      { key: 'api_key', label: 'Vultr API Key', type: 'password', placeholder: '...', required: true, helpUrl: 'https://my.vultr.com/settings/#settingsapi' },
    ],
  },
  pinecone: {
    label: 'Pinecone',
    technology: 'REST API',
    description: 'Vektor-Datenbank Indizes — Api-Key-Header',
    defaultUrl: 'https://api.pinecone.io',
    docUrl: 'https://docs.pinecone.io/reference',
    fields: [
      { key: 'api_key', label: 'Pinecone API Key', type: 'password', placeholder: 'pcsk_...', required: true, helpUrl: 'https://app.pinecone.io' },
    ],
  },
  aws_service_catalog: {
    label: 'AWS Service Catalog',
    technology: 'SDK',
    description: 'AWS KI-Dienste — Access Key + Secret + Region',
    defaultUrl: 'https://api.aws.amazon.com',
    docUrl: 'https://docs.aws.amazon.com/general/latest/gr/aws-security-credentials.html',
    fields: [
      { key: 'access_key', label: 'AWS Access Key ID', type: 'password', placeholder: 'AKIA...', required: true, helpUrl: 'https://console.aws.amazon.com/iam/home#/security_credentials' },
      { key: 'secret_key', label: 'AWS Secret Access Key', type: 'password', placeholder: '...', required: true },
      { key: 'region', label: 'Region', type: 'text', placeholder: 'eu-central-1', required: true },
    ],
  },
  azure_resource_graph: {
    label: 'Azure Resource Graph',
    technology: 'REST API',
    description: 'Azure KI-Dienste — Service Principal (Client ID + Secret)',
    defaultUrl: 'https://management.azure.com/providers?api-version=2020-01-01',
    docUrl: 'https://learn.microsoft.com/en-us/rest/api/resources',
    fields: [
      { key: 'subscription_id', label: 'Subscription ID', type: 'text', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', required: true },
      { key: 'tenant_id', label: 'Tenant ID', type: 'text', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', required: true },
      { key: 'client_id', label: 'App (Client) ID', type: 'text', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: '...', required: true, helpUrl: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps' },
    ],
  },
  google_cloud_discovery: {
    label: 'Google Cloud Discovery',
    technology: 'REST API',
    description: 'GCP API-Verzeichnis — öffentlich, kein Key nötig',
    defaultUrl: 'https://www.googleapis.com/discovery/v1/apis',
    docUrl: 'https://developers.google.com/discovery/v1/reference',
    fields: [],
  },
  meta_llama: {
    label: 'Meta Llama',
    technology: 'REST API',
    description: 'Kein öffentliches API — Modelle über HuggingFace abrufbar',
    defaultUrl: 'https://llama.meta.com',
    docUrl: 'https://llama.meta.com',
    fields: [],
  },
  langchain_hub: {
    label: 'LangChain Hub',
    technology: 'REST API',
    description: 'LangSmith öffentliche Prompts und Chains',
    defaultUrl: 'https://api.smith.langchain.com/api/v1/public-prompts',
    docUrl: 'https://docs.smith.langchain.com/hub',
    fields: [
      { key: 'api_key', label: 'LangSmith API Key (optional)', type: 'password', placeholder: 'ls__...', required: false, helpUrl: 'https://smith.langchain.com/settings' },
    ],
  },
  kaggle: {
    label: 'Kaggle',
    technology: 'REST API',
    description: 'ML-Datensätze und Modelle — Basic-Auth (Username + Key)',
    defaultUrl: 'https://www.kaggle.com/api/v1',
    docUrl: 'https://www.kaggle.com/docs/api',
    fields: [
      { key: 'username', label: 'Kaggle Nutzername', type: 'text', placeholder: 'my_username', required: true, helpUrl: 'https://www.kaggle.com/settings' },
      { key: 'api_key', label: 'Kaggle API Key', type: 'password', placeholder: '...', required: true, helpUrl: 'https://www.kaggle.com/settings' },
    ],
  },
  weaviate: {
    label: 'Weaviate Cloud',
    technology: 'REST API',
    description: 'Weaviate Vektordatenbank — cluster-spezifische URL + optionaler Key',
    defaultUrl: 'https://your-cluster.weaviate.network',
    docUrl: 'https://weaviate.io/developers/weaviate/api',
    fields: [
      { key: 'cluster_url', label: 'Cluster URL', type: 'url', placeholder: 'https://xxx.weaviate.network', required: true },
      { key: 'api_key', label: 'Weaviate API Key (optional)', type: 'password', placeholder: '...', required: false, helpUrl: 'https://weaviate.io/pricing' },
    ],
  },
  mlperf: {
    label: 'MLPerf',
    technology: 'JSON',
    description: 'ML Performance Benchmarks — kein öffentliches REST-API verfügbar',
    defaultUrl: 'https://mlcommons.org',
    docUrl: 'https://mlcommons.org/benchmarks',
    fields: [],
  },
  pypi: {
    label: 'PyPI AI Packages',
    technology: 'REST API',
    description: 'Python-Pakete — API per Paketname, keine Gesamt-Liste möglich',
    defaultUrl: 'https://pypi.org/pypi',
    docUrl: 'https://warehouse.pypa.io/api-reference',
    fields: [
      { key: 'packages', label: 'Pakete (kommagetrennt)', type: 'text', placeholder: 'langchain,transformers,torch,openai,anthropic', required: true, helpText: 'Konkrete Paketnamen — PyPI hat kein Listing-API' },
    ],
  },
  anaconda: {
    label: 'Anaconda Packages',
    technology: 'REST API',
    description: 'Conda-Pakete — API Token optional',
    defaultUrl: 'https://api.anaconda.org',
    docUrl: 'https://api.anaconda.org/docs',
    fields: [
      { key: 'api_key', label: 'Anaconda API Token (optional)', type: 'password', placeholder: '...', required: false, helpUrl: 'https://anaconda.org/settings/access' },
    ],
  },
  custom_url: {
    label: 'Eigene Quelle (REST JSON)',
    technology: 'REST API',
    description: 'Beliebige JSON-API — eigene URL und optionaler Bearer-Token',
    defaultUrl: 'https://example.com/api/v1/items',
    fields: [
      { key: 'api_key', label: 'Bearer Token / API Key (optional)', type: 'password', placeholder: '...', required: false },
    ],
  },
}

export const KNOWN_SOURCE_TYPES = Object.keys(SOURCE_TYPE_SCHEMAS)

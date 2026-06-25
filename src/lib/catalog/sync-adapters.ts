import { parse as parseYaml } from 'yaml'
import type { ArchLayer } from '@/types'

export interface ComponentUpsert {
  name: string
  vendor: string | null
  category: string | null
  architecture_layer: ArchLayer | null
  hosting: string[]
  dsgvo_status: string
  eu_ai_act_risk: string
  sap_compatible: boolean
  sap_components: string[]
  use_case_types: string[]
  infra_types: string[]
  cloud_provider: string | null
  icon_name: string | null
  website_url: string | null
  description: string | null
  tags: string[]
  source: string
  is_active: boolean
}

export interface SyncResult {
  components: ComponentUpsert[]
  skipped: number
  error?: string
  /** true wenn die Quelle bewusst übersprungen wird (kein API-Key etc.) */
  skipped_source?: boolean
}

// ── HuggingFace ───────────────────────────────────────────────────────────────
interface HFModel {
  id?: string
  modelId?: string
  pipeline_tag?: string
  likes?: number
  tags?: string[]
}

export async function syncHuggingFace(baseUrl: string): Promise<SyncResult> {
  const params = new URLSearchParams({
    filter: 'text-generation',
    license: 'apache-2.0',
    limit: '30',
    sort: 'likes',
    full: 'false',
  })

  let models: HFModel[]
  try {
    const res = await fetch(`${baseUrl}?${params}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    models = await res.json() as HFModel[]
  } catch (err) {
    return { components: [], skipped: 0, error: String(err) }
  }

  const components: ComponentUpsert[] = models
    .filter(m => (m.modelId ?? m.id))
    .map(m => {
      const fullId = m.modelId ?? m.id ?? 'unknown'
      const vendor = fullId.includes('/') ? fullId.split('/')[0] : 'HuggingFace'
      return {
        name: fullId,
        vendor,
        category: 'llm',
        architecture_layer: 'model' as ArchLayer,
        hosting: ['us'],
        dsgvo_status: 'conditional',
        eu_ai_act_risk: 'limited',
        sap_compatible: false,
        sap_components: [],
        use_case_types: ['generative'],
        infra_types: ['cloud'],
        cloud_provider: 'independent',
        icon_name: null,
        website_url: `https://huggingface.co/${fullId}`,
        description: `Open-Source Sprachmodell (Apache 2.0, ${m.likes ?? 0} Likes)`,
        tags: ['huggingface', 'llm', 'open-source', 'apache-2.0'],
        source: 'huggingface',
        is_active: true,
      }
    })

  return { components, skipped: 0 }
}

// ── CNCF Landscape ────────────────────────────────────────────────────────────
const CNCF_AI_CATEGORIES = [
  'Machine Learning', 'Data & Analytics', 'Streaming & Messaging',
  'Database', 'Feature Store', 'Model Registry', 'Observability',
]

interface CNCFItem {
  name?: string
  homepage_url?: string
  description?: string
  logo?: string
}
interface CNCFSubcategory {
  name?: string
  items?: CNCFItem[]
}
interface CNCFCategory {
  name?: string
  subcategories?: CNCFSubcategory[]
}
interface CNCFLandscape {
  landscape?: CNCFCategory[]
}

export async function syncCNCF(url: string): Promise<SyncResult> {
  let landscape: CNCFLandscape
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'text/plain, application/json, application/x-yaml',
        'User-Agent': 'AI-Navigator-Catalog-Sync/1.0',
      },
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()

    // Schutz gegen HTML-Antwort (z.B. Cloudflare-Challenge)
    if (text.trimStart().startsWith('<')) {
      return {
        components: [],
        skipped: 0,
        error: 'CNCF-Endpunkt liefert HTML statt Daten. Bitte URL im Admin-Panel prüfen.',
      }
    }

    // YAML oder JSON parsen
    const ct = res.headers.get('content-type') ?? ''
    if (ct.includes('application/json') || url.endsWith('.json')) {
      landscape = JSON.parse(text) as CNCFLandscape
    } else {
      landscape = parseYaml(text) as CNCFLandscape
    }
  } catch (err) {
    return { components: [], skipped: 0, error: String(err) }
  }

  const components: ComponentUpsert[] = []
  let skipped = 0

  for (const cat of landscape.landscape ?? []) {
    const catName = cat.name ?? ''
    if (!CNCF_AI_CATEGORIES.some(c => catName.includes(c))) continue

    for (const sub of cat.subcategories ?? []) {
      for (const item of sub.items ?? []) {
        if (!item.name) { skipped++; continue }

        const layer = mapCNCFToLayer(catName, sub.name ?? '')
        components.push({
          name: item.name,
          vendor: null,
          category: (sub.name ?? catName).toLowerCase().replace(/\s+/g, '_'),
          architecture_layer: layer,
          hosting: ['cloud', 'onprem'],
          dsgvo_status: 'conditional',
          eu_ai_act_risk: 'minimal',
          sap_compatible: false,
          sap_components: [],
          use_case_types: ['predictive', 'generative'],
          infra_types: ['cloud', 'onprem', 'hybrid'],
          cloud_provider: 'independent',
          icon_name: null,
          website_url: item.homepage_url ?? null,
          description: item.description ?? `CNCF-Projekt: ${item.name}`,
          tags: ['cncf', 'open-source'],
          source: 'cncf_landscape',
          is_active: true,
        })
      }
    }
  }

  return { components, skipped }
}

function mapCNCFToLayer(cat: string, sub: string): ArchLayer | null {
  const combined = `${cat} ${sub}`.toLowerCase()
  if (combined.includes('database') || combined.includes('storage') || combined.includes('streaming'))
    return 'data'
  if (combined.includes('machine learning') || combined.includes('model'))
    return 'model'
  if (combined.includes('observability') || combined.includes('monitoring'))
    return 'mlops'
  return 'mlops'
}

// ── OpenAI Models ─────────────────────────────────────────────────────────────
interface OAIModel { id: string; created?: number; owned_by?: string }

export async function syncOpenAI(config: Record<string, string> = {}): Promise<SyncResult> {
  const apiKey = config.api_key
  if (!apiKey) return { components: [], skipped: 0, skipped_source: true }

  let models: OAIModel[]
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { data?: OAIModel[] }
    models = json.data ?? []
  } catch (err) {
    return { components: [], skipped: 0, error: String(err) }
  }

  const INCLUDE_PREFIXES = ['gpt-4', 'gpt-3.5', 'o1', 'o3', 'chatgpt']
  const EXCLUDE_PATTERNS = [':ft-', '-instruct', '-0301', '-0314']

  const filtered = models.filter(m =>
    INCLUDE_PREFIXES.some(p => m.id.startsWith(p)) &&
    !EXCLUDE_PATTERNS.some(p => m.id.includes(p))
  )

  const components: ComponentUpsert[] = filtered.map(m => ({
    name: m.id,
    vendor: 'OpenAI',
    category: 'llm',
    architecture_layer: 'model' as ArchLayer,
    hosting: ['us'],
    dsgvo_status: 'conditional',
    eu_ai_act_risk: 'limited',
    sap_compatible: false,
    sap_components: [],
    use_case_types: ['generative'],
    infra_types: ['cloud'],
    cloud_provider: 'independent',
    icon_name: null,
    website_url: 'https://platform.openai.com/docs/models',
    description: `OpenAI-Modell via API: ${m.id}. Datenschutz-Prüfung und DPA erforderlich, kein EU-Hosting.`,
    tags: ['openai', 'llm', 'gpt', 'genai'],
    source: 'openai_api',
    is_active: true,
  }))

  return { components, skipped: models.length - filtered.length }
}

// ── Anthropic Models ──────────────────────────────────────────────────────────
interface AnthropicModel { id: string; display_name?: string; created_at?: string }

export async function syncAnthropic(config: Record<string, string> = {}): Promise<SyncResult> {
  const apiKey = config.api_key
  if (!apiKey) return { components: [], skipped: 0, skipped_source: true }

  let models: AnthropicModel[]
  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { data?: AnthropicModel[] }
    models = json.data ?? []
  } catch (err) {
    return { components: [], skipped: 0, error: String(err) }
  }

  const components: ComponentUpsert[] = models.map(m => ({
    name: m.id,
    vendor: 'Anthropic',
    category: 'llm',
    architecture_layer: 'model' as ArchLayer,
    hosting: ['us'],
    dsgvo_status: 'conditional',
    eu_ai_act_risk: 'limited',
    sap_compatible: false,
    sap_components: [],
    use_case_types: ['generative'],
    infra_types: ['cloud'],
    cloud_provider: 'independent',
    icon_name: null,
    website_url: 'https://www.anthropic.com/models',
    description: m.display_name
      ? `${m.display_name} — Anthropic Claude-Modell mit starkem Safety-Fokus und großem Kontextfenster.`
      : `Anthropic Claude-Modell: ${m.id}`,
    tags: ['anthropic', 'claude', 'llm', 'genai', 'safety'],
    source: 'anthropic_api',
    is_active: true,
  }))

  return { components, skipped: 0 }
}

// ── Mistral AI Models ─────────────────────────────────────────────────────────
interface MistralModel { id: string; created?: number; owned_by?: string }

export async function syncMistralAI(config: Record<string, string> = {}): Promise<SyncResult> {
  const apiKey = config.api_key
  if (!apiKey) return { components: [], skipped: 0, skipped_source: true }

  let models: MistralModel[]
  try {
    const res = await fetch('https://api.mistral.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { data?: MistralModel[] }
    models = json.data ?? []
  } catch (err) {
    return { components: [], skipped: 0, error: String(err) }
  }

  const filtered = models.filter(m => m.id && !m.id.includes('deprecated'))
  const components: ComponentUpsert[] = filtered.map(m => ({
    name: m.id,
    vendor: 'Mistral AI',
    category: 'llm',
    architecture_layer: 'model' as ArchLayer,
    hosting: ['eu'],
    dsgvo_status: 'compliant',
    eu_ai_act_risk: 'limited',
    sap_compatible: true,
    sap_components: ['genai_hub'],
    use_case_types: ['generative'],
    infra_types: ['cloud', 'onprem'],
    cloud_provider: 'independent',
    icon_name: null,
    website_url: 'https://mistral.ai/models',
    description: `Mistral AI Modell: ${m.id} — europäischer LLM-Anbieter (Paris, FR), DSGVO-konform, EU-Hosting.`,
    tags: ['mistral', 'llm', 'eu', 'genai', 'france'],
    source: 'mistral_api',
    is_active: true,
  }))

  return { components, skipped: models.length - filtered.length }
}

// ── NVIDIA NGC ────────────────────────────────────────────────────────────────
interface NGCModel {
  name?: string
  displayName?: string
  description?: string
  orgName?: string
  namespace?: string
}

export async function syncNVIDIA(config: Record<string, string> = {}): Promise<SyncResult> {
  const apiKey = config.api_key
  if (!apiKey) return { components: [], skipped: 0, skipped_source: true }

  let models: NGCModel[]
  try {
    const res = await fetch(
      'https://api.ngc.nvidia.com/v2/models?pageSize=50&isPublic=true&orderBy=name&orderDesc=false',
      {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(20_000),
      }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { models?: NGCModel[] }
    models = json.models ?? []
  } catch (err) {
    return { components: [], skipped: 0, error: String(err) }
  }

  const components: ComponentUpsert[] = models
    .filter(m => m.name)
    .map(m => {
      const org = m.orgName ?? 'nvidia'
      const fullName = m.namespace ? `${m.namespace}/${m.name}` : m.name!
      return {
        name: m.displayName ?? fullName,
        vendor: 'NVIDIA',
        category: 'serving',
        architecture_layer: 'serving' as ArchLayer,
        hosting: ['us', 'eu', 'onprem'],
        dsgvo_status: 'compliant',
        eu_ai_act_risk: 'limited',
        sap_compatible: false,
        sap_components: [],
        use_case_types: ['generative', 'vision', 'predictive'],
        infra_types: ['cloud', 'onprem', 'hybrid'],
        cloud_provider: 'independent',
        icon_name: null,
        website_url: `https://catalog.ngc.nvidia.com/orgs/${org}/models/${m.name}`,
        description: m.description ?? `NVIDIA NGC Modell-Container für GPU-optimierte Inference: ${fullName}`,
        tags: ['nvidia', 'ngc', 'gpu', 'container', 'inference'],
        source: 'nvidia_ngc',
        is_active: true,
      }
    })

  return { components, skipped: 0 }
}

// ── PyPI AI-Pakete ────────────────────────────────────────────────────────────
const PYPI_AI_PACKAGES = [
  'torch', 'tensorflow', 'scikit-learn', 'transformers', 'diffusers',
  'sentence-transformers', 'langchain', 'llama-index', 'openai', 'anthropic',
  'mistralai', 'google-generativeai', 'ray', 'prefect', 'wandb',
  'chromadb', 'qdrant-client', 'weaviate-client', 'pinecone-client',
  'evaluate', 'datasets', 'accelerate', 'peft', 'trl',
]

function mapPyPIToLayer(pkg: string): ArchLayer {
  if (['chromadb','qdrant-client','weaviate-client','pinecone-client'].includes(pkg)) return 'data'
  if (['wandb','prefect','ray'].includes(pkg)) return 'mlops'
  if (['langchain','llama-index','openai','anthropic','mistralai','google-generativeai'].includes(pkg)) return 'model'
  return 'model'
}

function mapPyPIToCategory(pkg: string): string {
  if (['chromadb','qdrant-client','weaviate-client','pinecone-client'].includes(pkg)) return 'vector_db'
  if (['wandb','prefect','ray'].includes(pkg)) return 'mlops'
  if (['langchain','llama-index'].includes(pkg)) return 'llm_framework'
  if (['openai','anthropic','mistralai','google-generativeai'].includes(pkg)) return 'llm'
  return 'ml_framework'
}

function mapPyPIToUseCases(pkg: string): string[] {
  if (['chromadb','qdrant-client','weaviate-client','pinecone-client'].includes(pkg)) return ['generative']
  if (['tensorflow','scikit-learn','torch','accelerate'].includes(pkg)) return ['predictive', 'generative', 'vision']
  if (['langchain','llama-index','openai','anthropic'].includes(pkg)) return ['generative', 'automation']
  return ['predictive', 'generative']
}

export async function syncPyPI(): Promise<SyncResult> {
  const components: ComponentUpsert[] = []
  let skipped = 0

  for (const pkg of PYPI_AI_PACKAGES) {
    try {
      const res = await fetch(`https://pypi.org/pypi/${pkg}/json`, {
        headers: { Accept: 'application/json', 'User-Agent': 'AI-Navigator-Catalog-Sync/1.0' },
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) { skipped++; continue }

      const json = await res.json() as {
        info?: { name?: string; author?: string; author_email?: string; summary?: string; home_page?: string; project_url?: string }
      }
      const info = json.info
      if (!info?.name) { skipped++; continue }

      const vendor = info.author?.split(',')[0]?.trim() || info.author_email?.split('@').pop() || 'OSS'
      components.push({
        name: info.name,
        vendor,
        category: mapPyPIToCategory(pkg),
        architecture_layer: mapPyPIToLayer(pkg),
        hosting: ['cloud', 'onprem', 'hybrid'],
        dsgvo_status: 'compliant',
        eu_ai_act_risk: 'minimal',
        sap_compatible: false,
        sap_components: [],
        use_case_types: mapPyPIToUseCases(pkg),
        infra_types: ['cloud', 'onprem', 'hybrid'],
        cloud_provider: 'independent',
        icon_name: null,
        website_url: info.home_page ?? `https://pypi.org/project/${pkg}`,
        description: info.summary ?? `Python AI/ML-Bibliothek: ${info.name}`,
        tags: ['python', 'pip', 'open-source', 'library'],
        source: 'pypi',
        is_active: true,
      })
    } catch {
      skipped++
    }
  }

  return { components, skipped }
}

// ── OpenML ────────────────────────────────────────────────────────────────────
interface OpenMLFlow { flow_id?: number; name?: string; full_name?: string; description?: string; external_version?: string }

export async function syncOpenML(): Promise<SyncResult> {
  let flows: OpenMLFlow[]
  try {
    const res = await fetch('https://www.openml.org/api/v1/json/flow/list', {
      headers: { Accept: 'application/json', 'User-Agent': 'AI-Navigator-Catalog-Sync/1.0' },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { flows?: { flow?: OpenMLFlow[] } }
    flows = json.flows?.flow ?? []
  } catch (err) {
    return { components: [], skipped: 0, error: String(err) }
  }

  const AI_KEYWORDS = ['sklearn', 'keras', 'torch', 'tensorflow', 'xgboost', 'lightgbm', 'weka', 'mlr']
  const filtered = flows
    .filter(f => f.name && AI_KEYWORDS.some(k => (f.name ?? '').toLowerCase().includes(k)))
    .slice(0, 40)

  const components: ComponentUpsert[] = filtered.map(f => ({
    name: f.full_name ?? f.name ?? `openml-flow-${f.flow_id}`,
    vendor: 'OpenML',
    category: 'ml_framework',
    architecture_layer: 'model' as ArchLayer,
    hosting: ['cloud', 'onprem', 'hybrid'],
    dsgvo_status: 'compliant',
    eu_ai_act_risk: 'minimal',
    sap_compatible: false,
    sap_components: [],
    use_case_types: ['predictive'],
    infra_types: ['cloud', 'onprem', 'hybrid'],
    cloud_provider: 'independent',
    icon_name: null,
    website_url: `https://openml.org/f/${f.flow_id}`,
    description: f.description
      ? f.description.slice(0, 200)
      : `OpenML ML-Algorithmus/Framework: ${f.full_name ?? f.name}`,
    tags: ['openml', 'ml', 'algorithm', 'oss', 'research'],
    source: 'openml',
    is_active: true,
  }))

  return { components, skipped: flows.length - filtered.length }
}

// ── SAP API Hub ───────────────────────────────────────────────────────────────
export async function syncSAP(config: Record<string, string> = {}): Promise<SyncResult> {
  const apiKey = config.api_key
  if (!apiKey) {
    return { components: [], skipped: 0, skipped_source: true }
  }

  try {
    const res = await fetch(
      'https://api.sap.com/api/1.0/catalogs/services?search=AI&pageSize=30&orderBy=title&orderDesc=false',
      {
        headers: {
          APIKey: apiKey,
          Accept: 'application/json',
          'User-Agent': 'AI-Navigator-Catalog-Sync/1.0',
        },
        signal: AbortSignal.timeout(20_000),
      }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('application/json')) {
      throw new Error('SAP API liefert kein JSON — API-Key möglicherweise ungültig')
    }
    const json = await res.json() as { services?: { name?: string; title?: string; shortText?: string; url?: string }[] }
    const items = json.services ?? []

    const components: ComponentUpsert[] = items
      .filter(s => s.name)
      .map(s => ({
        name: s.title ?? s.name ?? 'Unbekannt',
        vendor: 'SAP',
        category: 'platform',
        architecture_layer: 'application' as ArchLayer,
        hosting: ['cloud'],
        dsgvo_status: 'compliant',
        eu_ai_act_risk: 'limited',
        sap_compatible: true,
        sap_components: ['btp'],
        use_case_types: ['predictive', 'generative', 'automation'],
        infra_types: ['cloud'],
        cloud_provider: 'sap',
        icon_name: 'simple-icons:sap',
        website_url: s.url ? `https://api.sap.com${s.url}` : 'https://api.sap.com',
        description: s.shortText ?? `SAP AI Service: ${s.title ?? s.name}`,
        tags: ['sap', 'btp', 'api-hub'],
        source: 'sap_api',
        is_active: true,
      }))

    return { components, skipped: items.length - components.length }
  } catch (err) {
    return { components: [], skipped: 0, error: String(err) }
  }
}

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

// ── Papers With Code ─────────────────────────────────────────────────────────
interface PWCMethod {
  name?: string
  full_name?: string
  description?: string
  paper?: { title?: string; url_pdf?: string }
  url?: string
}

export async function syncPapersWithCode(baseUrl: string): Promise<SyncResult> {
  let items: PWCMethod[]
  try {
    const res = await fetch(`${baseUrl}/methods/?items_per_page=50&ordering=-paper_count`, {
      headers: { Accept: 'application/json', 'User-Agent': 'AI-Navigator-Catalog-Sync/1.0' },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('application/json')) throw new Error('Kein JSON erhalten')
    const json = await res.json() as { results?: PWCMethod[]; count?: number }
    items = json.results ?? []
  } catch (err) {
    return { components: [], skipped: 0, error: String(err) }
  }

  const layerMap: Record<string, ArchLayer> = {
    'attention': 'model', 'transformer': 'model', 'bert': 'model', 'gpt': 'model',
    'diffusion': 'model', 'vae': 'model', 'gan': 'model', 'cnn': 'model',
    'reinforcement': 'model', 'optimizer': 'model', 'normalization': 'model',
    'regularization': 'model', 'training': 'mlops', 'data': 'data', 'augmentation': 'data',
  }

  const components: ComponentUpsert[] = items
    .filter(m => m.name || m.full_name)
    .map(m => {
      const name = m.full_name ?? m.name ?? 'Unbekannt'
      const lower = name.toLowerCase()
      const layer: ArchLayer = Object.entries(layerMap).find(([k]) => lower.includes(k))?.[1] ?? 'model'
      return {
        name,
        vendor: null,
        category: 'ml_method',
        architecture_layer: layer,
        hosting: ['cloud', 'onprem'],
        dsgvo_status: 'compliant',
        eu_ai_act_risk: 'minimal',
        sap_compatible: false,
        sap_components: [],
        use_case_types: ['predictive', 'generative'],
        infra_types: ['cloud', 'onprem'],
        cloud_provider: 'independent',
        icon_name: null,
        website_url: m.url ?? 'https://paperswithcode.com',
        description: m.description ?? `ML-Methode aus Papers With Code: ${name}`,
        tags: ['papers-with-code', 'research', 'open-source'],
        source: 'papers_with_code',
        is_active: true,
      }
    })

  return { components, skipped: items.length - components.length }
}

// ── NVIDIA NGC ────────────────────────────────────────────────────────────────
interface NGCModel {
  name?: string
  displayName?: string
  description?: string
  latestVersionIdStr?: string
  publisher?: string
}

export async function syncNVIDIANGC(baseUrl: string): Promise<SyncResult> {
  let models: NGCModel[]
  try {
    const res = await fetch(`${baseUrl}/orgs/nvidia/models?pageSize=30&orderByField=lastModifiedDate&orderByValue=DESC`, {
      headers: { Accept: 'application/json', 'User-Agent': 'AI-Navigator-Catalog-Sync/1.0' },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('application/json')) throw new Error('Kein JSON erhalten')
    const json = await res.json() as { models?: NGCModel[] }
    models = json.models ?? []
  } catch (err) {
    return { components: [], skipped: 0, error: String(err) }
  }

  const components: ComponentUpsert[] = models
    .filter(m => m.name)
    .map(m => ({
      name: m.displayName ?? m.name ?? 'Unbekannt',
      vendor: 'NVIDIA',
      category: 'model',
      architecture_layer: 'model' as ArchLayer,
      hosting: ['cloud', 'onprem'],
      dsgvo_status: 'conditional',
      eu_ai_act_risk: 'limited',
      sap_compatible: false,
      sap_components: [],
      use_case_types: ['predictive', 'generative', 'vision'],
      infra_types: ['cloud', 'onprem'],
      cloud_provider: 'independent',
      icon_name: null,
      website_url: `https://catalog.ngc.nvidia.com/orgs/nvidia/models/${m.name}`,
      description: m.description ?? `NVIDIA NGC Modell: ${m.displayName ?? m.name}`,
      tags: ['nvidia', 'ngc', 'gpu', 'model'],
      source: 'nvidia_ngc',
      is_active: true,
    }))

  return { components, skipped: models.length - components.length }
}

// ── OpenAI Models ─────────────────────────────────────────────────────────────
interface OpenAIModel { id?: string; owned_by?: string }

export async function syncOpenAI(baseUrl: string, config: Record<string, string> = {}): Promise<SyncResult> {
  if (!config.api_key) return { components: [], skipped: 0, skipped_source: true }
  try {
    const res = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${config.api_key}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { data?: OpenAIModel[] }
    const models = json.data ?? []
    const components: ComponentUpsert[] = models.filter(m => m.id).map(m => ({
      name: m.id!,
      vendor: 'OpenAI',
      category: m.id!.includes('gpt') ? 'llm' : m.id!.includes('dall') ? 'image-gen' : m.id!.includes('whisper') ? 'speech' : 'model',
      architecture_layer: 'model' as ArchLayer,
      hosting: ['us'], dsgvo_status: 'conditional', eu_ai_act_risk: 'limited',
      sap_compatible: false, sap_components: [], use_case_types: ['generative'],
      infra_types: ['cloud'], cloud_provider: 'independent',
      icon_name: 'simple-icons:openai', website_url: 'https://platform.openai.com',
      description: `OpenAI Modell (${m.owned_by ?? 'openai'})`,
      tags: ['openai', 'llm', 'api'], source: 'openai_models', is_active: true,
    }))
    return { components, skipped: models.length - components.length }
  } catch (err) { return { components: [], skipped: 0, error: String(err) } }
}

// ── Anthropic Models ──────────────────────────────────────────────────────────
interface AnthropicModel { id?: string; display_name?: string }

export async function syncAnthropic(baseUrl: string, config: Record<string, string> = {}): Promise<SyncResult> {
  if (!config.api_key) return { components: [], skipped: 0, skipped_source: true }
  try {
    const res = await fetch(baseUrl, {
      headers: { 'x-api-key': config.api_key, 'anthropic-version': '2023-06-01', Accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { data?: AnthropicModel[] }
    const models = json.data ?? []
    const components: ComponentUpsert[] = models.filter(m => m.id).map(m => ({
      name: m.display_name ?? m.id!,
      vendor: 'Anthropic', category: 'llm', architecture_layer: 'model' as ArchLayer,
      hosting: ['us'], dsgvo_status: 'conditional', eu_ai_act_risk: 'limited',
      sap_compatible: false, sap_components: [], use_case_types: ['generative'],
      infra_types: ['cloud'], cloud_provider: 'independent', icon_name: null,
      website_url: 'https://anthropic.com', description: 'Claude-Modell von Anthropic',
      tags: ['anthropic', 'claude', 'llm', 'api'], source: 'anthropic_models', is_active: true,
    }))
    return { components, skipped: models.length - components.length }
  } catch (err) { return { components: [], skipped: 0, error: String(err) } }
}

// ── Google Gemini ─────────────────────────────────────────────────────────────
interface GeminiModel { name?: string; displayName?: string; description?: string }

export async function syncGemini(baseUrl: string, config: Record<string, string> = {}): Promise<SyncResult> {
  if (!config.api_key) return { components: [], skipped: 0, skipped_source: true }
  try {
    const res = await fetch(`${baseUrl}?key=${config.api_key}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { models?: GeminiModel[] }
    const models = json.models ?? []
    const components: ComponentUpsert[] = models.filter(m => m.name).map(m => {
      const shortName = m.name!.replace('models/', '')
      return {
        name: m.displayName ?? shortName,
        vendor: 'Google', category: 'llm', architecture_layer: 'model' as ArchLayer,
        hosting: ['us'], dsgvo_status: 'conditional', eu_ai_act_risk: 'limited',
        sap_compatible: false, sap_components: [], use_case_types: ['generative'],
        infra_types: ['cloud'], cloud_provider: 'gcp', icon_name: 'simple-icons:google',
        website_url: 'https://ai.google.dev',
        description: m.description ?? `Google Gemini Modell: ${m.displayName ?? shortName}`,
        tags: ['google', 'gemini', 'llm', 'api'], source: 'google_gemini', is_active: true,
      }
    })
    return { components, skipped: models.length - components.length }
  } catch (err) { return { components: [], skipped: 0, error: String(err) } }
}

// ── Mistral AI ────────────────────────────────────────────────────────────────
interface MistralModel { id?: string; owned_by?: string }

export async function syncMistral(baseUrl: string, config: Record<string, string> = {}): Promise<SyncResult> {
  if (!config.api_key) return { components: [], skipped: 0, skipped_source: true }
  try {
    const res = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${config.api_key}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { data?: MistralModel[] }
    const models = json.data ?? []
    const components: ComponentUpsert[] = models.filter(m => m.id).map(m => ({
      name: m.id!,
      vendor: 'Mistral AI', category: 'llm', architecture_layer: 'model' as ArchLayer,
      hosting: ['eu'], dsgvo_status: 'compliant', eu_ai_act_risk: 'limited',
      sap_compatible: false, sap_components: [], use_case_types: ['generative'],
      infra_types: ['cloud'], cloud_provider: 'independent', icon_name: null,
      website_url: 'https://mistral.ai', description: 'Mistral AI Modell (europäisch)',
      tags: ['mistral', 'llm', 'eu', 'api'], source: 'mistral_ai', is_active: true,
    }))
    return { components, skipped: models.length - components.length }
  } catch (err) { return { components: [], skipped: 0, error: String(err) } }
}

// ── GitHub ML Repos ───────────────────────────────────────────────────────────
interface GitHubRepo {
  name?: string; full_name?: string; description?: string
  html_url?: string; stargazers_count?: number
  owner?: { login?: string }; topics?: string[]
}

export async function syncGitHub(baseUrl: string, config: Record<string, string> = {}): Promise<SyncResult> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'AI-Navigator-Catalog-Sync/1.0',
    }
    if (config.api_key) headers.Authorization = `Bearer ${config.api_key}`
    const res = await fetch(
      `${baseUrl}?q=topic:machine-learning+topic:llm+stars:>500&sort=stars&order=desc&per_page=30`,
      { headers, signal: AbortSignal.timeout(20_000) }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { items?: GitHubRepo[] }
    const repos = json.items ?? []
    const components: ComponentUpsert[] = repos.filter(r => r.full_name).map(r => ({
      name: r.full_name!,
      vendor: r.owner?.login ?? null, category: 'framework',
      architecture_layer: 'mlops' as ArchLayer,
      hosting: ['cloud', 'onprem'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
      sap_compatible: false, sap_components: [], use_case_types: ['generative', 'predictive'],
      infra_types: ['cloud', 'onprem'], cloud_provider: 'independent',
      icon_name: 'simple-icons:github',
      website_url: r.html_url ?? `https://github.com/${r.full_name}`,
      description: r.description ?? `GitHub ML-Projekt (${r.stargazers_count ?? 0} Stars)`,
      tags: ['github', 'open-source', 'ml', ...(r.topics ?? []).slice(0, 3)],
      source: 'github_search', is_active: true,
    }))
    return { components, skipped: repos.length - components.length }
  } catch (err) { return { components: [], skipped: 0, error: String(err) } }
}

// ── OpenML ────────────────────────────────────────────────────────────────────
interface OpenMLFlow { name?: string; source_url?: string; description?: string }

export async function syncOpenML(baseUrl: string): Promise<SyncResult> {
  try {
    const res = await fetch(`${baseUrl}/flow/list?size=30`, {
      headers: { Accept: 'application/json', 'User-Agent': 'AI-Navigator-Catalog-Sync/1.0' },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('application/json')) throw new Error('Kein JSON erhalten')
    const json = await res.json() as { flows?: { flow?: OpenMLFlow[] } }
    const flows = json.flows?.flow ?? []
    const components: ComponentUpsert[] = flows.filter(f => f.name).map(f => ({
      name: f.name!,
      vendor: null, category: 'ml_method', architecture_layer: 'model' as ArchLayer,
      hosting: ['cloud', 'onprem'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
      sap_compatible: false, sap_components: [], use_case_types: ['predictive'],
      infra_types: ['cloud', 'onprem'], cloud_provider: 'independent', icon_name: null,
      website_url: f.source_url ?? 'https://www.openml.org',
      description: (f.description ?? `OpenML Flow: ${f.name}`).substring(0, 200),
      tags: ['openml', 'open-source', 'ml-algorithm'], source: 'openml', is_active: true,
    }))
    return { components, skipped: flows.length - components.length }
  } catch (err) { return { components: [], skipped: 0, error: String(err) } }
}

// ── LangChain Hub ─────────────────────────────────────────────────────────────
interface LangChainItem { repo_handle?: string; full_name?: string; description?: string; tags?: string[] }

export async function syncLangChainHub(baseUrl: string, config: Record<string, string> = {}): Promise<SyncResult> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json', 'User-Agent': 'AI-Navigator-Catalog-Sync/1.0' }
    if (config.api_key) headers['x-api-key'] = config.api_key
    const res = await fetch(`${baseUrl}?limit=30`, { headers, signal: AbortSignal.timeout(20_000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('application/json')) throw new Error('Kein JSON erhalten')
    const raw = await res.json() as LangChainItem[] | { repos?: LangChainItem[] }
    const items: LangChainItem[] = Array.isArray(raw) ? raw : (raw.repos ?? [])
    const components: ComponentUpsert[] = items.filter(i => i.repo_handle || i.full_name).map(i => ({
      name: i.full_name ?? i.repo_handle ?? 'Unbekannt',
      vendor: 'LangChain', category: 'prompt', architecture_layer: 'application' as ArchLayer,
      hosting: ['cloud'], dsgvo_status: 'conditional', eu_ai_act_risk: 'minimal',
      sap_compatible: false, sap_components: [], use_case_types: ['generative'],
      infra_types: ['cloud'], cloud_provider: 'independent', icon_name: null,
      website_url: `https://smith.langchain.com/hub/${i.full_name ?? i.repo_handle}`,
      description: i.description ?? 'LangChain Hub Prompt',
      tags: ['langchain', 'prompt', ...(i.tags ?? []).slice(0, 3)],
      source: 'langchain_hub', is_active: true,
    }))
    return { components, skipped: items.length - components.length }
  } catch (err) { return { components: [], skipped: 0, error: String(err) } }
}

// ── Pinecone ──────────────────────────────────────────────────────────────────
interface PineconeIndex { name?: string; dimension?: number; metric?: string }

export async function syncPinecone(baseUrl: string, config: Record<string, string> = {}): Promise<SyncResult> {
  if (!config.api_key) return { components: [], skipped: 0, skipped_source: true }
  try {
    const res = await fetch(`${baseUrl}/indexes`, {
      headers: { 'Api-Key': config.api_key, Accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { indexes?: PineconeIndex[] }
    const indexes = json.indexes ?? []
    const components: ComponentUpsert[] = indexes.filter(i => i.name).map(i => ({
      name: i.name!,
      vendor: 'Pinecone', category: 'vector_db', architecture_layer: 'data' as ArchLayer,
      hosting: ['cloud'], dsgvo_status: 'conditional', eu_ai_act_risk: 'minimal',
      sap_compatible: false, sap_components: [], use_case_types: ['generative', 'search'],
      infra_types: ['cloud'], cloud_provider: 'independent', icon_name: null,
      website_url: 'https://www.pinecone.io',
      description: `Pinecone Index (${i.dimension ?? '?'} dims, ${i.metric ?? '?'})`,
      tags: ['pinecone', 'vector-db', 'embedding'], source: 'pinecone', is_active: true,
    }))
    return { components, skipped: indexes.length - components.length }
  } catch (err) { return { components: [], skipped: 0, error: String(err) } }
}

// ── DigitalOcean GPU-Sizes ─────────────────────────────────────────────────────
interface DOSize { slug?: string; description?: string; vcpus?: number; memory?: number; disk?: number; price_monthly?: number; regions?: string[] }

export async function syncDigitalOcean(baseUrl: string, config: Record<string, string> = {}): Promise<SyncResult> {
  if (!config.api_key) return { components: [], skipped: 0, skipped_source: true }
  try {
    const res = await fetch(`${baseUrl}/sizes`, {
      headers: { Authorization: `Bearer ${config.api_key}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { sizes?: DOSize[] }
    const gpuSizes = (json.sizes ?? []).filter(s => s.slug?.startsWith('gpu-') || (s.description ?? '').toLowerCase().includes('gpu'))
    if (gpuSizes.length === 0) return { components: [], skipped: 0, skipped_source: true }
    const components: ComponentUpsert[] = gpuSizes.filter(s => s.slug).map(s => ({
      name: s.slug!,
      vendor: 'DigitalOcean', category: 'gpu_compute', architecture_layer: 'serving' as ArchLayer,
      hosting: ['cloud'], dsgvo_status: 'conditional', eu_ai_act_risk: 'minimal',
      sap_compatible: false, sap_components: [], use_case_types: ['generative', 'training'],
      infra_types: ['cloud'], cloud_provider: 'independent', icon_name: null,
      website_url: 'https://www.digitalocean.com/products/gpu-droplets',
      description: s.description ?? `DigitalOcean GPU Droplet (${s.vcpus ?? '?'} vCPUs, €${s.price_monthly ?? '?'}/Monat)`,
      tags: ['digitalocean', 'gpu', 'cloud', 'infra'], source: 'digitalocean', is_active: true,
    }))
    return { components, skipped: gpuSizes.length - components.length }
  } catch (err) { return { components: [], skipped: 0, error: String(err) } }
}

// ── Vultr GPU Plans ───────────────────────────────────────────────────────────
interface VultrPlan { id?: string; vcpu_count?: number; ram?: number; disk?: number; bandwidth?: number; monthly_cost?: number; gpu_type?: string; gpu_vram_gb?: number }

export async function syncVultr(baseUrl: string, config: Record<string, string> = {}): Promise<SyncResult> {
  if (!config.api_key) return { components: [], skipped: 0, skipped_source: true }
  try {
    const res = await fetch(`${baseUrl}/plans?type=vcg`, {
      headers: { Authorization: `Bearer ${config.api_key}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { plans?: VultrPlan[] }
    const plans = json.plans ?? []
    const components: ComponentUpsert[] = plans.filter(p => p.id).map(p => ({
      name: p.id!,
      vendor: 'Vultr', category: 'gpu_compute', architecture_layer: 'serving' as ArchLayer,
      hosting: ['cloud'], dsgvo_status: 'conditional', eu_ai_act_risk: 'minimal',
      sap_compatible: false, sap_components: [], use_case_types: ['generative', 'training'],
      infra_types: ['cloud'], cloud_provider: 'independent', icon_name: null,
      website_url: 'https://www.vultr.com/products/cloud-gpu',
      description: `Vultr GPU Plan (${p.gpu_type ?? '?'}, ${p.gpu_vram_gb ?? '?'}GB VRAM, $${p.monthly_cost ?? '?'}/Monat)`,
      tags: ['vultr', 'gpu', 'cloud', 'infra'], source: 'vultr', is_active: true,
    }))
    return { components, skipped: plans.length - components.length }
  } catch (err) { return { components: [], skipped: 0, error: String(err) } }
}

// ── PyPI AI Packages ──────────────────────────────────────────────────────────
interface PyPIInfo { name?: string; version?: string; summary?: string; home_page?: string; project_url?: string; author?: string }

export async function syncPyPI(baseUrl: string, config: Record<string, string> = {}): Promise<SyncResult> {
  const raw = config.packages ?? 'langchain,transformers,torch,openai,anthropic,llama-index,haystack-ai'
  const packages = raw.split(',').map(p => p.trim()).filter(Boolean)
  if (packages.length === 0) return { components: [], skipped: 0, skipped_source: true }

  const components: ComponentUpsert[] = []
  let skipped = 0
  await Promise.all(packages.map(async (pkg) => {
    try {
      const res = await fetch(`${baseUrl}/${pkg}/json`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) { skipped++; return }
      const json = await res.json() as { info?: PyPIInfo }
      const info = json.info
      if (!info?.name) { skipped++; return }
      components.push({
        name: info.name,
        vendor: info.author ?? null, category: 'framework',
        architecture_layer: 'mlops' as ArchLayer,
        hosting: ['cloud', 'onprem'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
        sap_compatible: false, sap_components: [], use_case_types: ['generative', 'predictive'],
        infra_types: ['cloud', 'onprem'], cloud_provider: 'independent', icon_name: null,
        website_url: info.project_url ?? info.home_page ?? `https://pypi.org/project/${info.name}`,
        description: info.summary ?? `Python-Paket: ${info.name} v${info.version ?? '?'}`,
        tags: ['pypi', 'python', 'open-source'], source: 'pypi', is_active: true,
      })
    } catch { skipped++ }
  }))
  return { components, skipped }
}

// ── Weaviate Cloud ────────────────────────────────────────────────────────────
interface WeaviateClass { class?: string; description?: string; vectorizer?: string; properties?: unknown[] }

export async function syncWeaviate(config: Record<string, string> = {}): Promise<SyncResult> {
  const clusterUrl = config.cluster_url
  if (!clusterUrl) return { components: [], skipped: 0, skipped_source: true }
  try {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (config.api_key) headers.Authorization = `Bearer ${config.api_key}`
    const res = await fetch(`${clusterUrl.replace(/\/$/, '')}/v1/schema`, {
      headers,
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { classes?: WeaviateClass[] }
    const classes = json.classes ?? []
    const components: ComponentUpsert[] = classes.filter(c => c.class).map(c => ({
      name: c.class!,
      vendor: 'Weaviate', category: 'vector_db', architecture_layer: 'data' as ArchLayer,
      hosting: ['cloud'], dsgvo_status: 'conditional', eu_ai_act_risk: 'minimal',
      sap_compatible: false, sap_components: [], use_case_types: ['generative', 'search'],
      infra_types: ['cloud'], cloud_provider: 'independent', icon_name: null,
      website_url: 'https://weaviate.io',
      description: c.description ?? `Weaviate Schema-Klasse: ${c.class}`,
      tags: ['weaviate', 'vector-db', 'embedding'], source: 'weaviate', is_active: true,
    }))
    return { components, skipped: classes.length - components.length }
  } catch (err) { return { components: [], skipped: 0, error: String(err) } }
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

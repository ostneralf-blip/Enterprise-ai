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
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    landscape = await res.json() as CNCFLandscape
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

// ── SAP (skip if no API key) ───────────────────────────────────────────────────
export function syncSAP(): SyncResult {
  return {
    components: [],
    skipped: 0,
    error: 'SAP API Key nicht konfiguriert — Quelle übersprungen.',
  }
}

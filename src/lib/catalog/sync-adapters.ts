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

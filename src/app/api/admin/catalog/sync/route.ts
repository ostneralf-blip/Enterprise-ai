import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'
import {
  syncHuggingFace, syncCNCF, syncSAP, syncPapersWithCode, syncNVIDIANGC,
  syncOpenAI, syncAnthropic, syncGemini, syncMistral, syncGitHub, syncOpenML,
  syncLangChainHub, syncPinecone, syncDigitalOcean, syncVultr, syncPyPI, syncWeaviate,
} from '@/lib/catalog/sync-adapters'

const BodySchema = z.object({
  sourceId: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body: unknown = await request.json().catch(() => ({}))
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'sourceId (UUID) erforderlich' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: source, error: srcErr } = await supabase
    .from('catalog_sources')
    .select('id, name, type, url, is_active, config')
    .eq('id', parsed.data.sourceId)
    .single()

  if (srcErr || !source) {
    return NextResponse.json({ error: 'Quelle nicht gefunden' }, { status: 404 })
  }

  const cfg = (source.config ?? {}) as Record<string, string>
  const url = source.url ?? ''

  let syncResult: Awaited<ReturnType<typeof syncHuggingFace>>

  switch (source.type) {
    case 'huggingface':
      syncResult = await syncHuggingFace(url || 'https://huggingface.co/api/models')
      break
    case 'cncf_landscape':
      syncResult = await syncCNCF(url || 'https://raw.githubusercontent.com/cncf/landscape/HEAD/landscape.yml')
      break
    case 'papers_with_code':
      syncResult = await syncPapersWithCode(url || 'https://paperswithcode.com/api/v1')
      break
    case 'nvidia_ngc':
      syncResult = await syncNVIDIANGC(url || 'https://api.ngc.nvidia.com/v2')
      break
    case 'sap_api':
      syncResult = await syncSAP(cfg)
      break
    case 'openai_models':
      syncResult = await syncOpenAI(url || 'https://api.openai.com/v1/models', cfg)
      break
    case 'anthropic_models':
      syncResult = await syncAnthropic(url || 'https://api.anthropic.com/v1/models', cfg)
      break
    case 'google_gemini':
      syncResult = await syncGemini(url || 'https://generativelanguage.googleapis.com/v1/models', cfg)
      break
    case 'mistral_ai':
      syncResult = await syncMistral(url || 'https://api.mistral.ai/v1/models', cfg)
      break
    case 'github_search':
      syncResult = await syncGitHub(url || 'https://api.github.com/search/repositories', cfg)
      break
    case 'openml':
      syncResult = await syncOpenML(url || 'https://www.openml.org/api/v1/json')
      break
    case 'langchain_hub':
      syncResult = await syncLangChainHub(url || 'https://api.smith.langchain.com/api/v1/public-prompts', cfg)
      break
    case 'pinecone':
      syncResult = await syncPinecone(url || 'https://api.pinecone.io', cfg)
      break
    case 'digitalocean':
      syncResult = await syncDigitalOcean(url || 'https://api.digitalocean.com/v2', cfg)
      break
    case 'vultr':
      syncResult = await syncVultr(url || 'https://api.vultr.com/v2', cfg)
      break
    case 'pypi':
      syncResult = await syncPyPI(url || 'https://pypi.org/pypi', cfg)
      break
    case 'weaviate':
      syncResult = await syncWeaviate(cfg)
      break
    case 'aws_service_catalog':
    case 'azure_resource_graph':
    case 'google_cloud_discovery':
    case 'meta_llama':
    case 'kaggle':
    case 'anaconda':
    case 'mlperf':
      syncResult = { components: [], skipped: 0, skipped_source: true }
      break
    case 'custom_url':
      if (url && cfg.api_key !== undefined) {
        try {
          const headers: Record<string, string> = { Accept: 'application/json' }
          if (cfg.api_key) headers.Authorization = `Bearer ${cfg.api_key}`
          const res = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const json = await res.json() as unknown[]
          const items = Array.isArray(json) ? json : []
          syncResult = { components: [], skipped: items.length }
        } catch (err) {
          syncResult = { components: [], skipped: 0, error: String(err) }
        }
      } else {
        syncResult = { components: [], skipped: 0, skipped_source: true }
      }
      break
    default:
      return NextResponse.json({ error: `Unbekannter Quell-Typ: ${source.type}` }, { status: 422 })
  }

  // Quelle bewusst übersprungen (kein API-Key o.ä.) → neutraler Status
  if (syncResult.skipped_source) {
    await supabase
      .from('catalog_sources')
      .update({
        sync_status:     'skipped',
        last_sync_error: null,
        last_synced_at:  new Date().toISOString(),
      })
      .eq('id', source.id)

    return NextResponse.json({
      data: { added: 0, skipped: 0, skipped_source: true },
    })
  }

  // Adapter-Fehler (keine Komponenten) → Fehler-Status persistieren
  if (syncResult.error && syncResult.components.length === 0) {
    await supabase
      .from('catalog_sources')
      .update({
        sync_status:     'error',
        last_sync_error: syncResult.error,
        last_synced_at:  new Date().toISOString(),
      })
      .eq('id', source.id)

    return NextResponse.json({
      data: { added: 0, updated: 0, skipped: syncResult.skipped, error: syncResult.error },
    })
  }

  // Komponenten einspielen
  let upsertCount = 0
  if (syncResult.components.length > 0) {
    const { data: upserted, error: upsertErr } = await supabase
      .from('component_catalog')
      .upsert(syncResult.components, { onConflict: 'name,vendor', ignoreDuplicates: false })
      .select('id')

    if (upsertErr) {
      await supabase
        .from('catalog_sources')
        .update({
          sync_status:     'error',
          last_sync_error: upsertErr.message,
          last_synced_at:  new Date().toISOString(),
        })
        .eq('id', source.id)

      return NextResponse.json({ error: upsertErr.message }, { status: 500 })
    }
    upsertCount = upserted?.length ?? 0
  }

  await supabase
    .from('catalog_sources')
    .update({
      sync_status:     'success',
      last_sync_error: null,
      last_synced_at:  new Date().toISOString(),
      last_sync_added: upsertCount,
    })
    .eq('id', source.id)

  return NextResponse.json({
    data: { added: upsertCount, skipped: syncResult.skipped, error: syncResult.error ?? null },
  })
}

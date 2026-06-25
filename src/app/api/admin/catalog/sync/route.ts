import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'
import { syncHuggingFace, syncCNCF, syncSAP } from '@/lib/catalog/sync-adapters'

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
    .select('id, name, type, url, is_active')
    .eq('id', parsed.data.sourceId)
    .single()

  if (srcErr || !source) {
    return NextResponse.json({ error: 'Quelle nicht gefunden' }, { status: 404 })
  }

  // Run the adapter for this source type
  let syncResult: Awaited<ReturnType<typeof syncHuggingFace>>

  if (source.type === 'huggingface') {
    syncResult = await syncHuggingFace(source.url ?? 'https://huggingface.co/api/models')
  } else if (source.type === 'cncf_landscape') {
    syncResult = await syncCNCF(source.url ?? 'https://landscape.cncf.io/data/landscape.json')
  } else if (source.type === 'sap_api') {
    syncResult = syncSAP()
  } else {
    return NextResponse.json({ error: `Unbekannter Quell-Typ: ${source.type}` }, { status: 422 })
  }

  // If adapter returned an error (no components), persist the error state
  if (syncResult.error && syncResult.components.length === 0) {
    await supabase
      .from('catalog_sources')
      .update({
        sync_status:    'error',
        last_sync_error: syncResult.error,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', source.id)

    return NextResponse.json({
      data: { added: 0, updated: 0, skipped: syncResult.skipped, error: syncResult.error },
    })
  }

  // Upsert components
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

  // Update source metadata
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

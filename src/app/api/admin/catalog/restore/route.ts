import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'

const BodySchema = z.object({ logId: z.string().uuid() })

export async function POST(request: Request) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: logEntry, error: logError } = await supabase
    .from('catalog_upload_log')
    .select('snapshot, filename, row_count')
    .eq('id', parsed.data.logId)
    .single()

  if (logError || !logEntry) {
    return NextResponse.json({ error: 'Upload-Eintrag nicht gefunden' }, { status: 404 })
  }

  if (!logEntry.snapshot || !Array.isArray(logEntry.snapshot) || logEntry.snapshot.length === 0) {
    return NextResponse.json({ error: 'Kein Snapshot für diesen Eintrag vorhanden' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('component_catalog')
    .upsert(
      (logEntry.snapshot as Record<string, unknown>[]).map(c => ({ ...c, source: 'manual', is_active: true })),
      { onConflict: 'name,vendor', ignoreDuplicates: false }
    )
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, restored: data?.length ?? logEntry.snapshot.length })
}

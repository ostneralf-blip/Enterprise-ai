import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'
import { KNOWN_SOURCE_TYPES } from '@/config/catalog-source-schemas'

const BodySchema = z.object({
  name: z.string().min(1).max(120),
  type: z.string().min(1),
  url: z.string().url().optional().nullable(),
  config: z.record(z.string(), z.string()).optional(),
  is_active: z.boolean().optional(),
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
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe' }, { status: 400 })
  }

  const { name, type, url, config: cfg, is_active } = parsed.data

  if (!KNOWN_SOURCE_TYPES.includes(type) && type !== 'custom_url') {
    return NextResponse.json({ error: `Unbekannter Quell-Typ: ${type}` }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('catalog_sources')
    .insert({
      name,
      type,
      url: url ?? null,
      config: cfg ?? {},
      is_active: is_active ?? true,
      sync_status: 'idle',
    })
    .select('id, name, type, url, is_active, config, sync_status, last_synced_at, last_sync_added, last_sync_error, created_at')
    .single()

  if (error) {
    const msg = error.code === '23505' ? 'Eine Quelle mit diesem Namen existiert bereits.' : error.message
    return NextResponse.json({ error: msg }, { status: error.code === '23505' ? 409 : 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('catalog_sources')
    .select('id, name, type, url, is_active, config, sync_status, last_synced_at, last_sync_added, last_sync_error, created_at')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase.from('catalog_sources').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

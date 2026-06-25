import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'

const BodySchema = z.object({
  url: z.string().url().nullable().optional(),
  config: z.record(z.string(), z.string()).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body: unknown = await request.json().catch(() => ({}))
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  if (parsed.data.url !== undefined) patch.url = parsed.data.url
  if (parsed.data.config !== undefined) patch.config = parsed.data.config

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('catalog_sources')
    .update(patch)
    .eq('id', id)
    .select('id, name, type, url, config')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

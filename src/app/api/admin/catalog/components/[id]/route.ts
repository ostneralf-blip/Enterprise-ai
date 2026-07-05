import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'

const PatchSchema = z.object({
  tags:              z.array(z.string().min(1).max(50)).max(30).optional(),
  incompatible_with: z.array(z.string().min(1).max(200)).max(50).optional(),
  requires:          z.array(z.string().min(1).max(200)).max(50).optional(),
  suggests:          z.array(z.string().min(1).max(200)).max(50).optional(),
}).refine(
  data => Object.values(data).some(v => v !== undefined),
  { message: 'Mindestens ein Feld erforderlich' }
)

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 })
  }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (parsed.data.tags              !== undefined) patch.tags              = parsed.data.tags
  if (parsed.data.incompatible_with !== undefined) patch.incompatible_with = parsed.data.incompatible_with
  if (parsed.data.requires          !== undefined) patch.requires          = parsed.data.requires
  if (parsed.data.suggests          !== undefined) patch.suggests          = parsed.data.suggests

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('component_catalog')
    .update(patch)
    .eq('id', id)
    .select('id, tags, incompatible_with, requires, suggests')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

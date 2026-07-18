import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'

// Löst einen offenen KI-Vorschlag auf:
// - "dismiss": kein Katalog-Bedarf, Vorschlag wird nur als erledigt markiert
// - "resolve": Vorschlag wurde (meist über POST /api/admin/catalog/components)
//   in einen echten Katalog-Eintrag überführt, catalog_component_id verlinkt beides
const PatchSchema = z.object({
  action: z.enum(['dismiss', 'resolve']),
  catalog_component_id: z.string().uuid().optional(),
}).refine(
  data => data.action !== 'resolve' || !!data.catalog_component_id,
  { message: 'catalog_component_id erforderlich bei action="resolve"' }
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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const patch: Record<string, unknown> = {
    status: parsed.data.action === 'resolve' ? 'added' : 'dismissed',
    resolved_at: new Date().toISOString(),
    resolved_by: user?.id ?? null,
  }
  if (parsed.data.catalog_component_id) {
    patch.catalog_component_id = parsed.data.catalog_component_id
  }

  const { data, error } = await supabase
    .from('catalog_suggestions')
    .update(patch)
    .eq('id', id)
    .select('id, status, catalog_component_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

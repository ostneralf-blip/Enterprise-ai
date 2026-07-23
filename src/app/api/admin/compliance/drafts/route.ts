import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'

const PatchSchema = z.object({
  id: z.string().uuid(),
  review_status: z.enum(['beruecksichtigt', 'ignoriert']),
})

export async function GET() {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('compliance_source_drafts')
    .select('*')
    .order('scanned_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(request: Request) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 })
  }
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('compliance_source_drafts')
    .update({ review_status: parsed.data.review_status, reviewed_at: new Date().toISOString() })
    .eq('id', parsed.data.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // #251: Freigabe eines Deep-Check-Drafts (checklist_item_id gesetzt) mit
  // Korrekturvorschlag → den vorgeschlagenen Wert in den Checklistenpunkt
  // schreiben (beide Locale-Zeilen) und last_verified auf heute setzen.
  const draft = data as { checklist_item_id: string | null; suggested_value: string | null } | null
  if (parsed.data.review_status === 'beruecksichtigt' && draft?.checklist_item_id && draft.suggested_value) {
    const { data: item } = await supabase
      .from('compliance_checklist_items').select('item_key, regulation_id').eq('id', draft.checklist_item_id).single() as { data: { item_key: string; regulation_id: string } | null }
    if (item) {
      const { data: reg } = await supabase.from('compliance_regulations').select('slug').eq('id', item.regulation_id).single() as { data: { slug: string } | null }
      if (reg) {
        const { data: regIds } = await supabase.from('compliance_regulations').select('id').eq('slug', reg.slug)
        const ids = (regIds ?? []).map((r: { id: string }) => r.id)
        await supabase.from('compliance_checklist_items')
          .update({ article: draft.suggested_value, last_verified: new Date().toISOString().slice(0, 10) })
          .in('regulation_id', ids).eq('item_key', item.item_key)
      }
    }
  }

  return NextResponse.json({ data })
}

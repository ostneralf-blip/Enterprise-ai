import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'

const CreateSchema = z.object({
  term:         z.string().min(1).max(100),
  synonym:      z.string().min(1).max(100),
  synonym_type: z.enum(['vendor', 'category', 'usecase']),
})

const PatchSchema = z.object({
  id:           z.string().uuid(),
  term:         z.string().min(1).max(100).optional(),
  synonym:      z.string().min(1).max(100).optional(),
  synonym_type: z.enum(['vendor', 'category', 'usecase']).optional(),
  is_active:    z.boolean().optional(),
}).refine(
  data => Object.keys(data).filter(k => k !== 'id').some(k => (data as Record<string, unknown>)[k] !== undefined),
  { message: 'Mindestens ein Feld erforderlich' }
)

export async function GET() {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('canvas_synonyms')
    .select('*')
    .order('synonym_type')
    .order('term')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 })
  }
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('canvas_synonyms')
    .insert(parsed.data)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === '23505' ? 409 : 500 })
  return NextResponse.json({ data }, { status: 201 })
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
  const { id, ...fields } = parsed.data
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('canvas_synonyms')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(request: Request) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
  const supabase = await createClient()
  const { error } = await supabase.from('canvas_synonyms').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

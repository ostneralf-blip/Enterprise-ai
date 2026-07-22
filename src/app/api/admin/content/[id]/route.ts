import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'

const UpdateSchema = z.object({
  module:        z.string().min(1).max(50).optional(),
  category:      z.string().min(1).max(50).optional(),
  title:         z.string().min(1).max(200).optional(),
  content:       z.string().min(1).optional(),
  source:        z.string().max(500).nullable().optional(),
  tags:          z.array(z.string().max(50)).max(20).optional(),
  context_key:   z.string().max(100).nullable().optional(),
  locale:        z.enum(['de', 'en']).optional(),
  display_order: z.number().int().min(0).optional(),
  is_published:  z.boolean().optional(),
  min_tier:      z.enum(['free', 'pro', 'enterprise']).optional(),
}).strict()

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
  const body = await request.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('content_library')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase
    .from('content_library')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}

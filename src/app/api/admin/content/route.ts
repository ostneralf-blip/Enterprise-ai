import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'

const CreateSchema = z.object({
  module:   z.string().min(1).max(50),
  category: z.string().min(1).max(50),
  title:    z.string().min(1).max(200),
  content:  z.string().min(1),
  source:   z.string().max(500).nullable().optional(),
  tags:     z.array(z.string().max(50)).max(20).optional(),
})

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('content_library')
    .select('*')
    .order('module', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('content_library')
    .insert({ ...parsed.data, tags: parsed.data.tags ?? [] })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

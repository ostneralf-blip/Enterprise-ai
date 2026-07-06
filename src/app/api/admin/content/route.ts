import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'

const CATEGORIES = ['definition', 'best_practice', 'anti_pattern', 'policy_template', 'checkliste', 'hinweis'] as const

const TIERS = ['free', 'pro', 'enterprise'] as const

const CreateSchema = z.object({
  module:        z.string().min(1).max(50),
  category:      z.enum(CATEGORIES),
  title:         z.string().min(1).max(200),
  content:       z.string().min(1),
  source:        z.string().max(500).nullable().optional(),
  tags:          z.array(z.string().max(50)).max(20).optional(),
  context_key:   z.string().max(100).nullable().optional(),
  display_order: z.number().int().min(0).optional(),
  is_published:  z.boolean().optional(),
  min_tier:      z.enum(TIERS).optional(),
})

const PatchSchema = z.object({
  category:      z.enum(CATEGORIES).optional(),
  title:         z.string().min(1).max(200).optional(),
  content:       z.string().min(1).optional(),
  source:        z.string().max(500).nullable().optional(),
  tags:          z.array(z.string().max(50)).max(20).optional(),
  context_key:   z.string().max(100).nullable().optional(),
  display_order: z.number().int().min(0).optional(),
  is_published:  z.boolean().optional(),
  min_tier:      z.enum(TIERS).optional(),
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
    .order('context_key', { ascending: true, nullsFirst: false })
    .order('display_order', { ascending: true })

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

export async function PATCH(request: Request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await request.json()
  const parsed = PatchSchema.safeParse(body)
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
  return NextResponse.json({ data })
}

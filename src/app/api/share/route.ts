import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireFeature } from '@/lib/utils/tier-check'
import { z } from 'zod'

// Nur Module, für die die Share-Seite ein Rendering hat.
// Weitere Module → eigenes Issue nach Priorität Roadmap > Canvas > Governance > Compliance > UseCase
const SHARING_MODULES = ['architecture', 'assessment', 'governance', 'roadmap', 'canvas', 'usecase'] as const

const CreateShareSchema = z.object({
  module: z.enum(SHARING_MODULES),
  entity_id: z.string().uuid(),
  expires_in_days: z.number().int().min(1).max(365).optional(),
})

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const entity_id = new URL(req.url).searchParams.get('entity_id')

  let query = supabase
    .from('share_links')
    .select('id, token, module, entity_id, expires_at, view_count, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (entity_id) query = query.eq('entity_id', entity_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const gate = await requireFeature('sharing')
  if (gate instanceof NextResponse) return gate
  const { userId } = gate

  const supabase = await createClient()
  const body = await req.json()
  const parsed = CreateShareSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { module, entity_id, expires_in_days } = parsed.data

  const expires_at = expires_in_days
    ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
    : null

  const { data: link, error } = await supabase
    .from('share_links')
    .insert({ user_id: userId, module, entity_id, expires_at })
    .select('id, token, expires_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'
  return NextResponse.json({ data: { ...link, url: `${appUrl}/share/${link.token}` } })
}

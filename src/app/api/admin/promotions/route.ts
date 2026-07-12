import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100),
  badge_text: z.string().min(1).max(50),
  description: z.string().max(300).nullable(),
  promo_price: z.number().min(0).max(9999),
  promo_price_yearly: z.number().min(0).max(99999).nullable(),
  valid_from: z.string().nullable(),
  valid_until: z.string().nullable(),
  stripe_price_id: z.string().max(200).nullable(),
  stripe_price_id_yearly: z.string().max(200).nullable(),
  is_active: z.boolean(),
})

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ? user : null
}

export async function GET() {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = await createAdminClient()
  const { data } = await supabase.from('promotions').select('*').order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = schema.parse(await req.json())
  const supabase = await createAdminClient()
  const { data, error } = await supabase.from('promotions').insert({ ...body, updated_at: new Date().toISOString() }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const body = schema.partial().parse(await req.json())
  const supabase = await createAdminClient()
  const { error } = await supabase.from('promotions').update({ ...body, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const supabase = await createAdminClient()
  const { error } = await supabase.from('promotions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

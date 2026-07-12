import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  monthly_price: z.number().min(1).max(9999),
  yearly_price: z.number().min(1).max(99999).nullable(),
  currency: z.string().length(3),
  stripe_price_id: z.string().max(200).nullable(),
  stripe_price_id_yearly: z.string().max(200).nullable(),
})

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ? user : null
}

export async function GET() {
  const supabase = await createAdminClient()
  const { data } = await supabase.from('price_config').select('*').eq('tier', 'pro').single()
  return NextResponse.json(data ?? {})
}

export async function PATCH(req: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = schema.parse(await req.json())
  const supabase = await createAdminClient()
  const { error } = await supabase.from('price_config').upsert({
    tier: 'pro',
    ...body,
    updated_at: new Date().toISOString(),
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

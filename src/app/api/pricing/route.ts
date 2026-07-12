import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface PricingData {
  monthly: number
  yearly: number | null
  currency: string
  stripe_price_id: string | null
  stripe_price_id_yearly: string | null
  promotion: {
    id: string
    name: string
    badge_text: string
    description: string | null
    promo_price: number
    promo_price_yearly: number | null
    stripe_price_id: string | null
    stripe_price_id_yearly: string | null
    valid_until: string | null
  } | null
}

export async function GET() {
  const supabase = await createClient()

  const [{ data: config }, { data: promos }] = await Promise.all([
    supabase.from('price_config').select('*').eq('tier', 'pro').single(),
    supabase.from('promotions').select('*').eq('is_active', true).limit(1),
  ])

  if (!config) {
    return NextResponse.json({ monthly: 49, yearly: 399, currency: 'EUR', stripe_price_id: null, stripe_price_id_yearly: null, promotion: null } satisfies PricingData)
  }

  const now = new Date().toISOString()
  const activePromo = promos?.find(p => {
    if (p.valid_from && p.valid_from > now) return false
    if (p.valid_until && p.valid_until < now) return false
    return true
  }) ?? null

  const result: PricingData = {
    monthly: Number(config.monthly_price),
    yearly: config.yearly_price ? Number(config.yearly_price) : null,
    currency: config.currency,
    stripe_price_id: config.stripe_price_id,
    stripe_price_id_yearly: config.stripe_price_id_yearly,
    promotion: activePromo ? {
      id: activePromo.id,
      name: activePromo.name,
      badge_text: activePromo.badge_text,
      description: activePromo.description,
      promo_price: Number(activePromo.promo_price),
      promo_price_yearly: activePromo.promo_price_yearly ? Number(activePromo.promo_price_yearly) : null,
      stripe_price_id: activePromo.stripe_price_id,
      stripe_price_id_yearly: activePromo.stripe_price_id_yearly,
      valid_until: activePromo.valid_until,
    } : null,
  }

  return NextResponse.json(result)
}

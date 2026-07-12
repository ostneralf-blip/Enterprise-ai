import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UpgradePageClient } from './UpgradePageClient'
import type { Metadata } from 'next'
import type { Tier } from '@/types'
import type { PricingData } from '@/app/api/pricing/route'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Upgrade auf Professional' }

export default async function UpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single() as { data: { tier: string } | null }

  const tier = (profileData?.tier ?? 'free') as Tier
  if (tier !== 'free') redirect('/dashboard')

  const admin = await createAdminClient()
  const now = new Date().toISOString()
  const [{ data: config }, { data: promos }] = await Promise.all([
    admin.from('price_config').select('*').eq('tier', 'pro').single(),
    admin.from('promotions').select('*').eq('is_active', true).limit(1),
  ])
  const activePromo = (promos ?? []).find(p => {
    if (p.valid_from && p.valid_from > now) return false
    if (p.valid_until && p.valid_until < now) return false
    return true
  }) ?? null

  const pricing: PricingData = {
    monthly: config ? Number(config.monthly_price) : 49,
    yearly: config?.yearly_price ? Number(config.yearly_price) : 399,
    currency: config?.currency ?? 'EUR',
    stripe_price_id: config?.stripe_price_id ?? null,
    stripe_price_id_yearly: config?.stripe_price_id_yearly ?? null,
    promotion: activePromo ? {
      id: activePromo.id,
      name: activePromo.name,
      badge_text: activePromo.badge_text,
      description: activePromo.description,
      promo_price: Number(activePromo.promo_price),
      promo_price_yearly: activePromo.promo_price_yearly ? Number(activePromo.promo_price_yearly) : null,
      stripe_price_id: activePromo.stripe_price_id ?? null,
      stripe_price_id_yearly: activePromo.stripe_price_id_yearly ?? null,
      valid_until: activePromo.valid_until ?? null,
    } : null,
  }

  return <UpgradePageClient pricing={pricing} />
}

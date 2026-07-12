import 'server-only'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FEATURE_TIERS, hasAccess, type FeatureKey } from '@/config/tiers'
import type { Tier } from '@/types'

export { hasAccess } from '@/config/tiers'

export interface GateResult {
  userId: string
  tier: Tier
}

// Prüft Auth + Tier in einem Schritt. Rückgabe: GateResult oder NextResponse (403/401).
// Verwendung: const gate = await requireFeature('sharing'); if (gate instanceof NextResponse) return gate
export async function requireFeature(featureKey: FeatureKey): Promise<GateResult | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('tier').eq('id', user.id).single()
  const tier = (profile?.tier ?? 'free') as Tier

  const requiredTier = FEATURE_TIERS[featureKey]
  if (!hasAccess(tier, requiredTier)) {
    return NextResponse.json(
      { error: 'Upgrade erforderlich', code: 'TIER_REQUIRED', required: requiredTier },
      { status: 403 }
    )
  }

  return { userId: user.id, tier }
}

import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'
import type { Tier } from '@/types'
import type { UsageStatus } from './usage-log'

const PASS1_LIMITS: Record<Tier, number> = { free: 5, pro: 50, enterprise: 200 }

async function getPass1Limit(tier: Tier): Promise<number> {
  try {
    const supabase = await createAdminClient()
    const key = `pass1_limit_${tier}`
    const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle()
    const val = data ? Number(data.value) : NaN
    return Number.isFinite(val) && val >= 0 ? val : PASS1_LIMITS[tier]
  } catch {
    return PASS1_LIMITS[tier]
  }
}

export async function getPass1UsageStatus(userId: string, tier: Tier = 'free'): Promise<UsageStatus> {
  const [supabase, limit] = await Promise.all([createAdminClient(), getPass1Limit(tier)])
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('pass1_usage_log')
    .select('call_count')
    .eq('user_id', userId)
    .eq('call_date', today)
    .maybeSingle()
  const used = data?.call_count ?? 0
  return { used, limit, remaining: Math.max(0, limit - used), exceeded: used >= limit }
}

export async function incrementPass1Usage(userId: string, tier: Tier = 'free'): Promise<boolean> {
  const [supabase, limit] = await Promise.all([createAdminClient(), getPass1Limit(tier)])
  const { data } = await supabase.rpc('increment_pass1_usage', { p_user: userId, p_limit: limit })
  return data !== null
}

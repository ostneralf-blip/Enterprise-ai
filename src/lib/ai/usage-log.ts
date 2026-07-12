import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'
import { getAILimit } from '@/lib/app-settings'
import type { Tier } from '@/types'

export interface UsageStatus {
  remaining: number
  used: number
  limit: number
  exceeded: boolean
}

export async function getAIUsageStatus(userId: string, tier: Tier = 'free'): Promise<UsageStatus> {
  const [supabase, limit] = await Promise.all([createAdminClient(), getAILimit(tier)])
  const today = new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from('ai_usage_log')
    .select('call_count')
    .eq('user_id', userId)
    .eq('call_date', today)
    .maybeSingle()

  const used = data?.call_count ?? 0
  return { used, limit, remaining: Math.max(0, limit - used), exceeded: used >= limit }
}

export async function incrementAIUsage(userId: string, tier: Tier = 'free'): Promise<boolean> {
  const [supabase, limit] = await Promise.all([createAdminClient(), getAILimit(tier)])
  const { data } = await supabase.rpc('increment_ai_usage', { p_user: userId, p_limit: limit })
  return data !== null
}

import 'server-only'
import { createClient } from '@/lib/supabase/server'

const DAILY_LIMIT = 5

export interface UsageStatus {
  remaining: number
  used: number
  limit: number
  exceeded: boolean
}

export async function getAIUsageStatus(userId: string): Promise<UsageStatus> {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from('ai_usage_log')
    .select('call_count')
    .eq('user_id', userId)
    .eq('call_date', today)
    .maybeSingle()

  const used = data?.call_count ?? 0
  return {
    used,
    limit: DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - used),
    exceeded: used >= DAILY_LIMIT,
  }
}

// Gibt false zurück wenn Limit überschritten, true wenn Call erfasst wurde
export async function incrementAIUsage(userId: string): Promise<boolean> {
  const status = await getAIUsageStatus(userId)
  if (status.exceeded) return false

  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  await supabase.from('ai_usage_log').upsert(
    { user_id: userId, call_date: today, call_count: status.used + 1, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,call_date' }
  )
  return true
}

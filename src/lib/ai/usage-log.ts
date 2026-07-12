import 'server-only'
import { createClient } from '@/lib/supabase/server'

// Globaler Default — über Vercel Env-Var AI_DAILY_LIMIT_DEFAULT ohne
// Code-Deploy anhebbar. Fällt auf 5 zurück wenn nicht gesetzt oder ungültig.
const envDefault = Number(process.env.AI_DAILY_LIMIT_DEFAULT)
const DEFAULT_DAILY_LIMIT = Number.isFinite(envDefault) && envDefault > 0 ? envDefault : 5

export interface UsageStatus {
  remaining: number
  used: number
  limit: number
  exceeded: boolean
}

// Pro-User-Override aus profiles.feature_flags.ai_daily_limit_override —
// z.B. ein höheres Limit gezielt für einzelne Nutzer ("Geschenk"), ohne den
// globalen Default für alle anzuheben. Gesetzt via Admin-Panel/-API
// (PATCH /api/admin/users/[id]).
async function resolveDailyLimit(userId: string): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('feature_flags')
    .eq('id', userId)
    .maybeSingle()

  const flags = data?.feature_flags as Record<string, unknown> | null | undefined
  const override = flags?.ai_daily_limit_override
  return typeof override === 'number' && override > 0 ? override : DEFAULT_DAILY_LIMIT
}

export async function getAIUsageStatus(userId: string): Promise<UsageStatus> {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const [limit, { data }] = await Promise.all([
    resolveDailyLimit(userId),
    supabase
      .from('ai_usage_log')
      .select('call_count')
      .eq('user_id', userId)
      .eq('call_date', today)
      .maybeSingle(),
  ])

  const used = data?.call_count ?? 0
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    exceeded: used >= limit,
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

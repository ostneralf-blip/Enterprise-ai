import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'
import { AI_CALL_LIMITS } from '@/config/tiers'
import type { Tier } from '@/types'

// Cached pro Deployment-Instance — DB-Werte werden einmalig gelesen und
// in-memory gehalten. Für sofortige Wirksamkeit: Deployment oder cold start.
const _cache = new Map<string, number>()

async function getSetting(key: string, fallback: number): Promise<number> {
  if (_cache.has(key)) return _cache.get(key)!
  try {
    const supabase = await createAdminClient()
    const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle()
    const val = data ? Number(data.value) : NaN
    const result = Number.isFinite(val) && val >= 0 ? val : fallback
    _cache.set(key, result)
    return result
  } catch {
    return fallback
  }
}

export async function getAILimit(tier: Tier): Promise<number> {
  const key = `ai_limit_${tier}`
  return getSetting(key, AI_CALL_LIMITS[tier])
}

export async function getGracePeriodDays(): Promise<number> {
  const envVal = parseInt(process.env.STRIPE_GRACE_PERIOD_DAYS ?? '', 10)
  if (Number.isFinite(envVal)) return envVal
  return getSetting('stripe_grace_period_days', 7)
}

export async function getFallbackEnabled(): Promise<boolean> {
  return (await getSetting('ai_direct_fallback', 0)) === 1
}

export async function getFallbackEnabledAt(): Promise<Date | null> {
  const ts = await getSetting('ai_direct_fallback_enabled_at', 0)
  return ts > 0 ? new Date(ts * 1000) : null
}

// Für Admin-Panel: Cache nach Speichern invalidieren
export function invalidateSettingsCache() {
  _cache.clear()
}

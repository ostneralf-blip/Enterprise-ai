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
  _strCache.clear()
}

const _strCache = new Map<string, string>()

// Entfernt beliebig viele überflüssige JSON-Kodierungsebenen (z.B. wenn ein
// bereits kodierter Anzeige-Wert versehentlich erneut gespeichert und dabei
// nochmal JSON.stringify'd wurde — siehe #Bedrock-ValidationException-Bug
// vom 18.07.: "eu.anthropic...v1:0" wurde zu "\"eu.anthropic...v1:0\"" und
// war damit als Model-ID für AWS ungültig). Bricht ab, sobald der Wert kein
// weiteres JSON-String-Literal mehr ist.
export function unwrapJsonString(raw: unknown, maxDepth = 5): unknown {
  let value = raw
  for (let i = 0; i < maxDepth && typeof value === 'string'; i++) {
    const trimmed = value.trim()
    if (trimmed.length < 2 || trimmed[0] !== '"' || trimmed[trimmed.length - 1] !== '"') break
    try {
      value = JSON.parse(trimmed)
    } catch {
      break
    }
  }
  return value
}

async function getStringSetting(key: string, fallback: string): Promise<string> {
  if (_strCache.has(key)) return _strCache.get(key)!
  try {
    const supabase = await createAdminClient()
    const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle()
    // value-Spalte ist JSON → JSON.parse liefert den Rohwert (string, number, …)
    const parsed = data?.value != null ? unwrapJsonString(JSON.parse(data.value)) : null
    const result = typeof parsed === 'string' && parsed.trim() ? parsed.trim() : fallback
    _strCache.set(key, result)
    return result
  } catch {
    return fallback
  }
}

// Priorität: Env-Var > DB-Setting > Code-Default
export async function getBedrockModelId(model: 'haiku' | 'sonnet'): Promise<string> {
  if (model === 'haiku') {
    return process.env.BEDROCK_MODEL_HAIKU
      ?? await getStringSetting('ai_model_bedrock_haiku', 'eu.anthropic.claude-haiku-4-5-20251001-v1:0')
  }
  return process.env.BEDROCK_MODEL_SONNET
    ?? await getStringSetting('ai_model_bedrock_sonnet', 'anthropic.claude-sonnet-4-5-20250929-v1:0')
}

export async function getDirectFallbackModelId(model: 'haiku' | 'sonnet'): Promise<string> {
  const dbModel = await getStringSetting('ai_model_direct_fallback', 'claude-haiku-4-5-20251001')
  if (model === 'sonnet') return process.env.ANTHROPIC_MODEL_SONNET ?? dbModel
  return process.env.ANTHROPIC_MODEL_HAIKU ?? dbModel
}

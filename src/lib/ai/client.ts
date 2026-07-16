import 'server-only'
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { getFallbackEnabled, getFallbackEnabledAt, getBedrockModelId, getDirectFallbackModelId } from '@/lib/app-settings'

// Alle Infra-Parameter über Env-Vars konfigurierbar — Änderung ohne Deploy
const REGION          = process.env.BEDROCK_REGION ?? 'eu-west-1'
// #180: 8 s statt 15 s — Timeout-Budget: Bedrock (8 s) + Direct (30 s) muss unter
// maxDuration=60 der AI-Routen bleiben, sonst killt Vercel die Function (503).
const DEFAULT_TIMEOUT = parseInt(process.env.BEDROCK_TIMEOUT_MS ?? '8000', 10)
const DIRECT_TIMEOUT  = parseInt(process.env.ANTHROPIC_TIMEOUT_MS ?? '30000', 10)

// #180: In-Memory-Circuit-Breaker — nach einem Bedrock-Fehler 10 Minuten direkt
// zum Fallback, statt bei jedem Call erneut die volle Wartezeit zu bezahlen.
const BEDROCK_COOLDOWN_MS = parseInt(process.env.BEDROCK_COOLDOWN_MS ?? String(10 * 60 * 1000), 10)
let _bedrockFailureAt: number | null = null

// Typo-Fix: ALLOW_NON_EU_AI_FALLBACK (früher: ALLOW_NON_EU_AI_FALLACK)
const ALLOW_FALLBACK = process.env.ALLOW_NON_EU_AI_FALLBACK === 'true'

let _bedrockClient: BedrockRuntimeClient | null = null
let _startupLogged = false

function getBedrockClient(): BedrockRuntimeClient {
  if (!_bedrockClient) {
    _bedrockClient = new BedrockRuntimeClient({
      region: REGION,
      credentials: {
        accessKeyId:     process.env.AWS_BEDROCK_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_BEDROCK_SECRET_ACCESS_KEY!,
      },
    })
  }
  if (!_startupLogged) {
    _startupLogged = true
    console.info('[ai/client] Bedrock konfiguriert:', { region: REGION, fallback: ALLOW_FALLBACK })
  }
  return _bedrockClient
}

export type LLMModel = 'haiku' | 'sonnet'

export interface LLMMeta {
  provider: 'bedrock' | 'direct' | 'cache'
  modelId: string
  latencyMs: number
  region: string
}

export interface LLMResult<T> {
  data: T | null
  meta: LLMMeta
  errorCode?: string
}

interface CallLLMOptions {
  model?: LLMModel
  maxTokens?: number
  systemPrompt?: string
  timeoutMs?: number
  module?: string
}

function hashPrompt(prompt: string, model: string): string {
  return createHash('sha256').update(`${model}:${prompt}`).digest('hex').slice(0, 32)
}

function classifyBedrockError(err: unknown): string {
  const msg = String(err instanceof Error ? err.message : err)
  if (msg.includes('ThrottlingException')) return 'ThrottlingException'
  if (msg.includes('ValidationException')) return 'ValidationException'
  if (msg.includes('AccessDeniedException') || msg.includes('registration is incomplete')) return 'AccessDeniedException'
  if (msg.includes('ResourceNotFoundException')) return 'ResourceNotFoundException'
  return 'UnknownError'
}

export async function callLLM<T>(
  userPrompt: string,
  schema: z.ZodType<T>,
  opts: CallLLMOptions = {},
): Promise<LLMResult<T>> {
  const model     = opts.model ?? 'haiku'
  const modelId   = await getBedrockModelId(model)
  const maxTokens = opts.maxTokens ?? 1024
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT
  const t0        = Date.now()
  const module    = opts.module ?? 'unknown'

  function trackCacheStats(hit: boolean) {
    createAdminClient().then(async sb => {
      await sb.rpc('increment_cache_stat', { p_module: module, p_hit: hit })
    }).catch(() => {})
  }

  // Cache-Check
  const cacheKey = hashPrompt(userPrompt + (opts.systemPrompt ?? ''), modelId)
  try {
    const supabase = await createAdminClient()
    const { data: cached } = await supabase
      .from('ai_prompt_cache')
      .select('response')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
    if (cached?.response) {
      const parsed = schema.safeParse(cached.response)
      if (parsed.success) {
        trackCacheStats(true)
        return { data: parsed.data, meta: { provider: 'cache', modelId, latencyMs: Date.now() - t0, region: REGION } }
      }
    }
  } catch { /* Cache-Fehler sind nicht blockierend */ }

  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: maxTokens,
    system: opts.systemPrompt ?? 'You are a precise JSON-only API. Respond ONLY with valid JSON matching the requested schema. No explanation, no markdown, no additional text.',
    messages: [{ role: 'user', content: userPrompt }],
  })

  const noData = (provider: LLMMeta['provider'], errorCode?: string): LLMResult<T> =>
    ({ data: null, meta: { provider, modelId, latencyMs: Date.now() - t0, region: REGION }, errorCode })

  // Bedrock-Versuch (primär) — übersprungen, wenn Kreds fehlen oder der
  // Circuit-Breaker offen ist (#180): jeder aussichtslose Versuch verbrennt
  // Timeout-Budget, das der Direct-Fallback braucht.
  const hasBedrockCreds = !!(process.env.AWS_BEDROCK_ACCESS_KEY_ID && process.env.AWS_BEDROCK_SECRET_ACCESS_KEY)
  const breakerOpen = _bedrockFailureAt !== null && (Date.now() - _bedrockFailureAt) < BEDROCK_COOLDOWN_MS
  let bedrockErrorCode: string | undefined
  if (!hasBedrockCreds || breakerOpen) {
    bedrockErrorCode = hasBedrockCreds ? 'CIRCUIT_OPEN' : 'NO_BEDROCK_CREDS'
    console.info('[ai/client] Bedrock übersprungen:', bedrockErrorCode)
  } else try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept:      'application/json',
      body:        Buffer.from(body),
    })

    const res  = await getBedrockClient().send(command, { abortSignal: controller.signal })
    clearTimeout(timer)
    _bedrockFailureAt = null // Bedrock erreichbar — Breaker schließen

    const text     = new TextDecoder().decode(res.body)
    const raw      = JSON.parse(text)
    const content  = raw?.content?.[0]?.text ?? ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return noData('bedrock')

    const parsed = schema.safeParse(JSON.parse(jsonMatch[0]))
    if (!parsed.success) return noData('bedrock')

    // Cache 24h schreiben + Miss verfolgen (fire-and-forget)
    createAdminClient().then(async sb => {
      const expiresAt = new Date(Date.now() + 86_400_000).toISOString()
      await sb.from('ai_prompt_cache').upsert(
        { cache_key: cacheKey, response: parsed.data, expires_at: expiresAt },
        { onConflict: 'cache_key' }
      )
    }).catch(() => {})
    trackCacheStats(false)

    return { data: parsed.data, meta: { provider: 'bedrock', modelId, latencyMs: Date.now() - t0, region: REGION } }
  } catch (err) {
    _bedrockFailureAt = Date.now() // Breaker öffnen — nächste Calls überspringen Bedrock (#180)
    bedrockErrorCode = classifyBedrockError(err)
    Sentry.captureException(err, { tags: { 'ai.provider': 'bedrock', 'ai.model': modelId, 'aws.error_code': bedrockErrorCode, region: REGION } })
    if (bedrockErrorCode === 'ValidationException') {
      console.error('[ai/client] ValidationException — wahrscheinlich falsche Model-ID. Env-Var BEDROCK_MODEL_HAIKU/SONNET prüfen. Aktuell:', modelId)
    }
    console.error('[ai/client] Bedrock-Fehler:', bedrockErrorCode, err)
  }

  // Fallback-Gating — gilt auch für den Skip-Pfad, nicht nur für Bedrock-Exceptions (#180)
  const dbFallback = await getFallbackEnabled()
  const shouldFallback = ALLOW_FALLBACK || dbFallback
  if (!shouldFallback) {
    console.warn('[ai/client] Kein Fallback: weder ALLOW_NON_EU_AI_FALLBACK noch Admin-Toggle aktiv')
    return noData('bedrock', bedrockErrorCode)
  }
  if (!process.env.ANTHROPIC_API_KEY) { console.warn('[ai/client] Kein Fallback: ANTHROPIC_API_KEY fehlt'); return noData('bedrock', 'FALLBACK_NO_KEY') }
  // Info-Log in Production (kein Hard-Block mehr — Admin hat bewusst aktiviert, #177)
  if (process.env.VERCEL_ENV === 'production') {
    Sentry.captureMessage('AI Direct Fallback aktiv in Production', {
      level: 'info',
      tags: { source: dbFallback ? 'admin_toggle' : 'env', model: modelId, region: REGION, bedrock_error: bedrockErrorCode ?? 'none' },
    })
    const enabledAt = await getFallbackEnabledAt()
    if (enabledAt && (Date.now() - enabledAt.getTime()) > 14 * 24 * 60 * 60 * 1000) {
      Sentry.captureMessage('AI Fallback seit >14 Tagen aktiv — zurückschalten sobald Bedrock verfügbar', {
        level: 'warning',
        tags: { days_active: String(Math.round((Date.now() - enabledAt.getTime()) / 86400000)) },
      })
    }
  }
  console.info('[ai/client] Anthropic-Direktfallback wird versucht...', { after: bedrockErrorCode ?? 'bedrock_failed' })

  // Direct-Fallback (Anthropic API, non-EU — nur bei aktivem Admin-Toggle/env-Flag, #177)
  try {
    const directModel = await getDirectFallbackModelId(model)

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model: directModel, max_tokens: maxTokens,
        system: opts.systemPrompt ?? 'You are a precise JSON-only API. Respond ONLY with valid JSON.',
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: AbortSignal.timeout(DIRECT_TIMEOUT),
    })
    if (!res.ok) {
      const errBody = await res.text().catch(() => '(unlesbar)')
      console.error('[ai/client] Anthropic HTTP-Fehler:', res.status, errBody.slice(0, 300))
      return noData('direct', `HTTP_${res.status}`)
    }
    const json     = await res.json()
    const content  = json?.content?.[0]?.text ?? ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[ai/client] Anthropic: kein JSON in Antwort gefunden', content.slice(0, 200))
      return noData('direct', 'NO_JSON')
    }
    const parsed = schema.safeParse(JSON.parse(jsonMatch[0]))
    if (!parsed.success) {
      console.error('[ai/client] Anthropic: Zod-Parse fehlgeschlagen', parsed.error.issues)
      return noData('direct', 'ZOD_PARSE')
    }
    console.info('[ai/client] Anthropic-Fallback erfolgreich', { model: directModel, ms: Date.now() - t0 })
    return { data: parsed.data, meta: { provider: 'direct', modelId: directModel, latencyMs: Date.now() - t0, region: 'us' } }
  } catch (err) {
    console.error('[ai/client] Anthropic-Fallback Exception:', err)
    return noData('direct', 'EXCEPTION')
  }
}

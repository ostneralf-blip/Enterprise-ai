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
  promptCachedTokens?: number
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
  // Wenn gesetzt: wird als cache_control-Block in Anthropic-Direct-Calls markiert (#210)
  // Für Bedrock: wird als normales Präfix vorangestellt
  cacheControlPrefix?: string
}

function hashPrompt(prompt: string, model: string, prefix?: string): string {
  return createHash('sha256').update(`${model}:${prefix ?? ''}:${prompt}`).digest('hex').slice(0, 32)
}

function classifyBedrockError(err: unknown): string {
  // AWS SDK v3 setzt bei Service-Fehlern err.name auf den exakten Exception-
  // Typ (z.B. "ValidationException") — err.message enthält oft NUR den
  // Beschreibungstext ohne den Typnamen (z.B. nur "The provided model
  // identifier is invalid." ohne "ValidationException:" davor). Ein reiner
  // message.includes()-Check lief deshalb bei manchen Exceptions ins Leere
  // und landete fälschlich als "UnknownError" — err.name zuerst prüfen.
  if (err instanceof Error) {
    if (err.name === 'AbortError') return 'Timeout'
    const known = ['ThrottlingException', 'ValidationException', 'AccessDeniedException', 'ResourceNotFoundException', 'UnrecognizedClientException']
    if (known.includes(err.name)) return err.name
  }
  const msg = String(err instanceof Error ? err.message : err)
  if (msg.includes('ThrottlingException')) return 'ThrottlingException'
  if (msg.includes('ValidationException')) return 'ValidationException'
  if (msg.includes('AccessDeniedException') || msg.includes('registration is incomplete')) return 'AccessDeniedException'
  if (msg.includes('ResourceNotFoundException')) return 'ResourceNotFoundException'
  if (msg.includes('UnrecognizedClientException')) return 'UnrecognizedClientException'
  return 'UnknownError'
}

// Bug (aufgefallen 18.07.2026 im Canvas-Modul): die bisherige Extraktion
// (/\{[\s\S]*\}/) griff nur den ersten "{" bis zum letzten "}" — bei Prompts,
// die explizit ein JSON-ARRAY anfordern (z. B. classify-terms:
// "Return ONLY a JSON array: [{...}]"), wurde damit nur der erste bis letzte
// Objekt-Body OHNE die umschließenden "[" "]" extrahiert. Bei mehr als einem
// Array-Element ergab das mehrere durch Komma getrennte Objekte auf oberster
// Ebene — kein valides JSON mehr ("Unexpected non-whitespace character after
// JSON"). Jetzt wird das zuerst auftretende Klammerpaar (Objekt ODER Array)
// erkannt und bis zur letzten passenden Schlussklammer extrahiert.
function extractJson(content: string): string | null {
  const firstBrace   = content.indexOf('{')
  const firstBracket = content.indexOf('[')
  if (firstBrace === -1 && firstBracket === -1) return null
  const arrayFirst = firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)
  const start = arrayFirst ? firstBracket : firstBrace
  const end   = content.lastIndexOf(arrayFirst ? ']' : '}')
  if (end === -1 || end < start) return null
  return content.slice(start, end + 1)
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
  const moduleName = opts.module ?? 'unknown'

  function trackCacheStats(hit: boolean) {
    createAdminClient().then(async sb => {
      await sb.rpc('increment_cache_stat', { p_module: moduleName, p_hit: hit })
    }).catch(() => {})
  }

  // Cache-Check — cacheControlPrefix fließt in den Key ein (#210)
  const cacheKey = hashPrompt(userPrompt + (opts.systemPrompt ?? ''), modelId, opts.cacheControlPrefix)
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

  // Für Bedrock: cacheControlPrefix als normales Präfix voranstellen
  const bedrockUserContent = opts.cacheControlPrefix
    ? `${opts.cacheControlPrefix}\n\n${userPrompt}`
    : userPrompt
  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: maxTokens,
    system: opts.systemPrompt ?? 'You are a precise JSON-only API. Respond ONLY with valid JSON matching the requested schema. No explanation, no markdown, no additional text.',
    messages: [{ role: 'user', content: bedrockUserContent }],
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
  } else {
    // Ein Retry speziell bei Timeout: vereinzelte Bedrock-Antworten brauchen
    // etwas länger als das Timeout-Budget, ohne dass Bedrock selbst ein
    // Problem hat — ein zweiter Versuch bleibt komplett innerhalb von
    // Bedrock/EU (keine Compliance-Frage wie beim Non-EU-Direct-Fallback)
    // und macht parallele Sektions-Calls spürbar stabiler.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
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
        const jsonStr = extractJson(content)
        if (!jsonStr) {
          console.error('[ai/client] Bedrock: kein JSON in Antwort gefunden', { module: moduleName, content: content.slice(0, 300) })
          return noData('bedrock', 'NO_JSON')
        }

        const parsed = schema.safeParse(JSON.parse(jsonStr))
        if (!parsed.success) {
          // path.join(): verschachtelte Arrays werden von Node/Vercels Log-Viewer
          // sonst ab einer gewissen Tiefe zu "[Array]" zusammengeklappt.
          const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
          console.error('[ai/client] Bedrock: Zod-Parse fehlgeschlagen', moduleName, issues)
          return noData('bedrock', 'ZOD_PARSE')
        }

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
        bedrockErrorCode = classifyBedrockError(err)
        if (bedrockErrorCode === 'Timeout' && attempt === 1) {
          console.warn('[ai/client] Bedrock-Timeout, Retry-Versuch 2/2', moduleName)
          continue
        }
        _bedrockFailureAt = Date.now() // Breaker öffnen — nächste Calls überspringen Bedrock (#180)
        Sentry.captureException(err, { tags: { 'ai.provider': 'bedrock', 'ai.model': modelId, 'aws.error_code': bedrockErrorCode, region: REGION, attempt, module: moduleName } })
        if (bedrockErrorCode === 'ValidationException') {
          console.error('[ai/client] ValidationException — wahrscheinlich falsche Model-ID. Env-Var BEDROCK_MODEL_HAIKU/SONNET prüfen. Aktuell:', modelId, moduleName)
        }
        console.error('[ai/client] Bedrock-Fehler:', bedrockErrorCode, moduleName, err)
      }
    }
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
    // Wenn cacheControlPrefix gesetzt: stabiles Präfix als cache_control-Block markieren (#210)
    const directMessages = opts.cacheControlPrefix
      ? [{ role: 'user', content: [
          { type: 'text', text: opts.cacheControlPrefix, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: userPrompt },
        ]}]
      : [{ role: 'user', content: userPrompt }]
    const directHeaders: Record<string, string> = {
      'x-api-key':         process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    }
    if (opts.cacheControlPrefix) directHeaders['anthropic-beta'] = 'prompt-caching-2024-07-31'

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: directHeaders,
      body: JSON.stringify({
        model: directModel, max_tokens: maxTokens,
        system: opts.systemPrompt ?? 'You are a precise JSON-only API. Respond ONLY with valid JSON.',
        messages: directMessages,
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
    const promptCachedTokens = (json?.usage?.cache_read_input_tokens as number | undefined) ?? 0
    const jsonStr = extractJson(content)
    if (!jsonStr) {
      console.error('[ai/client] Anthropic: kein JSON in Antwort gefunden', content.slice(0, 200))
      return noData('direct', 'NO_JSON')
    }
    const parsed = schema.safeParse(JSON.parse(jsonStr))
    if (!parsed.success) {
      console.error('[ai/client] Anthropic: Zod-Parse fehlgeschlagen', parsed.error.issues)
      return noData('direct', 'ZOD_PARSE')
    }
    console.info('[ai/client] Anthropic-Fallback erfolgreich', { model: directModel, ms: Date.now() - t0, promptCachedTokens })
    return { data: parsed.data, meta: { provider: 'direct', modelId: directModel, latencyMs: Date.now() - t0, region: 'us', promptCachedTokens } }
  } catch (err) {
    console.error('[ai/client] Anthropic-Fallback Exception:', err)
    return noData('direct', 'EXCEPTION')
  }
}

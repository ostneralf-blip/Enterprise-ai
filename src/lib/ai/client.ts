import 'server-only'
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

// Alle Infra-Parameter über Env-Vars konfigurierbar — Änderung ohne Deploy
const REGION          = process.env.BEDROCK_REGION ?? 'eu-west-1'
const DEFAULT_TIMEOUT = parseInt(process.env.BEDROCK_TIMEOUT_MS ?? '15000', 10)

const MODEL_IDS = {
  haiku:  process.env.BEDROCK_MODEL_HAIKU  ?? 'anthropic.claude-haiku-4-5-20251001',
  sonnet: process.env.BEDROCK_MODEL_SONNET ?? 'anthropic.claude-sonnet-4-6-20250514',
} as const

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
    console.info('[ai/client] Bedrock konfiguriert:', { region: REGION, haiku: MODEL_IDS.haiku, sonnet: MODEL_IDS.sonnet, fallback: ALLOW_FALLBACK })
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
  const modelId   = MODEL_IDS[model]
  const maxTokens = opts.maxTokens ?? 1024
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT
  const t0        = Date.now()

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

  // Bedrock-Versuch (primär)
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

    const text     = new TextDecoder().decode(res.body)
    const raw      = JSON.parse(text)
    const content  = raw?.content?.[0]?.text ?? ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return noData('bedrock')

    const parsed = schema.safeParse(JSON.parse(jsonMatch[0]))
    if (!parsed.success) return noData('bedrock')

    // Cache 24h schreiben (fire-and-forget)
    createAdminClient().then(async sb => {
      const expiresAt = new Date(Date.now() + 86_400_000).toISOString()
      await sb.from('ai_prompt_cache').upsert(
        { cache_key: cacheKey, response: parsed.data, expires_at: expiresAt },
        { onConflict: 'cache_key' }
      )
    }).catch(() => {})

    return { data: parsed.data, meta: { provider: 'bedrock', modelId, latencyMs: Date.now() - t0, region: REGION } }
  } catch (err) {
    const errorCode = classifyBedrockError(err)
    Sentry.captureException(err, { tags: { 'ai.provider': 'bedrock', 'ai.model': modelId, 'aws.error_code': errorCode, region: REGION } })
    console.error('[ai/client] Bedrock-Fehler:', errorCode, err)

    // Direkter Anthropic-Fallback — nur wenn explizit via ALLOW_NON_EU_AI_FALLBACK aktiviert
    // HINWEIS: Produktions-Guard deaktiviert für Testphase — vor Go-Live wieder aktivieren
    if (!ALLOW_FALLBACK || !process.env.ANTHROPIC_API_KEY) return noData('bedrock', errorCode)
  }

  // Direct-Fallback (nur lokal/staging)
  try {
    const directModel = model === 'sonnet'
      ? (process.env.ANTHROPIC_MODEL_SONNET ?? 'claude-sonnet-4-6-20250514')
      : (process.env.ANTHROPIC_MODEL_HAIKU  ?? 'claude-haiku-4-5-20251001')

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
      signal: AbortSignal.timeout(timeoutMs),
    })
    const json     = await res.json()
    const content  = json?.content?.[0]?.text ?? ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return noData('direct')

    const parsed = schema.safeParse(JSON.parse(jsonMatch[0]))
    if (!parsed.success) return noData('direct')

    return { data: parsed.data, meta: { provider: 'direct', modelId: directModel, latencyMs: Date.now() - t0, region: 'us' } }
  } catch {
    return noData('direct')
  }
}

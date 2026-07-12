import 'server-only'
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'
import { z } from 'zod'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'

// Anthropic-Modelle sind für diesen AWS-Account nicht in eu-central-1
// (Frankfurt) freischaltbar, wohl aber in eu-west-1 (Irland) — beides
// EU/GDPR-Gebiet, erfüllt weiterhin "NIEMALS Daten außerhalb EU".
const REGION = 'eu-west-1'
const DEFAULT_TIMEOUT_MS = 15_000

// ─── Bedrock (primär, EU-Region) ────────────────────────────────────────────
let _client: BedrockRuntimeClient | null = null
function getClient(): BedrockRuntimeClient {
  if (!_client) {
    _client = new BedrockRuntimeClient({
      region: REGION,
      credentials: {
        accessKeyId:     process.env.AWS_BEDROCK_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_BEDROCK_SECRET_ACCESS_KEY!,
      },
    })
  }
  return _client
}

export type LLMModel = 'haiku' | 'sonnet'

const BEDROCK_MODEL_IDS: Record<LLMModel, string> = {
  haiku:  'anthropic.claude-haiku-4-5-20251001',
  sonnet: 'anthropic.claude-sonnet-4-6-20250514',
}

// ─── Direkte Anthropic-API — NUR temporärer Fallback ────────────────────────
// Solange die Bedrock-Modellfreischaltung (eu-west-1) aussteht. WICHTIG: Die
// direkte API garantiert keine EU-Datenresidenz (nur "us"/"global"-Inferenz)
// — verstößt gegen die eigene Regel "NIEMALS Daten außerhalb EU", sobald
// echte Nutzerdaten durchlaufen. Deshalb standardmäßig AUS, nur mit
// explizitem Opt-in-Flag ALLOW_NON_EU_AI_FALLACK=true aktivierbar. Flag NIE
// in Vercel-Produktion setzen — nur lokal, solange Bedrock/Irland nicht
// durchgeschaltet ist. Sobald Bedrock läuft: Flag einfach nicht setzen,
// dieser Pfad wird dann nie erreicht.
const DIRECT_MODEL_IDS: Record<LLMModel, string> = {
  haiku:  process.env.ANTHROPIC_MODEL_HAIKU  ?? 'claude-haiku-4-5-20251001',
  sonnet: process.env.ANTHROPIC_MODEL_SONNET ?? 'claude-sonnet-4-6-20250514',
}

function directFallbackAllowed(): boolean {
  return process.env.ALLOW_NON_EU_AI_FALLBACK === 'true' && !!process.env.ANTHROPIC_API_KEY
}

interface CallLLMOptions {
  model?: LLMModel
  maxTokens?: number
  systemPrompt?: string
  timeoutMs?: number
}

const DEFAULT_SYSTEM_PROMPT =
  'You are a precise JSON-only API. Respond ONLY with valid JSON matching the requested schema. No explanation, no markdown, no additional text.'

// Prompt hashen für Cache-Lookup — hängt vom tatsächlich angefragten Modell
// ab, Bedrock- und Direct-Antworten landen dadurch automatisch in getrennten
// Cache-Einträgen (unterschiedliche modelId-Strings).
function hashPrompt(prompt: string, model: string): string {
  return createHash('sha256').update(`${model}:${prompt}`).digest('hex').slice(0, 32)
}

function extractJson(text: string): unknown | null {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

async function invokeBedrock(
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  timeoutMs: number,
): Promise<unknown | null> {
  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept:      'application/json',
    body:        Buffer.from(body),
  })

  const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
  const callPromise = getClient().send(command).then((res) => {
    const text = new TextDecoder().decode(res.body)
    const raw  = JSON.parse(text)
    // Bedrock wraps the response: { content: [{ text: "..." }] }
    const content = raw?.content?.[0]?.text ?? ''
    return extractJson(content)
  })

  return Promise.race([callPromise, timeoutPromise])
}

// Temporärer Fallback über die direkte Anthropic-API — siehe Hinweis oben
// bei DIRECT_MODEL_IDS. Gleiches Prompt-/Response-Verhalten wie Bedrock
// (JSON-in-Text statt Tool-Use), damit sich beide Pfade für callLLM()
// identisch verhalten.
async function invokeDirectAnthropic(
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  timeoutMs: number,
): Promise<unknown | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const text = data?.content?.[0]?.text ?? ''
    return extractJson(text)
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export async function callLLM<T>(
  userPrompt: string,
  schema: z.ZodType<T>,
  opts: CallLLMOptions = {},
): Promise<T | null> {
  const model = opts.model ?? 'haiku'
  const maxTokens = opts.maxTokens ?? 1024
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const systemPrompt = opts.systemPrompt ?? DEFAULT_SYSTEM_PROMPT

  const bedrockModelId = BEDROCK_MODEL_IDS[model]
  const bedrockConfigured = !!process.env.AWS_BEDROCK_ACCESS_KEY_ID && !!process.env.AWS_BEDROCK_SECRET_ACCESS_KEY

  const primaryModelId = bedrockConfigured ? bedrockModelId : DIRECT_MODEL_IDS[model]
  const cacheKey = hashPrompt(userPrompt + systemPrompt, primaryModelId)

  // Cache-Check: identische Prompts nicht erneut aufrufen
  try {
    const supabase = await createClient()
    const { data: cached } = await supabase
      .from('ai_prompt_cache')
      .select('response')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
    if (cached?.response) {
      const parsed = schema.safeParse(cached.response)
      if (parsed.success) return parsed.data
    }
  } catch {
    // Cache-Fehler sind nicht blockierend
  }

  let result: unknown | null = null

  if (bedrockConfigured) {
    try {
      result = await invokeBedrock(bedrockModelId, systemPrompt, userPrompt, maxTokens, timeoutMs)
    } catch {
      result = null
    }
  }

  // Fallback: Bedrock nicht konfiguriert ODER fehlgeschlagen, UND explizites
  // Opt-in für den Nicht-EU-Pfad gesetzt (ALLOW_NON_EU_AI_FALLBACK=true).
  if (!result && directFallbackAllowed()) {
    result = await invokeDirectAnthropic(
      DIRECT_MODEL_IDS[model], systemPrompt, userPrompt, maxTokens, timeoutMs,
    )
  }

  if (!result) return null

  const parsed = schema.safeParse(result)
  if (!parsed.success) return null

  // Cache 24h schreiben (fire-and-forget)
  try {
    const supabase = await createClient()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('ai_prompt_cache').upsert({
      cache_key:  cacheKey,
      response:   parsed.data,
      expires_at: expiresAt,
    }, { onConflict: 'cache_key' })
  } catch {
    // Cache-Write-Fehler sind nicht blockierend
  }

  return parsed.data
}

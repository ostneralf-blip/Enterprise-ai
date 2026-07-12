import 'server-only'
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'
import { z } from 'zod'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

const REGION = 'eu-central-1'
const DEFAULT_TIMEOUT_MS = 15_000

// Lazy-init damit die Credentials erst beim ersten echten Call gelesen werden
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

const MODEL_IDS: Record<LLMModel, string> = {
  haiku:  'anthropic.claude-haiku-4-5-20251001',
  sonnet: 'anthropic.claude-sonnet-4-6-20250514',
}

interface CallLLMOptions {
  model?: LLMModel
  maxTokens?: number
  systemPrompt?: string
  timeoutMs?: number
}

// Prompt hashen für Cache-Lookup
function hashPrompt(prompt: string, model: string): string {
  return createHash('sha256').update(`${model}:${prompt}`).digest('hex').slice(0, 32)
}

export async function callLLM<T>(
  userPrompt: string,
  schema: z.ZodType<T>,
  opts: CallLLMOptions = {},
): Promise<T | null> {
  const model = opts.model ?? 'haiku'
  const modelId = MODEL_IDS[model]
  const maxTokens = opts.maxTokens ?? 1024
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS

  // Cache-Check: identische Prompts nicht erneut aufrufen
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
      if (parsed.success) return parsed.data
    }
  } catch {
    // Cache-Fehler sind nicht blockierend
  }

  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: maxTokens,
    system: opts.systemPrompt ?? 'You are a precise JSON-only API. Respond ONLY with valid JSON matching the requested schema. No explanation, no markdown, no additional text.',
    messages: [{ role: 'user', content: userPrompt }],
  })

  try {
    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept:      'application/json',
      body:        Buffer.from(body),
    })

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), timeoutMs)
    )
    const callPromise = getClient().send(command).then(async (res) => {
      const text = new TextDecoder().decode(res.body)
      const raw  = JSON.parse(text)
      // Bedrock wraps the response: { content: [{ text: "..." }] }
      const content = raw?.content?.[0]?.text ?? ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return null
      return JSON.parse(jsonMatch[0])
    })

    const result = await Promise.race([callPromise, timeoutPromise])
    if (!result) return null

    const parsed = schema.safeParse(result)
    if (!parsed.success) return null

    // Cache 24h schreiben (fire-and-forget)
    try {
      const supabase = await createAdminClient()
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
  } catch {
    return null
  }
}

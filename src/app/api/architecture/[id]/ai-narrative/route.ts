import { NextRequest, NextResponse } from 'next/server'
import { requireFeature } from '@/lib/utils/tier-check'
import { callLLM } from '@/lib/ai/client'
import { NarrativeSectionSchema } from '@/lib/ai/schemas'
import { getAIUsageStatus, incrementAIUsage } from '@/lib/ai/usage-log'
import { trackServer } from '@/lib/posthog/server'
import { buildSharedContext, buildSectionBlocks } from '@/lib/ai/analysis'
import { createClient } from '@/lib/supabase/server'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

// #180: Budget für Bedrock-Versuch (8 s) + Direct-Fallback (30 s) + Overhead
export const maxDuration = 60

const BodySchema = z.object({
  components:           z.array(z.string()).max(30),
  roles:                z.array(z.string()).max(15),
  compliance:           z.string().max(50).optional(),
  archetype:            z.string().max(50).optional(),
  canvas_quadrant:      z.string().max(50).optional(),
  governance_result:    z.string().max(50).optional(),
  roadmap_phases:       z.number().int().min(0).max(10).optional(),
  assessment_score_pct: z.number().int().min(0).max(100).optional(),
  locale:               z.enum(['de', 'en']).default('de'),
  audience:             z.enum(['exec', 'architect', 'compliance']).default('architect'),
  context_hash:         z.string().max(32).optional(),
})

// Adapter: audience → unified section name
const AUDIENCE_SECTION = {
  exec:       'narrative_exec',
  architect:  'narrative_architect',
  compliance: 'narrative_compliance',
} as const

// Wrapper-Schema: unified endpoint gibt {"narrative_exec": {...}} zurück
function makeSectionWrapperSchema(section: string) {
  return z.object({ [section]: NarrativeSectionSchema }).passthrough()
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const gate = await requireFeature('ai_enrich')
  if (gate instanceof NextResponse) return gate
  const { userId, tier } = gate

  const body = BodySchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })

  const supabase = await createClient()
  const { data: arch } = await supabase
    .from('architectures')
    .select('id, ai_narrative')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  if (!arch) return NextResponse.json({ error: 'Architektur nicht gefunden' }, { status: 404 })

  const usage = await getAIUsageStatus(userId, tier)
  if (usage.exceeded) return NextResponse.json({ error: 'Tages-Limit erreicht', code: 'LIMIT_EXCEEDED', usage }, { status: 429 })

  const { components, roles, compliance, archetype, canvas_quadrant, governance_result, roadmap_phases, assessment_score_pct, audience, locale, context_hash } = body.data
  const section = AUDIENCE_SECTION[audience]

  const sharedContext = buildSharedContext({ components, roles, compliance, archetype, canvas_quadrant, governance_result, roadmap_phases, assessment_score_pct, locale })
  const sectionBlocks = buildSectionBlocks([section])
  const wrapperSchema = makeSectionWrapperSchema(section)

  const { data: rawResult, meta, errorCode } = await callLLM(
    sectionBlocks,
    wrapperSchema,
    { model: 'haiku', maxTokens: 2048, module: 'architecture', cacheControlPrefix: sharedContext },
  )

  const result = rawResult ? NarrativeSectionSchema.safeParse((rawResult as Record<string, unknown>)[section]) : null

  if (!result?.success) {
    void trackServer(userId, 'ai_call', { provider: meta.provider, model: meta.modelId, module: 'architecture', success: false, cached: false, latency_ms: meta.latencyMs })
    return NextResponse.json({
      error: 'KI-Analyse fehlgeschlagen — deterministische Bausteine bleiben aktiv',
      code: 'AI_FAILED',
      bedrock_error: errorCode ?? 'PARSE_OR_EMPTY',
    }, { status: 503 })
  }

  if (meta.provider === 'direct' && process.env.VERCEL_ENV === 'production') {
    Sentry.captureMessage('AI non-EU fallback used in production', { level: 'error', tags: { 'ai.provider': 'direct', module: 'architecture', model: meta.modelId } })
  }

  const ok = await incrementAIUsage(userId, tier)
  if (!ok) return NextResponse.json({ error: 'Tages-Limit erreicht', code: 'LIMIT_EXCEEDED' }, { status: 429 })

  void trackServer(userId, 'ai_call', { provider: meta.provider, model: meta.modelId, module: 'architecture', success: true, cached: meta.provider === 'cache', latency_ms: meta.latencyMs, audience })

  const aiModel = meta.provider === 'cache'
    ? `${meta.modelId} (cached)`
    : `${meta.modelId} via ${meta.provider === 'bedrock' ? `AWS Bedrock ${meta.region}` : 'Anthropic Direct'}`

  const resultWithHash = context_hash ? { ...result.data, based_on_hash: context_hash } : result.data
  const existingNarrative = (arch.ai_narrative as Record<string, unknown> | null) ?? {}
  const mergedNarrative = { ...existingNarrative, [audience]: resultWithHash }

  await supabase
    .from('architectures')
    .update({ ai_narrative: mergedNarrative, ai_model: aiModel, ai_generated_at: new Date().toISOString(), narrative_locale: locale })
    .eq('id', id)
    .eq('user_id', userId)

  return NextResponse.json({ result: resultWithHash, usage: await getAIUsageStatus(userId, tier), ai_model: aiModel })
}

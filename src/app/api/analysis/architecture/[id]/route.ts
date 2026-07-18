import { NextRequest, NextResponse } from 'next/server'
import { requireFeature } from '@/lib/utils/tier-check'
import { callLLM } from '@/lib/ai/client'
import { SectionEnum, AnalysisRawSchema, NarrativeSectionSchema, RasicSuggestionSectionSchema, ComplianceHintsSectionSchema, DecisionSectionSchema } from '@/lib/ai/schemas'
import type { AnalysisSection } from '@/lib/ai/schemas'
import { getAIUsageStatus, incrementAIUsage } from '@/lib/ai/usage-log'
import { trackServer } from '@/lib/posthog/server'
import { buildSharedContext, buildSectionBlocks } from '@/lib/ai/analysis'
import { SECTION_TO_AUDIENCE } from '@/lib/ai/section-audience'
import { createClient } from '@/lib/supabase/server'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

export const maxDuration = 60

const BodySchema = z.object({
  sections:             z.array(SectionEnum).min(1).max(6),
  components:           z.array(z.string().max(200)).max(30),
  roles:                z.array(z.string().max(100)).max(15),
  compliance:           z.string().max(50).optional(),
  archetype:            z.string().max(50).optional(),
  canvas_quadrant:      z.string().max(50).optional(),
  governance_result:    z.string().max(50).optional(),
  roadmap_phases:       z.number().int().min(0).max(10).optional(),
  assessment_score_pct: z.number().int().min(0).max(100).optional(),
  locale:               z.enum(['de', 'en']).default('de'),
  context_hash:         z.string().max(32).optional(),
})

// Per-section Zod schemas for partial-failure validation
const SECTION_SCHEMAS = {
  narrative_exec:       NarrativeSectionSchema,
  narrative_architect:  NarrativeSectionSchema,
  narrative_compliance: NarrativeSectionSchema,
  rasic_suggestion:     RasicSuggestionSectionSchema,
  compliance_hints:     ComplianceHintsSectionSchema,
  decision:             DecisionSectionSchema,
} as const

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

  const { sections: rawSections, components, roles, compliance, archetype, canvas_quadrant, governance_result, roadmap_phases, assessment_score_pct, locale, context_hash } = body.data
  // Deduplizieren + sortieren für stabilen Cache-Key
  const sections = [...new Set(rawSections)].sort() as z.infer<typeof SectionEnum>[]

  const sharedContext = buildSharedContext({ components, roles, compliance, archetype, canvas_quadrant, governance_result, roadmap_phases, assessment_score_pct, locale })
  const sectionBlocks = buildSectionBlocks(sections)

  const { data: rawResult, meta, errorCode } = await callLLM(
    sectionBlocks,
    AnalysisRawSchema,
    { model: 'haiku', maxTokens: 2048, module: 'architecture', cacheControlPrefix: sharedContext },
  )

  if (!rawResult) {
    void trackServer(userId, 'ai_call', { provider: meta.provider, model: meta.modelId, module: 'analysis', success: false, sections: sections.join(','), cached: false })
    return NextResponse.json({ error: 'KI-Analyse fehlgeschlagen', code: 'AI_FAILED', bedrock_error: errorCode ?? 'PARSE_OR_EMPTY' }, { status: 503 })
  }

  if (meta.provider === 'direct' && process.env.VERCEL_ENV === 'production') {
    Sentry.captureMessage('AI non-EU fallback used in production', { level: 'error', tags: { 'ai.provider': 'direct', module: 'analysis' } })
  }

  // Partial-failure: jede Sektion separat validieren
  const sectionResults: Record<string, unknown> = {}
  const sectionErrors: Record<string, string> = {}
  for (const section of sections) {
    const raw = (rawResult as Record<string, unknown>)[section]
    if (!raw) {
      sectionErrors[section] = 'MISSING'
      void trackServer(userId, 'ai_section_failed', { section, error_code: 'MISSING', module: 'analysis' })
      continue
    }
    const parsed = SECTION_SCHEMAS[section].safeParse(raw)
    if (parsed.success) {
      sectionResults[section] = parsed.data
    } else {
      sectionErrors[section] = 'ZOD_PARSE'
      const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
      console.error('[analysis] Zod-Parse fehlgeschlagen', section, issues)
      Sentry.captureMessage('AI Analysis: Sektion fehlgeschlagen (ZOD_PARSE)', {
        level: 'warning',
        tags: { section, module: 'analysis', model: meta.modelId },
        extra: { issues },
      })
      void trackServer(userId, 'ai_section_failed', { section, error_code: 'ZOD_PARSE', module: 'analysis' })
    }
  }

  const ok = await incrementAIUsage(userId, tier)
  if (!ok) return NextResponse.json({ error: 'Tages-Limit erreicht', code: 'LIMIT_EXCEEDED' }, { status: 429 })

  void trackServer(userId, 'ai_call', {
    provider: meta.provider, model: meta.modelId, module: 'analysis',
    success: true, cached: meta.provider === 'cache',
    sections: sections.join(','), prompt_cached_tokens: meta.promptCachedTokens ?? 0,
  })

  // Ergebnisse in ai_narrative JSONB mergen (je Sektion ein Key) — narrative_*
  // wird unter dem kurzen Audience-Namen gespeichert (SECTION_TO_AUDIENCE),
  // andere Sektionen behalten ihren vollen Namen.
  const existingNarrative = (arch.ai_narrative as Record<string, unknown> | null) ?? {}
  const updatedNarrative: Record<string, unknown> = { ...existingNarrative }
  for (const [section, data] of Object.entries(sectionResults)) {
    const key = SECTION_TO_AUDIENCE[section as AnalysisSection] ?? section
    updatedNarrative[key] = context_hash ? { ...(data as object), based_on_hash: context_hash } : data
  }

  const aiModel = meta.provider === 'cache'
    ? `${meta.modelId} (cached)`
    : `${meta.modelId} via ${meta.provider === 'bedrock' ? `AWS Bedrock ${meta.region}` : 'Anthropic Direct'}`

  await supabase
    .from('architectures')
    .update({ ai_narrative: updatedNarrative, ai_model: aiModel, ai_generated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)

  return NextResponse.json({
    sections: sectionResults,
    errors:   Object.keys(sectionErrors).length > 0 ? sectionErrors : undefined,
    usage:    await getAIUsageStatus(userId, tier),
    ai_model: aiModel,
    prompt_cached_tokens: meta.promptCachedTokens ?? 0,
  })
}

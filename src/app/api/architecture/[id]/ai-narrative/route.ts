import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireFeature } from '@/lib/utils/tier-check'
import { callLLM } from '@/lib/ai/client'
import { ArchitectureNarrativeSchema } from '@/lib/ai/schemas'
import { getAIUsageStatus, incrementAIUsage } from '@/lib/ai/usage-log'
import { trackServer } from '@/lib/posthog/server'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

// #180: Budget für Bedrock-Versuch (8 s) + Direct-Fallback (30 s) + Overhead —
// ohne maxDuration killt Vercel die Function vor dem Fallback (503 nach ~18 s).
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
  if (usage.exceeded) {
    return NextResponse.json({ error: 'Tages-Limit erreicht', code: 'LIMIT_EXCEEDED', usage }, { status: 429 })
  }

  const { components, roles, compliance, archetype, canvas_quadrant, governance_result, roadmap_phases, assessment_score_pct, audience, locale, context_hash } = body.data

  const langName = locale === 'de' ? 'German (Deutsch, de-DE)' : 'English (en-US)'

  const audienceInstruction = audience === 'exec'
    ? 'Target audience: C-level / CFO. Use business language only. Key decisions = strategic, budget-relevant. Next steps = high-level milestones with timeframes. No technical jargon.'
    : audience === 'compliance'
    ? 'Target audience: Compliance / Audit / DPO. Focus on data flows, EU AI Act obligations, GDPR controls, risk mitigations, and audit evidence. Key decisions = regulatory commitments. Next steps = compliance actions.'
    : 'Target audience: Enterprise Architect / IT Lead. Full technical depth. Be specific about integration points, model choices, infrastructure decisions, and operational requirements.'

  const summaryInstruction = audience === 'exec'
    ? 'Write a 2-3 sentence executive summary in plain business language: what this AI architecture delivers, the key business value, and the most critical risk. No technical terms.'
    : audience === 'compliance'
    ? 'Write a 2-3 sentence compliance summary: which EU AI Act / GDPR obligations apply, which components require special attention, and what the immediate compliance action is.'
    : 'Write a 2-3 sentence technical summary: the overall architecture pattern, the most important integration decision, and the primary operational challenge.'

  const scoreLine = assessment_score_pct != null
    ? `- AI Readiness Score: ${assessment_score_pct} % (on a 0–100 scale; ALWAYS use this exact value when referencing the score — NEVER invent or recalculate it)`
    : ''

  const prompt = `You are an enterprise AI architecture expert. Based on the following validated architecture facts, generate concise, context-specific output. Return ONLY valid JSON.

CRITICAL: You MUST write ALL text fields (summary, key_decisions, next_steps) exclusively in ${langName}. Do not use any other language.

CRITICAL — PROTECTED PRODUCT NAMES: The following component names are proper nouns and MUST appear exactly as listed below in your output. NEVER translate, paraphrase, or modify them in any way. Using any other form (e.g. "Schneeflöckchen" for "Snowflake") is a critical error.
Protected names: ${components.join(', ')}

CRITICAL — LIST SIZE: Generate EXACTLY 3 to 5 key decisions and EXACTLY 3 to 5 next steps. Never generate more than 5 items per list. Be selective and focused.

${audienceInstruction}

Architecture facts (pre-validated, structured data — not user free text):
- Selected components: ${components.join(', ')}
- Recommended roles: ${roles.join(', ')}
- Compliance level: ${compliance ?? 'not specified'}
- AI maturity archetype: ${archetype ?? 'not specified'}
- Canvas use case quadrant: ${canvas_quadrant ?? 'not specified'}
- Governance result: ${governance_result ?? 'not specified'}
- Roadmap phases planned: ${roadmap_phases ?? 0}${scoreLine ? '\n' + scoreLine : ''}

Summary instruction: ${summaryInstruction}
The summary MUST be written in ${langName}. Max 600 chars.

Also generate 3-5 key decisions and 3-5 next steps. Each must have both German (de) and English (en) versions.
Keep each item concise (max 200 chars per language). Be specific to the exact components and context above.

Also suggest up to 3 additional component names (exact catalog names, no descriptions) that are NOT already in the selected list but would strengthen this architecture. Only suggest real, widely-known tools/platforms. If none, omit the field.

Also write a "decision_recommendation": 2-3 sentences in ${langName}. Audience-appropriate: for exec, include a pilot gate (e.g. "Freigabe als Pilot mit 3-Monats-Gate") with a concrete abort criterion; for architect, focus on the key integration risk; for compliance, focus on the most critical regulatory obligation. Max 800 chars. No bullet points — flowing prose only.

Return this exact JSON structure:
{
  "summary": "...",
  "key_decisions": [{"de": "...", "en": "..."}],
  "next_steps": [{"de": "...", "en": "..."}],
  "component_suggestions": ["ComponentName1", "ComponentName2"],
  "decision_recommendation": "..."
}`

  // haiku: Bedrock EU-Profil verifiziert (claude-haiku-4-5). Sonnet-Profil ausstehend (#148).
  const { data: result, meta, errorCode } = await callLLM(prompt, ArchitectureNarrativeSchema, { model: 'haiku', maxTokens: 2048 })

  // Nur bei Erfolg zählen — fehlgeschlagene Calls verbrauchen kein Kontingent
  if (!result) {
    void trackServer(userId, 'ai_call', { provider: meta.provider, model: meta.modelId, module: 'architecture', success: false, cached: false, latency_ms: meta.latencyMs })
    return NextResponse.json({
      error: 'KI-Analyse fehlgeschlagen — deterministische Bausteine bleiben aktiv',
      code: 'AI_FAILED',
      bedrock_error: errorCode ?? 'PARSE_OR_EMPTY',
    }, { status: 503 })
  }

  // Non-EU-Fallback in Produktion → sofortiger Sentry-Alarm
  if (meta.provider === 'direct' && process.env.VERCEL_ENV === 'production') {
    Sentry.captureMessage('AI non-EU fallback used in production', { level: 'error', tags: { 'ai.provider': 'direct', module: 'architecture', model: meta.modelId } })
  }

  const ok = await incrementAIUsage(userId, tier)
  if (!ok) {
    return NextResponse.json({ error: 'Tages-Limit erreicht', code: 'LIMIT_EXCEEDED' }, { status: 429 })
  }

  void trackServer(userId, 'ai_call', { provider: meta.provider, model: meta.modelId, module: 'architecture', success: true, cached: meta.provider === 'cache', latency_ms: meta.latencyMs, audience })

  const aiModel = meta.provider === 'cache'
    ? `${meta.modelId} (cached)`
    : `${meta.modelId} via ${meta.provider === 'bedrock' ? `AWS Bedrock ${meta.region}` : 'Anthropic Direct'}`

  const existingNarrative = (arch.ai_narrative as Record<string, unknown> | null) ?? {}
  const resultWithHash = context_hash ? { ...result, based_on_hash: context_hash } : result
  const mergedNarrative = { ...existingNarrative, [audience]: resultWithHash }

  await supabase
    .from('architectures')
    .update({
      ai_narrative:    mergedNarrative,
      ai_model:        aiModel,
      ai_generated_at: new Date().toISOString(),
      narrative_locale: locale,
    })
    .eq('id', id)
    .eq('user_id', userId)

  const updatedUsage = await getAIUsageStatus(userId, tier)
  return NextResponse.json({ result: resultWithHash, usage: updatedUsage, ai_model: aiModel })
}

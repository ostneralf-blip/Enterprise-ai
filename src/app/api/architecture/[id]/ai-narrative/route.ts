import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasAccess } from '@/lib/utils/tier-check'
import { callLLM } from '@/lib/ai/client'
import { ArchitectureNarrativeSchema } from '@/lib/ai/schemas'
import { getAIUsageStatus, incrementAIUsage } from '@/lib/ai/usage-log'
import type { Tier } from '@/types'
import { z } from 'zod'

const BodySchema = z.object({
  components:     z.array(z.string()).max(30),
  roles:          z.array(z.string()).max(15),
  compliance:     z.string().max(50).optional(),
  archetype:      z.string().max(50).optional(),
  canvas_quadrant: z.string().max(50).optional(),
  governance_result: z.string().max(50).optional(),
  roadmap_phases: z.number().int().min(0).max(10).optional(),
  locale:         z.enum(['de', 'en']).default('de'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()

  const tier = (profile?.tier ?? 'free') as Tier
  if (!hasAccess(tier, 'pro')) {
    return NextResponse.json({ error: 'Pro oder Enterprise erforderlich', code: 'TIER_REQUIRED' }, { status: 403 })
  }

  const body = BodySchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })

  // Ownership prüfen
  const { data: arch } = await supabase
    .from('architectures')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!arch) return NextResponse.json({ error: 'Architektur nicht gefunden' }, { status: 404 })

  const usage = await getAIUsageStatus(user.id)
  if (usage.exceeded) {
    return NextResponse.json({ error: 'Tages-Limit erreicht', code: 'LIMIT_EXCEEDED', usage }, { status: 429 })
  }

  const { components, roles, compliance, archetype, canvas_quadrant, governance_result, roadmap_phases } = body.data

  const prompt = `You are an enterprise AI architecture expert. Based on the following validated architecture facts, generate concise, context-specific key decisions and next steps. Return ONLY valid JSON.

Architecture facts (pre-validated, structured data — not user free text):
- Selected components: ${components.join(', ')}
- Recommended roles: ${roles.join(', ')}
- Compliance level: ${compliance ?? 'not specified'}
- AI maturity archetype: ${archetype ?? 'not specified'}
- Canvas use case quadrant: ${canvas_quadrant ?? 'not specified'}
- Governance result: ${governance_result ?? 'not specified'}
- Roadmap phases planned: ${roadmap_phases ?? 0}

Generate 3-5 key decisions and 3-5 next steps. Each must have both German (de) and English (en) versions.
Keep each item concise (max 200 chars per language). Be specific to the exact components and context above.

Return this exact JSON structure:
{
  "key_decisions": [
    {"de": "...", "en": "..."}
  ],
  "next_steps": [
    {"de": "...", "en": "..."}
  ]
}`

  const ok = await incrementAIUsage(user.id)
  if (!ok) {
    return NextResponse.json({ error: 'Tages-Limit erreicht', code: 'LIMIT_EXCEEDED' }, { status: 429 })
  }

  const result = await callLLM(prompt, ArchitectureNarrativeSchema, { model: 'sonnet', maxTokens: 1024 })

  if (!result) {
    return NextResponse.json({ error: 'KI-Analyse fehlgeschlagen — deterministische Bausteine bleiben aktiv', code: 'AI_FAILED' }, { status: 503 })
  }

  await supabase
    .from('architectures')
    .update({
      ai_narrative:    result,
      ai_model:        'anthropic.claude-sonnet-4-6 via AWS Bedrock eu-central-1',
      ai_generated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  const updatedUsage = await getAIUsageStatus(user.id)
  return NextResponse.json({ result, usage: updatedUsage })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { callLLM } from '@/lib/ai/client'
import { Pass1ClassificationSchema, Pass1TermResultSchema } from '@/lib/ai/schemas'
import { getPass1UsageStatus, incrementPass1Usage } from '@/lib/ai/pass1-usage'
import { applyConsequences } from '@/lib/canvas/pass1'
import { applyPass2 } from '@/lib/canvas/pass2'
import { trackServer } from '@/lib/posthog/server'
import { getTier } from '@/lib/utils/tier-check'
import { FIELD_PRIOR_MAP } from '@/lib/canvas/field-priors'

const InputSchema = z.object({
  candidates: z.array(z.object({
    term:        z.string().max(200),
    field:       z.string().max(50),
    fieldLabel:  z.string().max(100),
    context:     z.string().max(1000),
    entityPrior: z.enum(['product', 'capability', 'none']),
    scoreWeight: z.number(),
  })).max(20).min(1),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = InputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() }, { status: 400 })
  }

  const { candidates } = parsed.data

  // Kandidaten aus Nicht-Harvest-Feldern ablehnen (Server-Guard)
  const harvestCandidates = candidates.filter(c => {
    const prior = FIELD_PRIOR_MAP[c.field]
    return prior && prior.harvest !== false
  })
  if (harvestCandidates.length === 0) {
    return NextResponse.json({ results: [], skipped: true, reason: 'no_harvest_candidates' })
  }

  // Canvas laden + Ownership prüfen
  const { data: canvas } = await supabase
    .from('canvases')
    .select('id, title, data')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!canvas) return NextResponse.json({ error: 'Canvas nicht gefunden' }, { status: 404 })

  // Blocklist laden — bereits geblockte Terme überspringen
  const { data: blocked } = await supabase
    .from('detection_blocklist')
    .select('term')
  const blockSet = new Set((blocked ?? []).map(b => b.term.toLowerCase()))
  const toClassify = harvestCandidates.filter(c => !blockSet.has(c.term.toLowerCase()))
  if (toClassify.length === 0) {
    return NextResponse.json({ results: [], skipped: true, reason: 'all_blocked' })
  }

  const tier = await getTier(user.id)
  const usage = await getPass1UsageStatus(user.id, tier)
  if (usage.exceeded) {
    return NextResponse.json({ error: 'Tages-Limit erreicht', code: 'LIMIT_EXCEEDED', usage }, { status: 429 })
  }

  // Canvas-Volltext für Guard: wörtlich-im-Text
  const canvasText = [canvas.title, ...Object.values(canvas.data as Record<string, string>)]
    .filter(Boolean).join(' ')

  // LLM-Prompt (Haiku, klein, batchbar)
  const termList = toClassify.map(c =>
    `- "${c.term}" (Feld: ${c.fieldLabel}, Kontext: «${c.context.slice(0, 150)}»)`
  ).join('\n')

  const prompt = `Classify each term from an AI project canvas. Canvas fields provide context:
- "Datenquellen": typically product/system names → likely "produkt"
- "AI-Lösung": typically capabilities → likely "capability"
- "Technische Architektur": typically products/frameworks
- "Titel": often a project name → often "projekt_eigenname"

Classifications: "produkt" (known software/vendor), "projekt_eigenname" (internal project/codename), "capability" (AI process/feature), "fuellwort" (filler verb/phrase with no entity character), "mehrdeutig" (ambiguous)

For "produkt" classify the canonical vendor (SAP, Microsoft, AWS, Google, IBM, Oracle, Salesforce, Snowflake, Databricks, Siemens).

Terms to classify:
${termList}

Return ONLY a JSON array: [{"term":"...","class":"produkt|projekt_eigenname|capability|fuellwort|mehrdeutig","vendor":"SAP|null","confidence":0.9}]`

  const { data: llmResult, meta } = await callLLM(prompt, Pass1ClassificationSchema, { model: 'haiku', maxTokens: 512 })

  if (!llmResult) {
    void trackServer(user.id, 'pass1_call', { module: 'canvas', success: false, candidates: toClassify.length })
    return NextResponse.json({ error: 'Klassifikation fehlgeschlagen', code: 'AI_FAILED' }, { status: 503 })
  }

  // Validate each result against strict schema (extra defense)
  const validResults = llmResult.filter(r => Pass1TermResultSchema.safeParse(r).success)

  // Pass 1 Consequences: Blocklist (fuellwort); Synonyme → Pass 2
  const stats = await applyConsequences(validResults, canvasText, supabase)
  // Pass 2: zone-aware Synonym-Persistenz (client-scoped, auto-aktiv bei hoher Konfidenz)
  const pass2Stats = await applyPass2(validResults, user.id, canvasText, supabase)

  const ok = await incrementPass1Usage(user.id, tier)
  if (!ok) {
    return NextResponse.json({ error: 'Tages-Limit erreicht', code: 'LIMIT_EXCEEDED' }, { status: 429 })
  }

  void trackServer(user.id, 'pass1_call', {
    module: 'canvas', success: true, cached: meta.provider === 'cache',
    candidates: toClassify.length,
    blocklist_pending: stats.blocklistPending, discarded: stats.discarded,
    pass2_auto_active: pass2Stats.autoActive, pass2_pending: pass2Stats.pendingClient,
    pass2_evidence_updated: pass2Stats.evidenceUpdated,
  })

  return NextResponse.json({ results: validResults, stats, usage: await getPass1UsageStatus(user.id, tier) })
}

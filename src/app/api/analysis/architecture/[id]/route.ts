import { NextRequest, NextResponse, after } from 'next/server'
import { requireFeature } from '@/lib/utils/tier-check'
import { callLLM } from '@/lib/ai/client'
import { SectionEnum, NarrativeSectionSchema, RasicSuggestionSectionSchema, ComplianceHintsSectionSchema, DecisionSectionSchema } from '@/lib/ai/schemas'
import type { AnalysisSection } from '@/lib/ai/schemas'
import { getAIUsageStatus, incrementAIUsage } from '@/lib/ai/usage-log'
import { trackServer } from '@/lib/posthog/server'
import { buildSharedContext, buildSectionBlocks } from '@/lib/ai/analysis'
import { SECTION_TO_AUDIENCE } from '@/lib/ai/section-audience'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { resolveToKnownName, stripExplanationSuffix } from '@/lib/architecture/selection'
import { enrichCatalogSuggestion } from '@/lib/ai/catalog-enrichment'
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

  // Jede Sektion einzeln UND parallel generieren statt eines kombinierten
  // Prompts: eine einzelne Sektion braucht bei Haiku zuverlässig <8s, drei
  // davon SEQUENZIELL in einem Call zu erzeugen skaliert die Generierungs-
  // zeit fast linear mit — selbst ein auf 16s erhöhtes Timeout reichte für
  // drei Sektionen nicht mehr zuverlässig. Parallel bleibt die Wall-Clock-
  // Zeit nah an der einer einzelnen Sektion, das Timeout-Budget pro Call
  // kann beim Default bleiben, und der eine DB-Write am Ende bleibt erhalten
  // (löst weiterhin die Persistenz-Race, wegen der wir überhaupt umgestellt
  // haben — siehe Commit "KI-Analyse auf Unified-Endpoint umgestellt").
  const callResults = await Promise.all(sections.map(async section => {
    // Der Prompt (SECTION_TASK_BLOCKS) weist das Modell an, unter dem
    // Sektionsnamen zu wrappen (z. B. {"narrative_architect": {...}}) — auch
    // bei nur einer angeforderten Sektion, weil dasselbe Prompt-Template für
    // Einzel- und Mehr-Sektionen-Aufrufe gilt. Deshalb hier gegen den
    // Wrapper validieren und danach entpacken, statt direkt gegen das innere
    // Schema zu prüfen (das lieferte "key_decisions/next_steps: undefined",
    // weil sie tatsächlich eine Ebene tiefer liegen).
    const wrapperSchema = z.object({ [section]: SECTION_SCHEMAS[section] as z.ZodType<unknown> })
    const { data: wrapped, meta, errorCode } = await callLLM(
      buildSectionBlocks([section]),
      wrapperSchema,
      { model: 'haiku', maxTokens: 2048, timeoutMs: 10000, module: 'architecture', cacheControlPrefix: sharedContext },
    )
    const data = wrapped ? (wrapped as Record<string, unknown>)[section] : null
    return { section, data, meta, errorCode }
  }))

  const sectionResults: Record<string, unknown> = {}
  const sectionErrors: Record<string, string> = {}
  let representativeMeta = callResults[0].meta
  let usedDirectFallback = false

  for (const { section, data, meta, errorCode } of callResults) {
    if (meta.provider === 'direct') usedDirectFallback = true
    if (data) {
      sectionResults[section] = data
      representativeMeta = meta
    } else {
      const code = errorCode ?? 'PARSE_OR_EMPTY'
      sectionErrors[section] = code
      console.error('[analysis] Sektion fehlgeschlagen', section, code)
      Sentry.captureMessage('AI Analysis: Sektion fehlgeschlagen', {
        level: 'warning',
        tags: { section, module: 'analysis', model: meta.modelId, error_code: code },
      })
      void trackServer(userId, 'ai_section_failed', { section, error_code: code, module: 'analysis' })
    }
  }

  // KI-Vorschläge ohne Katalog-Treffer protokollieren statt lautlos zu verwerfen
  // (Rücksprache Daniel, 18.07.2026): resolveToKnownName() fängt "Name + Begründung"
  // bereits ab (siehe selection.ts) — was danach noch übrig bleibt, ist entweder ein
  // Tippfehler/Fantasiename der KI oder eine echte Katalog-Lücke. Beides landet als
  // "pending" in catalog_suggestions für Admin-Review, statt dass der Vorschlag
  // ersatzlos verschwindet ("No further suggestions").
  const suggestionsBySection = (['narrative_exec', 'narrative_architect'] as const)
    .flatMap(section => {
      const names = (sectionResults[section] as { component_suggestions?: string[] } | undefined)?.component_suggestions ?? []
      return names.map(name => ({ section, name }))
    })
  if (suggestionsBySection.length > 0) {
    // Lessons Learned (19.07.2026): "kompletten Katalog laden, um ein paar
    // Namen zu prüfen" ist die eigentliche Bug-Klasse, nicht nur eine fehlende
    // Pagination-Notlösung — bei >1450 aktiven Einträgen kollidierte das
    // wiederholt mit PostgREST's hartem api.max_rows=1000 (supabase/config.toml),
    // wodurch tatsächlich vorhandene Einträge (u. a. "Databricks", exakter
    // Namenstreffer!) fälschlich als "unbekannt" galten. Statt zu paginieren,
    // gezielt NUR nach den ~5-15 vorgeschlagenen Namen fragen — die
    // Ergebnismenge bleibt dadurch unabhängig von der Katalog-Größe klein,
    // und der Cut greift nie wieder, egal wie groß der Katalog wird.
    // name_key (UNIQUE-Index) und aliases (GIN-Index) tragen bereits.
    const rawNames = suggestionsBySection.map(s => s.name)
    const candidateNames = [...new Set(rawNames.flatMap(n => {
      const cleaned = stripExplanationSuffix(n)
      return cleaned ? [n, cleaned] : [n]
    }))]
    const candidateKeys = candidateNames.map(n => n.toLowerCase().trim())

    const [byNameKey, byAlias] = await Promise.all([
      supabase.from('component_catalog').select('name, aliases').eq('is_active', true).in('name_key', candidateKeys),
      supabase.from('component_catalog').select('name, aliases').eq('is_active', true).overlaps('aliases', candidateNames),
    ])
    const known = new Set<string>()
    const aliasMap = new Map<string, string>()
    for (const row of [...(byNameKey.data ?? []), ...(byAlias.data ?? [])]) {
      known.add(row.name)
      // Bug-Report Daniel (18.07.2026): "Zum Katalog hinzufügen" legt
      // Komponenten unter ihrem angereicherten Namen an (z. B. "Databricks
      // Data Intelligence Platform"), während die KI oft wieder den kurzen
      // Namen ("Databricks") nennt — aliases wird beim Anlegen entsprechend
      // befüllt und hier für den Abgleich mit einbezogen.
      for (const alias of row.aliases ?? []) aliasMap.set(alias.toLowerCase().trim(), row.name)
    }
    const unmatched = suggestionsBySection.filter(({ name }) => resolveToKnownName(name, known, aliasMap) === null)
    if (unmatched.length > 0) {
      // Bug-Report 18.07.2026: ein unawaiteter ".then()"-Block ohne Bindung an die
      // Response wird von der Serverless-Function eingefroren/beendet, sobald die
      // Antwort rausgeht — die Produktanreicherung (bis zu 15s Bedrock-Call) blieb
      // dadurch dauerhaft bei enrichment_status "pending" hängen, ohne je Fehler
      // oder Ergebnis zu zeigen. after() hält die Function-Instanz bis zum Abschluss
      // dieses Callbacks am Leben, ohne die eigentliche Response zu verzögern.
      after(async () => {
        try {
          const admin = await createAdminClient()
          // Anreicherung nur auslösen, wenn sie für diesen Vorschlag noch nie
          // erfolgreich lief oder noch gar nicht versucht wurde — Kriterium ist
          // enrichment_status, nicht "ist der Name neu": ein Vorschlag kann schon
          // als "pending" geloggt sein (occurrence_count > 1), aber wegen eines
          // früheren Abbruchs (z. B. dem after()-Bug oben) nie erfolgreich
          // angereichert worden sein — der soll bei der nächsten Gelegenheit
          // trotzdem einen neuen Versuch bekommen, nicht dauerhaft übersprungen werden.
          const { data: pendingRows } = await admin.from('catalog_suggestions').select('suggested_name, enrichment_status').eq('status', 'pending')
          const pendingStatus = new Map((pendingRows ?? []).map(r => [r.suggested_name.toLowerCase().trim(), r.enrichment_status]))
          const seenThisBatch = new Set<string>()
          const suggestionContext = {
            architecture_id: id, locale, archetype: archetype ?? null,
            compliance: compliance ?? null, canvas_quadrant: canvas_quadrant ?? null,
          }

          await Promise.all(unmatched.map(async ({ section, name }) => {
            const key = name.toLowerCase().trim()
            const existingStatus = pendingStatus.get(key)
            const needsEnrichment = (existingStatus === undefined || existingStatus === 'none') && !seenThisBatch.has(key)
            if (needsEnrichment) seenThisBatch.add(key)

            await admin.rpc('log_catalog_suggestion', {
              p_name: name, p_module: 'architecture', p_section: section,
              p_context: suggestionContext,
            })

            if (needsEnrichment) {
              const { data: row } = await admin
                .from('catalog_suggestions')
                .select('id')
                .eq('status', 'pending')
                .eq('suggested_name', name)
                .maybeSingle()
              if (row?.id) {
                // Bewusst awaited statt fire-and-forget — siehe Kommentar oben,
                // sonst schließt after() das Zeitfenster, bevor Bedrock antwortet.
                await enrichCatalogSuggestion({
                  suggestionId: row.id, name, module: 'architecture', section,
                  context: suggestionContext,
                })
              }
            }
          }))
        } catch { /* Logging/Anreicherung ist best-effort, darf die Analyse nicht blockieren */ }
      })
    }
  }

  if (Object.keys(sectionResults).length === 0) {
    void trackServer(userId, 'ai_call', { provider: representativeMeta.provider, model: representativeMeta.modelId, module: 'analysis', success: false, sections: sections.join(','), cached: false })
    return NextResponse.json({ error: 'KI-Analyse fehlgeschlagen', code: 'AI_FAILED', bedrock_error: Object.values(sectionErrors)[0] ?? 'PARSE_OR_EMPTY' }, { status: 503 })
  }

  if (usedDirectFallback && process.env.VERCEL_ENV === 'production') {
    Sentry.captureMessage('AI non-EU fallback used in production', { level: 'error', tags: { 'ai.provider': 'direct', module: 'analysis' } })
  }

  // Nur bei vollständigem Erfolg das Tageskontingent belasten — ein Nutzer soll
  // keine Analyse "verbrauchen", wenn ein Teil davon an einem technischen
  // Problem (Timeout, Zod-Parse) gescheitert ist. Erfolgreiche Teilergebnisse
  // werden trotzdem gespeichert und zurückgegeben, nur eben kostenlos.
  const hasErrors = Object.keys(sectionErrors).length > 0
  if (!hasErrors) {
    const ok = await incrementAIUsage(userId, tier)
    if (!ok) return NextResponse.json({ error: 'Tages-Limit erreicht', code: 'LIMIT_EXCEEDED' }, { status: 429 })
  }

  const promptCachedTokens = callResults.reduce((sum, r) => sum + (r.meta.promptCachedTokens ?? 0), 0)
  void trackServer(userId, 'ai_call', {
    provider: representativeMeta.provider, model: representativeMeta.modelId, module: 'analysis',
    success: true, cached: callResults.every(r => r.meta.provider === 'cache'),
    sections: sections.join(','), prompt_cached_tokens: promptCachedTokens,
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

  const aiModel = representativeMeta.provider === 'cache'
    ? `${representativeMeta.modelId} (cached)`
    : `${representativeMeta.modelId} via ${representativeMeta.provider === 'bedrock' ? `AWS Bedrock ${representativeMeta.region}` : 'Anthropic Direct'}`

  // narrative_locale wurde hier nie geschrieben (Migration 20260713155101 legte
  // die Spalte an, aber kein Code-Pfad befüllte sie) — dadurch blieb sie für
  // JEDE je generierte KI-Einordnung NULL. Der Client-Staleness-Hinweis
  // (narrativeLocale !== locale in ArchitecturePageClient) griff dadurch nie,
  // und der MERIDIAN-Architektur-Report (#225) verwarf aiSummary/
  // decisionRecommendation/investmentFramework fälschlich als sprachlichen
  // Mismatch, obwohl echte, korrekte Daten vorhanden waren. Gefunden am
  // 19.07.2026 via `supabase db dump` gegen einen real exportierten Report.
  await supabase
    .from('architectures')
    .update({ ai_narrative: updatedNarrative, ai_model: aiModel, ai_generated_at: new Date().toISOString(), narrative_locale: locale })
    .eq('id', id)
    .eq('user_id', userId)

  return NextResponse.json({
    sections: sectionResults,
    errors:   Object.keys(sectionErrors).length > 0 ? sectionErrors : undefined,
    usage:    await getAIUsageStatus(userId, tier),
    ai_model: aiModel,
    prompt_cached_tokens: promptCachedTokens,
  })
}

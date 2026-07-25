import 'server-only'
import { getTranslations } from 'next-intl/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { normalizeArchitectureResult, resolveLocaleField } from '@/lib/pdf/normalize-architecture'
import type { RawArchitectureResult } from '@/lib/pdf/normalize-architecture'
import { togafComps, dataFlowComps } from '@/lib/architecture/diagram-grouping'
import { catalogEdges } from '@/lib/architecture/catalog-edges'
import type { CompEdge, CompConflict } from '@/lib/architecture/catalog-edges'
import type { CatalogComponent } from '@/types'
import type { Locale } from '@/i18n/routing'

// Lädt die kuratierten Katalog-Relationen (requires/suggests/incompatible_with) für
// die aktiven Bausteine und leitet daraus die gerichteten Kanten + Konflikte ab (#257
// Stufe 2). Gezielter .in()-Lookup statt Volltabelle (component_catalog > 1000 Zeilen,
// PostgREST-max_rows — siehe CLAUDE.md). Nur Kanten zwischen aktiven Bausteinen.
async function loadCatalogEdges(names: string[]): Promise<{ edges: CompEdge[]; conflicts: CompConflict[] }> {
  if (names.length === 0) return { edges: [], conflicts: [] }
  const admin = await createAdminClient()
  const { data } = await admin
    .from('component_catalog')
    .select('name, requires, suggests, incompatible_with')
    .in('name', names)
  const rows = (data ?? []) as { name: string; requires: string[] | null; suggests: string[] | null; incompatible_with: string[] | null }[]
  const active = rows.map(r => ({
    name: r.name,
    requires: r.requires ?? [],
    suggests: r.suggests ?? [],
    incompatible_with: r.incompatible_with ?? [],
  }))
  return catalogEdges(active as unknown as CatalogComponent[])
}

// Layer im gewählten Diagramm-Stil (togaf/datenfluss) neu gruppieren — reuse der
// reinen Grouping-Logik. Bausteine ohne Katalog-Treffer landen unter „Sonstige".
async function regroupLayers(
  patternLayers: { name: string; components: string[] }[],
  art: string,
  locale: Locale,
): Promise<{ name: string; components: string[] }[] | null> {
  if (art !== 'togaf' && art !== 'datenfluss') return null
  const names = [...new Set(patternLayers.flatMap(l => l.components))]
  if (names.length === 0) return null

  const admin = await createAdminClient()
  const { data } = await admin.from('component_catalog').select('name, architecture_layer').in('name', names)
  const layerByName = new Map<string, string | null>()
  for (const n of names) layerByName.set(n, null)
  for (const row of (data ?? []) as { name: string; architecture_layer: string | null }[]) layerByName.set(row.name, row.architecture_layer)
  const comps = names.map(n => ({ name: n, architecture_layer: layerByName.get(n) ?? null }))

  const [td, tm] = await Promise.all([
    getTranslations({ locale, namespace: 'diagram' }),
    getTranslations({ locale, namespace: 'modules.architecture' }),
  ])

  const known = new Set<string>()
  const out: { name: string; components: string[] }[] = []
  const push = (label: string, list: { name: string }[]) => {
    list.forEach(c => known.add(c.name))
    if (list.length > 0) out.push({ name: label, components: list.map(c => c.name) })
  }

  if (art === 'togaf') {
    const g = togafComps(comps)
    push(tm('togafData'), g.data)
    push(tm('togafApplication'), g.application)
    push(tm('togafTechnology'), g.technology)
    push(tm('eamCross'), g.cross)
  } else {
    const g = dataFlowComps(comps)
    push(td('flowSources'), g.sources)
    push(td('flowPlatform'), g.platform)
    push(td('flowModels'), g.models)
    push(td('flowConsumption'), g.consumption)
    push(td('flowCross'), g.cross)
  }
  const other = comps.filter(c => !known.has(c.name))
  if (other.length > 0) out.push({ name: td('bandOther'), components: other.map(c => c.name) })
  return out
}

type MaybeLocale = string | { de: string; en: string }
interface InvestmentFramework {
  year1_estimate: string
  year1_caption?: string
  ongoing_estimate: string
  timeframe_estimate: string
  risk_label: string
  risk_note: string
}
interface NarrativeSection {
  summary?: string
  key_decisions: MaybeLocale[]
  next_steps: MaybeLocale[]
  decision_recommendation?: string
  investment_framework?: InvestmentFramework
}

export interface ArchitectureLayerStack {
  name: string
  components: string[]
}

export interface ArchitectureStatusData {
  companyName: string | null
  generatedAt: string
  title: string
  pattern: string
  aiSummary: string | null // nur gesetzt, wenn narrative_locale zur angeforderten Sprache passt
  decisionRecommendation: string | null // dito
  investmentFramework: InvestmentFramework | null // dito — echte KI-Schätzung, siehe lib/ai/schemas.ts
  keyDecisions: string[]
  nextSteps: string[]
  layers: ArchitectureLayerStack[]
  dependencies: CompEdge[] // gerichtete requires/suggests-Kanten aus dem Katalog (#257 Stufe 2)
  conflicts: CompConflict[] // ungerichtete incompatible_with-Konflikte
}

/**
 * Lädt die Daten für den MERIDIAN Architektur-Report (Musterseite 6,
 * Issue #225). Gibt `null` zurück, wenn keine gespeicherte Architektur
 * existiert.
 *
 * KI-Einordnung (aiSummary), Empfehlung (decisionRecommendation) und
 * Investitionsrahmen (investmentFramework) kommen aus
 * architectures.ai_narrative.exec.{summary,decision_recommendation,
 * investment_framework} (Speicher-Key laut lib/ai/section-audience.ts —
 * NICHT "narrative_exec", das ist nur der interne Analyse-Sektionsname).
 * investment_framework ist eine vom Modell explizit als grobe Schätzung
 * gekennzeichnete Größenordnung (siehe Prompt in lib/ai/analysis.ts), keine
 * belastbare Kalkulation — im Report entsprechend beschriftet. Alle drei
 * Felder sind reine Strings, keine {de,en}-Form — architectures.narrative_locale
 * trackt die Sprache; bei Mismatch zur angeforderten Report-Sprache werden sie
 * bewusst weggelassen statt falschsprachigen Text zu zeigen. key_decisions/
 * next_steps SIND bilingual und werden unabhängig vom Locale-Mismatch immer
 * aufgelöst — mit Fallback auf das (immer vorhandene) Basis-Ergebnis
 * result.keyDecisions/nextSteps, falls noch keine KI-Einordnung generiert wurde.
 */
export async function getArchitectureStatusData(userId: string, locale: Locale): Promise<ArchitectureStatusData | null> {
  const supabase = await createClient()

  const [profileRes, archRes, prefRes] = await Promise.all([
    supabase.from('profiles').select('company').eq('id', userId).single() as unknown as Promise<{
      data: { company: string | null } | null
    }>,
    supabase
      .from('architectures')
      .select('title, result, ai_narrative, narrative_locale')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{
      data: {
        title: string
        result: unknown
        ai_narrative: Record<string, NarrativeSection> | null
        narrative_locale: 'de' | 'en' | null
      } | null
    }>,
    supabase.from('user_preferences').select('diagram_style').eq('user_id', userId).maybeSingle() as unknown as Promise<{
      data: { diagram_style: { art?: string } | null } | null
    }>,
  ])

  const arch = archRes.data
  if (!arch) return null

  const rawResult = arch.result as RawArchitectureResult & { keyDecisions?: MaybeLocale[] }
  // normalizeArchitectureResult löst nextSteps bereits selbst zu string[] auf
  // (siehe Kommentar dort) — für pattern/layers verwendet, keyDecisions kommt
  // separat aus dem RAW-Ergebnis, da normalize dieses Feld nicht anfasst.
  const normalized = normalizeArchitectureResult(rawResult, locale)

  const exec = arch.ai_narrative?.exec ?? null
  const narrativeMatchesLocale = arch.narrative_locale === locale
  const aiSummary = exec?.summary && narrativeMatchesLocale ? exec.summary : null
  const decisionRecommendation = exec?.decision_recommendation && narrativeMatchesLocale ? exec.decision_recommendation : null
  const investmentFramework = exec?.investment_framework && narrativeMatchesLocale ? exec.investment_framework : null

  const resolveList = (items: MaybeLocale[] | undefined) =>
    (items ?? []).map(item => resolveLocaleField(item, locale)).filter((s): s is string => !!s)

  const keyDecisions = exec?.key_decisions?.length
    ? resolveList(exec.key_decisions)
    : resolveList(rawResult.keyDecisions)

  const nextSteps = exec?.next_steps?.length
    ? resolveList(exec.next_steps)
    : normalized.nextSteps

  const patternLayers = normalized.layers
    .filter(l => l.components.length > 0)
    .map(l => ({ name: l.name, components: l.components }))

  // Diagramm-Stil des Nutzers (togaf/datenfluss) → Layer entsprechend gruppieren (#257).
  const art = prefRes.data?.diagram_style?.art ?? 'schichten'
  const allNames = [...new Set(patternLayers.flatMap(l => l.components))]
  const [styledLayers, catEdges] = await Promise.all([
    regroupLayers(patternLayers, art, locale),
    loadCatalogEdges(allNames),
  ])

  return {
    companyName: profileRes.data?.company ?? null,
    generatedAt: new Date().toISOString(),
    title: arch.title,
    pattern: normalized.pattern,
    aiSummary,
    decisionRecommendation,
    investmentFramework,
    keyDecisions,
    nextSteps,
    layers: styledLayers ?? patternLayers,
    dependencies: catEdges.edges,
    conflicts: catEdges.conflicts,
  }
}

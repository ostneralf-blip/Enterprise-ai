import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { normalizeArchitectureResult, resolveLocaleField } from '@/lib/pdf/normalize-architecture'
import type { RawArchitectureResult } from '@/lib/pdf/normalize-architecture'
import type { Locale } from '@/i18n/routing'

type MaybeLocale = string | { de: string; en: string }
interface NarrativeSection {
  summary?: string
  key_decisions: MaybeLocale[]
  next_steps: MaybeLocale[]
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
  keyDecisions: string[]
  nextSteps: string[]
  layers: ArchitectureLayerStack[]
}

/**
 * Lädt die Daten für den MERIDIAN Architektur-Report (Musterseite 6,
 * Issue #225). Gibt `null` zurück, wenn keine gespeicherte Architektur
 * existiert.
 *
 * Die Musterseite zeigt vier erfundene Kennzahl-Karten (Investition J1,
 * Laufend, Umsetzung, Risikoprofil) — dafür gibt es keine Datenquelle im
 * Architektur-Generator (weder AI-Narrativ noch Grundergebnis enthalten
 * Kosten-/Zeitschätzungen). Bewusst weggelassen statt erfunden.
 *
 * KI-Einordnung (aiSummary) kommt aus architectures.ai_narrative.exec.summary
 * (Speicher-Key laut lib/ai/section-audience.ts — NICHT "narrative_exec",
 * das ist nur der interne Analyse-Sektionsname). Nur String, keine {de,en}-
 * Form — architectures.narrative_locale trackt die Sprache; bei Mismatch zur
 * angeforderten Report-Sprache wird aiSummary bewusst weggelassen statt
 * falschsprachigen Text zu zeigen. key_decisions/next_steps SIND bilingual
 * und werden unabhängig vom Locale-Mismatch immer aufgelöst — mit Fallback
 * auf das (immer vorhandene) Basis-Ergebnis result.keyDecisions/nextSteps,
 * falls noch keine KI-Einordnung generiert wurde.
 */
export async function getArchitectureStatusData(userId: string, locale: Locale): Promise<ArchitectureStatusData | null> {
  const supabase = await createClient()

  const [profileRes, archRes] = await Promise.all([
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
  ])

  const arch = archRes.data
  if (!arch) return null

  const rawResult = arch.result as RawArchitectureResult & { keyDecisions?: MaybeLocale[] }
  // normalizeArchitectureResult löst nextSteps bereits selbst zu string[] auf
  // (siehe Kommentar dort) — für pattern/layers verwendet, keyDecisions kommt
  // separat aus dem RAW-Ergebnis, da normalize dieses Feld nicht anfasst.
  const normalized = normalizeArchitectureResult(rawResult, locale)

  const exec = arch.ai_narrative?.exec ?? null
  const aiSummary = exec?.summary && arch.narrative_locale === locale ? exec.summary : null

  const resolveList = (items: MaybeLocale[] | undefined) =>
    (items ?? []).map(item => resolveLocaleField(item, locale)).filter((s): s is string => !!s)

  const keyDecisions = exec?.key_decisions?.length
    ? resolveList(exec.key_decisions)
    : resolveList(rawResult.keyDecisions)

  const nextSteps = exec?.next_steps?.length
    ? resolveList(exec.next_steps)
    : normalized.nextSteps

  return {
    companyName: profileRes.data?.company ?? null,
    generatedAt: new Date().toISOString(),
    title: arch.title,
    pattern: normalized.pattern,
    aiSummary,
    keyDecisions,
    nextSteps,
    layers: normalized.layers
      .filter(l => l.components.length > 0)
      .map(l => ({ name: l.name, components: l.components })),
  }
}

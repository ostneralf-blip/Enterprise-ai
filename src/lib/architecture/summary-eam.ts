import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CatalogComponent } from '@/types'
import type { ArchitectureResult, WizardAnswers } from '@/config/architecture-data'
import { getSelectionStats } from '@/lib/architecture/selection'
import { runEamValidation, type EamValidationResult } from '@/config/architecture-rules'

// Rekonstruiert für die Executive Summary die Daten, die die EAM-Landkarte
// (EamMap) und der KI-Entscheidungs-/Risiko-Block brauchen — server-seitig aus
// der zuletzt gespeicherten Architektur. Reine Wiederverwendung der bestehenden
// Selektor-/Validierungs-Logik der Workbench (getSelectionStats + runEamValidation),
// damit Landkarte und Workbench identische Zahlen zeigen.

interface NarrativeExec { decision_recommendation?: string }

export interface SummaryEamData {
  result: ArchitectureResult
  activeComponents: CatalogComponent[]
  roleNames: string[]
  eamResults: EamValidationResult[]
  componentSources: Record<string, 'rule' | 'ai' | 'manual'>
  compliance?: string
  activeCount: number
  ruleComps: number
  addComps: number
  openViolations: number
  decisionRecommendation: string | null
}

export async function loadSummaryEamData(
  supabase: SupabaseClient,
  admin: SupabaseClient,
  userId: string,
  locale: string,
): Promise<SummaryEamData | null> {
  const { data: arch } = await supabase
    .from('architectures')
    .select('result, wizard_data, ai_narrative, narrative_locale')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!arch) return null

  const result = (arch.result ?? {}) as ArchitectureResult & { selectedComponents?: string[] }
  const wizard = (arch.wizard_data ?? {}) as WizardAnswers

  // Komponenten-Namen: gespeicherte Auswahl, sonst Fallback aus den Muster-Layern.
  const layerNames = (result.layers ?? []).flatMap(l => l.components)
  const allNames = [...new Set([...(result.selectedComponents ?? []), ...layerNames])]
  if (allNames.length === 0) return null

  // Katalog-Objekte GEZIELT laden (.in — wachstumssicher, siehe CLAUDE.md-Lektion
  // zum PostGREST-max_rows-Limit). Nur die tatsächlich relevanten ~5–30 Zeilen.
  const { data: catRows } = await admin
    .from('component_catalog')
    .select('*')
    .in('name', allNames)
  const components = (catRows ?? []) as CatalogComponent[]
  if (components.length === 0) return null

  const selStats = getSelectionStats({
    activeComponentNames: new Set(result.selectedComponents ?? []),
    fallbackNames: layerNames,
    components,
  })

  const roleNames = result.rasic?.entries.map(e => e.role) ?? []
  const compliance = wizard.compliance
  const eamResults = runEamValidation(result.rasic, selStats.activeComponents, compliance, selStats.activeCount)

  const componentSources = result.componentSources ?? {}
  const ruleComps = selStats.activeComponents.filter(
    c => !componentSources[c.name] || componentSources[c.name] === 'rule',
  ).length
  const addComps = selStats.activeCount - ruleComps
  const openViolations = eamResults.filter(r => !r.passed).length

  // KI-Empfehlung nur zeigen, wenn die Sprache passt (oder Alt-Datensatz ohne
  // gesetzte narrative_locale — dann wie in der Workbench trotzdem anzeigen).
  const narrativeLocale = arch.narrative_locale as string | null
  const exec = (arch.ai_narrative as { exec?: NarrativeExec } | null)?.exec ?? null
  const decisionRecommendation =
    exec?.decision_recommendation && (!narrativeLocale || narrativeLocale === locale)
      ? exec.decision_recommendation
      : null

  return {
    result,
    activeComponents: selStats.activeComponents,
    roleNames,
    eamResults,
    componentSources,
    compliance,
    activeCount: selStats.activeCount,
    ruleComps,
    addComps,
    openViolations,
    decisionRecommendation,
  }
}

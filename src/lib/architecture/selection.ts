import type { CatalogComponent } from '@/types'
import { findConflicts, type Conflict } from '@/lib/utils/catalog-compatibility'

/**
 * Gate D — „Eine Zahl, eine Quelle" (#182):
 * getSelectionStats ist die EINZIGE Stelle, an der aktive Komponenten,
 * offene KI-Vorschläge und Konflikte gezählt werden. Validierung,
 * Workbench-Header, KI-Panel und Landkarte konsumieren ausschließlich
 * diesen Selektor — niemals selbst zählen.
 */

export interface SelectionInput {
  /** Vom Nutzer gepflegte Auswahl (leer ⇒ Fallback greift) */
  activeComponentNames: Set<string>
  /** Empfehlungs-Fallback, i. d. R. catalogRecs.layers.flatMap(lr => lr.componentNames) */
  fallbackNames?: Iterable<string>
  /** Komponenten-Katalog (recComponents) */
  components: CatalogComponent[]
  /** KI-Vorschläge aus dem Narrativ (narrative.component_suggestions) */
  aiSuggestions?: string[]
  rejectedSuggestions?: string[]
  acceptedSuggestions?: string[]
}

export interface SelectionStats {
  /** Wirksame Auswahl: Nutzer-Auswahl oder Empfehlungs-Fallback */
  effectiveNames: Set<string>
  /** DIE Zahl für „{n} Komponenten aktiv" — überall identisch */
  activeCount: number
  /** Katalog-Objekte der wirksamen Auswahl (für Regeln, EamMap, PDF) */
  activeComponents: CatalogComponent[]
  /** Im Panel sichtbare Vorschläge (offen + übernommen, ohne abgelehnte/aktive) */
  visibleSuggestions: string[]
  /** DIE Zahl für „{m} KI-Vorschläge offen" — überall identisch */
  openSuggestions: string[]
  openSuggestionCount: number
  /** DIE Zahl für „{k} Konflikte" */
  conflicts: Conflict[]
  conflictCount: number
}

const norm = (n: string) => n.toLowerCase().trim()

export function getSelectionStats(input: SelectionInput): SelectionStats {
  const fallback = new Set(input.fallbackNames ?? [])
  const effectiveNames =
    input.activeComponentNames.size > 0 ? input.activeComponentNames : fallback

  const activeNormalized = new Set([...effectiveNames].map(norm))
  const known = new Set(input.components.map(c => c.name))
  const rejected = new Set(input.rejectedSuggestions ?? [])
  const accepted = new Set(input.acceptedSuggestions ?? [])

  // Semantik identisch zum bisherigen KI-Panel (#181-Dedupe inklusive):
  // nur bekannte, nicht abgelehnte, nicht bereits aktive Komponenten.
  const visibleSuggestions = (input.aiSuggestions ?? []).filter(
    n => known.has(n) && !rejected.has(n) && !activeNormalized.has(norm(n))
  )
  const openSuggestions = visibleSuggestions.filter(n => !accepted.has(n))

  const byName: Record<string, CatalogComponent> = Object.fromEntries(
    input.components.map(c => [c.name, c])
  )
  const conflicts = findConflicts(effectiveNames, byName)

  return {
    effectiveNames,
    activeCount: effectiveNames.size,
    activeComponents: input.components.filter(c => effectiveNames.has(c.name)),
    visibleSuggestions,
    openSuggestions,
    openSuggestionCount: openSuggestions.length,
    conflicts,
    conflictCount: conflicts.length,
  }
}

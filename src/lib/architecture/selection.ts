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

// Trotz Prompt-Vorgabe ("nur der bloße Name") hängt das Modell gelegentlich eine
// Begründung an (z. B. "SAP Analytics Cloud — for business dashboards"). Ein reiner
// Exact-Match verwirft solche Vorschläge dann komplett lautlos ("No further
// suggestions", obwohl die KI etwas Sinnvolles vorgeschlagen hat). Vor dem exakten
// Katalog-Abgleich zusätzlich den Teil vor gängigen Erklärungs-Trennern probieren.
const EXPLANATION_SEPARATORS = [' — ', ' – ', ' - ', ' (']

// Case-/Whitespace-unempfindlicher Katalog-Abgleich als Fallback (Bug-Report
// Daniel, 18.07.2026): ein bereits im Katalog vorhandener Name mit
// abweichender Groß-/Kleinschreibung oder Leerraum wurde bisher als
// "unmatched" gewertet — die Komponente landete dadurch wiederholt (mit
// wachsendem occurrence_count) als neuer Admin-Vorschlag, obwohl sie längst
// im Katalog existierte.
function findByNormalizedName(target: string, known: Set<string>): string | null {
  const targetNorm = norm(target)
  for (const k of known) {
    if (norm(k) === targetNorm) return k
  }
  return null
}

// aliasMap: normalisierter Alias → kanonischer Katalog-Name (Bug-Report
// Daniel, 18.07.2026): "Zum Katalog hinzufügen" legt Komponenten unter ihrem
// ANGEREICHERTEN Namen an (z. B. "Databricks Data Intelligence Platform"),
// während die KI im nächsten Wizard-Lauf oft wieder den kurzen Namen
// ("Databricks") vorschlägt — ohne Alias-Abgleich galt das dann erneut als
// "unbekannt" und die Komponente tauchte immer wieder als neuer Vorschlag
// auf, obwohl sie längst im Katalog war.
export function resolveToKnownName(raw: string, known: Set<string>, aliasMap?: Map<string, string>): string | null {
  if (known.has(raw)) return raw
  const normalizedMatch = findByNormalizedName(raw, known)
  if (normalizedMatch) return normalizedMatch
  const aliasHit = aliasMap?.get(norm(raw))
  if (aliasHit) return aliasHit

  let cleaned = raw
  for (const sep of EXPLANATION_SEPARATORS) {
    const idx = cleaned.indexOf(sep)
    if (idx > 0) cleaned = cleaned.slice(0, idx).trim()
  }
  if (cleaned === raw) return null
  if (known.has(cleaned)) return cleaned
  const cleanedNormalizedMatch = findByNormalizedName(cleaned, known)
  if (cleanedNormalizedMatch) return cleanedNormalizedMatch
  return aliasMap?.get(norm(cleaned)) ?? null
}

function buildAliasMap(components: CatalogComponent[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const c of components) {
    for (const alias of c.aliases ?? []) {
      map.set(norm(alias), c.name)
    }
  }
  return map
}

export function getSelectionStats(input: SelectionInput): SelectionStats {
  const fallback = new Set(input.fallbackNames ?? [])
  const effectiveNames =
    input.activeComponentNames.size > 0 ? input.activeComponentNames : fallback

  const activeNormalized = new Set([...effectiveNames].map(norm))
  const known = new Set(input.components.map(c => c.name))
  const aliasMap = buildAliasMap(input.components)
  const rejected = new Set(input.rejectedSuggestions ?? [])
  const accepted = new Set(input.acceptedSuggestions ?? [])

  // Semantik identisch zum bisherigen KI-Panel (#181-Dedupe inklusive):
  // nur bekannte, nicht abgelehnte, nicht bereits aktive Komponenten.
  const resolvedSuggestions = [...new Set(
    (input.aiSuggestions ?? [])
      .map(n => resolveToKnownName(n, known, aliasMap))
      .filter((n): n is string => n !== null)
  )]
  const visibleSuggestions = resolvedSuggestions.filter(
    n => !rejected.has(n) && !activeNormalized.has(norm(n))
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

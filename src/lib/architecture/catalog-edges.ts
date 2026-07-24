import type { CatalogComponent } from '@/types'

// Phase 3: echte Kanten zwischen Bausteinen aus den kuratierten Katalog-Relationen
// (`requires`/`suggests`/`incompatible_with`). Diese Arrays referenzieren andere
// Komponenten per NAME (identisch zu lib/utils/catalog-compatibility.ts). Es werden
// nur Kanten zwischen im Diagramm AKTIVEN Bausteinen erzeugt.

export type CompEdgeKind = 'requires' | 'suggests'

export interface CompEdge {
  from: string
  to: string
  kind: CompEdgeKind
}

export interface CompConflict {
  a: string
  b: string
}

export interface CatalogEdgeResult {
  edges: CompEdge[]
  conflicts: CompConflict[]
}

/**
 * Leitet aus den aktiven Bausteinen die gerichteten requires/suggests-Kanten
 * sowie die (ungerichteten) incompatible_with-Konflikte ab. Nur Kanten, deren
 * beide Enden aktiv sind, werden zurückgegeben. Dedupliziert.
 */
export function catalogEdges(activeComponents: CatalogComponent[]): CatalogEdgeResult {
  const active = new Set(activeComponents.map(c => c.name))

  const edges: CompEdge[] = []
  const seenEdge = new Set<string>()
  const addEdge = (from: string, to: string, kind: CompEdgeKind) => {
    if (from === to) return
    if (!active.has(from) || !active.has(to)) return
    const key = `${from}|${to}|${kind}`
    if (seenEdge.has(key)) return
    seenEdge.add(key)
    edges.push({ from, to, kind })
  }

  for (const comp of activeComponents) {
    for (const target of comp.requires) addEdge(comp.name, target, 'requires')
    for (const target of comp.suggests) addEdge(comp.name, target, 'suggests')
  }

  const conflicts: CompConflict[] = []
  const seenPair = new Set<string>()
  for (let i = 0; i < activeComponents.length; i++) {
    for (let j = i + 1; j < activeComponents.length; j++) {
      const a = activeComponents[i]
      const b = activeComponents[j]
      const isConflict = a.incompatible_with.includes(b.name) || b.incompatible_with.includes(a.name)
      if (!isConflict) continue
      const key = [a.name, b.name].sort().join('||')
      if (seenPair.has(key)) continue
      seenPair.add(key)
      conflicts.push({ a: a.name, b: b.name })
    }
  }

  return { edges, conflicts }
}

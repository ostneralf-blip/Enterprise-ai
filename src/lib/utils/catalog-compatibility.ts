import type { CatalogComponent } from '@/types'

export interface Conflict {
  a: string
  b: string
  alternatives: string[]
}

export interface Suggestion {
  source: string
  target: string
}

export function findConflicts(
  checked: Set<string>,
  byName: Record<string, CatalogComponent>
): Conflict[] {
  const checkedList = Array.from(checked)
  const conflicts: Conflict[] = []
  const seen = new Set<string>()

  for (let i = 0; i < checkedList.length; i++) {
    for (let j = i + 1; j < checkedList.length; j++) {
      const a = checkedList[i]
      const b = checkedList[j]
      const compA = byName[a]
      const compB = byName[b]

      const isConflict =
        compA?.incompatible_with.includes(b) ||
        compB?.incompatible_with.includes(a)

      if (!isConflict) continue

      const pairKey = [a, b].sort().join('||')
      if (seen.has(pairKey)) continue
      seen.add(pairKey)

      const alternatives = Array.from(new Set([
        ...(compA?.suggests ?? []),
        ...(compB?.suggests ?? []),
      ])).filter(alt => !checked.has(alt))

      conflicts.push({ a, b, alternatives })
    }
  }

  return conflicts
}

export function findSuggestions(
  checked: Set<string>,
  byName: Record<string, CatalogComponent>
): Suggestion[] {
  const seen = new Set<string>()
  const suggestions: Suggestion[] = []

  for (const name of checked) {
    const comp = byName[name]
    if (!comp) continue
    for (const target of comp.suggests) {
      if (checked.has(target)) continue
      if (seen.has(target)) continue
      seen.add(target)
      suggestions.push({ source: name, target })
    }
  }

  return suggestions
}

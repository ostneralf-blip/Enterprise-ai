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

export function findConflicts(_checked: Set<string>, _byName: Record<string, CatalogComponent>): Conflict[] {
  return []
}

export function findSuggestions(_checked: Set<string>, _byName: Record<string, CatalogComponent>): Suggestion[] {
  return []
}

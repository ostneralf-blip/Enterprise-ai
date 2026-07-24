import type { UseCase } from '@/types'

// 1..4 (geplant → evaluiert → pilot → produktiv). Rein aus Use-Case-Feldern ableitbar.
export function maturityLevel(uc: UseCase): 1 | 2 | 3 | 4 {
  if (uc.governance_result === 'approve') return 4
  if (uc.canvas_id) return 3
  if (uc.governance_result) return 2
  return 1
}

export interface CapabilityTile {
  id: string
  name: string
  level: 1 | 2 | 3 | 4
}

export interface CapabilityGroup {
  domain: string
  tiles: CapabilityTile[]
}

export function deriveCapabilityMap(useCases: UseCase[]): CapabilityGroup[] {
  const byDomain = new Map<string, CapabilityTile[]>()
  for (const uc of useCases) {
    const domain = uc.domain?.trim() || '—'
    const arr = byDomain.get(domain) ?? []
    arr.push({ id: uc.id, name: uc.name, level: maturityLevel(uc) })
    byDomain.set(domain, arr)
  }
  return [...byDomain.entries()].map(([domain, tiles]) => ({ domain, tiles }))
}

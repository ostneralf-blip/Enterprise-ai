import type { CanvasContext } from '@/lib/canvas-context'
import type { WizardAnswers } from '@/config/architecture-data'
import type { CatalogComponent } from '@/types'

export interface MergedCanvasContext {
  prefill: Partial<WizardAnswers>
  conflictingFields: string[]
  preScoredComponents: CatalogComponent[]
}

const WIZARD_KEYS: (keyof WizardAnswers)[] = [
  'infra', 'data', 'skills', 'usecase', 'sap_landscape',
  'cloud_provider_hint', 'industry', 'company_size', 'compliance',
  'data_platform', 'model_platform', 'monitoring',
]

export function mergeCanvasContexts(contexts: CanvasContext[]): MergedCanvasContext {
  if (contexts.length === 0) return { prefill: {}, conflictingFields: [], preScoredComponents: [] }
  if (contexts.length === 1) {
    return { prefill: contexts[0].wizard_prefill, conflictingFields: [], preScoredComponents: contexts[0].pre_scored_components }
  }

  const prefill: Partial<WizardAnswers> = {}
  const conflictingFields: string[] = []

  for (const key of WIZARD_KEYS) {
    const rawValues = contexts.map(c => c.wizard_prefill[key])
    const values = rawValues.filter((v): v is NonNullable<typeof v> => v != null) as string[]
    if (values.length === 0) continue

    const counts: Record<string, number> = {}
    for (const v of values) { counts[v] = (counts[v] ?? 0) + 1 }

    const maxCount = Math.max(...Object.values(counts))
    const winners = Object.keys(counts).filter(v => counts[v] === maxCount)

    if (winners.length === 1) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(prefill as any)[key] = winners[0]
    } else {
      conflictingFields.push(key)
    }
  }

  // Merge pre-scored components: deduplicate by id, keep all unique across canvases
  const seen = new Set<string>()
  const preScoredComponents: CatalogComponent[] = []
  for (const ctx of contexts) {
    for (const comp of ctx.pre_scored_components) {
      if (!seen.has(comp.id)) {
        seen.add(comp.id)
        preScoredComponents.push(comp)
      }
    }
  }

  return { prefill, conflictingFields, preScoredComponents }
}

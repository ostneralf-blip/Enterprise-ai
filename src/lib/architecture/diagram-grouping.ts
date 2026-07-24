/**
 * Diagram grouping and rule edge logic for architecture layering.
 * Pure functions (no React) for testing mappings and structural rules.
 */

export type BandId =
  | 'motivation'
  | 'business'
  | 'application'
  | 'data'
  | 'technology'
  | 'dataTech'
  | 'cross'

export type FlowStage = 'sources' | 'platform' | 'models' | 'consumption' | 'cross'

type LayerComp = { architecture_layer: string | null }

/**
 * Group components into layers-based bands (5-band architecture).
 * - application: application layer
 * - dataTech: data, model, serving, mlops layers
 * - cross: governance, security layers
 */
export function layersComps<T extends LayerComp>(
  comps: T[]
): { application: T[]; dataTech: T[]; cross: T[] } {
  const application = comps.filter((c) => c.architecture_layer === 'application')
  const dataTech = comps.filter((c) =>
    ['data', 'model', 'serving', 'mlops'].includes(c.architecture_layer ?? '')
  )
  const cross = comps.filter((c) =>
    ['governance', 'security'].includes(c.architecture_layer ?? '')
  )

  return { application, dataTech, cross }
}

/**
 * Group components into TOGAF-based bands.
 * - data: data layer
 * - application: application and serving layers
 * - technology: model and mlops layers
 * - cross: governance and security layers
 */
export function togafComps<T extends LayerComp>(
  comps: T[]
): { data: T[]; application: T[]; technology: T[]; cross: T[] } {
  const data = comps.filter((c) => c.architecture_layer === 'data')
  const application = comps.filter((c) =>
    ['application', 'serving'].includes(c.architecture_layer ?? '')
  )
  const technology = comps.filter((c) =>
    ['model', 'mlops'].includes(c.architecture_layer ?? '')
  )
  const cross = comps.filter((c) =>
    ['governance', 'security'].includes(c.architecture_layer ?? '')
  )

  return { data, application, technology, cross }
}

/**
 * Group components by data flow stages.
 * - sources: data layer
 * - platform: mlops layer
 * - models: model and serving layers
 * - consumption: application layer
 * - cross: governance and security layers
 */
export function dataFlowComps<T extends LayerComp>(
  comps: T[]
): { sources: T[]; platform: T[]; models: T[]; consumption: T[]; cross: T[] } {
  const sources = comps.filter((c) => c.architecture_layer === 'data')
  const platform = comps.filter((c) => c.architecture_layer === 'mlops')
  const models = comps.filter((c) =>
    ['model', 'serving'].includes(c.architecture_layer ?? '')
  )
  const consumption = comps.filter((c) => c.architecture_layer === 'application')
  const cross = comps.filter((c) =>
    ['governance', 'security'].includes(c.architecture_layer ?? '')
  )

  return { sources, platform, models, consumption, cross }
}

/**
 * Generate rule edges for the connection layer.
 * Only returns edges where BOTH endpoints exist in nonEmpty set.
 *
 * layers grouping candidates: [['application', 'dataTech']]
 * togaf grouping candidates: [['application', 'data'], ['application', 'technology'], ['technology', 'data']]
 */
export function ruleEdges(grouping: 'layers' | 'togaf', nonEmpty: Set<BandId>): [BandId, BandId][] {
  const candidates: [BandId, BandId][] =
    grouping === 'layers'
      ? [['application', 'dataTech']]
      : [['application', 'data'], ['application', 'technology'], ['technology', 'data']]

  return candidates.filter(([from, to]) => nonEmpty.has(from) && nonEmpty.has(to))
}

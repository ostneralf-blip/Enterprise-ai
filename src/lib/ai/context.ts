// #209: Deterministischer Analyse-Kontext + Hash für Stale-Erkennung.
// Kein `server-only` — läuft in Browser und Node.js gleichermassen.

export interface AnalysisContext {
  components: string[]
  compliance: string
  archetype: string
  canvas_quadrant: string
  governance_result: string
  roadmap_phases: number
}

export function buildAnalysisContext(params: {
  components: string[]
  compliance?: string | null
  archetype?: string | null
  canvasQuadrant?: string | null
  governanceResult?: string | null
  roadmapPhases?: number
}): AnalysisContext {
  return {
    components:       [...params.components].sort(),
    compliance:       params.compliance       ?? '',
    archetype:        params.archetype        ?? '',
    canvas_quadrant:  params.canvasQuadrant   ?? '',
    governance_result: params.governanceResult ?? '',
    roadmap_phases:   params.roadmapPhases    ?? 0,
  }
}

// djb2-Variante — kein Crypto nötig, synchron, browser-kompatibel
export function contextHash(ctx: AnalysisContext): string {
  const keys = Object.keys(ctx).sort() as (keyof AnalysisContext)[]
  const stable = JSON.stringify(Object.fromEntries(keys.map(k => [k, ctx[k]])))
  let h = 5381
  for (let i = 0; i < stable.length; i++) {
    h = (((h << 5) + h) ^ stable.charCodeAt(i)) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

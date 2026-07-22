import { generateDimensionStatuses, DIM_WEAK_THRESHOLD } from '@/lib/utils/summary-priorities'

// Sprint 37: Reifegrad-Status je Assessment-Dimension (schwach/gut).
describe('generateDimensionStatuses', () => {
  const allDims = {
    data: 4.2,
    skills: 2.1,
    governance: 3.0,
    tech: 1.4,
    strategy: 3.8,
    culture: 2.9,
  }

  it('gibt eine leere Liste zurück, wenn keine dim_scores vorliegen', () => {
    expect(generateDimensionStatuses(null, 'starter')).toEqual([])
    expect(generateDimensionStatuses(undefined, 'scaler')).toEqual([])
    expect(generateDimensionStatuses({}, 'transformer')).toEqual([])
  })

  it('gibt eine leere Liste zurück, wenn kein Archetyp vorliegt', () => {
    expect(generateDimensionStatuses(allDims, null)).toEqual([])
    expect(generateDimensionStatuses(allDims, undefined)).toEqual([])
  })

  it('klassifiziert unterhalb des Schwellwerts als „weak", ab Schwellwert als „good"', () => {
    const result = generateDimensionStatuses(allDims, 'starter')
    const byId = Object.fromEntries(result.map(r => [r.dimId, r.status]))
    expect(byId.data).toBe('good')       // 4.2
    expect(byId.skills).toBe('weak')     // 2.1
    expect(byId.governance).toBe('good') // 3.0 — exakt am Schwellwert
    expect(byId.tech).toBe('weak')       // 1.4
    expect(byId.strategy).toBe('good')   // 3.8
    expect(byId.culture).toBe('weak')    // 2.9
  })

  it('behandelt den Schwellwert 3.0 inklusiv (>= gilt als good)', () => {
    const atThreshold = generateDimensionStatuses({ data: DIM_WEAK_THRESHOLD }, 'scaler')
    expect(atThreshold[0].status).toBe('good')
    const justBelow = generateDimensionStatuses({ data: DIM_WEAK_THRESHOLD - 0.1 }, 'scaler')
    expect(justBelow[0].status).toBe('weak')
  })

  it('liefert die Dimensionen in kanonischer Reihenfolge und überspringt nicht bewertete', () => {
    // Quick-Check-Szenario: nur eine Teilmenge der Dimensionen hat Scores
    const partial = generateDimensionStatuses({ strategy: 2.0, data: 4.0 }, 'starter')
    expect(partial.map(r => r.dimId)).toEqual(['data', 'strategy'])
    expect(partial.find(r => r.dimId === 'data')?.score).toBe(4.0)
  })

  it('ignoriert Nicht-Zahl-Werte in dim_scores robust', () => {
    const dirty = { data: 4.0, skills: undefined as unknown as number, tech: null as unknown as number }
    const result = generateDimensionStatuses(dirty, 'transformer')
    expect(result.map(r => r.dimId)).toEqual(['data'])
  })
})

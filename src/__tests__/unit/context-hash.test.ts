import { buildAnalysisContext, contextHash } from '@/lib/ai/context'

describe('contextHash', () => {
  const base = buildAnalysisContext({
    components: ['Azure OpenAI', 'Snowflake'],
    compliance: 'strict',
    archetype: 'scaler',
    canvasQuadrant: 'strategic_bet',
    governanceResult: 'approve',
    roadmapPhases: 3,
  })

  it('gleicher Kontext → gleicher Hash', () => {
    const a = contextHash(base)
    const b = contextHash(buildAnalysisContext({
      components: ['Snowflake', 'Azure OpenAI'], // andere Reihenfolge
      compliance: 'strict',
      archetype: 'scaler',
      canvasQuadrant: 'strategic_bet',
      governanceResult: 'approve',
      roadmapPhases: 3,
    }))
    expect(a).toBe(b)
  })

  it('Komponenten-Änderung → anderer Hash', () => {
    const changed = contextHash(buildAnalysisContext({
      ...base,
      components: ['Azure OpenAI'],
    }))
    expect(changed).not.toBe(contextHash(base))
  })

  it('Compliance-Änderung → anderer Hash', () => {
    const changed = contextHash(buildAnalysisContext({ ...base, compliance: 'moderate' }))
    expect(changed).not.toBe(contextHash(base))
  })

  it('roadmapPhases-Änderung → anderer Hash', () => {
    const changed = contextHash(buildAnalysisContext({ ...base, roadmapPhases: 5 }))
    expect(changed).not.toBe(contextHash(base))
  })

  it('Hash ist 8-stelliger Hex-String', () => {
    expect(contextHash(base)).toMatch(/^[0-9a-f]{8}$/)
  })
})

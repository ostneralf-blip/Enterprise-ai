import { deriveCapabilityMap, maturityLevel } from '@/lib/architecture/capability'
import type { UseCase } from '@/types'

const uc = (o: Partial<UseCase>): UseCase => ({
  id: 'x',
  portfolio_id: 'p',
  name: 'n',
  domain: null,
  description: null,
  scores: {},
  weighted_score: 0,
  quadrant: 'quick_win',
  canvas_id: null,
  governance_result: null,
  created_at: '',
  updated_at: '',
  ...o,
})

describe('capability maturity', () => {
  it('approve → produktiv (Stufe 4)', () =>
    expect(maturityLevel(uc({ governance_result: 'approve' }))).toBe(4))

  it('canvas ohne approve → pilot (3)', () =>
    expect(maturityLevel(uc({ canvas_id: 'c' }))).toBe(3))

  it('governance improve → evaluiert (2)', () =>
    expect(maturityLevel(uc({ governance_result: 'improve' }))).toBe(2))

  it('nur gescored → geplant (1)', () =>
    expect(maturityLevel(uc({}))).toBe(1))

  it('gruppiert nach domain, null → "—"', () => {
    const map = deriveCapabilityMap([uc({ domain: 'Vertrieb' }), uc({ domain: null })])
    expect(map.find(g => g.domain === 'Vertrieb')).toBeTruthy()
    expect(map.find(g => g.domain === '—')).toBeTruthy()
  })
})

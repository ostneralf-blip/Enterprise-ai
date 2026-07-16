// #208: computeRasicTarget — überschreibt bestehende Werte + erzwingt genau ein A pro Phase
// Die Funktion ist file-local in ArchitecturePageClient, daher wird die Logik hier repliziert.

import type { RasicMatrix, RasicPhase, RasicValue } from '@/types'

const PHASES: RasicPhase[] = ['konzeption', 'daten', 'build', 'freigabe', 'betrieb']

const RASIC_ROLE_DEFAULTS: Record<string, Partial<Record<RasicPhase, RasicValue>>> = {
  'AI Product Owner':          { konzeption: 'A', daten: 'I', build: 'I', freigabe: 'A', betrieb: 'I' },
  'Business AI Champion':      { konzeption: 'R', daten: 'S', build: 'S', freigabe: 'R', betrieb: 'S' },
  'MLOps Engineer':            { konzeption: 'I', daten: 'S', build: 'A', freigabe: 'I', betrieb: 'R' },
  'AI CoE Lead':               { konzeption: 'A', daten: 'I', build: 'I', freigabe: 'A', betrieb: 'A' },
  'Chief Data Officer (CDO)':  { konzeption: 'A', daten: 'A', build: 'I', freigabe: 'A', betrieb: 'A' },
}

function computeRasicTarget(rasic: RasicMatrix): RasicMatrix {
  const proposed = rasic.entries.map(entry => {
    const defaults = RASIC_ROLE_DEFAULTS[entry.role]
    if (!defaults) return entry
    const assignments: Record<string, RasicValue> = {}
    for (const phase of rasic.phases as RasicPhase[]) {
      assignments[phase] = (defaults[phase] as RasicValue | undefined) ?? (entry.assignments[phase] ?? '' as RasicValue)
    }
    return { ...entry, assignments }
  })
  const aClaimedByPhase = new Set<string>()
  const resolved = proposed.map(entry => {
    const assignments = { ...entry.assignments }
    for (const phase of rasic.phases as RasicPhase[]) {
      if (assignments[phase] === 'A') {
        if (aClaimedByPhase.has(phase)) {
          assignments[phase] = 'S'
        } else {
          aClaimedByPhase.add(phase)
        }
      }
    }
    return { ...entry, assignments }
  })
  return { ...rasic, entries: resolved }
}

function countA(rasic: RasicMatrix, phase: RasicPhase): number {
  return rasic.entries.filter(e => e.assignments[phase] === 'A').length
}

const makeRasic = (roles: { role: string; assignments: Partial<Record<RasicPhase, RasicValue>> }[]): RasicMatrix => ({
  phases: PHASES,
  entries: roles.map(r => ({ role: r.role, assignments: r.assignments as Record<string, RasicValue> })),
})

describe('computeRasicTarget', () => {
  it('füllt leere Zellen aus Defaults', () => {
    const rasic = makeRasic([
      { role: 'AI Product Owner', assignments: {} },
      { role: 'Business AI Champion', assignments: {} },
    ])
    const result = computeRasicTarget(rasic)
    const owner = result.entries.find(e => e.role === 'AI Product Owner')!
    expect(owner.assignments['konzeption']).toBe('A')
    expect(owner.assignments['daten']).toBe('I')
  })

  it('überschreibt bestehende (falsche) Werte', () => {
    const rasic = makeRasic([
      { role: 'AI Product Owner', assignments: { konzeption: 'R', daten: 'R', build: 'R', freigabe: 'R', betrieb: 'R' } },
    ])
    const result = computeRasicTarget(rasic)
    const owner = result.entries.find(e => e.role === 'AI Product Owner')!
    expect(owner.assignments['konzeption']).toBe('A')
    expect(owner.assignments['daten']).toBe('I')
  })

  it('erzwingt genau ein A pro Phase bei Kollision (2×A in konzeption)', () => {
    const rasic = makeRasic([
      { role: 'AI Product Owner', assignments: {} },
      { role: 'AI CoE Lead',      assignments: {} },
      { role: 'Chief Data Officer (CDO)', assignments: {} },
    ])
    const result = computeRasicTarget(rasic)
    expect(countA(result, 'konzeption')).toBe(1)
    expect(countA(result, 'freigabe')).toBe(1)
    expect(countA(result, 'betrieb')).toBe(1)
  })

  it('build-Phase: MLOps bekommt A, AI Product Owner bleibt I', () => {
    const rasic = makeRasic([
      { role: 'AI Product Owner', assignments: {} },
      { role: 'MLOps Engineer',   assignments: {} },
    ])
    const result = computeRasicTarget(rasic)
    expect(countA(result, 'build')).toBe(1)
    const mlops = result.entries.find(e => e.role === 'MLOps Engineer')!
    expect(mlops.assignments['build']).toBe('A')
  })

  it('kein A in Defaults → Zelle bleibt wie vorgefunden', () => {
    const rasic = makeRasic([
      { role: 'Unknown Role', assignments: { konzeption: 'R' } },
    ])
    const result = computeRasicTarget(rasic)
    expect(result.entries[0].assignments['konzeption']).toBe('R')
  })
})

import { ROADMAPS, ARCHETYPE_LABELS, PHASE_COLORS } from '@/config/roadmap-data'
import type { Archetype } from '@/types'

const ARCHETYPES: Archetype[] = ['starter', 'scaler', 'transformer']
const PHASES = ['phase1', 'phase2', 'phase3'] as const

describe('Roadmap-Daten: Integrität', () => {

  it('alle 3 Archetypen haben Roadmap-Daten', () => {
    ARCHETYPES.forEach(a => expect(ROADMAPS[a]).toBeDefined())
  })

  it('jeder Archetyp hat genau 3 Phasen', () => {
    ARCHETYPES.forEach(a => {
      expect(Object.keys(ROADMAPS[a])).toHaveLength(3)
      PHASES.forEach(p => expect(ROADMAPS[a][p]).toBeDefined())
    })
  })

  it('jede Phase hat title, duration, focus, actions, kpis und budget', () => {
    ARCHETYPES.forEach(a => {
      PHASES.forEach(p => {
        const phase = ROADMAPS[a][p]
        expect(phase.title).toBeTruthy()
        expect(phase.duration).toBeTruthy()
        expect(phase.focus).toBeTruthy()
        expect(phase.budget).toBeTruthy()
        expect(phase.actions.length).toBeGreaterThan(0)
        expect(phase.kpis.length).toBeGreaterThan(0)
      })
    })
  })

  it('alle Aktionen haben label und priority (high | medium)', () => {
    ARCHETYPES.forEach(a => {
      PHASES.forEach(p => {
        ROADMAPS[a][p].actions.forEach(action => {
          expect(action.label).toBeTruthy()
          expect(['high', 'medium']).toContain(action.priority)
        })
      })
    })
  })

  it('jede Phase hat mindestens eine high-priority Maßnahme', () => {
    ARCHETYPES.forEach(a => {
      PHASES.forEach(p => {
        const hasHigh = ROADMAPS[a][p].actions.some(ac => ac.priority === 'high')
        expect(hasHigh).toBe(true)
      })
    })
  })

  it('jede Phase hat mindestens 1 KPI', () => {
    ARCHETYPES.forEach(a => {
      PHASES.forEach(p => {
        expect(ROADMAPS[a][p].kpis.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  it('ARCHETYPE_LABELS hat label, desc und icon für alle 3 Archetypen', () => {
    ARCHETYPES.forEach(a => {
      expect(ARCHETYPE_LABELS[a].label).toBeTruthy()
      expect(ARCHETYPE_LABELS[a].desc).toBeTruthy()
      expect(ARCHETYPE_LABELS[a].icon).toBeTruthy()
    })
  })

  it('PHASE_COLORS sind für alle 3 Phasen definiert', () => {
    PHASES.forEach(p => {
      expect(PHASE_COLORS[p].bg).toBeTruthy()
      expect(PHASE_COLORS[p].border).toBeTruthy()
      expect(PHASE_COLORS[p].badge).toBeTruthy()
    })
  })

  it('Phasen-Daten sind über Archetypen hinweg inhaltlich verschieden', () => {
    const starterP1 = ROADMAPS.starter.phase1.title
    const scalerP1 = ROADMAPS.scaler.phase1.title
    const transformerP1 = ROADMAPS.transformer.phase1.title
    expect(starterP1).not.toBe(scalerP1)
    expect(scalerP1).not.toBe(transformerP1)
    expect(starterP1).not.toBe(transformerP1)
  })
})

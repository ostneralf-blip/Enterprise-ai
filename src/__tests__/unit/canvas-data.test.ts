import { CANVAS_FIELDS, EMPTY_CANVAS_DATA } from '@/config/canvas-data'
import type { CanvasData } from '@/types'

const EXPECTED_FIELD_IDS: (keyof CanvasData)[] = [
  'problem', 'solution', 'data_sources', 'stakeholders',
  'kpis', 'risks', 'architecture', 'next_steps',
]

describe('Canvas-Daten: Integrität', () => {

  it('genau 8 Canvas-Felder sind definiert', () => {
    expect(CANVAS_FIELDS).toHaveLength(8)
  })

  it('alle 8 Felder-IDs entsprechen den CanvasData-Schlüsseln', () => {
    const ids = CANVAS_FIELDS.map(f => f.id)
    EXPECTED_FIELD_IDS.forEach(expected => {
      expect(ids).toContain(expected)
    })
  })

  it('jedes Feld hat label, description und placeholder', () => {
    CANVAS_FIELDS.forEach(field => {
      expect(field.label).toBeTruthy()
      expect(field.description).toBeTruthy()
      expect(field.placeholder).toBeTruthy()
    })
  })

  it('EMPTY_CANVAS_DATA hat genau die 8 CanvasData-Schlüssel', () => {
    EXPECTED_FIELD_IDS.forEach(key => {
      expect(EMPTY_CANVAS_DATA[key]).toBe('')
    })
    expect(Object.keys(EMPTY_CANVAS_DATA)).toHaveLength(8)
  })

  it('Felder-IDs sind eindeutig (keine Duplikate)', () => {
    const ids = CANVAS_FIELDS.map(f => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

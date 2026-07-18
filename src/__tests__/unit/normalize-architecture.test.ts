import { normalizeArchitectureResult } from '@/lib/pdf/normalize-architecture'

describe('normalizeArchitectureResult', () => {
  // Regression: der Executive-Summary-PDF-Export reichte architectures.result
  // bisher ungeprüft durch. Ältere Datensätze speichern nextSteps als rohes
  // { de, en }-Objekt statt als String — direkt als React-Kind gerendert crasht
  // react-pdf mit "Objects are not valid as a React child" (React error #31).
  it('löst { de, en }-Objekte in nextSteps auf die aktuelle Sprache auf', () => {
    const result = normalizeArchitectureResult({
      pattern: 'Layered',
      layers: [],
      nextSteps: [{ de: 'Piloten starten', en: 'Start pilots' }, 'Team aufbauen'],
    }, 'de')
    expect(result.nextSteps).toEqual(['Piloten starten', 'Team aufbauen'])
  })

  it('löst { de, en }-Objekte auf Englisch auf, wenn locale=en', () => {
    const result = normalizeArchitectureResult({
      pattern: 'Layered',
      layers: [],
      nextSteps: [{ de: 'Piloten starten', en: 'Start pilots' }],
    }, 'en')
    expect(result.nextSteps).toEqual(['Start pilots'])
  })

  it('lässt bereits aufgelöste String-nextSteps unverändert', () => {
    const result = normalizeArchitectureResult({
      pattern: 'Layered',
      layers: [],
      nextSteps: ['POC starten', 'Team aufbauen'],
    }, 'de')
    expect(result.nextSteps).toEqual(['POC starten', 'Team aufbauen'])
  })

  it('behandelt fehlende nextSteps/layers/components als leere Arrays statt zu crashen', () => {
    const result = normalizeArchitectureResult({
      pattern: 'Layered',
      layers: [{ name: 'Datenschicht', role: 'Speicherung' }],
    }, 'de')
    expect(result.nextSteps).toEqual([])
    expect(result.layers[0].components).toEqual([])
  })
})

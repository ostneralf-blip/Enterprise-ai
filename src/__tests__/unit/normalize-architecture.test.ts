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

  // Regression 18.07.2026: description ist kein Feld des aktuellen ArchitectureResult-
  // Typs mehr, ältere DB-Datensätze können es aber noch als { de, en } enthalten —
  // exakt derselbe React-error-#31-Crash wie bei nextSteps, nur an einer anderen Stelle.
  it('löst { de, en }-Objekte in description auf die aktuelle Sprache auf', () => {
    const result = normalizeArchitectureResult({
      pattern: 'Layered',
      layers: [],
      description: { de: 'Beschreibung', en: 'Description' },
    }, 'en')
    expect(result.description).toBe('Description')
  })

  it('lässt bereits aufgelöste String-description unverändert', () => {
    const result = normalizeArchitectureResult({
      pattern: 'Layered',
      layers: [],
      description: 'Bereits ein String',
    }, 'de')
    expect(result.description).toBe('Bereits ein String')
  })

  it('lässt fehlende description undefined statt einen leeren Objekt-Rest zu erzeugen', () => {
    const result = normalizeArchitectureResult({
      pattern: 'Layered',
      layers: [],
    }, 'de')
    expect(result.description).toBeUndefined()
  })
})

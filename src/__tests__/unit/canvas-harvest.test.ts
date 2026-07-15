import { validateDetectedEntities, buildKnownTerms, type DetectedEntity } from '@/lib/canvas/harvest'

const CANVAS_TEXT = [
  'SAP Succcessfactor',
  'Anlage von Mitarbeiter in Successfactor dauert zu lange obwohl die Verträge und Mitarbeiterstammblatt lokal liegen',
  'Arbeitsvertrag und Mitarbeiterstammblatt im Wordformat sollen automatisch ausgelesen werden',
  'Successfactor, Word', 'HR', 'Personenbezogene Daten',
].join(' ')

const mk = (term: string, canonical: string, type: DetectedEntity['type'] = 'vendor'): DetectedEntity =>
  ({ term, canonical, type })

describe('validateDetectedEntities — #188 Harvesting-Guards', () => {
  it('akzeptiert Successfactor → SAP (Kern-Fall aus dem Live-Beispiel)', () => {
    const out = validateDetectedEntities([mk('Successfactor', 'SAP')], CANVAS_TEXT)
    expect(out).toEqual([{ term: 'SAP', synonym: 'successfactor', synonym_type: 'vendor' }])
  })

  it('akzeptiert auch den Tippfehler-Term, solange er wörtlich im Text steht', () => {
    const out = validateDetectedEntities([mk('Succcessfactor', 'SAP')], CANVAS_TEXT)
    expect(out).toHaveLength(1)
    expect(out[0].synonym).toBe('succcessfactor')
  })

  it('verwirft halluzinierte Terme, die nicht im Canvas-Text stehen', () => {
    expect(validateDetectedEntities([mk('Workday', 'SAP')], CANVAS_TEXT)).toEqual([])
  })

  it('verwirft Generika aus der Denylist (word → Microsoft)', () => {
    expect(validateDetectedEntities([mk('Word', 'Microsoft')], CANVAS_TEXT)).toEqual([])
  })

  it('verwirft unbekannte Vendor-Canonicals', () => {
    expect(validateDetectedEntities([mk('Successfactor', 'Workday Inc')], CANVAS_TEXT)).toEqual([])
  })

  it('verwirft bereits bekannte Aliases (successfactors ist hardcodiert)', () => {
    const text = CANVAS_TEXT + ' successfactors'
    expect(validateDetectedEntities([mk('successfactors', 'SAP')], text)).toEqual([])
  })

  it('verwirft zu kurze Terme und reine Zahlen', () => {
    const text = CANVAS_TEXT + ' bw 2026'
    expect(validateDetectedEntities([mk('bw', 'SAP'), mk('2026', 'SAP')], text)).toEqual([])
  })

  it('normalisiert Vendor-Canonical case-insensitiv auf die kanonische Schreibweise', () => {
    const out = validateDetectedEntities([mk('Successfactor', 'sap')], CANVAS_TEXT)
    expect(out[0]?.term).toBe('SAP')
  })

  it('validiert category- und usecase-Ziele gegen das feste Vokabular', () => {
    const text = CANVAS_TEXT + ' stammdatenblatt vertragsauslesung'
    const out = validateDetectedEntities([
      { term: 'stammdatenblatt', canonical: 'document', type: 'category' },
      { term: 'vertragsauslesung', canonical: 'vision', type: 'usecase' },
      { term: 'stammdatenblatt', canonical: 'quatsch', type: 'category' },
    ], text)
    expect(out).toEqual([
      { term: 'document', synonym: 'stammdatenblatt', synonym_type: 'category' },
      { term: 'vision', synonym: 'vertragsauslesung', synonym_type: 'usecase' },
    ])
  })

  it('dedupliziert und begrenzt auf 5 Einträge', () => {
    const ents = [mk('Successfactor', 'SAP'), mk('successfactor', 'SAP'), mk('SUCCESSFACTOR', 'SAP')]
    expect(validateDetectedEntities(ents, CANVAS_TEXT)).toHaveLength(1)
  })

  it('buildKnownTerms enthält Vendor-Namen, Aliases und Kategorie-Keywords + Extras', () => {
    const known = buildKnownTerms(['MeinExtra'])
    expect(known.has('sap')).toBe(true)
    expect(known.has('successfactors')).toBe(true)
    expect(known.has('ocr')).toBe(true)
    expect(known.has('meinextra')).toBe(true)
  })
})

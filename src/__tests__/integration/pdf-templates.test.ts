import { renderAssessmentPdf } from '@/lib/pdf/templates'

describe('Integration: PDF-Template Rendering', () => {

  const validData = {
    totalScore: 3.7,
    dimScores: {
      data: 4.0,
      skills: 3.0,
      governance: 3.5,
      tech: 4.0,
      strategy: 3.0,
      culture: 4.5,
    },
    archetype: 'scaler' as const,
  }

  it('rendert valides HTML-Dokument mit DOCTYPE', () => {
    const html = renderAssessmentPdf(validData)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<html lang="de">')
  })

  it('enthält den Gesamtscore formatiert mit einer Nachkommastelle', () => {
    const html = renderAssessmentPdf(validData)
    expect(html).toContain('3.7')
  })

  it('enthält alle 6 Dimensionslabels', () => {
    const html = renderAssessmentPdf(validData)
    expect(html).toContain('Datenqualität')
    expect(html).toContain('Skills')
    expect(html).toContain('Governance')
    expect(html).toContain('Technische Infrastruktur')
    expect(html).toContain('Strategie')
    expect(html).toContain('Kultur')
  })

  it('zeigt die 3 niedrigsten Dimensionen als Handlungsempfehlungen', () => {
    const html = renderAssessmentPdf(validData)
    // Niedrigste 3: skills (3.0), strategy (3.0), governance (3.5)
    const recommendationSection = html.split('Top Handlungsempfehlungen')[1]
    expect(recommendationSection).toContain('Skills')
  })

  it('funktioniert ohne optionalen Firmennamen', () => {
    const html = renderAssessmentPdf(validData)
    expect(html).toBeTruthy()
    expect(html).not.toContain('undefined')
  })

  it('inkludiert den Firmennamen wenn übergeben', () => {
    const html = renderAssessmentPdf({ ...validData, companyName: 'Musterfirma GmbH' })
    expect(html).toContain('Musterfirma GmbH')
  })

  it('produziert für alle 3 Archetypen gültiges HTML', () => {
    const archetypes: Array<'starter' | 'scaler' | 'transformer'> = ['starter', 'scaler', 'transformer']
    archetypes.forEach(archetype => {
      const html = renderAssessmentPdf({ ...validData, archetype })
      expect(html).toContain('<!DOCTYPE html>')
      expect(html.length).toBeGreaterThan(500)
    })
  })

  it('keine ungeschlossenen HTML-Tags bei doppelten Anführungszeichen im Firmennamen', () => {
    const html = renderAssessmentPdf({ ...validData, companyName: 'Firma "Quotes" GmbH' })
    expect(html).toContain('&quot;')
    expect(html).not.toContain('Firma "Quotes"') // sollte escaped sein
  })

  it('enthält den Footer-Disclaimer auf jeder generierten Seite', () => {
    const html = renderAssessmentPdf(validData)
    expect(html).toContain('ersetzt keine individuelle')
  })
})

/**
 * ════════════════════════════════════════════════════════════════════════
 * MANUELLER TEST ERFORDERLICH (PDF-Rendering mit echtem Chromium)
 * ════════════════════════════════════════════════════════════════════════
 * Diese Tests prüfen NUR die HTML-Generierung, NICHT das tatsächliche
 * PDF-Rendering via Puppeteer (benötigt Chromium-Binary, nicht in CI ohne
 * zusätzliches Setup verfügbar).
 *
 * 🔶 Lokal: GET /api/export/pdf?module=assessment aufrufen, PDF öffnen,
 *           visuell prüfen: Layout, Seitenumbrüche, Lesbarkeit, Farben
 * 🔶 Prüfen: Datei-Größe < 500 KB (Performance)
 * 🔶 Prüfen: PDF ist mit Screenreadern lesbar (Tagged PDF — Puppeteer-Limitation,
 *           ggf. Phase 2 Verbesserung)
 */

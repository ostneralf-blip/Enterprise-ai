import { renderAssessmentPdf } from '@/lib/pdf/templates'
import { renderPdf } from '@/lib/pdf/generate'

const BASE_DATA = {
  totalScore: 3.7,
  dimScores: { data: 4.0, skills: 3.0, governance: 3.5, tech: 4.0, strategy: 3.0, culture: 4.5 },
  archetype: 'scaler' as const,
}

async function toBuffer(data: typeof BASE_DATA & { companyName?: string }) {
  return renderPdf({ document: renderAssessmentPdf(data), filename: 'test.pdf' })
}

describe('Integration: PDF-Template Rendering', () => {

  it('rendert gültiges PDF-Dokument (magic bytes %PDF)', async () => {
    const buf = await toBuffer(BASE_DATA)
    expect(buf.slice(0, 4).toString()).toBe('%PDF')
  }, 15000)

  it('produzierter Buffer ist nicht leer', async () => {
    const buf = await toBuffer(BASE_DATA)
    expect(buf.length).toBeGreaterThan(0)
  }, 15000)

  it('funktioniert ohne optionalen Firmennamen', async () => {
    const buf = await toBuffer(BASE_DATA)
    expect(buf.length).toBeGreaterThan(0)
  }, 15000)

  it('funktioniert mit Firmennamen', async () => {
    const buf = await toBuffer({ ...BASE_DATA, companyName: 'Musterfirma GmbH' })
    expect(buf.slice(0, 4).toString()).toBe('%PDF')
  }, 15000)

  it('produziert für alle 3 Archetypen gültige PDFs', async () => {
    const archetypes: Array<'starter' | 'scaler' | 'transformer'> = ['starter', 'scaler', 'transformer']
    for (const archetype of archetypes) {
      const doc = renderAssessmentPdf({ ...BASE_DATA, archetype })
      const buf = await renderPdf({ document: doc, filename: 'test.pdf' })
      expect(buf.slice(0, 4).toString()).toBe('%PDF')
    }
  }, 30000)
})

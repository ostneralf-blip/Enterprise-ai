import { renderAssessmentPdf, renderExecutiveSummaryPdf } from '@/lib/pdf/templates'
import { renderPdf } from '@/lib/pdf/generate'
import { normalizeArchitectureResult } from '@/lib/pdf/normalize-architecture'

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

  // Defensive: leere Protokoll-Einträge (weder Frage noch Antwort) dürfen nicht
  // als null-Element im Kind-Array landen — react-pdf verträgt das inkonsistent.
  it('rendert Executive Summary trotz leerer Governance-Protokoll-Einträge', async () => {
    const doc = renderExecutiveSummaryPdf({
      companyName: 'Musterfirma GmbH',
      completedModules: 3,
      totalModules: 7,
      moduleStatus: [
        { label: 'AI-Readiness Assessment', done: true },
        { label: 'Use-Case Scoring', done: true },
        { label: 'Governance-Check', done: true },
      ],
      assessment: { archetype: 'scaler', totalScore: 3.7, dimScores: BASE_DATA.dimScores },
      useCaseCount: 0,
      topUseCases: [],
      governance: {
        useCaseName: 'Chatbot Kundenservice',
        result: 'approve',
        protocol: [
          { question: 'Rechtsgrundlage geprüft?', answer: 'Ja' },
          { question: '', answer: '' },
          { label: '', value: '' },
        ],
      },
    })
    const buf = await renderPdf({ document: doc, filename: 'test.pdf' })
    expect(buf.slice(0, 4).toString()).toBe('%PDF')
  }, 15000)

  // Regression #Executive-Summary-PDF (05.55 Uhr, 18.07.2026): architectures.result
  // wurde im executive_summary-Zweig ungeprüft durchgereicht. Ältere Architektur-
  // Datensätze speichern nextSteps als rohes { de, en }-Objekt statt als String —
  // direkt als <Text>-Kind gerendert wirft react-pdf "Minified React error #31:
  // Objects are not valid as a React child", was intern zu
  // "Cannot read properties of null (reading 'props')" kaskadiert. Fix:
  // normalizeArchitectureResult() wird jetzt in beiden PDF-Export-Zweigen
  // (architecture UND executive_summary) verwendet.
  it('rendert Executive Summary mit normalisierten Architektur-nextSteps, die ursprünglich { de, en }-Objekte waren', async () => {
    const normalized = normalizeArchitectureResult({
      pattern: 'Layered',
      description: 'Standard-Schichtenarchitektur',
      layers: [{ name: 'Datenschicht', role: 'Speicherung' }],
      nextSteps: [{ de: 'Piloten starten', en: 'Start pilots' }, 'Team aufbauen'],
    }, 'de')

    const doc = renderExecutiveSummaryPdf({
      companyName: 'Musterfirma GmbH',
      completedModules: 7,
      totalModules: 7,
      moduleStatus: [{ label: 'Architektur-Generator', done: true }],
      useCaseCount: 0,
      topUseCases: [],
      architecture: { title: 'Ziel-Architektur', result: normalized },
    })
    const buf = await renderPdf({ document: doc, filename: 'test.pdf' })
    expect(buf.slice(0, 4).toString()).toBe('%PDF')
  }, 15000)

  it('wirft, wenn ein roh gebliebenes { de, en }-Objekt ungeprüft als nextSteps-Text gerendert wird', async () => {
    const doc = renderExecutiveSummaryPdf({
      companyName: 'Musterfirma GmbH',
      completedModules: 7,
      totalModules: 7,
      moduleStatus: [{ label: 'Architektur-Generator', done: true }],
      useCaseCount: 0,
      topUseCases: [],
      architecture: {
        title: 'Ziel-Architektur',
        // absichtlich UNNORMALISIERT — simuliert den Bug, falls normalizeArchitectureResult
        // an einer Aufrufstelle vergessen wird
        result: { pattern: 'Layered', layers: [], nextSteps: [{ de: 'Piloten starten', en: 'Start pilots' } as unknown as string] },
      },
    })
    await expect(renderPdf({ document: doc, filename: 'test.pdf' })).rejects.toThrow(/Objects are not valid as a React child/)
  }, 15000)
})

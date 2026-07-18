import { renderAssessmentPdf, renderExecutiveSummaryPdf, renderRoadmapPdf, renderGovernancePdf } from '@/lib/pdf/templates'
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

  // Regression (18.07.2026, zweiter Fund nach dem nextSteps/description-Fix):
  // governance_sessions.protocol speichert question/answer/label/value teils als
  // rohes { de, en }-Objekt (governance-data.ts: question ist LocaleString) statt
  // als String — identischer React-error-#31-Crash, nur in einem anderen Modul.
  // Betrifft sowohl den eigenständigen Governance-Export als auch den
  // Governance-Abschnitt im Executive-Summary-Export.
  it('rendert Governance-PDF mit rohen { de, en }-Objekten in protocol.question/answer', async () => {
    const doc = renderGovernancePdf({
      useCaseName: 'Chatbot Kundenservice',
      result: 'approve',
      protocol: [
        { question: { de: 'Rechtsgrundlage geprüft?', en: 'Legal basis checked?' } as unknown as string, answer: { de: 'Ja', en: 'Yes' } as unknown as string },
      ],
    })
    const buf = await renderPdf({ document: doc, filename: 'test.pdf' })
    expect(buf.slice(0, 4).toString()).toBe('%PDF')
  }, 15000)

  it('rendert Executive Summary mit rohen { de, en }-Objekten im Governance-Protokoll', async () => {
    const doc = renderExecutiveSummaryPdf({
      companyName: 'Musterfirma GmbH',
      completedModules: 7,
      totalModules: 7,
      moduleStatus: [{ label: 'Governance-Check', done: true }],
      useCaseCount: 0,
      topUseCases: [],
      governance: {
        useCaseName: 'Chatbot Kundenservice',
        result: 'approve',
        protocol: [
          { question: { de: 'Rechtsgrundlage geprüft?', en: 'Legal basis checked?' } as unknown as string, answer: { de: 'Ja', en: 'Yes' } as unknown as string },
        ],
      },
    })
    const buf = await renderPdf({ document: doc, filename: 'test.pdf' })
    expect(buf.slice(0, 4).toString()).toBe('%PDF')
  }, 15000)

  // Regression (18.07.2026): RoadmapPageClient.tsx speichert Phasen IMMER mit der
  // rohen { de, en }-Struktur aus roadmap-data.ts (title/duration/focus/actions[].label/
  // kpis sind dort LocaleString) — nicht nur bei Alt-Datensätzen wie bei Architektur/
  // Governance. Betrifft den eigenständigen Roadmap-Export UND den Roadmap-Abschnitt
  // im Executive-Summary-Export.
  it('rendert Roadmap-PDF mit rohen { de, en }-Objekten in title/duration/focus/actions/kpis', async () => {
    const doc = renderRoadmapPdf({
      title: 'Meine Roadmap',
      archetype: 'scaler',
      phases: [{
        title: { de: 'Fundament legen', en: 'Build the foundation' } as unknown as string,
        duration: { de: '0-3 Monate', en: '0-3 months' } as unknown as string,
        focus: { de: 'Use Cases identifizieren', en: 'Identify use cases' } as unknown as string,
        actions: [{ label: { de: 'Assessment durchführen', en: 'Conduct assessment' } as unknown as string }],
        kpis: [{ de: 'Score verbessert', en: 'Score improved' } as unknown as string],
      }],
    })
    const buf = await renderPdf({ document: doc, filename: 'test.pdf' })
    expect(buf.slice(0, 4).toString()).toBe('%PDF')
  }, 15000)

  it('rendert Executive Summary mit rohen { de, en }-Objekten im Roadmap-Abschnitt', async () => {
    const doc = renderExecutiveSummaryPdf({
      companyName: 'Musterfirma GmbH',
      completedModules: 7,
      totalModules: 7,
      moduleStatus: [{ label: 'Roadmap-Generator', done: true }],
      useCaseCount: 0,
      topUseCases: [],
      roadmap: {
        title: 'Meine Roadmap',
        archetype: 'scaler',
        phases: [{
          title: { de: 'Fundament legen', en: 'Build the foundation' } as unknown as string,
          duration: { de: '0-3 Monate', en: '0-3 months' } as unknown as string,
          focus: { de: 'Use Cases identifizieren', en: 'Identify use cases' } as unknown as string,
          actions: [{ label: { de: 'Assessment durchführen', en: 'Conduct assessment' } as unknown as string }],
          kpis: [{ de: 'Score verbessert', en: 'Score improved' } as unknown as string],
        }],
      },
    })
    const buf = await renderPdf({ document: doc, filename: 'test.pdf' })
    expect(buf.slice(0, 4).toString()).toBe('%PDF')
  }, 15000)
})

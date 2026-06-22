import {
  renderAssessmentPdf,
  renderGovernancePdf,
  renderRoadmapPdf,
  renderCanvasPdf,
  renderCompliancePdf,
  renderArchitecturePdf,
  renderUsecasePdf,
} from '@/lib/pdf/templates'
import { renderPdf } from '@/lib/pdf/generate'

async function isPdf(doc: ReturnType<typeof renderAssessmentPdf>): Promise<boolean> {
  const buf = await renderPdf({ document: doc, filename: 'test.pdf' })
  return buf.slice(0, 4).toString() === '%PDF'
}

describe('PDF-Generierung (@react-pdf/renderer)', () => {
  it('Assessment-PDF enthält gültige PDF-Header-Bytes', async () => {
    const doc = renderAssessmentPdf({
      totalScore: 3.4,
      dimScores: { data: 3.0, skills: 2.8, governance: 3.5, tech: 3.2, strategy: 3.8, culture: 3.6 },
      archetype: 'scaler',
      companyName: 'Test GmbH',
    })
    expect(await isPdf(doc)).toBe(true)
  }, 15000)

  it('Governance-PDF enthält gültige PDF-Header-Bytes', async () => {
    const doc = renderGovernancePdf({
      useCaseName: 'Dokumentenprüfung',
      result: 'approve',
      protocol: [{ question: 'Datenschutz geprüft?', answer: 'Ja' }],
    })
    expect(await isPdf(doc)).toBe(true)
  }, 15000)

  it('Roadmap-PDF enthält gültige PDF-Header-Bytes', async () => {
    const doc = renderRoadmapPdf({
      title: 'AI-Roadmap 2025',
      archetype: 'starter',
      phases: [{ title: 'Fundament', duration: '3 Monate', actions: [{ label: 'Use Cases identifizieren' }] }],
    })
    expect(await isPdf(doc)).toBe(true)
  }, 15000)

  it('Canvas-PDF enthält gültige PDF-Header-Bytes', async () => {
    const doc = renderCanvasPdf({
      title: 'KI-Dokumentenprüfung',
      archetype: 'scaler',
      data: { problem: 'Manuelle Prüfung dauert 3 Tage', solution: 'NLP-Klassifikation', kpis: '< 4h Bearbeitungszeit' },
    })
    expect(await isPdf(doc)).toBe(true)
  }, 15000)

  it('Compliance-PDF enthält gültige PDF-Header-Bytes', async () => {
    const doc = renderCompliancePdf({
      checks: [
        { regulation: 'eu_ai_act', check_type: 'Risikobewertung', status: 'compliant', notes: null, completed_at: null },
        { regulation: 'dsgvo', check_type: 'Datenschutz-Folgenabschätzung', status: 'partial', notes: 'In Bearbeitung', completed_at: null },
      ],
    })
    expect(await isPdf(doc)).toBe(true)
  }, 15000)

  it('Architecture-PDF enthält gültige PDF-Header-Bytes', async () => {
    const doc = renderArchitecturePdf({
      title: 'NLP-Architektur',
      result: {
        pattern: 'RAG Pipeline',
        description: 'Retrieval-Augmented Generation für Dokumentensuche',
        layers: [{ name: 'Datenschicht', role: 'Datenhaltung', components: ['PostgreSQL', 'S3'], examples: 'Azure Blob' }],
        nextSteps: ['Datenpipeline aufbauen', 'Modell evaluieren'],
      },
    })
    expect(await isPdf(doc)).toBe(true)
  }, 15000)

  it('UseCase-PDF enthält gültige PDF-Header-Bytes', async () => {
    const doc = renderUsecasePdf({
      portfolioName: 'Q3-Portfolio',
      useCases: [
        { name: 'Dokumentenprüfung', domain: 'Operations', description: 'Automatische Klassifikation', weighted_score: 3.8, quadrant: 'quick_win' },
        { name: 'Prognosemodell', domain: 'Finance', description: null, weighted_score: 2.1, quadrant: 'strategic_bet' },
      ],
    })
    expect(await isPdf(doc)).toBe(true)
  }, 15000)
})

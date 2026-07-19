// 'next-intl' ist reines ESM und bricht in Jest sonst mit einer SyntaxError ab
// (siehe __tests__/test-utils/next-intl-mock.js) — hier bewusst nur lokal
// aktiviert, nicht global über jest.config.ts (siehe #224-Kommentar dort).
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock()-Factory wird gehoisted, ES-Import geht hier nicht
jest.mock('next-intl', () => require('../test-utils/next-intl-mock'))

import { renderMeridianReadiness } from '@/lib/pdf/meridian/reports/readiness'
import { renderMeridianUsecasePortfolio } from '@/lib/pdf/meridian/reports/usecase-portfolio'
import { renderMeridianComplianceStatus } from '@/lib/pdf/meridian/reports/compliance-status'
import { renderMeridianRoadmapStatus } from '@/lib/pdf/meridian/reports/roadmap-status'
import { renderMeridianArchitectureStatus } from '@/lib/pdf/meridian/reports/architecture-status'
import { renderMeridianFullReport } from '@/lib/pdf/meridian/reports/full-report'
import { renderPdf } from '@/lib/pdf/generate'
import type { ReadinessData } from '@/lib/pdf/meridian/data/readiness'
import type { UsecasePortfolioData } from '@/lib/pdf/meridian/data/usecase-portfolio'
import type { ComplianceStatusData } from '@/lib/pdf/meridian/data/compliance-status'
import type { RoadmapStatusData } from '@/lib/pdf/meridian/data/roadmap-status'
import type { ArchitectureStatusData } from '@/lib/pdf/meridian/data/architecture-status'
import type { ExecutiveSummaryData } from '@/lib/pdf/meridian/data/executive-summary'

// MERIDIAN Phase-3-Reports (Issue #225, Musterseiten 2-6) — Test-Gate laut
// CLAUDE.md ("Bei PDF/Export-Features: Integration-Test für die Template-
// Generierung"). Prüft DE/EN-Render sowie Leerzustände für alle 5 neuen
// Report-Typen plus die Gesamtdokument-Komposition (full-report.tsx).

async function isPdf(doc: ReturnType<typeof renderMeridianReadiness>): Promise<boolean> {
  const buf = await renderPdf({ document: doc, filename: 'test.pdf' })
  return buf.slice(0, 4).toString() === '%PDF'
}

const readinessData: ReadinessData = {
  companyName: 'Muster AG',
  assessmentDate: '2026-07-18T00:00:00.000Z',
  dimensions: [
    { id: 'data', label: 'Daten', score100: 48 },
    { id: 'skills', label: 'Skills', score100: 55 },
    { id: 'governance', label: 'Governance', score100: 41 },
    { id: 'tech', label: 'Technologie', score100: 65 },
    { id: 'strategy', label: 'Strategie', score100: 72 },
    { id: 'culture', label: 'Kultur', score100: 58 },
  ],
  weakestDimensionIds: ['governance', 'data', 'skills'],
  questionCount: 42,
}

const portfolioData: UsecasePortfolioData = {
  companyName: 'Muster AG',
  generatedAt: '2026-07-18T00:00:00.000Z',
  portfolioName: 'Portfolio 2026',
  useCases: Array.from({ length: 14 }, (_, i) => ({
    rank: i + 1,
    name: `Use Case ${i + 1}`,
    value100: 80 - i,
    feasibility100: 60 + i,
    quadrant: (['quick_win', 'strategic_bet', 'low_hanging_fruit', 'avoid'] as const)[i % 4],
  })),
  distribution: { quick_win: 4, strategic_bet: 4, low_hanging_fruit: 4, avoid: 2 },
}

const complianceData: ComplianceStatusData = {
  companyName: 'Muster AG',
  generatedAt: '2026-07-18T00:00:00.000Z',
  riskBands: [
    { id: 'prohibited', count: 0, title: 'Verboten', articleRef: 'Art. 5', summary: 'Keine betroffenen Use-Cases.' },
    { id: 'high', count: 1, title: 'Hochrisiko', articleRef: 'Art. 6', summary: 'Konformitätsbewertung erforderlich.' },
    { id: 'limited', count: 4, title: 'Begrenzt', articleRef: 'Art. 50', summary: 'Kennzeichnungspflicht.' },
    { id: 'minimal', count: 7, title: 'Minimal', articleRef: '', summary: 'Interne Werkzeuge.' },
  ],
  obligations: [
    { label: 'Konformitätsbewertung', article: 'Art. 43', status: 'pending' },
    { label: 'Technische Dokumentation', article: 'Art. 11', status: 'partial' },
    { label: 'Transparenz-Kennzeichnung', article: 'Art. 50', status: 'compliant' },
  ],
  obligationsCompletedCount: 3,
  obligationsTotalCount: 8,
}

const roadmapData: RoadmapStatusData = {
  companyName: 'Muster AG',
  generatedAt: '2026-07-18T00:00:00.000Z',
  archetype: 'scaler',
  horizons: [
    { eyebrowLabel: 'HORIZONT 1', durationLabel: '0-3 MONATE', title: 'Fundament', items: [{ title: 'Data-Governance-Board' }] },
    { eyebrowLabel: 'HORIZONT 2', durationLabel: '3-12 MONATE', title: 'Skalierung', items: [{ title: 'Rollout' }] },
    { eyebrowLabel: 'HORIZONT 3', durationLabel: '12+ MONATE', title: 'Transformation', items: [{ title: 'AI-Plattform' }] },
  ],
  currentScore100: 62,
  previousScore100: 51,
}

const architectureData: ArchitectureStatusData = {
  companyName: 'Muster AG',
  generatedAt: '2026-07-18T00:00:00.000Z',
  title: 'Meine Architektur',
  pattern: 'SAP-zentrierter MLOps-Stack',
  aiSummary: 'Die Zielarchitektur implementiert einen skalierbaren Governance-Rahmen.',
  keyDecisions: ['Kubernetes als primäre Orchestrierung.'],
  nextSteps: ['Pilot in Non-Production starten.'],
  layers: [{ name: 'Governance', components: ['SAP MDG', 'HashiCorp Vault'] }],
}

const executiveSummaryData: ExecutiveSummaryData = {
  companyName: 'Muster AG',
  generatedAt: '2026-07-18T00:00:00.000Z',
  overallScore100: 62,
  archetype: 'scaler',
  previousScore100: 51,
  dimensions: readinessData.dimensions,
  topUseCases: [{ name: 'Angebotserstellung mit RAG', value100: 86, feasibility100: 78, quadrant: 'quick_win' }],
  euAiActStatus: { highCount: 1, limitedCount: 4, minimalCount: 7, classifiedCount: 12, gapCount: 1 },
  next90Days: ['Data-Governance-Board etablieren'],
}

describe.each([
  ['Readiness', () => renderMeridianReadiness(readinessData, 'de'), () => renderMeridianReadiness(readinessData, 'en')],
  ['Use-Case-Portfolio (14 Einträge, Zeilen-Budget)', () => renderMeridianUsecasePortfolio(portfolioData, 'de'), () => renderMeridianUsecasePortfolio(portfolioData, 'en')],
  ['Compliance-Status', () => renderMeridianComplianceStatus(complianceData, 'de'), () => renderMeridianComplianceStatus(complianceData, 'en')],
  ['Roadmap-Status', () => renderMeridianRoadmapStatus(roadmapData, 'de'), () => renderMeridianRoadmapStatus(roadmapData, 'en')],
  ['Architektur-Status', () => renderMeridianArchitectureStatus(architectureData, 'de'), () => renderMeridianArchitectureStatus(architectureData, 'en')],
] as const)('MERIDIAN Phase 3 — %s (#225)', (_name, renderDe, renderEn) => {
  it('rendert DE ohne Fehler', async () => {
    expect(await isPdf(renderDe())).toBe(true)
  })
  it('rendert EN ohne Fehler', async () => {
    expect(await isPdf(renderEn())).toBe(true)
  })
})

describe('MERIDIAN Phase 3 — Leerzustände', () => {
  it('Use-Case-Portfolio: rendert ohne Fehler bei leerer Verteilung (0 Use-Cases pro Quadrant)', async () => {
    const empty: UsecasePortfolioData = { ...portfolioData, useCases: [], distribution: { quick_win: 0, strategic_bet: 0, low_hanging_fruit: 0, avoid: 0 } }
    expect(await isPdf(renderMeridianUsecasePortfolio(empty, 'de'))).toBe(true)
  })

  it('Compliance-Status: rendert Leerzustand ohne offene Pflichten', async () => {
    const empty: ComplianceStatusData = { ...complianceData, obligations: [], obligationsCompletedCount: 0, obligationsTotalCount: 0 }
    expect(await isPdf(renderMeridianComplianceStatus(empty, 'de'))).toBe(true)
  })

  it('Roadmap-Status: rendert ohne Vorjahreswert und ohne Score', async () => {
    const empty: RoadmapStatusData = { ...roadmapData, currentScore100: null, previousScore100: null }
    expect(await isPdf(renderMeridianRoadmapStatus(empty, 'de'))).toBe(true)
  })

  it('Architektur-Status: rendert ohne KI-Einordnung, ohne Entscheidungen, ohne Stack', async () => {
    const empty: ArchitectureStatusData = { ...architectureData, aiSummary: null, keyDecisions: [], nextSteps: [], layers: [] }
    expect(await isPdf(renderMeridianArchitectureStatus(empty, 'de'))).toBe(true)
  })
})

describe('MERIDIAN Gesamtdokument (full-report.tsx, #225)', () => {
  it('kombiniert mehrere verfügbare Reports mit fortlaufender Paginierung ohne Fehler', async () => {
    const doc = renderMeridianFullReport({
      executiveSummary: executiveSummaryData,
      readiness: readinessData,
      roadmapStatus: roadmapData,
    }, 'de')
    expect(await isPdf(doc)).toBe(true)
  })

  it('rendert nur die Executive Summary, wenn alle anderen Module fehlen', async () => {
    const doc = renderMeridianFullReport({ executiveSummary: executiveSummaryData }, 'de')
    expect(await isPdf(doc)).toBe(true)
  })

  it('rendert alle 6 Reports gemeinsam ohne Fehler', async () => {
    const doc = renderMeridianFullReport({
      executiveSummary: executiveSummaryData,
      readiness: readinessData,
      usecasePortfolio: portfolioData,
      complianceStatus: complianceData,
      roadmapStatus: roadmapData,
      architectureStatus: architectureData,
    }, 'de')
    expect(await isPdf(doc)).toBe(true)
  })
})

// 'next-intl' ist reines ESM und bricht in Jest sonst mit einer SyntaxError ab
// (siehe __mocks__/next-intl.js) — hier bewusst nur lokal aktiviert, nicht
// global über jest.config.ts, um bestehende (unabhängige) next-intl-Testsuiten
// nicht mit anzufassen.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock()-Factory wird gehoisted, ES-Import geht hier nicht
jest.mock('next-intl', () => require('../test-utils/next-intl-mock'))

import { renderMeridianExecutiveSummary } from '@/lib/pdf/meridian/reports/executive-summary'
import { computeEuAiActStatusV1, type ExecutiveSummaryData } from '@/lib/pdf/meridian/data/executive-summary'
import { renderPdf } from '@/lib/pdf/generate'

// Executive-Summary-Report (Issue #224) — Test-Gate laut CLAUDE.md ("Bei PDF/
// Export-Features: Integration-Test für die Template-Generierung"). Prüft
// sowohl den vollen Datensatz als auch alle Leerzustände (keine Use-Cases,
// kein Governance-Match, keine Roadmap-Maßnahmen, kein Vorjahreswert) — diese
// treten in der Praxis für neue Accounts mit gerade erst abgeschlossenem
// Assessment auf und dürfen nicht crashen.

const fullData: ExecutiveSummaryData = {
  companyName: 'Muster AG',
  generatedAt: '2026-07-18T00:00:00.000Z',
  overallScore100: 62,
  archetype: 'scaler',
  previousScore100: 51,
  dimensions: [
    { id: 'strategy', label: 'Strategie', score100: 72 },
    { id: 'tech', label: 'Technologie', score100: 65 },
    { id: 'culture', label: 'Kultur', score100: 58 },
    { id: 'skills', label: 'Skills', score100: 55 },
    { id: 'data', label: 'Daten', score100: 48 },
    { id: 'governance', label: 'Governance', score100: 41 },
  ],
  topUseCases: [
    { name: 'Angebotserstellung mit RAG', value100: 86, feasibility100: 78, quadrant: 'quick_win' },
    { name: 'Predictive Maintenance Linie 3', value100: 81, feasibility100: 55, quadrant: 'strategic_bet' },
    { name: 'Support-Copilot 1st-Level', value100: 62, feasibility100: 82, quadrant: 'low_hanging_fruit' },
  ],
  euAiActStatus: { highCount: 1, limitedCount: 4, minimalCount: 7, classifiedCount: 12, gapCount: 1 },
  next90Days: [
    'Data-Governance-Board etablieren',
    'Quick-Win-Pilot »Angebotserstellung« starten',
    'EU-AI-Act-Gap-Assessment abschließen',
  ],
}

const emptyData: ExecutiveSummaryData = {
  companyName: null,
  generatedAt: '2026-07-18T00:00:00.000Z',
  overallScore100: 30,
  archetype: 'starter',
  previousScore100: null,
  dimensions: fullData.dimensions.map(d => ({ ...d, score100: 20 })),
  topUseCases: [],
  euAiActStatus: null,
  next90Days: [],
}

async function isPdf(doc: ReturnType<typeof renderMeridianExecutiveSummary>): Promise<boolean> {
  const buf = await renderPdf({ document: doc, filename: 'test.pdf' })
  return buf.slice(0, 4).toString() === '%PDF'
}

describe('MERIDIAN Executive Summary — Report-Komponente (#224)', () => {
  it('rendert DE mit vollem Datensatz ohne Fehler', async () => {
    expect(await isPdf(renderMeridianExecutiveSummary(fullData, 'de'))).toBe(true)
  })

  it('rendert EN mit vollem Datensatz ohne Fehler', async () => {
    expect(await isPdf(renderMeridianExecutiveSummary(fullData, 'en'))).toBe(true)
  })

  it('rendert Leerzustand (keine Use-Cases, kein EU-AI-Act-Status, keine Roadmap, kein Vorjahreswert) ohne Fehler', async () => {
    expect(await isPdf(renderMeridianExecutiveSummary(emptyData, 'de'))).toBe(true)
  })

  it('rendert einen Archetyp ohne Gaps (alle Dimensionen ≥ 50) ohne Fehler', async () => {
    const cleanData: ExecutiveSummaryData = {
      ...fullData,
      dimensions: fullData.dimensions.map(d => ({ ...d, score100: 80 })),
    }
    expect(await isPdf(renderMeridianExecutiveSummary(cleanData, 'de'))).toBe(true)
  })

  it('rendert den Transformer-Archetyp ohne Fehler (dritte Archetyp-Variante)', async () => {
    expect(await isPdf(renderMeridianExecutiveSummary({ ...fullData, archetype: 'transformer' }, 'de'))).toBe(true)
  })
})

describe('computeEuAiActStatusV1 — Governance-Result als V1-Proxy (#224)', () => {
  it('gibt null zurück, wenn keine Use-Cases vorhanden sind', () => {
    expect(computeEuAiActStatusV1([])).toBeNull()
  })

  it('ordnet stop_dsgvo und stop_risk der Hochrisiko-Kategorie zu', () => {
    const result = computeEuAiActStatusV1([
      { governance_result: 'stop_dsgvo' },
      { governance_result: 'stop_risk' },
    ])
    expect(result).toEqual({ highCount: 2, limitedCount: 0, minimalCount: 0, classifiedCount: 2, gapCount: 0 })
  })

  it('ordnet improve als Begrenzt und approve als Minimal ein, unklassifizierte als Gap', () => {
    const result = computeEuAiActStatusV1([
      { governance_result: 'improve' },
      { governance_result: 'approve' },
      { governance_result: null },
    ])
    expect(result).toEqual({ highCount: 0, limitedCount: 1, minimalCount: 1, classifiedCount: 2, gapCount: 1 })
  })
})

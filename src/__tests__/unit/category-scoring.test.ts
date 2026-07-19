/**
 * @jest-environment node
 */
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { computeCategoryProgress } from '@/lib/compliance/category-scoring'
import { DSGVO_CHECKLIST, EU_AI_ACT_OBLIGATIONS, ADDITIONAL_REGULATIONS } from '@/config/compliance-data'

const mockCreateClient = createClient as jest.Mock

function mockChecks(rows: Array<{ regulation: string; check_type: string; status: string }>) {
  mockCreateClient.mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          in: () => Promise.resolve({ data: rows }),
        }),
      }),
    }),
  })
}

describe('computeCategoryProgress — kontoweiter Fortschritt je Compliance-Kategorie', () => {
  beforeEach(() => jest.clearAllMocks())

  it('berechnet den DSGVO-Fortschritt aus compliance_checks (regulation=dsgvo, status=compliant)', async () => {
    const firstTwoIds = DSGVO_CHECKLIST.slice(0, 2).map(i => i.id)
    mockChecks(firstTwoIds.map(id => ({ regulation: 'dsgvo', check_type: id, status: 'compliant' })))

    const progress = await computeCategoryProgress('user-1')
    const dsgvo = progress.get('DSGVO relevant')
    expect(dsgvo).toEqual({
      completed: 2,
      total: DSGVO_CHECKLIST.length,
      pct: Math.round((2 / DSGVO_CHECKLIST.length) * 100),
    })
  })

  it('zählt nur status=compliant als erledigt, nicht partial/pending', async () => {
    mockChecks([
      { regulation: 'dsgvo', check_type: DSGVO_CHECKLIST[0].id, status: 'compliant' },
      { regulation: 'dsgvo', check_type: DSGVO_CHECKLIST[1].id, status: 'partial' },
      { regulation: 'dsgvo', check_type: DSGVO_CHECKLIST[2].id, status: 'pending' },
    ])

    const progress = await computeCategoryProgress('user-1')
    expect(progress.get('DSGVO relevant')?.completed).toBe(1)
  })

  it('liefert 0 % für eine Kategorie ohne jegliche gespeicherte compliance_checks-Zeile', async () => {
    mockChecks([])
    const progress = await computeCategoryProgress('user-1')
    expect(progress.get('NIS2 / KRITIS relevant')).toEqual({
      completed: 0,
      total: ADDITIONAL_REGULATIONS.find(r => r.id === 'nis2')!.items.length,
      pct: 0,
    })
  })

  it('enthält KEINE Kategorien ohne echte Checkliste (Gesundheitsdaten/MDR, EU-Hosting) — kein erfundener Zuschlag möglich', async () => {
    mockChecks([])
    const progress = await computeCategoryProgress('user-1')
    expect(progress.has('Gesundheitsdaten / MDR relevant')).toBe(false)
    expect(progress.has('EU-Hosting / Datensouveränität')).toBe(false)
  })

  it('berechnet den EU-AI-Act-Fortschritt aus EU_AI_ACT_OBLIGATIONS.high', async () => {
    mockChecks([])
    const progress = await computeCategoryProgress('user-1')
    expect(progress.get('EU AI Act relevant')?.total).toBe(EU_AI_ACT_OBLIGATIONS.high.length)
  })
})

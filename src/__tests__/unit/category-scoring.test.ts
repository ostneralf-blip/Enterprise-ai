/**
 * @jest-environment node
 */
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { computeRegulationProgress } from '@/lib/compliance/category-scoring'
import { DSGVO_CHECKLIST, EU_AI_ACT_OBLIGATIONS, ADDITIONAL_REGULATIONS } from '@/config/compliance-data'

const mockCreateClient = createClient as jest.Mock

function mockChecks(rows: Array<{ regulation: string; check_type: string; status: string; notes?: string | null }>) {
  mockCreateClient.mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: rows.map(r => ({ notes: null, ...r })) }),
      }),
    }),
  })
}

describe('computeRegulationProgress — Fortschritt je aktivierter Regularie', () => {
  beforeEach(() => jest.clearAllMocks())

  it('enthält immer DSGVO und EU AI Act als Kern-Regularien, auch ohne aktivierte Zusätze', async () => {
    mockChecks([])
    const progress = await computeRegulationProgress('user-1')
    const ids = progress.map(p => p.id)
    expect(ids).toContain('dsgvo')
    expect(ids).toContain('eu_ai_act')
  })

  it('nimmt zusätzliche Regularien nur auf, wenn sie in der active_regulations-Meta-Zeile stehen', async () => {
    mockChecks([
      { regulation: 'system', check_type: 'active_regulations', status: 'compliant', notes: JSON.stringify(['nis2']) },
    ])
    const progress = await computeRegulationProgress('user-1')
    const ids = progress.map(p => p.id)
    expect(ids).toContain('nis2')
    expect(ids).not.toContain('iso_27001')
  })

  it('berechnet den DSGVO-Fortschritt aus compliance_checks (nur status=compliant zählt)', async () => {
    const ids = DSGVO_CHECKLIST.slice(0, 3).map(i => i.id)
    mockChecks([
      { regulation: 'dsgvo', check_type: ids[0], status: 'compliant' },
      { regulation: 'dsgvo', check_type: ids[1], status: 'compliant' },
      { regulation: 'dsgvo', check_type: ids[2], status: 'non_compliant' },
    ])
    const progress = await computeRegulationProgress('user-1')
    const dsgvo = progress.find(p => p.id === 'dsgvo')
    expect(dsgvo).toMatchObject({ completed: 2, total: DSGVO_CHECKLIST.length })
    expect(dsgvo?.pct).toBe(Math.round((2 / DSGVO_CHECKLIST.length) * 100))
  })

  it('berechnet den NIS2-Fortschritt korrekt, wenn NIS2 aktiviert ist', async () => {
    const nis2 = ADDITIONAL_REGULATIONS.find(r => r.id === 'nis2')!
    mockChecks([
      { regulation: 'system', check_type: 'active_regulations', status: 'compliant', notes: JSON.stringify(['nis2']) },
      { regulation: 'nis2', check_type: nis2.items[0].id, status: 'compliant' },
    ])
    const progress = await computeRegulationProgress('user-1')
    expect(progress.find(p => p.id === 'nis2')).toMatchObject({ completed: 1, total: nis2.items.length })
  })

  it('nutzt EU_AI_ACT_OBLIGATIONS.high als EU-AI-Act-Checkliste', async () => {
    mockChecks([])
    const progress = await computeRegulationProgress('user-1')
    expect(progress.find(p => p.id === 'eu_ai_act')?.total).toBe(EU_AI_ACT_OBLIGATIONS.high.length)
  })

  it('ignoriert eine kaputte active_regulations-Notes-JSON ohne zu crashen', async () => {
    mockChecks([
      { regulation: 'system', check_type: 'active_regulations', status: 'compliant', notes: 'not-json' },
    ])
    const progress = await computeRegulationProgress('user-1')
    // Nur die beiden Kern-Regularien, keine Zusätze
    expect(progress.map(p => p.id).sort()).toEqual(['dsgvo', 'eu_ai_act'])
  })
})

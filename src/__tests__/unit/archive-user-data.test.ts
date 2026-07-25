import { archiveUserData } from '@/lib/account/archive-user-data'
import type { SupabaseClient } from '@supabase/supabase-js'

// #261: Der Archivierungs-Helper muss die inhaltlichen Daten kopieren, dabei aber
// JEDEN direkten Nutzerbezug (user_id/portfolio_id/canvas_id/Original-id) weglassen.
// Der Mock protokolliert die Insert-Payloads pro historischer Tabelle.

interface Captured {
  historical_use_cases: Record<string, unknown>[]
  historical_architectures: Record<string, unknown>[]
}

function makeMockClient(seed: {
  portfolios: { id: string }[]
  useCases: Record<string, unknown>[]
  architectures: Record<string, unknown>[]
}): { client: SupabaseClient; captured: Captured } {
  const captured: Captured = { historical_use_cases: [], historical_architectures: [] }

  const client = {
    from(table: string) {
      if (table === 'uc_portfolios') {
        return { select: () => ({ eq: async () => ({ data: seed.portfolios, error: null }) }) }
      }
      if (table === 'use_cases') {
        return { select: () => ({ in: async () => ({ data: seed.useCases, error: null }) }) }
      }
      if (table === 'architectures') {
        return { select: () => ({ eq: async () => ({ data: seed.architectures, error: null }) }) }
      }
      if (table === 'historical_use_cases' || table === 'historical_architectures') {
        return {
          insert: async (rows: Record<string, unknown>[]) => {
            captured[table as keyof Captured].push(...rows)
            return { error: null }
          },
        }
      }
      throw new Error(`unexpected table ${table}`)
    },
  } as unknown as SupabaseClient

  return { client, captured }
}

describe('archiveUserData (#261 Anonymisierung)', () => {
  it('kopiert inhaltliche Felder, aber niemals user_id/portfolio_id/id', async () => {
    const { client, captured } = makeMockClient({
      portfolios: [{ id: 'pf-1' }],
      useCases: [{
        id: 'uc-1', portfolio_id: 'pf-1', canvas_id: 'cv-1', user_id: 'user-1',
        name: 'Rechnungsprüfung', domain: 'Finance', description: 'Test',
        scores: { impact: 4 }, weighted_score: 3.5, quadrant: 'quick_win',
        archetype: 'starter', created_at: '2026-01-01T00:00:00.000Z',
      }],
      architectures: [{
        id: 'ar-1', user_id: 'user-1', title: 'Meine Architektur',
        wizard_data: { a: 1 }, result: { components: ['X'] },
        ai_narrative: { exec: { summary: 's' } }, narrative_locale: 'de',
        created_at: '2026-02-02T00:00:00.000Z',
      }],
    })

    const res = await archiveUserData(client, 'user-1')
    expect(res).toEqual({ useCases: 1, architectures: 1 })

    const uc = captured.historical_use_cases[0]
    expect(uc.name).toBe('Rechnungsprüfung')
    expect(uc.original_created_at).toBe('2026-01-01T00:00:00.000Z')
    // Kein direkter Nutzerbezug übertragen:
    for (const forbidden of ['id', 'user_id', 'portfolio_id', 'canvas_id']) {
      expect(uc).not.toHaveProperty(forbidden)
    }

    const arch = captured.historical_architectures[0]
    expect(arch.title).toBe('Meine Architektur')
    expect(arch.narrative_locale).toBe('de')
    for (const forbidden of ['id', 'user_id']) {
      expect(arch).not.toHaveProperty(forbidden)
    }
  })

  it('archiviert nichts, wenn der Nutzer keine Portfolios/Architekturen hat', async () => {
    const { client, captured } = makeMockClient({ portfolios: [], useCases: [], architectures: [] })
    const res = await archiveUserData(client, 'user-empty')
    expect(res).toEqual({ useCases: 0, architectures: 0 })
    expect(captured.historical_use_cases).toHaveLength(0)
    expect(captured.historical_architectures).toHaveLength(0)
  })
})

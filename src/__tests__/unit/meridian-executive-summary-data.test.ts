/**
 * @jest-environment node
 */
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getExecutiveSummaryData } from '@/lib/pdf/meridian/data/executive-summary'

const mockCreateClient = createClient as jest.Mock

// Chainable Query-Builder-Attrappe: jede Kettenmethode gibt sich selbst zurück,
// `.then()` macht sie awaitbar wie ein echtes Supabase-Query (für Aufrufe ohne
// abschließendes .single()/.maybeSingle(), z. B. die use_cases-Liste).
function queryBuilder(result: { data: unknown }) {
  const builder = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    maybeSingle: () => Promise.resolve(result),
    single: () => Promise.resolve(result),
    then: (resolve: (r: { data: unknown }) => void) => resolve(result),
  }
  return builder
}

function mockSupabase(tables: Record<string, { data: unknown }>) {
  mockCreateClient.mockResolvedValue({
    from: (table: string) => queryBuilder(tables[table] ?? { data: null }),
  })
}

const BASE_TABLES = {
  profiles: { data: { company: 'Muster AG' } },
  assessment_sessions: {
    data: [{ archetype: 'scaler', total_score: 3.1, dim_scores: { data: 2.4, skills: 2.75, governance: 2.05, tech: 3.25, strategy: 3.6, culture: 2.9 }, created_at: '2026-07-18T00:00:00.000Z' }],
  },
  uc_portfolios: { data: { id: 'portfolio-1' } },
  use_cases: { data: [] },
}

describe('getExecutiveSummaryData — roadmap-Aktionen (Regression: React-Fehler #31)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('löst { de, en }-Objekte in roadmaps.phases[].actions[].label zu Strings auf, statt sie roh durchzureichen', async () => {
    // Reproduziert exakt die reale Persistenzform: RoadmapPageClient.handleSave
    // übernimmt `...roadmap[phaseId]` unverändert aus ROADMAPS[archetype]
    // (config/roadmap-data.ts), wo `label` ein { de, en }-LocaleString ist —
    // ohne Auflösung crasht react-pdf mit "Objects are not valid as a React
    // child" (Minified React error #31), sobald die Report-Komponente das
    // Objekt roh in einen <Text>-Knoten rendert.
    mockSupabase({
      ...BASE_TABLES,
      roadmaps: {
        data: {
          phases: [
            {
              actions: [
                { label: { de: 'Data-Governance-Board etablieren', en: 'Establish data governance board' } },
                { label: 'Bereits aufgelöster String' },
              ],
            },
          ],
        },
      },
    })

    const result = await getExecutiveSummaryData('user-1', 'de')

    expect(result).not.toBeNull()
    expect(result!.next90Days).toEqual([
      'Data-Governance-Board etablieren',
      'Bereits aufgelöster String',
    ])
    result!.next90Days.forEach(action => expect(typeof action).toBe('string'))
  })

  it('löst dieselben Aktionen für locale=en auf den englischen Text auf', async () => {
    mockSupabase({
      ...BASE_TABLES,
      roadmaps: {
        data: { phases: [{ actions: [{ label: { de: 'Deutscher Text', en: 'English text' } }] }] },
      },
    })

    const result = await getExecutiveSummaryData('user-1', 'en')
    expect(result!.next90Days).toEqual(['English text'])
  })

  it('gibt eine leere Liste zurück, wenn keine Roadmap existiert (kein Crash)', async () => {
    mockSupabase({ ...BASE_TABLES, roadmaps: { data: null } })
    const result = await getExecutiveSummaryData('user-1', 'de')
    expect(result!.next90Days).toEqual([])
  })

  it('gibt null zurück, wenn kein abgeschlossenes Assessment existiert', async () => {
    mockSupabase({ ...BASE_TABLES, assessment_sessions: { data: [] } })
    const result = await getExecutiveSummaryData('user-1', 'de')
    expect(result).toBeNull()
  })
})

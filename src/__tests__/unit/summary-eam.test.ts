import { loadSummaryEamData } from '@/lib/architecture/summary-eam'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CatalogComponent } from '@/types'

jest.mock('server-only', () => ({}))

// Minimaler, aber für runEamValidation/getSelectionStats ausreichender Katalog-Eintrag.
function comp(name: string, layer: string): CatalogComponent {
  return {
    id: name, name, vendor: null, architecture_layer: layer,
    hosting: ['cloud', 'eu'], cloud_provider: null,
    dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
    aliases: [], requires: [], suggests: [], incompatible_with: [],
    description: null, is_active: true, tags: [],
  } as unknown as CatalogComponent
}

const arch = {
  result: {
    patternId: 'p1', pattern: 'Test-Muster', summary: '', color: { bg: '', border: '', badge: '', title: '' },
    layers: [{ name: 'Daten', role: '', components: ['Snowflake', 'Kafka'], examples: '' }],
    keyDecisions: [], nextSteps: [],
    selectedComponents: ['Snowflake', 'Kafka'],
    componentSources: { Kafka: 'ai' },
    rasic: { phases: ['konzeption'], entries: [{ role: 'Data Engineer', assignments: {} }, { role: 'SAP AI Architect', assignments: {} }] },
  },
  wizard_data: { compliance: 'moderate' },
  ai_narrative: { exec: { decision_recommendation: 'Das Kernrisiko liegt in der späten Governance-Integration.' } },
  narrative_locale: 'de',
}

function makeSupabase(archRow: unknown): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({ limit: () => ({ maybeSingle: async () => ({ data: archRow }) }) }),
        }),
      }),
    }),
  } as unknown as SupabaseClient
}

function makeAdmin(rows: CatalogComponent[]): SupabaseClient {
  return {
    from: () => ({ select: () => ({ in: async () => ({ data: rows }) }) }),
  } as unknown as SupabaseClient
}

describe('loadSummaryEamData (Executive-Summary EAM)', () => {
  const catalog = [comp('Snowflake', 'data'), comp('Kafka', 'data')]

  it('rekonstruiert aktive Komponenten, Rollen und Zähler', async () => {
    const res = await loadSummaryEamData(makeSupabase(arch), makeAdmin(catalog), 'u1', 'de')
    expect(res).not.toBeNull()
    expect(res!.activeComponents.map(c => c.name).sort()).toEqual(['Kafka', 'Snowflake'])
    expect(res!.roleNames).toEqual(['Data Engineer', 'SAP AI Architect'])
    expect(res!.activeCount).toBe(2)
    // Kafka ist als 'ai' markiert → 1 Regel-Komponente (Snowflake), 1 ergänzt (Kafka).
    expect(res!.ruleComps).toBe(1)
    expect(res!.addComps).toBe(1)
  })

  it('zeigt die KI-Empfehlung bei passender Sprache', async () => {
    const res = await loadSummaryEamData(makeSupabase(arch), makeAdmin(catalog), 'u1', 'de')
    expect(res!.decisionRecommendation).toContain('Kernrisiko')
  })

  it('unterdrückt die KI-Empfehlung bei Sprach-Mismatch', async () => {
    const res = await loadSummaryEamData(makeSupabase(arch), makeAdmin(catalog), 'u1', 'en')
    expect(res!.decisionRecommendation).toBeNull()
  })

  it('gibt null zurück, wenn keine Architektur existiert', async () => {
    const res = await loadSummaryEamData(makeSupabase(null), makeAdmin(catalog), 'u1', 'de')
    expect(res).toBeNull()
  })
})

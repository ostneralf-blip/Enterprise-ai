import { catalogEdges } from '@/lib/architecture/catalog-edges'
import type { CatalogComponent } from '@/types'

function comp(name: string, extra: Partial<CatalogComponent> = {}): CatalogComponent {
  return {
    id: name, name, vendor: null, category: null, architecture_layer: 'application', hosting: [],
    dsgvo_status: null, eu_ai_act_risk: null, sap_compatible: false, sap_components: [],
    use_case_types: [], infra_types: [], cloud_provider: null, icon_name: null, website_url: null,
    description: null, tags: [], incompatible_with: [], requires: [], suggests: [], aliases: [],
    source: 'seed', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01',
    ...extra,
  }
}

describe('catalog-edges', () => {
  it('erzeugt requires-Kanten nur zwischen aktiven Bausteinen', () => {
    const comps = [comp('A', { requires: ['B', 'X'] }), comp('B')]
    const { edges } = catalogEdges(comps)
    expect(edges).toEqual([{ from: 'A', to: 'B', kind: 'requires' }]) // X ist nicht aktiv
  })

  it('erzeugt suggests-Kanten (gepunktet) getrennt von requires', () => {
    const comps = [comp('A', { suggests: ['B'] }), comp('B')]
    const { edges } = catalogEdges(comps)
    expect(edges).toEqual([{ from: 'A', to: 'B', kind: 'suggests' }])
  })

  it('dedupliziert identische Kanten', () => {
    const comps = [comp('A', { requires: ['B', 'B'] }), comp('B')]
    const { edges } = catalogEdges(comps)
    expect(edges).toHaveLength(1)
  })

  it('ignoriert Selbstkanten', () => {
    const comps = [comp('A', { requires: ['A'] })]
    const { edges } = catalogEdges(comps)
    expect(edges).toHaveLength(0)
  })

  it('erkennt incompatible_with als Konflikt (ungerichtet, dedupliziert)', () => {
    const comps = [comp('A', { incompatible_with: ['B'] }), comp('B', { incompatible_with: ['A'] })]
    const { conflicts } = catalogEdges(comps)
    expect(conflicts).toEqual([{ a: 'A', b: 'B' }])
  })

  it('kein Konflikt wenn Gegenstück nicht aktiv', () => {
    const comps = [comp('A', { incompatible_with: ['Z'] })]
    const { conflicts } = catalogEdges(comps)
    expect(conflicts).toHaveLength(0)
  })
})

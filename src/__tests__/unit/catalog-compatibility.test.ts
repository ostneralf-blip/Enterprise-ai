import { findConflicts, findSuggestions } from '@/lib/utils/catalog-compatibility'
import type { CatalogComponent } from '@/types'

function makeComp(name: string, overrides: Partial<CatalogComponent> = {}): CatalogComponent {
  return {
    id: name,
    name,
    vendor: null,
    category: null,
    description: null,
    website_url: null,
    icon_name: null,
    architecture_layer: 'model',
    cloud_provider: 'independent',
    hosting: [],
    infra_types: [],
    use_case_types: [],
    sap_compatible: false,
    sap_components: [],
    tags: [],
    incompatible_with: [],
    requires: [],
    suggests: [],
    aliases: [],
    source: 'manual',
    is_active: true,
    eu_ai_act_risk: null,
    dsgvo_status: 'compliant',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('findConflicts', () => {
  it('gibt [] zurück wenn keine Komponenten ausgewählt', () => {
    const byName = { 'SAP AI Core': makeComp('SAP AI Core', { incompatible_with: ['vLLM'] }) }
    expect(findConflicts(new Set(), byName)).toEqual([])
  })

  it('erkennt Konflikt wenn A.incompatible_with B enthält', () => {
    const byName = {
      'SAP AI Core': makeComp('SAP AI Core', { incompatible_with: ['vLLM'] }),
      'vLLM':        makeComp('vLLM'),
    }
    const result = findConflicts(new Set(['SAP AI Core', 'vLLM']), byName)
    expect(result).toHaveLength(1)
    expect(result[0].a).toBe('SAP AI Core')
    expect(result[0].b).toBe('vLLM')
  })

  it('erkennt Konflikt bidirektional — auch wenn nur B.incompatible_with A', () => {
    const byName = {
      'SAP AI Core': makeComp('SAP AI Core'),
      'vLLM':        makeComp('vLLM', { incompatible_with: ['SAP AI Core'] }),
    }
    const result = findConflicts(new Set(['SAP AI Core', 'vLLM']), byName)
    expect(result).toHaveLength(1)
  })

  it('meldet keinen Konflikt wenn inkompatible Komponente nicht ausgewählt', () => {
    const byName = {
      'SAP AI Core': makeComp('SAP AI Core', { incompatible_with: ['vLLM'] }),
      'vLLM':        makeComp('vLLM'),
    }
    expect(findConflicts(new Set(['SAP AI Core']), byName)).toEqual([])
  })

  it('enthält alternatives aus suggests der beteiligten Komponenten', () => {
    const byName = {
      'SAP AI Core': makeComp('SAP AI Core', {
        incompatible_with: ['vLLM'],
        suggests: ['SAP GenAI Hub'],
      }),
      'vLLM': makeComp('vLLM'),
    }
    const result = findConflicts(new Set(['SAP AI Core', 'vLLM']), byName)
    expect(result[0].alternatives).toContain('SAP GenAI Hub')
  })

  it('gibt keinen doppelten Konflikt zurück wenn beide Seiten incompatible_with setzen', () => {
    const byName = {
      'A': makeComp('A', { incompatible_with: ['B'] }),
      'B': makeComp('B', { incompatible_with: ['A'] }),
    }
    const result = findConflicts(new Set(['A', 'B']), byName)
    expect(result).toHaveLength(1)
  })
})

describe('findSuggestions', () => {
  it('gibt [] zurück wenn keine Komponenten ausgewählt', () => {
    expect(findSuggestions(new Set(), {})).toEqual([])
  })

  it('gibt Vorschlag zurück für ausgewählte Komponente mit suggests', () => {
    const byName = {
      'SAP AI Core': makeComp('SAP AI Core', { suggests: ['SAP HANA Cloud'] }),
      'SAP HANA Cloud': makeComp('SAP HANA Cloud'),
    }
    const result = findSuggestions(new Set(['SAP AI Core']), byName)
    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('SAP AI Core')
    expect(result[0].target).toBe('SAP HANA Cloud')
  })

  it('schließt bereits ausgewählte Komponenten aus den Vorschlägen aus', () => {
    const byName = {
      'SAP AI Core': makeComp('SAP AI Core', { suggests: ['SAP HANA Cloud'] }),
      'SAP HANA Cloud': makeComp('SAP HANA Cloud'),
    }
    const result = findSuggestions(new Set(['SAP AI Core', 'SAP HANA Cloud']), byName)
    expect(result).toHaveLength(0)
  })

  it('gibt keine Duplikate zurück wenn mehrere Komponenten dasselbe vorschlagen', () => {
    const byName = {
      'A': makeComp('A', { suggests: ['C'] }),
      'B': makeComp('B', { suggests: ['C'] }),
      'C': makeComp('C'),
    }
    const result = findSuggestions(new Set(['A', 'B']), byName)
    expect(result.filter(s => s.target === 'C')).toHaveLength(1)
  })
})

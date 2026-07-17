import { findConflicts } from '@/lib/utils/catalog-compatibility'
import type { CatalogComponent } from '@/types'

function makeComp(name: string, overrides: Partial<CatalogComponent> = {}): CatalogComponent {
  return {
    id: name,
    name,
    vendor: 'Test',
    category: 'test',
    architecture_layer: 'application',
    hosting: ['cloud'],
    dsgvo_status: 'compliant',
    eu_ai_act_risk: 'minimal',
    sap_compatible: false,
    use_case_types: [],
    infra_types: ['cloud'],
    cloud_provider: 'independent',
    tags: [],
    suggests: [],
    incompatible_with: [],
    capability: null,
    ...overrides,
  } as unknown as CatalogComponent
}

describe('findConflicts', () => {
  it('gibt keine Konflikte zurück wenn alle Komponenten unterschiedliche Capabilities haben', () => {
    const byName = {
      'A': makeComp('A', { capability: 'api_gateway' }),
      'B': makeComp('B', { capability: 'primary_idp' }),
    }
    const result = findConflicts(new Set(['A', 'B']), byName)
    expect(result).toHaveLength(0)
  })

  it('erkennt Capability-Konflikt: 2 API-Gateway-Komponenten aus DB', () => {
    const byName = {
      'Kong Gateway': makeComp('Kong Gateway', { capability: 'api_gateway', suggests: ['Azure API Management'] }),
      'AWS API Gateway': makeComp('AWS API Gateway', { capability: 'api_gateway', suggests: ['Kong Gateway'] }),
    }
    const result = findConflicts(new Set(['Kong Gateway', 'AWS API Gateway']), byName)
    expect(result).toHaveLength(1)
    expect(result[0].a).toBeDefined()
    expect(result[0].b).toBeDefined()
  })

  it('erkennt Konflikt über KNOWN_CAPABILITY_GROUPS-Fallback wenn DB capability=null', () => {
    const byName = {
      'Kong Gateway': makeComp('Kong Gateway', { capability: null }),
      'Azure API Management': makeComp('Azure API Management', { capability: null }),
    }
    const result = findConflicts(new Set(['Kong Gateway', 'Azure API Management']), byName)
    expect(result).toHaveLength(1)
  })

  it('erkennt IdP-Konflikt über Fallback: Keycloak + Microsoft Entra ID', () => {
    const byName = {
      'Keycloak': makeComp('Keycloak', { capability: null }),
      'Microsoft Entra ID': makeComp('Microsoft Entra ID', { capability: null }),
    }
    const result = findConflicts(new Set(['Keycloak', 'Microsoft Entra ID']), byName)
    expect(result).toHaveLength(1)
  })

  it('erkennt expliziten incompatible_with-Konflikt unabhängig von Capability', () => {
    const byName = {
      'X': makeComp('X', { incompatible_with: ['Y'] }),
      'Y': makeComp('Y', { incompatible_with: [] }),
    }
    const result = findConflicts(new Set(['X', 'Y']), byName)
    expect(result).toHaveLength(1)
  })

  it('gibt Alternativen aus suggests beider Parteien zurück', () => {
    const byName = {
      'Kong Gateway': makeComp('Kong Gateway', { capability: null, suggests: ['Azure API Management'] }),
      'AWS API Gateway': makeComp('AWS API Gateway', { capability: null, suggests: ['Kong Gateway'] }),
      'Azure API Management': makeComp('Azure API Management', { capability: null }),
    }
    const result = findConflicts(new Set(['Kong Gateway', 'AWS API Gateway']), byName)
    expect(result[0].alternatives).toContain('Azure API Management')
  })
})

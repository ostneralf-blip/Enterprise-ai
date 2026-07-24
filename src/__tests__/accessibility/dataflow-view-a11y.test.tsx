/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('next-intl', () => require('../test-utils/next-intl-mock'))
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { DataFlowView } from '@/components/modules/architecture/diagram/DataFlowView'
import type { CatalogComponent } from '@/types'

expect.extend(toHaveNoViolations)

function comp(id: string, name: string, layer: CatalogComponent['architecture_layer']): CatalogComponent {
  return {
    id, name, vendor: 'ACME', category: null, architecture_layer: layer, hosting: [],
    dsgvo_status: null, eu_ai_act_risk: null, sap_compatible: false, sap_components: [],
    use_case_types: [], infra_types: [], cloud_provider: null, icon_name: null, website_url: null,
    description: null, tags: [], incompatible_with: [], requires: [], suggests: [], aliases: [],
    source: 'seed', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01',
  }
}

describe('Accessibility: DataFlowView', () => {
  it('mit Bausteinen barrierefrei', async () => {
    const comps = [
      comp('1', 'S3', 'data'),
      comp('2', 'SageMaker', 'model'),
      comp('3', 'Web-App', 'application'),
      comp('4', 'IAM', 'security'),
    ]
    const { container } = render(<DataFlowView activeComponents={comps} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('leerer Zustand barrierefrei', async () => {
    const { container } = render(<DataFlowView activeComponents={[]} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

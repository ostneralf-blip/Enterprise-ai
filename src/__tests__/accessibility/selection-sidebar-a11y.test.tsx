import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { SelectionSidebar } from '@/components/modules/SelectionSidebar'
import type { CatalogComponent } from '@/types'
import type { Conflict, Suggestion } from '@/lib/utils/catalog-compatibility'

expect.extend(toHaveNoViolations)

function makeComp(name: string): CatalogComponent {
  return {
    id: name,
    name,
    vendor: 'Testvendor',
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
    source: 'manual',
    is_active: true,
    eu_ai_act_risk: null,
    dsgvo_status: 'compliant',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

const BY_NAME = {
  'SAP AI Core':    makeComp('SAP AI Core'),
  'SAP HANA Cloud': makeComp('SAP HANA Cloud'),
  'vLLM':           makeComp('vLLM'),
}

const NO_CONFLICTS: Conflict[]   = []
const NO_SUGGESTIONS: Suggestion[] = []

describe('Accessibility: SelectionSidebar', () => {
  it('leere Auswahl hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(
      <SelectionSidebar
        checked={new Set()}
        byName={BY_NAME}
        conflicts={NO_CONFLICTS}
        suggestions={NO_SUGGESTIONS}
        onAddComponent={jest.fn()}
        onRemoveComponent={jest.fn()}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('eine ausgewählte Komponente hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(
      <SelectionSidebar
        checked={new Set(['SAP AI Core'])}
        byName={BY_NAME}
        conflicts={NO_CONFLICTS}
        suggestions={NO_SUGGESTIONS}
        onAddComponent={jest.fn()}
        onRemoveComponent={jest.fn()}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Konflikt-Ansicht hat keine WCAG-Verstöße (axe-core)', async () => {
    const conflicts: Conflict[] = [
      { a: 'SAP AI Core', b: 'vLLM', alternatives: ['SAP HANA Cloud'] },
    ]
    const { container } = render(
      <SelectionSidebar
        checked={new Set(['SAP AI Core', 'vLLM'])}
        byName={BY_NAME}
        conflicts={conflicts}
        suggestions={NO_SUGGESTIONS}
        onAddComponent={jest.fn()}
        onRemoveComponent={jest.fn()}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Vorschlag-Ansicht hat keine WCAG-Verstöße (axe-core)', async () => {
    const suggestions: Suggestion[] = [
      { source: 'SAP AI Core', target: 'SAP HANA Cloud' },
    ]
    const { container } = render(
      <SelectionSidebar
        checked={new Set(['SAP AI Core'])}
        byName={BY_NAME}
        conflicts={NO_CONFLICTS}
        suggestions={suggestions}
        onAddComponent={jest.fn()}
        onRemoveComponent={jest.fn()}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Sidebar hat aria-label "Meine Architektur"', () => {
    render(
      <SelectionSidebar
        checked={new Set(['SAP AI Core'])}
        byName={BY_NAME}
        conflicts={NO_CONFLICTS}
        suggestions={NO_SUGGESTIONS}
        onAddComponent={jest.fn()}
        onRemoveComponent={jest.fn()}
      />
    )
    expect(screen.getByRole('complementary', { name: 'Meine Architektur' })).toBeInTheDocument()
  })

  it('Entfernen-Button hat aria-label', () => {
    render(
      <SelectionSidebar
        checked={new Set(['SAP AI Core'])}
        byName={BY_NAME}
        conflicts={NO_CONFLICTS}
        suggestions={NO_SUGGESTIONS}
        onAddComponent={jest.fn()}
        onRemoveComponent={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'SAP AI Core abwählen' })).toBeInTheDocument()
  })
})

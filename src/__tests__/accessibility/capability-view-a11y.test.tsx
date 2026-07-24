import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { CapabilityView } from '@/components/modules/architecture/diagram/CapabilityView'

expect.extend(toHaveNoViolations)

describe('Accessibility: CapabilityView', () => {
  it('CapabilityView ist barrierefrei', async () => {
    const groups = [{ domain: 'Vertrieb', tiles: [{ id: '1', name: 'Lead-Scoring', level: 4 as const }] }]
    const { container } = render(<CapabilityView groups={groups} emptyLabel="leer" />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('zeigt emptyLabel bei leeren groups', () => {
    const { getByText } = render(<CapabilityView groups={[]} emptyLabel="Keine Ergebnisse" />)
    expect(getByText('Keine Ergebnisse')).toBeInTheDocument()
  })
})

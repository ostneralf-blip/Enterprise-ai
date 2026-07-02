import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { CompliancePageClient } from '@/app/(dashboard)/compliance/CompliancePageClient'

expect.extend(toHaveNoViolations)

Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: jest.fn().mockResolvedValue(undefined) },
  configurable: true,
})

const EMPTY_CHECKS = { initialChecks: [] as never[] }

describe('Accessibility: Compliance Center', () => {

  it('EU AI Act-Tab hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<CompliancePageClient {...EMPTY_CHECKS} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Tab-Navigation hat role="tablist" und role="tab"', () => {
    render(<CompliancePageClient {...EMPTY_CHECKS} />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(6)
  })

  it('aktiver Tab hat aria-selected="true"', () => {
    render(<CompliancePageClient {...EMPTY_CHECKS} />)
    expect(screen.getByRole('tab', { name: 'EU AI Act' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'DSGVO' })).toHaveAttribute('aria-selected', 'false')
  })

  it('Tab-Wechsel zu DSGVO aktualisiert aria-selected', () => {
    render(<CompliancePageClient {...EMPTY_CHECKS} />)
    fireEvent.click(screen.getByRole('tab', { name: 'DSGVO' }))
    expect(screen.getByRole('tab', { name: 'DSGVO' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'EU AI Act' })).toHaveAttribute('aria-selected', 'false')
  })

  it('aktives Tab-Panel hat role="tabpanel"', () => {
    render(<CompliancePageClient {...EMPTY_CHECKS} />)
    expect(screen.getByRole('tabpanel')).toBeInTheDocument()
  })

  it('DSGVO-Tab hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<CompliancePageClient {...EMPTY_CHECKS} />)
    fireEvent.click(screen.getByRole('tab', { name: 'DSGVO' }))
    expect(await axe(container)).toHaveNoViolations()
  })

  it('DSGVO-Checkliste zeigt Checkboxen mit Labels', () => {
    render(<CompliancePageClient {...EMPTY_CHECKS} />)
    fireEvent.click(screen.getByRole('tab', { name: 'DSGVO' }))
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThanOrEqual(10)
  })

  it('DSGVO-Progressbar ist zugänglich', () => {
    render(<CompliancePageClient {...EMPTY_CHECKS} />)
    fireEvent.click(screen.getByRole('tab', { name: 'DSGVO' }))
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '0')
    expect(progressbar).toHaveAttribute('aria-valuemin', '0')
    expect(progressbar).toHaveAttribute('aria-valuemax')
  })

  it('Risikomatrix-Tab hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<CompliancePageClient {...EMPTY_CHECKS} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Risikomatrix' }))
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Risikomatrix zeigt Impact- und Probability-Buttons', () => {
    render(<CompliancePageClient {...EMPTY_CHECKS} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Risikomatrix' }))
    const buttons = screen.getAllByRole('button')
    // 4 impact + 4 probability buttons
    expect(buttons.length).toBeGreaterThanOrEqual(8)
  })

  it('Policy-Templates-Tab hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<CompliancePageClient {...EMPTY_CHECKS} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Policy-Templates' }))
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Kopieren-Buttons haben aria-label', () => {
    render(<CompliancePageClient {...EMPTY_CHECKS} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Policy-Templates' }))
    const copyButtons = screen.getAllByRole('button', { name: /kopieren/i })
    copyButtons.forEach(btn => expect(btn).toHaveAttribute('aria-label'))
  })

  it('EU AI Act-Risikoklassen-Buttons sind via aria-pressed zugänglich', () => {
    render(<CompliancePageClient {...EMPTY_CHECKS} />)
    const riskButtons = screen.getAllByRole('button', { pressed: false })
    expect(riskButtons.length).toBeGreaterThan(0)
  })
})

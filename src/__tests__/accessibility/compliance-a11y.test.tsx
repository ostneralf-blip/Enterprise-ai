import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { CompliancePageClient } from '@/app/(dashboard)/compliance/CompliancePageClient'

expect.extend(toHaveNoViolations)

Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: jest.fn().mockResolvedValue(undefined) },
  configurable: true,
})

describe('Accessibility: Compliance Center', () => {

  it('EU AI Act-Tab hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<CompliancePageClient />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Tab-Navigation hat role="tablist" und role="tab"', () => {
    render(<CompliancePageClient />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(4)
  })

  it('aktiver Tab hat aria-selected="true"', () => {
    render(<CompliancePageClient />)
    const euTab = screen.getByRole('tab', { name: 'EU AI Act' })
    expect(euTab).toHaveAttribute('aria-selected', 'true')
    const dsgvoTab = screen.getByRole('tab', { name: 'DSGVO-Checkliste' })
    expect(dsgvoTab).toHaveAttribute('aria-selected', 'false')
  })

  it('Tab-Wechsel zu DSGVO aktualisiert aria-selected', () => {
    render(<CompliancePageClient />)
    fireEvent.click(screen.getByRole('tab', { name: 'DSGVO-Checkliste' }))
    expect(screen.getByRole('tab', { name: 'DSGVO-Checkliste' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'EU AI Act' })).toHaveAttribute('aria-selected', 'false')
  })

  it('aktives Tab-Panel hat role="tabpanel"', () => {
    render(<CompliancePageClient />)
    expect(screen.getByRole('tabpanel')).toBeInTheDocument()
  })

  it('DSGVO-Tab hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<CompliancePageClient />)
    fireEvent.click(screen.getByRole('tab', { name: 'DSGVO-Checkliste' }))
    expect(await axe(container)).toHaveNoViolations()
  })

  it('DSGVO-Checkliste zeigt Checkboxen mit Labels', () => {
    render(<CompliancePageClient />)
    fireEvent.click(screen.getByRole('tab', { name: 'DSGVO-Checkliste' }))
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThanOrEqual(10)
  })

  it('DSGVO-Progressbar ist zugänglich', () => {
    render(<CompliancePageClient />)
    fireEvent.click(screen.getByRole('tab', { name: 'DSGVO-Checkliste' }))
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '0')
    expect(progressbar).toHaveAttribute('aria-valuemin', '0')
    expect(progressbar).toHaveAttribute('aria-valuemax')
  })

  it('Risikomatrix-Tab hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<CompliancePageClient />)
    fireEvent.click(screen.getByRole('tab', { name: 'Risikomatrix' }))
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Risikomatrix zeigt 4 Quadrant-Sections', () => {
    render(<CompliancePageClient />)
    fireEvent.click(screen.getByRole('tab', { name: 'Risikomatrix' }))
    const regions = screen.getAllByRole('region')
    expect(regions.length).toBe(4)
  })

  it('Policy-Templates-Tab hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<CompliancePageClient />)
    fireEvent.click(screen.getByRole('tab', { name: 'Policy-Templates' }))
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Kopieren-Buttons haben aria-label', () => {
    render(<CompliancePageClient />)
    fireEvent.click(screen.getByRole('tab', { name: 'Policy-Templates' }))
    const copyButtons = screen.getAllByRole('button', { name: /kopieren/i })
    copyButtons.forEach(btn => expect(btn).toHaveAttribute('aria-label'))
  })
})

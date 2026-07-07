import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { CompliancePageClient } from '@/app/[locale]/(dashboard)/compliance/CompliancePageClient'
import { WatchlistCard } from '@/components/modules/WatchlistCard'
import type { WatchlistItem } from '@/config/compliance-data'

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

  it('DSGVO-Checkliste zeigt Status-Buttons für alle Einträge', () => {
    render(<CompliancePageClient {...EMPTY_CHECKS} />)
    fireEvent.click(screen.getByRole('tab', { name: 'DSGVO' }))
    const statusButtons = screen.getAllByRole('button', { name: /Offen — anklicken für Erfüllt/i })
    expect(statusButtons.length).toBeGreaterThanOrEqual(10)
  })

  it('Status-Button wechselt von Offen zu Erfüllt bei Klick', () => {
    render(<CompliancePageClient {...EMPTY_CHECKS} />)
    fireEvent.click(screen.getByRole('tab', { name: 'DSGVO' }))
    const firstButton = screen.getAllByRole('button', { name: /Offen — anklicken für Erfüllt/i })[0]
    fireEvent.click(firstButton)
    // Nach Klick muss mindestens ein "Erfüllt"-Button existieren
    expect(screen.getAllByRole('button', { name: /Erfüllt — anklicken für Nicht erfüllt/i }).length).toBeGreaterThanOrEqual(1)
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

const MOCK_WATCHLIST_ITEM: WatchlistItem = {
  id: 'test_item',
  title: 'Test Regulierungsänderung',
  status: 'in_gesetzgebung',
  summary: 'Zusammenfassung der Änderung.',
  potentialImpact: 'Betrifft Compliance-Checkliste.',
  sourceUrl: 'https://example.com',
  lastChecked: '2026-07-07',
}

describe('Accessibility: WatchlistCard', () => {
  it('hat keine WCAG-Verstöße', async () => {
    const { container } = render(<WatchlistCard item={MOCK_WATCHLIST_ITEM} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('zeigt Titel und Status-Badge', () => {
    render(<WatchlistCard item={MOCK_WATCHLIST_ITEM} />)
    expect(screen.getByText('Test Regulierungsänderung')).toBeInTheDocument()
    expect(screen.getByText('In Gesetzgebung')).toBeInTheDocument()
  })

  it('zeigt angekuendigt-Badge bei status=angekuendigt', () => {
    render(<WatchlistCard item={{ ...MOCK_WATCHLIST_ITEM, status: 'angekuendigt' }} />)
    expect(screen.getByText('Angekündigt')).toBeInTheDocument()
  })

  it('zeigt final-Badge bei status=final', () => {
    render(<WatchlistCard item={{ ...MOCK_WATCHLIST_ITEM, status: 'final' }} />)
    expect(screen.getByText('Final — Übernahme ausstehend')).toBeInTheDocument()
  })

  it('enthält Quellen-Link mit korrekter href', () => {
    render(<WatchlistCard item={MOCK_WATCHLIST_ITEM} />)
    const link = screen.getByRole('link', { name: /quelle/i })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

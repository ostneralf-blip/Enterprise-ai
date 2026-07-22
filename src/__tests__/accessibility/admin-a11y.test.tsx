import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { AdminPageClient } from '@/app/[locale]/(dashboard)/admin/AdminPageClient'
import type { ContentLibraryEntry } from '@/types'

expect.extend(toHaveNoViolations)

const MOCK_ENTRIES: ContentLibraryEntry[] = [
  {
    id: '1',
    module: 'compliance',
    category: 'gesetz',
    title: 'EU AI Act Art. 6',
    content: 'Hochrisikoklassifikation nach Anhang III...',
    source: 'EU AI Act',
    tags: ['eu-ai-act', 'hochrisiko'],
    min_tier: 'free',
    context_key: null,
    locale: 'de',
    display_order: 0,
    is_published: true,
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
  },
]

describe('Accessibility: Admin Panel', () => {
  it('leere Liste hat keine WCAG-Verstöße', async () => {
    const { container } = render(<AdminPageClient initialEntries={[]} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Liste mit Einträgen hat keine WCAG-Verstöße', async () => {
    const { container } = render(<AdminPageClient initialEntries={MOCK_ENTRIES} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Tabelle hat aria-label', () => {
    render(<AdminPageClient initialEntries={MOCK_ENTRIES} />)
    expect(screen.getByRole('table')).toHaveAttribute('aria-label')
  })

  it('"Neuer Eintrag"-Button öffnet Formular-Dialog', () => {
    render(<AdminPageClient initialEntries={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /neuer eintrag/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('Formular hat keine WCAG-Verstöße', async () => {
    const { container } = render(<AdminPageClient initialEntries={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /neuer eintrag/i }))
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Alle Formular-Inputs haben Labels', () => {
    render(<AdminPageClient initialEntries={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /neuer eintrag/i }))
    expect(screen.getByRole('combobox', { name: /modul/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /kategorie/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /titel/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /inhalt/i })).toBeInTheDocument()
  })

  it('Abbrechen-Button schließt Formular', () => {
    render(<AdminPageClient initialEntries={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /neuer eintrag/i }))
    fireEvent.click(screen.getByRole('button', { name: /abbrechen/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Bearbeiten-Button hat aria-label mit Eintragstitel', () => {
    render(<AdminPageClient initialEntries={MOCK_ENTRIES} />)
    expect(screen.getByRole('button', { name: /EU AI Act Art\. 6 bearbeiten/i })).toBeInTheDocument()
  })

  it('Filter-Buttons haben aria-pressed', () => {
    render(<AdminPageClient initialEntries={MOCK_ENTRIES} />)
    const allBtn = screen.getByRole('button', { name: /^alle$/i })
    expect(allBtn).toHaveAttribute('aria-pressed', 'true')
  })
})

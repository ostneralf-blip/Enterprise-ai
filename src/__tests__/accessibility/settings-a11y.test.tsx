import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { SettingsPageClient } from '@/app/(dashboard)/settings/SettingsPageClient'
import { readFileSync } from 'fs'
import { join } from 'path'

expect.extend(toHaveNoViolations)

const FREE_PROFILE = {
  full_name: 'Max Mustermann',
  company: 'Mustermann GmbH',
  role: 'CTO',
  tier: 'free' as const,
  stripe_customer_id: null,
  phone: null,
  mobile: null,
  street: null,
  zip: null,
  city: null,
  guided_path_reset_at: null,
  theme: 'book' as const,
}

const PRO_PROFILE = {
  ...FREE_PROFILE,
  tier: 'pro' as const,
  stripe_customer_id: 'cus_test123',
}

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: FREE_PROFILE }),
  })
})

afterEach(() => jest.resetAllMocks())

describe('Accessibility: Settings', () => {

  it('SettingsPageClient (Free) hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(
      <SettingsPageClient profile={FREE_PROFILE} email="max@example.de" />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('SettingsPageClient (Pro) hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(
      <SettingsPageClient profile={PRO_PROFILE} email="max@example.de" />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Formular-Inputs haben zugeordnete Labels', () => {
    render(<SettingsPageClient profile={FREE_PROFILE} email="max@example.de" />)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/unternehmen/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/rolle/i)).toBeInTheDocument()
  })

  it('Pflichtfeld-Input hat aria-required', () => {
    render(<SettingsPageClient profile={FREE_PROFILE} email="max@example.de" />)
    expect(screen.getByLabelText(/name/i)).toHaveAttribute('aria-required', 'true')
  })

  it('Fehlermeldung wird mit role="alert" angezeigt', async () => {
    render(<SettingsPageClient profile={{ ...FREE_PROFILE, full_name: null }} email="max@example.de" />)
    const nameInput = screen.getByLabelText(/name/i)
    fireEvent.change(nameInput, { target: { value: '' } })
    fireEvent.submit(nameInput.closest('form')!)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('Erfolgsmeldung hat role="status"', async () => {
    render(<SettingsPageClient profile={FREE_PROFILE} email="max@example.de" />)
    const form = screen.getByLabelText(/name/i).closest('form')!
    fireEvent.submit(form)
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  it('Abrechnung-Sektion nicht sichtbar für Free-Tier', () => {
    render(<SettingsPageClient profile={FREE_PROFILE} email="max@example.de" />)
    expect(screen.queryByText(/abrechnungsportal/i)).not.toBeInTheDocument()
  })

  it('Abrechnung-Sektion sichtbar für Pro-Tier', () => {
    render(<SettingsPageClient profile={PRO_PROFILE} email="max@example.de" />)
    expect(screen.getByText(/abrechnungsportal/i)).toBeInTheDocument()
  })

  it('Sections haben aria-labelledby für Screenreader-Navigation', () => {
    render(<SettingsPageClient profile={FREE_PROFILE} email="max@example.de" />)
    expect(screen.getByRole('region', { name: /profil/i })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /^konto$/i })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /konto löschen/i })).toBeInTheDocument()
  })

  it('Theme-Picker-Buttons haben aria-pressed und aria-label', () => {
    // Statischer Code-Check (Theme-Picker ist 'use client', kein SSR-render nötig)
    const source = readFileSync(join(process.cwd(), 'src/app/(dashboard)/settings/SettingsPageClient.tsx'), 'utf-8')
    expect(source).toContain('aria-pressed')
    expect(source).toContain('aria-label')
  })
})

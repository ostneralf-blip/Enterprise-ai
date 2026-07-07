import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ArchitecturePageClient } from '@/app/[locale]/(dashboard)/architecture/ArchitecturePageClient'
import { WIZARD_STEPS } from '@/config/architecture-data'

expect.extend(toHaveNoViolations)

describe('Accessibility: Architektur-Generator', () => {

  it('Schritt 1 hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<ArchitecturePageClient />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Fortschrittsanzeige hat role="progressbar" mit aria-Attributen', () => {
    render(<ArchitecturePageClient />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '1')
    expect(progressbar).toHaveAttribute('aria-valuemin', '1')
    expect(progressbar).toHaveAttribute('aria-valuemax', String(WIZARD_STEPS.length))
  })

  it('Frage-Optionen sind in einem fieldset mit legend', () => {
    render(<ArchitecturePageClient />)
    const fieldset = document.querySelector('fieldset')
    expect(fieldset).not.toBeNull()
    const legend = fieldset?.querySelector('legend')
    expect(legend).not.toBeNull()
  })

  it('Radio-Buttons haben name-Attribut für Gruppe', () => {
    render(<ArchitecturePageClient />)
    const radios = screen.getAllByRole('radio')
    expect(radios.length).toBeGreaterThanOrEqual(2)
    radios.forEach(r => expect(r).toHaveAttribute('name'))
  })

  it('Weiter-Button ist deaktiviert wenn keine Antwort gewählt', () => {
    render(<ArchitecturePageClient />)
    const nextBtn = screen.getByRole('button', { name: /weiter/i })
    expect(nextBtn).toBeDisabled()
  })

  it('Weiter-Button wird aktiv nach Antwort-Auswahl', () => {
    render(<ArchitecturePageClient />)
    const radios = screen.getAllByRole('radio')
    fireEvent.click(radios[0])
    expect(screen.getByRole('button', { name: /weiter/i })).not.toBeDisabled()
  })

  it('Zurück-Button ist auf Schritt 1 deaktiviert', () => {
    render(<ArchitecturePageClient />)
    expect(screen.getByRole('button', { name: /zurück/i })).toBeDisabled()
  })

  it('Navigation zu Schritt 2 funktioniert', () => {
    render(<ArchitecturePageClient />)
    fireEvent.click(screen.getAllByRole('radio')[0])
    fireEvent.click(screen.getByRole('button', { name: /weiter/i }))
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2')
  })

  it('Ergebnis-Ansicht hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<ArchitecturePageClient />)
    // Alle 5 Schritte durchklicken
    for (let i = 0; i < WIZARD_STEPS.length; i++) {
      const radios = screen.getAllByRole('radio')
      fireEvent.click(radios[0])
      const btnLabel = i === WIZARD_STEPS.length - 1 ? /architektur generieren/i : /weiter/i
      fireEvent.click(screen.getByRole('button', { name: btnLabel }))
    }
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Ergebnis zeigt Architektur-Schichten als Tabellenzeilen', () => {
    render(<ArchitecturePageClient />)
    for (let i = 0; i < WIZARD_STEPS.length; i++) {
      const radios = screen.getAllByRole('radio')
      fireEvent.click(radios[0])
      const btnLabel = i === WIZARD_STEPS.length - 1 ? /architektur generieren/i : /weiter/i
      fireEvent.click(screen.getByRole('button', { name: btnLabel }))
    }
    // SwimlaneTable renders layers as <tr> (role="row") — at least one layer should appear
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThanOrEqual(1)
  })

  it('"Neue Architektur generieren"-Button führt zum Wizard-Start zurück', () => {
    render(<ArchitecturePageClient />)
    for (let i = 0; i < WIZARD_STEPS.length; i++) {
      const radios = screen.getAllByRole('radio')
      fireEvent.click(radios[0])
      const btnLabel = i === WIZARD_STEPS.length - 1 ? /architektur generieren/i : /weiter/i
      fireEvent.click(screen.getByRole('button', { name: btnLabel }))
    }
    fireEvent.click(screen.getByRole('button', { name: /neue architektur/i }))
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
  })
})

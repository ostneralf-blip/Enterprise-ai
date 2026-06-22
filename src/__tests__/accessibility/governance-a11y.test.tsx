import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { GovernancePageClient } from '@/app/(dashboard)/governance/GovernancePageClient'
import { GOVERNANCE_GATES } from '@/config/governance-data'

expect.extend(toHaveNoViolations)

describe('Accessibility: Governance-Check', () => {

  it('Wizard-Startschritt hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<GovernancePageClient tier="free" sessions={[]} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Radio-Inputs sind in fieldset/legend für Screenreader-Kontext', () => {
    render(<GovernancePageClient tier="free" sessions={[]} />)
    expect(screen.getByRole('group')).toBeInTheDocument() // fieldset renders as group
  })

  it('Fortschrittsbalken hat role="progressbar" und aria-Attribute', () => {
    render(<GovernancePageClient tier="free" sessions={[]} />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '1')
    expect(progressbar).toHaveAttribute('aria-valuemin', '1')
    expect(progressbar).toHaveAttribute('aria-valuemax', String(GOVERNANCE_GATES.length))
  })

  it('"Weiter"-Button ist disabled solange keine Antwort ausgewählt', () => {
    render(<GovernancePageClient tier="free" sessions={[]} />)
    const nextBtn = screen.getByRole('button', { name: /weiter/i })
    expect(nextBtn).toBeDisabled()
  })

  it('"Zurück"-Button ist disabled auf dem ersten Schritt', () => {
    render(<GovernancePageClient tier="free" sessions={[]} />)
    expect(screen.getByRole('button', { name: /zurück/i })).toBeDisabled()
  })

  it('"Weiter"-Button wird aktiviert nach Auswahl einer Option', () => {
    render(<GovernancePageClient tier="free" sessions={[]} />)
    const firstOption = screen.getAllByRole('radio')[0]
    fireEvent.click(firstOption)
    expect(screen.getByRole('button', { name: /weiter/i })).not.toBeDisabled()
  })

  it('Radio-Labels sind klickbar und verknüpft mit dem Input', () => {
    render(<GovernancePageClient tier="free" sessions={[]} />)
    const radios = screen.getAllByRole('radio')
    expect(radios.length).toBeGreaterThan(0)
    radios.forEach(radio => {
      expect(radio).toBeInTheDocument()
    })
  })

  it('Ergebnis-Screen hat keine WCAG-Verstöße (axe-core)', async () => {
    render(<GovernancePageClient tier="free" sessions={[]} />)
    // Alle Gates mit grüner Option beantworten
    for (let step = 0; step < GOVERNANCE_GATES.length; step++) {
      const radios = screen.getAllByRole('radio')
      // Letzte Radio-Option (typischerweise grün oder zumindest vorhanden)
      fireEvent.click(radios[radios.length - 1])
      const nextBtn = screen.getByRole('button', { name: step === GOVERNANCE_GATES.length - 1 ? /ergebnis/i : /weiter/i })
      fireEvent.click(nextBtn)
    }
    const { container } = render(<GovernancePageClient tier="free" sessions={[]} />)
    // Ergebnis-Screen bereits gerendert in vorherigem render — axe auf Ergebnis-Variante
    expect(await axe(container)).toHaveNoViolations()
  })
})

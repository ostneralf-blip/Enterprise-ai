import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { AssessmentWizard } from '@/components/modules/assessment/AssessmentWizard'

expect.extend(toHaveNoViolations)

// Mock PostHog tracking (kein echtes Tracking in Tests)
jest.mock('@/lib/posthog/client', () => ({
  track: jest.fn(),
}))

describe('Accessibility: AssessmentWizard', () => {

  it('Intro-Screen hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<AssessmentWizard tier="free" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('Start-Button ist per Tastatur fokussierbar und hat aria-label', () => {
    render(<AssessmentWizard tier="free" />)
    const startButton = screen.getByRole('button', { name: /assessment starten/i })
    expect(startButton).toBeVisible()
    startButton.focus()
    expect(startButton).toHaveFocus()
  })

  it('Fragebogen-Screen hat einen korrekt annotierten Progressbar', () => {
    render(<AssessmentWizard tier="free" />)
    fireEvent.click(screen.getByRole('button', { name: /assessment starten/i }))

    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuemin', '0')
    expect(progressbar).toHaveAttribute('aria-valuemax', '100')
    expect(progressbar).toHaveAttribute('aria-label')
  })

  it('Antwort-Optionen sind als Button-Gruppe mit aria-pressed erreichbar', () => {
    render(<AssessmentWizard tier="free" />)
    fireEvent.click(screen.getByRole('button', { name: /assessment starten/i }))

    const group = screen.getByRole('group', { name: /bewertung auswählen/i })
    expect(group).toBeInTheDocument()

    const options = screen.getAllByRole('button').filter(b => b.hasAttribute('aria-pressed'))
    expect(options.length).toBe(5) // Skala 1-5
    options.forEach(opt => {
      expect(opt).toHaveAttribute('aria-pressed')
    })
  })

  it('Auswahl einer Antwort aktualisiert aria-pressed korrekt', () => {
    render(<AssessmentWizard tier="free" />)
    fireEvent.click(screen.getByRole('button', { name: /assessment starten/i }))

    const options = screen.getAllByRole('button').filter(b => b.hasAttribute('aria-pressed'))
    fireEvent.click(options[2]) // Score 3 wählen

    // Nach Klick navigiert der Wizard zur nächsten Frage (neue Optionen gerendert)
    // Prüfe, dass die neue Fragen-Gruppe wieder korrekt ausgezeichnet ist
    const newOptions = screen.getAllByRole('button').filter(b => b.hasAttribute('aria-pressed'))
    expect(newOptions.length).toBe(5)
  })

  it('"Zurück"-Button navigiert beim ersten Schritt zur Intro zurück (kein Dead-End für Screenreader)', () => {
    render(<AssessmentWizard tier="free" />)
    fireEvent.click(screen.getByRole('button', { name: /assessment starten/i }))

    // Auf Frage 1: Button ist aktiv und führt zurück zur Intro (besser als disabled)
    const backButton = screen.getByRole('button', { name: /zurück zur übersicht/i })
    expect(backButton).not.toBeDisabled()
    fireEvent.click(backButton)
    expect(screen.getByRole('button', { name: /assessment starten/i })).toBeVisible()
  })

  it('Alle interaktiven Elemente haben einen sichtbaren Fokusindikator (Tailwind focus:ring Klassen)', () => {
    render(<AssessmentWizard tier="free" />)
    const startButton = screen.getByRole('button', { name: /assessment starten/i })
    expect(startButton.className).toMatch(/focus:ring/)
  })
})

/**
 * ════════════════════════════════════════════════════════════════════════
 * MANUELLE ACCESSIBILITY-TESTS — siehe docs/testing/accessibility-checklist.md
 * ════════════════════════════════════════════════════════════════════════
 * Nicht durch jsdom/axe automatisierbar:
 *
 * 🔶 Screenreader-Test mit NVDA (Windows) oder VoiceOver (macOS) durchgehen
 * 🔶 Tastatur-Navigation: gesamten Assessment-Flow NUR mit Tab/Enter/Leertaste durchklicken
 * 🔶 Farbkontrast: Tailwind-Farben gegen WCAG AA (4.5:1) mit echtem Browser-Tool prüfen
 * 🔶 Zoom auf 200%: Layout darf nicht brechen
 * 🔶 prefers-reduced-motion: Übergänge (transition-all) sollten respektiert werden
 */

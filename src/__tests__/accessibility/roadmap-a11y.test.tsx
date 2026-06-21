import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { RoadmapPageClient } from '@/app/(dashboard)/roadmap/RoadmapPageClient'

expect.extend(toHaveNoViolations)

describe('Accessibility: Roadmap-Generator', () => {

  it('Starter-Roadmap hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<RoadmapPageClient initialArchetype="starter" fromAssessment={false} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Scaler-Roadmap hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<RoadmapPageClient initialArchetype="scaler" fromAssessment={false} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Transformer-Roadmap hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<RoadmapPageClient initialArchetype="transformer" fromAssessment={false} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Archetyp-Buttons haben aria-pressed', () => {
    render(<RoadmapPageClient initialArchetype="starter" fromAssessment={false} />)
    const archetypeGroup = screen.getByRole('group', { name: /archetyp auswählen/i })
    const archetypeButtons = Array.from(archetypeGroup.querySelectorAll('button'))
    expect(archetypeButtons.length).toBeGreaterThanOrEqual(3)
    archetypeButtons.forEach(btn => expect(btn).toHaveAttribute('aria-pressed'))
  })

  it('aktiver Archetyp-Button hat aria-pressed="true"', () => {
    render(<RoadmapPageClient initialArchetype="scaler" fromAssessment={false} />)
    const scalerBtn = screen.getByRole('button', { name: /ai scaler/i })
    expect(scalerBtn).toHaveAttribute('aria-pressed', 'true')
    const starterBtn = screen.getByRole('button', { name: /ai starter/i })
    expect(starterBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('Archetyp-Wechsel ändert die Roadmap-Inhalte', () => {
    render(<RoadmapPageClient initialArchetype="starter" fromAssessment={false} />)
    expect(screen.getByText(/Fundament legen/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /ai scaler/i }))
    expect(screen.getByText(/Portfolio-Lücken schließen/i)).toBeInTheDocument()
  })

  it('Phasen-Sektionen haben aria-labelledby für Navigation', () => {
    render(<RoadmapPageClient initialArchetype="starter" fromAssessment={false} />)
    const sections = screen.getAllByRole('region')
    expect(sections.length).toBe(3)
  })

  it('Assessment-Hinweis wird angezeigt wenn fromAssessment=true', () => {
    render(<RoadmapPageClient initialArchetype="transformer" fromAssessment={true} />)
    expect(screen.getByText(/basierend auf deinem letzten assessment/i)).toBeInTheDocument()
  })

  it('kein Assessment-Hinweis wenn fromAssessment=false', () => {
    render(<RoadmapPageClient initialArchetype="starter" fromAssessment={false} />)
    expect(screen.queryByText(/basierend auf deinem letzten assessment/i)).not.toBeInTheDocument()
  })
})

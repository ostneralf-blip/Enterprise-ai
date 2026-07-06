import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ErgebnissePageClient, type ComplianceRow, type UseCaseRow } from '@/app/(dashboard)/ergebnisse/ErgebnissePageClient'

expect.extend(toHaveNoViolations)

global.fetch = jest.fn()

const BASE_PREFS = {
  primary_assessment_id: null,
  primary_governance_id: null,
  primary_roadmap_id: null,
  primary_architecture_id: null,
  primary_canvas_id: null,
  primary_compliance_id: null,
  primary_usecase_id: null,
}

const COMPLIANCE_ROWS: ComplianceRow[] = [
  { id: 'c1', regulation: 'eu_ai_act', check_type: 'risk_class', status: 'compliant',     notes: null,              updated_at: '2026-06-01T10:00:00Z' },
  { id: 'c2', regulation: 'dsgvo',     check_type: 'dpia',       status: 'non_compliant', notes: 'DSFA ausstehend', updated_at: '2026-06-15T10:00:00Z' },
]

const USE_CASE_ROWS: UseCaseRow[] = [
  { id: 'u1', name: 'KI-Dokumentenprüfung', domain: 'Legal', weighted_score: 87, quadrant: 'build',    governance_result: 'approve'  },
  { id: 'u2', name: 'Chatbot Support',       domain: null,   weighted_score: 55, quadrant: 'pilot',    governance_result: 'improve'  },
]

afterEach(() => jest.resetAllMocks())

describe('Accessibility: Ergebnisse — Compliance-Tab', () => {
  it('Compliance-Tab (leer) hat keine WCAG-Verstöße', async () => {
    const { container } = render(
      <ErgebnissePageClient
        assessments={[]} architectures={[]} governanceSessions={[]} roadmaps={[]} canvases={[]}
        complianceChecks={[]} useCases={[]}
        initialPreferences={BASE_PREFS}
        tier="free"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /compliance/i }))
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Compliance-Tab mit Daten hat keine WCAG-Verstöße', async () => {
    const { container } = render(
      <ErgebnissePageClient
        assessments={[]} architectures={[]} governanceSessions={[]} roadmaps={[]} canvases={[]}
        complianceChecks={COMPLIANCE_ROWS} useCases={[]}
        initialPreferences={BASE_PREFS}
        tier="free"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /compliance/i }))
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Compliance-Tab mit primärem Eintrag hat keine WCAG-Verstöße', async () => {
    const { container } = render(
      <ErgebnissePageClient
        assessments={[]} architectures={[]} governanceSessions={[]} roadmaps={[]} canvases={[]}
        complianceChecks={COMPLIANCE_ROWS} useCases={[]}
        initialPreferences={{ ...BASE_PREFS, primary_compliance_id: 'c1' }}
        tier="free"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /compliance/i }))
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Compliance-Tab mit geöffnetem Löschen-Dialog hat keine WCAG-Verstöße', async () => {
    const { container } = render(
      <ErgebnissePageClient
        assessments={[]} architectures={[]} governanceSessions={[]} roadmaps={[]} canvases={[]}
        complianceChecks={COMPLIANCE_ROWS} useCases={[]}
        initialPreferences={BASE_PREFS}
        tier="free"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /compliance/i }))
    const löschenBtns = screen.getAllByRole('button', { name: /^löschen$/i })
    fireEvent.click(löschenBtns[0])
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('Accessibility: Ergebnisse — UseCase-Tab', () => {
  it('UseCase-Tab (leer) hat keine WCAG-Verstöße', async () => {
    const { container } = render(
      <ErgebnissePageClient
        assessments={[]} architectures={[]} governanceSessions={[]} roadmaps={[]} canvases={[]}
        complianceChecks={[]} useCases={[]}
        initialPreferences={BASE_PREFS}
        tier="free"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /use cases/i }))
    expect(await axe(container)).toHaveNoViolations()
  })

  it('UseCase-Tab mit Daten hat keine WCAG-Verstöße', async () => {
    const { container } = render(
      <ErgebnissePageClient
        assessments={[]} architectures={[]} governanceSessions={[]} roadmaps={[]} canvases={[]}
        complianceChecks={[]} useCases={USE_CASE_ROWS}
        initialPreferences={BASE_PREFS}
        tier="free"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /use cases/i }))
    expect(await axe(container)).toHaveNoViolations()
  })

  it('UseCase-Tab mit primärem Eintrag hat keine WCAG-Verstöße', async () => {
    const { container } = render(
      <ErgebnissePageClient
        assessments={[]} architectures={[]} governanceSessions={[]} roadmaps={[]} canvases={[]}
        complianceChecks={[]} useCases={USE_CASE_ROWS}
        initialPreferences={{ ...BASE_PREFS, primary_usecase_id: 'u1' }}
        tier="free"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /use cases/i }))
    expect(await axe(container)).toHaveNoViolations()
  })
})

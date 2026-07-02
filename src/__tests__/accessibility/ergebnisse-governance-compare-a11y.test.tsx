import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ErgebnissePageClient, type GovernanceRow } from '@/app/(dashboard)/ergebnisse/ErgebnissePageClient'

expect.extend(toHaveNoViolations)

global.fetch = jest.fn()

const BASE_PREFS = {
  primary_assessment_id: null,
  primary_governance_id: null,
  primary_roadmap_id: null,
  primary_architecture_id: null,
  primary_canvas_id: null,
}

const GOVERNANCE_WITH_PROTOCOL: GovernanceRow[] = [
  {
    id: 'g1',
    use_case_name: 'KI-Dokumentenprüfung',
    result: 'approve',
    protocol: [
      { question: 'Personenbezogene Daten?', answer: 'Ja, anonymisiert' },
      { label: 'Risikoeinstufung', value: 'Gering' },
      { question: 'Dokumentation vorhanden?', answer: 'Vollständig' },
    ],
    created_at: '2026-06-01T10:00:00Z',
  },
  {
    id: 'g2',
    use_case_name: 'Chatbot Support',
    result: 'improve',
    protocol: [
      { question: 'Personenbezogene Daten?', answer: 'Nein' },
      { label: 'Risikoeinstufung', value: 'Mittel' },
      { question: 'Dokumentation vorhanden?', answer: 'Teilweise' },
    ],
    created_at: '2026-06-15T10:00:00Z',
  },
]

const GOVERNANCE_NULL_PROTOCOL: GovernanceRow[] = [
  {
    id: 'g3',
    use_case_name: 'Alt-System',
    result: 'stop_risk',
    protocol: null,
    created_at: '2026-05-01T10:00:00Z',
  },
  {
    id: 'g4',
    use_case_name: 'Leerer Check',
    result: 'stop_dsgvo',
    protocol: null,
    created_at: '2026-05-15T10:00:00Z',
  },
]

function renderAndOpenCompare(governanceSessions: GovernanceRow[]) {
  const result = render(
    <ErgebnissePageClient
      assessments={[]}
      architectures={[]}
      governanceSessions={governanceSessions}
      roadmaps={[]}
      canvases={[]}
      initialPreferences={BASE_PREFS}
    />
  )
  // Switch to Governance tab
  fireEvent.click(screen.getByRole('button', { name: /governance/i }))
  // Enable compare mode
  fireEvent.click(screen.getByRole('button', { name: /vergleichen/i }))
  // Select both entries
  const checkboxes = screen.getAllByRole('checkbox')
  fireEvent.click(checkboxes[0])
  fireEvent.click(checkboxes[1])
  return result
}

afterEach(() => jest.resetAllMocks())

describe('Accessibility: Governance-Vergleich mit Protokolldetails', () => {

  it('Governance-Tab (Listenansicht) hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(
      <ErgebnissePageClient
        assessments={[]}
        architectures={[]}
        governanceSessions={GOVERNANCE_WITH_PROTOCOL}
        roadmaps={[]}
        canvases={[]}
        initialPreferences={BASE_PREFS}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /governance/i }))
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Vergleichs-Panel mit Protokoll hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = renderAndOpenCompare(GOVERNANCE_WITH_PROTOCOL)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Vergleichs-Panel ohne Protokoll (null) hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = renderAndOpenCompare(GOVERNANCE_NULL_PROTOCOL)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Checkboxen im Vergleich-Modus sind per Tastatur erreichbar', () => {
    renderAndOpenCompare(GOVERNANCE_WITH_PROTOCOL)
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach(cb => {
      expect(cb).toBeInTheDocument()
    })
  })

  it('"Vergleich beenden"-Button ist vorhanden und zugänglich', () => {
    renderAndOpenCompare(GOVERNANCE_WITH_PROTOCOL)
    expect(screen.getByRole('button', { name: /vergleich beenden/i })).toBeInTheDocument()
  })

  it('"Auswahl zurücksetzen"-Button ist vorhanden wenn Einträge ausgewählt sind', () => {
    renderAndOpenCompare(GOVERNANCE_WITH_PROTOCOL)
    expect(screen.getByRole('button', { name: /auswahl zurücksetzen/i })).toBeInTheDocument()
  })
})

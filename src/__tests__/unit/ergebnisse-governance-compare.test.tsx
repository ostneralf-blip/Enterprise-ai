import { render, screen, fireEvent } from '@testing-library/react'
import { ErgebnissePageClient, type GovernanceRow } from '@/app/(dashboard)/ergebnisse/ErgebnissePageClient'

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

function renderGovernanceTab(governanceSessions: GovernanceRow[]) {
  return render(
    <ErgebnissePageClient
      assessments={[]}
      architectures={[]}
      governanceSessions={governanceSessions}
      roadmaps={[]}
      canvases={[]}
      initialPreferences={BASE_PREFS}
      tier="free"
    />
  )
}

function openGovernanceTabAndCompareMode() {
  fireEvent.click(screen.getByRole('button', { name: /governance/i }))
  fireEvent.click(screen.getByRole('button', { name: /vergleichen/i }))
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function selectBothEntries(id1: string, id2: string) {
  const checkboxes = screen.getAllByRole('checkbox')
  // Select first and second checkbox (matching the two governance rows)
  fireEvent.click(checkboxes[0])
  fireEvent.click(checkboxes[1])
}

describe('Governance-Vergleich: Protokolldetails', () => {

  afterEach(() => jest.resetAllMocks())

  describe('Mit Protokoll-Einträgen', () => {

    it('rendert das Vergleichs-Panel mit Überschrift', () => {
      renderGovernanceTab(GOVERNANCE_WITH_PROTOCOL)
      openGovernanceTabAndCompareMode()
      selectBothEntries('g1', 'g2')
      expect(screen.getByText('Vergleich: zwei Governance-Checks')).toBeInTheDocument()
    })

    it('zeigt Ergebnis-Badges für beide Einträge', () => {
      renderGovernanceTab(GOVERNANCE_WITH_PROTOCOL)
      openGovernanceTabAndCompareMode()
      selectBothEntries('g1', 'g2')
      // "Ergebnis" row label
      expect(screen.getByText('Ergebnis')).toBeInTheDocument()
      // verdict labels
      expect(screen.getAllByText('Freigegeben').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Verbesserung').length).toBeGreaterThan(0)
    })

    it('zeigt Use-Case-Namen in der Use-Case-Zeile', () => {
      renderGovernanceTab(GOVERNANCE_WITH_PROTOCOL)
      openGovernanceTabAndCompareMode()
      selectBothEntries('g1', 'g2')
      expect(screen.getByText('Use Case')).toBeInTheDocument()
      // use_case_name appears multiple times (list row + compare panel)
      const docPrüfung = screen.getAllByText('KI-Dokumentenprüfung')
      expect(docPrüfung.length).toBeGreaterThan(0)
    })

    it('zeigt Fragen-Labels aus dem Protokoll (question-Feld)', () => {
      renderGovernanceTab(GOVERNANCE_WITH_PROTOCOL)
      openGovernanceTabAndCompareMode()
      selectBothEntries('g1', 'g2')
      expect(screen.getByText('Personenbezogene Daten?')).toBeInTheDocument()
      expect(screen.getByText('Dokumentation vorhanden?')).toBeInTheDocument()
    })

    it('zeigt Fragen-Labels aus dem Protokoll (label-Feld als Fallback)', () => {
      renderGovernanceTab(GOVERNANCE_WITH_PROTOCOL)
      openGovernanceTabAndCompareMode()
      selectBothEntries('g1', 'g2')
      expect(screen.getByText('Risikoeinstufung')).toBeInTheDocument()
    })

    it('zeigt Antworten aus dem Protokoll (answer-Feld) für beide Einträge', () => {
      renderGovernanceTab(GOVERNANCE_WITH_PROTOCOL)
      openGovernanceTabAndCompareMode()
      selectBothEntries('g1', 'g2')
      expect(screen.getByText('Ja, anonymisiert')).toBeInTheDocument()
      expect(screen.getByText('Nein')).toBeInTheDocument()
    })

    it('zeigt Antworten (value-Feld als Fallback) für beide Einträge', () => {
      renderGovernanceTab(GOVERNANCE_WITH_PROTOCOL)
      openGovernanceTabAndCompareMode()
      selectBothEntries('g1', 'g2')
      expect(screen.getByText('Gering')).toBeInTheDocument()
      expect(screen.getByText('Mittel')).toBeInTheDocument()
    })

    it('zeigt maximal 5 Protokoll-Einträge', () => {
      const manyEntries: GovernanceRow = {
        id: 'gX',
        use_case_name: 'Viele Fragen',
        result: 'approve',
        protocol: Array.from({ length: 10 }, (_, i) => ({
          question: `Frage ${i + 1}`,
          answer: `Antwort ${i + 1}`,
        })),
        created_at: '2026-07-01T10:00:00Z',
      }
      const second: GovernanceRow = {
        id: 'gY',
        use_case_name: 'Zweiter',
        result: 'improve',
        protocol: Array.from({ length: 10 }, (_, i) => ({
          question: `Frage ${i + 1}`,
          answer: `B-Antwort ${i + 1}`,
        })),
        created_at: '2026-07-02T10:00:00Z',
      }
      renderGovernanceTab([manyEntries, second])
      openGovernanceTabAndCompareMode()
      selectBothEntries('gX', 'gY')
      // Only up to 5 entries rendered — Frage 6 through 10 should NOT appear
      expect(screen.queryByText('Frage 6')).not.toBeInTheDocument()
      expect(screen.queryByText('Frage 5')).toBeInTheDocument()
    })
  })

  describe('Ohne Protokoll (null)', () => {

    it('rendert das Vergleichs-Panel ohne Fehler bei null-Protokoll', () => {
      renderGovernanceTab(GOVERNANCE_NULL_PROTOCOL)
      openGovernanceTabAndCompareMode()
      selectBothEntries('g3', 'g4')
      expect(screen.getByText('Vergleich: zwei Governance-Checks')).toBeInTheDocument()
    })

    it('zeigt Ergebnis-Zeile auch ohne Protokoll', () => {
      renderGovernanceTab(GOVERNANCE_NULL_PROTOCOL)
      openGovernanceTabAndCompareMode()
      selectBothEntries('g3', 'g4')
      expect(screen.getByText('Ergebnis')).toBeInTheDocument()
      expect(screen.getAllByText('Risiko-Stop').length).toBeGreaterThan(0)
      expect(screen.getAllByText('DSGVO-Stop').length).toBeGreaterThan(0)
    })

    it('zeigt Use-Case-Zeile auch ohne Protokoll', () => {
      renderGovernanceTab(GOVERNANCE_NULL_PROTOCOL)
      openGovernanceTabAndCompareMode()
      selectBothEntries('g3', 'g4')
      expect(screen.getByText('Use Case')).toBeInTheDocument()
    })

    it('zeigt keine Protokoll-Zeilen bei leerem Protokoll-Array', () => {
      const withEmptyProtocol: GovernanceRow[] = [
        { id: 'gE1', use_case_name: 'Leer A', result: 'approve', protocol: [], created_at: '2026-06-01T10:00:00Z' },
        { id: 'gE2', use_case_name: 'Leer B', result: 'improve', protocol: [], created_at: '2026-06-02T10:00:00Z' },
      ]
      renderGovernanceTab(withEmptyProtocol)
      openGovernanceTabAndCompareMode()
      selectBothEntries('gE1', 'gE2')
      expect(screen.queryByText(/Frage 1/i)).not.toBeInTheDocument()
    })
  })

  describe('Gemischtes Protokoll (g2 hat weniger Einträge)', () => {

    it('zeigt "—" für fehlende Protokoll-Einträge im zweiten Eintrag', () => {
      const g1: GovernanceRow = {
        id: 'gM1',
        use_case_name: 'Vollständig',
        result: 'approve',
        protocol: [
          { question: 'Datenschutz?', answer: 'Eingehalten' },
          { question: 'Dokumentation?', answer: 'Vollständig' },
        ],
        created_at: '2026-06-01T10:00:00Z',
      }
      const g2: GovernanceRow = {
        id: 'gM2',
        use_case_name: 'Kurz',
        result: 'improve',
        protocol: [
          { question: 'Datenschutz?', answer: 'Teilweise' },
          // second entry missing
        ],
        created_at: '2026-06-02T10:00:00Z',
      }
      renderGovernanceTab([g1, g2])
      openGovernanceTabAndCompareMode()
      selectBothEntries('gM1', 'gM2')
      // g2 has no second protocol entry → should show "—"
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })
})

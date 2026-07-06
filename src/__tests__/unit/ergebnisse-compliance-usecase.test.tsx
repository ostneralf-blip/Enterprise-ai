import { render, screen, fireEvent } from '@testing-library/react'
import { ErgebnissePageClient, type ComplianceRow, type UseCaseRow } from '@/app/(dashboard)/ergebnisse/ErgebnissePageClient'

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
  { id: 'c1', regulation: 'eu_ai_act', check_type: 'risk_class', status: 'compliant',     notes: null,                updated_at: '2026-06-01T10:00:00Z' },
  { id: 'c2', regulation: 'dsgvo',     check_type: 'dpia',       status: 'non_compliant', notes: 'DSFA ausstehend',   updated_at: '2026-06-15T10:00:00Z' },
  { id: 'c3', regulation: 'dsgvo',     check_type: 'avv',        status: 'open',          notes: null,                updated_at: '2026-06-20T10:00:00Z' },
]

const USE_CASE_ROWS: UseCaseRow[] = [
  { id: 'u1', name: 'KI-Dokumentenprüfung', domain: 'Legal',   weighted_score: 87,   quadrant: 'build',        governance_result: 'approve'    },
  { id: 'u2', name: 'Chatbot Support',       domain: null,      weighted_score: 55,   quadrant: 'pilot',        governance_result: 'improve'    },
  { id: 'u3', name: 'Anomalieerkennung',     domain: 'IT-Sec',  weighted_score: null, quadrant: 'evaluate',     governance_result: null         },
  { id: 'u4', name: 'Alt-Prozess',           domain: null,      weighted_score: 12,   quadrant: 'deprioritize', governance_result: 'stop_risk'  },
]

function renderCompliance(rows: ComplianceRow[] = COMPLIANCE_ROWS) {
  render(
    <ErgebnissePageClient
      assessments={[]}
      architectures={[]}
      governanceSessions={[]}
      roadmaps={[]}
      canvases={[]}
      complianceChecks={rows}
      useCases={[]}
      initialPreferences={BASE_PREFS}
      tier="free"
    />
  )
  fireEvent.click(screen.getByRole('button', { name: /compliance/i }))
}

function renderUseCase(rows: UseCaseRow[] = USE_CASE_ROWS) {
  render(
    <ErgebnissePageClient
      assessments={[]}
      architectures={[]}
      governanceSessions={[]}
      roadmaps={[]}
      canvases={[]}
      complianceChecks={[]}
      useCases={rows}
      initialPreferences={BASE_PREFS}
      tier="free"
    />
  )
  fireEvent.click(screen.getByRole('button', { name: /use cases/i }))
}

afterEach(() => jest.resetAllMocks())

// ── Compliance-Tab ────────────────────────────────────────────────────────────

describe('Ergebnisse: Compliance-Tab', () => {

  describe('Leerer Zustand', () => {
    it('zeigt Hinweis und Link zu /compliance', () => {
      renderCompliance([])
      expect(screen.getByText(/Noch keine Compliance-Prüfungen/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Jetzt prüfen/i })).toHaveAttribute('href', '/compliance')
    })
  })

  describe('Status-Badges', () => {
    it('zeigt "Konform" für status=compliant', () => {
      renderCompliance()
      expect(screen.getAllByText('Konform').length).toBeGreaterThan(0)
    })

    it('zeigt "Nicht konform" für status=non_compliant', () => {
      renderCompliance()
      expect(screen.getByText('Nicht konform')).toBeInTheDocument()
    })

    it('zeigt "Offen" für anderen Status', () => {
      renderCompliance()
      expect(screen.getByText('Offen')).toBeInTheDocument()
    })
  })

  describe('Regulations-Labels', () => {
    it('zeigt "EU AI Act" für regulation=eu_ai_act', () => {
      renderCompliance()
      expect(screen.getByText('EU AI Act')).toBeInTheDocument()
    })

    it('zeigt "DSGVO" für regulation=dsgvo', () => {
      renderCompliance()
      expect(screen.getAllByText('DSGVO').length).toBeGreaterThan(0)
    })

    it('zeigt unbekannte Regulation als Rohwert', () => {
      renderCompliance([
        { id: 'cx', regulation: 'iso_27001', check_type: 'audit', status: 'open', notes: null, updated_at: '2026-07-01T00:00:00Z' },
      ])
      expect(screen.getByText('iso_27001')).toBeInTheDocument()
    })
  })

  describe('Expand: Notiz und Link', () => {
    it('zeigt Notiz nach Klick auf Eintrag', () => {
      renderCompliance()
      const badge = screen.getByText('Nicht konform')
      const clickable = badge.closest('[class*="cursor-pointer"]') as HTMLElement
      fireEvent.click(clickable)
      expect(screen.getByText(/DSFA ausstehend/i)).toBeInTheDocument()
    })

    it('zeigt Link zu /compliance im expand-Bereich', () => {
      renderCompliance()
      const badge = screen.getByText('Nicht konform')
      const clickable = badge.closest('[class*="cursor-pointer"]') as HTMLElement
      fireEvent.click(clickable)
      const link = screen.getByRole('link', { name: /In Compliance öffnen/i })
      expect(link).toHaveAttribute('href', '/compliance')
    })

    it('zeigt keinen Notiz-Abschnitt wenn notes null', () => {
      renderCompliance([
        { id: 'cn', regulation: 'eu_ai_act', check_type: 'risk_class', status: 'compliant', notes: null, updated_at: '2026-07-01T00:00:00Z' },
      ])
      const badge = screen.getByText('Konform')
      const clickable = badge.closest('[class*="cursor-pointer"]') as HTMLElement
      fireEvent.click(clickable)
      expect(screen.queryByText(/Notiz:/i)).not.toBeInTheDocument()
    })
  })

  describe('Vergleich-Button', () => {
    it('zeigt keinen Vergleichen-Button im Compliance-Tab (Compare-Panel noch nicht implementiert)', () => {
      renderCompliance()
      expect(screen.queryByRole('button', { name: /vergleichen/i })).not.toBeInTheDocument()
    })
  })
})

// ── UseCase-Tab ───────────────────────────────────────────────────────────────

describe('Ergebnisse: UseCase-Tab', () => {

  describe('Leerer Zustand', () => {
    it('zeigt Hinweis und Link zu /usecase', () => {
      renderUseCase([])
      expect(screen.getByText(/Noch keine Use Cases bewertet/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Jetzt bewerten/i })).toHaveAttribute('href', '/usecase')
    })
  })

  describe('Quadrant-Badges', () => {
    it('zeigt "Bauen" für quadrant=build', () => {
      renderUseCase()
      expect(screen.getByText('Bauen')).toBeInTheDocument()
    })

    it('zeigt "Pilot" für quadrant=pilot', () => {
      renderUseCase()
      expect(screen.getByText('Pilot')).toBeInTheDocument()
    })

    it('zeigt "Evaluieren" für quadrant=evaluate', () => {
      renderUseCase()
      expect(screen.getByText('Evaluieren')).toBeInTheDocument()
    })

    it('zeigt "Zurückstellen" für quadrant=deprioritize', () => {
      renderUseCase()
      expect(screen.getByText('Zurückstellen')).toBeInTheDocument()
    })

    it('zeigt kein Badge wenn quadrant null', () => {
      renderUseCase([
        { id: 'uq', name: 'Ohne Quadrant', domain: null, weighted_score: null, quadrant: null, governance_result: null },
      ])
      // kein Badge-Element — nur der Name sichtbar
      expect(screen.getByText('Ohne Quadrant')).toBeInTheDocument()
    })
  })

  describe('Inhalt', () => {
    it('zeigt Use-Case-Namen', () => {
      renderUseCase()
      expect(screen.getByText('KI-Dokumentenprüfung')).toBeInTheDocument()
      expect(screen.getByText('Chatbot Support')).toBeInTheDocument()
    })

    it('zeigt Domain wenn vorhanden', () => {
      renderUseCase()
      expect(screen.getByText('Legal')).toBeInTheDocument()
      expect(screen.getByText('IT-Sec')).toBeInTheDocument()
    })

    it('zeigt Score in Punkten', () => {
      renderUseCase()
      expect(screen.getByText('87 Pkt.')).toBeInTheDocument()
      expect(screen.getByText('55 Pkt.')).toBeInTheDocument()
    })

    it('zeigt keinen Score wenn weighted_score null', () => {
      renderUseCase([
        { id: 'us', name: 'Kein Score', domain: null, weighted_score: null, quadrant: null, governance_result: null },
      ])
      expect(screen.queryByText(/Pkt\./i)).not.toBeInTheDocument()
    })
  })

  describe('Expand: Governance-Ergebnis und Link', () => {
    it('zeigt Governance-Ergebnis nach Klick', () => {
      renderUseCase()
      const ucName = screen.getByText('KI-Dokumentenprüfung')
      const clickable = ucName.closest('[class*="cursor-pointer"]') as HTMLElement
      fireEvent.click(clickable)
      expect(screen.getByText(/Governance:/i)).toBeInTheDocument()
    })

    it('zeigt Link zu /usecase im expand-Bereich', () => {
      renderUseCase()
      const ucName = screen.getByText('KI-Dokumentenprüfung')
      const clickable = ucName.closest('[class*="cursor-pointer"]') as HTMLElement
      fireEvent.click(clickable)
      expect(screen.getByRole('link', { name: /In Use Cases öffnen/i })).toHaveAttribute('href', '/usecase')
    })

    it('zeigt keinen Governance-Abschnitt wenn governance_result null', () => {
      renderUseCase([
        { id: 'ug', name: 'Ohne Gov', domain: null, weighted_score: null, quadrant: null, governance_result: null },
      ])
      const ucName = screen.getByText('Ohne Gov')
      const clickable = ucName.closest('[class*="cursor-pointer"]') as HTMLElement
      fireEvent.click(clickable)
      expect(screen.queryByText(/Governance:/i)).not.toBeInTheDocument()
    })
  })

  describe('Vergleich-Button', () => {
    it('zeigt keinen Vergleichen-Button im UseCase-Tab (Compare-Panel noch nicht implementiert)', () => {
      renderUseCase()
      expect(screen.queryByRole('button', { name: /vergleichen/i })).not.toBeInTheDocument()
    })
  })
})

// ── Primary-Badge + RowActions — Compliance ───────────────────────────────────

describe('Primary-Badge: Compliance', () => {

  it('zeigt "★ Primär"-Badge wenn primary_compliance_id mit Zeile übereinstimmt', () => {
    render(
      <ErgebnissePageClient
        assessments={[]} architectures={[]} governanceSessions={[]} roadmaps={[]} canvases={[]}
        complianceChecks={COMPLIANCE_ROWS}
        useCases={[]}
        initialPreferences={{ ...BASE_PREFS, primary_compliance_id: 'c1' }}
        tier="free"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /compliance/i }))
    expect(screen.getByText('★ Primär')).toBeInTheDocument()
  })

  it('zeigt "Als Primär"-Button wenn Zeile nicht primär ist', () => {
    renderCompliance()
    expect(screen.getAllByRole('button', { name: /als primär/i }).length).toBeGreaterThan(0)
  })

  it('"Als Primär"-Klick ruft PUT /api/preferences mit primary_compliance_id auf', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    renderCompliance()
    const primärBtn = screen.getAllByRole('button', { name: /als primär/i })[0]
    fireEvent.click(primärBtn)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/preferences',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('primary_compliance_id'),
      })
    )
  })

  it('Löschen-Fluss: Bestätigung erforderlich, dann DELETE /api/compliance/{id}', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
    renderCompliance()
    const löschenBtns = screen.getAllByRole('button', { name: /^löschen$/i })
    fireEvent.click(löschenBtns[0])
    const jaBtn = screen.getByRole('button', { name: /ja, löschen/i })
    expect(jaBtn).toBeInTheDocument()
    fireEvent.click(jaBtn)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^\/api\/compliance\/c/),
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('Abbrechen schließt den Bestätigungs-Dialog ohne DELETE-Aufruf', () => {
    renderCompliance()
    const löschenBtns = screen.getAllByRole('button', { name: /^löschen$/i })
    fireEvent.click(löschenBtns[0])
    fireEvent.click(screen.getByRole('button', { name: /abbrechen/i }))
    expect(screen.queryByRole('button', { name: /ja, löschen/i })).not.toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled()
  })
})

// ── Primary-Badge + RowActions — UseCase ──────────────────────────────────────

describe('Primary-Badge: UseCase', () => {

  it('zeigt "★ Primär"-Badge wenn primary_usecase_id mit Zeile übereinstimmt', () => {
    render(
      <ErgebnissePageClient
        assessments={[]} architectures={[]} governanceSessions={[]} roadmaps={[]} canvases={[]}
        complianceChecks={[]}
        useCases={USE_CASE_ROWS}
        initialPreferences={{ ...BASE_PREFS, primary_usecase_id: 'u1' }}
        tier="free"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /use cases/i }))
    expect(screen.getByText('★ Primär')).toBeInTheDocument()
  })

  it('"Als Primär"-Klick ruft PUT /api/preferences mit primary_usecase_id auf', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    renderUseCase()
    const primärBtn = screen.getAllByRole('button', { name: /als primär/i })[0]
    fireEvent.click(primärBtn)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/preferences',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('primary_usecase_id'),
      })
    )
  })

  it('Löschen-Fluss: Bestätigung erforderlich, dann DELETE /api/usecase/{id}', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
    renderUseCase()
    const löschenBtns = screen.getAllByRole('button', { name: /^löschen$/i })
    fireEvent.click(löschenBtns[0])
    fireEvent.click(screen.getByRole('button', { name: /ja, löschen/i }))
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^\/api\/usecase\/u/),
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})

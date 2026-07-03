import { render, screen, fireEvent } from '@testing-library/react'
import { ErgebnissePageClient, type RoadmapRow, type ArchitectureRow } from '@/app/(dashboard)/ergebnisse/ErgebnissePageClient'

global.fetch = jest.fn()

const BASE_PREFS = {
  primary_assessment_id: null,
  primary_governance_id: null,
  primary_roadmap_id: null,
  primary_architecture_id: null,
  primary_canvas_id: null,
}

// ── Roadmap fixtures ──────────────────────────────────────────────────────────

const ROADMAPS: RoadmapRow[] = [
  {
    id: 'r1',
    title: 'AI Starter Roadmap',
    archetype: 'starter',
    phases: [
      { title: 'Fundament', duration: '0–3 Monate', focus: 'Datenstrategie' },
      { title: 'Piloten', duration: '3–6 Monate', focus: 'Erste Use Cases' },
    ],
    updated_at: '2026-06-01T10:00:00Z',
  },
  {
    id: 'r2',
    title: 'AI Scaler Roadmap',
    archetype: 'scaler',
    phases: [
      { title: 'Skalierung', duration: '0–6 Monate', focus: 'Plattformaufbau' },
      { title: 'Optimierung', duration: '6–12 Monate', focus: 'MLOps' },
      { title: 'Expansion', duration: '12–18 Monate', focus: 'Neue Domänen' },
    ],
    updated_at: '2026-06-15T10:00:00Z',
  },
]

// ── Architecture fixtures ─────────────────────────────────────────────────────

const ARCHITECTURES: ArchitectureRow[] = [
  {
    id: 'a1',
    title: 'RAG-Architektur',
    wizard_data: { infra: 'cloud' },
    result: {
      pattern: 'RAG Pipeline',
      description: 'Retrieval-Augmented Generation für Dokumentensuche',
      layers: [
        { name: 'Daten', role: 'Quellschicht', components: ['Azure Data Lake', 'SAP HANA'] },
        { name: 'Modell', role: 'Inferenz', components: ['GPT-4o'] },
      ],
    },
    updated_at: '2026-06-01T10:00:00Z',
  },
  {
    id: 'a2',
    title: 'Agent-Architektur',
    wizard_data: { infra: 'on-prem' },
    result: {
      pattern: 'Agent Orchestration',
      description: 'Multi-Agent-System für autonome Prozesse',
      layers: [
        { name: 'Daten', role: 'Quellschicht', components: ['PostgreSQL'] },
        { name: 'Serving', role: 'API-Schicht', components: ['FastAPI', 'LangChain'] },
      ],
    },
    updated_at: '2026-06-15T10:00:00Z',
  },
]

function renderWithTab(tab: 'roadmap' | 'architecture', roadmaps = ROADMAPS, architectures = ARCHITECTURES) {
  const { container } = render(
    <ErgebnissePageClient
      assessments={[]}
      architectures={architectures}
      governanceSessions={[]}
      roadmaps={roadmaps}
      canvases={[]}
      initialPreferences={BASE_PREFS}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: new RegExp(tab === 'roadmap' ? 'roadmap' : 'architektur', 'i') }))
  return container
}

function activateCompare() {
  fireEvent.click(screen.getByRole('button', { name: /vergleichen/i }))
  const checkboxes = screen.getAllByRole('checkbox')
  fireEvent.click(checkboxes[0])
  fireEvent.click(checkboxes[1])
}

// ── Roadmap tests (#52) ───────────────────────────────────────────────────────

describe('Roadmap-Vergleich (#52): Phaseninhalte', () => {
  afterEach(() => jest.resetAllMocks())

  it('zeigt Vergleichs-Panel mit Überschrift', () => {
    renderWithTab('roadmap')
    activateCompare()
    expect(screen.getByText('Vergleich: zwei Roadmaps')).toBeInTheDocument()
  })

  it('zeigt Archetypen beider Roadmaps', () => {
    renderWithTab('roadmap')
    activateCompare()
    expect(screen.getAllByText('AI Starter').length).toBeGreaterThan(0)
    expect(screen.getAllByText('AI Scaler').length).toBeGreaterThan(0)
  })

  it('zeigt Phase-Titel für beide Roadmaps', () => {
    renderWithTab('roadmap')
    activateCompare()
    expect(screen.getByText('Fundament')).toBeInTheDocument()
    expect(screen.getByText('Skalierung')).toBeInTheDocument()
  })

  it('zeigt Phasen-Dauer', () => {
    renderWithTab('roadmap')
    activateCompare()
    expect(screen.getByText('0–3 Monate')).toBeInTheDocument()
    expect(screen.getByText('0–6 Monate')).toBeInTheDocument()
  })

  it('zeigt Phasen-Fokus', () => {
    renderWithTab('roadmap')
    activateCompare()
    expect(screen.getByText('Datenstrategie')).toBeInTheDocument()
    expect(screen.getByText('Plattformaufbau')).toBeInTheDocument()
  })

  it('zeigt alle Phasen inkl. fehlender Phase bei kürzerer Roadmap', () => {
    renderWithTab('roadmap')
    activateCompare()
    // r2 has 3 phases, r1 has only 2 — Phase 3 label should appear
    expect(screen.getAllByText(/Phase 3/i).length).toBeGreaterThan(0)
    // r1 has no phase 3 — should show "—"
    expect(screen.getByText('Expansion')).toBeInTheDocument()
  })

  it('zeigt "—" für fehlende Phase in kürzerer Roadmap', () => {
    renderWithTab('roadmap')
    activateCompare()
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })
})

// ── Architecture tests (#51) ──────────────────────────────────────────────────

describe('Architektur-Vergleich (#51): result.pattern + layers', () => {
  afterEach(() => jest.resetAllMocks())

  it('zeigt Vergleichs-Panel mit Überschrift', () => {
    renderWithTab('architecture')
    activateCompare()
    expect(screen.getByText('Vergleich: zwei Architekturen')).toBeInTheDocument()
  })

  it('zeigt Pattern-Namen beider Architekturen', () => {
    renderWithTab('architecture')
    activateCompare()
    expect(screen.getByText('RAG Pipeline')).toBeInTheDocument()
    expect(screen.getByText('Agent Orchestration')).toBeInTheDocument()
  })

  it('zeigt Muster-Zeile', () => {
    renderWithTab('architecture')
    activateCompare()
    expect(screen.getByText('Muster')).toBeInTheDocument()
  })

  it('zeigt Beschreibung beider Architekturen', () => {
    renderWithTab('architecture')
    activateCompare()
    expect(screen.getByText(/Retrieval-Augmented Generation/)).toBeInTheDocument()
    expect(screen.getByText(/Multi-Agent-System/)).toBeInTheDocument()
  })

  it('zeigt Layer-Namen aus beiden Architekturen', () => {
    renderWithTab('architecture')
    activateCompare()
    expect(screen.getByText('Daten')).toBeInTheDocument()
    expect(screen.getByText('Modell')).toBeInTheDocument()
    expect(screen.getByText('Serving')).toBeInTheDocument()
  })

  it('zeigt Komponenten-Anzahl je Layer', () => {
    renderWithTab('architecture')
    activateCompare()
    expect(screen.getAllByText('2 Komponenten').length).toBeGreaterThan(0)
    expect(screen.getAllByText('1 Komponenten').length).toBeGreaterThan(0)
  })

  it('zeigt "—" für Layer der nur in einer Architektur existiert', () => {
    renderWithTab('architecture')
    activateCompare()
    // "Modell" layer only exists in a1, not a2 → a2 column shows "—"
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })
})

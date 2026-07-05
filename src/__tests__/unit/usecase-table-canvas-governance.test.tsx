import { render, screen, fireEvent } from '@testing-library/react'
import { UseCaseTable } from '@/components/modules/usecase/UseCaseTable'
import { GovernancePageClient } from '@/app/(dashboard)/governance/GovernancePageClient'
import type { UseCase } from '@/types'

global.fetch = jest.fn()

const BASE_UC: UseCase = {
  id: 'uc1',
  portfolio_id: 'p1',
  name: 'OCR für Rechnungen',
  domain: 'Finanzen',
  description: 'Automatische Rechnungsverarbeitung',
  canvas_id: null,
  governance_result: null,
  scores: { value: 4, feasibility: 3, data_readiness: 3, risk: 2, speed: 4 },
  weighted_score: 3.5,
  quadrant: 'quick_win',
  created_at: '2026-06-01T10:00:00Z',
  updated_at: '2026-06-01T10:00:00Z',
}

const UC_WITH_CANVAS: UseCase = { ...BASE_UC, id: 'uc2', canvas_id: 'canvas-abc-123' }

describe('UseCaseTable: Canvas-Badge (#54)', () => {
  afterEach(() => jest.resetAllMocks())

  it('zeigt kein Canvas-Badge wenn canvas_id null ist', () => {
    render(<UseCaseTable useCases={[BASE_UC]} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.queryByText(/canvas/i)).not.toBeInTheDocument()
  })

  it('zeigt Canvas-Badge "Canvas verknüpft" wenn canvas_id gesetzt, aber kein canvases-Prop', () => {
    render(<UseCaseTable useCases={[UC_WITH_CANVAS]} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText(/canvas verknüpft/i)).toBeInTheDocument()
  })

  it('zeigt Canvas-Titel wenn canvases-Prop mit passendem Canvas übergeben', () => {
    const canvases = [{ id: 'canvas-abc-123', title: 'AI-Strategie 2026' }]
    render(<UseCaseTable useCases={[UC_WITH_CANVAS]} onEdit={jest.fn()} onDelete={jest.fn()} canvases={canvases} />)
    expect(screen.getByText('□ Canvas: AI-Strategie 2026')).toBeInTheDocument()
  })

  it('fällt zurück auf "Canvas verknüpft" wenn kein passender Canvas gefunden', () => {
    const canvases = [{ id: 'other-canvas-id', title: 'Anderer Canvas' }]
    render(<UseCaseTable useCases={[UC_WITH_CANVAS]} onEdit={jest.fn()} onDelete={jest.fn()} canvases={canvases} />)
    expect(screen.getByText(/canvas verknüpft/i)).toBeInTheDocument()
    expect(screen.queryByText(/AI-Strategie/)).not.toBeInTheDocument()
  })

  it('Canvas-Badge ist unterhalb des Use-Case-Namens sichtbar', () => {
    render(<UseCaseTable useCases={[UC_WITH_CANVAS]} onEdit={jest.fn()} onDelete={jest.fn()} />)
    const name = screen.getByText('OCR für Rechnungen')
    const badge = screen.getByText(/canvas verknüpft/i)
    expect(name.closest('td')).toContainElement(badge)
  })

  it('Canvas-Badge ist ein Link zu /canvas', () => {
    render(<UseCaseTable useCases={[UC_WITH_CANVAS]} onEdit={jest.fn()} onDelete={jest.fn()} />)
    const badge = screen.getByText(/canvas verknüpft/i)
    expect(badge.closest('a')).toHaveAttribute('href', '/canvas')
  })
})

describe('UseCaseTable: Governance Quick-Start (#56)', () => {
  afterEach(() => jest.resetAllMocks())

  it('zeigt Governance-Link für jeden Use Case', () => {
    render(<UseCaseTable useCases={[BASE_UC]} onEdit={jest.fn()} onDelete={jest.fn()} />)
    const link = screen.getByTitle(/governance-check/i)
    expect(link).toBeInTheDocument()
  })

  it('Governance-Link zeigt auf /governance?from=usecase&id=<id>', () => {
    render(<UseCaseTable useCases={[BASE_UC]} onEdit={jest.fn()} onDelete={jest.fn()} />)
    const link = screen.getByTitle(/governance-check/i)
    expect(link).toHaveAttribute('href', `/governance?from=usecase&id=${BASE_UC.id}`)
  })

  it('Architektur-Link ist weiterhin vorhanden', () => {
    render(<UseCaseTable useCases={[BASE_UC]} onEdit={jest.fn()} onDelete={jest.fn()} />)
    const archLink = screen.getByTitle(/architektur-generator/i)
    expect(archLink).toHaveAttribute('href', `/architecture?from=usecase&id=${BASE_UC.id}`)
  })

  it('zeigt Governance-Links für mehrere Use Cases', () => {
    const uc2 = { ...BASE_UC, id: 'uc2', name: 'Chatbot' }
    render(<UseCaseTable useCases={[BASE_UC, uc2]} onEdit={jest.fn()} onDelete={jest.fn()} />)
    const govLinks = screen.getAllByTitle(/governance-check/i)
    expect(govLinks).toHaveLength(2)
    expect(govLinks[0]).toHaveAttribute('href', `/governance?from=usecase&id=uc1`)
    expect(govLinks[1]).toHaveAttribute('href', `/governance?from=usecase&id=uc2`)
  })
})

describe('GovernancePageClient: Use-Case-Prefill (#56)', () => {
  afterEach(() => jest.resetAllMocks())

  it('zeigt ein Namensfeld im Wizard', () => {
    render(<GovernancePageClient tier="free" sessions={[]} />)
    expect(screen.getByLabelText(/use case/i)).toBeInTheDocument()
  })

  it('Namensfeld ist leer wenn kein initialUseCaseName übergeben', () => {
    render(<GovernancePageClient tier="free" sessions={[]} />)
    const input = screen.getByLabelText(/use case/i) as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('Namensfeld ist vorausgefüllt wenn initialUseCaseName übergeben', () => {
    render(<GovernancePageClient tier="free" sessions={[]} initialUseCaseName="KI-Dokumentenprüfung" />)
    const input = screen.getByLabelText(/use case/i) as HTMLInputElement
    expect(input.value).toBe('KI-Dokumentenprüfung')
  })

  it('Nutzer kann den vorausgefüllten Namen ändern', () => {
    render(<GovernancePageClient tier="free" sessions={[]} initialUseCaseName="Alter Name" />)
    const input = screen.getByLabelText(/use case/i)
    fireEvent.change(input, { target: { value: 'Neuer Name' } })
    expect((input as HTMLInputElement).value).toBe('Neuer Name')
  })
})

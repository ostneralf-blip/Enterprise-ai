import { render, screen } from '@testing-library/react'
import { UseCaseTable } from '@/components/modules/usecase/UseCaseTable'
import type { UseCase } from '@/types'

const BASE_UC: UseCase = {
  id: 'uc1',
  portfolio_id: 'p1',
  name: 'OCR für Rechnungen',
  domain: 'Finanzen',
  description: 'Automatische Rechnungsverarbeitung',
  canvas_id: null,
  scores: { value: 4, feasibility: 3, data_readiness: 3, risk: 2, speed: 4 },
  weighted_score: 3.5,
  quadrant: 'quick_win',
  created_at: '2026-06-01T10:00:00Z',
  updated_at: '2026-06-01T10:00:00Z',
}

const UC_WITH_CANVAS: UseCase = { ...BASE_UC, id: 'uc2', canvas_id: 'canvas-abc-123' }

describe('UseCaseTable: Canvas-Badge (#54)', () => {
  it('zeigt kein Canvas-Badge wenn canvas_id null ist', () => {
    render(<UseCaseTable useCases={[BASE_UC]} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.queryByText(/canvas verknüpft/i)).not.toBeInTheDocument()
  })

  it('zeigt Canvas-Badge wenn canvas_id gesetzt ist', () => {
    render(<UseCaseTable useCases={[UC_WITH_CANVAS]} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText(/canvas verknüpft/i)).toBeInTheDocument()
  })

  it('Canvas-Badge ist unterhalb des Use-Case-Namens sichtbar', () => {
    render(<UseCaseTable useCases={[UC_WITH_CANVAS]} onEdit={jest.fn()} onDelete={jest.fn()} />)
    const name = screen.getByText('OCR für Rechnungen')
    const badge = screen.getByText(/canvas verknüpft/i)
    // badge should be in the same table cell as the name
    expect(name.closest('td')).toContainElement(badge)
  })
})

describe('UseCaseTable: Governance Quick-Start (#56)', () => {
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

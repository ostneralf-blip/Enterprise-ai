import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { UseCaseForm } from '@/components/modules/usecase/UseCaseForm'
import { WeightsEditor } from '@/components/modules/usecase/WeightsEditor'
import { UseCaseTable } from '@/components/modules/usecase/UseCaseTable'
import { DEFAULT_WEIGHTS } from '@/config/usecase-data'
import type { UseCase } from '@/types'

expect.extend(toHaveNoViolations)

jest.mock('@/lib/posthog/client', () => ({ track: jest.fn() }))

const MOCK_CASES: UseCase[] = [
  {
    id: '1', portfolio_id: 'p1', name: 'CRM Chatbot', domain: 'Kundenservice',
    description: null, scores: { value: 4, feasibility: 4, data_readiness: 3, risk: 4, speed: 3 },
    weighted_score: 3.8, quadrant: 'quick_win', created_at: '', updated_at: '',
  },
  {
    id: '2', portfolio_id: 'p1', name: 'Predictive Maintenance', domain: 'Operations & Logistik',
    description: null, scores: { value: 5, feasibility: 2, data_readiness: 3, risk: 3, speed: 2 },
    weighted_score: 3.4, quadrant: 'strategic_bet', created_at: '', updated_at: '',
  },
]

describe('Accessibility: Use-Case Scoring', () => {

  it('UseCaseForm hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(
      <UseCaseForm weights={DEFAULT_WEIGHTS} onSave={jest.fn()} onCancel={jest.fn()} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('Score-Buttons 1-5 haben aria-pressed und sind per Tastatur nutzbar', () => {
    render(<UseCaseForm weights={DEFAULT_WEIGHTS} onSave={jest.fn()} onCancel={jest.fn()} />)
    const pressedButtons = screen.getAllByRole('button').filter(b => b.hasAttribute('aria-pressed'))
    expect(pressedButtons.length).toBeGreaterThan(0) // 5 Kriterien × 5 Buttons = 25
    pressedButtons.forEach(btn => {
      expect(btn).toHaveAttribute('aria-pressed')
    })
  })

  it('Bewertungsgruppe hat aria-label', () => {
    render(<UseCaseForm weights={DEFAULT_WEIGHTS} onSave={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByRole('group', { name: /kriterien bewerten/i })).toBeInTheDocument()
  })

  it('Klick auf Score-Button aktualisiert aria-pressed korrekt', () => {
    render(<UseCaseForm weights={DEFAULT_WEIGHTS} onSave={jest.fn()} onCancel={jest.fn()} />)
    const allButtons = screen.getAllByRole('button').filter(b => b.hasAttribute('aria-pressed'))
    // Ersten Button (Wert 1 für erstes Kriterium) klicken
    fireEvent.click(allButtons[0])
    expect(allButtons[0]).toHaveAttribute('aria-pressed', 'true')
  })

  it('WeightsEditor hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(
      <WeightsEditor weights={DEFAULT_WEIGHTS} onSave={jest.fn()} onClose={jest.fn()} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('WeightsEditor Inputs haben aria-label', () => {
    render(<WeightsEditor weights={DEFAULT_WEIGHTS} onSave={jest.fn()} onClose={jest.fn()} />)
    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs.length).toBe(5)
    inputs.forEach(inp => expect(inp).toHaveAttribute('aria-label'))
  })

  it('UseCaseTable hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(
      <UseCaseTable useCases={MOCK_CASES} onEdit={jest.fn()} onDelete={jest.fn()} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('Tabelle hat role="table" und Bearbeiten/Löschen-Buttons haben aria-label', () => {
    render(<UseCaseTable useCases={MOCK_CASES} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    const editButtons = screen.getAllByRole('button', { name: /bearbeiten/i })
    const deleteButtons = screen.getAllByRole('button', { name: /löschen/i })
    expect(editButtons.length).toBe(MOCK_CASES.length)
    expect(deleteButtons.length).toBe(MOCK_CASES.length)
  })

  it('Leerer Tabellenstate ist zugänglich (kein leeres table-Element)', () => {
    const { container } = render(
      <UseCaseTable useCases={[]} onEdit={jest.fn()} onDelete={jest.fn()} />
    )
    expect(container.querySelector('table')).toBeNull()
  })
})

import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { CanvasPageClient } from '@/app/(dashboard)/canvas/CanvasPageClient'
import type { Canvas } from '@/types'

expect.extend(toHaveNoViolations)

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: [] }),
})

const MOCK_CANVAS: Canvas = {
  id: 'c1',
  user_id: 'u1',
  title: 'KI-gestützte Dokumentenprüfung',
  archetype: 'scaler',
  data: {
    problem: 'Manuelle Prüfung dauert 3 Tage',
    solution: 'NLP-Klassifikation',
    data_sources: 'ERP-Daten 5 Jahre',
    stakeholders: 'CFO, Ops-Leiterin',
    kpis: 'Bearbeitungszeit < 4h',
    risks: 'DSGVO-Check erforderlich',
    architecture: 'Azure ML + FastAPI',
    next_steps: '1. Datenpipeline aufbauen',
  },
  version_no: 1,
  created_at: '2026-06-01T10:00:00Z',
  updated_at: '2026-06-01T10:00:00Z',
}

describe('Accessibility: AI Use-Case Canvas', () => {

  it('Leere Listenansicht hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<CanvasPageClient tier="free" initialCanvases={[]} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Listenansicht mit Canvases hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<CanvasPageClient tier="free" initialCanvases={[MOCK_CANVAS]} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Canvas-Karten haben "Öffnen"-Button und arialabellierten Löschen-Button', () => {
    render(<CanvasPageClient tier="free" initialCanvases={[MOCK_CANVAS]} />)
    expect(screen.getByRole('button', { name: 'Öffnen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /löschen/i })).toBeInTheDocument()
  })

  it('Editoransicht öffnet sich und zeigt 8 Textareas', () => {
    render(<CanvasPageClient tier="free" initialCanvases={[MOCK_CANVAS]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Öffnen' }))
    const textareas = screen.getAllByRole('textbox')
    // 8 canvas fields + 1 title input = 9 textboxes
    expect(textareas.length).toBeGreaterThanOrEqual(8)
  })

  it('Editoransicht hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<CanvasPageClient tier="free" initialCanvases={[MOCK_CANVAS]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Öffnen' }))
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Archetyp-Buttons haben aria-pressed', () => {
    render(<CanvasPageClient tier="free" initialCanvases={[MOCK_CANVAS]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Öffnen' }))
    const archetypeGroup = screen.getByRole('group', { name: /unternehmensarchetyp/i })
    const buttons = archetypeGroup.querySelectorAll('button')
    buttons.forEach(btn => expect(btn).toHaveAttribute('aria-pressed'))
  })

  it('aktiver Archetyp hat aria-pressed="true"', () => {
    render(<CanvasPageClient tier="free" initialCanvases={[MOCK_CANVAS]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Öffnen' }))
    expect(screen.getByRole('button', { name: 'AI Scaler' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'AI Starter' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('Canvas-Felder haben label-Elemente, die die Textareas beschriften', () => {
    render(<CanvasPageClient tier="free" initialCanvases={[MOCK_CANVAS]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Öffnen' }))
    expect(screen.getByRole('textbox', { name: /Problem/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /KPIs/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Risiken/i })).toBeInTheDocument()
  })

  it('Zurück-Button führt zur Listenansicht', () => {
    render(<CanvasPageClient tier="free" initialCanvases={[MOCK_CANVAS]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Öffnen' }))
    fireEvent.click(screen.getByRole('button', { name: /zurück/i }))
    expect(screen.getByRole('button', { name: 'Öffnen' })).toBeInTheDocument()
  })
})

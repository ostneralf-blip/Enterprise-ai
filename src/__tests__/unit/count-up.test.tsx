import { render, screen, act } from '@testing-library/react'
import { CountUp } from '@/components/dashboard/CountUp'

jest.useFakeTimers()

describe('CountUp', () => {
  it('startet bei 0 und endet beim Zielwert', () => {
    render(<CountUp value={7} duration={600} />)
    expect(screen.getByText('0')).toBeInTheDocument()
    act(() => { jest.runAllTimers() })
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('zeigt sofort 0 wenn value=0', () => {
    render(<CountUp value={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})

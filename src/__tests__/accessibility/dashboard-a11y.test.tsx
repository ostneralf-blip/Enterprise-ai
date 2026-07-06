import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { GuidedPathHero } from '@/components/dashboard/GuidedPathHero'

expect.extend(toHaveNoViolations)

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  )
  MockLink.displayName = 'MockLink'
  return MockLink
})

const mockSteps = [
  { step: 1, icon: '◎', title: 'Assessment', desc: '', href: '/assessment', done: true },
  { step: 2, icon: '⊞', title: 'Use-Case', desc: '', href: '/usecase', done: false },
  { step: 3, icon: '◧', title: 'Canvas', desc: '', href: '/canvas', done: false },
  { step: 4, icon: '⚖', title: 'Governance', desc: '', href: '/governance', done: false },
  { step: 5, icon: '✓', title: 'Compliance', desc: '', href: '/compliance', done: false },
  { step: 6, icon: '⬡', title: 'Architektur', desc: '', href: '/architecture', done: false },
  { step: 7, icon: '□', title: 'Summary', desc: '', href: '/zusammenfassung', done: false },
]

describe('Accessibility: GuidedPathHero', () => {
  it('hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<GuidedPathHero steps={mockSteps} tier="free" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('Progressbar hat korrekte ARIA-Attribute', () => {
    const { container } = render(<GuidedPathHero steps={mockSteps} tier="free" />)
    const bar = container.querySelector('[role="progressbar"]')
    expect(bar).not.toBeNull()
    expect(bar).toHaveAttribute('aria-valuenow')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(bar).toHaveAttribute('aria-label')
  })
})

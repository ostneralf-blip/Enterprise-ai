// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock()-Factory wird gehoisted, ES-Import geht hier nicht
jest.mock('next-intl', () => require('../test-utils/next-intl-mock'))
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { SharedLinksClient } from '@/app/[locale]/(dashboard)/geteilte-links/SharedLinksClient'

expect.extend(toHaveNoViolations)

describe('Accessibility: SharedLinksClient', () => {
  it('Tabelle mit Links ist barrierefrei', async () => {
    const { container } = render(<SharedLinksClient initialLinks={[
      { id: '1', token: 'abc', module: 'architecture', entity_id: 'e1', expires_at: null, view_count: 3, created_at: '2026-07-01T00:00:00Z' },
    ]} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('leerer Zustand ist barrierefrei', async () => {
    const { container } = render(<SharedLinksClient initialLinks={[]} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock()-Factory wird gehoisted, ES-Import geht hier nicht
jest.mock('next-intl', () => require('../test-utils/next-intl-mock'))
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { DiagramStyleSwitcher } from '@/components/modules/architecture/diagram/DiagramStyleSwitcher'

expect.extend(toHaveNoViolations)

describe('Accessibility: DiagramStyleSwitcher', () => {
  it('ist barrierefrei', async () => {
    const { container } = render(<DiagramStyleSwitcher activePreset="architect" onChange={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

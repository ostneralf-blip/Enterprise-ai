// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock()-Factory wird gehoisted, ES-Import geht hier nicht
jest.mock('next-intl', () => require('../test-utils/next-intl-mock'))
import { render, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { DiagramStyleSwitcher } from '@/components/modules/architecture/diagram/DiagramStyleSwitcher'
import { resolvePreset } from '@/config/diagram-styles'

expect.extend(toHaveNoViolations)

describe('Accessibility: DiagramStyleSwitcher', () => {
  it('ist barrierefrei (Presets)', async () => {
    const { container } = render(
      <DiagramStyleSwitcher style={resolvePreset('architect')} onPreset={() => {}} onStyleChange={() => {}} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ist barrierefrei mit aufgeklapptem Override', async () => {
    const { container, getByText } = render(
      <DiagramStyleSwitcher style={resolvePreset('architect')} onPreset={() => {}} onStyleChange={() => {}} />
    )
    fireEvent.click(getByText('Ansicht anpassen'))
    expect(await axe(container)).toHaveNoViolations()
  })
})

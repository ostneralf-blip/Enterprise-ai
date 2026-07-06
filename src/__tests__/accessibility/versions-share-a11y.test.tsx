import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { VersionsPanel } from '@/components/shared/VersionsPanel'
import { ShareButton } from '@/components/shared/ShareButton'

expect.extend(toHaveNoViolations)

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: [] }),
})

const ENTITY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

describe('Accessibility: VersionsPanel', () => {
  it('Free-Tier Upgrade-Link hat keine WCAG-Verstöße', async () => {
    const { container } = render(
      <VersionsPanel module="governance" entityId={ENTITY_ID} tier="free" currentData={{}} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Pro-Tier Toggle-Button hat keine WCAG-Verstöße', async () => {
    const { container } = render(
      <VersionsPanel module="roadmap" entityId={ENTITY_ID} tier="pro" currentData={{}} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Enterprise-Tier Toggle-Button hat keine WCAG-Verstöße', async () => {
    const { container } = render(
      <VersionsPanel module="canvas" entityId={ENTITY_ID} tier="enterprise" currentData={{}} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('Accessibility: ShareButton', () => {
  it('Free-Tier Upgrade-Link hat keine WCAG-Verstöße', async () => {
    const { container } = render(
      <ShareButton module="governance" entityId={ENTITY_ID} tier="free" />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Pro-Tier Teilen-Button hat keine WCAG-Verstöße', async () => {
    const { container } = render(
      <ShareButton module="roadmap" entityId={ENTITY_ID} tier="pro" />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Enterprise-Tier Teilen-Button hat keine WCAG-Verstöße', async () => {
    const { container } = render(
      <ShareButton module="canvas" entityId={ENTITY_ID} tier="enterprise" />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

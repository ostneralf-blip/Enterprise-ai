import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VersionsPanel } from '@/components/shared/VersionsPanel'
import { ShareButton } from '@/components/shared/ShareButton'

const ENTITY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: [] }),
  })
})

afterEach(() => jest.clearAllMocks())

// ──────────────────────────────────────────────
// VersionsPanel
// ──────────────────────────────────────────────

describe('VersionsPanel', () => {
  describe('Free-Tier', () => {
    it('rendert Upgrade-Link statt Panel', () => {
      render(<VersionsPanel module="governance" entityId={ENTITY_ID} tier="free" currentData={{}} />)
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/upgrade')
    })

    it('Upgrade-Link enthält "Pro"-Hinweis', () => {
      render(<VersionsPanel module="governance" entityId={ENTITY_ID} tier="free" currentData={{}} />)
      expect(screen.getByRole('link').textContent).toMatch(/pro/i)
    })

    it('kein fetch-Aufruf bei free-Tier', () => {
      render(<VersionsPanel module="governance" entityId={ENTITY_ID} tier="free" currentData={{}} />)
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Pro-Tier', () => {
    it('rendert Toggle-Button statt Upgrade-Link', () => {
      render(<VersionsPanel module="governance" entityId={ENTITY_ID} tier="pro" currentData={{}} />)
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    it('Panel ist initial geschlossen', () => {
      render(<VersionsPanel module="governance" entityId={ENTITY_ID} tier="pro" currentData={{}} />)
      expect(screen.queryByText(/version speichern/i)).not.toBeInTheDocument()
    })

    it('Öffnen lädt Versionen via GET /api/versions', async () => {
      render(<VersionsPanel module="roadmap" entityId={ENTITY_ID} tier="pro" currentData={{}} />)
      fireEvent.click(screen.getByRole('button'))
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/versions?module=roadmap&entity_id=${ENTITY_ID}`)
        )
      })
    })

    it('enterprise-Tier verhält sich wie pro', () => {
      render(<VersionsPanel module="canvas" entityId={ENTITY_ID} tier="enterprise" currentData={{}} />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
})

// ──────────────────────────────────────────────
// ShareButton
// ──────────────────────────────────────────────

describe('ShareButton', () => {
  describe('Free-Tier', () => {
    it('rendert Upgrade-Link statt Button', () => {
      render(<ShareButton module="governance" entityId={ENTITY_ID} tier="free" />)
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/upgrade')
    })

    it('Upgrade-Link enthält "Pro"-Hinweis', () => {
      render(<ShareButton module="governance" entityId={ENTITY_ID} tier="free" />)
      expect(screen.getByRole('link').textContent).toMatch(/pro/i)
    })

    it('kein fetch-Aufruf bei free-Tier', () => {
      render(<ShareButton module="governance" entityId={ENTITY_ID} tier="free" />)
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Pro-Tier', () => {
    it('rendert Teilen-Button', () => {
      render(<ShareButton module="roadmap" entityId={ENTITY_ID} tier="pro" />)
      expect(screen.getByRole('button', { name: /teilen/i })).toBeInTheDocument()
    })

    it('Dropdown ist initial geschlossen', () => {
      render(<ShareButton module="roadmap" entityId={ENTITY_ID} tier="pro" />)
      expect(screen.queryByText(/link erstellen/i)).not.toBeInTheDocument()
    })

    it('enterprise-Tier verhält sich wie pro', () => {
      render(<ShareButton module="canvas" entityId={ENTITY_ID} tier="enterprise" />)
      expect(screen.getByRole('button', { name: /teilen/i })).toBeInTheDocument()
    })
  })
})

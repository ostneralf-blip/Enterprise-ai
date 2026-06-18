import { hasAccess, requiresTier } from '@/lib/utils/tier-check'

describe('Tier-Check Utility (Feature Gating)', () => {

  describe('hasAccess', () => {
    it('free Nutzer hat Zugriff auf free Features', () => {
      expect(hasAccess('free', 'free')).toBe(true)
    })

    it('free Nutzer hat KEINEN Zugriff auf pro Features', () => {
      expect(hasAccess('free', 'pro')).toBe(false)
    })

    it('free Nutzer hat KEINEN Zugriff auf enterprise Features', () => {
      expect(hasAccess('free', 'enterprise')).toBe(false)
    })

    it('pro Nutzer hat Zugriff auf free UND pro Features', () => {
      expect(hasAccess('pro', 'free')).toBe(true)
      expect(hasAccess('pro', 'pro')).toBe(true)
    })

    it('pro Nutzer hat KEINEN Zugriff auf enterprise Features', () => {
      expect(hasAccess('pro', 'enterprise')).toBe(false)
    })

    it('enterprise Nutzer hat Zugriff auf alle Tiers', () => {
      expect(hasAccess('enterprise', 'free')).toBe(true)
      expect(hasAccess('enterprise', 'pro')).toBe(true)
      expect(hasAccess('enterprise', 'enterprise')).toBe(true)
    })
  })

  describe('requiresTier', () => {
    it('ordnet pdf_export korrekt "pro" zu', () => {
      expect(requiresTier('pdf_export')).toBe('pro')
    })

    it('ordnet sso korrekt "enterprise" zu', () => {
      expect(requiresTier('sso')).toBe('enterprise')
    })

    it('ordnet unbekannte Features "free" zu (sicherer Default)', () => {
      expect(requiresTier('some_unknown_feature_xyz')).toBe('free')
    })

    it('KRITISCH: jedes als "pro" markierte Feature darf NICHT gleichzeitig als enterprise-only behandelt werden', () => {
      // Regressionstest gegen Tier-Verwechslung
      const proFeature = requiresTier('pdf_export')
      const entFeature = requiresTier('sso')
      expect(proFeature).not.toBe(entFeature)
    })
  })

  describe('Security: Privilege Escalation Verhinderung', () => {
    it('niedrigerer Tier kann sich nicht selbst höheren Zugriff verschaffen', () => {
      // Simuliert: Was, wenn ein Client manipulierte Tier-Strings sendet?
      const maliciousTier = 'free' as const
      expect(hasAccess(maliciousTier, 'enterprise')).toBe(false)
    })
  })
})

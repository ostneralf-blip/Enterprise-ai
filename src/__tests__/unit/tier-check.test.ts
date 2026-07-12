import { hasAccess, FEATURE_TIERS, type FeatureKey } from '@/config/tiers'

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

  describe('FEATURE_TIERS — einzige Quelle der Wahrheit', () => {
    it('pdf_export ist "pro"', () => {
      expect(FEATURE_TIERS['pdf_export']).toBe('pro')
    })

    it('sso ist "enterprise"', () => {
      expect(FEATURE_TIERS['sso']).toBe('enterprise')
    })

    it('sharing ist "pro"', () => {
      expect(FEATURE_TIERS['sharing']).toBe('pro')
    })

    it('versioning ist "pro"', () => {
      expect(FEATURE_TIERS['versioning']).toBe('pro')
    })

    it('ai_enrich ist "pro"', () => {
      expect(FEATURE_TIERS['ai_enrich']).toBe('pro')
    })

    it('KRITISCH: kein pro-Feature ist gleichzeitig enterprise-only', () => {
      const proKeys = (Object.keys(FEATURE_TIERS) as FeatureKey[]).filter(k => FEATURE_TIERS[k] === 'pro')
      const entKeys = (Object.keys(FEATURE_TIERS) as FeatureKey[]).filter(k => FEATURE_TIERS[k] === 'enterprise')
      const overlap = proKeys.filter(k => entKeys.includes(k))
      expect(overlap).toHaveLength(0)
    })

    it('tabellengetrieben: Free-Nutzer wird für alle Pro-Features blockiert', () => {
      const proFeatures = (Object.keys(FEATURE_TIERS) as FeatureKey[]).filter(k => FEATURE_TIERS[k] === 'pro')
      for (const feature of proFeatures) {
        expect(hasAccess('free', FEATURE_TIERS[feature])).toBe(false)
      }
    })

    it('tabellengetrieben: Pro-Nutzer wird für Enterprise-Features blockiert', () => {
      const entFeatures = (Object.keys(FEATURE_TIERS) as FeatureKey[]).filter(k => FEATURE_TIERS[k] === 'enterprise')
      for (const feature of entFeatures) {
        expect(hasAccess('pro', FEATURE_TIERS[feature])).toBe(false)
      }
    })
  })

  describe('Security: Privilege Escalation Verhinderung', () => {
    it('niedrigerer Tier kann sich nicht selbst höheren Zugriff verschaffen', () => {
      const maliciousTier = 'free' as const
      expect(hasAccess(maliciousTier, 'enterprise')).toBe(false)
    })
  })
})

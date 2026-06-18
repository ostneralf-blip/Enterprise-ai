import type { Tier } from '@/types'

const TIER_RANK: Record<Tier, number> = { free: 0, pro: 1, enterprise: 2 }

export function hasAccess(userTier: Tier, requiredTier: Tier): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[requiredTier]
}

export function requiresTier(feature: string): Tier {
  const proFeatures = [
    'pdf_export', 'save_results', 'versioning', 'sharing',
    'deep_assessment', 'roadmap_edit', 'compliance_full',
    'architecture_wizard', 'csv_export', 'dark_mode'
  ]
  const enterpriseFeatures = [
    'team_sharing', 'sso', 'custom_criteria', 'audit_trail',
    'sap_context', 'branding', 'unlimited_versions'
  ]
  if (enterpriseFeatures.includes(feature)) return 'enterprise'
  if (proFeatures.includes(feature)) return 'pro'
  return 'free'
}

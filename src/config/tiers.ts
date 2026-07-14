import type { Tier } from '@/types'

// Feature → Mindest-Tier-Mapping — einzige Quelle der Wahrheit für Tier-Gating.
// requireFeature() in lib/utils/tier-check.ts erzwingt dies server-seitig.
export const FEATURE_TIERS = {
  pdf_export:          'pro',
  save_results:        'pro',
  versioning:          'pro',
  sharing:             'pro',
  ai_enrich:           'pro',
  deep_assessment:     'pro',
  compliance_full:     'pro',
  architecture_wizard: 'pro',
  presentation_templates: 'pro',
  billing_portal:      'pro',
  team_sharing:        'enterprise',
  sso:                 'enterprise',
  audit_trail:         'enterprise',
} as const satisfies Record<string, Tier>

export type FeatureKey = keyof typeof FEATURE_TIERS

const TIER_RANK: Record<Tier, number> = { free: 0, pro: 1, enterprise: 2 }

// Reine Hilfsfunktion — kein Server-Dependency, sicher in Tests und Client importierbar.
// Wird von requireFeature() (server-only) intern genutzt.
export function hasAccess(userTier: Tier, requiredTier: Tier): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[requiredTier]
}

// Maximale AI-Calls pro Tag und Tier — eine Quelle der Wahrheit.
// Werte können über Admin-Panel (app_settings) in Stufe 3 überschrieben werden.
export const AI_CALL_LIMITS: Record<Tier, number> = {
  free:       1,
  pro:        10,
  enterprise: 50,
}

export const TIER_CONFIG = {
  free: {
    name: 'Explorer',
    price: null,
    color: 'slate',
    limits: {
      saved_results_per_module: 0,
      versions_per_entity: 0,
      use_cases_per_portfolio: 3,
    },
    features: {
      all_free_tools: true,
      quick_scan: true,
      save_results: false,
      pdf_export: false,
      sharing: false,
      versioning: false,
      deep_assessment: false,
      compliance_full: false,
      architecture_wizard: false,
    }
  },
  pro: {
    name: 'Professional',
    price: { monthly: 4900, yearly: 39900 }, // in cents
    color: 'blue',
    limits: {
      saved_results_per_module: -1, // unlimited
      versions_per_entity: 10,
      use_cases_per_portfolio: -1,
    },
    features: {
      all_free_tools: true,
      quick_scan: true,
      save_results: true,
      pdf_export: true,
      sharing: true,
      versioning: true,
      deep_assessment: true,
      compliance_full: true,
      architecture_wizard: true,
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: null, // auf Anfrage
    color: 'emerald',
    limits: {
      saved_results_per_module: -1,
      versions_per_entity: -1,
      use_cases_per_portfolio: -1,
    },
    features: {
      all_free_tools: true,
      quick_scan: true,
      save_results: true,
      pdf_export: true,
      sharing: true,
      versioning: true,
      deep_assessment: true,
      compliance_full: true,
      architecture_wizard: true,
      team_sharing: true,
      sso: true,
      sap_context: true,
      audit_trail: true,
      custom_criteria: true,
    }
  },
} satisfies Record<Tier, unknown>

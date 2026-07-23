import type { Tier } from '@/types'

// Feature → Mindest-Tier-Mapping — einzige Quelle der Wahrheit für Tier-Gating.
// requireFeature() in lib/utils/tier-check.ts erzwingt dies server-seitig.
export const FEATURE_TIERS = {
  pdf_export:          'pro',
  // Free darf speichern (Issue #222), aber mit Tageslimit pro Tool —
  // durchgesetzt über enforceSaveQuota() / FREE_DAILY_SAVES_PER_MODULE.
  save_results:        'free',
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

// Free-Tier: max. neue gespeicherte Ergebnisse pro Tag und pro Tool (Issue #222).
// Pro/Enterprise speichern unbegrenzt. Enforcement server-seitig via
// enforceSaveQuota() (lib/tier/save-quota.ts). Kann später über app_settings
// überschreibbar gemacht werden (analog AI_CALL_LIMITS).
export const FREE_DAILY_SAVES_PER_MODULE = 5

export const TIER_CONFIG = {
  free: {
    name: 'Explorer',
    price: null,
    color: 'slate',
    limits: {
      saved_results_per_module: -1, // gesamt unbegrenzt, aber pro Tag gedeckelt (siehe daily_saves_per_module)
      daily_saves_per_module: FREE_DAILY_SAVES_PER_MODULE,
      versions_per_entity: 0,
      use_cases_per_portfolio: 3,
    },
    features: {
      all_free_tools: true,
      quick_scan: true,
      save_results: true,
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
      daily_saves_per_module: -1,   // unbegrenzt
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
      daily_saves_per_module: -1,
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

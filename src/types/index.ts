// ─── TIER ────────────────────────────────────────────────────────────────────
export type Tier = 'free' | 'pro' | 'enterprise'

// ─── USER ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  company: string | null
  role: string | null
  tier: Tier
  stripe_customer_id: string | null
  subscription_status: string | null
  subscription_period_end: string | null
  is_admin: boolean
  is_banned: boolean
  feature_flags: Record<string, boolean>
  created_at: string
}

// ─── CONTENT LIBRARY ─────────────────────────────────────────────────────────
export interface ContentLibraryEntry {
  id: string
  module: string
  category: string
  title: string
  content: string
  source: string | null
  tags: string[]
  min_tier: string
  created_at: string
  updated_at: string
}

// ─── CATALOG ─────────────────────────────────────────────────────────────────
export type DsgvoStatus  = 'compliant' | 'conditional' | 'non_compliant'
export type EuAiActRisk  = 'minimal' | 'limited' | 'high' | 'prohibited'
export type CloudProvider = 'aws' | 'azure' | 'gcp' | 'sap' | 'independent'
export type ArchLayer    = 'data' | 'model' | 'serving' | 'mlops' | 'application' | 'governance' | 'security'
export type RoleCategory = 'strategic' | 'technical' | 'governance' | 'operational'

export interface CatalogComponent {
  id: string
  name: string
  vendor: string | null
  category: string | null
  architecture_layer: ArchLayer | null
  hosting: string[]
  dsgvo_status: DsgvoStatus | null
  eu_ai_act_risk: EuAiActRisk | null
  sap_compatible: boolean
  sap_components: string[]
  use_case_types: string[]
  infra_types: string[]
  cloud_provider: CloudProvider | null
  icon_name: string | null
  website_url: string | null
  description: string | null
  tags: string[]
  incompatible_with: string[]
  requires: string[]
  suggests: string[]
  aliases: string[]
  source: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CanvasSynonym {
  id: string
  term: string
  synonym: string
  synonym_type: 'vendor' | 'category' | 'usecase'
  is_active: boolean
  created_at: string
}

export interface CatalogRole {
  id: string
  role_name: string
  role_category: RoleCategory | null
  archetype_levels: string[]
  description: string | null
  responsibilities: string[]
  skills_required: string[]
  fte_range: string | null
  priority_per_archetype: Record<string, string> | null
  is_active: boolean
  created_at: string
}

export interface CatalogUploadLog {
  id: string
  user_id: string | null
  filename: string
  format: string
  row_count: number
  vendor_override: string | null
  layer_override: string | null
  source: 'upload' | 'seed'
  uploaded_at: string
  snapshot: Record<string, unknown>[] | null
}

export interface CatalogSource {
  id: string
  name: string
  type: string
  url: string | null
  sync_interval_days: number
  last_synced_at: string | null
  last_sync_added: number | null
  last_sync_updated: number | null
  sync_status: 'idle' | 'success' | 'error' | 'skipped'
  last_sync_error: string | null
  config: Record<string, string>
  is_active: boolean
  created_at: string
}

// ─── ARCHETYPES ──────────────────────────────────────────────────────────────
export type Archetype = 'starter' | 'scaler' | 'transformer'

export const ARCHETYPES: Record<Archetype, { label: string; desc: string; icon: string; color: string }> = {
  starter:     { label: 'AI Starter',      desc: 'Kein produktiver Use Case live',              icon: '◎', color: 'amber'    },
  scaler:      { label: 'AI Scaler',       desc: '1–3 Use Cases live, Skalierung ausstehend',   icon: '◐', color: 'blue'     },
  transformer: { label: 'AI Transformer',  desc: 'AI in kritischen Prozessen etabliert',         icon: '●', color: 'emerald'  },
}

// ─── MODULES ─────────────────────────────────────────────────────────────────
export type ModuleId = 'assessment' | 'usecase' | 'governance' | 'roadmap' | 'canvas' | 'compliance' | 'architecture'

export interface ModuleConfig {
  id: ModuleId
  title: string
  subtitle: string
  subtitlePro?: string
  icon: string
  href: string
  duration: string
  requiredTier: Tier
  description: string
}

// ─── ASSESSMENT ──────────────────────────────────────────────────────────────
export interface AssessmentDimension {
  id: string
  label: string
  weight: number
  questions: AssessmentQuestion[]
}

export interface AssessmentQuestion {
  id: string
  text: string
  lowLabel: string
  l2Label?: string
  l3Label?: string
  l4Label?: string
  highLabel: string
}

export interface AssessmentResult {
  id: string
  user_id: string
  type: 'quick' | 'deep'
  archetype: Archetype | null
  total_score: number
  dim_scores: Record<string, number>
  version_no: number
  created_at: string
}

// ─── USE CASE ────────────────────────────────────────────────────────────────
export type UseCaseWeights = {
  value: number
  feasibility: number
  data_readiness: number
  risk: number
  speed: number
}

export type GovernanceVerdict = 'approve' | 'stop_dsgvo' | 'stop_risk' | 'improve'

export interface UseCase {
  id: string
  portfolio_id: string
  name: string
  domain: string | null
  description: string | null
  scores: Record<string, number>
  weighted_score: number
  quadrant: 'quick_win' | 'strategic_bet' | 'low_hanging_fruit' | 'avoid'
  canvas_id: string | null
  governance_result: GovernanceVerdict | null
  created_at: string
  updated_at: string
}

export interface GovernanceSession {
  id: string
  user_id: string
  use_case_name: string | null
  use_case_id: string | null
  answers: Record<string, string>
  result: GovernanceVerdict
  protocol: unknown[]
  created_at: string
}

export interface UseCasePortfolio {
  id: string
  user_id: string
  name: string
  weights: UseCaseWeights
  use_cases?: UseCase[]
  created_at: string
  updated_at: string
}

// ─── CANVAS ──────────────────────────────────────────────────────────────────
export interface CanvasData {
  problem: string
  solution: string
  data_sources: string
  stakeholders: string
  kpis: string
  risks: string
  architecture: string
  next_steps: string
}

export interface Canvas {
  id: string
  user_id: string
  title: string
  archetype: Archetype | null
  data: CanvasData
  version_no: number
  created_at: string
  updated_at: string
}

// ─── SHARING ─────────────────────────────────────────────────────────────────
export interface ShareLink {
  id: string
  user_id: string
  module: ModuleId
  entity_id: string
  token: string
  expires_at: string | null
  password_hash: string | null
  view_count: number
  created_at: string
}

// ─── FEEDBACK ────────────────────────────────────────────────────────────────
export interface Feedback {
  id: string
  user_id: string | null
  module: ModuleId
  sentiment: 'positive' | 'negative'
  comment: string | null
  created_at: string
}

// ─── API RESPONSES ───────────────────────────────────────────────────────────
export interface ApiResponse<T = void> {
  data?: T
  error?: string
  code?: string
}

// ─── COMPLIANCE SCANNER ───────────────────────────────────────────────────────
export interface ScanSourceResult {
  label: string
  url: string
  status: 'changed' | 'unchanged' | 'error'
}

export interface SourceScanStatus {
  url: string
  label: string
  fetched_at: string | null // null = noch nie gescannt
}

export interface ComplianceSourceDraft {
  id: string
  source_url: string
  source_label: string
  summary: string
  status_estimate: 'final' | 'entwurf' | 'unklar'
  review_status: 'pending_review' | 'beruecksichtigt' | 'ignoriert'
  scanned_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

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
  is_admin: boolean
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
  created_at: string
  updated_at: string
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

export interface UseCase {
  id: string
  portfolio_id: string
  name: string
  domain: string | null
  description: string | null
  scores: Record<string, number>
  weighted_score: number
  quadrant: 'quick_win' | 'strategic_bet' | 'low_hanging_fruit' | 'avoid'
  created_at: string
  updated_at: string
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

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company: string | null
          role: string | null
          tier: 'free' | 'pro' | 'enterprise'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          subscription_period_end: string | null
          archetype: 'starter' | 'scaler' | 'transformer' | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; email: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      assessment_sessions: {
        Row: {
          id: string
          user_id: string
          type: 'quick' | 'deep'
          archetype: string | null
          total_score: number | null
          dim_scores: Json
          answers: Json
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['assessment_sessions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['assessment_sessions']['Row']>
      }
      use_cases: {
        Row: {
          id: string
          portfolio_id: string
          name: string
          domain: string | null
          description: string | null
          scores: Json
          weighted_score: number | null
          quadrant: string | null
          archetype: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['use_cases']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['use_cases']['Row']>
      }
      canvases: {
        Row: {
          id: string
          user_id: string
          title: string
          archetype: string | null
          data: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['canvases']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['canvases']['Row']>
      }
      feedback: {
        Row: {
          id: string
          user_id: string | null
          module: string
          sentiment: 'positive' | 'negative'
          comment: string | null
          metadata: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['feedback']['Row'], 'id' | 'created_at'>
        Update: never
      }
      share_links: {
        Row: {
          id: string
          user_id: string
          module: string
          entity_id: string
          token: string
          expires_at: string | null
          password_hash: string | null
          view_count: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['share_links']['Row'], 'id' | 'created_at' | 'token' | 'view_count'>
        Update: Partial<Database['public']['Tables']['share_links']['Row']>
      }
      result_versions: {
        Row: {
          id: string
          user_id: string
          module: string
          entity_id: string
          version_no: number
          data: Json
          label: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['result_versions']['Row'], 'id' | 'created_at'>
        Update: never
      }
    }
  }
}

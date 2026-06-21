import { createClient } from '@/lib/supabase/server'
import { AssessmentPageClient } from './AssessmentPageClient'
import type { Metadata } from 'next'
import type { Tier } from '@/types'

export const metadata: Metadata = { title: 'AI-Readiness Assessment' }

export default async function AssessmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileResult, { data: latestSession }] = await Promise.all([
    supabase.from('profiles').select('tier').eq('id', user!.id).single(),
    supabase
      .from('assessment_sessions')
      .select('archetype, total_score, dim_scores')
      .eq('user_id', user!.id)
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const tier = ((profileResult.data as { tier: string } | null)?.tier ?? 'free') as Tier
  const savedResult = latestSession as {
    archetype: 'starter' | 'scaler' | 'transformer'
    total_score: number
    dim_scores: Record<string, number>
  } | null

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">AI-Readiness Assessment</h1>
        <p className="text-slate-500 mt-1">6 Dimensionen · 16 Fragen · ~10 Minuten</p>
      </div>
      <AssessmentPageClient tier={tier} userId={user!.id} savedResult={savedResult} />
    </div>
  )
}

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { AssessmentPageClient } from './AssessmentPageClient'
import { GuidancePanel } from '@/components/modules/GuidancePanel'
import { PageHeader } from '@/components/shared/PageHeader'
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
      <PageHeader
        title="AI-Readiness Assessment"
        description={tier !== 'free' ? '6 Dimensionen · 42 Fragen · ~25 Minuten' : '6 Dimensionen · 16 Fragen · ~10 Minuten'}
      />
      <Suspense fallback={null}>
        <GuidancePanel module="assessment" contextKey="assessment.dimensionen" />
      </Suspense>
      <AssessmentPageClient tier={tier} userId={user!.id} savedResult={savedResult} />
    </div>
  )
}

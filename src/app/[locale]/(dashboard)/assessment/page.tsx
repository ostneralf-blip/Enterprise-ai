import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { AssessmentPageClient } from './AssessmentPageClient'
import { GuidancePanel } from '@/components/modules/GuidancePanel'
import { PageHeader } from '@/components/shared/PageHeader'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import type { Tier } from '@/types'

export const metadata: Metadata = { title: 'AI-Readiness Assessment' }

export default async function AssessmentPage() {
  const [supabase, t] = await Promise.all([createClient(), getTranslations('modules')])
  const { data: { user } } = await supabase.auth.getUser()

  // Offene Draft-Session (completed=false) nur berücksichtigen, wenn sie jünger
  // als 30 Tage ist (Element 5 des UX-Reviews): ältere Zwischenstände nicht mehr
  // zum Fortsetzen anbieten, sie sind praktisch verwaist. Server-Komponente →
  // ein per-Request-`now` ist hier korrekt (die react-hooks/purity-Regel zielt
  // auf Client-Render und greift bei Server Components fälschlich).
  // eslint-disable-next-line react-hooks/purity
  const draftCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [profileResult, { data: latestSession }, { data: draftSession }] = await Promise.all([
    supabase.from('profiles').select('tier').eq('id', user!.id).single(),
    supabase
      .from('assessment_sessions')
      .select('archetype, total_score, dim_scores')
      .eq('user_id', user!.id)
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('assessment_sessions')
      .select('id, answers, updated_at, type')
      .eq('user_id', user!.id)
      .eq('completed', false)
      .gte('updated_at', draftCutoff)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const tier = ((profileResult.data as { tier: string } | null)?.tier ?? 'free') as Tier
  const savedResult = latestSession as {
    archetype: 'starter' | 'scaler' | 'transformer'
    total_score: number
    dim_scores: Record<string, number>
  } | null

  // Nur für Pro relevant (Free persistiert nicht) und nur, wenn der Draft
  // tatsächlich beantwortete Fragen enthält — ein frisch angelegter, sofort
  // verlassener Draft (0 Antworten) soll keinen Fortsetzen-Hinweis auslösen.
  const draftRow = draftSession as { id: string; answers: Record<string, number> | null; updated_at: string; type: string | null } | null
  const draft = tier !== 'free' && draftRow && draftRow.answers && Object.keys(draftRow.answers).length > 0
    ? { id: draftRow.id, answers: draftRow.answers, updatedAt: draftRow.updated_at, type: (draftRow.type === 'quick' ? 'quick' : 'deep') as 'quick' | 'deep' }
    : null

  return (
    <div>
      <PageHeader
        title={t('assessment.title')}
        description={tier !== 'free' ? t('assessment.descPro') : t('assessment.descFree')}
      />
      <Suspense fallback={null}>
        <GuidancePanel module="assessment" contextKey="assessment.dimensionen" />
      </Suspense>
      <AssessmentPageClient tier={tier} savedResult={savedResult} draft={draft} />
    </div>
  )
}

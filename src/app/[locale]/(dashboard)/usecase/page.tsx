import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UseCasePageClient } from './UseCasePageClient'
import { GuidancePanel } from '@/components/modules/GuidancePanel'
import { PageHeader } from '@/components/shared/PageHeader'
import { DEFAULT_WEIGHTS } from '@/config/usecase-data'
import type { Metadata } from 'next'
import type { Tier, UseCasePortfolio, UseCase, UseCaseWeights } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Use-Case Scoring' }

export default async function UseCasePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single() as { data: { tier: string } | null }

  const tier = (profileData?.tier ?? 'free') as Tier

  // Load or auto-create portfolio server-side for initial render
  let { data: portfolio } = await supabase
    .from('uc_portfolios')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle() as { data: UseCasePortfolio | null }

  if (!portfolio) {
    const { data: created } = await supabase
      .from('uc_portfolios')
      .insert({ user_id: user.id, name: 'Mein Portfolio', weights: DEFAULT_WEIGHTS })
      .select()
      .single() as { data: UseCasePortfolio | null }
    portfolio = created
  }

  const { data: rawCases } = await supabase
    .from('use_cases')
    .select('*')
    .eq('portfolio_id', portfolio?.id ?? '')
    .order('weighted_score', { ascending: false }) as { data: UseCase[] | null }

  const [{ data: canvases }, { data: latestCompliance }, { data: prefs }] = await Promise.all([
    supabase
      .from('canvases')
      .select('id, title')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }) as unknown as Promise<{ data: { id: string; title: string }[] | null }>,
    supabase
      .from('compliance_checks')
      .select('notes')
      .eq('user_id', user.id)
      .eq('check_type', 'risk_class')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{ data: { notes: string | null } | null }>,
    supabase
      .from('user_preferences')
      .select('primary_compliance_id')
      .eq('user_id', user.id)
      .maybeSingle() as unknown as Promise<{ data: { primary_compliance_id: string | null } | null }>,
  ])

  let complianceRiskNotes = latestCompliance?.notes ?? null
  if (prefs?.primary_compliance_id) {
    const primaryResult = await supabase
      .from('compliance_checks')
      .select('notes')
      .eq('id', prefs.primary_compliance_id)
      .eq('user_id', user.id)
      .maybeSingle()
    const primaryCheck = primaryResult.data as { notes: string | null } | null
    if (primaryCheck?.notes) complianceRiskNotes = primaryCheck.notes
  }

  const safePortfolio: UseCasePortfolio = portfolio ?? {
    id: '', user_id: user.id, name: 'Mein Portfolio',
    weights: DEFAULT_WEIGHTS as UseCaseWeights,
    created_at: '', updated_at: '',
  }

  return (
    <div>
      <PageHeader title="Use-Case Scoring" description="5 Kriterien · Portfolio-Matrix · Priorisierung nach gewichtetem Score" />
      <Suspense fallback={null}>
        <GuidancePanel module="usecase" contextKey="scoring.gates" />
      </Suspense>
      <UseCasePageClient
        initialPortfolio={safePortfolio}
        initialCases={rawCases ?? []}
        tier={tier}
        canvases={canvases ?? []}
        complianceRisk={complianceRiskNotes}
      />
    </div>
  )
}

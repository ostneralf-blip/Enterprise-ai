import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GovernancePageClient } from './GovernancePageClient'
import type { Metadata } from 'next'
import type { Tier } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Governance-Check' }

export default async function GovernancePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  const [{ data: profileData }, { data: sessions }, { data: allUseCases }, { data: complianceRisk }] = await Promise.all([
    supabase.from('profiles').select('tier').eq('id', user.id).single() as unknown as Promise<{ data: { tier: string } | null }>,
    supabase
      .from('governance_sessions')
      .select('id, use_case_name, use_case_id, use_case_ids, answers, result, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('use_case_portfolios')
      .select('use_cases(id, name)')
      .eq('user_id', user.id),
    supabase
      .from('compliance_checks')
      .select('notes')
      .eq('user_id', user.id)
      .eq('check_type', 'risk_class')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{ data: { notes: string | null } | null }>,
  ])

  const tier = (profileData?.tier ?? 'free') as Tier
  type UCRow = { use_cases: { id: string; name: string } | { id: string; name: string }[] | null }
  const useCases = ((allUseCases ?? []) as UCRow[])
    .flatMap(p => Array.isArray(p.use_cases) ? p.use_cases : p.use_cases ? [p.use_cases] : [])
    .filter((uc, idx, arr) => arr.findIndex(x => x.id === uc.id) === idx)
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))

  let initialUseCaseName: string | undefined
  let initialUseCaseId: string | undefined
  if (params.from === 'usecase' && params.id) {
    const found = useCases.find(uc => uc.id === params.id)
    if (found) {
      initialUseCaseName = found.name
      initialUseCaseId = found.id
    } else {
      const { data: uc } = await supabase
        .from('use_cases')
        .select('name')
        .eq('id', params.id)
        .maybeSingle()
      if (uc) { initialUseCaseName = uc.name; initialUseCaseId = params.id }
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Governance-Check</h1>
        <p className="text-slate-500 text-sm mt-1">
          6 Gates · DSGVO & EU AI Act · Deployment-Freigabe
        </p>
      </div>
      <GovernancePageClient
        tier={tier}
        sessions={sessions ?? []}
        useCases={useCases}
        initialUseCaseName={initialUseCaseName}
        initialUseCaseId={initialUseCaseId}
        complianceRisk={complianceRisk?.notes ?? null}
      />
    </div>
  )
}

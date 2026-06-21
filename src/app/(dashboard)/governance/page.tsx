import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GovernancePageClient } from './GovernancePageClient'
import type { Metadata } from 'next'
import type { Tier } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Governance-Check' }

export default async function GovernancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single() as { data: { tier: string } | null }

  const tier = (profileData?.tier ?? 'free') as Tier

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Governance-Check</h1>
        <p className="text-slate-500 text-sm mt-1">
          6 Gates · DSGVO & EU AI Act · Deployment-Freigabe
        </p>
      </div>
      <GovernancePageClient tier={tier} />
    </div>
  )
}

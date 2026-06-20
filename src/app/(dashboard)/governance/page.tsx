import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GovernancePageClient } from './GovernancePageClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Governance-Check' }

export default async function GovernancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Governance-Check</h1>
        <p className="text-slate-500 text-sm mt-1">
          6 Gates · DSGVO & EU AI Act · Deployment-Freigabe
        </p>
      </div>
      <GovernancePageClient />
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasAccess } from '@/lib/utils/tier-check'
import type { Tier } from '@/types'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Governance' }

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles').select('tier').eq('id', user.id).single() as { data: { tier: string } | null }

  const tier = (profileData?.tier ?? 'free') as Tier
  const requiredTier = ['compliance', 'architecture'].includes('governance') ? 'pro' : 'free'

  if (!hasAccess(tier, requiredTier as Tier)) {
    redirect('/upgrade')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 capitalize">governance</h1>
        <p className="text-slate-500 mt-1">Wird in Sprint 2 implementiert.</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
        <div className="text-4xl mb-4">🚧</div>
        <div className="text-slate-500 text-sm">Dieses Modul wird in Sprint 2 gebaut.</div>
      </div>
    </div>
  )
}

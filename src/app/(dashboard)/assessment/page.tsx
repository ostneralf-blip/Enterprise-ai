import { createClient } from '@/lib/supabase/server'
import { AssessmentPageClient } from './AssessmentPageClient'
import type { Metadata } from 'next'
import type { Tier } from '@/types'

export const metadata: Metadata = { title: 'AI-Readiness Assessment' }

export default async function AssessmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profileData } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user!.id)
    .single() as { data: { tier: string } | null }

  const tier = (profileData?.tier ?? 'free') as Tier

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">AI-Readiness Assessment</h1>
        <p className="text-slate-500 mt-1">6 Dimensionen · 16 Fragen · ~10 Minuten</p>
      </div>
      <AssessmentPageClient tier={tier} userId={user!.id} />
    </div>
  )
}

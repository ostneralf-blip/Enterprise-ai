import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RoadmapPageClient } from './RoadmapPageClient'
import type { Metadata } from 'next'
import type { Archetype } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Roadmap-Generator' }

export default async function RoadmapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: latestResult } = await supabase
    .from('assessment_results')
    .select('archetype')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle() as { data: { archetype: string | null } | null }

  const archetype = (latestResult?.archetype ?? null) as Archetype | null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Roadmap-Generator</h1>
        <p className="text-slate-500 text-sm mt-1">
          3 Phasen · Archetyp-spezifisch · KPIs & Budgetorientierung
        </p>
      </div>
      <RoadmapPageClient
        initialArchetype={archetype}
        fromAssessment={!!latestResult?.archetype}
      />
    </div>
  )
}

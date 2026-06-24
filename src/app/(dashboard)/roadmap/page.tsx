import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RoadmapPageClient } from './RoadmapPageClient'
import type { Metadata } from 'next'
import type { Archetype, Tier } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Roadmap-Generator' }

export default async function RoadmapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: latestResult }, { data: profileData }, { data: topUseCases }, { data: latestRoadmap }] = await Promise.all([
    supabase
      .from('assessment_sessions')
      .select('archetype')
      .eq('user_id', user.id)
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{ data: { archetype: string | null } | null }>,
    supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single() as unknown as Promise<{ data: { tier: string } | null }>,
    supabase
      .from('use_cases')
      .select('id, name, domain, weighted_score, quadrant')
      .order('weighted_score', { ascending: false })
      .limit(3),
    supabase
      .from('roadmaps')
      .select('id, archetype, phases')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{ data: { id: string; archetype: string; phases: unknown[] } | null }>,
  ])

  const archetype = (latestResult?.archetype ?? null) as Archetype | null
  const tier = (profileData?.tier ?? 'free') as Tier

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
        tier={tier}
        topUseCases={(topUseCases ?? []) as Array<{ id: string; name: string; domain: string | null; weighted_score: number | null; quadrant: string | null }>}
        savedRoadmap={latestRoadmap ?? null}
      />
    </div>
  )
}

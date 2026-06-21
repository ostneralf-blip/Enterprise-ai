import { createClient } from '@/lib/supabase/server'
import { ErgebnissePageClient, type AssessmentRow, type ArchitectureRow, type GovernanceRow, type RoadmapRow } from './ErgebnissePageClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Gespeicherte Ergebnisse' }

export default async function ErgebnissePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: assessments },
    { data: architectures },
    { data: governanceSessions },
    { data: roadmaps },
    { data: preferences },
  ] = await Promise.all([
    supabase.from('assessment_sessions')
      .select('id, archetype, total_score, dim_scores, created_at')
      .eq('user_id', user!.id).eq('completed', true)
      .order('created_at', { ascending: false }).limit(50),
    supabase.from('architectures')
      .select('id, title, wizard_data, result, updated_at')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false }).limit(50),
    supabase.from('governance_sessions')
      .select('id, use_case_name, result, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }).limit(50),
    supabase.from('roadmaps')
      .select('id, title, archetype, phases, updated_at')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false }).limit(50),
    supabase.from('user_preferences')
      .select('primary_assessment_id, primary_governance_id, primary_roadmap_id, primary_architecture_id')
      .eq('user_id', user!.id)
      .maybeSingle(),
  ])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Gespeicherte Ergebnisse</h1>
        <p className="text-slate-500 text-sm mt-1">Alle Analysen im Überblick — primär markierte Ergebnisse fließen als Kontext in den Architektur-Generator ein</p>
      </div>
      <ErgebnissePageClient
        assessments={(assessments ?? []) as AssessmentRow[]}
        architectures={(architectures ?? []) as ArchitectureRow[]}
        governanceSessions={(governanceSessions ?? []) as GovernanceRow[]}
        roadmaps={(roadmaps ?? []) as RoadmapRow[]}
        initialPreferences={preferences ?? null}
      />
    </div>
  )
}

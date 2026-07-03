import { createClient } from '@/lib/supabase/server'
import { ErgebnissePageClient, type AssessmentRow, type ArchitectureRow, type GovernanceRow, type RoadmapRow, type CanvasRow } from './ErgebnissePageClient'
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
    { data: canvases },
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
      .select('id, use_case_name, result, protocol, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }).limit(50),
    supabase.from('roadmaps')
      .select('id, title, archetype, phases, updated_at')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false }).limit(50),
    supabase.from('canvases')
      .select('id, title, archetype, data, updated_at')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false }).limit(50),
    supabase.from('user_preferences')
      .select('primary_assessment_id, primary_governance_id, primary_roadmap_id, primary_architecture_id, primary_canvas_id')
      .eq('user_id', user!.id)
      .maybeSingle(),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Gespeicherte Ergebnisse</h1>
        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-3">
          <strong>★ Primär</strong> — Markiert den Eintrag, der in anderen Modulen als Basis verwendet wird (Architektur-Generator, Dashboard, PDF-Export, Sharing). Pro Kategorie kann jeweils ein Eintrag als primär gesetzt werden.
        </p>
      </div>
      <ErgebnissePageClient
        assessments={(assessments ?? []) as AssessmentRow[]}
        architectures={(architectures ?? []) as ArchitectureRow[]}
        governanceSessions={(governanceSessions ?? []) as GovernanceRow[]}
        roadmaps={(roadmaps ?? []) as RoadmapRow[]}
        canvases={(canvases ?? []) as CanvasRow[]}
        initialPreferences={preferences ?? null}
      />
    </div>
  )
}

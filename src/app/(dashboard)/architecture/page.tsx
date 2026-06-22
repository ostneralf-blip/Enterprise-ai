import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasAccess } from '@/lib/utils/tier-check'
import { ArchitecturePageClient } from './ArchitecturePageClient'
import type { Tier, Archetype } from '@/types'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Architektur-Generator' }

export default async function ArchitecturePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single() as { data: { tier: string } | null }

  const tier = (profileData?.tier ?? 'free') as Tier
  if (!hasAccess(tier, 'pro')) redirect('/upgrade')

  const [{ data: architectures }, { data: prefs }, { data: complianceRiskClass }] = await Promise.all([
    supabase.from('architectures').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('user_preferences')
      .select('primary_assessment_id, primary_governance_id')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('compliance_checks')
      .select('notes')
      .eq('user_id', user.id)
      .eq('regulation', 'eu_ai_act')
      .eq('check_type', 'risk_class')
      .eq('status', 'compliant')
      .maybeSingle(),
  ])

  const prefData = prefs as { primary_assessment_id: string | null; primary_governance_id: string | null } | null

  // Map EU AI Act risk class → architecture compliance answer
  const riskClassNote = (complianceRiskClass as { notes: string | null } | null)?.notes
  const compliancePreset: 'strict' | 'moderate' | 'low' | 'undefined' =
    riskClassNote === 'prohibited' || riskClassNote === 'high' ? 'strict'
    : riskClassNote === 'limited' ? 'moderate'
    : riskClassNote === 'minimal' ? 'low'
    : 'undefined'

  const [{ data: latestAssessment }, { data: latestGovernance }] = await Promise.all([
    prefData?.primary_assessment_id
      ? supabase.from('assessment_sessions').select('archetype, total_score, dim_scores').eq('id', prefData.primary_assessment_id).maybeSingle()
      : supabase.from('assessment_sessions').select('archetype, total_score, dim_scores').eq('user_id', user.id).eq('completed', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    prefData?.primary_governance_id
      ? supabase.from('governance_sessions').select('use_case_name, result').eq('id', prefData.primary_governance_id).maybeSingle()
      : supabase.from('governance_sessions').select('use_case_name, result').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Architektur-Generator</h1>
        <p className="text-slate-500 text-sm mt-1">
          5-Schritt-Wizard · Herstellerneutrale Referenzarchitektur · Schlüssel-Entscheidungen
        </p>
      </div>
      <ArchitecturePageClient
        initialArchitectures={architectures ?? []}
        assessmentContext={latestAssessment ? {
          archetype: latestAssessment.archetype as Archetype | null,
          total_score: latestAssessment.total_score,
          dim_scores: latestAssessment.dim_scores as Record<string, number>,
        } : null}
        governanceContext={latestGovernance ? {
          use_case_name: latestGovernance.use_case_name as string | null,
          result: latestGovernance.result as string | null,
        } : null}
        compliancePreset={riskClassNote ? compliancePreset : undefined}
      />
    </div>
  )
}

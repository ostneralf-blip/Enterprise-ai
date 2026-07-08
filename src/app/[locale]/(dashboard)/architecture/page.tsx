import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasAccess } from '@/lib/utils/tier-check'
import { ArchitecturePageClient } from './ArchitecturePageClient'
import { GuidancePanel } from '@/components/modules/GuidancePanel'
import { PageHeader } from '@/components/shared/PageHeader'
import { getTranslations } from 'next-intl/server'
import type { Tier, Archetype, CanvasSynonym } from '@/types'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Architektur-Generator' }

export default async function ArchitecturePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; id?: string }>
}) {
  const [supabase, t] = await Promise.all([createClient(), getTranslations('modules')])
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  let canvasContext: {
    canvas: import('@/types').Canvas
    useCase: import('@/types').UseCase
  } | null = null

  if (params.from === 'usecase' && params.id) {
    const { data: useCase } = await supabase
      .from('use_cases')
      .select('*, uc_portfolios!inner(user_id)')
      .eq('id', params.id)
      .single() as { data: (import('@/types').UseCase & { uc_portfolios: { user_id: string } }) | null }

    if (useCase && useCase.uc_portfolios.user_id === user.id && useCase.canvas_id) {
      const { data: canvas } = await supabase
        .from('canvases')
        .select('*')
        .eq('id', useCase.canvas_id)
        .eq('user_id', user.id)
        .single() as { data: import('@/types').Canvas | null }

      if (canvas) {
        canvasContext = { canvas, useCase }
      }
    }
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single() as { data: { tier: string } | null }

  const tier = (profileData?.tier ?? 'free') as Tier
  if (!hasAccess(tier, 'pro')) redirect('/upgrade')

  const [{ data: architectures }, { data: prefs }, { data: complianceRiskClass }, { data: latestRoadmap }, { data: synonyms }] = await Promise.all([
    supabase.from('architectures').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('user_preferences')
      .select('primary_assessment_id, primary_governance_id, primary_roadmap_id')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('compliance_checks')
      .select('notes')
      .eq('user_id', user.id)
      .eq('regulation', 'eu_ai_act')
      .eq('check_type', 'risk_class')
      .eq('status', 'compliant')
      .maybeSingle(),
    supabase.from('roadmaps')
      .select('id, title, archetype, phases')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('canvas_synonyms')
      .select('*')
      .eq('is_active', true),
  ])

  const prefData = prefs as { primary_assessment_id: string | null; primary_governance_id: string | null; primary_roadmap_id: string | null } | null

  // Map EU AI Act risk class → architecture compliance answer
  const riskClassNote = (complianceRiskClass as { notes: string | null } | null)?.notes
  const compliancePreset: 'strict' | 'moderate' | 'low' | 'undefined' =
    riskClassNote === 'prohibited' || riskClassNote === 'high' ? 'strict'
    : riskClassNote === 'limited' ? 'moderate'
    : riskClassNote === 'minimal' ? 'low'
    : 'undefined'

  const [{ data: latestAssessment }, { data: latestGovernance }, { data: primaryRoadmap }] = await Promise.all([
    prefData?.primary_assessment_id
      ? supabase.from('assessment_sessions').select('archetype, total_score, dim_scores').eq('id', prefData.primary_assessment_id).maybeSingle()
      : supabase.from('assessment_sessions').select('archetype, total_score, dim_scores').eq('user_id', user.id).eq('completed', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    prefData?.primary_governance_id
      ? supabase.from('governance_sessions').select('use_case_name, result, use_case_id').eq('id', prefData.primary_governance_id).maybeSingle()
      : supabase.from('governance_sessions').select('use_case_name, result, use_case_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    prefData?.primary_roadmap_id
      ? supabase.from('roadmaps').select('id, title, archetype, phases').eq('id', prefData.primary_roadmap_id).maybeSingle()
      : Promise.resolve({ data: latestRoadmap }),
  ])

  const roadmapSource = (primaryRoadmap ?? latestRoadmap) as { id: string; title: string; archetype: string; phases: unknown[] } | null
  const roadmapContext = roadmapSource ? {
    title: roadmapSource.title,
    archetype: roadmapSource.archetype as Archetype | null,
    phasesCount: Array.isArray(roadmapSource.phases) ? roadmapSource.phases.length : 0,
  } : null

  // Wenn Governance einen verknüpften Use Case hat und kein Canvas-Kontext über URL-Param vorliegt,
  // Use Case + Canvas laden und als Architektur-Kontext nutzen
  if (!canvasContext && latestGovernance) {
    const gov = latestGovernance as { use_case_name: string | null; result: string | null; use_case_id: string | null }
    if (gov.use_case_id) {
      const { data: govUseCase } = await supabase
        .from('use_cases')
        .select('*, uc_portfolios!inner(user_id)')
        .eq('id', gov.use_case_id)
        .single() as { data: (import('@/types').UseCase & { uc_portfolios: { user_id: string } }) | null }

      if (govUseCase && govUseCase.uc_portfolios.user_id === user.id && govUseCase.canvas_id) {
        const { data: govCanvas } = await supabase
          .from('canvases')
          .select('*')
          .eq('id', govUseCase.canvas_id)
          .eq('user_id', user.id)
          .single() as { data: import('@/types').Canvas | null }

        if (govCanvas) {
          canvasContext = { canvas: govCanvas, useCase: govUseCase }
        }
      }
    }
  }

  return (
    <div>
      <PageHeader title={t('architecture.title')} description={t('architecture.desc')} />
      <Suspense fallback={null}>
        <GuidancePanel module="architecture" contextKey="architecture.prinzipien" />
      </Suspense>
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
        tier={tier}
        canvasContext={canvasContext}
        roadmapContext={roadmapContext}
        synonyms={(synonyms ?? []) as CanvasSynonym[]}
      />
    </div>
  )
}

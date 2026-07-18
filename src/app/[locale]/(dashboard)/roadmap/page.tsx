import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RoadmapPageClient } from './RoadmapPageClient'
import { GuidancePanel } from '@/components/modules/GuidancePanel'
import { PageHeader } from '@/components/shared/PageHeader'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import type { Archetype, Tier } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Roadmap-Generator' }

export default async function RoadmapPage() {
  const [supabase, t] = await Promise.all([createClient(), getTranslations('modules')])
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: latestResult }, { data: profileData }, { data: topUseCases }, { data: latestRoadmap }, { data: prefs }] = await Promise.all([
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
      .select('id, name, domain, weighted_score, quadrant, canvas_id, governance_result, uc_portfolios!inner(user_id)')
      .eq('uc_portfolios.user_id', user.id)
      .order('weighted_score', { ascending: false })
      .limit(3),
    supabase
      .from('roadmaps')
      .select('id, archetype, phases')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{ data: { id: string; archetype: string; phases: unknown[] } | null }>,
    supabase
      .from('user_preferences')
      .select('primary_architecture_id')
      .eq('user_id', user.id)
      .maybeSingle() as unknown as Promise<{ data: { primary_architecture_id: string | null } | null }>,
  ])

  // Als "primär" markierte Architektur bevorzugen (siehe Ergebnisse-Übersicht) —
  // vorher wurde hier immer nur die zuletzt aktualisierte Architektur gelesen,
  // wodurch "auf primär setzen" ohne jede Wirkung auf diese Seite blieb. Zusätzlicher
  // Fallback auf die zuletzt aktualisierte Architektur auch dann, wenn die primäre
  // zwar existiert, aber (z. B. als Alt-Datensatz vor Einführung von keyDecisions)
  // keine Entscheidungen enthält — sonst würde "auf primär setzen" eine vorher
  // sichtbare Liste zum Verschwinden bringen statt sie zu ersetzen.
  type ArchResultRow = { result: { keyDecisions?: { de: string; en: string }[] } }
  let archKeyDecisions: { de: string; en: string }[] = []
  if (prefs?.primary_architecture_id) {
    const { data } = await supabase.from('architectures').select('result').eq('user_id', user.id)
      .eq('id', prefs.primary_architecture_id).maybeSingle() as { data: ArchResultRow | null }
    archKeyDecisions = data?.result?.keyDecisions ?? []
  }
  if (archKeyDecisions.length === 0) {
    const { data } = await supabase.from('architectures').select('result').eq('user_id', user.id)
      .order('updated_at', { ascending: false }).limit(1).maybeSingle() as { data: ArchResultRow | null }
    archKeyDecisions = data?.result?.keyDecisions ?? []
  }

  const archetype = (latestResult?.archetype ?? null) as Archetype | null
  const tier = (profileData?.tier ?? 'free') as Tier

  // Lade den Canvas des Top-Use-Cases, falls verknüpft
  type LinkedCanvas = { id: string; title: string; archetype: string | null; data: Record<string, string> }
  const topCanvasId = (topUseCases as Array<{ canvas_id?: string | null }> | null)?.[0]?.canvas_id ?? null
  let linkedCanvas: LinkedCanvas | null = null
  if (topCanvasId) {
    const { data: canvasData } = await supabase
      .from('canvases')
      .select('id, title, archetype, data')
      .eq('id', topCanvasId)
      .maybeSingle()
    if (canvasData) linkedCanvas = canvasData as LinkedCanvas
  }

  return (
    <div>
      <PageHeader title={t('roadmap.title')} description={t('roadmap.desc')} />
      <Suspense fallback={null}>
        <GuidancePanel module="roadmap" contextKey="roadmap.phase0" />
      </Suspense>
      <RoadmapPageClient
        initialArchetype={archetype}
        fromAssessment={!!latestResult?.archetype}
        tier={tier}
        topUseCases={(topUseCases ?? []) as Array<{ id: string; name: string; domain: string | null; weighted_score: number | null; quadrant: string | null; governance_result: import('@/types').GovernanceVerdict | null }>}
        savedRoadmap={latestRoadmap ?? null}
        linkedCanvas={linkedCanvas}
        archKeyDecisions={archKeyDecisions}
      />
    </div>
  )
}

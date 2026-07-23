import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CanvasPageClient } from './CanvasPageClient'
import { GuidancePanel } from '@/components/modules/GuidancePanel'
import { PageHeader } from '@/components/shared/PageHeader'
import { getTranslations, getLocale } from 'next-intl/server'
import { getComplianceTriggers } from '@/lib/compliance/db'
import type { Metadata } from 'next'
import type { Canvas, Tier } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'AI Use-Case Canvas' }

export default async function CanvasPage() {
  const [supabase, t, locale, triggers] = await Promise.all([
    createClient(), getTranslations('modules'), getLocale(), getComplianceTriggers(),
  ])
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // DB-getriebene Compliance-Erkennung: Label je Locale auflösen → „<Regularie> relevant".
  const loc = locale === 'en' ? 'en' : 'de'
  const complianceTriggers = triggers.map(tr => ({ label: `${tr.label[loc]} relevant`, keywords: tr.keywords }))

  const [{ data: rawCanvases }, { data: profileData }] = await Promise.all([
    supabase
      .from('canvases')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }) as unknown as Promise<{ data: Omit<Canvas, 'version_no'>[] | null }>,
    supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single() as unknown as Promise<{ data: { tier: string } | null }>,
  ])

  const canvases: Canvas[] = (rawCanvases ?? []).map(c => ({ ...c, version_no: 0 }))
  const tier = (profileData?.tier ?? 'free') as Tier

  return (
    <div>
      <PageHeader title={t('canvas.title')} description={t('canvas.desc')} />
      <Suspense fallback={null}>
        <GuidancePanel module="canvas" contextKey="canvas.intro" />
      </Suspense>
      <CanvasPageClient initialCanvases={canvases} tier={tier} complianceTriggers={complianceTriggers} />
    </div>
  )
}

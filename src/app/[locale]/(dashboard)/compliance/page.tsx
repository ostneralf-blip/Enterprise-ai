import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasAccess } from '@/lib/utils/tier-check'
import { CompliancePageClient } from './CompliancePageClient'
import { GuidancePanel } from '@/components/modules/GuidancePanel'
import { PageHeader } from '@/components/shared/PageHeader'
import { getTranslations } from 'next-intl/server'
import type { Tier } from '@/types'
import type { CheckRow } from '@/config/compliance-data'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Compliance Center' }

export default async function CompliancePage() {
  const [supabase, t] = await Promise.all([createClient(), getTranslations('modules')])
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single() as { data: { tier: string } | null }

  const tier = (profileData?.tier ?? 'free') as Tier
  if (!hasAccess(tier, 'pro')) redirect('/upgrade')

  const { data: checks } = await supabase
    .from('compliance_checks')
    .select('regulation, check_type, status, notes, completed_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at')

  return (
    <div>
      <PageHeader title={t('compliance.title')} description={t('compliance.desc')} />
      <Suspense fallback={null}>
        <GuidancePanel module="compliance" contextKey="compliance.policies" />
      </Suspense>
      <CompliancePageClient initialChecks={(checks ?? []) as CheckRow[]} />
    </div>
  )
}

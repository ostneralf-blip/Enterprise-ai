import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { SharedLinksClient, type ShareLinkRow } from './SharedLinksClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Geteilte Links' }

export default async function GeteilteLinksPage() {
  const [supabase, t] = await Promise.all([createClient(), getTranslations('sharedLinks')])
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('share_links')
    .select('id, token, module, entity_id, expires_at, view_count, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <PageHeader title={t('title')} description={t('subtitle')} />
      <SharedLinksClient initialLinks={(data ?? []) as ShareLinkRow[]} />
    </div>
  )
}

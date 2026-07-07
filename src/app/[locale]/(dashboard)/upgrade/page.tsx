import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UpgradePageClient } from './UpgradePageClient'
import type { Metadata } from 'next'
import type { Tier } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Upgrade auf Professional' }

export default async function UpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single() as { data: { tier: string } | null }

  const tier = (profileData?.tier ?? 'free') as Tier

  if (tier !== 'free') {
    redirect('/dashboard')
  }

  return <UpgradePageClient />
}

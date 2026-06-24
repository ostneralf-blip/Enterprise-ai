import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsPageClient } from './SettingsPageClient'
import type { Metadata } from 'next'
import type { Tier } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Einstellungen' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, company, role, tier, stripe_customer_id, phone, mobile, street, zip, city')
    .eq('id', user.id)
    .single() as {
      data: {
        full_name: string | null
        company: string | null
        role: string | null
        tier: string
        stripe_customer_id: string | null
        phone: string | null
        mobile: string | null
        street: string | null
        zip: string | null
        city: string | null
      } | null
    }

  const profile = {
    full_name: profileData?.full_name ?? null,
    company: profileData?.company ?? null,
    role: profileData?.role ?? null,
    tier: (profileData?.tier ?? 'free') as Tier,
    stripe_customer_id: profileData?.stripe_customer_id ?? null,
    phone: profileData?.phone ?? null,
    mobile: profileData?.mobile ?? null,
    street: profileData?.street ?? null,
    zip: profileData?.zip ?? null,
    city: profileData?.city ?? null,
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Einstellungen</h1>
        <p className="text-slate-500 text-sm mt-1">Profil und Konto verwalten</p>
      </div>
      <SettingsPageClient profile={profile} email={user.email ?? ''} />
    </div>
  )
}

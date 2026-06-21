import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasAccess } from '@/lib/utils/tier-check'
import { ArchitecturePageClient } from './ArchitecturePageClient'
import type { Tier } from '@/types'
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Architektur-Generator</h1>
        <p className="text-slate-500 text-sm mt-1">
          5-Schritt-Wizard · Herstellerneutrale Referenzarchitektur · Schlüssel-Entscheidungen
        </p>
      </div>
      <ArchitecturePageClient />
    </div>
  )
}

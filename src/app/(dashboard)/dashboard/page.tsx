import { createClient } from '@/lib/supabase/server'
import { MODULES } from '@/config/modules'
import Link from 'next/link'
import type { Metadata } from 'next'
import { hasAccess } from '@/lib/utils/tier-check'
import type { Tier } from '@/types'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, company, tier')
    .eq('id', user!.id)
    .single() as { data: { full_name: string | null; company: string | null; tier: string } | null; error: unknown }

  const tier = (profileData?.tier ?? 'free') as Tier
  const fullName = profileData?.full_name as string | null

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Guten Tag{fullName ? `, ${fullName.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-slate-500 mt-1">Welches Tool möchten Sie heute nutzen?</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Verfügbare Tools', value: MODULES.length.toString(), icon: '⬡' },
          { label: 'Ihr Plan', value: tier === 'pro' ? 'Professional' : tier === 'enterprise' ? 'Enterprise' : 'Explorer', icon: '◎' },
          { label: 'Gespeicherte Ergebnisse', value: '—', icon: '□' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-slate-400 text-lg mb-1">{s.icon}</div>
            <div className="text-2xl font-semibold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Alle Tools</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {MODULES.map(mod => {
          const locked = !hasAccess(tier, mod.requiredTier)
          return (
            <Link key={mod.id} href={locked ? '/upgrade' : `/${mod.id}`}
              className="group bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-6 transition-all hover:shadow-sm block">
              <div className="flex items-start justify-between mb-4">
                <span className="text-2xl">{mod.icon}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5">{mod.duration}</span>
                  {locked && <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-md px-2 py-0.5">Pro</span>}
                </div>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">{mod.title}</h3>
              <p className="text-xs text-slate-500 mb-1">{mod.subtitle}</p>
              <p className="text-sm text-slate-600 leading-relaxed mt-3">{mod.description}</p>
              <div className="mt-4 text-xs font-medium text-blue-600 group-hover:text-blue-700">
                {locked ? 'Upgrade für Zugang →' : 'Starten →'}
              </div>
            </Link>
          )
        })}
      </div>

      {tier === 'free' && (
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 flex items-center justify-between">
          <div>
            <div className="text-white font-semibold mb-1">Auf Professional upgraden</div>
            <div className="text-blue-200 text-sm">PDF-Export, Ergebnisse speichern, Versionierung und alle 7 Tools.</div>
          </div>
          <Link href="/upgrade"
            className="bg-white text-blue-700 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors shrink-0 ml-4">
            Ab €49/Monat →
          </Link>
        </div>
      )}
    </div>
  )
}

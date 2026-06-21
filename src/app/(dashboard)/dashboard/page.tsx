import { createClient } from '@/lib/supabase/server'
import { MODULES } from '@/config/modules'
import Link from 'next/link'
import type { Metadata } from 'next'
import { hasAccess } from '@/lib/utils/tier-check'
import type { Tier } from '@/types'

export const metadata: Metadata = { title: 'Dashboard' }

const ARCHETYPE_LABELS: Record<string, { label: string; color: string }> = {
  starter:     { label: 'AI Starter',     color: 'text-amber-700 bg-amber-50 border-amber-200' },
  scaler:      { label: 'AI Scaler',      color: 'text-blue-700 bg-blue-50 border-blue-200' },
  transformer: { label: 'AI Transformer', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    profileResult,
    { data: latestAssessment },
    { count: architectureCount },
    { count: governanceCount },
    { count: roadmapCount },
    { count: assessmentCount },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, company, tier').eq('id', user!.id).single(),
    supabase.from('assessment_sessions').select('archetype, total_score, created_at').eq('user_id', user!.id).eq('completed', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('architectures').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('governance_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('roadmaps').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('assessment_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).eq('completed', true),
  ])
  const profileData = profileResult.data as { full_name: string | null; company: string | null; tier: string } | null

  const tier = (profileData?.tier ?? 'free') as Tier
  const fullName = profileData?.full_name as string | null
  const savedCount = (architectureCount ?? 0) + (governanceCount ?? 0) + (roadmapCount ?? 0) + (assessmentCount ?? 0)
  const accessibleToolCount = MODULES.filter(mod => hasAccess(tier, mod.requiredTier)).length

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Guten Tag{fullName ? `, ${fullName.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-slate-500 mt-1">Welches Tool möchten Sie heute nutzen?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8">
        {[
          { label: 'Verfügbare Tools', value: accessibleToolCount.toString(), icon: '⬡' },
          { label: 'Gespeicherte Ergebnisse', value: savedCount > 0 ? savedCount.toString() : '—', icon: '□' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-slate-400 text-lg mb-1">{s.icon}</div>
            <div className="text-2xl font-semibold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Latest Assessment result */}
      {latestAssessment && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">Letztes Assessment</h2>
          <Link href="/assessment" className="block bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 sm:p-5 transition-all hover:shadow-sm">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${ARCHETYPE_LABELS[latestAssessment.archetype as string]?.color ?? 'text-slate-700 bg-slate-50 border-slate-200'}`}>
                    {ARCHETYPE_LABELS[latestAssessment.archetype as string]?.label ?? latestAssessment.archetype}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(latestAssessment.created_at as string).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm text-slate-600">AI-Readiness Score: <span className="font-semibold text-slate-900">{latestAssessment.total_score}</span> / 5.0</p>
              </div>
              <span className="text-xs font-medium text-blue-600 whitespace-nowrap">Ergebnis ansehen →</span>
            </div>
          </Link>
        </div>
      )}

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

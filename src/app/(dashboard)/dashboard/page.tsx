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

interface PathStep {
  step: number
  icon: string
  title: string
  desc: string
  href: string
  done: boolean
  proOnly?: boolean
}

function GuidedPath({ steps, tier }: { steps: PathStep[]; tier: Tier }) {
  const completedCount = steps.filter(s => s.done).length
  const nextStep = steps.find(s => !s.done)
  const progressPct = Math.round((completedCount / steps.length) * 100)
  const allDone = completedCount === steps.length

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Geführter AI-Pfad</h2>
        <span className="text-xs text-slate-400">{completedCount}/{steps.length} abgeschlossen</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${progressPct}%` }}
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Fortschritt: ${completedCount} von ${steps.length} Schritten abgeschlossen`}
        />
      </div>

      {/* Next step CTA */}
      {nextStep && (
        <Link
          href={nextStep.proOnly && tier === 'free' ? '/upgrade' : nextStep.href}
          className="flex items-center gap-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-3.5 mb-4 transition-colors group"
          aria-label={`Nächster Schritt: ${nextStep.title}`}
        >
          <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-base">
            {nextStep.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-blue-200 mb-0.5">
              Empfohlener nächster Schritt · {nextStep.step} von {steps.length}
            </div>
            <div className="text-sm font-semibold">{nextStep.title}</div>
            <div className="text-xs text-blue-200 truncate">{nextStep.desc}</div>
          </div>
          <span className="text-white/70 group-hover:text-white text-sm shrink-0">→</span>
        </Link>
      )}

      {allDone && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3.5 mb-4">
          <span className="text-xl">✓</span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-emerald-800">AI-Navigator Pfad vollständig!</div>
            <div className="text-xs text-emerald-600">Alle Module abgeschlossen — Ergebnisse in PDF zusammenfassen.</div>
          </div>
        </div>
      )}

      {/* Step indicator — horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5" role="list">
        {steps.map((s) => {
          const isCurrent = s === nextStep
          const isLocked = s.proOnly && tier === 'free'
          return (
            <Link
              key={s.step}
              href={isLocked ? '/upgrade' : s.href}
              role="listitem"
              aria-label={`Schritt ${s.step}: ${s.title}${s.done ? ' (abgeschlossen)' : isCurrent ? ' (aktuell empfohlen)' : ''}`}
              className={[
                'flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border transition-colors text-center min-w-[72px] max-w-[88px]',
                s.done
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : isCurrent
                    ? 'bg-blue-50 border-blue-300 text-blue-700 ring-1 ring-blue-300'
                    : 'bg-slate-50 border-slate-200 text-slate-400',
              ].join(' ')}
            >
              <span className="text-base leading-none">{s.done ? '✓' : s.icon}</span>
              <span className="text-[10px] font-medium leading-tight line-clamp-2">{s.title}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
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
    { count: usecaseCount },
    { count: canvasCount },
    { count: complianceCount },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, company, tier').eq('id', user!.id).single(),
    supabase.from('assessment_sessions').select('archetype, total_score, created_at').eq('user_id', user!.id).eq('completed', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('architectures').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('governance_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('roadmaps').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('assessment_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).eq('completed', true),
    supabase.from('use_cases').select('*', { count: 'exact', head: true }),
    supabase.from('canvases').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('compliance_checks').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
  ])
  const profileData = profileResult.data as { full_name: string | null; company: string | null; tier: string } | null

  const tier = (profileData?.tier ?? 'free') as Tier
  const fullName = profileData?.full_name as string | null
  const savedCount = (architectureCount ?? 0) + (governanceCount ?? 0) + (roadmapCount ?? 0) + (assessmentCount ?? 0)
  const accessibleToolCount = MODULES.filter(mod => hasAccess(tier, mod.requiredTier)).length

  const guidedSteps: PathStep[] = [
    {
      step: 1, icon: '◎', title: 'AI-Readiness Assessment', desc: 'Archetype & Reifegrad bestimmen',
      href: '/assessment', done: (assessmentCount ?? 0) > 0,
    },
    {
      step: 2, icon: '⊞', title: 'Use-Case Scoring', desc: 'Prioritäten setzen & Portfolio aufbauen',
      href: '/usecase', done: (usecaseCount ?? 0) > 0,
    },
    {
      step: 3, icon: '◧', title: 'AI Use-Case Canvas', desc: 'Top-Use-Case detailliert ausarbeiten',
      href: '/canvas', done: (canvasCount ?? 0) > 0,
    },
    {
      step: 4, icon: '⚖', title: 'Governance Check', desc: 'Use-Case freigeben oder verbessern',
      href: '/governance', done: (governanceCount ?? 0) > 0,
    },
    {
      step: 5, icon: '✓', title: 'Compliance Check', desc: 'EU AI Act & DSGVO prüfen',
      href: '/compliance', done: (complianceCount ?? 0) > 0,
    },
    {
      step: 6, icon: '⬡', title: 'Architektur-Generator', desc: 'Technische AI-Architektur definieren',
      href: '/architecture', done: (architectureCount ?? 0) > 0,
    },
    {
      step: 7, icon: '□', title: 'Executive Summary', desc: 'Alle Ergebnisse im Überblick + PDF-Export',
      href: '/zusammenfassung', done: (assessmentCount ?? 0) > 0 && (usecaseCount ?? 0) > 0 && (canvasCount ?? 0) > 0 && (governanceCount ?? 0) > 0 && (complianceCount ?? 0) > 0 && (architectureCount ?? 0) > 0,
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
          Guten Tag{fullName ? `, ${fullName.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Ihr geführter Pfad durch den AI Navigator</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="text-slate-400 text-lg mb-1.5">◈</div>
          <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            tier === 'pro' ? 'bg-blue-100 text-blue-700' :
            tier === 'enterprise' ? 'bg-violet-100 text-violet-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            {tier === 'pro' ? 'Pro' : tier === 'enterprise' ? 'Enterprise' : 'Free'}
          </span>
          <div className="text-xs text-slate-500 mt-1.5">
            {tier === 'free' ? `${accessibleToolCount} von 7 Tools verfügbar` : 'Alle 7 Tools verfügbar'}
          </div>
        </div>
        <Link href="/ergebnisse" className="bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm rounded-xl p-4 sm:p-5 block transition-all">
          <div className="text-slate-400 text-lg mb-1">□</div>
          <div className="text-2xl font-semibold text-slate-900">{savedCount > 0 ? savedCount : '—'}</div>
          <div className="text-xs text-slate-500 mt-0.5">Gespeicherte Ergebnisse</div>
        </Link>
      </div>

      {/* Guided path */}
      <GuidedPath steps={guidedSteps} tier={tier} />

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
              className={`group bg-white border border-slate-200 rounded-xl p-6 transition-all block ${locked ? 'opacity-60' : 'hover:border-blue-300 hover:shadow-sm'}`}>
              <div className="flex items-start justify-between mb-4">
                <span className="text-2xl">{mod.icon}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5">{mod.duration}</span>
                  {locked && <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-md px-2 py-0.5 font-medium">Pro</span>}
                </div>
              </div>
              <h3 className={`font-semibold text-slate-900 mb-1 transition-colors ${!locked ? 'group-hover:text-blue-700' : ''}`}>{mod.title}</h3>
              <p className="text-xs text-slate-500 mb-1">{(tier !== 'free' && mod.subtitlePro) ? mod.subtitlePro : mod.subtitle}</p>
              <p className="text-sm text-slate-600 leading-relaxed mt-3">{mod.description}</p>
              <div className={`mt-4 text-xs font-medium ${locked ? 'text-slate-400' : 'text-blue-600 group-hover:text-blue-700'}`}>
                {locked ? '🔒 Pro erforderlich →' : 'Starten →'}
              </div>
            </Link>
          )
        })}
      </div>

      {tier === 'free' && (
        <div className="mt-8 mb-4">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">Free vs. Pro</h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_60px_60px] bg-slate-50 border-b border-slate-100">
              <div className="px-4 py-2.5 text-xs font-medium text-slate-500">Feature</div>
              <div className="px-3 py-2.5 text-xs font-medium text-slate-500 text-center">Free</div>
              <div className="px-3 py-2.5 text-xs font-medium text-blue-600 text-center">Pro</div>
            </div>
            {([
              { label: '5 Basis-Tools (Assessment, Scoring, Governance, Roadmap, Canvas)', free: true, pro: true },
              { label: 'Compliance Center (EU AI Act + DSGVO)', free: false, pro: true },
              { label: 'Architektur-Generator', free: false, pro: true },
              { label: 'PDF-Export für alle Module', free: false, pro: true },
              { label: 'Ergebnisse speichern & laden', free: false, pro: true },
              { label: 'Versionierung & Link-Sharing', free: false, pro: true },
            ] as { label: string; free: boolean; pro: boolean }[]).map(({ label, free, pro }) => (
              <div key={label} className="grid grid-cols-[1fr_60px_60px] border-t border-slate-100">
                <div className="px-4 py-2.5 text-sm text-slate-700">{label}</div>
                <div className="px-3 py-2.5 text-center text-sm">{free ? <span className="text-emerald-600 font-medium">✓</span> : <span className="text-slate-300">—</span>}</div>
                <div className="px-3 py-2.5 text-center text-sm">{pro ? <span className="text-blue-600 font-medium">✓</span> : <span className="text-slate-300">—</span>}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tier === 'free' && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 sm:p-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-white font-semibold mb-1">Auf Professional upgraden</div>
            <div className="text-blue-200 text-sm">PDF-Export, Ergebnisse speichern, Versionierung und alle 7 Tools.</div>
          </div>
          <Link href="/upgrade"
            className="bg-white text-blue-700 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors shrink-0">
            Ab €49/Monat →
          </Link>
        </div>
      )}
    </div>
  )
}

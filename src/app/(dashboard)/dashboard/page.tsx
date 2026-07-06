import { createClient } from '@/lib/supabase/server'
import { MODULES } from '@/config/modules'
import Link from 'next/link'
import type { Metadata } from 'next'
import { hasAccess } from '@/lib/utils/tier-check'
import type { Tier } from '@/types'

export const metadata: Metadata = { title: 'Dashboard' }

const NOW = Date.now()

const ARCHETYPE_LABELS: Record<string, { label: string; color: string }> = {
  starter:     { label: 'AI Starter',     color: 'text-amber-700 bg-amber-50 border-amber-200' },
  scaler:      { label: 'AI Scaler',      color: 'text-sky-700 bg-sky-100 border-sky-200' },
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
          className="h-full bg-primary rounded-full transition-all"
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
          className="flex items-center gap-4 bg-primary hover:bg-primary text-white rounded-xl px-4 py-3.5 mb-4 transition-colors group"
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

      {/* Step indicator — gleiche Breite wie der Pfad-Container */}
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} role="list">
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
                'flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border transition-colors text-center',
                s.done
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : isCurrent
                    ? 'bg-primary-soft border-blue-300 text-primary-hover ring-1 ring-blue-300'
                    : 'bg-slate-50 border-slate-200 text-slate-400',
              ].join(' ')}
            >
              <span className="text-sm leading-none">{s.done ? '✓' : s.icon}</span>
              <span className="text-[9px] font-medium leading-tight line-clamp-2 text-center w-full">{s.title}</span>
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

  // Fetch profile first to get guided_path_reset_at (used in count filter below)
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, company, tier, guided_path_reset_at')
    .eq('id', user!.id)
    .single() as { data: { full_name: string | null; company: string | null; tier: string; guided_path_reset_at: string | null } | null }

  const resetAt = profileData?.guided_path_reset_at ?? null

  const uid = user!.id
  const cnt = (table: string, extra?: Record<string, string | boolean>) => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true })
    if (extra) for (const [k, v] of Object.entries(extra)) q = (q as typeof q).eq(k, v)
    if (resetAt) q = (q as typeof q).gt('created_at', resetAt)
    return q
  }

  const [
    { data: latestAssessment },
    { count: architectureCount },
    { count: governanceCount },
    { count: roadmapCount },
    { count: assessmentCount },
    { count: usecaseCount },
    { count: canvasCount },
    { count: complianceCount },
  ] = await Promise.all([
    supabase.from('assessment_sessions').select('archetype, total_score, created_at').eq('user_id', uid).eq('completed', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    cnt('architectures',       { user_id: uid }),
    cnt('governance_sessions', { user_id: uid }),
    cnt('roadmaps',            { user_id: uid }),
    cnt('assessment_sessions', { user_id: uid, completed: true }),
    cnt('use_cases'),
    cnt('canvases',            { user_id: uid }),
    cnt('compliance_checks',   { user_id: uid }),
  ])

  const tier = (profileData?.tier ?? 'free') as Tier
  const fullName = profileData?.full_name as string | null
  const savedCount = (architectureCount ?? 0) + (governanceCount ?? 0) + (roadmapCount ?? 0) + (assessmentCount ?? 0)
  const moduleDone: Record<string, boolean> = {
    assessment:  (assessmentCount ?? 0) > 0,
    usecase:     (usecaseCount ?? 0) > 0,
    canvas:      (canvasCount ?? 0) > 0,
    governance:  (governanceCount ?? 0) > 0,
    compliance:  (complianceCount ?? 0) > 0,
    architecture:(architectureCount ?? 0) > 0,
    roadmap:     (roadmapCount ?? 0) > 0,
  }

  const moduleHint: Record<string, string | null> = {
    usecase:     !moduleDone.assessment ? 'Tipp: zuerst Assessment →' : null,
    canvas:      !moduleDone.usecase ? 'Tipp: zuerst Use-Case Scoring →' : null,
    governance:  !moduleDone.canvas ? 'Tipp: zuerst Canvas →' : null,
    compliance:  null,
    architecture:!moduleDone.governance ? 'Tipp: zuerst Governance →' : null,
    roadmap:     !moduleDone.assessment ? 'Tipp: zuerst Assessment →' : null,
    assessment:  null,
  }

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

  const assessmentDaysSince = latestAssessment
    ? Math.floor((NOW - new Date(latestAssessment.created_at as string).getTime()) / 86_400_000)
    : 0
  const assessmentWeeksSince = Math.floor(assessmentDaysSince / 7)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
          Guten Tag{fullName ? `, ${fullName.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Ihr geführter Pfad durch den AI Navigator</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
        {latestAssessment ? (
          <Link href="/assessment" className="bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm rounded-xl p-4 sm:p-5 block transition-all">
            <div className="text-slate-400 text-base mb-1.5">◎ Letztes Assessment</div>
            <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${ARCHETYPE_LABELS[latestAssessment.archetype as string]?.color ?? 'text-slate-700 bg-slate-50 border-slate-200'}`}>
              {ARCHETYPE_LABELS[latestAssessment.archetype as string]?.label ?? String(latestAssessment.archetype)}
            </span>
            <div className="text-xs text-slate-500 mt-1.5">
              Score: <span className="font-semibold text-slate-900">{latestAssessment.total_score}</span> / 5.0
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {new Date(latestAssessment.created_at as string).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </Link>
        ) : (
          <Link href="/assessment" className="bg-white border border-dashed border-slate-200 hover:border-blue-300 rounded-xl p-4 sm:p-5 block transition-all">
            <div className="text-slate-300 text-base mb-1.5">◎ Letztes Assessment</div>
            <div className="text-sm font-medium text-slate-500">Noch kein Assessment</div>
            <div className="text-xs text-slate-400 mt-1">Archetype & Reifegrad bestimmen →</div>
          </Link>
        )}
        <Link href="/ergebnisse" className="bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm rounded-xl p-4 sm:p-5 block transition-all">
          <div className="text-slate-400 text-base mb-1">□ Gespeicherte Ergebnisse</div>
          <div className="text-2xl font-semibold text-slate-900">{savedCount > 0 ? savedCount : '—'}</div>
          <div className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
            Assessments, Architekturen, Governance & Roadmaps — primär markierte Ergebnisse fließen als Kontext in den Architektur-Generator ein.
          </div>
          {savedCount >= 2 && (
            <div className="text-[10px] text-primary mt-1 font-medium">Ergebnisse vergleichen →</div>
          )}
        </Link>
      </div>

      {/* Guided path */}
      <GuidedPath steps={guidedSteps} tier={tier} />

      {/* Quarterly Review Reminder */}
      {latestAssessment && assessmentDaysSince >= 90 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">Zeit für Ihren Quarterly AI Health Review</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Ihr letztes Assessment ist {assessmentWeeksSince} Wochen alt. Regelmäßige Reviews sichern Ihren AI-Fortschritt.
            </p>
          </div>
          <a
            href="/assessment"
            className="whitespace-nowrap px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors flex-shrink-0"
          >
            Assessment neu starten →
          </a>
        </div>
      )}


      <div className="mb-4">
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Alle Tools</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {MODULES.map(mod => {
          const locked = !hasAccess(tier, mod.requiredTier)
          const done = moduleDone[mod.id] ?? false
          const hint = !locked ? (moduleHint[mod.id] ?? null) : null
          return (
            <Link key={mod.id} href={locked ? '/upgrade' : `/${mod.id}`}
              className={`group bg-white rounded-xl p-6 transition-all block ${
                locked
                  ? 'opacity-60 border border-slate-200'
                  : done
                    ? 'border border-emerald-200 hover:border-emerald-300 hover:shadow-sm'
                    : 'border border-slate-200 hover:border-blue-300 hover:shadow-sm'
              }`}>
              <div className="flex items-start justify-between mb-4">
                <span className="text-2xl">{mod.icon}</span>
                <div className="flex items-center gap-2">
                  {done && !locked && (
                    <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5 font-medium">✓ Erledigt</span>
                  )}
                  <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5">{mod.duration}</span>
                  {locked && <span className="text-xs text-primary bg-primary-soft border border-primary-border rounded-md px-2 py-0.5 font-medium">Pro</span>}
                </div>
              </div>
              <h3 className={`font-semibold text-slate-900 mb-1 transition-colors ${!locked ? 'group-hover:text-primary-hover' : ''}`}>{mod.title}</h3>
              <p className="text-xs text-slate-500 mb-1">{(tier !== 'free' && mod.subtitlePro) ? mod.subtitlePro : mod.subtitle}</p>
              <p className="text-sm text-slate-600 leading-relaxed mt-3">{mod.description}</p>
              <div className={`mt-4 text-xs font-medium ${locked ? 'text-slate-400' : done ? 'text-emerald-600 group-hover:text-emerald-700' : 'text-primary group-hover:text-primary-hover'}`}>
                {locked ? '🔒 Pro erforderlich →' : done ? 'Ergebnis ansehen →' : 'Starten →'}
              </div>
              {hint && (
                <p className="mt-2 text-xs text-amber-600 font-medium">{hint}</p>
              )}
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
              <div className="px-3 py-2.5 text-xs font-medium text-primary text-center">Pro</div>
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
                <div className="px-3 py-2.5 text-center text-sm">{pro ? <span className="text-primary font-medium">✓</span> : <span className="text-slate-300">—</span>}</div>
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
            className="bg-white text-primary-hover font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-primary-soft transition-colors shrink-0">
            Ab €49/Monat →
          </Link>
        </div>
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Tier } from '@/types'
import { hasAccess } from '@/lib/utils/tier-check'
import { generateSummaryBlock } from '@/lib/utils/summary-priorities'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Executive Summary' }

const ARCHETYPE_LABELS: Record<string, { label: string; color: string }> = {
  starter:     { label: 'AI Starter',     color: 'text-amber-700 bg-amber-50 border-amber-200' },
  scaler:      { label: 'AI Scaler',      color: 'text-primary-hover bg-primary-soft border-primary-border' },
  transformer: { label: 'AI Transformer', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
}

const RISK_CLASS_LABELS: Record<string, { label: string; color: string }> = {
  prohibited: { label: 'Verboten (EU AI Act)',         color: 'text-red-700 bg-red-50 border-red-200' },
  high:       { label: 'Hochrisiko (EU AI Act)',        color: 'text-red-700 bg-red-50 border-red-200' },
  limited:    { label: 'Begrenztes Risiko (EU AI Act)', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  minimal:    { label: 'Minimales Risiko (EU AI Act)',  color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
}

const GOV_RESULT_LABELS: Record<string, { label: string; color: string }> = {
  approve:    { label: 'Freigegeben',               color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  stop_dsgvo: { label: 'Gestoppt (DSGVO)',           color: 'text-red-700 bg-red-50 border-red-200' },
  stop_risk:  { label: 'Gestoppt (Risiko)',          color: 'text-red-700 bg-red-50 border-red-200' },
  improve:    { label: 'Verbesserung erforderlich',  color: 'text-amber-700 bg-amber-50 border-amber-200' },
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function ZusammenfassungPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    profileResult,
    { data: latestAssessment },
    { data: latestCanvas },
    { data: latestGovernance },
    { data: latestArchitecture },
    { data: latestRoadmap },
    { count: usecaseCount },
    { data: topUsecase },
    { data: latestCompliance },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, company, tier').eq('id', user.id).single(),
    supabase.from('assessment_sessions')
      .select('archetype, total_score, created_at')
      .eq('user_id', user.id).eq('completed', true)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('canvases')
      .select('title, archetype, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('governance_sessions')
      .select('use_case_name, result, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('architectures')
      .select('title, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('roadmaps')
      .select('title, archetype, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('use_cases').select('*', { count: 'exact', head: true }),
    supabase.from('use_cases')
      .select('name, weighted_score, created_at')
      .order('weighted_score', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('compliance_checks')
      .select('notes, created_at')
      .eq('user_id', user.id)
      .eq('check_type', 'risk_class')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const profileData = profileResult.data as { full_name: string | null; company: string | null; tier: string } | null
  const tier = (profileData?.tier ?? 'free') as Tier
  const company = profileData?.company

  type ModuleEntry = {
    step: number
    icon: string
    title: string
    href: string
    requiredTier: Tier
    description: string
    done: boolean
    date: string | undefined
    detail: React.ReactNode
  }

  const modules: ModuleEntry[] = [
    {
      step: 1, icon: '◎', title: 'AI-Readiness Assessment', href: '/assessment',
      requiredTier: 'free',
      description: 'Archetyp und AI-Reifegrad in 6 Dimensionen bestimmen',
      done: !!latestAssessment,
      date: latestAssessment?.created_at,
      detail: latestAssessment ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${ARCHETYPE_LABELS[latestAssessment.archetype as string]?.color ?? 'text-slate-700 bg-slate-50 border-slate-200'}`}>
            {ARCHETYPE_LABELS[latestAssessment.archetype as string]?.label ?? latestAssessment.archetype}
          </span>
          <span className="text-xs text-slate-600">
            Score: <span className="font-semibold text-slate-900">{latestAssessment.total_score}</span> / 5.0
          </span>
        </div>
      ) : null,
    },
    {
      step: 2, icon: '◐', title: 'Use-Case Scoring', href: '/usecase',
      requiredTier: 'free',
      description: 'AI-Use-Cases bewerten und nach Priorität einordnen',
      done: (usecaseCount ?? 0) > 0,
      date: topUsecase?.created_at,
      detail: topUsecase ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-600">
            Top Use Case: <span className="font-semibold text-slate-900">{topUsecase.name}</span>
          </span>
          <span className="text-xs text-slate-400">({usecaseCount} gesamt)</span>
        </div>
      ) : null,
    },
    {
      step: 3, icon: '⬣', title: 'Governance-Check', href: '/governance',
      requiredTier: 'free',
      description: 'Use-Case ethisch, rechtlich und nach EU AI Act prüfen',
      done: !!latestGovernance,
      date: latestGovernance?.created_at,
      detail: latestGovernance ? (
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {latestGovernance.use_case_name && (
            <span className="text-xs text-slate-600 truncate min-w-0">
              Use Case: <span className="font-semibold text-slate-900">{latestGovernance.use_case_name}</span>
            </span>
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${GOV_RESULT_LABELS[latestGovernance.result as string]?.color ?? 'text-slate-700 bg-slate-50 border-slate-200'}`}>
            {GOV_RESULT_LABELS[latestGovernance.result as string]?.label ?? latestGovernance.result}
          </span>
        </div>
      ) : null,
    },
    {
      step: 4, icon: '▷', title: 'Roadmap-Generator', href: '/roadmap',
      requiredTier: 'free',
      description: 'Archetyp-spezifischer Umsetzungsplan in 3 Phasen',
      done: !!latestRoadmap,
      date: latestRoadmap?.updated_at,
      detail: latestRoadmap ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-600">
            Roadmap: <span className="font-semibold text-slate-900">{latestRoadmap.title ?? 'Ohne Titel'}</span>
          </span>
          {latestRoadmap.archetype && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ARCHETYPE_LABELS[latestRoadmap.archetype as string]?.color ?? ''}`}>
              {ARCHETYPE_LABELS[latestRoadmap.archetype as string]?.label ?? latestRoadmap.archetype}
            </span>
          )}
        </div>
      ) : null,
    },
    {
      step: 5, icon: '□', title: 'AI Use-Case Canvas', href: '/canvas',
      requiredTier: 'free',
      description: '8-Felder-Canvas: Problem, Lösung, Daten, KPIs und nächste Schritte',
      done: !!latestCanvas,
      date: latestCanvas?.updated_at,
      detail: latestCanvas ? (
        <span className="text-xs text-slate-600">
          Canvas: <span className="font-semibold text-slate-900">{latestCanvas.title}</span>
        </span>
      ) : null,
    },
    {
      step: 6, icon: '⬡', title: 'Compliance Center', href: '/compliance',
      requiredTier: 'pro',
      description: 'EU AI Act Risikoklassen-Check und DSGVO-Pflichten-Checkliste',
      done: !!latestCompliance,
      date: (latestCompliance as { notes?: string | null; created_at?: string } | null)?.created_at,
      detail: latestCompliance ? (
        (() => {
          const rc = (latestCompliance as { notes?: string | null }).notes
          const cfg = rc ? RISK_CLASS_LABELS[rc] : null
          return cfg ? (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
              {cfg.label}
            </span>
          ) : null
        })()
      ) : hasAccess(tier, 'pro') ? (
        <span className="text-xs text-slate-400 italic">Noch nicht durchgeführt</span>
      ) : null,
    },
    {
      step: 7, icon: '◈', title: 'Architektur-Generator', href: '/architecture',
      requiredTier: 'pro',
      description: 'Herstellerneutrale Enterprise AI Reference Architecture generieren',
      done: !!latestArchitecture,
      date: latestArchitecture?.updated_at,
      detail: latestArchitecture ? (
        <span className="text-xs text-slate-600">
          Architektur: <span className="font-semibold text-slate-900">{latestArchitecture.title ?? 'Ohne Titel'}</span>
        </span>
      ) : null,
    },
  ]

  const completedCount = modules.filter(m => m.done).length

  const summary = generateSummaryBlock({
    archetype:              latestAssessment?.archetype ?? null,
    totalScore:             latestAssessment?.total_score ?? null,
    usecaseCount:           usecaseCount ?? 0,
    topUsecase:             topUsecase as { name: string; weighted_score: number } | null,
    governanceResult:       latestGovernance?.result ?? null,
    governanceUseCaseName:  latestGovernance?.use_case_name ?? null,
    complianceRisk:         (latestCompliance as { notes?: string | null } | null)?.notes ?? null,
    completedModules:       completedCount,
    totalModules:           modules.length,
  })

  const URGENCY_STYLE = {
    critical:    { dot: 'bg-red-500',    card: 'border-red-100 bg-red-50',    title: 'text-red-800',    label: 'Kritisch' },
    recommended: { dot: 'bg-amber-400',  card: 'border-amber-100 bg-amber-50', title: 'text-amber-800',  label: 'Empfohlen' },
    next:        { dot: 'bg-blue-400',   card: 'border-blue-100 bg-primary-soft',  title: 'text-blue-800',   label: 'Nächster Schritt' },
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Executive Summary</h1>
          <p className="text-slate-500 text-sm mt-1">
            {company ? `${company} · ` : ''}
            {completedCount} von {modules.length} Modulen abgeschlossen
          </p>
        </div>
        <a
          href={hasAccess(tier, 'pro') ? '/api/export/pdf?module=executive_summary' : '/upgrade'}
          {...(hasAccess(tier, 'pro') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="px-4 py-2 text-sm font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
        >
          PDF exportieren{!hasAccess(tier, 'pro') && <span className="text-xs opacity-60">· Pro</span>}
        </a>
      </div>

      {/* ── KI-Priorisierungs-Summary ─────────────────────────── */}
      {summary.actions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">{summary.headline}</h2>
          <p className="text-xs text-slate-500 mb-4">{summary.subtext}</p>
          <ul className="space-y-2.5" role="list">
            {summary.actions.map((action, i) => {
              const s = URGENCY_STYLE[action.urgency]
              return (
                <li key={i}>
                  <Link
                    href={action.href}
                    className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 hover:opacity-90 transition-opacity ${s.card}`}
                  >
                    <span className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${s.dot}`} aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-semibold uppercase tracking-wide ${s.title}`}>{s.label}</span>
                      </div>
                      <p className={`text-xs font-medium ${s.title}`}>{action.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{action.description}</p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {modules.map(mod => {
          const locked = !hasAccess(tier, mod.requiredTier)
          return (
            <Link
              key={mod.step}
              href={locked ? '/upgrade' : mod.href}
              className="block bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 sm:p-5 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-base text-slate-500 group-hover:border-primary-border transition-colors">
                  {mod.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs text-slate-400 font-medium tabular-nums">{mod.step}</span>
                    <span className="text-sm font-semibold text-slate-900">{mod.title}</span>
                    {locked && (
                      <span className="text-xs text-primary bg-primary-soft border border-primary-border rounded-md px-1.5 py-0.5 shrink-0">Pro</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{mod.description}</p>
                  {mod.detail && <div>{mod.detail}</div>}
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-1.5 ml-2">
                  {mod.done ? (
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5 whitespace-nowrap">
                      Abgeschlossen
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-0.5 whitespace-nowrap">
                      {locked ? 'Pro-Feature' : 'Ausstehend'}
                    </span>
                  )}
                  {mod.date && (
                    <span className="text-xs text-slate-300">{fmt(mod.date)}</span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {tier === 'free' && (
        <div className="mt-6 bg-gradient-to-r from-primary to-primary-hover rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-white font-semibold text-sm mb-1">Auf Professional upgraden</div>
            <div className="text-blue-200 text-xs">Compliance, Architektur und PDF-Export freischalten.</div>
          </div>
          <Link
            href="/upgrade"
            className="bg-white text-primary-hover font-semibold text-sm px-4 py-2 rounded-lg hover:bg-primary-soft transition-colors shrink-0 whitespace-nowrap"
          >
            Upgrade →
          </Link>
        </div>
      )}
    </div>
  )
}

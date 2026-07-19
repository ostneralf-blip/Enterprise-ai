import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Tier } from '@/types'
import { hasAccess } from '@/lib/utils/tier-check'
import { generateSummaryBlock } from '@/lib/utils/summary-priorities'
import { getTranslations, getLocale } from 'next-intl/server'
import { formatDate } from '@/lib/utils/format'
import { MeridianExportButton } from '@/components/shared/MeridianExportButton'
import type { Locale } from '@/i18n/routing'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Executive Summary' }

const ARCHETYPE_COLORS: Record<string, string> = {
  starter:     'text-amber-700 bg-amber-50 border-amber-200',
  scaler:      'text-primary-hover bg-primary-soft border-primary-border',
  transformer: 'text-emerald-700 bg-emerald-50 border-emerald-200',
}

const ARCHETYPE_LABELS: Record<string, string> = {
  starter:     'AI Starter',
  scaler:      'AI Scaler',
  transformer: 'AI Transformer',
}

const RISK_CLASS_COLORS: Record<string, string> = {
  prohibited: 'text-error-text bg-error-subtle border-error-border',
  high:       'text-error-text bg-error-subtle border-error-border',
  limited:    'text-warning-text bg-warning-subtle border-warning-border',
  minimal:    'text-success-text bg-success-subtle border-success-border',
}

const GOV_RESULT_COLORS: Record<string, string> = {
  approve:    'text-success-text bg-success-subtle border-success-border',
  stop_dsgvo: 'text-error-text bg-error-subtle border-error-border',
  stop_risk:  'text-error-text bg-error-subtle border-error-border',
  improve:    'text-warning-text bg-warning-subtle border-warning-border',
}

export default async function ZusammenfassungPage() {
  const [supabase, t, tm, rawLocale] = await Promise.all([
    createClient(),
    getTranslations('summary'),
    getTranslations('modules'),
    getLocale(),
  ])
  const locale = rawLocale as Locale
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

  const RISK_CLASS_LABELS: Record<string, string> = {
    prohibited: t('riskProhibited'),
    high:       t('riskHigh'),
    limited:    t('riskLimited'),
    minimal:    t('riskMinimal'),
  }

  const GOV_RESULT_LABELS: Record<string, string> = {
    approve:    t('govApprove'),
    stop_dsgvo: t('govStopDsgvo'),
    stop_risk:  t('govStopRisk'),
    improve:    t('govImprove'),
  }

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
      step: 1, icon: '◎', title: tm('assessment.title'), href: '/assessment',
      requiredTier: 'free',
      description: tm('assessment.summaryDesc'),
      done: !!latestAssessment,
      date: latestAssessment?.created_at,
      detail: latestAssessment ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${ARCHETYPE_COLORS[latestAssessment.archetype as string] ?? 'text-ink-secondary bg-surface-raised border-line'}`}>
            {ARCHETYPE_LABELS[latestAssessment.archetype as string] ?? latestAssessment.archetype}
          </span>
          <span className="text-xs text-ink-secondary">
            Score: <span className="font-semibold text-ink">{latestAssessment.total_score}</span> / 5.0
          </span>
        </div>
      ) : null,
    },
    {
      step: 2, icon: '◐', title: tm('usecase.title'), href: '/usecase',
      requiredTier: 'free',
      description: tm('usecase.summaryDesc'),
      done: (usecaseCount ?? 0) > 0,
      date: topUsecase?.created_at,
      detail: topUsecase ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-ink-secondary">
            {t('topUseCase')} <span className="font-semibold text-ink">{topUsecase.name}</span>
          </span>
          <span className="text-xs text-ink-muted">{t('totalCount', { count: usecaseCount ?? 0 })}</span>
        </div>
      ) : null,
    },
    {
      step: 3, icon: '⬣', title: tm('governance.title'), href: '/governance',
      requiredTier: 'free',
      description: tm('governance.summaryDesc'),
      done: !!latestGovernance,
      date: latestGovernance?.created_at,
      detail: latestGovernance ? (
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {latestGovernance.use_case_name && (
            <span className="text-xs text-ink-secondary truncate min-w-0">
              {t('useCase')} <span className="font-semibold text-ink">{latestGovernance.use_case_name}</span>
            </span>
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${GOV_RESULT_COLORS[latestGovernance.result as string] ?? 'text-ink-secondary bg-surface-raised border-line'}`}>
            {GOV_RESULT_LABELS[latestGovernance.result as string] ?? latestGovernance.result}
          </span>
        </div>
      ) : null,
    },
    {
      step: 4, icon: '▷', title: tm('roadmap.title'), href: '/roadmap',
      requiredTier: 'free',
      description: tm('roadmap.summaryDesc'),
      done: !!latestRoadmap,
      date: latestRoadmap?.updated_at,
      detail: latestRoadmap ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-secondary">
            {t('roadmapLabel')} <span className="font-semibold text-ink">{latestRoadmap.title ?? t('untitled')}</span>
          </span>
          {latestRoadmap.archetype && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ARCHETYPE_COLORS[latestRoadmap.archetype as string] ?? ''}`}>
              {ARCHETYPE_LABELS[latestRoadmap.archetype as string] ?? latestRoadmap.archetype}
            </span>
          )}
        </div>
      ) : null,
    },
    {
      step: 5, icon: '□', title: tm('canvas.title'), href: '/canvas',
      requiredTier: 'free',
      description: tm('canvas.summaryDesc'),
      done: !!latestCanvas,
      date: latestCanvas?.updated_at,
      detail: latestCanvas ? (
        <span className="text-xs text-ink-secondary">
          {t('canvasLabel')} <span className="font-semibold text-ink">{latestCanvas.title}</span>
        </span>
      ) : null,
    },
    {
      step: 6, icon: '⬡', title: tm('compliance.title'), href: '/compliance',
      requiredTier: 'pro',
      description: tm('compliance.summaryDesc'),
      done: !!latestCompliance,
      date: (latestCompliance as { notes?: string | null; created_at?: string } | null)?.created_at,
      detail: latestCompliance ? (
        (() => {
          const rc = (latestCompliance as { notes?: string | null }).notes
          const label = rc ? RISK_CLASS_LABELS[rc] : null
          const color = rc ? RISK_CLASS_COLORS[rc] : null
          return label && color ? (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${color}`}>
              {label}
            </span>
          ) : null
        })()
      ) : hasAccess(tier, 'pro') ? (
        <span className="text-xs text-ink-muted italic">{t('notDoneYet')}</span>
      ) : null,
    },
    {
      step: 7, icon: '◈', title: tm('architecture.title'), href: '/architecture',
      requiredTier: 'pro',
      description: tm('architecture.summaryDesc'),
      done: !!latestArchitecture,
      date: latestArchitecture?.updated_at,
      detail: latestArchitecture ? (
        <span className="text-xs text-ink-secondary">
          {t('architectureLabel')} <span className="font-semibold text-ink">{latestArchitecture.title ?? t('untitled')}</span>
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
    critical:    { dot: 'bg-error-text',     card: 'border-error-border bg-error-subtle',     title: 'text-error-text',   label: t('urgencyCritical') },
    recommended: { dot: 'bg-warning-text',   card: 'border-warning-border bg-warning-subtle', title: 'text-warning-text', label: t('urgencyRecommended') },
    next:        { dot: 'bg-primary-ring',   card: 'border-primary-soft bg-primary-soft',     title: 'text-primary',      label: t('urgencyNext') },
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold font-serif text-ink">{t('title')}</h1>
          <p className="text-ink-secondary text-sm mt-1">
            {company ? `${company} · ` : ''}
            {t('completedOf', { completed: completedCount, total: modules.length })}
          </p>
        </div>
        <MeridianExportButton
          report="executive-summary"
          namespace="reports.executiveSummary"
          locale={locale}
          isPro={hasAccess(tier, 'pro')}
          hasData={!!latestAssessment}
        />
      </div>

      {/* ── KI-Priorisierungs-Summary ─────────────────────────── */}
      {summary.actions.length > 0 && (
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-6 mb-6">
          <h2 className="text-sm font-semibold text-ink mb-1">{summary.headline}</h2>
          <p className="text-xs text-ink-secondary mb-4">{summary.subtext}</p>
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
                      <p className="text-xs text-ink-secondary mt-0.5">{action.description}</p>
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
              className="block bg-surface border border-line hover:border-line-strong rounded-2xl p-4 sm:p-5 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 bg-surface-raised border border-line rounded-lg flex items-center justify-center text-base text-ink-secondary group-hover:border-primary-border transition-colors">
                  {mod.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs text-ink-muted font-medium tabular-nums">{mod.step}</span>
                    <span className="text-sm font-semibold text-ink">{mod.title}</span>
                    {locked && (
                      <span className="text-xs text-primary bg-primary-soft border border-primary-border rounded-md px-1.5 py-0.5 shrink-0">Pro</span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted mb-2">{mod.description}</p>
                  {mod.detail && <div>{mod.detail}</div>}
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-1.5 ml-2">
                  {mod.done ? (
                    <span className="text-xs font-medium text-success-text bg-success-subtle border border-success-border rounded-full px-2.5 py-0.5 whitespace-nowrap">
                      {t('statusDone')}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-ink-secondary bg-surface-raised border border-line rounded-full px-2.5 py-0.5 whitespace-nowrap">
                      {locked ? t('statusProFeature') : t('statusPending')}
                    </span>
                  )}
                  {mod.date && (
                    <span className="text-xs text-ink-subtle">{formatDate(mod.date, locale)}</span>
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
            <div className="text-white font-semibold text-sm mb-1">{t('upgradeTitle')}</div>
            <div className="text-white/70 text-xs">{t('upgradeDesc')}</div>
          </div>
          <Link
            href="/upgrade"
            className="bg-white text-primary-hover font-semibold text-sm px-4 py-2 rounded-lg hover:bg-primary-soft transition-colors shrink-0 whitespace-nowrap"
          >
            {t('upgradeButton')}
          </Link>
        </div>
      )}
    </div>
  )
}

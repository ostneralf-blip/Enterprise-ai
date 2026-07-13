import { createClient } from '@/lib/supabase/server'
import { MODULES } from '@/config/modules'
import Link from 'next/link'
import type { Metadata } from 'next'
import { hasAccess } from '@/lib/utils/tier-check'
import type { Tier } from '@/types'
import { GuidedPathHero, type PathStep } from '@/components/dashboard/GuidedPathHero'
import { CountUp } from '@/components/dashboard/CountUp'
import { MiniPortfolioMatrix } from '@/components/modules/usecase/MiniPortfolioMatrix'
import { RadarChart } from '@/components/modules/assessment/RadarChart'
import { SortableTileGrid, type TileData } from '@/components/dashboard/SortableTileGrid'
import { getTranslations, getLocale } from 'next-intl/server'
import { pick } from '@/lib/utils/locale-data'
import { formatDate } from '@/lib/utils/format'
import type { Locale } from '@/i18n/routing'

export const metadata: Metadata = { title: 'Dashboard' }

const NOW = Date.now()

const ARCHETYPE_LABELS: Record<string, { label: string; color: string }> = {
  starter:     { label: 'AI Starter',     color: 'text-amber-700 bg-amber-50 border-amber-200' },
  scaler:      { label: 'AI Scaler',      color: 'text-sky-700 bg-sky-100 border-sky-200' },
  transformer: { label: 'AI Transformer', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
}


export default async function DashboardPage() {
  const [supabase, t, rawLocale] = await Promise.all([
    createClient(),
    getTranslations('dashboard'),
    getLocale(),
  ])
  const locale = rawLocale as Locale
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, company, tier, guided_path_reset_at, subscription_status')
    .eq('id', user!.id)
    .single() as { data: { full_name: string | null; company: string | null; tier: string; guided_path_reset_at: string | null; subscription_status: string | null } | null }

  const resetAt = profileData?.guided_path_reset_at ?? null
  const uid = user!.id

  const cnt = (table: string, extra?: Record<string, string | boolean>) => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true })
    if (extra) for (const [k, v] of Object.entries(extra)) q = (q as typeof q).eq(k, v)
    if (resetAt) q = (q as typeof q).gt('created_at', resetAt)
    return q
  }

  // use_cases hat keine user_id-Spalte — Filterung läuft über RLS (via uc_portfolios.user_id).
  // resetAt wird hier NICHT angewendet: das Portfolio zeigt alle Use Cases des Nutzers,
  // unabhängig davon wann der geführte Pfad zuletzt zurückgesetzt wurde.
  const useCaseQuery = supabase
    .from('use_cases')
    .select('id, name, quadrant, scores, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  const [
    { data: latestAssessment },
    { count: architectureCount },
    { count: governanceCount },
    { count: roadmapCount },
    { count: assessmentCount },
    { data: useCaseData },
    { count: canvasCount },
    { count: complianceCount },
  ] = await Promise.all([
    supabase.from('assessment_sessions').select('archetype, total_score, created_at, dim_scores').eq('user_id', uid).eq('completed', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    cnt('architectures',       { user_id: uid }),
    cnt('governance_sessions', { user_id: uid }),
    cnt('roadmaps',            { user_id: uid }),
    cnt('assessment_sessions', { user_id: uid, completed: true }),
    useCaseQuery,
    cnt('canvases',            { user_id: uid }),
    cnt('compliance_checks',   { user_id: uid }),
  ])

  const usecaseCount = useCaseData?.length ?? 0
  const useCasePreview = (useCaseData ?? []).map(uc => ({
    id:       uc.id as string,
    name:     (uc.name ?? '') as string,
    quadrant: uc.quadrant as string,
    scores:   uc.scores as Record<string, number>,
  }))
  const lastUseCaseDate = (useCaseData?.[0] as { created_at?: string } | undefined)?.created_at ?? null

  const tier = (profileData?.tier ?? 'free') as Tier
  const firstName = profileData?.full_name?.split(' ')[0] ?? null
  const savedCount = (architectureCount ?? 0) + (governanceCount ?? 0) + (roadmapCount ?? 0) + (assessmentCount ?? 0)
  const moduleDone: Record<string, boolean> = {
    assessment:  (assessmentCount ?? 0) > 0,
    usecase:     usecaseCount > 0,
    canvas:      (canvasCount ?? 0) > 0,
    governance:  (governanceCount ?? 0) > 0,
    compliance:  (complianceCount ?? 0) > 0,
    architecture:(architectureCount ?? 0) > 0,
    roadmap:     (roadmapCount ?? 0) > 0,
  }

  const assessmentDaysSince = latestAssessment
    ? Math.floor((NOW - new Date(latestAssessment.created_at as string).getTime()) / 86_400_000)
    : 0
  const assessmentWeeksSince = Math.floor(assessmentDaysSince / 7)

  const guidedSteps: PathStep[] = [
    { step: 1, icon: '◎', title: 'Assessment',               desc: t('step1Desc'), href: '/assessment',      done: (assessmentCount ?? 0) > 0 },
    { step: 2, icon: '⊞', title: 'Use-Case',                 desc: t('step2Desc'), href: '/usecase',         done: usecaseCount > 0 },
    { step: 3, icon: '◧', title: 'Canvas',                   desc: t('step3Desc'), href: '/canvas',          done: (canvasCount ?? 0) > 0 },
    { step: 4, icon: '⊙', title: 'Governance',               desc: t('step4Desc'), href: '/governance',      done: (governanceCount ?? 0) > 0 },
    { step: 5, icon: '⚖', title: 'Compliance',               desc: t('step5Desc'), href: '/compliance',      done: (complianceCount ?? 0) > 0 },
    { step: 6, icon: '⬡', title: t('step6Title'),            desc: t('step6Desc'), href: '/architecture',    done: (architectureCount ?? 0) > 0 },
    { step: 7, icon: '□', title: 'Summary',                  desc: t('step7Desc'), href: '/zusammenfassung', done: (assessmentCount ?? 0) > 0 && usecaseCount > 0 && (canvasCount ?? 0) > 0 && (governanceCount ?? 0) > 0 && (complianceCount ?? 0) > 0 && (architectureCount ?? 0) > 0 },
  ]

  const completedSteps = guidedSteps.filter(s => s.done).length
  const nextModuleId = MODULES.find(m => !moduleDone[m.id] && hasAccess(tier, m.requiredTier))?.id ?? null
  const archetypeInfo = latestAssessment ? (ARCHETYPE_LABELS[latestAssessment.archetype as string] ?? null) : null

  // Kacheln statisch sortiert: nächster Schritt → offen → erledigt → gesperrt
  const sortedModules = [...MODULES].sort((a, b) => {
    const priority = (mod: typeof MODULES[0]) => {
      if (mod.id === nextModuleId) return 0
      const locked = !hasAccess(tier, mod.requiredTier)
      const done = moduleDone[mod.id] ?? false
      if (!locked && !done) return 1
      if (done) return 2
      return 3
    }
    return priority(a) - priority(b)
  })

  const subtitleText = completedSteps === 0
    ? t('subtitleStart')
    : completedSteps === guidedSteps.length
      ? t('subtitleComplete')
      : t('subtitleProgress', { completed: completedSteps, total: guidedSteps.length })

  const portfolioCountLabel = usecaseCount === 1
    ? t('portfolioLabelOne')
    : t('portfolioLabel')

  const isPastDue = profileData?.subscription_status === 'past_due'

  return (
    <div>
      {isPastDue && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">Zahlung fehlgeschlagen</p>
            <p className="text-xs text-red-700 mt-0.5">Ihre letzte Zahlung konnte nicht verarbeitet werden. Bitte aktualisieren Sie Ihre Zahlungsmethode, um Ihren Pro-Zugang zu behalten.</p>
          </div>
          <a href="/einstellungen" className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-700 text-white hover:bg-red-800 transition-colors whitespace-nowrap">
            Zahlungsmethode aktualisieren
          </a>
        </div>
      )}
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6"
           data-reveal style={{ '--i': '0' } as React.CSSProperties}>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-primary tracking-widest uppercase mb-1">
            {t('eyebrow')}
          </p>
          <h1 className="text-xl sm:text-2xl font-serif text-slate-900">
            {firstName ? t('greetingWithName', { name: firstName }) : t('greeting')} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{subtitleText}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {latestAssessment && (
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${archetypeInfo?.color ?? 'text-slate-700 bg-slate-50 border-slate-200'}`}>
              {archetypeInfo?.label ?? String(latestAssessment.archetype)}
            </span>
          )}
          {latestAssessment && (
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border text-slate-700 bg-slate-50 border-slate-200">
              {t('scoreLabel', { score: latestAssessment.total_score })}
            </span>
          )}
          <Link href="/ergebnisse" className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:border-primary-border hover:bg-primary-soft transition-colors text-slate-600 hover:text-primary whitespace-nowrap">
            <CountUp value={savedCount} />
            <span>&nbsp;{t('savedResultsLabel')}</span>
          </Link>
        </div>
      </div>

      {/* Guided Path Hero — volle Breite */}
      <div className="mb-6" data-reveal style={{ '--i': '1' } as React.CSSProperties}>
        <GuidedPathHero steps={guidedSteps} tier={tier} />
      </div>

      {/* Quarterly Review Reminder */}
      {latestAssessment && assessmentDaysSince >= 90 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">{t('reviewTitle')}</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {t('reviewDesc', { weeks: assessmentWeeksSince })}
            </p>
          </div>
          <Link href="/assessment" className="whitespace-nowrap px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors flex-shrink-0">
            {t('reviewButton')}
          </Link>
        </div>
      )}

      {/* Scoring-Ampel Zeile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6"
           data-reveal style={{ '--i': '2' } as React.CSSProperties}>
        {/* Karte A: AI-Profil */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col">
          <p className="text-[10px] font-semibold text-primary tracking-widest uppercase mb-1">{t('aiProfile')}</p>
          {latestAssessment && (latestAssessment as { dim_scores?: Record<string, number> }).dim_scores ? (
            <>
              <p className="text-[10px] text-slate-400 mb-3">
                {t('lastAssessment', { date: formatDate(latestAssessment.created_at as string, locale) })}
              </p>
              <RadarChart dimScores={(latestAssessment as { dim_scores: Record<string, number> }).dim_scores} />
              <div className="mt-3 text-center">
                <span className="font-serif text-2xl font-semibold text-slate-900">
                  {new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(latestAssessment.total_score))}
                </span>
                <span className="text-slate-400 text-sm"> / 5</span>
              </div>
              {archetypeInfo && (
                <div className="mt-2 flex justify-center">
                  <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${archetypeInfo.color}`}>
                    {archetypeInfo.label}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-8 gap-3">
              <p className="text-sm text-slate-400 text-center">{t('noAssessment')}</p>
              <Link href="/assessment" className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors">
                {t('startAssessment')}
              </Link>
            </div>
          )}
        </div>

        {/* Karte B: Use-Case-Portfolio */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col">
          <p className="text-[10px] font-semibold text-primary tracking-widest uppercase mb-1">{t('portfolio')}</p>
          {usecaseCount > 0 ? (
            <>
              <p className="text-[10px] text-slate-400 mb-3">
                {usecaseCount} {portfolioCountLabel}
                {lastUseCaseDate ? ` · ${t('portfolioLast', { date: formatDate(lastUseCaseDate, locale) })}` : ''}
              </p>
              <div className="flex-1 flex items-center">
                <MiniPortfolioMatrix useCases={useCasePreview} />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-4 gap-3">
              <MiniPortfolioMatrix useCases={[]} />
              <p className="text-sm text-slate-400 text-center">{t('noPortfolio')}</p>
            </div>
          )}
          <div className="mt-3 text-center">
            <Link href="/usecase" className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors">
              {t('toScoring')}
            </Link>
          </div>
        </div>
      </div>

      {/* Alle Tools */}
      <div className="mb-4">
        <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{t('allTools')}</h2>
      </div>

      <div data-reveal style={{ '--i': '3' } as React.CSSProperties}>
        <SortableTileGrid tiles={sortedModules.map((mod): TileData => ({
          id:       mod.id,
          title:    pick(mod.title, locale),
          subtitle: pick(tier !== 'free' && mod.subtitlePro ? mod.subtitlePro : mod.subtitle, locale),
          locked:   !hasAccess(tier, mod.requiredTier),
          done:     moduleDone[mod.id] ?? false,
          isNext:   mod.id === nextModuleId,
          href:     !hasAccess(tier, mod.requiredTier) ? '/upgrade' : `/${mod.id}`,
        }))} />
      </div>

      {/* Upgrade-Banner */}
      {tier === 'free' && (
        <div className="mt-8 bg-primary-soft border border-primary-border rounded-xl p-5 sm:p-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-primary font-semibold mb-1">{t('upgradeBannerTitle')}</div>
            <div className="text-slate-600 text-sm">{t('upgradeBannerDesc')}</div>
          </div>
          <Link href="/upgrade"
            className="bg-primary hover:bg-primary-hover text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors shrink-0 whitespace-nowrap">
            {t('upgradeButton')}
          </Link>
        </div>
      )}
    </div>
  )
}

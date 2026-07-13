import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import type { ArchitectureResult } from '@/config/architecture-data'
import type { CanvasData, GovernanceVerdict } from '@/types'
import { getTranslations, getLocale } from 'next-intl/server'
import { formatDate } from '@/lib/utils/format'
import type { Locale } from '@/i18n/routing'
import { pick } from '@/lib/utils/locale-data'
import * as Sentry from '@sentry/nextjs'

const LAYER_ICONS = ['⬡', '◈', '◉', '◎', '⊞']

type ShareReason = 'token_not_found' | 'expired' | 'entity_not_found' | 'module_unsupported'
type ShareData =
  | { ok: true; module: string; entity: unknown; link: { view_count: number | null } }
  | { ok: false; reason: ShareReason }

async function getShareData(token: string): Promise<ShareData> {
  const admin = await createAdminClient()

  const { data: link } = await admin
    .from('share_links')
    .select('module, entity_id, expires_at, view_count')
    .eq('token', token)
    .maybeSingle()

  if (!link) return { ok: false, reason: 'token_not_found' }
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { ok: false, reason: 'expired' }
  }

  // increment view count (best-effort)
  admin.from('share_links').update({ view_count: (link.view_count ?? 0) + 1 }).eq('token', token).then(() => {})

  if (link.module === 'architecture') {
    const { data: arch } = await admin
      .from('architectures')
      .select('title, result, wizard_data, updated_at')
      .eq('id', link.entity_id)
      .maybeSingle()
    if (!arch) return { ok: false, reason: 'entity_not_found' }
    return { ok: true, module: 'architecture', entity: arch, link }
  }

  if (link.module === 'assessment') {
    const { data: session } = await admin
      .from('assessment_sessions')
      .select('archetype, total_score, dimension_scores, created_at')
      .eq('id', link.entity_id)
      .maybeSingle()
    if (!session) return { ok: false, reason: 'entity_not_found' }
    return { ok: true, module: 'assessment', entity: session, link }
  }

  if (link.module === 'governance') {
    const { data: session } = await admin
      .from('governance_sessions')
      .select('use_case_name, result, created_at')
      .eq('id', link.entity_id)
      .maybeSingle()
    if (!session) return { ok: false, reason: 'entity_not_found' }
    return { ok: true, module: 'governance', entity: session, link }
  }

  if (link.module === 'roadmap') {
    const { data: roadmap } = await admin
      .from('roadmaps')
      .select('title, archetype, phases, updated_at')
      .eq('id', link.entity_id)
      .maybeSingle()
    if (!roadmap) return { ok: false, reason: 'entity_not_found' }
    return { ok: true, module: 'roadmap', entity: roadmap, link }
  }

  if (link.module === 'canvas') {
    const { data: canvas } = await admin
      .from('canvases')
      .select('title, data, updated_at')
      .eq('id', link.entity_id)
      .maybeSingle()
    if (!canvas) return { ok: false, reason: 'entity_not_found' }
    return { ok: true, module: 'canvas', entity: canvas, link }
  }

  if (link.module === 'usecase') {
    const { data: portfolio } = await admin
      .from('uc_portfolios')
      .select('name, updated_at')
      .eq('id', link.entity_id)
      .maybeSingle()
    if (!portfolio) return { ok: false, reason: 'entity_not_found' }
    const { data: useCases } = await admin
      .from('use_cases')
      .select('name, domain, weighted_score, quadrant')
      .eq('portfolio_id', link.entity_id)
      .order('weighted_score', { ascending: false })
    return { ok: true, module: 'usecase', entity: { ...portfolio, use_cases: useCases ?? [] }, link }
  }

  // Modul existiert in DB aber hat kein Rendering — API-Bug oder Alt-Daten
  Sentry.captureMessage(`share_module_unsupported: ${link.module}`, { level: 'warning', extra: { token: token.slice(0, 8) } })
  return { ok: false, reason: 'module_unsupported' }
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const [{ token }, t, rawLocale] = await Promise.all([
    params,
    getTranslations('share'),
    getLocale(),
  ])
  const locale = rawLocale as Locale
  const shareResult = await getShareData(token)
  if (!shareResult.ok) notFound()
  const share = shareResult

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-bold">N</div>
            <span className="text-sm font-semibold text-slate-900">AI Navigator</span>
          </div>
          <span className="text-xs text-slate-400">{t('readOnlyShared')}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {share.module === 'architecture' && (
          <ArchitectureShareView
            entity={share.entity as { title: string | null; result: ArchitectureResult; updated_at: string }}
            t={t}
            locale={locale}
          />
        )}
        {share.module === 'assessment' && (
          <AssessmentShareView
            entity={share.entity as { archetype: string; total_score: number; created_at: string }}
            t={t}
            locale={locale}
          />
        )}

        {share.module === 'governance' && (
          <GovernanceShareView
            entity={share.entity as { use_case_name: string | null; result: GovernanceVerdict; created_at: string }}
            t={t}
            locale={locale}
          />
        )}
        {share.module === 'roadmap' && (
          <RoadmapShareView
            entity={share.entity as { title: string | null; archetype: string; phases: unknown[]; updated_at: string }}
            t={t}
            locale={locale}
          />
        )}
        {share.module === 'canvas' && (
          <CanvasShareView
            entity={share.entity as { title: string; data: CanvasData; updated_at: string }}
            t={t}
            locale={locale}
          />
        )}
        {share.module === 'usecase' && (
          <UseCaseShareView
            entity={share.entity as { name: string; updated_at: string; use_cases: Array<{ name: string; domain: string | null; weighted_score: number; quadrant: string }> }}
            t={t}
            locale={locale}
          />
        )}

        <p className="text-xs text-slate-400 text-center pt-4">
          {t('createdWith')}{' '}
          <a href="https://enterprise-ai.biz" className="underline hover:text-slate-600">AI Navigator</a>
          {' '}· enterprise-ai.biz
        </p>
      </main>
    </div>
  )
}

type ShareT = Awaited<ReturnType<typeof getTranslations<'share'>>>

function ArchitectureShareView({
  entity,
  t,
  locale,
}: {
  entity: { title: string | null; result: ArchitectureResult; updated_at: string }
  t: ShareT
  locale: Locale
}) {
  const result = entity.result
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{entity.title ?? result.pattern}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('architectureModule')} · {formatDate(entity.updated_at, locale)}
          </p>
        </div>
      </div>

      <div className={cn('rounded-2xl border p-5', result.color.bg, result.color.border)}>
        <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full', result.color.badge)}>
          {t('recommendedPattern')}
        </span>
        <h2 className={cn('text-base font-semibold mt-2 mb-1', result.color.title)}>{result.pattern}</h2>
        <p className="text-sm text-slate-600">{result.summary}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">{t('architectureLayers')}</h3>
        <div className="space-y-3">
          {result.layers.map((layer, i) => (
            <div key={i} className="border border-slate-100 rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-slate-400 text-sm">{LAYER_ICONS[i]}</span>
                <span className="text-sm font-semibold text-slate-800">{layer.name}</span>
              </div>
              <p className="text-xs text-slate-500 mb-2">{layer.role}</p>
              <div className="flex flex-wrap gap-1.5">
                {layer.components.map((comp, j) => (
                  <span key={j} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{comp}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('keyDecisions')}</h3>
          <ul className="space-y-2">
            {result.keyDecisions.map((d, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-600">
                <span className="flex-shrink-0 w-4 h-4 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-semibold text-[10px]">{i + 1}</span>
                <span className="min-w-0">{pick(d, locale)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('nextSteps')}</h3>
          <ul className="space-y-2">
            {result.nextSteps.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-600">
                <span className="flex-shrink-0 w-4 h-4 bg-primary-soft text-primary-hover rounded-full flex items-center justify-center font-semibold text-[10px]">{i + 1}</span>
                <span className="min-w-0">{pick(s, locale)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

const ARCHETYPE_LABELS: Record<string, string> = {
  starter: 'AI Starter',
  scaler: 'AI Scaler',
  transformer: 'AI Transformer',
}

function AssessmentShareView({
  entity,
  t,
  locale,
}: {
  entity: { archetype: string; total_score: number; created_at: string }
  t: ShareT
  locale: Locale
}) {
  return (
    <>
      <div>
        <h1 className="text-xl font-semibold text-slate-900">AI-Readiness Assessment</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {formatDate(entity.created_at, locale)}
        </p>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
        <p className="text-xs text-slate-500 mb-1">{t('archetype')}</p>
        <p className="text-2xl font-bold text-slate-900">{ARCHETYPE_LABELS[entity.archetype] ?? entity.archetype}</p>
        <p className="text-sm text-slate-500 mt-3">{t('maturityScore')}</p>
        <p className="text-4xl font-bold text-primary mt-1">{entity.total_score.toFixed(2)}</p>
        <p className="text-xs text-slate-400 mt-1">{t('outOf50')}</p>
      </div>
    </>
  )
}

// ─── GOVERNANCE ──────────────────────────────────────────────────────────────

const VERDICT_COLORS: Record<GovernanceVerdict, { bg: string; text: string; border: string }> = {
  approve:    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  improve:    { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  stop_risk:  { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
  stop_dsgvo: { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
}

function verdictLabel(verdict: GovernanceVerdict, t: ShareT): string {
  if (verdict === 'approve') return t('verdictApprove')
  if (verdict === 'improve') return t('verdictImprove')
  if (verdict === 'stop_risk') return t('verdictStopRisk')
  return t('verdictStopDsgvo')
}

function GovernanceShareView({
  entity,
  t,
  locale,
}: {
  entity: { use_case_name: string | null; result: GovernanceVerdict; created_at: string }
  t: ShareT
  locale: Locale
}) {
  const colors = VERDICT_COLORS[entity.result] ?? VERDICT_COLORS.improve
  return (
    <>
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{entity.use_case_name ?? t('governanceModule')}</h1>
        <p className="text-xs text-slate-400 mt-0.5">{t('governanceModule')} · {formatDate(entity.created_at, locale)}</p>
      </div>
      <div className={cn('rounded-2xl border p-6 text-center', colors.bg, colors.border)}>
        <p className="text-xs text-slate-500 mb-2">{t('governanceVerdict')}</p>
        <p className={cn('text-2xl font-bold', colors.text)}>{verdictLabel(entity.result, t)}</p>
      </div>
    </>
  )
}

// ─── ROADMAP ─────────────────────────────────────────────────────────────────

type SavedPhase = {
  phase: string
  title: { de: string; en: string }
  duration: { de: string; en: string }
  focus: { de: string; en: string }
  kpis: Array<{ de: string; en: string }>
  budget: string
}

function RoadmapShareView({
  entity,
  t,
  locale,
}: {
  entity: { title: string | null; archetype: string; phases: unknown[]; updated_at: string }
  t: ShareT
  locale: Locale
}) {
  const phases = entity.phases as SavedPhase[]
  return (
    <>
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{entity.title ?? t('roadmapModule')}</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {t('roadmapModule')} · {ARCHETYPE_LABELS[entity.archetype] ?? entity.archetype} · {formatDate(entity.updated_at, locale)}
        </p>
      </div>
      <div className="space-y-4">
        {phases.map((phase, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="text-sm font-semibold text-slate-900 min-w-0">{pick(phase.title, locale)}</h2>
              <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">{pick(phase.duration, locale)}</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">{pick(phase.focus, locale)}</p>
            {phase.kpis.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-700 mb-1.5">{t('roadmapKpis')}</p>
                <ul className="space-y-1">
                  {phase.kpis.map((kpi, j) => (
                    <li key={j} className="text-xs text-slate-600 flex gap-1.5">
                      <span className="text-slate-300 flex-shrink-0">·</span>
                      <span className="min-w-0">{pick(kpi, locale)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-3">{t('roadmapBudget')}: {phase.budget}</p>
          </div>
        ))}
      </div>
    </>
  )
}

// ─── CANVAS ──────────────────────────────────────────────────────────────────

function CanvasShareView({
  entity,
  t,
  locale,
}: {
  entity: { title: string; data: CanvasData; updated_at: string }
  t: ShareT
  locale: Locale
}) {
  const { data } = entity
  const fields: Array<[string, string]> = [
    [t('canvasProblem'),      data.problem],
    [t('canvasSolution'),     data.solution],
    [t('canvasDataSources'),  data.data_sources],
    [t('canvasStakeholders'), data.stakeholders],
    [t('canvasKpis'),         data.kpis],
    [t('canvasRisks'),        data.risks],
    [t('canvasArchitecture'), data.architecture],
    [t('canvasNextSteps'),    data.next_steps],
  ]
  return (
    <>
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{entity.title}</h1>
        <p className="text-xs text-slate-400 mt-0.5">{t('canvasModule')} · {formatDate(entity.updated_at, locale)}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.filter(([, v]) => v).map(([label, value]) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{value}</p>
          </div>
        ))}
      </div>
    </>
  )
}

// ─── USE CASE SCORING ────────────────────────────────────────────────────────

const QUADRANT_STYLES: Record<string, { bg: string; text: string }> = {
  quick_win:         { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  strategic_bet:     { bg: 'bg-sky-100',     text: 'text-sky-700' },
  low_hanging_fruit: { bg: 'bg-amber-100',   text: 'text-amber-700' },
  avoid:             { bg: 'bg-red-100',      text: 'text-red-700' },
}

function quadrantLabel(quadrant: string, t: ShareT): string {
  if (quadrant === 'quick_win') return t('quadrantQuickWin')
  if (quadrant === 'strategic_bet') return t('quadrantStrategicBet')
  if (quadrant === 'low_hanging_fruit') return t('quadrantLowHanging')
  if (quadrant === 'avoid') return t('quadrantAvoid')
  return quadrant
}

type UCSummary = { name: string; domain: string | null; weighted_score: number; quadrant: string }

function UseCaseShareView({
  entity,
  t,
  locale,
}: {
  entity: { name: string; updated_at: string; use_cases: UCSummary[] }
  t: ShareT
  locale: Locale
}) {
  return (
    <>
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{entity.name}</h1>
        <p className="text-xs text-slate-400 mt-0.5">{t('usecaseModule')} · {formatDate(entity.updated_at, locale)}</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {entity.use_cases.length === 0 ? (
          <p className="p-6 text-sm text-slate-400 text-center">—</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {entity.use_cases.map((uc, i) => {
              const qStyle = QUADRANT_STYLES[uc.quadrant] ?? { bg: 'bg-slate-100', text: 'text-slate-600' }
              return (
                <li key={i} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{uc.name}</p>
                    {uc.domain && <p className="text-xs text-slate-400">{uc.domain}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap', qStyle.bg, qStyle.text)}>
                      {quadrantLabel(uc.quadrant, t)}
                    </span>
                    <span className="text-sm font-semibold text-slate-700 tabular-nums">{uc.weighted_score.toFixed(1)}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}

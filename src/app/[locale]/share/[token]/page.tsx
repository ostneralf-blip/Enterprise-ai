import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import type { ArchitectureResult } from '@/config/architecture-data'
import { getTranslations, getLocale } from 'next-intl/server'
import { formatDate } from '@/lib/utils/format'
import type { Locale } from '@/i18n/routing'

const LAYER_ICONS = ['⬡', '◈', '◉', '◎', '⊞']

async function getShareData(token: string) {
  const admin = await createAdminClient()

  const { data: link } = await admin
    .from('share_links')
    .select('module, entity_id, expires_at, view_count')
    .eq('token', token)
    .maybeSingle()

  if (!link) return null
  if (link.expires_at && new Date(link.expires_at) < new Date()) return null

  // increment view count (best-effort)
  admin.from('share_links').update({ view_count: (link.view_count ?? 0) + 1 }).eq('token', token).then(() => {})

  if (link.module === 'architecture') {
    const { data: arch } = await admin
      .from('architectures')
      .select('title, result, wizard_data, updated_at')
      .eq('id', link.entity_id)
      .maybeSingle()
    if (!arch) return null
    return { module: 'architecture', entity: arch, link }
  }

  if (link.module === 'assessment') {
    const { data: session } = await admin
      .from('assessment_sessions')
      .select('archetype, total_score, dimension_scores, created_at')
      .eq('id', link.entity_id)
      .maybeSingle()
    if (!session) return null
    return { module: 'assessment', entity: session, link }
  }

  return null
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const [{ token }, t, rawLocale] = await Promise.all([
    params,
    getTranslations('share'),
    getLocale(),
  ])
  const locale = rawLocale as Locale
  const share = await getShareData(token)
  if (!share) notFound()

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
                <span className="min-w-0">{d}</span>
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
                <span className="min-w-0">{s}</span>
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

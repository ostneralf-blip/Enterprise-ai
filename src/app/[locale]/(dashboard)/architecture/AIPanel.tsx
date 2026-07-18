'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { AlertBox } from '@/components/shared/AlertBox'
import type { CatalogComponent } from '@/types'
import { getSelectionStats } from '@/lib/architecture/selection'
import { explainConflict } from '@/lib/utils/catalog-compatibility'

interface CanvasEnrichment {
  use_case_type?: string
  confidence?: number
  additional_compliance_flags?: string[]
}

interface Props {
  narrative: { component_suggestions?: string[] } | null
  usage: { remaining: number; used: number; limit: number; exceeded: boolean } | null
  aiModel: string | null
  generatedAt: string | null
  tier: string
  locale: string
  catalogComponents: CatalogComponent[]
  rejectedSuggestions: string[]
  canvasEnrichment?: CanvasEnrichment | null
  acceptedSuggestions?: string[]
  activeComponentNames?: Set<string>
  onAccept: (name: string) => void
  onReject: (name: string) => void
  onAcceptAll?: () => void
  onScrollToFirst?: () => void
  onReanalyze?: () => Promise<void>
  loading?: boolean
  conditionalComps?: CatalogComponent[]
  dsgvoConfirmed?: boolean
  onDsgvoConfirm?: () => void
}

export function AIPanel({
  narrative, usage, aiModel, generatedAt, tier, locale,
  catalogComponents, rejectedSuggestions, acceptedSuggestions, activeComponentNames, canvasEnrichment,
  onAccept, onReject, onAcceptAll, onScrollToFirst, onReanalyze,
  loading = false,
  conditionalComps, dsgvoConfirmed, onDsgvoConfirm,
}: Props) {
  const t = useTranslations('modules')
  const [reanalyzing, setReanalyzing] = useState(false)
  const isPro = tier === 'pro' || tier === 'enterprise'
  const byName = new Map(catalogComponents.map(c => [c.name, c]))
  const byNameRecord = Object.fromEntries(byName)
  const accepted = new Set(acceptedSuggestions ?? [])
  // Gate D (#182): Zählen ausschließlich über den zentralen Selektor —
  // Panel-Kopf, Workbench-Header und Validierung lesen dieselbe Quelle.
  const { visibleSuggestions: suggestions, openSuggestions, conflicts } = getSelectionStats({
    activeComponentNames: activeComponentNames ?? new Set<string>(),
    components: catalogComponents,
    aiSuggestions: narrative?.component_suggestions,
    rejectedSuggestions,
    acceptedSuggestions,
  })

  const complianceHint = canvasEnrichment?.additional_compliance_flags?.[0] ?? null

  const handleReanalyze = async () => {
    if (!onReanalyze || reanalyzing) return
    setReanalyzing(true)
    try { await onReanalyze() } finally { setReanalyzing(false) }
  }

  return (
    <div className="bg-[color:var(--color-ai-soft)] border border-purple-200 rounded-2xl p-4 space-y-4">

      {/* 1. Titel + Pro-Chip */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[color:var(--color-ai)] text-base shrink-0" aria-hidden="true">◆</span>
          <h3 className="text-sm font-semibold text-slate-900 whitespace-nowrap">{t('architecture.aiPanelTitle')}</h3>
          <span className={cn(
            'text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded',
            isPro
              ? 'bg-[color:var(--color-ai)] text-white'
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          )}>
            {t('architecture.aiPanelProChip')}
          </span>
        </div>
      </div>

      {/* 1b. Konflikte — ganz oben, wie die Empfehlungen unten aufgelistet */}
      {conflicts.length > 0 && (
        <ul className="space-y-1.5">
          {conflicts.map(c => {
            const explanation = explainConflict(c.a, c.b, byNameRecord)
            return (
              <li key={`${c.a}|${c.b}`} className="flex items-start gap-2 bg-error-subtle border border-error-border rounded-xl px-3 py-2">
                <span className="text-[10px] text-error-text shrink-0 mt-0.5" aria-hidden="true">⚠</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-error-text mb-0.5">{t('architecture.aiPanelConflictLabel')}</p>
                  <p className="text-xs text-error-text leading-relaxed">{locale === 'en' ? explanation.en : explanation.de}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* 2. Usage-Bar */}
      {usage && (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{t('architecture.aiPanelUsage')}</span>
            <span className={usage.exceeded ? 'text-red-600 font-semibold' : ''}>
              {usage.exceeded ? t('architecture.aiPanelLimitReached') : `${usage.used} / ${usage.limit}`}
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', usage.exceeded ? 'bg-red-400' : 'bg-[color:var(--color-ai)]')}
              style={{ width: `${Math.min(100, Math.round((usage.used / usage.limit) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* 2b. Free-Tier Upgrade-Teaser — nach der 1 inkludierten Analyse */}
      {tier === 'free' && usage?.exceeded && (
        <div className="bg-white border border-purple-200 rounded-xl px-3 py-3 text-center space-y-1.5">
          <p className="text-xs font-semibold text-slate-800">{t('architecture.aiPanelFreeTeaserTitle')}</p>
          <p className="text-[10px] text-slate-500 leading-relaxed">{t('architecture.aiPanelFreeTeaserBody')}</p>
          <a href="/pricing" className="inline-block text-xs font-semibold text-[color:var(--color-ai)] hover:underline focus:outline-none focus:ring-1 focus:ring-purple-400 rounded">
            {t('architecture.aiPanelFreeTeaserCta')}
          </a>
        </div>
      )}

      {/* 3. Use-Case-Typ mit Konfidenz aus Canvas */}
      {canvasEnrichment?.use_case_type && (
        <div className="bg-white border border-purple-100 rounded-xl px-3 py-2">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">
            {t('architecture.aiPanelUseCaseType')}
          </p>
          <p className="text-xs font-semibold text-slate-800">{canvasEnrichment.use_case_type}</p>
          {canvasEnrichment.confidence != null && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              {t('architecture.aiPanelConfidence')} {Math.round(canvasEnrichment.confidence * 100)}% · {t('architecture.aiPanelFromCanvas')}
            </p>
          )}
        </div>
      )}

      {/* 4. Komponenten-Vorschläge mit Sammel-Aktion */}
      <div>
        {suggestions.length > 0 ? (
          <>
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-slate-700">
                {t('architecture.aiPanelSuggestionsCount', { count: openSuggestions.length })}
              </p>
              {openSuggestions.length > 0 && (
                <div className="flex gap-1.5 shrink-0">
                  {onAcceptAll && (
                    <button
                      type="button"
                      onClick={() => { onAcceptAll(); (window as Window & { posthog?: { capture: (e: string) => void } }).posthog?.capture('ai_suggestions_accepted_all') }}
                      className="px-2 py-1 text-[10px] font-semibold bg-[color:var(--color-ai)] text-white rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      {t('architecture.aiPanelAcceptAll')}
                    </button>
                  )}
                  {onScrollToFirst && (
                    <button
                      type="button"
                      onClick={onScrollToFirst}
                      className="px-2 py-1 text-[10px] font-semibold border border-purple-200 text-[color:var(--color-ai)] rounded-lg hover:bg-purple-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      {t('architecture.aiPanelSingleCheck')}
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mb-2">{t('architecture.aiPanelSuggestionsHint')}</p>
            <ul className="space-y-1.5">
              {suggestions.map(name => {
                const comp = byName.get(name)
                const isAccepted = accepted.has(name)
                return (
                  <li key={name} className={cn('flex items-center gap-2 bg-white border rounded-xl px-3 py-2', isAccepted ? 'border-emerald-200 opacity-70' : 'border-purple-100')}>
                    <span className={cn('text-[10px] shrink-0', isAccepted ? 'text-emerald-600' : 'text-[color:var(--color-ai)]')} aria-hidden="true">{isAccepted ? '✓' : '◆'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{name}</p>
                      {comp?.category && <p className="text-[10px] text-slate-400">{comp.category}</p>}
                    </div>
                    {isAccepted ? (
                      <span className="text-[10px] font-semibold text-emerald-600 shrink-0">{t('architecture.aiPanelAccepted')}</span>
                    ) : (
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => { onAccept(name); (window as Window & { posthog?: { capture: (e: string, p?: object) => void } }).posthog?.capture('ai_suggestion_accepted', { component: name }) }}
                          className="px-2 py-1 text-[10px] font-semibold bg-[color:var(--color-ai)] text-white rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-purple-400"
                        >
                          {t('architecture.aiPanelAccept')}
                        </button>
                        <button
                          type="button"
                          onClick={() => { onReject(name); (window as Window & { posthog?: { capture: (e: string, p?: object) => void } }).posthog?.capture('ai_suggestion_rejected', { component: name }) }}
                          className="px-2 py-1 text-[10px] font-semibold border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                        >
                          {t('architecture.aiPanelReject')}
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        ) : (
          <p className="text-xs text-slate-400 italic">{t('architecture.aiPanelNoSuggestions')}</p>
        )}
      </div>

      {/* 5. Compliance-Hinweis */}
      {complianceHint && (
        <AlertBox variant="warning" className="p-2.5 px-3">
          {complianceHint}
        </AlertBox>
      )}

      {/* 5b. DSGVO-Bestätigung (wandert aus dem Ergebnis-Flow ins Panel) */}
      {conditionalComps && conditionalComps.length > 0 && (
        <AlertBox variant="warning" title={t('architecture.dsgvoWarningTitle')} className="p-3">
          <p className="text-[10px] leading-relaxed mb-2">
            {t('architecture.dsgvoWarningBody')}
          </p>
          <ul className="space-y-0.5 mb-2">
            {conditionalComps.map(c => (
              <li key={c.name} className="text-[10px] flex items-center gap-1">
                <span aria-hidden="true">·</span>
                <strong>{c.name}</strong>
                {c.vendor && <span className="opacity-70">({c.vendor})</span>}
              </li>
            ))}
          </ul>
          {!dsgvoConfirmed ? (
            <button
              type="button"
              onClick={onDsgvoConfirm}
              className="w-full py-1.5 text-[10px] font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {t('architecture.dsgvoConfirmButton')}
            </button>
          ) : (
            <p className="text-[10px] font-medium flex items-center gap-1">
              <span aria-hidden="true">✓</span> {t('architecture.dsgvoConfirmedMsg')}
            </p>
          )}
        </AlertBox>
      )}

      {/* 6. Provenienz-Zeile mit Cache-Hit-Status */}
      {aiModel && (
        <div className="border-t border-purple-100 pt-2 space-y-0.5">
          <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
            {t('architecture.narrativeProvenance')}: {aiModel.replace(' (cached)', '')}
            {generatedAt ? ` · ${new Date(generatedAt).toLocaleDateString('de-DE')}` : ''}
          </p>
          <p className="text-[10px] text-slate-400">
            {t('architecture.narrativeCacheHit')}:{' '}
            <span className={aiModel.includes('(cached)') ? 'text-green-600 font-medium' : ''}>
              {aiModel.includes('(cached)') ? t('architecture.narrativeCacheHitYes') : t('architecture.narrativeCacheHitNo')}
            </span>
          </p>
        </div>
      )}

      {/* 7. Neu analysieren — volle Breite */}
      {onReanalyze && (
        <button
          type="button"
          onClick={handleReanalyze}
          disabled={reanalyzing || loading || (usage?.exceeded ?? false)}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400',
            reanalyzing || loading || (usage?.exceeded ?? false)
              ? 'border-slate-200 text-slate-400 bg-white cursor-not-allowed'
              : 'border-purple-200 text-[color:var(--color-ai)] bg-white hover:bg-purple-50'
          )}
        >
          <span aria-hidden="true">◆</span>
          {reanalyzing || loading ? t('architecture.narrativeLoading') : t('architecture.aiPanelReanalyze')}
        </button>
      )}
    </div>
  )
}

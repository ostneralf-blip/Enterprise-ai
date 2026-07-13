'use client'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { CatalogComponent } from '@/types'

interface Props {
  narrative: { component_suggestions?: string[]; summary?: string } | null
  usage: { remaining: number; used: number; limit: number; exceeded: boolean } | null
  aiModel: string | null
  generatedAt: string | null
  catalogComponents: CatalogComponent[]
  rejectedSuggestions: string[]
  useCaseType?: string | null
  complianceHint?: string | null
  onAccept: (name: string) => void
  onReject: (name: string) => void
  onReanalyze?: () => void
}

export function AIPanel({
  narrative, usage, aiModel, generatedAt, catalogComponents,
  rejectedSuggestions, useCaseType, complianceHint,
  onAccept, onReject, onReanalyze,
}: Props) {
  const t = useTranslations('modules')
  const byName = new Map(catalogComponents.map(c => [c.name, c]))
  const rejected = new Set(rejectedSuggestions)
  const suggestions = (narrative?.component_suggestions ?? []).filter(n => byName.has(n) && !rejected.has(n))

  return (
    <div className="sticky top-[56px] h-fit bg-[color:var(--color-ai-soft)] border border-purple-200 rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[color:var(--color-ai)] text-base" aria-hidden="true">◆</span>
          <h3 className="text-sm font-semibold text-slate-900">{t('architecture.aiPanelTitle')}</h3>
        </div>
        {onReanalyze && (
          <button
            type="button"
            onClick={onReanalyze}
            className="text-[10px] font-semibold text-[color:var(--color-ai)] underline hover:opacity-70 focus:outline-none"
          >
            {t('architecture.aiPanelReanalyze')}
          </button>
        )}
      </div>

      {/* Use case type */}
      {useCaseType && (
        <div className="bg-white border border-purple-100 rounded-xl px-3 py-2">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">{t('architecture.aiPanelUseCaseType')}</p>
          <p className="text-xs font-semibold text-slate-800">{useCaseType}</p>
        </div>
      )}

      {/* Compliance hint */}
      {complianceHint && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <p className="text-[10px] text-amber-700">{complianceHint}</p>
        </div>
      )}

      {/* Usage */}
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

      {/* Suggestions */}
      <div>
        <p className="text-xs font-semibold text-slate-700 mb-1">{t('architecture.aiPanelSuggestionsTitle')}</p>
        <p className="text-[10px] text-slate-400 mb-2">{t('architecture.aiPanelSuggestionsHint')}</p>
        {suggestions.length === 0 ? (
          <p className="text-xs text-slate-400 italic">{t('architecture.aiPanelNoSuggestions')}</p>
        ) : (
          <ul className="space-y-1.5">
            {suggestions.map(name => {
              const comp = byName.get(name)
              return (
                <li key={name} className="flex items-center gap-2 bg-white border border-purple-100 rounded-xl px-3 py-2">
                  <span className="text-[color:var(--color-ai)] text-[10px]" aria-hidden="true">◆</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate">{name}</p>
                    {comp?.category && <p className="text-[10px] text-slate-400">{comp.category}</p>}
                  </div>
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
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Provenance */}
      {aiModel && (
        <p className="text-[10px] text-slate-400 font-mono border-t border-purple-100 pt-2">
          {t('architecture.aiPanelProvenance')}: <span className="font-mono">{aiModel}</span>
          {generatedAt ? ` · ${new Date(generatedAt).toLocaleDateString('de-DE')}` : ''}
        </p>
      )}
    </div>
  )
}

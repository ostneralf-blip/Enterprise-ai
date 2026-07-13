'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { pick } from '@/lib/utils/locale-data'
import type { CatalogComponent } from '@/types'
import type { CatalogRecommendations } from '@/config/architecture-rules'

const COLLAPSE_KEY = 'arch_selection_collapsed_v1'

type SelectionEntry = { checked: boolean; source: 'rule' | 'ai' | 'manual' }
type SelectionMap = Map<string, SelectionEntry>

interface Props {
  catalogRecs: CatalogRecommendations
  components: CatalogComponent[]
  aiSuggested: Set<string>
  onBack: () => void
  onConfirm: (selected: Set<string>) => void
  locale: string
}

function initMap(catalogRecs: CatalogRecommendations, aiSuggested: Set<string>): SelectionMap {
  const m: SelectionMap = new Map()
  for (const lr of catalogRecs.layers) {
    for (const name of lr.componentNames) m.set(name, { checked: true, source: 'rule' })
  }
  for (const name of aiSuggested) {
    if (!m.has(name)) m.set(name, { checked: false, source: 'ai' })
  }
  return m
}

function readCollapsed(): Set<string> {
  try {
    const stored = localStorage.getItem(COLLAPSE_KEY)
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set()
  } catch { return new Set() }
}

export function ComponentSelectionStep({ catalogRecs, components, aiSuggested, onBack, onConfirm, locale }: Props) {
  const t = useTranslations('modules')
  const byName = new Map(components.map(c => [c.name, c]))
  const [map, setMap] = useState<SelectionMap>(() => initMap(catalogRecs, aiSuggested))
  const [collapsed, setCollapsed] = useState<Set<string>>(readCollapsed)

  // Merge new catalog entries when catalogRecs updates (async load), preserving user changes
  useEffect(() => {
    setMap(prev => {
      const next = new Map(prev)
      for (const lr of catalogRecs.layers) {
        for (const name of lr.componentNames) {
          if (!next.has(name)) next.set(name, { checked: true, source: 'rule' })
        }
      }
      return next
    })
  }, [catalogRecs])

  const toggleCollapse = (layer: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(layer)) next.delete(layer); else next.add(layer)
      try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...next])) } catch { /* ignore */ }
      ;(window as Window & { posthog?: { capture: (e: string, p?: object) => void } })
        .posthog?.capture('arch_layer_collapsed', { layer, collapsed: next.has(layer) })
      return next
    })
  }

  const toggleComponent = (name: string) => {
    setMap(prev => {
      const next = new Map(prev)
      const cur = next.get(name)
      const newChecked = !(cur?.checked ?? false)
      next.set(name, { checked: newChecked, source: cur?.source ?? 'manual' })
      ;(window as Window & { posthog?: { capture: (e: string, p?: object) => void } })
        .posthog?.capture('arch_component_toggled', { component: name, checked: newChecked, source: cur?.source ?? 'manual' })
      return next
    })
  }

  const checkedCount = [...map.values()].filter(v => v.checked).length
  const totalCount = map.size

  const handleConfirm = () => {
    onConfirm(new Set([...map].filter(([, v]) => v.checked).map(([k]) => k)))
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">{t('architecture.selectionTitle')}</h2>
        <p className="text-sm text-slate-500">{t('architecture.selectionHint', { checked: checkedCount, total: totalCount })}</p>
      </div>

      <div className="space-y-3">
        {catalogRecs.layers.map(lr => {
          const ruleNames = lr.componentNames
          const aiNames = [...aiSuggested].filter(n => byName.has(n) && !ruleNames.includes(n))
          const allNames = [...ruleNames, ...aiNames]
          const layerChecked = allNames.filter(n => map.get(n)?.checked).length
          const isCollapsed = collapsed.has(lr.layer)

          return (
            <div key={lr.layer} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCollapse(lr.layer)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{lr.layer}</span>
                  <span className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    layerChecked > 0 ? 'bg-primary-soft text-primary' : 'bg-slate-100 text-slate-400'
                  )}>
                    {layerChecked}/{allNames.length}
                  </span>
                </div>
                <span className="text-slate-400 text-xs">{isCollapsed ? '▾' : '▴'}</span>
              </button>

              {!isCollapsed && (
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {ruleNames.map(name => {
                    const comp = byName.get(name)
                    const entry = map.get(name)
                    const reason = lr.componentReasons?.[name]
                    return (
                      <label key={name} className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                        <input type="checkbox" checked={entry?.checked ?? true} onChange={() => toggleComponent(name)} className="mt-0.5 accent-blue-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-slate-800">{name}</span>
                            {comp?.hosting.some(h => h.toLowerCase().includes('eu')) && (
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">EU</span>
                            )}
                            {comp?.cloud_provider === 'sap' && (
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary-soft text-primary">SAP</span>
                            )}
                            {comp?.dsgvo_status === 'conditional' && (
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">DSGVO ~</span>
                            )}
                            {comp?.dsgvo_status === 'non_compliant' && (
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-50 text-red-700">DSGVO ✗</span>
                            )}
                          </div>
                          {reason && <p className="text-[11px] text-slate-400 mt-0.5">{pick(reason, locale)}</p>}
                        </div>
                      </label>
                    )
                  })}
                  {aiNames.map(name => {
                    const comp = byName.get(name)
                    const entry = map.get(name)
                    return (
                      <label key={name} className="flex items-start gap-3 px-4 py-3 cursor-pointer bg-[color:var(--color-ai-soft)] hover:opacity-90 transition-opacity border-l-2 border-[color:var(--color-ai)]">
                        <input type="checkbox" checked={entry?.checked ?? false} onChange={() => toggleComponent(name)} className="mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-slate-800">{name}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[color:var(--color-ai)] text-white">◆ KI</span>
                          </div>
                          {comp?.description && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{comp.description}</p>}
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 mt-6 pb-8">
        <button type="button" onClick={onBack}
          className="px-4 py-2.5 text-sm font-medium border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 whitespace-nowrap">
          {t('architecture.backButton')}
        </button>
        <button type="button" onClick={handleConfirm} disabled={checkedCount === 0}
          className="flex-1 px-4 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-ring whitespace-nowrap">
          {t('architecture.selectionConfirm')}
        </button>
      </div>
    </div>
  )
}

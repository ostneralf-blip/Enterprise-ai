'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { pick } from '@/lib/utils/locale-data'
import type { CatalogComponent } from '@/types'
import type { CatalogRecommendations } from '@/config/architecture-rules'
import { findConflicts, explainConflict } from '@/lib/utils/catalog-compatibility'

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

function readCollapsed(): Set<string> {
  try {
    const stored = localStorage.getItem(COLLAPSE_KEY)
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set()
  } catch { return new Set() }
}

export function ComponentSelectionStep({ catalogRecs, components, aiSuggested, onBack, onConfirm, locale }: Props) {
  const t = useTranslations('modules')
  const byName = new Map(components.map(c => [c.name, c]))
  // userOverrides: explicit user toggles (boolean) — map is derived via useMemo
  const [userOverrides, setUserOverrides] = useState<Map<string, boolean>>(new Map())
  const [collapsed, setCollapsed] = useState<Set<string>>(readCollapsed)

  // Derive full selection map from catalog recs + AI suggestions + user overrides.
  // This avoids calling setState inside useEffect when catalogRecs updates asynchronously.
  const map = useMemo<SelectionMap>(() => {
    const m: SelectionMap = new Map()
    for (const lr of catalogRecs.layers) {
      for (const name of lr.componentNames) {
        const override = userOverrides.get(name)
        m.set(name, { checked: override ?? true, source: 'rule' })
      }
    }
    for (const name of aiSuggested) {
      if (!m.has(name)) {
        const override = userOverrides.get(name)
        m.set(name, { checked: override ?? false, source: 'ai' })
      }
    }
    // Manually added components (e.g., conflict resolution alternatives not in catalog/AI)
    for (const [name, checked] of userOverrides) {
      if (!m.has(name) && checked) m.set(name, { checked: true, source: 'manual' })
    }
    return m
  }, [catalogRecs, aiSuggested, userOverrides])

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
    const cur = map.get(name)
    const newChecked = !(cur?.checked ?? false)
    setUserOverrides(prev => { const next = new Map(prev); next.set(name, newChecked); return next })
    ;(window as Window & { posthog?: { capture: (e: string, p?: object) => void } })
      .posthog?.capture('arch_component_toggled', { component: name, checked: newChecked, source: cur?.source ?? 'manual' })
  }

  const checkedCount = [...map.values()].filter(v => v.checked).length
  const totalCount = map.size

  const byNameRecord = Object.fromEntries(byName.entries())
  const checkedSet = new Set([...map].filter(([, v]) => v.checked).map(([k]) => k))
  const conflicts = findConflicts(checkedSet, byNameRecord)
  const [showAltFor, setShowAltFor] = useState<Set<string>>(new Set())

  // Fire arch_conflict_shown once per unique conflict set
  const lastConflictKeys = useRef<string>('')
  useEffect(() => {
    if (conflicts.length === 0) return
    const key = conflicts.map(c => `${c.a}||${c.b}`).sort().join(';')
    if (key === lastConflictKeys.current) return
    lastConflictKeys.current = key
    ;(window as Window & { posthog?: { capture: (e: string, p?: object) => void } })
      .posthog?.capture('arch_conflict_shown', { count: conflicts.length })
  }, [conflicts])

  const resolveConflict = (remove: string, add?: string) => {
    setUserOverrides(prev => {
      const next = new Map(prev)
      next.set(remove, false)
      if (add) next.set(add, true)
      return next
    })
    ;(window as Window & { posthog?: { capture: (e: string, p?: object) => void } })
      .posthog?.capture('arch_conflict_resolved', { removed: remove, added: add ?? null })
  }

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

          const layerConflicts = conflicts.filter(c => ruleNames.includes(c.a) || ruleNames.includes(c.b))

          return (
            <div key={lr.layer}>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
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
            {/* Konflikt-Banner für diesen Layer */}
            {layerConflicts.map(conflict => {
              const pairKey = `${conflict.a}||${conflict.b}`
              const explanation = explainConflict(conflict.a, conflict.b, byNameRecord)
              const isShowingAlts = showAltFor.has(pairKey)
              return (
                <div key={pairKey} className="mt-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true">⚠</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-amber-800 font-medium">{pick(explanation, locale)}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button type="button" onClick={() => {
                          const next = new Set(showAltFor)
                          if (next.has(pairKey)) next.delete(pairKey); else next.add(pairKey)
                          setShowAltFor(next)
                        }} className="text-[10px] font-semibold text-amber-700 underline hover:opacity-70 focus:outline-none">
                          {t('architecture.conflictShowAlts')}
                        </button>
                        <button type="button" onClick={() => resolveConflict(conflict.b)}
                          className="text-[10px] font-semibold text-amber-700 underline hover:opacity-70 focus:outline-none">
                          {conflict.b} {t('architecture.conflictRemove')}
                        </button>
                      </div>
                      {isShowingAlts && conflict.alternatives.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {conflict.alternatives.map(alt => (
                            <button key={alt} type="button" onClick={() => resolveConflict(conflict.b, alt)}
                              className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 focus:outline-none">
                              + {alt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
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

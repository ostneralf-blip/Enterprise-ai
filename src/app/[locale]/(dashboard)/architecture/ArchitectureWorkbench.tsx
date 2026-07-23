'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { TechnicalArchitectureOptimisation } from './TechnicalArchitectureOptimisation'
import { ArchitekturLandkarte } from './ArchitekturLandkarte'
import type { CatalogComponent } from '@/types'
import type { CatalogRecommendations } from '@/config/architecture-rules'
import type { WizardAnswers } from '@/config/architecture-data'
import { getSelectionStats } from '@/lib/architecture/selection'
import { explainConflict } from '@/lib/utils/catalog-compatibility'
import { InfoHint } from '@/components/shared/InfoHint'

type Tab = 'komponenten' | 'diagramm' | 'katalog'
const LS_OPEN = 'arch_workbench_open_v1'
const LS_TAB  = 'arch_workbench_tab_v1'

interface Props {
  catalogRecs: CatalogRecommendations
  recComponents: CatalogComponent[]
  activeComponentNames: Set<string>
  onCheckedChange: (next: Set<string>) => void
  aiSuggestions: string[]
  componentSources: Record<string, 'rule' | 'ai' | 'manual'>
  aiSuggested: Set<string>
  level: 1 | 2 | 3
  answers: WizardAnswers
  useCaseName: string | null
  locale: string
  componentOwners: Record<string, string>
  componentOpsNotes: Record<string, string>
  onOwnerChange: (name: string, role: string) => void
  onOpsNotesChange: (name: string, notes: string) => void
  roleNames: string[]
  forceOpenTab?: 'komponenten' | 'diagramm' | 'katalog' | null
  rejectedSuggestions?: string[]
  acceptedSuggestions?: string[]
}

export function ArchitectureWorkbench({
  catalogRecs, recComponents, activeComponentNames, onCheckedChange,
  aiSuggestions, componentSources, aiSuggested, level, answers, useCaseName, locale,
  componentOwners, componentOpsNotes, onOwnerChange, onOpsNotesChange, roleNames,
  forceOpenTab, rejectedSuggestions, acceptedSuggestions,
}: Props) {
  const t = useTranslations('modules.architecture')
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(LS_OPEN) === 'true'
  })
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === 'undefined') return 'komponenten'
    return (localStorage.getItem(LS_TAB) as Tab | null) ?? 'komponenten'
  })
  const [search, setSearch] = useState('')
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!forceOpenTab) return
    setOpen(true)
    setTab(forceOpenTab)
    localStorage.setItem(LS_OPEN, 'true')
    localStorage.setItem(LS_TAB, forceOpenTab)
  }, [forceOpenTab])

  // Gate D (#182): Zählen ausschließlich über den zentralen Selektor —
  // Header, KI-Panel und Validierung lesen damit dieselbe Quelle.
  const { effectiveNames: effective, openSuggestions, conflicts } = getSelectionStats({
    activeComponentNames,
    fallbackNames: catalogRecs.layers.flatMap(lr => lr.componentNames),
    components: recComponents,
    aiSuggestions,
    rejectedSuggestions,
    acceptedSuggestions,
  })
  const hasBadge = openSuggestions.length > 0 || conflicts.length > 0
  const byName = Object.fromEntries(recComponents.map(c => [c.name, c]))

  const handleToggle = () => {
    setOpen(v => {
      const next = !v
      localStorage.setItem(LS_OPEN, String(next))
      if (next) (window as Window & { posthog?: { capture: (e: string, p?: object) => void } }).posthog?.capture('workbench_opened')
      return next
    })
  }

  const handleTab = (t: Tab) => {
    setTab(t)
    localStorage.setItem(LS_TAB, t)
    ;(window as Window & { posthog?: { capture: (e: string, p?: object) => void } }).posthog?.capture('workbench_tab', { tab: t })
  }

  const filtered = search.trim()
    ? recComponents.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.vendor ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : recComponents

  const TABS: { id: Tab; label: string }[] = [
    { id: 'komponenten', label: t('workbenchTabKomponenten') },
    { id: 'diagramm',    label: t('workbenchTabDiagramm') },
    { id: 'katalog',     label: t('workbenchTabKatalog') },
  ]

  return (
    <div id="architecture-workbench" className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* InfoHint als Geschwister NEBEN dem Toggle-Button (keine verschachtelten Buttons). */}
      <div className="flex items-center">
        <button
          onClick={handleToggle}
          className="flex-1 min-w-0 flex items-center justify-between gap-3 pl-4 sm:pl-6 pr-3 py-4 text-left hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-1"
          aria-expanded={open}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">{t('workbenchTitle')}</span>
            <span className="text-xs text-slate-400 truncate">
              {effective.size} {t('workbenchSummaryComponents')}
              {openSuggestions.length > 0 && ` · ${t('workbenchSummarySuggestions', { count: openSuggestions.length })}`}
              {conflicts.length > 0 && ` · ${t('workbenchSummaryConflicts', { count: conflicts.length })}`}
            </span>
            {hasBadge && (
              <span className="shrink-0 text-[10px] font-bold text-[color:var(--color-ai)] bg-[color:var(--color-ai-soft)] px-1.5 py-0.5 rounded">◆</span>
            )}
          </div>
          <svg className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="shrink-0 pr-4 sm:pr-6">
          <InfoHint title={t('workbenchInfoTitle')} side="bottom" align="right">
            <p>{t('workbenchInfo')}</p>
          </InfoHint>
        </div>
      </div>

      {open && (
        <>
          <div className="border-t border-slate-100 px-4 sm:px-6 flex gap-0">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleTab(id)}
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  tab === id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-200 p-4 sm:p-6">
            {tab === 'komponenten' && (
              <div className="space-y-4">
                {conflicts.length > 0 && (
                  <div role="alert" className="space-y-2">
                    {conflicts.map(c => {
                      const key = [c.a, c.b].sort().join('||')
                      const expanded = expandedConflicts.has(key)
                      const explanation = explainConflict(c.a, c.b, byName)
                      const removeA = () => { const next = new Set(activeComponentNames); next.delete(c.a); onCheckedChange(next) }
                      const removeB = () => { const next = new Set(activeComponentNames); next.delete(c.b); onCheckedChange(next) }
                      return (
                        <div key={key} className="border border-error-border bg-error-subtle rounded-xl px-3 py-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs text-error-text leading-relaxed flex-1 min-w-0">
                              <span className="font-semibold">⚠ </span>
                              {explanation[locale as 'de' | 'en'] ?? explanation.de}
                            </p>
                            {c.alternatives.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setExpandedConflicts(prev => {
                                  const next = new Set(prev)
                                  next.has(key) ? next.delete(key) : next.add(key)
                                  return next
                                })}
                                className="text-[10px] font-semibold text-error-text border border-error-border rounded-lg px-2 py-1 hover:bg-error-subtle transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-error-border"
                              >
                                {expanded ? t('conflictHideAlt') : t('conflictShowAlt')}
                              </button>
                            )}
                          </div>
                          <div className="flex gap-1.5 flex-wrap">
                            <button type="button" onClick={removeA} className="text-[10px] font-semibold text-error-text border border-error-border rounded-lg px-2 py-1 hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-error-border">
                              {t('conflictRemove', { name: c.a })}
                            </button>
                            <button type="button" onClick={removeB} className="text-[10px] font-semibold text-error-text border border-error-border rounded-lg px-2 py-1 hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-error-border">
                              {t('conflictRemove', { name: c.b })}
                            </button>
                          </div>
                          {expanded && c.alternatives.length > 0 && (
                            <div className="pt-1 space-y-1">
                              <p className="text-[10px] text-error-text font-medium">{t('conflictAlternatives')}:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {c.alternatives.map(alt => (
                                  <button
                                    key={alt}
                                    type="button"
                                    onClick={() => {
                                      const next = new Set(activeComponentNames)
                                      next.delete(c.a)
                                      next.add(alt)
                                      onCheckedChange(next)
                                    }}
                                    className="text-[10px] font-semibold border border-slate-200 text-slate-600 bg-white rounded-lg px-2 py-1 hover:border-primary hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring"
                                  >
                                    + {alt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                <TechnicalArchitectureOptimisation
                  catalogRecs={catalogRecs}
                  recComponents={recComponents}
                  activeComponentNames={activeComponentNames}
                  onCheckedChange={onCheckedChange}
                  aiSuggestions={aiSuggestions}
                  embedded
                />
                {effective.size > 0 && roleNames.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{t('workbenchOwnerTitle')}</p>
                    {[...effective].map(name => (
                      <div key={name} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 space-y-1.5">
                        <span className="text-xs font-medium text-slate-800">{name}</span>
                        <div className="flex flex-col sm:flex-row gap-1.5">
                          <select
                            value={componentOwners[name] ?? ''}
                            onChange={e => onOwnerChange(name, e.target.value)}
                            className="flex-1 min-w-0 text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-ring"
                          >
                            <option value="">{t('workbenchOwnerNone')}</option>
                            {roleNames.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={componentOpsNotes[name] ?? ''}
                            onChange={e => onOpsNotesChange(name, e.target.value.slice(0, 120))}
                            placeholder={t('workbenchOpsNotesPlaceholder')}
                            maxLength={120}
                            className="flex-1 min-w-0 text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-ring"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'diagramm' && (
              <ArchitekturLandkarte
                catalogRecs={catalogRecs}
                components={recComponents}
                activeNames={effective}
                aiSuggested={aiSuggested}
                complianceMode={false}
                execMode={false}
                level={level}
                answers={answers}
                useCaseName={useCaseName}
                eamValid={true}
              />
            )}

            {tab === 'katalog' && (
              <div className="space-y-3">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('workbenchCatalogSearch')}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-ring"
                />
                <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
                  {filtered.map(comp => (
                    <div key={comp.name} className="py-3 flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-900">{comp.name}</span>
                          {effective.has(comp.name) && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{t('workbenchCatalogActive')}</span>
                          )}
                          {componentSources[comp.name] === 'ai' && (
                            <span className="text-[10px] font-bold text-[color:var(--color-ai)] bg-[color:var(--color-ai-soft)] px-1.5 py-0.5 rounded">◆ KI</span>
                          )}
                        </div>
                        {comp.vendor && <p className="text-xs text-slate-400 mt-0.5">{comp.vendor}</p>}
                        {comp.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{comp.description}</p>}
                      </div>
                      <button
                        onClick={() => {
                          const next = new Set(effective)
                          effective.has(comp.name) ? next.delete(comp.name) : next.add(comp.name)
                          onCheckedChange(next)
                        }}
                        className="shrink-0 text-xs px-2 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
                      >
                        {effective.has(comp.name) ? t('workbenchCatalogRemove') : t('workbenchCatalogAdd')}
                      </button>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-400">{t('workbenchCatalogEmpty')}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

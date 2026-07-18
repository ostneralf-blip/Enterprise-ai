'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { CatalogComponent } from '@/types'
import type { CatalogRecommendations } from '@/config/architecture-rules'
import { findConflicts } from '@/lib/utils/catalog-compatibility'

const LS_KEY = 'arch_optimisation_open_v1'

interface Props {
  catalogRecs: CatalogRecommendations
  recComponents: CatalogComponent[]
  activeComponentNames: Set<string>
  onCheckedChange: (next: Set<string>) => void
  aiSuggestions?: string[]
  embedded?: boolean
}

export function TechnicalArchitectureOptimisation({
  catalogRecs,
  recComponents,
  activeComponentNames,
  onCheckedChange,
  aiSuggestions = [],
  embedded = false,
}: Props) {
  const t = useTranslations('modules.architecture')

  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(LS_KEY) === 'true'
  })

  useEffect(() => {
    localStorage.setItem(LS_KEY, String(open))
  }, [open])

  const fallbackNames = new Set(catalogRecs.layers.flatMap(lr => lr.componentNames))
  const effective = activeComponentNames.size > 0 ? activeComponentNames : fallbackNames
  const byName = Object.fromEntries(recComponents.map(c => [c.name, c]))
  const conflicts = findConflicts(effective, byName)
  const openSuggestions = aiSuggestions.filter(s => !effective.has(s))

  // Bug-Report 18.07.2026: aktive Komponenten, die nicht Teil der ursprünglich
  // berechneten catalogRecs.layers sind (z. B. per KI "Übernehmen" nachträglich
  // hinzugefügt, oder aus einer gespeicherten Auswahl geladen, deren Empfehlung
  // sich seither geändert hat), wurden hier nirgendwo gerendert — dadurch weder
  // sichtbar noch abwählbar, obwohl sie in effective/effective.size mitzählten.
  // Layer-Buckets deshalb um alle aktiven Komponenten ergänzen, die per
  // architecture_layer einer Sektion zuzuordnen sind, statt strikt bei den
  // ursprünglichen Empfehlungs-Buckets zu bleiben.
  const mergedLayers: { layer: string; componentNames: string[] }[] =
    catalogRecs.layers.map(lr => ({ layer: lr.layer, componentNames: [...lr.componentNames] }))
  const layerIndex = new Map(mergedLayers.map((lr, i) => [lr.layer, i]))
  for (const name of effective) {
    const comp = byName[name]
    if (!comp?.architecture_layer) continue
    const idx = layerIndex.get(comp.architecture_layer)
    if (idx === undefined) {
      layerIndex.set(comp.architecture_layer, mergedLayers.length)
      mergedLayers.push({ layer: comp.architecture_layer, componentNames: [name] })
    } else if (!mergedLayers[idx].componentNames.includes(name)) {
      mergedLayers[idx].componentNames.push(name)
    }
  }

  const hasIssues = conflicts.length > 0 || openSuggestions.length > 0

  const layerLabel = (layer: string): string => ({
    data: t('layerData'),
    model: t('layerModel'),
    serving: t('layerServing'),
    mlops: t('layerMlops'),
    application: t('layerApplication'),
    governance: t('layerGovernance'),
    security: t('layerSecurity'),
  } as Record<string, string>)[layer] ?? layer

  const toggle = (name: string, checked: boolean) => {
    const next = new Set(effective)
    checked ? next.add(name) : next.delete(name)
    onCheckedChange(next)
  }

  const content = (
        <div className={cn('space-y-4', !embedded && 'border-t border-slate-100 px-4 py-4')}>
          {/* Layer blocks */}
          {mergedLayers.map(layer => {
            const layerComps = layer.componentNames.map(n => byName[n]).filter(Boolean)
            const selectedInLayer = layerComps.filter(c => effective.has(c.name)).length
            return (
              <div key={layer.layer} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{layerLabel(layer.layer)}</span>
                  <span className="text-xs text-slate-400">
                    {t('techOptLayerCount', { selected: selectedInLayer, total: layerComps.length })}
                  </span>
                </div>
                <div className="space-y-1">
                  {layerComps.map(comp => {
                    const isActive = effective.has(comp.name)
                    const isAiSuggested = aiSuggestions.includes(comp.name)
                    return (
                      <label
                        key={comp.name}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors',
                          isActive ? 'border-primary/30 bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={e => toggle(comp.name, e.target.checked)}
                          className="h-3.5 w-3.5 accent-primary shrink-0"
                        />
                        <span className="text-xs font-medium text-slate-800 min-w-0">{comp.name}</span>
                        {isAiSuggested && !isActive && (
                          <span className="ml-auto shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] text-violet-700">◆ KI</span>
                        )}
                        {comp.dsgvo_status === 'non_compliant' && (
                          <span className="ml-auto shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700">DSGVO</span>
                        )}
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
  )

  if (embedded) return content

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">{t('techOptTitle')}</span>
          {hasIssues && (
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {conflicts.length > 0 && `${conflicts.length} ⚠`}
              {openSuggestions.length > 0 && ` · ${openSuggestions.length} ◆`}
            </span>
          )}
          <span className="truncate text-xs text-slate-400 min-w-0">
            {hasIssues
              ? t('techOptSummary', { components: effective.size, suggestions: openSuggestions.length, conflicts: conflicts.length })
              : t('techOptSummaryClean', { components: effective.size })
            }
          </span>
        </div>
        <svg
          className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && content}
    </section>
  )
}

'use client'
import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import type { CatalogComponent } from '@/types'
import type { CatalogRecommendations } from '@/config/architecture-rules'
import { SelectionSidebar } from '@/components/modules/SelectionSidebar'
import { findConflicts, findSuggestions } from '@/lib/utils/catalog-compatibility'

const LAYER_META: Record<string, { label: string; band: string; dot: string; cross?: boolean }> = {
  data:        { label: 'Daten',      band: 'bg-blue-50 border-blue-200',     dot: 'bg-blue-500' },
  model:       { label: 'Modell',     band: 'bg-violet-50 border-violet-200', dot: 'bg-violet-500' },
  mlops:       { label: 'MLOps',      band: 'bg-amber-50 border-amber-200',   dot: 'bg-amber-500' },
  serving:     { label: 'Serving',    band: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  application: { label: 'Anwendung',  band: 'bg-indigo-50 border-indigo-200', dot: 'bg-indigo-500' },
  governance:  { label: 'Governance', band: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500', cross: true },
  security:    { label: 'Security',   band: 'bg-red-50 border-red-200',       dot: 'bg-red-500',    cross: true },
}

const DSGVO_BADGE: Record<string, string> = {
  compliant:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  conditional:   'bg-amber-50 text-amber-700 border-amber-200',
  non_compliant: 'bg-red-50 text-red-700 border-red-200',
}
const DSGVO_LABEL: Record<string, string> = {
  compliant: 'DSGVO ✓', conditional: 'DSGVO ~', non_compliant: 'DSGVO ✗',
}

export interface ArchitectureDiagramProps {
  recs: CatalogRecommendations
  components: CatalogComponent[]
  tier?: string
  pattern?: string
  archetype?: string
}

interface DetailPanelProps {
  name: string
  comp: CatalogComponent | undefined
  onClose: () => void
}

function DetailPanel({ name, comp, onClose }: DetailPanelProps) {
  return (
    <div className="border-t border-slate-100 px-4 sm:px-5 py-3.5 bg-slate-50/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm font-semibold text-slate-900">{name}</p>
          {comp ? (
            <div className="text-xs text-slate-600 space-y-1">
              {comp.vendor && <p><span className="font-medium text-slate-700">Vendor:</span> {comp.vendor}</p>}
              {comp.hosting.length > 0 && <p><span className="font-medium text-slate-700">Hosting:</span> {comp.hosting.join(', ')}</p>}
              {comp.dsgvo_status && (
                <p>
                  <span className="font-medium text-slate-700">DSGVO: </span>
                  <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium border', DSGVO_BADGE[comp.dsgvo_status] ?? 'bg-slate-100 text-slate-600 border-slate-200')}>
                    {DSGVO_LABEL[comp.dsgvo_status] ?? comp.dsgvo_status}
                  </span>
                </p>
              )}
              {comp.description && <p className="text-slate-500 leading-relaxed mt-1">{comp.description}</p>}
              {comp.website_url && (
                <a href={comp.website_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-blue-600 hover:underline">
                  Website ↗
                </a>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Keine Katalog-Details verfügbar.</p>
          )}
        </div>
        <button onClick={onClose} aria-label="Details schließen"
          className="text-slate-400 hover:text-slate-600 text-xl leading-none flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded">
          ×
        </button>
      </div>
    </div>
  )
}

function ComponentButton({
  name,
  comp,
  isChecked,
  isFocused,
  isConflicting,
  isSuggested,
  locked,
  onCheck,
  onFocus,
}: {
  name: string
  comp: CatalogComponent | undefined
  isChecked: boolean
  isFocused: boolean
  isConflicting: boolean
  isSuggested: boolean
  locked: boolean
  onCheck: () => void
  onFocus: () => void
}) {
  if (locked) {
    return <div className="h-7 w-28 rounded-lg bg-slate-100 animate-pulse" />
  }
  return (
    <div className={cn(
      'inline-flex items-center rounded-lg border text-xs font-medium transition-all',
      isChecked
        ? 'border-blue-400 bg-blue-50 text-blue-800 shadow-sm'
        : isConflicting
        ? 'border-red-400 bg-red-50 text-red-800'
        : isSuggested
        ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
        : 'border-slate-200 bg-white text-slate-700',
      isFocused && 'ring-2 ring-blue-400 ring-offset-1',
    )}
    title={
      isConflicting ? `Inkompatibel mit einer ausgewählten Komponente` :
      isSuggested   ? `Empfohlen als Ergänzung` :
      undefined
    }
    >
      <label className="flex items-center gap-1 pl-2 pr-1 py-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={onCheck}
          aria-label={`${name} auswählen`}
          className="w-3 h-3 rounded accent-blue-500 cursor-pointer flex-shrink-0"
        />
      </label>
      <button
        onClick={onFocus}
        aria-pressed={isFocused}
        className="pr-2.5 py-1.5 min-w-0 truncate max-w-[140px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded"
      >
        {name}
      </button>
      {comp?.dsgvo_status && (
        <span className={cn('px-1 py-0.5 mr-1.5 rounded text-[9px] font-semibold border flex-shrink-0', DSGVO_BADGE[comp.dsgvo_status] ?? 'bg-slate-100 text-slate-600 border-slate-200')}>
          {DSGVO_LABEL[comp.dsgvo_status]}
        </span>
      )}
    </div>
  )
}

function SwimlaneTable({
  recs,
  byName,
  locked,
  checked,
  focused,
  conflictingNames,
  suggestedNames,
  onCheck,
  onFocus,
}: {
  recs: CatalogRecommendations
  byName: Record<string, CatalogComponent>
  locked: boolean
  checked: Set<string>
  focused: string | null
  conflictingNames: Set<string>
  suggestedNames: Set<string>
  onCheck: (name: string) => void
  onFocus: (name: string) => void
}) {
  const mainLayers = recs.layers.filter(lr => !LAYER_META[lr.layer]?.cross)
  const crossLayers = recs.layers.filter(lr => LAYER_META[lr.layer]?.cross)

  return (
    <div className="overflow-x-auto">
      {/* Main swimlane rows */}
      <table className="w-full border-collapse text-xs min-w-[480px]">
        <tbody>
          {mainLayers.map((lr, layerIdx) => {
            const meta = LAYER_META[lr.layer] ?? { label: lr.layer, band: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400' }
            const isLast = layerIdx === mainLayers.length - 1
            return (
              <tr key={lr.layer} className={cn(!isLast && 'border-b border-slate-100')}>
                <td className={cn('px-3 py-3 w-28 align-middle border-r border-slate-100 shrink-0', meta.band)}>
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className={cn('w-2 h-2 rounded-full flex-shrink-0', meta.dot)} />
                    <span className="font-semibold text-[11px] uppercase tracking-wide text-slate-700">{meta.label}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 align-middle">
                  <div className="flex flex-wrap gap-2">
                    {locked
                      ? lr.componentNames.map((_, i) => <div key={i} className="h-7 w-28 rounded-lg bg-slate-100 animate-pulse" />)
                      : lr.componentNames.map(name => (
                          <ComponentButton
                            key={name}
                            name={name}
                            comp={byName[name]}
                            isChecked={checked.has(name)}
                            isFocused={focused === name}
                            isConflicting={conflictingNames.has(name)}
                            isSuggested={suggestedNames.has(name) && !checked.has(name)}
                            locked={false}
                            onCheck={() => onCheck(name)}
                            onFocus={() => onFocus(name)}
                          />
                        ))
                    }
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Cross-cutting banners: Governance + Security */}
      {crossLayers.length > 0 && (
        <div className="border-t-2 border-dashed border-slate-200 mt-1 min-w-[480px]">
          <div className="px-3 py-1.5 bg-slate-50">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Querschnittsfunktionen</span>
          </div>
          <div className="flex flex-wrap gap-0 divide-x divide-slate-100">
            {crossLayers.map(lr => {
              const meta = LAYER_META[lr.layer]!
              return (
                <div key={lr.layer} className={cn('flex-1 min-w-[220px] px-3 py-2.5', meta.band)}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={cn('w-2 h-2 rounded-full flex-shrink-0', meta.dot)} />
                    <span className="font-semibold text-[11px] uppercase tracking-wide text-slate-700">{meta.label}</span>
                    <span className="text-[9px] text-slate-400 ml-1">gilt für alle Layer</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {locked
                      ? lr.componentNames.map((_, i) => <div key={i} className="h-6 w-20 rounded bg-slate-100 animate-pulse" />)
                      : lr.componentNames.map(name => (
                          <ComponentButton
                            key={name}
                            name={name}
                            comp={byName[name]}
                            isChecked={checked.has(name)}
                            isFocused={focused === name}
                            isConflicting={conflictingNames.has(name)}
                            isSuggested={suggestedNames.has(name) && !checked.has(name)}
                            locked={false}
                            onCheck={() => onCheck(name)}
                            onFocus={() => onFocus(name)}
                          />
                        ))
                    }
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function FullscreenModal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-5xl flex flex-col overflow-hidden shadow-2xl"
        style={{ maxHeight: 'calc(100vh - 3rem)' }}
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export function ArchitectureDiagram({ recs, components, tier = 'free', pattern, archetype }: ArchitectureDiagramProps) {
  const locked  = tier === 'free'
  const byName  = Object.fromEntries(components.map(c => [c.name, c]))
  const [checked, setChecked]       = useState<Set<string>>(new Set())
  const [focused, setFocused]       = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  const mainLayers  = recs.layers.filter(lr => !LAYER_META[lr.layer]?.cross)
  const totalComponents = recs.layers.reduce((s, l) => s + l.componentNames.length, 0)

  const handleCheck = (name: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const handleFocus = (name: string) => {
    setFocused(prev => prev === name ? null : name)
  }

  const conflicts   = findConflicts(checked, byName)
  const suggestions = findSuggestions(checked, byName)
  const showSidebar = checked.size > 0

  // Which un-checked components would cause a conflict if selected?
  const wouldConflictIfChecked = new Set<string>()
  for (const name of checked) {
    const comp = byName[name]
    if (!comp) continue
    // Forward: checked component says B is incompatible
    for (const incompat of comp.incompatible_with) {
      if (!checked.has(incompat)) wouldConflictIfChecked.add(incompat)
    }
  }
  // Reverse: un-checked component says a checked component is incompatible
  for (const [otherName, otherComp] of Object.entries(byName)) {
    if (checked.has(otherName)) continue
    for (const incompat of otherComp.incompatible_with) {
      if (checked.has(incompat)) { wouldConflictIfChecked.add(otherName); break }
    }
  }

  const suggestedNames = new Set(suggestions.map(s => s.target))

  // Bug #74: components added via "+" suggestion may not be in recs.layers.componentNames.
  // Inject them into their respective layer so checkboxes become visible in the swimlane.
  const allLayerNames = new Set(recs.layers.flatMap(lr => lr.componentNames))
  const extraByLayer = new Map<string, string[]>()
  for (const name of checked) {
    if (!allLayerNames.has(name)) {
      const layer = byName[name]?.architecture_layer
      if (layer) {
        if (!extraByLayer.has(layer)) extraByLayer.set(layer, [])
        extraByLayer.get(layer)!.push(name)
      }
    }
  }
  const displayRecs = extraByLayer.size === 0 ? recs : {
    ...recs,
    layers: recs.layers.map(lr => {
      const extras = extraByLayer.get(lr.layer) ?? []
      return extras.length > 0 ? { ...lr, componentNames: [...lr.componentNames, ...extras] } : lr
    }),
  }

  const handleAddComponent    = (name: string) => setChecked(prev => new Set([...prev, name]))
  const handleRemoveComponent = (name: string) => {
    setChecked(prev => { const next = new Set(prev); next.delete(name); return next })
  }

  const focusedComp = focused ? byName[focused] : undefined

  const header = (
    <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0 flex-wrap">
        {pattern ? (
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 truncate">{pattern}</h3>
            {archetype && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap flex-shrink-0">
                {archetype}
              </span>
            )}
          </div>
        ) : (
          <h3 className="text-sm font-semibold text-slate-900">Enterprise Architekturdiagramm</h3>
        )}
        {locked
          ? <span className="text-xs text-slate-400">🔒 Pro-Feature</span>
          : <span className="text-xs text-slate-400">{totalComponents} Komponenten · {mainLayers.length} Schichten</span>
        }
      </div>
      {!locked && (
        <button
          onClick={() => setFullscreen(v => !v)}
          aria-label={fullscreen ? 'Vollbild schließen' : 'Vollbild öffnen'}
          title={fullscreen ? 'Schließen (ESC)' : 'Vollbild'}
          className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100 flex-shrink-0 text-base"
        >
          {fullscreen ? '✕' : '⛶'}
        </button>
      )}
    </div>
  )

  const body = (
    <div className="relative">
      <div className={cn('flex', showSidebar ? 'flex-col md:flex-row' : 'flex-col')}>
        <div className={cn('min-w-0', showSidebar ? 'md:flex-[7]' : 'flex-1')}>
          <SwimlaneTable
            recs={displayRecs}
            byName={byName}
            locked={locked}
            checked={checked}
            focused={focused}
            conflictingNames={wouldConflictIfChecked}
            suggestedNames={suggestedNames}
            onCheck={handleCheck}
            onFocus={handleFocus}
          />
        </div>
        {showSidebar && !locked && (
          <div className="md:flex-[3] md:max-w-[260px]">
            <SelectionSidebar
              checked={checked}
              byName={byName}
              conflicts={conflicts}
              suggestions={suggestions}
              onAddComponent={handleAddComponent}
              onRemoveComponent={handleRemoveComponent}
            />
          </div>
        )}
      </div>
      {locked && (
        <div className="absolute inset-0 backdrop-blur-[3px] bg-white/55 flex flex-col items-center justify-center gap-3 rounded-b-2xl">
          <p className="text-sm font-semibold text-slate-700 text-center">Vollständiges Architekturdiagramm</p>
          <p className="text-xs text-slate-500 text-center max-w-52">
            {totalComponents} Komponenten in {mainLayers.length} Schichten — verfügbar ab Pro
          </p>
          <a href="/upgrade"
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors">
            Jetzt upgraden →
          </a>
        </div>
      )}
    </div>
  )

  const detailPanel = focused && (
    <DetailPanel name={focused} comp={focusedComp} onClose={() => setFocused(null)} />
  )

  if (fullscreen) {
    return (
      <FullscreenModal onClose={() => setFullscreen(false)}>
        <div className="flex flex-col overflow-hidden">
          {header}
          <div className="overflow-y-auto flex-1">{body}</div>
          {detailPanel}
        </div>
      </FullscreenModal>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {header}
      {body}
      {detailPanel}
    </div>
  )
}

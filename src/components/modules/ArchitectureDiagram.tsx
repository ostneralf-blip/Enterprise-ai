'use client'
import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import type { CatalogComponent } from '@/types'
import type { CatalogRecommendations } from '@/config/architecture-rules'

const LAYER_META: Record<string, { label: string; color: string; dot: string }> = {
  data:        { label: 'Daten',      color: 'bg-blue-50 border-blue-200 text-blue-800',      dot: 'bg-blue-500' },
  model:       { label: 'Modell',     color: 'bg-violet-50 border-violet-200 text-violet-800', dot: 'bg-violet-500' },
  mlops:       { label: 'MLOps',      color: 'bg-amber-50 border-amber-200 text-amber-800',    dot: 'bg-amber-500' },
  serving:     { label: 'Serving',    color: 'bg-emerald-50 border-emerald-200 text-emerald-800', dot: 'bg-emerald-500' },
  governance:  { label: 'Governance', color: 'bg-orange-50 border-orange-200 text-orange-800', dot: 'bg-orange-500' },
  security:    { label: 'Security',   color: 'bg-red-50 border-red-200 text-red-800',          dot: 'bg-red-500' },
  application: { label: 'Anwendung',  color: 'bg-indigo-50 border-indigo-200 text-indigo-800', dot: 'bg-indigo-500' },
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

function SwimlaneTable({
  recs,
  byName,
  locked,
  selected,
  onSelect,
}: {
  recs: CatalogRecommendations
  byName: Record<string, CatalogComponent>
  locked: boolean
  selected: string | null
  onSelect: (name: string) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs min-w-[480px]">
        <tbody>
          {recs.layers.map((lr, layerIdx) => {
            const meta = LAYER_META[lr.layer] ?? { label: lr.layer, color: 'bg-slate-50 border-slate-200 text-slate-700', dot: 'bg-slate-400' }
            const isLast = layerIdx === recs.layers.length - 1
            return (
              <tr key={lr.layer} className={cn(!isLast && 'border-b border-slate-100')}>
                {/* Layer label cell */}
                <td className={cn('px-3 py-3 w-28 align-middle border-r border-slate-100 shrink-0', meta.color)}>
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className={cn('w-2 h-2 rounded-full flex-shrink-0', meta.dot)} />
                    <span className="font-semibold text-[11px] uppercase tracking-wide">{meta.label}</span>
                  </div>
                </td>
                {/* Component cells */}
                <td className="px-3 py-2.5 align-middle">
                  {locked ? (
                    <div className="flex flex-wrap gap-2">
                      {lr.componentNames.map((_, i) => (
                        <div key={i} className="h-7 w-28 rounded-lg bg-slate-100 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {lr.componentNames.map(name => {
                        const comp = byName[name]
                        const isSelected = selected === name
                        return (
                          <button
                            key={name}
                            onClick={() => onSelect(name)}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500',
                              isSelected
                                ? 'border-blue-400 bg-blue-50 text-blue-800 shadow-sm'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm',
                            )}
                          >
                            <span className="min-w-0 truncate max-w-[150px]">{name}</span>
                            {comp?.dsgvo_status && (
                              <span className={cn('px-1 py-0.5 rounded text-[9px] font-semibold border flex-shrink-0', DSGVO_BADGE[comp.dsgvo_status] ?? 'bg-slate-100 text-slate-600 border-slate-200')}>
                                {DSGVO_LABEL[comp.dsgvo_status]}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
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

export function ArchitectureDiagram({ recs, components, tier = 'free' }: ArchitectureDiagramProps) {
  const locked  = tier === 'free'
  const byName  = Object.fromEntries(components.map(c => [c.name, c]))
  const [selected, setSelected]     = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  const totalComponents = recs.layers.reduce((s, l) => s + l.componentNames.length, 0)

  const handleSelect = (name: string) => {
    setSelected(prev => prev === name ? null : name)
  }

  const selectedComp = selected ? byName[selected] : undefined

  const header = (
    <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <h3 className="text-sm font-semibold text-slate-900">Enterprise Architekturdiagramm</h3>
        {locked
          ? <span className="text-xs text-slate-400">🔒 Pro-Feature</span>
          : <span className="text-xs text-slate-400">{totalComponents} Komponenten · {recs.layers.length} Schichten</span>
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
      <SwimlaneTable recs={recs} byName={byName} locked={locked} selected={selected} onSelect={handleSelect} />
      {locked && (
        <div className="absolute inset-0 backdrop-blur-[3px] bg-white/55 flex flex-col items-center justify-center gap-3 rounded-b-2xl">
          <p className="text-sm font-semibold text-slate-700 text-center">Vollständiges Architekturdiagramm</p>
          <p className="text-xs text-slate-500 text-center max-w-52">
            {totalComponents} Komponenten in {recs.layers.length} Schichten — verfügbar ab Pro
          </p>
          <a href="/upgrade"
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors">
            Jetzt upgraden →
          </a>
        </div>
      )}
    </div>
  )

  const detailPanel = selected && (
    <DetailPanel name={selected} comp={selectedComp} onClose={() => setSelected(null)} />
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

'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { togafComps, dataFlowComps } from '@/lib/architecture/diagram-grouping'

interface PatternLayer { name: string; role: string; components: string[] }
interface Comp { name: string; architecture_layer: string | null }

interface Labels {
  viewLabel: string
  schichten: string
  togaf: string
  datenfluss: string
  bandData: string
  bandApplication: string
  bandTechnology: string
  bandCross: string
  bandOther: string
  flowSources: string
  flowPlatform: string
  flowModels: string
  flowConsumption: string
  flowCross: string
  emptyBand: string
}

type Mode = 'schichten' | 'togaf' | 'datenfluss'

const LAYER_ICONS = ['▤', '◈', '⬡', '◎']

function Chip({ name, ai }: { name: string; ai?: boolean }) {
  return (
    <span className="text-xs bg-surface-raised text-ink-secondary px-2 py-0.5 rounded-full">
      {(ai ? '◆ ' : '') + name}
    </span>
  )
}

function Band({ label, names, componentSources, emptyLabel, dashed }: {
  label: string; names: string[]; componentSources?: Record<string, string>; emptyLabel: string; dashed?: boolean
}) {
  return (
    <div className={cn('rounded-xl p-3.5', dashed ? 'border-2 border-dashed border-line' : 'border border-line-subtle')}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {names.length === 0
          ? <span className="text-xs text-ink-subtle italic">{emptyLabel}</span>
          : names.map(n => <Chip key={n} name={n} ai={componentSources?.[n] === 'ai'} />)}
      </div>
    </div>
  )
}

export function ShareArchitectureViews({ patternLayers, componentLayers, componentSources, labels }: {
  patternLayers: PatternLayer[]
  componentLayers: Record<string, string | null>
  componentSources?: Record<string, string>
  labels: Labels
}) {
  const [mode, setMode] = useState<Mode>('schichten')

  // Alle Bausteine als {name, architecture_layer} (aus dem Katalog-Lookup).
  const comps: Comp[] = Object.entries(componentLayers).map(([name, layer]) => ({ name, architecture_layer: layer }))
  const known = new Set<string>()

  const modes: { id: Mode; label: string }[] = [
    { id: 'schichten', label: labels.schichten },
    { id: 'togaf', label: labels.togaf },
    { id: 'datenfluss', label: labels.datenfluss },
  ]

  const seg = (active: boolean) =>
    cn('text-xs font-medium px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap',
      active ? 'bg-primary text-white border-primary' : 'bg-surface text-ink-secondary border-line hover:border-line-strong')

  let content: React.ReactNode
  if (mode === 'togaf') {
    const g = togafComps(comps)
    g.data.forEach(c => known.add(c.name)); g.application.forEach(c => known.add(c.name))
    g.technology.forEach(c => known.add(c.name)); g.cross.forEach(c => known.add(c.name))
    const other = comps.filter(c => !known.has(c.name)).map(c => c.name)
    content = (
      <div className="space-y-3">
        <Band label={labels.bandData} names={g.data.map(c => c.name)} componentSources={componentSources} emptyLabel={labels.emptyBand} />
        <Band label={labels.bandApplication} names={g.application.map(c => c.name)} componentSources={componentSources} emptyLabel={labels.emptyBand} />
        <Band label={labels.bandTechnology} names={g.technology.map(c => c.name)} componentSources={componentSources} emptyLabel={labels.emptyBand} />
        <Band label={labels.bandCross} names={g.cross.map(c => c.name)} componentSources={componentSources} emptyLabel={labels.emptyBand} dashed />
        {other.length > 0 && <Band label={labels.bandOther} names={other} componentSources={componentSources} emptyLabel={labels.emptyBand} dashed />}
      </div>
    )
  } else if (mode === 'datenfluss') {
    const g = dataFlowComps(comps)
    g.sources.forEach(c => known.add(c.name)); g.platform.forEach(c => known.add(c.name))
    g.models.forEach(c => known.add(c.name)); g.consumption.forEach(c => known.add(c.name)); g.cross.forEach(c => known.add(c.name))
    const other = comps.filter(c => !known.has(c.name)).map(c => c.name)
    content = (
      <div className="space-y-3">
        <Band label={labels.flowSources} names={g.sources.map(c => c.name)} componentSources={componentSources} emptyLabel={labels.emptyBand} />
        <Band label={labels.flowPlatform} names={g.platform.map(c => c.name)} componentSources={componentSources} emptyLabel={labels.emptyBand} />
        <Band label={labels.flowModels} names={g.models.map(c => c.name)} componentSources={componentSources} emptyLabel={labels.emptyBand} />
        <Band label={labels.flowConsumption} names={g.consumption.map(c => c.name)} componentSources={componentSources} emptyLabel={labels.emptyBand} />
        <Band label={labels.flowCross} names={g.cross.map(c => c.name)} componentSources={componentSources} emptyLabel={labels.emptyBand} dashed />
        {other.length > 0 && <Band label={labels.bandOther} names={other} componentSources={componentSources} emptyLabel={labels.emptyBand} dashed />}
      </div>
    )
  } else {
    content = (
      <div className="space-y-3">
        {patternLayers.map((layer, i) => (
          <div key={i} className="border border-line-subtle rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-ink-subtle text-sm">{LAYER_ICONS[i]}</span>
              <span className="text-sm font-semibold text-ink">{layer.name}</span>
            </div>
            <p className="text-xs text-ink-muted mb-2">{layer.role}</p>
            <div className="flex flex-wrap gap-1.5">
              {layer.components.map(comp => <Chip key={comp} name={comp} ai={componentSources?.[comp] === 'ai'} />)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={labels.viewLabel}>
        {modes.map(m => (
          <button key={m.id} type="button" onClick={() => setMode(m.id)} aria-pressed={mode === m.id} className={seg(mode === m.id)}>
            {m.label}
          </button>
        ))}
      </div>
      {content}
    </div>
  )
}

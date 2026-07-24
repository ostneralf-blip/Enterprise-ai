'use client'
import { useTranslations } from 'next-intl'
import type { CatalogComponent } from '@/types'
import { dataFlowComps } from '@/lib/architecture/diagram-grouping'
import { cn } from '@/lib/utils'

interface Props {
  activeComponents: CatalogComponent[]
  componentSources?: Record<string, 'rule' | 'ai' | 'manual'>
}

// Eine schlanke Baustein-Kachel (eigenständig, da EamMap.ComponentCard nicht exportiert ist).
function FlowCard({ comp, source }: { comp: CatalogComponent; source?: 'rule' | 'ai' | 'manual' }) {
  return (
    <div className="relative bg-surface border border-line rounded-lg px-2.5 py-1.5 min-w-[120px] max-w-full">
      {source === 'ai' && (
        <span className="absolute top-1 right-1 text-[8px] font-bold text-[color:var(--color-ai)]">KI</span>
      )}
      <p className="text-[12px] font-semibold text-ink truncate">{comp.name}</p>
      {comp.vendor && <p className="text-[9px] text-ink-muted truncate">{comp.vendor}</p>}
    </div>
  )
}

function FlowColumn({ label, comps, componentSources, emptyLabel }: {
  label: string
  comps: CatalogComponent[]
  componentSources?: Record<string, 'rule' | 'ai' | 'manual'>
  emptyLabel: string
}) {
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-2">
      <div className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">{label}</div>
      <div className="flex flex-col gap-1.5">
        {comps.map(c => <FlowCard key={c.id} comp={c} source={componentSources?.[c.name]} />)}
        {comps.length === 0 && (
          <p className="text-[10px] text-ink-subtle italic px-1">{emptyLabel}</p>
        )}
      </div>
    </div>
  )
}

// Pfeil zwischen zwei Stufen — rechts auf Desktop, abwärts auf Mobile.
function FlowArrow() {
  return (
    <div className="flex items-center justify-center shrink-0 text-line-strong self-center" aria-hidden="true">
      <span className="hidden sm:block text-lg leading-none">→</span>
      <span className="sm:hidden text-lg leading-none">↓</span>
    </div>
  )
}

export function DataFlowView({ activeComponents, componentSources }: Props) {
  const t = useTranslations('diagram')
  const flow = dataFlowComps(activeComponents)
  const empty = t('flowEmpty')

  const stages: { key: string; label: string; comps: CatalogComponent[] }[] = [
    { key: 'sources', label: t('flowSources'), comps: flow.sources },
    { key: 'platform', label: t('flowPlatform'), comps: flow.platform },
    { key: 'models', label: t('flowModels'), comps: flow.models },
    { key: 'consumption', label: t('flowConsumption'), comps: flow.consumption },
  ]

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-1 items-stretch">
        {stages.map((s, i) => (
          <div key={s.key} className="flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-1 flex-1 min-w-0">
            <FlowColumn label={s.label} comps={s.comps} componentSources={componentSources} emptyLabel={empty} />
            {i < stages.length - 1 && <FlowArrow />}
          </div>
        ))}
      </div>

      {/* Querschnitt als Fußleiste (dashed, spannt alle Stufen) */}
      <div className={cn('rounded-xl p-3 border-2 border-dashed border-line bg-surface-raised/40')}>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="w-full sm:w-36 shrink-0 text-[10px] font-bold uppercase tracking-widest text-ink-muted">
            {t('flowCross')}
          </div>
          <div className="flex flex-wrap gap-2 flex-1 min-w-0">
            {flow.cross.map(c => <FlowCard key={c.id} comp={c} source={componentSources?.[c.name]} />)}
            {flow.cross.length === 0 && <p className="text-[10px] text-ink-subtle italic">{empty}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

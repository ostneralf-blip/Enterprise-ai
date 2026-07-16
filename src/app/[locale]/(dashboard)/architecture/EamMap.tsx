'use client'
import { useState } from 'react'
import type { CatalogComponent } from '@/types'
import type { ArchitectureResult } from '@/config/architecture-data'
import type { EamValidationResult } from '@/config/architecture-rules'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type MapFilter = 'all' | 'managed' | 'selfhosted'

interface EamMapProps {
  result: ArchitectureResult
  activeComponents: CatalogComponent[]
  componentSources?: Record<string, 'rule' | 'ai' | 'manual'>
  componentOwners?: Record<string, string>
  componentOpsNotes?: Record<string, string>
  eamResults: EamValidationResult[]
  roleNames: string[]
  detailLevel: 1 | 2 | 3
  locale: string
}

function EamBand({
  label,
  children,
  dashed = false,
}: {
  label: string
  children: React.ReactNode
  dashed?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row gap-2 rounded-xl p-3',
        dashed
          ? 'border-2 border-dashed border-slate-300 bg-slate-50/50'
          : 'border border-slate-200 bg-white',
      )}
    >
      <div className="w-full sm:w-36 shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-500 pt-0.5 pb-1 sm:pb-0">
        {label}
      </div>
      <div className="flex flex-wrap gap-2 flex-1 min-w-0">{children}</div>
    </div>
  )
}

function ComponentCard({
  comp,
  source,
  detailLevel,
  owner,
  opsNote,
}: {
  comp: CatalogComponent
  source?: 'rule' | 'ai' | 'manual'
  detailLevel: number
  owner?: string
  opsNote?: string
}) {
  return (
    <div className="relative bg-white border border-slate-200 rounded-lg px-3 py-2 min-w-[120px] max-w-[200px]">
      {source === 'ai' && (
        <span className="absolute top-1 right-1 text-[8px] font-bold text-[color:var(--color-ai)]">
          ◆
        </span>
      )}
      <p className="text-xs font-semibold text-slate-800 pr-3 leading-tight">{comp.name}</p>
      {comp.vendor && (
        <p className="text-[10px] text-slate-400 mt-0.5">{comp.vendor}</p>
      )}
      <div className="flex flex-wrap gap-1 mt-1">
        {comp.cloud_provider === 'sap' && (
          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-primary-soft text-primary">
            SAP
          </span>
        )}
        {comp.hosting.includes('cloud') && (
          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-sky-50 text-sky-700">
            Managed
          </span>
        )}
        {comp.hosting.some((h) => h.toLowerCase().includes('eu')) && (
          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-emerald-50 text-emerald-700">
            EU
          </span>
        )}
      </div>
      {detailLevel >= 3 && (
        <div className="mt-1.5 space-y-0.5">
          {owner && (
            <p className="text-[9px] text-slate-600 font-medium">👤 {owner}</p>
          )}
          {opsNote && (
            <p className="text-[9px] text-slate-400 italic line-clamp-2">{opsNote}</p>
          )}
          {!owner && !opsNote && comp.description && (
            <p className="text-[9px] text-slate-400 italic line-clamp-2">{comp.description}</p>
          )}
        </div>
      )}
    </div>
  )
}

function RoleChip({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
  return (
    <div className="flex items-center gap-1.5 bg-slate-100 rounded-full px-2 py-1">
      <span className="w-5 h-5 rounded-full bg-primary-soft text-primary text-[9px] font-bold flex items-center justify-center shrink-0">
        {initials}
      </span>
      <span className="text-[10px] text-slate-700 whitespace-nowrap">{name}</span>
    </div>
  )
}

function EmptyBandHint() {
  return <span className="text-[10px] text-slate-400 italic">—</span>
}

export function EamMap({
  result: _result,
  activeComponents,
  componentSources,
  componentOwners,
  componentOpsNotes,
  eamResults,
  roleNames,
  detailLevel,
  locale,
}: EamMapProps) {
  const t = useTranslations('modules.architecture')
  const [mapFilter, setMapFilter] = useState<MapFilter>('all')

  const filterComp = (c: CatalogComponent) => {
    if (mapFilter === 'managed') return c.hosting.includes('cloud')
    if (mapFilter === 'selfhosted') return c.hosting.includes('onprem')
    return true
  }

  const appComps = activeComponents.filter((c) => c.architecture_layer === 'application').filter(filterComp)
  const dataComps = activeComponents.filter((c) =>
    ['data', 'model', 'serving', 'mlops'].includes(c.architecture_layer ?? ''),
  ).filter(filterComp)
  const crossComps = activeComponents.filter((c) =>
    ['governance', 'security'].includes(c.architecture_layer ?? ''),
  ).filter(filterComp)

  const FILTERS: { id: MapFilter; label: string }[] = [
    { id: 'all', label: t('mapFilterAll') },
    { id: 'managed', label: t('mapFilterManaged') },
    { id: 'selfhosted', label: t('mapFilterSelfHosted') },
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
        <h3 className="text-sm font-semibold text-slate-700">{t('eamLandkarte')}</h3>
        <div className="flex items-center gap-1" role="group" aria-label={t('mapFilterAll')}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => {
                setMapFilter(f.id)
                ;(window as Window & { posthog?: { capture: (e: string, p?: object) => void } })
                  .posthog?.capture('map_filter', { value: f.id })
              }}
              className={cn(
                'text-[10px] px-2.5 py-0.5 rounded-full border font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-primary-ring whitespace-nowrap',
                mapFilter === f.id
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-500 border-slate-300 hover:border-slate-400 hover:text-slate-700'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Band 1: Motivation & Vorgaben */}
      <EamBand label={t('eamMotivation')} dashed>
        {eamResults.map((r) => (
          <span
            key={r.ruleId}
            className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-medium',
              r.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
            )}
          >
            {r.passed ? '✓' : '✗'} {r.message[locale as 'de' | 'en'] ?? r.message.de}
          </span>
        ))}
        {eamResults.length === 0 && <EmptyBandHint />}
      </EamBand>

      {/* Band 2: Business */}
      <EamBand label={t('eamBusiness')}>
        {roleNames.map((role) => (
          <RoleChip key={role} name={role} />
        ))}
        {roleNames.length === 0 && <EmptyBandHint />}
      </EamBand>

      {/* Band 3: Applikation */}
      <EamBand label={t('eamApplication')}>
        {appComps.map((c) => (
          <ComponentCard
            key={c.id}
            comp={c}
            source={componentSources?.[c.name]}
            detailLevel={detailLevel}
            owner={componentOwners?.[c.name]}
            opsNote={componentOpsNotes?.[c.name]}
          />
        ))}
        {appComps.length === 0 && <EmptyBandHint />}
      </EamBand>

      {/* Band 4: Daten & Technologie */}
      <EamBand label={t('eamData')}>
        {dataComps.map((c) => (
          <ComponentCard
            key={c.id}
            comp={c}
            source={componentSources?.[c.name]}
            detailLevel={detailLevel}
            owner={componentOwners?.[c.name]}
            opsNote={componentOpsNotes?.[c.name]}
          />
        ))}
        {dataComps.length === 0 && <EmptyBandHint />}
      </EamBand>

      {/* Band 5: Querschnitt */}
      <EamBand label={t('eamCross')}>
        {crossComps.map((c) => (
          <ComponentCard
            key={c.id}
            comp={c}
            source={componentSources?.[c.name]}
            detailLevel={detailLevel}
            owner={componentOwners?.[c.name]}
            opsNote={componentOpsNotes?.[c.name]}
          />
        ))}
        {crossComps.length === 0 && <EmptyBandHint />}
      </EamBand>
    </div>
  )
}

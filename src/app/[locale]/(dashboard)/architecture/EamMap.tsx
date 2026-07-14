'use client'
import type { CatalogComponent } from '@/types'
import type { ArchitectureResult } from '@/config/architecture-data'
import type { EamValidationResult } from '@/config/architecture-rules'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface EamMapProps {
  result: ArchitectureResult
  activeComponents: CatalogComponent[]
  componentSources?: Record<string, 'rule' | 'ai' | 'manual'>
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
}: {
  comp: CatalogComponent
  source?: 'rule' | 'ai' | 'manual'
  detailLevel: number
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
        {comp.hosting.some((h) => h.toLowerCase().includes('eu')) && (
          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-emerald-50 text-emerald-700">
            EU
          </span>
        )}
      </div>
      {detailLevel >= 3 && comp.description && (
        <p className="text-[9px] text-slate-400 mt-1 italic line-clamp-2">
          {comp.description}
        </p>
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
  eamResults,
  roleNames,
  detailLevel,
  locale,
}: EamMapProps) {
  const t = useTranslations('modules.architecture')

  const appComps = activeComponents.filter((c) => c.architecture_layer === 'application')
  const dataComps = activeComponents.filter((c) =>
    ['data', 'model', 'serving', 'mlops'].includes(c.architecture_layer ?? ''),
  )
  const crossComps = activeComponents.filter((c) =>
    ['governance', 'security'].includes(c.architecture_layer ?? ''),
  )

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-700 mb-2">{t('eamLandkarte')}</h3>

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
          />
        ))}
        {crossComps.length === 0 && <EmptyBandHint />}
      </EamBand>
    </div>
  )
}

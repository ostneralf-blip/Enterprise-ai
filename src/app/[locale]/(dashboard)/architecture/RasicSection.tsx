'use client'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { pick } from '@/lib/utils/locale-data'
import type { RasicMatrix, RasicPhase, RasicValue, CatalogComponent } from '@/types'
import type { EamValidationResult } from '@/config/architecture-rules'

export interface ValidationOverride {
  reason: string
  accepted_at: string
}

// ─── AI PANEL ────────────────────────────────────────────────────────────────
interface AIPanelCardProps {
  narrative: { component_suggestions?: string[] } | null
  usage: { remaining: number; used: number; limit: number; exceeded: boolean } | null
  aiModel: string | null
  catalogComponents: CatalogComponent[]
  rejectedSuggestions: string[]
  onAccept: (name: string) => void
  onReject: (name: string) => void
}

export function AIPanelCard({ narrative, usage, aiModel, catalogComponents, rejectedSuggestions, onAccept, onReject }: AIPanelCardProps) {
  const t = useTranslations('modules')
  const byName = new Map(catalogComponents.map(c => [c.name, c]))
  const rejected = new Set(rejectedSuggestions)

  const rawSuggestions = narrative?.component_suggestions ?? []
  const suggestions = rawSuggestions.filter(name => byName.has(name) && !rejected.has(name))

  return (
    <div className="bg-[color:var(--color-ai-soft)] border border-purple-200 rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[color:var(--color-ai)] text-base" aria-hidden="true">◆</span>
        <h3 className="text-sm font-semibold text-slate-900">{t('architecture.aiPanelTitle')}</h3>
      </div>

      {/* Usage Meter */}
      {usage && (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{t('architecture.aiPanelUsage')}</span>
            <span className={usage.exceeded ? 'text-red-600 font-semibold' : ''}>
              {usage.exceeded ? t('architecture.aiPanelLimitReached') : `${usage.used} / ${usage.limit}`}
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', usage.exceeded ? 'bg-red-400' : 'bg-[color:var(--color-ai)]')}
              style={{ width: `${Math.min(100, Math.round((usage.used / usage.limit) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Provenance */}
      {aiModel && (
        <p className="text-[10px] text-slate-400">
          {t('architecture.aiPanelProvenance')}: <span className="font-mono">{aiModel}</span>
        </p>
      )}

      {/* Component Suggestions */}
      <div>
        <p className="text-xs font-semibold text-slate-700 mb-1">{t('architecture.aiPanelSuggestionsTitle')}</p>
        <p className="text-[10px] text-slate-400 mb-2">{t('architecture.aiPanelSuggestionsHint')}</p>
        {suggestions.length === 0 ? (
          <p className="text-xs text-slate-400 italic">{t('architecture.aiPanelNoSuggestions')}</p>
        ) : (
          <ul className="space-y-1.5">
            {suggestions.map(name => {
              const comp = byName.get(name)
              return (
                <li key={name} className="flex items-center gap-2 bg-white border border-purple-100 rounded-xl px-3 py-2">
                  <span className="text-[color:var(--color-ai)] text-[10px]" aria-hidden="true">◆</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate">{name}</p>
                    {comp?.category && <p className="text-[10px] text-slate-400">{comp.category}</p>}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => { onAccept(name); (window as Window & { posthog?: { capture: (e: string, p?: object) => void } }).posthog?.capture('ai_suggestion_accepted', { component: name }) }}
                      className="px-2 py-1 text-[10px] font-semibold bg-[color:var(--color-ai)] text-white rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      {t('architecture.aiPanelAccept')}
                    </button>
                    <button
                      onClick={() => { onReject(name); (window as Window & { posthog?: { capture: (e: string, p?: object) => void } }).posthog?.capture('ai_suggestion_rejected', { component: name }) }}
                      className="px-2 py-1 text-[10px] font-semibold border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      {t('architecture.aiPanelReject')}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

const RASIC_CYCLE: RasicValue[] = ['R', 'A', 'S', 'I', 'C', '']

const RASIC_CELL_STYLE: Record<string, string> = {
  R: 'bg-primary-soft text-primary-hover border-primary-border font-bold',
  A: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
  S: 'bg-slate-100 text-slate-700 border-slate-300 font-semibold',
  I: 'bg-violet-50 text-violet-700 border-violet-200 font-semibold',
  C: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
  '': 'bg-white text-slate-300 border-slate-100',
}

const RASIC_TOOLTIP: Record<string, { de: string; en: string }> = {
  R: { de: 'Responsible — führt die Aufgabe aus', en: 'Responsible — executes the task' },
  A: { de: 'Accountable — trägt die Verantwortung', en: 'Accountable — owns the outcome' },
  S: { de: 'Supportive — unterstützt aktiv', en: 'Supportive — actively supports' },
  I: { de: 'Informed — wird informiert', en: 'Informed — kept in the loop' },
  C: { de: 'Consulted — wird einbezogen', en: 'Consulted — provides input' },
}

interface RasicMatrixCardProps {
  rasic: RasicMatrix
  readOnly?: boolean
  onUpdate: (rasic: RasicMatrix) => void
}

export function RasicMatrixCard({ rasic, readOnly = false, onUpdate }: RasicMatrixCardProps) {
  const t = useTranslations('modules')
  const locale = useLocale()

  const phaseLabel: Record<RasicPhase, string> = {
    konzeption: t('architecture.rasicPhaseKonzeption'),
    daten:      t('architecture.rasicPhaseDaten'),
    build:      t('architecture.rasicPhaseBuild'),
    freigabe:   t('architecture.rasicPhaseFreigabe'),
    betrieb:    t('architecture.rasicPhaseBetrieb'),
  }

  const cycleValue = (role: string, phase: RasicPhase) => {
    if (readOnly) return
    const entry = rasic.entries.find(e => e.role === role)
    const current = entry?.assignments[phase] ?? ''
    const idx = RASIC_CYCLE.indexOf(current as RasicValue)
    const next = RASIC_CYCLE[(idx + 1) % RASIC_CYCLE.length]
    const newEntries = rasic.entries.map(e =>
      e.role === role ? { ...e, assignments: { ...e.assignments, [phase]: next } } : e
    )
    onUpdate({ ...rasic, entries: newEntries })
  }

  return (
    <div id="rasic-matrix" className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{t('architecture.rasicTitle')}</h3>
        {!readOnly && <p className="text-xs text-slate-400 mt-0.5">{t('architecture.rasicHint')}</p>}
      </div>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs border-collapse min-w-[480px]">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 text-slate-500 font-medium w-40">Rolle</th>
              {(rasic.phases as RasicPhase[]).map(phase => (
                <th key={phase} className="text-center py-2 px-2 text-slate-500 font-medium whitespace-nowrap">
                  {phaseLabel[phase]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rasic.entries.map(entry => (
              <tr key={entry.role} className="hover:bg-slate-50 transition-colors">
                <td className="py-2 px-3 font-medium text-slate-700 truncate max-w-[160px]" title={entry.role}>
                  {entry.role}
                </td>
                {(rasic.phases as RasicPhase[]).map(phase => {
                  const val = (entry.assignments[phase] ?? '') as RasicValue
                  const tooltip = val ? pick(RASIC_TOOLTIP[val], locale) : ''
                  return (
                    <td key={phase} className="py-1.5 px-2 text-center">
                      <button
                        onClick={() => cycleValue(entry.role, phase)}
                        disabled={readOnly}
                        title={tooltip}
                        aria-label={`${entry.role} ${phaseLabel[phase]}: ${val || '—'}`}
                        className={cn(
                          'w-8 h-8 rounded-lg border text-[11px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-1',
                          RASIC_CELL_STYLE[val] ?? RASIC_CELL_STYLE[''],
                          !readOnly && 'hover:brightness-95 cursor-pointer',
                          readOnly && 'cursor-default'
                        )}
                      >
                        {val || '·'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface EamValidationBannerProps {
  results: EamValidationResult[]
  overrides?: Record<string, ValidationOverride>
  onOverride?: (ruleId: string, override: ValidationOverride | null) => void
}

export function EamValidationBanner({ results, overrides = {}, onOverride }: EamValidationBannerProps) {
  const t = useTranslations('modules')
  const locale = useLocale()
  const [dialogOpen, setDialogOpen] = useState<string | null>(null)
  const [reasonInput, setReasonInput] = useState('')

  const openViolations = results.filter(r => !r.passed && !overrides[r.ruleId])
  const acceptedCount = results.filter(r => !r.passed && overrides[r.ruleId]).length
  const allPassed = openViolations.length === 0

  const statusColor = openViolations.length > 0
    ? 'border-l-red-500'
    : acceptedCount > 0
      ? 'border-l-amber-500'
      : 'border-l-emerald-500'

  const headerIcon = openViolations.length > 0 ? '✕' : acceptedCount > 0 ? '⚠' : '✓'
  const headerColorClass = openViolations.length > 0
    ? 'text-red-700'
    : acceptedCount > 0
      ? 'text-amber-700'
      : 'text-emerald-700'

  const headerStatus = openViolations.length > 0
    ? t('architecture.eamStatusInvalid', { count: openViolations.length })
    : acceptedCount > 0
      ? t('architecture.eamStatusOverrides', { count: acceptedCount })
      : t('architecture.eamBannerAllPassed')

  const handleConfirm = (ruleId: string) => {
    if (!reasonInput.trim()) return
    onOverride?.(ruleId, { reason: reasonInput.trim(), accepted_at: new Date().toISOString() })
    setDialogOpen(null)
    setReasonInput('')
  }

  return (
    <div className={cn('bg-white border border-slate-200 border-l-[3px] rounded-2xl p-4 sm:p-5 space-y-3', statusColor)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className={cn('text-base shrink-0', headerColorClass)} aria-hidden="true">{headerIcon}</span>
        <h3 className={cn('text-sm font-semibold', headerColorClass)}>
          {t('architecture.eamBannerTitle')}
          {' — '}
          {headerStatus}
        </h3>
      </div>

      {/* Regel-Liste */}
      <ul className="space-y-2">
        {results.map(r => {
          const override = overrides[r.ruleId]
          const isOpen = dialogOpen === r.ruleId

          if (r.passed) {
            return (
              <li key={r.ruleId} className="flex items-center gap-2 text-xs text-emerald-700">
                <span className="shrink-0 w-4 text-center" aria-hidden="true">✓</span>
                <span className="min-w-0">{pick(r.message, locale)}</span>
              </li>
            )
          }

          if (override) {
            return (
              <li key={r.ruleId} className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-amber-700">
                  <span className="shrink-0 w-4 text-center" aria-hidden="true">⚠</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{t('architecture.eamAcceptedLabel')}</span>
                    {' — '}
                    {pick(r.message, locale)}
                  </span>
                  {onOverride && (
                    <button
                      type="button"
                      onClick={() => onOverride(r.ruleId, null)}
                      className="shrink-0 text-[10px] font-medium text-amber-600 hover:text-amber-800 underline focus:outline-none focus:ring-1 focus:ring-amber-500 rounded"
                    >
                      {t('architecture.eamRevokeButton')}
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 pl-6 italic">{override.reason}</p>
              </li>
            )
          }

          return (
            <li key={r.ruleId} className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-red-700">
                <span className="shrink-0 w-4 text-center" aria-hidden="true">✕</span>
                <span className="min-w-0 flex-1">{pick(r.message, locale)}</span>
                <div className="flex gap-1.5 shrink-0">
                  {onOverride && !isOpen && (
                    <button
                      type="button"
                      onClick={() => { setDialogOpen(r.ruleId); setReasonInput('') }}
                      className="text-[10px] font-semibold px-2 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                    >
                      {t('architecture.eamAcceptButton')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => document.getElementById(r.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="text-[10px] font-semibold px-2 py-1 bg-primary text-white rounded-lg hover:bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring"
                  >
                    {t('architecture.eamFixButton')}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="ml-6 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <p className="text-[10px] font-semibold text-slate-700">{t('architecture.eamWaiverTitle')}</p>
                  <textarea
                    value={reasonInput}
                    onChange={e => setReasonInput(e.target.value.slice(0, 200))}
                    placeholder={t('architecture.eamWaiverPlaceholder')}
                    rows={2}
                    className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary-ring"
                  />
                  <p className="text-[10px] text-slate-400 text-right">{reasonInput.length}/200</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleConfirm(r.ruleId)}
                      disabled={!reasonInput.trim()}
                      className="px-3 py-1.5 text-[10px] font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      {t('architecture.eamWaiverConfirm')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDialogOpen(null); setReasonInput('') }}
                      className="px-3 py-1.5 text-[10px] font-semibold border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      {t('architecture.eamWaiverCancel')}
                    </button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

interface ComplianceControlTableProps {
  activeComponents: CatalogComponent[]
  rasic: RasicMatrix | undefined
}

export function ComplianceControlTable({ activeComponents, rasic }: ComplianceControlTableProps) {
  const t = useTranslations('modules')
  const riskComps = activeComponents.filter(c =>
    c.eu_ai_act_risk === 'high' || c.eu_ai_act_risk === 'limited' || c.dsgvo_status === 'conditional'
  )
  if (riskComps.length === 0) return null

  const getOwner = (phase: RasicPhase) => {
    if (!rasic) return '—'
    return rasic.entries.find(e => e.assignments[phase] === 'A' || e.assignments[phase] === 'R')?.role ?? '—'
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">{t('architecture.complianceControlTitle')}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 pr-4 text-slate-500 font-medium">{t('architecture.complianceControlComponent')}</th>
              <th className="text-left py-2 pr-4 text-slate-500 font-medium">{t('architecture.complianceControlRequirement')}</th>
              <th className="text-left py-2 text-slate-500 font-medium">{t('architecture.complianceControlOwner')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {riskComps.map(c => {
              const req = c.dsgvo_status === 'conditional'
                ? 'DSGVO AVV erforderlich'
                : c.eu_ai_act_risk === 'high'
                  ? 'EU AI Act — Hochrisiko: Dok. + Risk Assessment'
                  : 'EU AI Act — Eingeschränkt: Transparenzpflicht'
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-2 pr-4 font-medium text-slate-800">{c.name}</td>
                  <td className="py-2 pr-4 text-slate-600">{req}</td>
                  <td className="py-2 text-slate-600">{getOwner('daten')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

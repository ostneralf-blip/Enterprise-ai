'use client'
import { useTranslations, useLocale } from 'next-intl'
import { pick } from '@/lib/utils/locale-data'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  useSortable,
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Tier } from '@/types'
import {
  GOVERNANCE_GATES,
  calculateVerdict,
  getGateReviews,
  type GateAnswers,
  type VerdictLevel,
} from '@/config/governance-data'
import { GovernanceHistory, type GovernanceSession } from '@/components/modules/governance/GovernanceHistory'
import { InfoHint } from '@/components/shared/InfoHint'
import { CardTitle, SectionTitle } from '@/components/shared/typography'
import { ComplianceContextBanner } from '@/components/shared/ComplianceContextBanner'
import { VersionsPanel } from '@/components/shared/VersionsPanel'
import { ShareButton } from '@/components/shared/ShareButton'

const VERDICT_TO_API: Record<VerdictLevel, string> = {
  unlawful: 'stop_dsgvo',
  stop: 'stop_risk',
  conditional: 'improve',
  approved: 'approve',
}

const VERDICT_STYLES: Record<VerdictLevel, { bg: string; border: string; title: string; badge: string }> = {
  unlawful: {
    bg: 'bg-error-subtle',
    border: 'border-error-border',
    title: 'text-error-text',
    badge: 'bg-error-subtle text-error-text',
  },
  stop: {
    bg: 'bg-error-subtle',
    border: 'border-error-border',
    title: 'text-error-text',
    badge: 'bg-error-subtle text-error-text',
  },
  conditional: {
    bg: 'bg-warning-subtle',
    border: 'border-warning-border',
    title: 'text-warning-text',
    badge: 'bg-warning-subtle text-warning-text',
  },
  approved: {
    bg: 'bg-success-subtle',
    border: 'border-success-border',
    title: 'text-success-text',
    badge: 'bg-success-subtle text-success-text',
  },
}

const WEIGHT_DOT: Record<string, string> = {
  red: 'bg-error-text',
  yellow: 'bg-warning-text',
  green: 'bg-success-text',
}

const DEFAULT_GOV_SECTIONS = ['verdict', 'actions', 'gates'] as const
type GovSectionId = typeof DEFAULT_GOV_SECTIONS[number]
const GOV_SECTION_ORDER_KEY = 'governance_result_section_order_v1'

function SortableSection({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('relative', isDragging && 'z-10 opacity-75')}
    >
      <div
        {...attributes}
        {...listeners}
        className="hidden md:flex absolute -left-5 top-3 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 select-none focus:outline-none"
        aria-label="Abschnitt verschieben"
        role="button"
        tabIndex={0}
      >
        ⠿
      </div>
      {children}
    </div>
  )
}

export function GovernancePageClient({
  tier, sessions, useCases = [], initialUseCaseName, initialUseCaseId, complianceRisk,
}: {
  tier: Tier
  sessions: GovernanceSession[]
  useCases?: { id: string; name: string }[]
  initialUseCaseName?: string
  initialUseCaseId?: string
  complianceRisk?: string | null
}) {
  const t = useTranslations('modules')
  const locale = useLocale()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<GateAnswers>({})
  const [useCaseIds, setUseCaseIds] = useState<string[]>(initialUseCaseId ? [initialUseCaseId] : [])
  const [extraName, setExtraName] = useState(initialUseCaseId ? '' : (initialUseCaseName ?? ''))
  const [showExtraInput, setShowExtraInput] = useState(!initialUseCaseId && !!initialUseCaseName)
  const [showResult, setShowResult] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)

  const [sectionOrder, setSectionOrder] = useState<GovSectionId[]>(() => {
    if (typeof window === 'undefined') return [...DEFAULT_GOV_SECTIONS]
    try {
      const stored = localStorage.getItem(GOV_SECTION_ORDER_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as string[]
        const valid = parsed.filter((id): id is GovSectionId => (DEFAULT_GOV_SECTIONS as readonly string[]).includes(id))
        if (valid.length === DEFAULT_GOV_SECTIONS.length) return valid
      }
    } catch {}
    return [...DEFAULT_GOV_SECTIONS]
  })

  const dndSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const toggleUseCase = (id: string) => {
    setUseCaseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectedNames = useCaseIds.map(id => useCases.find(uc => uc.id === id)?.name ?? id)
  const displayName = [
    ...selectedNames,
    ...(extraName.trim() ? [extraName.trim()] : []),
  ].join(', ')

  const totalSteps = GOVERNANCE_GATES.length
  const gate = GOVERNANCE_GATES[currentStep]
  const selectedOptionId = answers[gate?.id ?? '']
  const isLastStep = currentStep === totalSteps - 1
  const progress = Math.round(((currentStep) / totalSteps) * 100)

  const handleSelect = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [gate.id]: optionId }))
  }

  const handleNext = () => {
    if (isLastStep) {
      setShowResult(true)
    } else {
      setCurrentStep(s => s + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1)
  }

  const handleReset = () => {
    setAnswers({})
    setCurrentStep(0)
    setShowResult(false)
    setSaved(false)
    setSavedId(null)
    setUseCaseIds([])
    setExtraName('')
    setShowExtraInput(false)
  }

  const handleSave = async (verdictLevel: VerdictLevel) => {
    setSaving(true)
    try {
      const res = await fetch('/api/governance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          use_case_name: displayName || null,
          use_case_id: useCaseIds[0] ?? null,
          use_case_ids: useCaseIds,
          answers,
          result: VERDICT_TO_API[verdictLevel],
        }),
      })
      if (res.ok) {
        const { data } = await res.json() as { data: { id: string } | null }
        if (data?.id) setSavedId(data.id)
        setSaved(true)
      }
    } finally {
      setSaving(false)
    }
  }

  if (showResult) {
    const verdict = calculateVerdict(answers)
    const reviews = getGateReviews(answers)
    const styles = VERDICT_STYLES[verdict.level]
    const actionItems = reviews.filter(r => r.option.weight !== 'green' && r.option.recommendation)

    const visibleSections = sectionOrder.filter(s => s !== 'actions' || actionItems.length > 0)

    const sectionContent: Record<GovSectionId, React.ReactNode> = {
      verdict: (
        <div className={cn('rounded-2xl border p-5 sm:p-6', styles.bg, styles.border)}>
          <div className="flex items-start gap-3">
            <span className="text-2xl" aria-hidden="true">{verdict.icon}</span>
            <div className="min-w-0">
              <h2 className={cn('text-base sm:text-lg font-semibold', styles.title)}>{pick(verdict.title, locale)}</h2>
              <p className="text-sm text-slate-600 mt-1">{pick(verdict.summary, locale)}</p>
            </div>
          </div>
        </div>
      ),
      actions: actionItems.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <CardTitle>{t('governance.actionFieldsTitle')}</CardTitle>
            <InfoHint title={t('governance.actionFieldsHintTitle')}>
              <p>{t('governance.actionFieldsHintP1')}</p>
              <p className="mt-1.5"><span className="inline-block w-2 h-2 rounded-full bg-warning-text mr-1" />{t('governance.actionFieldsHintYellow')}</p>
              <p className="mt-1"><span className="inline-block w-2 h-2 rounded-full bg-error-text mr-1" />{t('governance.actionFieldsHintRed')}</p>
              <p className="mt-1.5">{t('governance.actionFieldsHintFootnote')}</p>
            </InfoHint>
          </div>
          <ul className="space-y-4" role="list">
            {actionItems.map(({ gate: g, option }) => (
              <li key={g.id} className="flex gap-3">
                <span className={cn('mt-1.5 flex-shrink-0 w-2 h-2 rounded-full', WEIGHT_DOT[option.weight])} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{pick(g.question, locale).split('?')[0]}</p>
                  <p className="text-sm text-slate-700 mt-0.5">{option.recommendation ? pick(option.recommendation, locale) : null}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null,
      gates: (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">{t('governance.summaryTitle')}</h3>
          <ul className="space-y-3" role="list">
            {reviews.map(({ gate: g, option }) => (
              <li key={g.id} className="flex items-start gap-3">
                <span
                  className={cn('mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full', WEIGHT_DOT[option.weight])}
                  aria-label={option.weight === 'green' ? 'OK' : option.weight === 'yellow' ? t('governance.weightHint') : t('governance.weightCritical')}
                />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Gate {g.step}</p>
                  <p className="text-sm text-slate-800 min-w-0">{pick(option.label, locale)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ),
    }

    return (
      <div className="max-w-2xl space-y-5">
        <DndContext
          sensors={dndSensors}
          onDragEnd={(event: DragEndEvent) => {
            const { active, over } = event
            if (over && active.id !== over.id) {
              setSectionOrder(prev => {
                const oldIndex = prev.indexOf(active.id as GovSectionId)
                const newIndex = prev.indexOf(over.id as GovSectionId)
                const next = arrayMove(prev, oldIndex, newIndex)
                try { localStorage.setItem(GOV_SECTION_ORDER_KEY, JSON.stringify(next)) } catch {}
                return next
              })
            }
          }}
        >
          <SortableContext items={visibleSections} strategy={verticalListSortingStrategy}>
            <div className="space-y-5">
              {visibleSections.map(id => (
                <SortableSection key={id} id={id}>
                  {sectionContent[id]}
                </SortableSection>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleReset}
            className="px-5 py-2 text-sm font-medium border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
          >
            {t('governance.restart')}
          </button>
          {!saved && (
            <button
              onClick={() => handleSave(verdict.level)}
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary transition-colors whitespace-nowrap disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
            >
              {saving ? t('governance.saving') : t('governance.save')}
            </button>
          )}
          {saved && (
            <span className="text-sm text-green-700 font-medium">{t('governance.saved')}</span>
          )}
          <a
            href={tier !== 'free' ? `/api/export/pdf?module=governance&locale=${locale}` : '/upgrade'}
            {...(tier !== 'free' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="px-5 py-2 text-sm font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2 inline-flex items-center gap-1.5"
          >
            {t('governance.exportPdf')}{tier === 'free' && <span className="text-xs opacity-60">· Pro</span>}
          </a>
          {savedId && (
            <>
              <VersionsPanel module="governance" entityId={savedId} tier={tier} currentData={{ result: VERDICT_TO_API[verdict.level], answers: answers as Record<string, unknown> }} />
              <ShareButton module="governance" entityId={savedId} tier={tier} />
            </>
          )}
        </div>

        <GovernanceHistory sessions={sessions} />

      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <ComplianceContextBanner riskClass={complianceRisk} />

      {/* Use-Case-Auswahl */}
      <div className="mb-5">
        <p className="text-xs font-medium text-slate-600 mb-1.5">
          Use Cases <span className="text-slate-400 font-normal">{t('governance.useCasesOptional')}</span>
        </p>
        {useCases.length > 0 ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <ul role="list">
              {useCases.map((uc, idx) => {
                const checked = useCaseIds.includes(uc.id)
                return (
                  <li
                    key={uc.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none transition-colors',
                      idx > 0 && 'border-t border-slate-100',
                      checked ? 'bg-primary-soft' : 'hover:bg-slate-50'
                    )}
                    onClick={() => toggleUseCase(uc.id)}
                  >
                    <input
                      type="checkbox"
                      id={`uc-${uc.id}`}
                      checked={checked}
                      onChange={() => toggleUseCase(uc.id)}
                      onClick={e => e.stopPropagation()}
                      className="accent-blue-600 flex-shrink-0"
                    />
                    <label
                      htmlFor={`uc-${uc.id}`}
                      className={cn('text-sm min-w-0 truncate cursor-pointer', checked ? 'text-primary font-medium' : 'text-slate-800')}
                      onClick={e => e.preventDefault()}
                    >
                      {uc.name}
                    </label>
                  </li>
                )
              })}
              <li className={cn('border-t border-slate-100', showExtraInput ? 'bg-primary-soft' : 'hover:bg-slate-50')}>
                {showExtraInput ? (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <input
                      type="text"
                      id="governance-usecase-extra"
                      value={extraName}
                      onChange={e => setExtraName(e.target.value)}
                      placeholder={t('governance.useCaseNamePlaceholder')}
                      maxLength={200}
                      autoFocus
                      className="flex-1 min-w-0 text-sm text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => { setShowExtraInput(false); setExtraName('') }}
                      className="text-xs text-slate-400 hover:text-slate-600 flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowExtraInput(true)}
                    className="w-full text-left px-3 py-2.5 text-sm text-primary hover:text-primary"
                  >
                    {t('governance.addOtherName')}
                  </button>
                )}
              </li>
            </ul>
          </div>
        ) : (
          <input
            id="governance-usecase-name"
            type="text"
            value={extraName}
            onChange={e => setExtraName(e.target.value)}
            placeholder={t('governance.useCaseSearchPlaceholder')}
            maxLength={200}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary-ring"
          />
        )}
      </div>

      {/* Progress */}
      <div className="mb-6" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={t('governance.gateProgressAria', { current: currentStep + 1, total: totalSteps })}>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>{t('governance.gateProgress', { current: currentStep + 1, total: totalSteps })}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Gate card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-4">
        <p className="text-xs font-medium text-primary uppercase tracking-wide mb-2">Gate {gate.step}</p>
        <SectionTitle className="mb-2">{pick(gate.question, locale)}</SectionTitle>
        <p className="text-sm text-slate-500 mb-5">{pick(gate.context, locale)}</p>

        <fieldset>
          <legend className="sr-only">{pick(gate.question, locale)}</legend>
          <div className="space-y-2.5" role="radiogroup">
            {gate.options.map(option => {
              const isSelected = selectedOptionId === option.id
              return (
                <label
                  key={option.id}
                  className={cn(
                    'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors select-none',
                    isSelected
                      ? 'border-primary-ring bg-primary-soft'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <input
                    type="radio"
                    name={gate.id}
                    value={option.id}
                    checked={isSelected}
                    onChange={() => handleSelect(option.id)}
                    className="mt-0.5 accent-blue-600 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className={cn('text-sm font-medium', isSelected ? 'text-primary' : 'text-slate-900')}>
                      {pick(option.label, locale)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{pick(option.description, locale)}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </fieldset>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
        >
          {t('governance.back')}
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedOptionId}
          className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
        >
          {isLastStep ? t('governance.showResult') : t('governance.next')}
        </button>
      </div>

      <GovernanceHistory sessions={sessions} />
    </div>
  )
}

'use client'
import { useTranslations, useLocale } from 'next-intl'
import { pick } from '@/lib/utils/locale-data'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Tier } from '@/types'
import {
  GOVERNANCE_GATES,
  calculateVerdict,
  getGateReviews,
  type GateAnswers,
  type VerdictLevel,
} from '@/config/governance-data'
import { GovernanceHistory, type GovernanceSession } from '@/components/modules/governance/GovernanceHistory'
import { InfoHint, HintBox } from '@/components/shared/InfoHint'
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
    bg: 'bg-red-50',
    border: 'border-red-200',
    title: 'text-red-800',
    badge: 'bg-red-100 text-red-700',
  },
  stop: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    title: 'text-red-800',
    badge: 'bg-red-100 text-red-700',
  },
  conditional: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    title: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
  },
  approved: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    title: 'text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700',
  },
}

const WEIGHT_DOT: Record<string, string> = {
  red: 'bg-red-500',
  yellow: 'bg-amber-400',
  green: 'bg-emerald-500',
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

    return (
      <div className="max-w-2xl space-y-5">
        {/* Verdict card */}
        <div className={cn('rounded-2xl border p-5 sm:p-6', styles.bg, styles.border)}>
          <div className="flex items-start gap-3">
            <span className="text-2xl" aria-hidden="true">{verdict.icon}</span>
            <div className="min-w-0">
              <h2 className={cn('text-base sm:text-lg font-semibold', styles.title)}>{pick(verdict.title, locale)}</h2>
              <p className="text-sm text-slate-600 mt-1">{pick(verdict.summary, locale)}</p>
            </div>
          </div>
        </div>

        {/* Action items */}
        {actionItems.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Handlungsfelder</h3>
              <InfoHint title="Was bedeuten die Handlungsfelder?">
                <p>Diese Punkte stammen aus Gates, die Sie nicht mit &bdquo;OK&ldquo; bewertet haben.</p>
                <p className="mt-1.5"><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" />Gelb: Verbesserungsbedarf, aber kein sofortiger Stopp.</p>
                <p className="mt-1"><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />Rot: Kritische Lücke, die vor Go-Live geschlossen werden muss.</p>
                <p className="mt-1.5">Die Empfehlungen sind Ausgangspunkte — die finale Bewertung obliegt Ihrem Team und ggf. einem Rechtsbeistand.</p>
              </InfoHint>
            </div>
            <ul className="space-y-4" role="list">
              {actionItems.map(({ gate: g, option }) => (
                <li key={g.id} className="flex gap-3">
                  <span
                    className={cn('mt-1.5 flex-shrink-0 w-2 h-2 rounded-full', WEIGHT_DOT[option.weight])}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{pick(g.question, locale).split('?')[0]}</p>
                    <p className="text-sm text-slate-700 mt-0.5">{option.recommendation ? pick(option.recommendation, locale) : null}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Gate summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Zusammenfassung der Prüfpunkte</h3>
          <ul className="space-y-3" role="list">
            {reviews.map(({ gate: g, option }) => (
              <li key={g.id} className="flex items-start gap-3">
                <span
                  className={cn('mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full', WEIGHT_DOT[option.weight])}
                  aria-label={option.weight === 'green' ? 'OK' : option.weight === 'yellow' ? 'Hinweis' : 'Kritisch'}
                />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Gate {g.step}</p>
                  <p className="text-sm text-slate-800 min-w-0">{pick(option.label, locale)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleReset}
            className="px-5 py-2 text-sm font-medium border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
          >
            Neu starten
          </button>
          {!saved && (
            <button
              onClick={() => handleSave(verdict.level)}
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary transition-colors whitespace-nowrap disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
            >
              {saving ? 'Wird gespeichert…' : 'Ergebnis speichern'}
            </button>
          )}
          {saved && (
            <span className="text-sm text-green-700 font-medium">✓ Gespeichert</span>
          )}
          <a
            href={tier !== 'free' ? `/api/export/pdf?module=governance&locale=${locale}` : '/upgrade'}
            {...(tier !== 'free' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="px-5 py-2 text-sm font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2 inline-flex items-center gap-1.5"
          >
            PDF exportieren{tier === 'free' && <span className="text-xs opacity-60">· Pro</span>}
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
      <HintBox variant="info" className="mb-6">
        <strong>Was ist der AI-Governance-Check?</strong> Dieser strukturierte Prüfprozess bewertet Ihren AI-Use-Case anhand von {totalSteps} ethischen und rechtlichen Gates — von der Rechtmäßigkeit der Datenverarbeitung bis zu Transparenz und Risikomanagement. Das Ergebnis ist keine Rechtsberatung, aber eine fundierte Orientierung für interne Freigabeprozesse.
        <span className="block mt-1 text-xs opacity-75">Tipp: Wählen Sie die Antwort, die den aktuellen Stand Ihres Projekts am besten beschreibt — nicht den Soll-Zustand.</span>
      </HintBox>

      {/* Use-Case-Auswahl */}
      <div className="mb-5">
        <p className="text-xs font-medium text-slate-600 mb-1.5">
          Use Cases <span className="text-slate-400 font-normal">(optional — mehrere wählbar)</span>
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
                    + Anderen Namen eingeben…
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
      <div className="mb-6" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Gate ${currentStep + 1} von ${totalSteps}`}>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>Gate {currentStep + 1} von {totalSteps}</span>
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
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">{pick(gate.question, locale)}</h2>
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
          ← Zurück
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedOptionId}
          className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
        >
          {isLastStep ? 'Ergebnis anzeigen' : 'Weiter →'}
        </button>
      </div>

      <GovernanceHistory sessions={sessions} />
    </div>
  )
}

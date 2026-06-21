'use client'
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

export function GovernancePageClient({ tier }: { tier: Tier }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<GateAnswers>({})
  const [showResult, setShowResult] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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
  }

  const handleSave = async (verdictLevel: VerdictLevel) => {
    setSaving(true)
    try {
      const res = await fetch('/api/governance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, result: VERDICT_TO_API[verdictLevel] }),
      })
      if (res.ok) setSaved(true)
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
              <h2 className={cn('text-base sm:text-lg font-semibold', styles.title)}>{verdict.title}</h2>
              <p className="text-sm text-slate-600 mt-1">{verdict.summary}</p>
            </div>
          </div>
        </div>

        {/* Action items */}
        {actionItems.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Handlungsfelder</h3>
            <ul className="space-y-4" role="list">
              {actionItems.map(({ gate: g, option }) => (
                <li key={g.id} className="flex gap-3">
                  <span
                    className={cn('mt-1.5 flex-shrink-0 w-2 h-2 rounded-full', WEIGHT_DOT[option.weight])}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{g.question.split('?')[0]}</p>
                    <p className="text-sm text-slate-700 mt-0.5">{option.recommendation}</p>
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
                  <p className="text-sm text-slate-800 min-w-0">{option.label}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleReset}
            className="px-5 py-2 text-sm font-medium border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Neu starten
          </button>
          {!saved && (
            <button
              onClick={() => handleSave(verdict.level)}
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors whitespace-nowrap disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {saving ? 'Wird gespeichert…' : 'Ergebnis speichern'}
            </button>
          )}
          {saved && (
            <span className="text-sm text-green-700 font-medium">✓ Gespeichert</span>
          )}
          <a
            href={tier !== 'free' ? '/api/export/pdf?module=governance' : '/upgrade'}
            {...(tier !== 'free' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="px-5 py-2 text-sm font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-flex items-center gap-1.5"
          >
            PDF exportieren{tier === 'free' && <span className="text-xs opacity-60">· Pro</span>}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {/* Progress */}
      <div className="mb-6" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Gate ${currentStep + 1} von ${totalSteps}`}>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>Gate {currentStep + 1} von {totalSteps}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Gate card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-4">
        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">Gate {gate.step}</p>
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">{gate.question}</h2>
        <p className="text-sm text-slate-500 mb-5">{gate.context}</p>

        <fieldset>
          <legend className="sr-only">{gate.question}</legend>
          <div className="space-y-2.5" role="radiogroup">
            {gate.options.map(option => {
              const isSelected = selectedOptionId === option.id
              return (
                <label
                  key={option.id}
                  className={cn(
                    'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors select-none',
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
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
                    <p className={cn('text-sm font-medium', isSelected ? 'text-blue-900' : 'text-slate-900')}>
                      {option.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
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
          className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          ← Zurück
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedOptionId}
          className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isLastStep ? 'Ergebnis anzeigen' : 'Weiter →'}
        </button>
      </div>
    </div>
  )
}

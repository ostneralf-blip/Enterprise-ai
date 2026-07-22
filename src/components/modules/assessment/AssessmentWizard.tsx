'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ASSESSMENT_DIMENSIONS, ALL_QUESTIONS, FREE_QUESTIONS, calcDimScore, calcTotalScore, deriveArchetype } from '@/config/assessment-data'
import { AssessmentResults } from './AssessmentResults'
import { track } from '@/lib/posthog/client'
import { useLocale, useTranslations } from 'next-intl'
import { pick } from '@/lib/utils/locale-data'
import { cn } from '@/lib/utils'
import type { Tier } from '@/types'

interface AssessmentWizardProps {
  tier: Tier
  onSave?: (result: AssessmentResultData) => Promise<void>
  // Draft-Autosave (UX-Review Sprint 35): onStart legt beim Wizard-Start eine
  // Draft-Zeile an (mit gewählter Variante als type), onAnswerChange meldet jede
  // Antwort (Parent debounced + PATCHt), initialAnswers/initialVariant setzen den
  // Wizard beim Fortsetzen auf den letzten Stand.
  onStart?: (type: 'quick' | 'deep') => Promise<void>
  onAnswerChange?: (answers: Record<string, number>) => void
  initialAnswers?: Record<string, number>
  initialVariant?: 'quick' | 'deep'
}

export interface AssessmentResultData {
  answers: Record<string, number>
  dimScores: Record<string, number>
  totalScore: number
  archetype: 'starter' | 'scaler' | 'transformer'
}

type WizardState = 'intro' | 'questions' | 'results'

export function AssessmentWizard({ tier, onSave, onStart, onAnswerChange, initialAnswers, initialVariant }: AssessmentWizardProps) {
  // Free = immer Schnell-Check (16). Pro = standardmäßig vollständig (42), darf
  // auf dem Intro aber freiwillig den Schnell-Check wählen (UX-Review Sprint 35 PR 2).
  const resolvedVariant = initialVariant ?? (tier === 'free' ? 'quick' : 'deep')
  const [variant, setVariant] = useState<'quick' | 'deep'>(resolvedVariant)
  const [state, setState] = useState<WizardState>(initialAnswers ? 'questions' : 'intro')
  const [currentIdx, setCurrentIdx] = useState(() => {
    if (!initialAnswers) return 0
    // Beim Fortsetzen auf die erste noch unbeantwortete Frage springen.
    const qs = resolvedVariant === 'quick' ? FREE_QUESTIONS : ALL_QUESTIONS
    const idx = qs.findIndex(q => initialAnswers[q.id] === undefined)
    return idx === -1 ? qs.length - 1 : idx
  })
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers ?? {})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const locale = useLocale()
  const t = useTranslations('modules.assessment')
  const questions = variant === 'quick' ? FREE_QUESTIONS : ALL_QUESTIONS
  const totalQ = questions.length
  const currentQ = questions[currentIdx]
  const progress = Math.round((currentIdx / totalQ) * 100)
  const currentDim = ASSESSMENT_DIMENSIONS.find(d => d.questions.some(q => q.id === currentQ?.id))

  const handleSelect = useCallback((score: number) => {
    const next = { ...answers, [currentQ.id]: score }
    setAnswers(next)
    onAnswerChange?.(next) // Draft-Autosave (Parent debounced die Persistenz)
  }, [answers, currentQ, onAnswerChange])

  const handleNext = useCallback(() => {
    const score = answers[currentQ.id]
    if (score === undefined) return

    if (currentIdx < totalQ - 1) {
      setCurrentIdx(i => i + 1)
    } else {
      const totalScore = calcTotalScore(answers) ?? 0
      track('tool_completed', { module: 'assessment', score: totalScore, questions: totalQ })
      setState('results')
    }
  }, [answers, currentQ, currentIdx, totalQ])

  const handleSave = async () => {
    if (!onSave || tier === 'free') return
    setSaving(true)
    const totalScore = calcTotalScore(answers) ?? 0
    const dimScores: Record<string, number> = {}
    ASSESSMENT_DIMENSIONS.forEach(d => {
      const s = calcDimScore(answers, d.id)
      if (s !== null) dimScores[d.id] = s
    })
    await onSave({
      answers,
      dimScores,
      totalScore,
      archetype: deriveArchetype(totalScore),
    })
    track('version_saved', { module: 'assessment' })
    setSaved(true)
    setSaving(false)
  }

  const handleRestart = () => {
    setAnswers({})
    setCurrentIdx(0)
    setState('intro')
    setSaved(false)
    track('tool_started', { module: 'assessment', tier })
  }

  if (state === 'intro') {
    return <AssessmentIntro
      tier={tier}
      variant={variant}
      onVariantChange={setVariant}
      onStart={async () => {
        track('tool_started', { module: 'assessment', tier, variant })
        await onStart?.(variant) // Draft anlegen (Pro) mit gewählter Variante
        setState('questions')
      }}
    />
  }

  if (state === 'results') {
    const totalScore = calcTotalScore(answers) ?? 0
    const dimScores: Record<string, number> = {}
    ASSESSMENT_DIMENSIONS.forEach(d => {
      const s = calcDimScore(answers, d.id)
      if (s !== null) dimScores[d.id] = s
    })
    return (
      <AssessmentResults
        totalScore={totalScore}
        dimScores={dimScores}
        archetype={deriveArchetype(totalScore)}
        tier={tier}
        onSave={handleSave}
        onRestart={handleRestart}
        saving={saving}
        saved={saved}
      />
    )
  }

  // QUESTIONS
  const selectedScore = answers[currentQ.id]
  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>{currentDim ? pick(currentDim.label, locale) : ''}</span>
          <span>{currentIdx + 1} / {totalQ}</span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('progressAria', { current: currentIdx + 1, total: totalQ })}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8 mb-4">
        <div className="text-xs font-medium text-primary uppercase tracking-wider mb-3">
          {currentDim ? pick(currentDim.label, locale) : ''}
        </div>
        <h2 className="text-base sm:text-lg font-medium text-slate-900 mb-6 sm:mb-8 leading-relaxed">
          {pick(currentQ.text, locale)}
        </h2>

        <div className="space-y-3" role="group" aria-label={t('ratingGroupLabel')}>
          {[1, 2, 3, 4, 5].map(score => (
            <button
              key={score}
              onClick={() => handleSelect(score)}
              aria-pressed={selectedScore === score}
              className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2 ${
                selectedScore === score
                  ? 'border-primary-ring bg-primary-soft'
                  : 'border-slate-200 hover:border-primary-border hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  selectedScore === score ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {score}
                </span>
                <span className="text-sm text-slate-700 min-w-0">
                  {score === 1 ? pick(currentQ.lowLabel, locale)
                    : score === 2 ? (currentQ.l2Label ? pick(currentQ.l2Label, locale) : t('l2Fallback'))
                    : score === 3 ? (currentQ.l3Label ? pick(currentQ.l3Label, locale) : t('l3Fallback'))
                    : score === 4 ? (currentQ.l4Label ? pick(currentQ.l4Label, locale) : t('l4Fallback'))
                    : pick(currentQ.highLabel, locale)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => currentIdx === 0 ? setState('intro') : setCurrentIdx(i => i - 1)}
          className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
          aria-label={currentIdx === 0 ? t('backToOverview') : t('prevQuestion')}
        >
          {t('back')}
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedScore}
          className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
        >
          {currentIdx === totalQ - 1 ? t('evaluate') : t('wizardNext')}
        </button>
      </div>
    </div>
  )
}

function AssessmentIntro({ tier, variant, onVariantChange, onStart }: {
  tier: Tier
  variant: 'quick' | 'deep'
  onVariantChange: (v: 'quick' | 'deep') => void
  onStart: () => void | Promise<void>
}) {
  const t = useTranslations('modules.assessment')
  const isPro = tier !== 'free'
  // Free ist fix Schnell-Check; für Pro folgt die Fragenzahl der gewählten Variante.
  const questionCount = variant === 'quick' ? 16 : 42
  const duration = variant === 'quick' ? t('introDuration10') : t('introDuration25')

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8">
        <div className="text-3xl mb-4">◎</div>
        <h1 className="text-xl sm:text-2xl font-semibold font-serif text-slate-900 mb-2">AI-Readiness Assessment</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          {t.rich('introDesc', {
            count: questionCount,
            duration,
            b: (chunks) => <strong className="text-slate-700">{chunks}</strong>,
          })}
          {!isPro && (
            <span className="block mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {t.rich('introShortVersion', {
                pro: (chunks) => <a href="/upgrade" className="underline font-medium">{chunks}</a>,
              })}
            </span>
          )}
        </p>

        {/* Umfang-Wahl — nur Pro (Free ist automatisch Schnell-Check, siehe #222).
            Pro darf freiwillig den 16-Fragen-Schnell-Check nutzen, z. B. für einen
            Zwischen-Check (UX-Review Sprint 35 PR 2). */}
        {isPro && (
          <div className="mb-6">
            <p className="text-xs font-medium text-ink-secondary uppercase tracking-wide mb-2">{t('variantChooseLabel')}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t('variantChooseLabel')}>
              {(['deep', 'quick'] as const).map(v => {
                const active = variant === v
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onVariantChange(v)}
                    aria-pressed={active}
                    className={cn(
                      'px-4 py-2 rounded-xl border text-sm transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2',
                      active ? 'bg-primary border-primary text-white font-medium' : 'bg-surface border-line text-ink-secondary hover:border-line-strong hover:bg-surface-raised'
                    )}
                  >
                    {v === 'deep' ? t('variantFull') : t('variantQuick')}
                  </button>
                )
              })}
            </div>
            {variant === 'quick' && (
              <p className="mt-2 text-xs text-warning-text bg-warning-subtle border border-warning-border rounded-lg px-3 py-2">
                {t('quickCheckWarning')}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
          {[
            { id: 'data',       icon: '📊', labelKey: 'introDimData',       weight: '25%' },
            { id: 'skills',     icon: '🎓', labelKey: 'introDimSkills',      weight: '20%' },
            { id: 'governance', icon: '⚖️', labelKey: 'introDimGovernance',  weight: '20%' },
            { id: 'tech',       icon: '⚙️', labelKey: 'introDimTech',        weight: '20%' },
            { id: 'strategy',   icon: '🎯', labelKey: 'introDimStrategy',    weight: '10%' },
            { id: 'culture',    icon: '🌱', labelKey: 'introDimCulture',     weight: '5%'  },
          ].map(d => (
            <Link
              key={d.id}
              href={`/assessment/dimensionen#${d.id}`}
              className="bg-slate-50 hover:bg-primary-soft hover:border-primary-border border border-transparent rounded-xl p-3 flex items-center gap-3 min-w-0 transition-colors group"
            >
              <span className="shrink-0">{d.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-700 group-hover:text-primary-hover">{t(d.labelKey as Parameters<typeof t>[0])}</div>
                <div className="text-xs text-slate-400">{t('introDimWeight', { weight: d.weight })}</div>
              </div>
              <span className="text-slate-300 group-hover:text-primary text-xs shrink-0">→</span>
            </Link>
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center mb-6">
          {t('introDimHint')}
        </p>

        <button
          onClick={onStart}
          className="w-full bg-primary hover:bg-primary text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
          aria-label={t('startAriaLabel')}
        >
          {t('startBtn')}
        </button>
      </div>
    </div>
  )
}

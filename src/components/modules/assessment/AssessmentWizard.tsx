'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ASSESSMENT_DIMENSIONS, ALL_QUESTIONS, FREE_QUESTIONS, calcDimScore, calcTotalScore, deriveArchetype } from '@/config/assessment-data'
import { AssessmentResults } from './AssessmentResults'
import { track } from '@/lib/posthog/client'
import type { Tier } from '@/types'

interface AssessmentWizardProps {
  tier: Tier
  onSave?: (result: AssessmentResultData) => Promise<void>
}

export interface AssessmentResultData {
  answers: Record<string, number>
  dimScores: Record<string, number>
  totalScore: number
  archetype: 'starter' | 'scaler' | 'transformer'
}

type WizardState = 'intro' | 'questions' | 'results'

export function AssessmentWizard({ tier, onSave }: AssessmentWizardProps) {
  const [state, setState] = useState<WizardState>('intro')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const questions = tier === 'free' ? FREE_QUESTIONS : ALL_QUESTIONS
  const totalQ = questions.length
  const currentQ = questions[currentIdx]
  const progress = Math.round((currentIdx / totalQ) * 100)
  const currentDim = ASSESSMENT_DIMENSIONS.find(d => d.questions.some(q => q.id === currentQ?.id))

  const handleSelect = useCallback((score: number) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: score }))
  }, [currentQ])

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
    return <AssessmentIntro tier={tier} onStart={() => { track('tool_started', { module: 'assessment', tier }); setState('questions') }} />
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
          <span>{currentDim?.label}</span>
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
            aria-label={`Fortschritt: ${currentIdx + 1} von ${totalQ} Fragen`}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8 mb-4">
        <div className="text-xs font-medium text-primary uppercase tracking-wider mb-3">
          {currentDim?.label}
        </div>
        <h2 className="text-base sm:text-lg font-medium text-slate-900 mb-6 sm:mb-8 leading-relaxed">
          {currentQ.text}
        </h2>

        <div className="space-y-3" role="group" aria-label="Bewertung auswählen">
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
                  {score === 1 ? currentQ.lowLabel
                    : score === 2 ? (currentQ.l2Label ?? 'Ansätze vorhanden, nicht systematisch')
                    : score === 3 ? (currentQ.l3Label ?? 'Teilweise etabliert, ausbaufähig')
                    : score === 4 ? (currentQ.l4Label ?? 'Weitgehend etabliert, vereinzelte Lücken')
                    : currentQ.highLabel}
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
          aria-label={currentIdx === 0 ? 'Zurück zur Übersicht' : 'Vorherige Frage'}
        >
          ← Zurück
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedScore}
          className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
        >
          {currentIdx === totalQ - 1 ? 'Auswertung →' : 'Weiter →'}
        </button>
      </div>
    </div>
  )
}

function AssessmentIntro({ tier, onStart }: { tier: Tier; onStart: () => void }) {
  const isPro = tier !== 'free'
  const questionCount = isPro ? 42 : 16
  const duration = isPro ? 'ca. 25 Minuten' : 'ca. 10 Minuten'

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8">
        <div className="text-3xl mb-4">◎</div>
        <h1 className="text-xl sm:text-2xl font-semibold font-serif text-slate-900 mb-2">AI-Readiness Assessment</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          Bewerten Sie Ihr Unternehmen in <strong className="text-slate-700">6 Dimensionen</strong> mit{' '}
          <strong className="text-slate-700">{questionCount} Fragen</strong> auf einer Skala von 1–5 (L1 Initial bis L5 Optimizing). Dauer: {duration}.
          {!isPro && (
            <span className="block mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Kurzversion (16 Fragen). Mit <a href="/upgrade" className="underline font-medium">Pro</a> erhalten Sie das vollständige 42-Fragen-Assessment mit vertieftem Reifegradmodell.
            </span>
          )}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
          {[
            { id: 'data',       icon: '📊', label: 'Daten & Zugriff', weight: '25%' },
            { id: 'skills',     icon: '🎓', label: 'Skills',          weight: '20%' },
            { id: 'governance', icon: '⚖️', label: 'Governance',      weight: '20%' },
            { id: 'tech',       icon: '⚙️', label: 'Technologie',     weight: '20%' },
            { id: 'strategy',   icon: '🎯', label: 'Strategie',       weight: '10%' },
            { id: 'culture',    icon: '🌱', label: 'Kultur',          weight: '5%'  },
          ].map(d => (
            <Link
              key={d.id}
              href={`/assessment/dimensionen#${d.id}`}
              className="bg-slate-50 hover:bg-primary-soft hover:border-primary-border border border-transparent rounded-xl p-3 flex items-center gap-3 min-w-0 transition-colors group"
            >
              <span className="shrink-0">{d.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-700 group-hover:text-primary-hover">{d.label}</div>
                <div className="text-xs text-slate-400">Gewicht: {d.weight}</div>
              </div>
              <span className="text-slate-300 group-hover:text-primary text-xs shrink-0">→</span>
            </Link>
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center mb-6">
          Auf eine Dimension klicken für Details zur Gewichtung
        </p>

        <button
          onClick={onStart}
          className="w-full bg-primary hover:bg-primary text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
          aria-label="Assessment starten"
        >
          Assessment starten →
        </button>
      </div>
    </div>
  )
}

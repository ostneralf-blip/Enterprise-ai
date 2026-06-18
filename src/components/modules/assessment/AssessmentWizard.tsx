'use client'
import { useState, useCallback } from 'react'
import { ASSESSMENT_DIMENSIONS, ALL_QUESTIONS, calcDimScore, calcTotalScore, deriveArchetype } from '@/config/assessment-data'
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

  const totalQ = ALL_QUESTIONS.length
  const currentQ = ALL_QUESTIONS[currentIdx]
  const progress = Math.round((currentIdx / totalQ) * 100)
  const currentDim = ASSESSMENT_DIMENSIONS.find(d => d.questions.some(q => q.id === currentQ?.id))

  const handleAnswer = useCallback((score: number) => {
    const newAnswers = { ...answers, [currentQ.id]: score }
    setAnswers(newAnswers)

    if (currentIdx < totalQ - 1) {
      setCurrentIdx(i => i + 1)
    } else {
      // Finished — compute results
      const totalScore = calcTotalScore(newAnswers) ?? 0
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
    return <AssessmentIntro onStart={() => { track('tool_started', { module: 'assessment', tier }); setState('questions') }} />
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
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
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
      <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-4">
        <div className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-3">
          {currentDim?.label}
        </div>
        <h2 className="text-lg font-medium text-slate-900 mb-8 leading-relaxed">
          {currentQ.text}
        </h2>

        <div className="space-y-3" role="group" aria-label="Bewertung auswählen">
          {[1, 2, 3, 4, 5].map(score => (
            <button
              key={score}
              onClick={() => handleAnswer(score)}
              aria-pressed={selectedScore === score}
              className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                selectedScore === score
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  selectedScore === score ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {score}
                </span>
                <span className="text-sm text-slate-700">
                  {score === 1 ? currentQ.lowLabel
                    : score === 2 ? 'Ansätze vorhanden, nicht systematisch'
                    : score === 3 ? 'Teilweise etabliert, ausbaufähig'
                    : score === 4 ? 'Weitgehend etabliert, vereinzelte Lücken'
                    : currentQ.highLabel}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-3 py-2"
          aria-label="Vorherige Frage"
        >
          ← Zurück
        </button>
        <span className="text-xs text-slate-400">
          Klicken Sie eine Option, um fortzufahren
        </span>
        <div className="w-20" />
      </div>
    </div>
  )
}

function AssessmentIntro({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-8">
        <div className="text-3xl mb-4">◎</div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">AI-Readiness Assessment</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          Bewerten Sie Ihr Unternehmen in <strong className="text-slate-700">6 Dimensionen</strong> mit 
          16 Fragen auf einer Skala von 1 (niedrig) bis 5 (sehr hoch). Dauer: ca. 10 Minuten.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: '📊', label: 'Daten & Zugriff', weight: '25%' },
            { icon: '🎓', label: 'Skills', weight: '20%' },
            { icon: '⚖️', label: 'Governance', weight: '20%' },
            { icon: '⚙️', label: 'Technologie', weight: '20%' },
            { icon: '🎯', label: 'Strategie', weight: '10%' },
            { icon: '🌱', label: 'Kultur', weight: '5%' },
          ].map(d => (
            <div key={d.label} className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
              <span>{d.icon}</span>
              <div>
                <div className="text-sm font-medium text-slate-700">{d.label}</div>
                <div className="text-xs text-slate-400">Gewicht: {d.weight}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Assessment starten"
        >
          Assessment starten →
        </button>
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { WIZARD_STEPS, generateArchitecture, type WizardAnswers, type ArchitectureResult } from '@/config/architecture-data'

const LAYER_ICONS = ['◎', '◐', '▷', '□']

export function ArchitecturePageClient() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<WizardAnswers>({})
  const [result, setResult] = useState<ArchitectureResult | null>(null)

  const totalSteps = WIZARD_STEPS.length
  const step = WIZARD_STEPS[currentStep]
  const selectedOptionId = answers[step?.id ?? 'infra']
  const isLastStep = currentStep === totalSteps - 1
  const progress = Math.round((currentStep / totalSteps) * 100)

  const handleSelect = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [step.id]: optionId }))
  }

  const handleNext = () => {
    if (isLastStep) {
      setResult(generateArchitecture(answers))
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
    setResult(null)
  }

  if (result) {
    return (
      <div className="max-w-2xl space-y-5">
        {/* Pattern card */}
        <div className={cn('rounded-2xl border p-5 sm:p-6', result.color.bg, result.color.border)}>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full', result.color.badge)}>
              Empfohlenes Muster
            </span>
          </div>
          <h2 className={cn('text-base sm:text-lg font-semibold mb-1', result.color.title)}>{result.pattern}</h2>
          <p className="text-sm text-slate-600">{result.summary}</p>
        </div>

        {/* Architecture layers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Architektur-Schichten</h3>
          <div className="space-y-4">
            {result.layers.map((layer, i) => (
              <section key={i} aria-labelledby={`layer-${i}`} className="border border-slate-100 rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-slate-400 text-sm" aria-hidden="true">{LAYER_ICONS[i]}</span>
                  <h4 id={`layer-${i}`} className="text-sm font-semibold text-slate-800">{layer.name}</h4>
                </div>
                <p className="text-xs text-slate-500 mb-2">{layer.role}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {layer.components.map((comp, j) => (
                    <span key={j} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{comp}</span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 italic">{layer.examples}</p>
              </section>
            ))}
          </div>
        </div>

        {/* Key decisions + Next steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Schlüssel-Entscheidungen</h3>
            <ul className="space-y-2.5" role="list">
              {result.keyDecisions.map((decision, i) => (
                <li key={i} className="flex gap-2.5 text-xs text-slate-600">
                  <span className="flex-shrink-0 mt-0.5 w-4 h-4 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-semibold text-[10px]">
                    {i + 1}
                  </span>
                  <span className="min-w-0">{decision}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Nächste Schritte</h3>
            <ul className="space-y-2.5" role="list">
              {result.nextSteps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-xs text-slate-600">
                  <span className="flex-shrink-0 mt-0.5 w-4 h-4 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-[10px]">
                    {i + 1}
                  </span>
                  <span className="min-w-0">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="px-5 py-2 text-sm font-medium border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Neue Architektur generieren
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {/* Progress */}
      <div className="mb-6" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Schritt ${currentStep + 1} von ${totalSteps}`}>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>Schritt {currentStep + 1} von {totalSteps}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-4">
        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">Schritt {step.step}</p>
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">{step.question}</h2>
        <p className="text-sm text-slate-500 mb-5">{step.context}</p>

        <fieldset>
          <legend className="sr-only">{step.question}</legend>
          <div className="space-y-2.5">
            {step.options.map(option => {
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
                    name={step.id}
                    value={option.id}
                    checked={isSelected}
                    onChange={() => handleSelect(option.id)}
                    className="mt-0.5 accent-blue-600 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className={cn('text-sm font-medium', isSelected ? 'text-blue-900' : 'text-slate-900')}>{option.label}</p>
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
          {isLastStep ? 'Architektur generieren' : 'Weiter →'}
        </button>
      </div>
    </div>
  )
}

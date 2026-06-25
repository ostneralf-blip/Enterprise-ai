'use client'
import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { ShareButton } from '@/components/shared/ShareButton'
import { VersionsPanel } from '@/components/shared/VersionsPanel'
import { WIZARD_STEPS, generateArchitecture, type WizardAnswers, type ArchitectureResult } from '@/config/architecture-data'
import { recommendFromWizard, type CatalogRecommendations } from '@/config/architecture-rules'
import type { Archetype, CatalogComponent } from '@/types'

const LAYER_ICONS = ['◎', '◐', '▷', '□']

const ARCHETYPE_LABELS: Record<string, string> = {
  starter: 'Starter',
  scaler: 'Scaler',
  transformer: 'Transformer',
}

const GOVERNANCE_LABELS: Record<string, string> = {
  approve: 'Freigegeben',
  stop_dsgvo: 'DSGVO-Stop',
  stop_risk: 'Risiko-Stop',
  improve: 'Verbesserung nötig',
}

const GOVERNANCE_COLORS: Record<string, string> = {
  approve: 'text-green-700 bg-green-50',
  stop_dsgvo: 'text-red-700 bg-red-50',
  stop_risk: 'text-red-700 bg-red-50',
  improve: 'text-amber-700 bg-amber-50',
}

interface SavedArchitecture {
  id: string
  title: string | null
  wizard_data: WizardAnswers
  result: ArchitectureResult
  updated_at: string
}

interface AssessmentContext {
  archetype: Archetype | null
  total_score: number
  dim_scores: Record<string, number>
}

interface GovernanceContext {
  use_case_name: string | null
  result: string | null
}

interface Props {
  initialArchitectures?: SavedArchitecture[]
  assessmentContext?: AssessmentContext | null
  governanceContext?: GovernanceContext | null
  compliancePreset?: 'strict' | 'moderate' | 'low' | 'undefined'
  tier?: string
}

const COMPLIANCE_PRESET_LABELS: Record<string, string> = {
  strict:    'Strenge Regulierung (Hochrisiko EU AI Act)',
  moderate:  'Moderate Anforderungen (DSGVO + EU)',
  low:       'Geringe Anforderungen',
  undefined: 'Noch nicht definiert',
}

interface ContextBannerProps {
  assessmentContext: AssessmentContext | null | undefined
  governanceContext: GovernanceContext | null | undefined
  compliancePreset?: string
}

function ContextBanner({ assessmentContext, governanceContext, compliancePreset }: ContextBannerProps) {
  if (!assessmentContext && !governanceContext && !compliancePreset) return null
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-5 text-xs text-blue-800 space-y-1.5">
      <p className="font-semibold text-blue-900">Kontext aus anderen Modulen</p>
      {assessmentContext?.archetype && (
        <p>
          <span className="font-medium">Reifegradprofil:</span>{' '}
          {ARCHETYPE_LABELS[assessmentContext.archetype] ?? assessmentContext.archetype}
          {' '}(Score: {assessmentContext.total_score})
        </p>
      )}
      {governanceContext?.result && (
        <p>
          <span className="font-medium">Governance-Prüfung:</span>{' '}
          {governanceContext.use_case_name && <span>{governanceContext.use_case_name} — </span>}
          <span className={cn('px-1.5 py-0.5 rounded font-medium', GOVERNANCE_COLORS[governanceContext.result] ?? 'text-slate-700 bg-slate-100')}>
            {GOVERNANCE_LABELS[governanceContext.result] ?? governanceContext.result}
          </span>
        </p>
      )}
      {compliancePreset && (
        <p>
          <span className="font-medium">Compliance (vorausgefüllt):</span>{' '}
          {COMPLIANCE_PRESET_LABELS[compliancePreset] ?? compliancePreset}
        </p>
      )}
    </div>
  )
}

type View = 'list' | 'wizard' | 'result'

const DSGVO_BADGE: Record<string, string> = {
  compliant:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  conditional:   'bg-amber-50 text-amber-700 border-amber-200',
  non_compliant: 'bg-red-50 text-red-700 border-red-200',
}
const DSGVO_LABEL: Record<string, string> = {
  compliant: 'DSGVO ✓', conditional: 'DSGVO ~', non_compliant: 'DSGVO ✗',
}
const LAYER_LABEL: Record<string, string> = {
  data: 'Daten', model: 'Modell', mlops: 'MLOps', serving: 'Serving',
  governance: 'Governance', security: 'Security', application: 'Anwendung',
}

function CatalogRecommendationsCard({ recs, components }: { recs: CatalogRecommendations; components: CatalogComponent[] }) {
  const byName = Object.fromEntries(components.map(c => [c.name, c]))
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-5">
      <h3 className="text-sm font-semibold text-slate-900">Empfohlene Katalog-Komponenten</h3>
      <div className="space-y-3">
        {recs.layers.map(lr => (
          <div key={lr.layer}>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
              {LAYER_LABEL[lr.layer] ?? lr.layer}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {lr.componentNames.map(name => {
                const comp = byName[name]
                return (
                  <span key={name} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    <span className="font-medium min-w-0 truncate max-w-[120px]">{name}</span>
                    {comp?.dsgvo_status && (
                      <span className={cn('px-1 py-0.5 rounded text-[10px] font-medium border', DSGVO_BADGE[comp.dsgvo_status])}>
                        {DSGVO_LABEL[comp.dsgvo_status]}
                      </span>
                    )}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Empfohlene Rollen</p>
        <div className="flex flex-wrap gap-1.5">
          {recs.roleNames.map(role => (
            <span key={role} className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 font-medium">{role}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ArchitecturePageClient({ initialArchitectures = [], assessmentContext = null, governanceContext = null, compliancePreset, tier = 'free' }: Props) {
  const [architectures, setArchitectures] = useState<SavedArchitecture[]>(initialArchitectures)
  const [view, setView] = useState<View>(initialArchitectures.length === 0 ? 'wizard' : 'list')
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<WizardAnswers>(() =>
    compliancePreset ? { compliance: compliancePreset } : {}
  )
  const [result, setResult] = useState<ArchitectureResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [catalogRecs, setCatalogRecs] = useState<CatalogRecommendations | null>(null)
  const [recComponents, setRecComponents] = useState<CatalogComponent[]>([])
  const catalogFetched = useRef(false)

  const totalSteps = WIZARD_STEPS.length
  const step = WIZARD_STEPS[currentStep]
  const selectedOptionId = answers[step?.id ?? 'infra']
  const isLastStep = currentStep === totalSteps - 1
  const progress = Math.round((currentStep / totalSteps) * 100)

  const handleSelect = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [step.id]: optionId }))
  }

  function applyRecs(wizardAnswers: WizardAnswers) {
    setCatalogRecs(recommendFromWizard(wizardAnswers))
    if (!catalogFetched.current) {
      catalogFetched.current = true
      fetch('/api/catalog/components')
        .then(r => r.json())
        .then(({ data }) => setRecComponents(data ?? []))
        .catch(() => { catalogFetched.current = false })
    }
  }

  const handleNext = () => {
    if (isLastStep) {
      setResult(generateArchitecture(answers))
      setView('result')
      setSaved(false)
      applyRecs(answers)
    } else {
      setCurrentStep(s => s + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1)
  }

  const handleNewWizard = () => {
    setAnswers({})
    setCurrentStep(0)
    setResult(null)
    setSaved(false)
    setSavedId(null)
    setCatalogRecs(null)
    setView('wizard')
  }

  const handleViewSaved = (arch: SavedArchitecture) => {
    setAnswers(arch.wizard_data)
    setResult(arch.result)
    setSaved(true)
    setSavedId(arch.id)
    setView('result')
    applyRecs(arch.wizard_data)
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    try {
      const res = await fetch('/api/architecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wizard_data: answers, result }),
      })
      if (res.ok) {
        const { data } = await res.json()
        setArchitectures(prev => [data, ...prev])
        setSaved(true)
        setSavedId(data.id)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/architecture/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setArchitectures(prev => prev.filter(a => a.id !== id))
      }
    } finally {
      setDeletingId(null)
    }
  }

  if (view === 'list') {
    return (
      <div className="max-w-2xl space-y-5">
        <ContextBanner assessmentContext={assessmentContext} governanceContext={governanceContext} compliancePreset={compliancePreset} />
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Gespeicherte Architekturen ({architectures.length})</h2>
          <button
            onClick={handleNewWizard}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Neue Architektur →
          </button>
        </div>
        {architectures.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
            Noch keine Architektur gespeichert.
          </div>
        ) : (
          <ul className="space-y-3" role="list">
            {architectures.map(arch => (
              <li key={arch.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{arch.title ?? arch.result.pattern}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{arch.result.pattern}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(arch.updated_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleViewSaved(arch)}
                      className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    >
                      Ansehen
                    </button>
                    <button
                      onClick={() => handleDelete(arch.id)}
                      disabled={deletingId === arch.id}
                      aria-label={`Architektur ${arch.title ?? arch.result.pattern} löschen`}
                      className="px-3 py-1.5 text-xs font-medium border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    >
                      {deletingId === arch.id ? '…' : 'Löschen'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  if (view === 'result' && result) {
    return (
      <div className="max-w-2xl space-y-5">
        <ContextBanner assessmentContext={assessmentContext} governanceContext={governanceContext} compliancePreset={compliancePreset} />

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

        {/* Catalog recommendations */}
        {catalogRecs && (
          <CatalogRecommendationsCard recs={catalogRecs} components={recComponents} />
        )}

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
              {result.nextSteps.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-xs text-slate-600">
                  <span className="flex-shrink-0 mt-0.5 w-4 h-4 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-[10px]">
                    {i + 1}
                  </span>
                  <span className="min-w-0">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleNewWizard}
            className="px-5 py-2 text-sm font-medium border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Neue Architektur generieren
          </button>
          {!saved && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors whitespace-nowrap disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {saving ? 'Wird gespeichert…' : 'Architektur speichern'}
            </button>
          )}
          {saved && (
            <span className="text-sm text-green-700 font-medium">✓ Gespeichert</span>
          )}
          <a
            href="/api/export/pdf?module=architecture"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 text-sm font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            PDF exportieren
          </a>
          {savedId && result && (
            <>
              <VersionsPanel
                module="architecture"
                entityId={savedId}
                tier={tier}
                currentData={{ wizard_data: answers, result }}
              />
              <ShareButton module="architecture" entityId={savedId} tier={tier} />
            </>
          )}
          {architectures.length > 0 && (
            <button
              onClick={() => setView('list')}
              className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Alle Architekturen
            </button>
          )}
        </div>
      </div>
    )
  }

  // Wizard view
  return (
    <div className="max-w-2xl">
      <ContextBanner assessmentContext={assessmentContext} governanceContext={governanceContext} />

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
        {architectures.length > 0 && (
          <button
            onClick={() => setView('list')}
            className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Übersicht
          </button>
        )}
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

'use client'
import { useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { AssessmentWizard, type AssessmentResultData } from '@/components/modules/assessment/AssessmentWizard'
import { AssessmentResults } from '@/components/modules/assessment/AssessmentResults'
import type { Tier } from '@/types'

interface SavedResult {
  archetype: 'starter' | 'scaler' | 'transformer'
  total_score: number
  dim_scores: Record<string, number>
}

interface DraftData {
  id: string
  answers: Record<string, number>
  updatedAt: string
}

interface AssessmentPageClientProps {
  tier: Tier
  savedResult?: SavedResult | null
  draft?: DraftData | null
}

export function AssessmentPageClient({ tier, savedResult, draft }: AssessmentPageClientProps) {
  const t = useTranslations('modules.assessment')
  const isPro = tier !== 'free'

  // Startmodus: offener Draft → Fortsetzen-Abfrage; sonst gespeichertes Ergebnis
  // → Ergebnisansicht; sonst frischer Wizard.
  const [mode, setMode] = useState<'resume-prompt' | 'results' | 'wizard'>(
    draft ? 'resume-prompt' : savedResult ? 'results' : 'wizard'
  )
  const [resumeAnswers, setResumeAnswers] = useState<Record<string, number> | undefined>(undefined)

  const draftIdRef = useRef<string | null>(draft?.id ?? null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Draft beim Wizard-Start anlegen (nur Pro; Free persistiert nicht). Bereits
  // gesetzte draftId (Resume) wird nicht überschrieben.
  const handleStart = useCallback(async () => {
    if (draftIdRef.current) return
    try {
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'deep' }),
      })
      if (res.ok) {
        const { data } = await res.json() as { data: { id: string } }
        draftIdRef.current = data.id
      }
    } catch { /* Draft ist best-effort — der Wizard funktioniert auch ohne */ }
  }, [])

  // Debounced Zwischenspeicherung der Antworten (kein Request pro Klick).
  const handleAnswerChange = useCallback((answers: Record<string, number>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const id = draftIdRef.current
      if (!id) return
      void fetch(`/api/assessment/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      }).catch(() => {})
    }, 800)
  }, [])

  // Finalisierung: markiert den Draft als abgeschlossen (completed=true) inkl.
  // Scores. Ersetzt den früheren client-direkten Insert.
  const handleSave = useCallback(async (result: AssessmentResultData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    let id = draftIdRef.current
    if (!id) {
      // Defensiv: falls der Start-POST fehlschlug, jetzt einen Draft anlegen.
      const created = await fetch('/api/assessment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'deep' }),
      })
      if (created.ok) id = (await created.json() as { data: { id: string } }).data.id
    }
    if (!id) throw new Error('Speichern fehlgeschlagen')

    const res = await fetch(`/api/assessment/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: result.answers,
        completed: true,
        total_score: result.totalScore,
        dim_scores: result.dimScores,
        archetype: result.archetype,
      }),
    })
    if (!res.ok) throw new Error('Speichern fehlgeschlagen')
    draftIdRef.current = null // finalisiert — ein „Neu starten" legt einen frischen Draft an
  }, [])

  const handleResume = () => {
    setResumeAnswers(draft!.answers)
    setMode('wizard')
  }

  const handleDiscard = () => {
    const id = draftIdRef.current
    draftIdRef.current = null
    if (id) void fetch(`/api/assessment/${id}`, { method: 'DELETE' }).catch(() => {})
    setResumeAnswers(undefined)
    setMode('wizard')
  }

  if (mode === 'resume-prompt' && draft) {
    const answeredCount = Object.keys(draft.answers).length
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-8">
          <div className="text-3xl mb-4" aria-hidden="true">◎</div>
          <h1 className="text-lg sm:text-xl font-semibold font-serif text-ink mb-2">{t('resumeTitle')}</h1>
          <p className="text-ink-secondary text-sm leading-relaxed mb-6">{t('resumeDesc', { count: answeredCount })}</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleResume}
              className="px-5 py-2.5 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
            >
              {t('resumeContinue')}
            </button>
            <button
              onClick={handleDiscard}
              className="px-5 py-2.5 text-sm font-medium border border-line text-ink-secondary rounded-xl hover:bg-surface-raised transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
            >
              {t('resumeRestart')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'results' && savedResult) {
    return (
      <AssessmentResults
        totalScore={savedResult.total_score}
        dimScores={savedResult.dim_scores}
        archetype={savedResult.archetype}
        tier={tier}
        onSave={async () => {}}
        onRestart={() => setMode('wizard')}
        saving={false}
        saved={true}
      />
    )
  }

  return (
    <AssessmentWizard
      tier={tier}
      onSave={handleSave}
      onStart={isPro ? handleStart : undefined}
      onAnswerChange={isPro ? handleAnswerChange : undefined}
      initialAnswers={resumeAnswers}
    />
  )
}

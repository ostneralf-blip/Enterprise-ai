'use client'
import { ASSESSMENT_DIMENSIONS, getMaturityLevel } from '@/config/assessment-data'
import { ARCHETYPES } from '@/types'
import { FeedbackWidget } from '@/components/shared/FeedbackWidget'
import { UpgradeModal } from '@/components/shared/UpgradeModal'
import { track } from '@/lib/posthog/client'
import { useState } from 'react'
import type { Tier } from '@/types'

interface AssessmentResultsProps {
  totalScore: number
  dimScores: Record<string, number>
  archetype: 'starter' | 'scaler' | 'transformer'
  tier: Tier
  onSave: () => Promise<void>
  onRestart: () => void
  saving: boolean
  saved: boolean
}

export function AssessmentResults({
  totalScore, dimScores, archetype, tier, onSave, onRestart, saving, saved
}: AssessmentResultsProps) {
  const [showUpgrade, setShowUpgrade] = useState(false)
  const maturity = getMaturityLevel(totalScore)
  const archetypeConfig = ARCHETYPES[archetype]

  const handleExportPDF = () => {
    if (tier === 'free') {
      track('upgrade_clicked', { feature: 'pdf_export', from: 'assessment_results' })
      setShowUpgrade(true)
      return
    }
    track('export_pdf', { module: 'assessment' })
    window.open(`/api/export/pdf?module=assessment`, '_blank')
  }

  const handleSave = () => {
    if (tier === 'free') {
      track('upgrade_clicked', { feature: 'save_results', from: 'assessment_results' })
      setShowUpgrade(true)
      return
    }
    onSave()
  }

  return (
    <>
      {showUpgrade && <UpgradeModal feature="Ergebnisse speichern & PDF-Export" onClose={() => setShowUpgrade(false)} />}

      <div className="max-w-3xl mx-auto space-y-6 w-full">
        {/* Header Score */}
        <div className="bg-slate-900 rounded-2xl p-5 sm:p-8 flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-8">
          <div className="text-center shrink-0">
            <div className={`text-4xl sm:text-5xl font-bold font-mono ${maturity.color.replace('text-', 'text-')}`}
                 style={{ color: totalScore >= 4 ? '#10b981' : totalScore >= 3 ? '#f59e0b' : '#ef4444' }}>
              {totalScore.toFixed(1)}
            </div>
            <div className="text-slate-400 text-xs mt-1">von 5,0</div>
          </div>
          <div className="border-l border-slate-700 pl-4 sm:pl-8 min-w-0 flex-1">
            <div className="text-white text-base sm:text-lg font-semibold mb-1 break-words">{maturity.label}</div>
            <div className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full mb-3`}
                 style={{ background: `${archetypeConfig.color}22`, color: archetypeConfig.color === 'amber' ? '#d97706' : archetypeConfig.color === 'blue' ? '#3b82f6' : '#10b981' }}>
              {archetypeConfig.icon} {archetypeConfig.label}
            </div>
            <div className="text-slate-400 text-sm break-words">{archetypeConfig.desc}</div>
          </div>
        </div>

        {/* Dimension Scores */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-900 mb-5">Ergebnis nach Dimension</h3>
          <div className="space-y-4">
            {ASSESSMENT_DIMENSIONS.map((dim, barIndex) => {
              const score = dimScores[dim.id]
              const ml = score !== undefined ? getMaturityLevel(score) : null
              const barColor = score !== undefined
                ? score >= 4 ? '#10b981' : score >= 3 ? '#f59e0b' : '#ef4444'
                : '#e2e8f0'
              return (
                <div key={dim.id}>
                  <div className="flex items-start justify-between mb-1.5 gap-3">
                    <span className="text-sm font-medium text-slate-700 break-words">{dim.label}</span>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      {ml && <span className={`text-xs ${ml.color} hidden sm:inline whitespace-nowrap`}>{ml.label}</span>}
                      <span className="text-sm font-bold text-slate-900 text-right">
                        {score !== undefined ? score.toFixed(1) : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden" role="progressbar"
                       aria-valuenow={score} aria-valuemin={0} aria-valuemax={5}
                       aria-label={`${dim.label}: ${score?.toFixed(1) ?? 'nicht bewertet'} von 5`}>
                    <div className="h-full rounded-full animate-grow-width"
                         style={{ width: `${((score ?? 0) / 5) * 100}%`, background: barColor, '--bar-i': barIndex } as React.CSSProperties} />
                  </div>
                  {score !== undefined && score < 2.5 && (
                    <div className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                      <span>⚠</span> Prioritäres Handlungsfeld
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Recommendations based on weakest dims */}
        <div className="bg-primary-soft border border-primary-border rounded-2xl p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Top Handlungsempfehlungen</h3>
          <div className="space-y-2">
            {Object.entries(dimScores)
              .sort(([, a], [, b]) => a - b)
              .slice(0, 3)
              .map(([dimId, score]) => {
                const dim = ASSESSMENT_DIMENSIONS.find(d => d.id === dimId)!
                return (
                  <div key={dimId} className="flex gap-3 text-sm">
                    <span className="text-primary shrink-0 mt-0.5">→</span>
                    <span className="text-slate-700">
                      <strong>{dim.label}</strong> ({score.toFixed(1)}/5): {
                        dimId === 'data' ? 'Data-Governance-Initiative starten, Masterdatenmodell definieren' :
                        dimId === 'skills' ? 'AI-Upskilling-Programm aufsetzen, AI-Champions benennen' :
                        dimId === 'governance' ? 'AI-Policy und RACI in den nächsten 4 Wochen dokumentieren' :
                        dimId === 'tech' ? 'API-Strategie für Kernsysteme entwickeln, Cloud-Readiness prüfen' :
                        dimId === 'strategy' ? 'AI-Strategie im nächsten Board-Meeting verabschieden' :
                        'Executive-Sponsorship sichern, AI-Kulturprogramm starten'
                      }
                    </span>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button onClick={handleSave} disabled={saving || saved}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              saved
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 focus:ring-emerald-500'
                : 'bg-slate-900 text-white hover:bg-slate-700 focus:ring-slate-500'
            }`}>
            {saved ? '✓ Gespeichert' : saving ? 'Wird gespeichert…' : '💾 Ergebnis speichern'}
            {tier === 'free' && !saved && <span className="text-xs opacity-60 ml-1">Pro</span>}
          </button>

          <button onClick={handleExportPDF}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-slate-300 text-slate-700 hover:border-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">
            📄 PDF exportieren
            {tier === 'free' && <span className="text-xs text-primary ml-1">Pro</span>}
          </button>

          <button onClick={onRestart}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
            ↺ Neu starten
          </button>
        </div>

        <FeedbackWidget module="assessment" />
      </div>
    </>
  )
}

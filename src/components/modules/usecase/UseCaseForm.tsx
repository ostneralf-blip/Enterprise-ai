'use client'
import { useState } from 'react'
import { CRITERIA, DOMAINS, calcWeightedScore, deriveQuadrant, QUADRANT_META } from '@/config/usecase-data'
import type { UseCase, UseCaseWeights } from '@/types'

interface UseCaseFormProps {
  weights: UseCaseWeights
  editing?: UseCase | null
  onSave: (data: { name: string; domain: string | null; description: string | null; scores: Record<string, number> }) => Promise<void>
  onCancel: () => void
}

const DEFAULT_SCORES: Record<string, number> = { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 }

export function UseCaseForm({ weights, editing, onSave, onCancel }: UseCaseFormProps) {
  const [name, setName] = useState(editing?.name ?? '')
  const [domain, setDomain] = useState(editing?.domain ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [scores, setScores] = useState<Record<string, number>>(editing?.scores ?? DEFAULT_SCORES)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const preview = calcWeightedScore(scores, weights)
  const quadrant = deriveQuadrant(scores)
  const qMeta = QUADRANT_META[quadrant]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name ist erforderlich.'); return }
    setSaving(true)
    setError('')
    try {
      await onSave({ name: name.trim(), domain: domain || null, description: description || null, scores })
    } catch {
      setError('Fehler beim Speichern — bitte erneut versuchen.')
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-4">
      <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">
        {editing ? 'Use Case bearbeiten' : 'Neuer Use Case'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} required placeholder="z. B. KI-gestützter Kundenservice"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 transition-colors" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="uc-domain" className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Bereich</label>
            <select id="uc-domain" value={domain} onChange={e => setDomain(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500 transition-colors bg-white">
              <option value="">Kein Bereich</option>
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Beschreibung</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Bewertung (1 = niedrig · 5 = hoch)</label>
          <div className="space-y-3" role="group" aria-label="Kriterien bewerten">
            {CRITERIA.map(c => (
              <div key={c.id} className="flex items-center gap-3 min-w-0">
                <span className="text-xs text-slate-600 w-32 shrink-0 leading-tight">{c.label}</span>
                <div className="flex gap-1.5" role="group" aria-label={c.label}>
                  {[1, 2, 3, 4, 5].map(v => (
                    <button key={v} type="button" onClick={() => setScores(s => ({ ...s, [c.id]: v }))}
                      aria-pressed={scores[c.id] === v}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        scores[c.id] === v ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm ${
          qMeta.color === 'emerald' ? 'bg-emerald-50 border-emerald-200' :
          qMeta.color === 'blue'    ? 'bg-blue-50 border-blue-200' :
          qMeta.color === 'amber'   ? 'bg-amber-50 border-amber-200' :
          'bg-slate-50 border-slate-200'
        }`}>
          <span>{qMeta.icon}</span>
          <span className="font-medium">{preview.toFixed(2)} / 5</span>
          <span className="text-slate-500">— {qMeta.label}: {qMeta.desc}</span>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel}
            className="px-4 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap">
            Abbrechen
          </button>
          <button type="submit" disabled={saving}
            className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            {saving ? 'Wird gespeichert…' : editing ? 'Aktualisieren' : 'Use Case hinzufügen'}
          </button>
        </div>
      </form>
    </div>
  )
}

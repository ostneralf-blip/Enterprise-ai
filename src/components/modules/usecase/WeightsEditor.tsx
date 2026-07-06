'use client'
import { useState } from 'react'
import { CRITERIA } from '@/config/usecase-data'
import type { UseCaseWeights } from '@/types'

interface WeightsEditorProps {
  weights: UseCaseWeights
  onSave: (w: UseCaseWeights) => Promise<void>
  onClose: () => void
}

export function WeightsEditor({ weights, onSave, onClose }: WeightsEditorProps) {
  const [pct, setPct] = useState<Record<string, number>>(
    Object.fromEntries(CRITERIA.map(c => [c.id, Math.round(weights[c.id] * 100)]))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const total = Object.values(pct).reduce((a, b) => a + b, 0)
  const valid = total === 100

  const handleChange = (id: string, val: number) => {
    setPct(prev => ({ ...prev, [id]: Math.max(0, Math.min(100, val)) }))
    setError('')
  }

  const handleSave = async () => {
    if (!valid) { setError('Die Gewichte müssen genau 100 % ergeben.'); return }
    setSaving(true)
    const w = Object.fromEntries(CRITERIA.map(c => [c.id, pct[c.id] / 100])) as UseCaseWeights
    await onSave(w)
    setSaving(false)
    onClose()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900">Gewichtungen anpassen</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none" aria-label="Schließen">×</button>
      </div>

      <div className="space-y-3 mb-4">
        {CRITERIA.map(c => (
          <div key={c.id} className="flex items-center gap-3 min-w-0">
            <span className="text-sm text-slate-600 w-36 shrink-0">{c.label}</span>
            <div className="flex-1 min-w-0">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(pct[c.id] ?? 0, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="number" min={0} max={100} value={pct[c.id] ?? 0}
                onChange={e => handleChange(c.id, parseInt(e.target.value) || 0)}
                className="w-14 text-sm text-right border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-primary-ring"
                aria-label={`${c.label} Gewichtung`}
              />
              <span className="text-xs text-slate-400 w-4">%</span>
            </div>
          </div>
        ))}
      </div>

      <div className={`text-sm font-medium mb-3 ${valid ? 'text-emerald-600' : 'text-red-500'}`}>
        Gesamt: {total} % {valid ? '✓' : `(${total > 100 ? '+' : ''}${total - 100} %)`}
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button onClick={onClose}
          className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap">
          Abbrechen
        </button>
        <button onClick={handleSave} disabled={saving || !valid}
          className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary disabled:opacity-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2">
          {saving ? 'Wird gespeichert…' : 'Speichern & neu berechnen'}
        </button>
      </div>
    </div>
  )
}

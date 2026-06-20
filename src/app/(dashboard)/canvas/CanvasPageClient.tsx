'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CANVAS_FIELDS } from '@/config/canvas-data'
import type { Canvas, Archetype } from '@/types'

const ARCHETYPE_BTNS: { id: Archetype; label: string }[] = [
  { id: 'starter', label: 'AI Starter' },
  { id: 'scaler', label: 'AI Scaler' },
  { id: 'transformer', label: 'AI Transformer' },
]

interface Props {
  initialCanvases: Canvas[]
}

export function CanvasPageClient({ initialCanvases }: Props) {
  const [canvases, setCanvases] = useState<Canvas[]>(initialCanvases)
  const [active, setActive] = useState<Canvas | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleCreate = async () => {
    const res = await fetch('/api/canvas', { method: 'POST' })
    if (!res.ok) return
    const { data } = await res.json() as { data: Canvas }
    setCanvases(prev => [data, ...prev])
    setActive(data)
  }

  const handleSave = async () => {
    if (!active) return
    setSaving(true)
    const res = await fetch(`/api/canvas/${active.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: active.title, archetype: active.archetype, data: active.data }),
    })
    setSaving(false)
    if (res.ok) {
      const { data: updated } = await res.json() as { data: Canvas }
      setCanvases(prev => prev.map(c => c.id === updated.id ? updated : c))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/canvas/${id}`, { method: 'DELETE' })
    setCanvases(prev => prev.filter(c => c.id !== id))
    if (active?.id === id) setActive(null)
  }

  if (active) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => setActive(null)}
            className="text-sm text-slate-500 hover:text-slate-700 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
          >
            ← Zurück
          </button>
          <input
            value={active.title}
            onChange={e => setActive(prev => prev ? { ...prev, title: e.target.value } : prev)}
            className="flex-1 min-w-0 text-xl font-semibold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-400 focus:outline-none transition-colors"
            aria-label="Canvas-Titel"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {saved ? '✓ Gespeichert' : saving ? 'Speichern…' : 'Speichern'}
          </button>
        </div>

        <div className="flex gap-2 mb-5" role="group" aria-label="Unternehmensarchetyp">
          {ARCHETYPE_BTNS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActive(prev => prev ? { ...prev, archetype: id } : prev)}
              aria-pressed={active.archetype === id}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                active.archetype === id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CANVAS_FIELDS.map(field => (
            <section
              key={field.id}
              aria-labelledby={`canvas-field-${field.id}`}
              className="bg-white border border-slate-200 rounded-2xl p-4"
            >
              <label
                id={`canvas-field-${field.id}`}
                htmlFor={`canvas-input-${field.id}`}
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1"
              >
                {field.label}
              </label>
              <p className="text-xs text-slate-400 mb-2">{field.description}</p>
              <textarea
                id={`canvas-input-${field.id}`}
                value={active.data[field.id]}
                onChange={e => setActive(prev => {
                  if (!prev) return prev
                  return { ...prev, data: { ...prev.data, [field.id]: e.target.value } }
                })}
                placeholder={field.placeholder}
                rows={4}
                className="w-full text-sm text-slate-800 placeholder-slate-300 resize-none focus:outline-none"
              />
            </section>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500">
          {canvases.length === 0 ? 'Noch kein Canvas erstellt' : `${canvases.length} Canvas${canvases.length !== 1 ? 'se' : ''}`}
        </p>
        <button
          onClick={handleCreate}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-500 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + Neues Canvas
        </button>
      </div>

      {canvases.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="text-3xl mb-3 text-slate-300" aria-hidden="true">□</div>
          <p className="text-slate-500 text-sm mb-4">
            Strukturiertes Template für neue AI-Initiativen — 8 Felder, vom Problem bis zu den nächsten Schritten.
          </p>
          <button
            onClick={handleCreate}
            className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-500 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Canvas erstellen
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
          {canvases.map(canvas => (
            <li key={canvas.id}>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition-colors">
                <p className="text-sm font-semibold text-slate-900 truncate min-w-0 mb-1">{canvas.title}</p>
                {canvas.archetype && (
                  <p className="text-xs text-slate-400 mb-1 capitalize">{canvas.archetype}</p>
                )}
                <p className="text-xs text-slate-300 mb-3">
                  {new Date(canvas.updated_at).toLocaleDateString('de-DE')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActive(canvas)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  >
                    Öffnen
                  </button>
                  <button
                    onClick={() => handleDelete(canvas.id)}
                    aria-label={`${canvas.title} löschen`}
                    className="px-3 py-1.5 text-xs border border-red-100 rounded-lg text-red-400 hover:bg-red-50 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                  >
                    ×
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

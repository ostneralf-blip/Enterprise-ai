'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CHANGELOG } from '@/config/changelog'

const CATEGORIES = [
  { value: 'bug',     label: 'Fehler melden' },
  { value: 'feature', label: 'Feature-Wunsch' },
  { value: 'frage',   label: 'Frage / Support' },
  { value: 'sonstiges', label: 'Sonstiges' },
]

export default function FeedbackPage() {
  const router = useRouter()
  const [category, setCategory] = useState('frage')
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null)
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null)
  const [message,  setMessage]  = useState('')
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) { setError('Bitte eine Nachricht eingeben.'); return }
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message: message.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler beim Senden')
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-xl space-y-10">
      <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Feedback & Support</h1>
        <p className="text-sm text-slate-500 mt-1">Fehler melden, Feature-Wünsche einreichen oder eine Frage stellen.</p>
      </div>

      {sent ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-3">
          <div className="text-3xl">✓</div>
          <p className="text-sm font-semibold text-emerald-800">Vielen Dank für Ihr Feedback!</p>
          <p className="text-xs text-emerald-700">Wir haben Ihre Nachricht erhalten und melden uns bei Bedarf.</p>
          <button
            onClick={() => { setSent(false); setMessage(''); setCategory('frage') }}
            className="text-xs text-emerald-700 hover:text-emerald-900 underline"
          >
            Weiteres Feedback senden
          </button>
          <div>
            <button
              onClick={() => router.back()}
              className="mt-2 px-4 py-2 text-sm font-medium bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              Zurück
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
          {error && (
            <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="fb-category" className="block text-sm font-medium text-slate-700 mb-1.5">
              Kategorie
            </label>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Feedback-Kategorie">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  aria-pressed={category === c.value}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    category === c.value
                      ? 'bg-primary border-blue-600 text-white font-medium'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="fb-message" className="block text-sm font-medium text-slate-700 mb-1.5">
              Nachricht
            </label>
            <textarea
              id="fb-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={6}
              placeholder={
                category === 'bug'
                  ? 'Beschreiben Sie den Fehler — was haben Sie getan, was ist passiert, was hätte passieren sollen?'
                  : category === 'feature'
                  ? 'Welches Feature wünschen Sie sich? Warum wäre es hilfreich?'
                  : 'Wie können wir helfen?'
              }
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring resize-y"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="whitespace-nowrap px-5 py-2.5 bg-primary hover:bg-primary disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {sending ? 'Wird gesendet…' : 'Absenden'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="whitespace-nowrap px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}
    </div>

      {/* ── Versions-Changelog ── */}
      <div>
        <div className="mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">Versions-Übersicht</h2>
          <p className="text-sm text-slate-500 mt-1">Alle Features mit Hintergrund aus dem Enterprise AI Leitfaden.</p>
        </div>
        <div className="space-y-2">
          {CHANGELOG.map(entry => {
            const isOpen = expandedVersion === entry.version
            return (
              <div key={entry.version} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedVersion(isOpen ? null : entry.version)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-semibold text-primary-hover bg-primary-soft border border-blue-100 rounded px-1.5 py-0.5 shrink-0">
                      v{entry.version}
                    </span>
                    <span className="text-sm font-medium text-slate-800 min-w-0 truncate">{entry.label}</span>
                    <span className="text-xs text-slate-400 hidden sm:block shrink-0">{entry.date}</span>
                  </div>
                  <span className="text-slate-400 shrink-0 ml-2" aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 px-4 py-3 space-y-2">
                    {entry.features.map(feature => {
                      const featureKey = `${entry.version}:${feature.title}`
                      const featureOpen = expandedFeature === featureKey
                      return (
                        <div key={feature.title} className="rounded-lg border border-slate-100 overflow-hidden">
                          <button
                            onClick={() => setExpandedFeature(featureOpen ? null : featureKey)}
                            aria-expanded={featureOpen}
                            className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                          >
                            <span className="text-sm font-medium text-slate-700">{feature.title}</span>
                            <span className="text-xs text-slate-400 shrink-0 ml-2" aria-hidden="true">
                              {featureOpen ? '−' : '+'}
                            </span>
                          </button>
                          {featureOpen && (
                            <div className="px-3 pb-3 space-y-3 border-t border-slate-100 pt-3">
                              <p className="text-sm text-slate-600">{feature.description}</p>
                              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                                <p className="text-xs font-semibold text-amber-800 mb-1">📖 Aus dem Enterprise AI Leitfaden</p>
                                <p className="text-xs text-amber-900 leading-relaxed">{feature.bookContext}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

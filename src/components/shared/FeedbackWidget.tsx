'use client'
import { useState } from 'react'
import { track } from '@/lib/posthog/client'
import type { ModuleId } from '@/types'

interface FeedbackWidgetProps {
  module: ModuleId
}

export function FeedbackWidget({ module }: FeedbackWidgetProps) {
  const [sentiment, setSentiment] = useState<'positive' | 'negative' | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (s: 'positive' | 'negative') => {
    setSentiment(s)
    if (!comment && s !== null) {
      await submit(s, '')
    }
  }

  const submit = async (s: 'positive' | 'negative', c: string) => {
    setLoading(true)
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module, sentiment: s, comment: c }),
    })
    track('feedback_submitted', { module, sentiment: s })
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="text-center py-4 text-sm text-slate-500">
        ✓ Danke für Ihr Feedback!
      </div>
    )
  }

  return (
    <div className="border-t border-slate-200 pt-6 mt-6">
      <p className="text-sm text-slate-500 mb-3 text-center">War dieses Tool hilfreich?</p>
      {!sentiment ? (
        <div className="flex justify-center gap-3">
          <button onClick={() => handleSubmit('positive')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition-colors">
            👍 Ja, hilfreich
          </button>
          <button onClick={() => setSentiment('negative')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-100 transition-colors">
            👎 Verbesserungsbedarf
          </button>
        </div>
      ) : sentiment === 'negative' ? (
        <div className="max-w-sm mx-auto">
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Was hätten Sie sich gewünscht? (Optional)"
            rows={3}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 resize-none mb-2"
          />
          <button onClick={() => submit('negative', comment)} disabled={loading}
            className="w-full bg-slate-800 text-white text-sm py-2 rounded-lg hover:bg-slate-700 transition-colors">
            {loading ? 'Wird gesendet…' : 'Feedback senden'}
          </button>
        </div>
      ) : null}
    </div>
  )
}

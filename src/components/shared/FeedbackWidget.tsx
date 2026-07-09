'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { track } from '@/lib/posthog/client'
import type { ModuleId } from '@/types'

interface FeedbackWidgetProps {
  module: ModuleId
}

export function FeedbackWidget({ module }: FeedbackWidgetProps) {
  const t = useTranslations('feedback')
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
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, sentiment: s, comment: c }),
      })
      track('feedback_submitted', { module, sentiment: s })
    } catch {
      // Netzwerkfehler still ignorieren — UI trotzdem als "gesendet" markieren
    }
    setSubmitted(true)
    setLoading(false)
  }

  // whitespace-nowrap verhindert, dass unterschiedlich lange Button-Texte
  // bei begrenzter Breite (z.B. flex-1 auf Mobile) unterschiedlich umbrechen
  // und dadurch optisch verschieden hohe Buttons erzeugen.
  const buttonBase = "flex items-center justify-center gap-2 flex-1 px-3 sm:px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"

  if (submitted) {
    return (
      <div className="text-center py-4 text-sm text-slate-500">
        {t('thanks')}
      </div>
    )
  }

  return (
    <div className="border-t border-slate-200 pt-6 mt-6">
      <p className="text-sm text-slate-500 mb-3 text-center">{t('question')}</p>
      {!sentiment ? (
        <div className="flex justify-center gap-2 sm:gap-3">
          <button onClick={() => handleSubmit('positive')}
            className={`${buttonBase} bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-400`}>
            {t('positive')}
          </button>
          <button onClick={() => setSentiment('negative')}
            className={`${buttonBase} bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 focus:ring-slate-400`}>
            {t('negative')}
          </button>
        </div>
      ) : sentiment === 'negative' ? (
        <div className="max-w-sm mx-auto">
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            placeholder={t('placeholder')}
            rows={3}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary-ring resize-none mb-2"
          />
          <button onClick={() => submit('negative', comment)} disabled={loading}
            className={`${buttonBase} w-full bg-slate-800 text-white hover:bg-slate-700 focus:ring-slate-500 disabled:opacity-60`}>
            {loading ? t('sending') : t('send')}
          </button>
        </div>
      ) : null}
    </div>
  )
}

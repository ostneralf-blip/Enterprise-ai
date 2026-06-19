'use client'
import { useState } from 'react'
import { track } from '@/lib/posthog/client'

const FEATURES = [
  'PDF-Export aller Ergebnisse',
  'Ergebnisse speichern & versionieren',
  'Link-Sharing mit Ablaufdatum',
  'Deep Assessment (42 Fragen)',
  'Compliance Center (vollständig)',
  'Architektur-Generator Wizard',
  'Unbegrenzte Use-Cases im Portfolio',
  'Dark Mode',
]

export function UpgradePageClient() {
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null)
  const [error, setError] = useState('')

  const handleUpgrade = async (interval: 'monthly' | 'yearly') => {
    setLoading(interval)
    setError('')
    track('upgrade_clicked', { feature: 'upgrade_page', interval })

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Checkout konnte nicht gestartet werden. Bitte erneut versuchen.')
        setLoading(null)
      }
    } catch {
      setError('Ein Fehler ist aufgetreten. Bitte erneut versuchen.')
      setLoading(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <div className="text-3xl mb-3">⬡</div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Upgrade auf Professional</h1>
        <p className="text-slate-500">Alle 7 Tools, unbegrenzt speichern, PDF-Export und mehr.</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-8">
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map(f => (
            <div key={f} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="text-emerald-500">✓</span> {f}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleUpgrade('monthly')}
          disabled={loading !== null}
          className="border-2 border-slate-200 hover:border-blue-400 rounded-2xl p-6 text-center transition-all disabled:opacity-50"
        >
          <div className="text-3xl font-semibold text-slate-900 mb-1">€49</div>
          <div className="text-sm text-slate-500 mb-4">pro Monat</div>
          <div className="text-sm font-medium text-blue-600">
            {loading === 'monthly' ? 'Wird geladen…' : 'Monatlich upgraden →'}
          </div>
        </button>

        <button
          onClick={() => handleUpgrade('yearly')}
          disabled={loading !== null}
          className="border-2 border-blue-500 bg-blue-50 rounded-2xl p-6 text-center transition-all disabled:opacity-50 relative"
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            2 Monate gratis
          </div>
          <div className="text-3xl font-semibold text-slate-900 mb-1">€399</div>
          <div className="text-sm text-slate-500 mb-4">pro Jahr</div>
          <div className="text-sm font-medium text-blue-600">
            {loading === 'yearly' ? 'Wird geladen…' : 'Jährlich upgraden →'}
          </div>
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 mt-6">
        Jederzeit kündbar. Zahlung sicher über Stripe. EU-Mehrwertsteuer wird automatisch berechnet.
      </p>
    </div>
  )
}

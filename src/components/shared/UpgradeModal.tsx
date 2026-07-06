'use client'
import { useState } from 'react'
import { track } from '@/lib/posthog/client'

interface UpgradeModalProps {
  feature: string
  onClose: () => void
}

export function UpgradeModal({ feature, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async (interval: 'monthly' | 'yearly') => {
    setLoading(true)
    track('upgrade_clicked', { feature, interval })

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="text-3xl mb-3">⬡</div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Upgrade auf Professional</h2>
          <p className="text-slate-500 text-sm">
            <strong className="text-slate-700">{feature}</strong> ist im Professional Plan verfügbar.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {['PDF-Export aller Ergebnisse', 'Ergebnisse speichern & versionieren', 'Link-Sharing', 'Deep Assessment (42 Fragen)', 'Compliance Center (vollständig)', 'Architektur-Generator Wizard'].map(f => (
            <div key={f} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="text-emerald-500">✓</span> {f}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleUpgrade('monthly')} disabled={loading}
            className="border border-slate-200 hover:border-blue-400 rounded-xl p-4 text-center transition-all">
            <div className="font-semibold text-slate-900">€49</div>
            <div className="text-xs text-slate-500">pro Monat</div>
          </button>
          <button onClick={() => handleUpgrade('yearly')} disabled={loading}
            className="bg-primary hover:bg-primary rounded-xl p-4 text-center transition-all">
            <div className="font-semibold text-white">€399</div>
            <div className="text-xs text-blue-200">pro Jahr · 2 Monate gratis</div>
          </button>
        </div>

        <button onClick={onClose} className="w-full text-center text-xs text-slate-400 hover:text-slate-600 mt-4 transition-colors">
          Vielleicht später
        </button>
      </div>
    </div>
  )
}

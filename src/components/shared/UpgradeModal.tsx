'use client'
import { useState, useEffect } from 'react'
import { track } from '@/lib/posthog/client'
import type { PricingData } from '@/app/api/pricing/route'

interface UpgradeModalProps {
  feature: string
  onClose: () => void
}

export function UpgradeModal({ feature, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)
  const [pricing, setPricing] = useState<PricingData | null>(null)

  useEffect(() => {
    fetch('/api/pricing').then(r => r.json()).then(setPricing).catch(() => null)
  }, [])

  const monthly = pricing?.monthly ?? 49
  const yearly = pricing?.yearly ?? 399
  const currency = pricing?.currency ?? 'EUR'
  const promo = pricing?.promotion ?? null
  const fmt = (n: number) => `${currency === 'EUR' ? '€' : currency}${n}`

  const handleUpgrade = async (interval: 'monthly' | 'yearly') => {
    setLoading(true)
    track('upgrade_clicked', { feature, interval, promo: promo?.name ?? null })
    const priceId = promo
      ? (interval === 'yearly' ? (promo.stripe_price_id_yearly ?? undefined) : (promo.stripe_price_id ?? undefined))
      : (interval === 'yearly' ? (pricing?.stripe_price_id_yearly ?? undefined) : (pricing?.stripe_price_id ?? undefined))
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval, confirmed_withdrawal_waiver: true, ...(priceId ? { price_id: priceId } : {}) }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-6">
          {promo && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-3">
              <span>✦</span>
              {promo.badge_text}
            </div>
          )}
          <div className="text-3xl mb-3">⬡</div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Upgrade auf Professional</h2>
          <p className="text-slate-500 text-sm">
            <strong className="text-slate-700">{feature}</strong> ist im Professional Plan verfügbar.
          </p>
          {promo?.description && (
            <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5">{promo.description}</p>
          )}
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
            className="border border-slate-200 hover:border-slate-300 rounded-xl p-4 text-center transition-all">
            {promo ? (
              <>
                <div className="text-xs text-slate-400 line-through">{fmt(monthly)}</div>
                <div className="font-semibold text-amber-700">{fmt(promo.promo_price)}</div>
              </>
            ) : (
              <div className="font-semibold text-slate-900">{fmt(monthly)}</div>
            )}
            <div className="text-xs text-slate-500">pro Monat</div>
          </button>
          <button onClick={() => handleUpgrade('yearly')} disabled={loading}
            className="bg-primary hover:bg-primary/90 rounded-xl p-4 text-center transition-all">
            {promo?.promo_price_yearly ? (
              <>
                <div className="text-xs text-white/50 line-through">{fmt(yearly)}</div>
                <div className="font-semibold text-white">{fmt(promo.promo_price_yearly)}</div>
              </>
            ) : (
              <div className="font-semibold text-white">{fmt(yearly)}</div>
            )}
            <div className="text-xs text-white/70">pro Jahr · 2 Monate gratis</div>
          </button>
        </div>

        {promo?.valid_until && (
          <p className="text-center text-xs text-amber-600 mt-3">
            Aktion gültig bis {new Date(promo.valid_until).toLocaleDateString('de-DE')}
          </p>
        )}

        <button onClick={onClose} className="w-full text-center text-xs text-slate-400 hover:text-slate-600 mt-4 transition-colors">
          Vielleicht später
        </button>
      </div>
    </div>
  )
}

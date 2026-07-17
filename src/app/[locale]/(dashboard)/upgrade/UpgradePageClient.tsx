'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { track } from '@/lib/posthog/client'
import type { PricingData } from '@/app/api/pricing/route'
import { AlertBox } from '@/components/shared/AlertBox'

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

interface Props { pricing: PricingData }

export function UpgradePageClient({ pricing }: Props) {
  const t = useTranslations('upgrade')
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null)
  const [error, setError] = useState('')
  const [withdrawalWaiver, setWithdrawalWaiver] = useState(false)
  const [waiverError, setWaiverError] = useState(false)

  const { monthly, yearly, currency, promotion: promo } = pricing
  const fmt = (n: number) => `${currency === 'EUR' ? '€' : currency}${n}`

  const handleUpgrade = async (interval: 'monthly' | 'yearly') => {
    if (!withdrawalWaiver) { setWaiverError(true); return }
    setWaiverError(false)
    setLoading(interval)
    setError('')
    track('upgrade_clicked', { feature: 'upgrade_page', interval, promo: promo?.name ?? null })

    const priceId = promo
      ? (interval === 'yearly' ? (promo.stripe_price_id_yearly ?? undefined) : (promo.stripe_price_id ?? undefined))
      : (interval === 'yearly' ? (pricing.stripe_price_id_yearly ?? undefined) : (pricing.stripe_price_id ?? undefined))

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval, confirmed_withdrawal_waiver: true, ...(priceId ? { price_id: priceId } : {}) }),
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
        {promo && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-warning-subtle text-warning-text border border-warning-border mb-4">
            <span>✦</span>
            {promo.badge_text}
          </div>
        )}
        <div className="text-3xl mb-3">⬡</div>
        <h1 className="text-2xl font-semibold font-serif text-ink mb-2">Upgrade auf Professional</h1>
        <p className="text-ink-muted">Alle 7 Tools, unbegrenzt speichern, PDF-Export und mehr.</p>
        {promo?.description && (
          <p className="mt-3 text-sm text-warning-text bg-warning-subtle border border-warning-border rounded-xl px-4 py-2 inline-block">{promo.description}</p>
        )}
      </div>

      {error && (
        <AlertBox variant="error" className="mb-6">{error}</AlertBox>
      )}

      <div className="bg-surface border border-line rounded-2xl p-8 mb-8">
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map(f => (
            <div key={f} className="flex items-center gap-2 text-sm text-ink-secondary">
              <span className="text-emerald-500">✓</span> {f}
            </div>
          ))}
        </div>
      </div>

      {/* § 356a BGB — Widerrufsrechtsverzicht */}
      <div className={`mb-6 p-4 border rounded-xl ${waiverError ? 'border-error-border bg-error-subtle' : 'border-line bg-surface-raised'}`}>
        <label className="flex gap-3 cursor-pointer">
          <input type="checkbox" checked={withdrawalWaiver}
            onChange={e => { setWithdrawalWaiver(e.target.checked); if (e.target.checked) setWaiverError(false) }}
            className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-line-strong text-primary focus:ring-primary" />
          <span className="text-xs text-ink-secondary leading-relaxed">{t('withdrawalWaiverLabel')}</span>
        </label>
        {waiverError && <p className="mt-2 text-xs text-error-text pl-7">{t('withdrawalWaiverRequired')}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => handleUpgrade('monthly')} disabled={loading !== null}
          className="border-2 border-line hover:border-primary-ring rounded-2xl p-6 text-center transition-all disabled:opacity-50">
          {promo ? (
            <>
              <div className="text-sm text-ink-subtle line-through mb-0.5">{fmt(monthly)}</div>
              <div className="text-3xl font-semibold text-warning-text mb-1">{fmt(promo.promo_price)}</div>
            </>
          ) : (
            <div className="text-3xl font-semibold text-ink mb-1">{fmt(monthly)}</div>
          )}
          <div className="text-sm text-ink-muted mb-4">pro Monat</div>
          <div className="text-sm font-medium text-primary">
            {loading === 'monthly' ? 'Wird geladen…' : 'Monatlich upgraden →'}
          </div>
        </button>

        <button onClick={() => handleUpgrade('yearly')} disabled={loading !== null}
          className="border-2 border-primary-ring bg-primary-soft rounded-2xl p-6 text-center transition-all disabled:opacity-50 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
            2 Monate gratis
          </div>
          {promo?.promo_price_yearly ? (
            <>
              <div className="text-sm text-ink-subtle line-through mb-0.5">{fmt(yearly ?? 399)}</div>
              <div className="text-3xl font-semibold text-warning-text mb-1">{fmt(promo.promo_price_yearly)}</div>
            </>
          ) : (
            <div className="text-3xl font-semibold text-ink mb-1">{fmt(yearly ?? 399)}</div>
          )}
          <div className="text-sm text-ink-muted mb-4">pro Jahr</div>
          <div className="text-sm font-medium text-primary">
            {loading === 'yearly' ? 'Wird geladen…' : 'Jährlich upgraden →'}
          </div>
        </button>
      </div>

      {promo?.valid_until && (
        <p className="text-center text-sm text-warning-text mt-4">
          Aktion gültig bis {new Date(promo.valid_until).toLocaleDateString('de-DE')}
        </p>
      )}

      <p className="text-center text-xs text-ink-subtle mt-6">
        Jederzeit kündbar. Zahlung sicher über Stripe. EU-Mehrwertsteuer wird automatisch berechnet.
      </p>
    </div>
  )
}

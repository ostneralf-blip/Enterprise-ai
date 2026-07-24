'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

// In-App-Hinweis, wenn eine Zahlung fehlgeschlagen ist (subscription_status =
// 'past_due', gesetzt vom Stripe-Webhook bei invoice.payment_failed). Bisher gab
// es nur die Resend-E-Mail — der Nutzer sah in der App nichts. Führt direkt ins
// Stripe-Kundenportal zur Aktualisierung der Zahlungsmethode.
export function SubscriptionBanner({ status }: { status: string | null | undefined }) {
  const t = useTranslations('settings')
  const [loading, setLoading] = useState(false)

  if (status !== 'past_due') return null

  const openPortal = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
      else setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div
      role="alert"
      className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-error-border bg-error-subtle px-4 py-3"
    >
      <p className="text-sm text-error-text min-w-0 flex-1">{t('paymentFailedBanner')}</p>
      <button
        onClick={openPortal}
        disabled={loading}
        className="whitespace-nowrap rounded-lg bg-error-text px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 self-start sm:self-auto"
      >
        {t('updatePaymentButton')}
      </button>
    </div>
  )
}

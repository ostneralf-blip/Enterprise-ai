import type { Locale } from '@/i18n/routing'

const DATE_FORMATS: Record<Locale, Intl.DateTimeFormatOptions> = {
  de: { day: '2-digit', month: '2-digit', year: 'numeric' },
  en: { day: '2-digit', month: 'short',   year: 'numeric' },
}

export function formatDate(dateStr: string, locale: Locale = 'de'): string {
  return new Date(dateStr).toLocaleDateString(
    locale === 'de' ? 'de-DE' : 'en-GB',
    DATE_FORMATS[locale]
  )
}

// Dezimalkomma (DE) vs. Dezimalpunkt (EN) — betrifft Scores wie "3,1" vs "3.1"
export function formatScore(value: number, locale: Locale = 'de'): string {
  return value.toLocaleString(locale === 'de' ? 'de-DE' : 'en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatCurrency(amount: number, locale: Locale = 'de'): string {
  return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

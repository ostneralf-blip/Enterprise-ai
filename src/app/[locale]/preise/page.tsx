import Link from 'next/link'
import type { Metadata } from 'next'
import { PRICING_GROUPS, type Bi, type PricingRow } from '@/config/leitfaden-data'
import { TIER_CONFIG } from '@/config/tiers'
import { PublicNav } from '@/components/shared/PublicNav'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isEn = locale === 'en'
  const prefix = isEn ? '/en' : ''
  const canonical = `${BASE}${prefix}/preise`
  return {
    title: isEn ? 'Pricing — AI Navigator' : 'Preise — AI Navigator',
    description: isEn
      ? 'Free Explorer plan vs. Professional at €49/month — compare every tool and feature side by side.'
      : 'Kostenloser Explorer-Plan vs. Professional für 49 €/Monat — alle Werkzeuge und Funktionen im direkten Vergleich.',
    alternates: {
      canonical,
      languages: {
        de: `${BASE}/preise`,
        en: `${BASE}/en/preise`,
        'x-default': `${BASE}/preise`,
      },
    },
  }
}

function pick(locale: string, bi: Bi): string {
  return locale === 'en' ? bi.en : bi.de
}

function formatEuro(cents: number): string {
  return (cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function Cell({ value, note, locale }: { value: PricingRow['free']; note?: Bi; locale: string }) {
  if (value === 'yes') {
    return (
      <div className="flex flex-col items-center">
        <span className="text-primary text-lg leading-none">✓</span>
        {note && <span className="text-[11px] text-slate-500 mt-1">{pick(locale, note)}</span>}
      </div>
    )
  }
  if (value === 'no') {
    return <span className="text-slate-300 text-lg leading-none">–</span>
  }
  return <span className="text-slate-700 text-xs">{pick(locale, value)}</span>
}

export default async function PreisePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const isEn = locale === 'en'
  const prefix = isEn ? '/en' : ''
  const p = (bi: Bi) => pick(locale, bi)

  const pro = TIER_CONFIG.pro
  const monthlyPrice = pro.price ? formatEuro(pro.price.monthly) : '—'
  const yearlyPrice = pro.price ? formatEuro(pro.price.yearly) : '—'

  return (
    <div className="min-h-screen bg-ivory text-slate-900">
      <PublicNav locale={locale} />

      <div className="max-w-3xl mx-auto px-6 pt-16 pb-10 text-center">
        <h1 className="text-4xl font-semibold font-serif leading-tight mb-4">
          {isEn ? 'Simple pricing, full transparency' : 'Einfache Preise, volle Transparenz'}
        </h1>
        <p className="text-slate-600 text-lg leading-relaxed">
          {isEn
            ? 'Start free. Upgrade to Professional whenever you need the full toolset.'
            : 'Kostenlos starten. Auf Professional upgraden, sobald Sie das volle Werkzeug brauchen.'}
        </p>
      </div>

      {/* Plan header cards */}
      <div className="max-w-3xl mx-auto px-6 pb-12">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="font-semibold text-lg mb-1">{TIER_CONFIG.free.name}</h2>
            <p className="text-3xl font-bold font-serif mb-1">€0</p>
            <p className="text-slate-500 text-xs mb-4">{isEn ? 'forever free' : 'dauerhaft kostenlos'}</p>
            <Link href={`${prefix}/register`} className="block text-center border border-slate-300 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors">
              {isEn ? 'Start free' : 'Kostenlos starten'}
            </Link>
          </div>
          <div className="bg-primary text-white rounded-2xl p-6 relative">
            <span className="absolute -top-3 left-6 bg-white text-primary text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">
              {isEn ? 'Most popular' : 'Am beliebtesten'}
            </span>
            <h2 className="font-semibold text-lg mb-1">{TIER_CONFIG.pro.name}</h2>
            <p className="text-3xl font-bold font-serif mb-1">
              €{monthlyPrice}<span className="text-base font-normal">/{isEn ? 'mo' : 'Monat'}</span>
            </p>
            <p className="text-white/70 text-xs mb-4">
              {isEn ? `or €${yearlyPrice}/year` : `oder €${yearlyPrice}/Jahr`}
            </p>
            <Link href={`${prefix}/register`} className="block text-center bg-white text-primary rounded-xl py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors">
              {isEn ? 'Upgrade to Pro' : 'Auf Pro upgraden'}
            </Link>
          </div>
        </div>
      </div>

      {/* Feature comparison */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        {PRICING_GROUPS.map((group) => (
          <div key={p(group.title)} className="mb-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">{p(group.title)}</h2>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
                <span>{isEn ? 'Feature' : 'Funktion'}</span>
                <span className="text-center w-16">{TIER_CONFIG.free.name}</span>
                <span className="text-center w-16">{TIER_CONFIG.pro.name}</span>
              </div>
              {group.rows.map((row) => (
                <div key={p(row.label)} className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 border-t border-slate-100 items-center">
                  <div>
                    <p className="text-sm text-slate-800">{p(row.label)}</p>
                    {row.why && <p className="text-xs text-slate-500 mt-0.5">{p(row.why)}</p>}
                  </div>
                  <div className="w-16 flex justify-center">
                    <Cell value={row.free} note={row.freeNote} locale={locale} />
                  </div>
                  <div className="w-16 flex justify-center">
                    <Cell value={row.pro} note={row.proNote} locale={locale} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Closing CTA */}
      <div className="bg-primary py-16 text-center text-white">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="text-2xl font-semibold font-serif mb-3">
            {isEn ? 'Ready to get started?' : 'Bereit loszulegen?'}
          </h2>
          <p className="text-white/80 mb-6 leading-relaxed text-sm">
            {isEn
              ? 'No credit card required for the free plan. Upgrade anytime.'
              : 'Keine Kreditkarte für den kostenlosen Plan nötig. Jederzeit upgradebar.'}
          </p>
          <Link href={`${prefix}/register`} className="inline-block bg-white text-primary font-semibold px-8 py-3 rounded-xl hover:bg-white/90 transition-colors text-sm">
            {isEn ? 'Start free' : 'Kostenlos starten'}
          </Link>
        </div>
      </div>

      <footer className="border-t border-slate-200 py-6 text-center text-slate-500 text-xs">
        © 2026 AI Navigator · enterprise-ai.biz ·{' '}
        <Link href={`${prefix}/datenschutz`} className="hover:text-slate-700">{isEn ? 'Privacy' : 'Datenschutz'}</Link> ·{' '}
        <Link href={`${prefix}/impressum`} className="hover:text-slate-700">{isEn ? 'Imprint' : 'Impressum'}</Link>
      </footer>
    </div>
  )
}

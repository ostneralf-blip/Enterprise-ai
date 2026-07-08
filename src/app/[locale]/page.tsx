import Link from 'next/link'
import type { Metadata } from 'next'
import { PaperNoise } from '@/components/shared/PaperNoise'
import { BrandWordcloud } from '@/components/shared/BrandWordcloud'
import { getTranslations } from 'next-intl/server'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'landing' })
  const isEn = locale === 'en'
  const canonical = isEn ? `${BASE}/en` : BASE
  return {
    title: isEn
      ? 'AI Navigator — Enterprise AI. Navigated with structure.'
      : 'AI Navigator — Enterprise AI. Strukturiert navigiert.',
    description: t('heroDesc'),
    openGraph: {
      type: 'website',
      locale: isEn ? 'en_GB' : 'de_DE',
      siteName: 'AI Navigator',
      url: canonical,
    },
    alternates: {
      canonical,
      languages: {
        'de': BASE,
        'en': `${BASE}/en`,
        'x-default': BASE,
      },
    },
  }
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('landing')
  const tc = await getTranslations('common')

  const stats = [
    { n: t('stat1n'), l: t('stat1l') },
    { n: t('stat2n'), l: t('stat2l') },
    { n: t('stat3n'), l: t('stat3l') },
  ]
  const trustItems = [
    { icon: '🇪🇺', label: t('trust1') },
    { icon: '🔒', label: t('trust2') },
    { icon: '🛡', label: t('trust3') },
    { icon: '💳', label: t('trust4') },
    { icon: '👁', label: t('trust5') },
  ]

  return (
    <div className="min-h-screen bg-ivory text-slate-900">
      <PaperNoise />
      {/* Nav */}
      <nav className="border-b border-slate-200 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-sm text-white">N</div>
          <span className="font-semibold">AI Navigator</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-slate-500 hover:text-slate-900 text-sm transition-colors">{tc('login')}</Link>
          <Link href="/register" className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            {tc('register')}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <BrandWordcloud />
      <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-block bg-primary-soft border border-primary-border text-primary tracking-widest text-xs font-semibold uppercase px-3 py-1 rounded-full mb-6">
          {t('eyebrow')}
        </div>
        <h1 className="text-5xl font-semibold font-serif leading-tight mb-6">
          {t('hero1')}<br />
          <span className="text-primary">{t('hero2')}</span>
        </h1>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
          {t('heroDesc')}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register"
            className="bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm">
            {t('cta1')}
          </Link>
          <Link href="/login" className="text-slate-600 hover:text-slate-900 text-sm transition-colors">
            {t('cta2')}
          </Link>
        </div>
      </div>
      </div>

      {/* Key Stats */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-3 gap-6 text-center">
          {stats.map(s => (
            <div key={s.n} className="bg-white border border-slate-200 rounded-xl py-6">
              <div className="text-3xl font-bold font-serif text-primary mb-1">{s.n}</div>
              <div className="text-slate-500 text-sm">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Bar */}
      <div className="border-t border-slate-200 bg-white py-5">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs text-slate-500 text-center mb-3 uppercase tracking-wide font-medium">{t('trustTitle')}</p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {trustItems.map(b => (
              <div key={b.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
          <p className="text-center mt-3">
            <Link href="/trust" className="text-xs text-slate-500 hover:text-slate-700 underline transition-colors">
              {t('trustLink')}
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-slate-500 text-xs">
        {t('footer')} ·{' '}
        <Link href="/datenschutz" className="hover:text-slate-700">{t('footerPrivacy')}</Link> ·{' '}
        <Link href="/impressum" className="hover:text-slate-700">{t('footerImprint')}</Link> ·{' '}
        <Link href="/trust" className="hover:text-slate-700">{t('footerSecurity')}</Link>
        {locale === 'en' && (
          <p className="mt-1 text-[10px] text-slate-400">{t('footerLegalNote')}</p>
        )}
      </footer>
    </div>
  )
}

import Link from 'next/link'
import type { Metadata } from 'next'
import { PaperNoise } from '@/components/shared/PaperNoise'
import { BrandWordcloud } from '@/components/shared/BrandWordcloud'
import { getTranslations } from 'next-intl/server'
import { PublicNav } from '@/components/shared/PublicNav'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isEn = locale === 'en'
  const canonical = isEn ? `${BASE}/en` : BASE
  return {
    title: {
      absolute: isEn
        ? 'AI Navigator — Enterprise AI. Navigated with structure.'
        : 'AI Navigator — Enterprise AI. Strukturiert navigiert.',
    },
    description: isEn
      ? 'A structured path to productive enterprise AI: readiness assessment, use-case prioritization, governance and EU AI Act compliance in one tool.'
      : 'Strukturiert zu produktiver Enterprise-KI: AI-Readiness-Assessment, Use-Case-Priorisierung, Governance und EU-AI-Act-Compliance in einem Tool.',
    openGraph: {
      type: 'website',
      locale: isEn ? 'en_GB' : 'de_DE',
      siteName: 'AI Navigator',
      url: canonical,
      images: [{ url: `${BASE}/opengraph-image`, width: 1200, height: 630 }],
    },
    alternates: {
      canonical,
      languages: {
        de: BASE,
        en: `${BASE}/en`,
        'x-default': BASE,
      },
    },
  }
}

const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AI Navigator',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: BASE,
  description: 'Enterprise AI. Structured navigation. Strategic frameworks for AI readiness, governance and use-case prioritization.',
  offers: [
    { '@type': 'Offer', name: 'Explorer', price: '0', priceCurrency: 'EUR' },
    { '@type': 'Offer', name: 'Professional', price: '49.00', priceCurrency: 'EUR' },
  ],
  author: { '@type': 'Person', name: 'Daniel Ostner' },
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('landing')
  const prefix = locale === 'en' ? '/en' : ''

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
  const teasers = [1, 2, 3].map((n) => ({
    title: t(`teaser${n}Title`),
    body: t(`teaser${n}Body`),
  }))
  const tools = [1, 2, 3, 4, 5, 6, 7].map((n) => t(`tool${n}`))
  const faqs = [1, 2, 3, 4, 5].map((n) => ({
    q: t(`faq${n}Q`),
    a: t(`faq${n}A`),
  }))

  return (
    <div className="min-h-screen bg-ivory text-slate-900">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />
      <PaperNoise />
      <PublicNav locale={locale} />

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
          <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed mb-2">
            {t('heroP1')}
          </p>
          <p
            className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed mb-10"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: t.raw('heroP2') }}
          />
          <div className="flex items-center justify-center gap-4">
            <Link href={`${prefix}/register`}
              className="bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm">
              {t('cta1')}
            </Link>
            <Link href={`${prefix}/leitfaden/warum-ai-projekte-scheitern`} className="text-slate-600 hover:text-slate-900 text-sm transition-colors">
              {t('cta2')}
            </Link>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-3 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.n} className="bg-white border border-slate-200 rounded-xl py-6">
              <div className="text-3xl font-bold font-serif text-primary mb-1">{s.n}</div>
              <div className="text-slate-500 text-sm">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Vorwort */}
      <div className="border-y border-slate-200 bg-white py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="font-serif text-2xl leading-relaxed text-slate-800 mb-4">
            {t('vorwortQuote')}
          </p>
          <p className="text-sm text-slate-500 mb-6">{t('vorwortWho')}</p>
          <p className="text-slate-600 leading-relaxed max-w-xl mx-auto">{t('vorwortLeadOut')}</p>
        </div>
      </div>

      {/* Three questions teaser */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-semibold font-serif text-center mb-12">{t('teaserTitle')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {teasers.map((teaser, i) => (
            <div key={teaser.title} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col">
              <h3 className="font-semibold text-lg mb-3">{teaser.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">{teaser.body}</p>
              <Link
                href={`${prefix}/leitfaden/${['warum-ai-projekte-scheitern', 'ai-readiness-quick-scan', 'ai-governance-aufbauen'][i]}`}
                className="text-primary text-sm font-medium hover:underline"
              >
                {t('teaserLink')}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* One path, seven tools */}
      <div id="tools" className="border-t border-slate-200 bg-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold font-serif mb-4">{t('toolsTitle')}</h2>
          <p className="text-slate-600 max-w-xl mx-auto mb-10 leading-relaxed">{t('toolsDesc')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {tools.map((tool) => (
              <span key={tool} className="bg-primary-soft border border-primary-border text-primary text-sm font-medium px-4 py-2 rounded-full">
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Trust Bar */}
      <div className="border-t border-slate-200 py-10">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs text-slate-500 text-center mb-4 uppercase tracking-wide font-medium">{t('trustTitle')}</p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {trustItems.map((b) => (
              <div key={b.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
          <p className="text-center mt-3">
            <Link href={`${prefix}/trust`} className="text-xs text-slate-500 hover:text-slate-700 underline transition-colors">
              {t('trustLink')}
            </Link>
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="border-t border-slate-200 bg-white py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-semibold font-serif text-center mb-2">{t('faqTitle')}</h2>
          <p className="text-slate-600 text-center mb-12">{t('faqSub')}</p>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={faq.q} className="border border-slate-200 rounded-xl p-5">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
                {i === 1 && (
                  <Link href={`${prefix}/preise`} className="text-primary text-xs font-medium hover:underline mt-2 inline-block">
                    {t('faq2Link')}
                  </Link>
                )}
              </div>
            ))}
          </div>
          <p className="text-center mt-8">
            <Link href={`${prefix}/leitfaden`} className="text-primary text-sm font-medium hover:underline">
              {t('faqMoreLink')}
            </Link>
          </p>
        </div>
      </div>

      {/* Closing CTA */}
      <div className="bg-primary py-20 text-center text-white">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-semibold font-serif mb-4">{t('closingTitle')}</h2>
          <p className="text-white/80 mb-8 leading-relaxed">{t('closingDesc')}</p>
          <Link href={`${prefix}/register`}
            className="inline-block bg-white text-primary font-semibold px-8 py-3 rounded-xl hover:bg-white/90 transition-colors text-sm">
            {t('cta1')}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-slate-500 text-xs">
        {t('footer')} ·{' '}
        <Link href={`${prefix}/datenschutz`} className="hover:text-slate-700">{t('footerPrivacy')}</Link> ·{' '}
        <Link href={`${prefix}/impressum`} className="hover:text-slate-700">{t('footerImprint')}</Link> ·{' '}
        <Link href={`${prefix}/agb`} className="hover:text-slate-700">{t('footerTerms')}</Link> ·{' '}
        <Link href={`${prefix}/trust`} className="hover:text-slate-700">{t('footerSecurity')}</Link>
        {locale === 'en' && (
          <p className="mt-1 text-[10px] text-slate-400">{t('footerLegalNote')}</p>
        )}
      </footer>
    </div>
  )
}

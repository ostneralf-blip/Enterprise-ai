import Link from 'next/link'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AUTHOR_LINKEDIN_URL, AUTHOR_NAME, AUTHOR_PHOTO } from '@/config/author'
import { AMAZON_BOOK_URL } from '@/config/leitfaden-data'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'trust' })
  const isEn = locale === 'en'
  const canonical = isEn ? `${BASE}/en/trust` : `${BASE}/trust`
  return {
    title: t('title'),
    description: t('metaDescription'),
    alternates: {
      canonical,
      languages: {
        de: `${BASE}/trust`,
        en: `${BASE}/en/trust`,
        'x-default': `${BASE}/trust`,
      },
    },
  }
}

// Nur Icon und i18n-Key — die Texte stehen im Namespace `trust`, damit DE und EN
// nicht auseinanderlaufen (der i18n-Completeness-Test prüft die Key-Struktur).
const TRUST_ITEMS = [
  { key: 'hosting', icon: '🇩🇪' },
  { key: 'gdpr', icon: '🔒' },
  { key: 'security', icon: '🛡' },
  { key: 'transparency', icon: '👁' },
  { key: 'payments', icon: '💳' },
  { key: 'dpa', icon: '📋' },
] as const

const TRUST_BADGES = [
  { key: 'hosting', icon: '🇩🇪' },
  { key: 'gdpr', icon: '✓' },
  { key: 'tls', icon: '🔒' },
  { key: 'rls', icon: '🛡' },
  { key: 'payments', icon: '💳' },
  { key: 'analytics', icon: '👁' },
] as const

export default async function TrustPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const [t, tAuthor] = await Promise.all([getTranslations('trust'), getTranslations('author')])
  const isEn = locale === 'en'
  const prefix = isEn ? '/en' : ''

  // Person-Entität: verknüpft Name, Foto und die belegenden Profile zu einer
  // Identität, statt sie nur als Autorennamen an einzelnen Beiträgen zu führen.
  // `worksFor` fehlt bewusst — der aktuelle Arbeitgeber wird nirgends genannt.
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: AUTHOR_NAME,
    jobTitle: tAuthor('jobTitle'),
    description: tAuthor('shortBio'),
    image: `${BASE}${AUTHOR_PHOTO}`,
    url: `${BASE}${prefix}/trust`,
    sameAs: [AUTHOR_LINKEDIN_URL, AMAZON_BOOK_URL],
    knowsAbout: ['Enterprise AI', 'AI Governance', 'EU AI Act', 'SAP S/4HANA', 'Enterprise IT Architecture'],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />

      <main className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

          <div className="mb-10">
            {/* prefix || '/' statt `${prefix}/`: /en/ mit Schrägstrich am Ende
                löst sonst eine unnötige Umleitung auf /en aus. */}
            <Link href={prefix || '/'} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">{t('back')}</Link>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mt-4 mb-2">{t('title')}</h1>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">{t('intro')}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
            {TRUST_BADGES.map(b => (
              <div key={b.key} className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                <span className="text-base" aria-hidden="true">{b.icon}</span>
                <span className="text-xs font-medium text-slate-700 min-w-0">{t(`badges.${b.key}`)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {TRUST_ITEMS.map(item => (
              <section key={item.key} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl" aria-hidden="true">{item.icon}</span>
                  <h2 className="text-base font-semibold text-slate-900 min-w-0">{t(`items.${item.key}.title`)}</h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{t(`items.${item.key}.body`)}</p>
              </section>
            ))}
          </div>

          {/* Über den Gründer — schließt an die Trust-Signale an: nach den sachlichen
              Nachweisen folgt die Person, die dahintersteht. Der aktuelle Arbeitgeber
              wird bewusst nicht genannt (abgestimmte Branchen-Version, kein Versehen). */}
          <section className="mt-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              {/* alt="" ist Absicht: Der Name steht direkt daneben — sonst
                  image-redundant-alt, siehe Accessibility-Lektion vom 02.08.2026. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={AUTHOR_PHOTO}
                alt=""
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover border border-primary-border shrink-0"
              />
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-900">{tAuthor('founderHeading')}</h2>
                <p className="text-xs text-slate-500">{tAuthor('name')}</p>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-slate-600 leading-relaxed">{tAuthor('longBio1')}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{tAuthor('longBio2')}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{tAuthor('longBio3')}</p>
            </div>
          </section>

          <div className="mt-8 bg-slate-800 text-white rounded-2xl p-5 sm:p-6">
            <h2 className="text-base font-semibold mb-2">{t('contact.title')}</h2>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">{t('contact.body')}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={`${prefix}/impressum`} className="text-xs text-slate-300 hover:text-white underline transition-colors">{t('links.imprint')}</Link>
              <Link href={`${prefix}/datenschutz`} className="text-xs text-slate-300 hover:text-white underline transition-colors">{t('links.privacy')}</Link>
              <Link href={`${prefix}/agb`} className="text-xs text-slate-300 hover:text-white underline transition-colors">{t('links.terms')}</Link>
            </div>
            {/* Rechtstexte bleiben deutsch — derselbe Hinweis wie im Footer der Startseite,
                damit englischsprachige Leser nicht auf eine vermeintlich kaputte Seite klicken. */}
            {isEn && <p className="mt-3 text-[10px] text-slate-400">{t('legalNote')}</p>}
          </div>

        </div>
      </main>
    </>
  )
}

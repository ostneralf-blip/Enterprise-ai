import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTool, AMAZON_BOOK_URL, type Bi } from '@/config/tools-data'
import { getGuide } from '@/config/leitfaden-data'
import { PublicNav } from '@/components/shared/PublicNav'
import { getPublicPricing, formatPrice } from '@/lib/pricing'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'

// Bewusst kein generateStaticParams — gleiche Next.js-Eigenheit bei doppelt
// verschachtelten Dynamic Segments wie in leitfaden/[slug] (dort dokumentiert).
// Rein dynamisches Rendering ist bei 7 Tool-Seiten performance-unkritisch.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const tool = getTool(slug)
  if (!tool) return {}
  const isEn = locale === 'en'
  const prefix = isEn ? '/en' : ''
  const canonical = `${BASE}${prefix}/tools/${slug}`
  const title = isEn ? tool.title.en : tool.title.de
  const description = isEn ? tool.metaDescription.en : tool.metaDescription.de
  return {
    title,
    description,
    keywords: isEn ? tool.keywords.en : tool.keywords.de,
    alternates: {
      canonical,
      languages: {
        de: `${BASE}/tools/${slug}`,
        en: `${BASE}/en/tools/${slug}`,
        'x-default': `${BASE}/tools/${slug}`,
      },
    },
    openGraph: {
      type: 'website',
      locale: isEn ? 'en_GB' : 'de_DE',
      title,
      description,
      url: canonical,
    },
  }
}

function pick(locale: string, bi: Bi): string {
  return locale === 'en' ? bi.en : bi.de
}

export default async function ToolLandingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const tool = getTool(slug)
  if (!tool) notFound()

  const isEn = locale === 'en'
  const prefix = isEn ? '/en' : ''
  const p = (bi: Bi) => pick(locale, bi)

  const related = tool.relatedGuideSlugs
    .map((s) => getGuide(s))
    .filter((g): g is NonNullable<typeof g> => Boolean(g))

  // Pro-Preis admin-konfigurierbar (price_config / promotions) — kein Hardcode.
  const pricing = await getPublicPricing()
  const proPrice = formatPrice(pricing.promotion?.promo_price ?? pricing.monthly, locale)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isEn ? 'Home' : 'Start', item: `${BASE}${prefix}` },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: `${BASE}${prefix}/tools` },
      { '@type': 'ListItem', position: 3, name: p(tool.navLabel), item: `${BASE}${prefix}/tools/${slug}` },
    ],
  }
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: p(tool.title),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: `${BASE}${prefix}/tools/${slug}`,
    description: p(tool.metaDescription),
    featureList: tool.featureList.map(p),
    offers: [
      { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'EUR' },
      { '@type': 'Offer', name: 'Pro', price: '49', priceCurrency: 'EUR' },
    ],
    author: { '@type': 'Person', name: 'Daniel Ostner', url: AMAZON_BOOK_URL },
  }
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: tool.faq.map((f) => ({
      '@type': 'Question',
      name: p(f.q),
      acceptedAnswer: { '@type': 'Answer', text: p(f.a) },
    })),
  }

  return (
    <div className="min-h-screen bg-ivory text-slate-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <PublicNav locale={locale} />

      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href={`${prefix}/tools`} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
          {isEn ? '← All tools' : '← Alle Tools'}
        </Link>

        {/* Hero: eyebrow + H1 + Problem-Hook */}
        <div className="flex items-center gap-3 mb-4 mt-6">
          <span className="w-11 h-11 rounded-xl bg-primary-soft border border-primary-border flex items-center justify-center text-primary text-lg" aria-hidden="true">
            {tool.icon}
          </span>
          <div className="text-xs text-primary font-semibold uppercase tracking-wide">{p(tool.eyebrow)}</div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold font-serif leading-tight mb-5">{p(tool.title)}</h1>
        <p className="text-slate-600 leading-relaxed text-base mb-6">{p(tool.problemHook)}</p>

        <div className="flex flex-wrap gap-3 mb-10">
          <Link href={`${prefix}/register`} className="inline-block bg-primary text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-primary-hover transition-colors">
            {isEn ? 'Start for free' : 'Kostenlos starten'}
          </Link>
          <Link href={`${prefix}/preise`} className="inline-block border border-slate-300 text-slate-700 font-medium px-5 py-2.5 rounded-xl text-sm hover:border-slate-400 transition-colors">
            {isEn ? 'See pricing' : 'Preise ansehen'}
          </Link>
        </div>

        {/* Screenshot / Tool-Vorschau */}
        <div className="mb-12">
          {tool.screenshot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tool.screenshot} alt={p(tool.navLabel)} className="w-full rounded-2xl border border-slate-200 shadow-sm" />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="ml-3 text-[11px] text-slate-400">enterprise-ai.biz{tool.appHref}</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
                <span className="w-14 h-14 rounded-2xl bg-primary-soft border border-primary-border flex items-center justify-center text-primary text-2xl" aria-hidden="true">
                  {tool.icon}
                </span>
                <p className="text-slate-500 text-sm font-medium">{p(tool.navLabel)}</p>
                <Link href={`${prefix}/register`} className="text-primary text-xs font-medium hover:underline">
                  {isEn ? 'Open the tool →' : 'Tool öffnen →'}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Was Sie bekommen */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold font-serif mb-5">{isEn ? 'What you get' : 'Was Sie bekommen'}</h2>
          <ul className="space-y-3">
            {tool.whatYouGet.map((item) => (
              <li key={p(item)} className="flex gap-3 bg-white border border-slate-200 rounded-xl p-4">
                <span className="text-primary shrink-0 mt-0.5" aria-hidden="true">✓</span>
                <span className="text-slate-700 text-sm leading-relaxed">{p(item)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Free vs. Pro */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold font-serif mb-5">{isEn ? 'Free vs. Pro' : 'Free vs. Pro'}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">{isEn ? 'Free' : 'Free'}</div>
              <ul className="space-y-2">
                {tool.free.map((item) => (
                  <li key={p(item)} className="flex gap-2 text-sm text-slate-700">
                    <span className="text-primary shrink-0" aria-hidden="true">✓</span>
                    <span className="leading-relaxed">{p(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-primary-soft border border-primary-border rounded-2xl p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-3">Pro · €{proPrice}{isEn ? '/mo' : '/Monat'}</div>
              <ul className="space-y-2">
                {tool.pro.map((item) => (
                  <li key={p(item)} className="flex gap-2 text-sm text-slate-800">
                    <span className="text-primary shrink-0" aria-hidden="true">✓</span>
                    <span className="leading-relaxed">{p(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA band */}
        <section className="bg-primary rounded-2xl p-6 text-white mb-12">
          <h2 className="text-xl font-semibold font-serif mb-2">
            {isEn ? 'Try it now — free' : 'Jetzt ausprobieren — kostenlos'}
          </h2>
          <p className="text-white/80 text-sm leading-relaxed mb-4">
            {isEn
              ? 'Create a free account and run the tool in minutes. Upgrade to Pro only when you need saving, PDF reports and sharing.'
              : 'Legen Sie ein kostenloses Konto an und nutzen Sie das Tool in Minuten. Auf Pro wechseln Sie erst, wenn Sie Speichern, PDF-Reports und Sharing brauchen.'}
          </p>
          <Link href={`${prefix}/register`} className="inline-block bg-white text-primary font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white/90 transition-colors">
            {isEn ? 'Start for free' : 'Kostenlos starten'}
          </Link>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">FAQ</h2>
          <div className="space-y-3">
            {tool.faq.map((faq) => (
              <div key={p(faq.q)} className="border border-slate-200 rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-2">{p(faq.q)}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{p(faq.a)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Verwandte Leitfäden (Hub ↔ Tools interne Verlinkung) */}
        {related.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4">{isEn ? 'Related guides' : 'Passende Leitfäden'}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {related.map((r) => (
                <Link key={r.slug} href={`${prefix}/leitfaden/${r.slug}`} className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-primary-border transition-colors">
                  <h3 className="font-semibold text-sm mb-1 leading-snug">{p(r.navLabel)}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{p(r.metaDescription)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <footer className="border-t border-slate-200 py-6 text-center text-slate-500 text-xs">
        © 2026 AI Navigator · enterprise-ai.biz ·{' '}
        <Link href={`${prefix}/datenschutz`} className="hover:text-slate-700">{isEn ? 'Privacy' : 'Datenschutz'}</Link> ·{' '}
        <Link href={`${prefix}/impressum`} className="hover:text-slate-700">{isEn ? 'Imprint' : 'Impressum'}</Link>
      </footer>
    </div>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { GUIDES, getGuide, AMAZON_BOOK_URL, type Bi } from '@/config/leitfaden-data'
import { PublicNav } from '@/components/shared/PublicNav'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const guide = getGuide(slug)
  if (!guide) return {}
  const isEn = locale === 'en'
  const prefix = isEn ? '/en' : ''
  const canonical = `${BASE}${prefix}/leitfaden/${slug}`
  const title = isEn ? guide.title.en : guide.title.de
  const description = isEn ? guide.metaDescription.en : guide.metaDescription.de
  return {
    title: `${title} — AI Navigator`,
    description,
    alternates: {
      canonical,
      languages: {
        de: `${BASE}/leitfaden/${slug}`,
        en: `${BASE}/en/leitfaden/${slug}`,
        'x-default': `${BASE}/leitfaden/${slug}`,
      },
    },
    openGraph: {
      type: 'article',
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

export default async function GuidePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const guide = getGuide(slug)
  if (!guide) notFound()

  const isEn = locale === 'en'
  const prefix = isEn ? '/en' : ''
  const p = (bi: Bi) => pick(locale, bi)

  const related = guide.relatedSlugs.map((s) => getGuide(s)).filter((g): g is NonNullable<typeof g> => Boolean(g))

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isEn ? 'Home' : 'Start', item: `${BASE}${prefix}` },
      { '@type': 'ListItem', position: 2, name: isEn ? 'Guide' : 'Leitfaden', item: `${BASE}${prefix}/leitfaden` },
      { '@type': 'ListItem', position: 3, name: p(guide.navLabel), item: `${BASE}${prefix}/leitfaden/${slug}` },
    ],
  }
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faq.map((f) => ({
      '@type': 'Question',
      name: p(f.q),
      acceptedAnswer: { '@type': 'Answer', text: p(f.a) },
    })),
  }
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Daniel Ostner',
    url: AMAZON_BOOK_URL,
  }

  return (
    <div className="min-h-screen bg-ivory text-slate-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />

      <PublicNav locale={locale} />

      <article className="max-w-3xl mx-auto px-6 py-12">
        <Link href={`${prefix}/leitfaden`} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
          {isEn ? '← All guides' : '← Alle Leitfäden'}
        </Link>
        <div className="text-xs text-primary font-semibold uppercase tracking-wide mb-3 mt-6">{p(guide.eyebrow)}</div>
        <h1 className="text-3xl sm:text-4xl font-semibold font-serif leading-tight mb-6">{p(guide.title)}</h1>

        {/* Kurzantwort / answer band */}
        <div className="bg-primary-soft border border-primary-border rounded-2xl p-5 mb-10">
          <p className="text-slate-800 leading-relaxed text-sm sm:text-base">{p(guide.kurzantwort)}</p>
        </div>

        {guide.sections.map((section) => (
          <section key={p(section.heading)} className="mb-12">
            <h2 className="text-2xl font-semibold font-serif mb-4">{p(section.heading)}</h2>
            {section.intro && <p className="text-slate-600 leading-relaxed mb-6">{p(section.intro)}</p>}

            {section.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {section.stats.map((stat) => (
                  <div key={p(stat.l)} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                    <div className="text-xl font-bold font-serif text-primary mb-1">{p(stat.n)}</div>
                    <div className="text-slate-500 text-xs leading-snug">{p(stat.l)}</div>
                  </div>
                ))}
              </div>
            )}

            {section.cards && (
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {section.cards.map((card) => (
                  <div key={p(card.title)} className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-primary font-semibold uppercase tracking-wide mb-2">{p(card.tag)}</div>
                    <h3 className="font-semibold mb-2 leading-snug">{p(card.title)}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{p(card.body)}</p>
                  </div>
                ))}
              </div>
            )}

            {section.facts && (
              <div className="space-y-3 mb-6">
                {section.facts.map((fact) => (
                  <div key={p(fact.label)} className="flex gap-4 bg-white border border-slate-200 rounded-xl p-4">
                    <div className="text-primary font-semibold text-sm shrink-0 w-24">{p(fact.label)}</div>
                    <p className="text-slate-600 text-sm leading-relaxed">{p(fact.body)}</p>
                  </div>
                ))}
              </div>
            )}

            {section.extraBody && <p className="text-slate-600 leading-relaxed mb-6">{p(section.extraBody)}</p>}

            {section.patternBox && (
              <div className="bg-slate-800 text-white rounded-2xl p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-300 mb-2">{p(section.patternBox.tag)}</div>
                <p className="text-slate-200 text-sm leading-relaxed">{p(section.patternBox.body)}</p>
              </div>
            )}
          </section>
        ))}

        {/* Glossary */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-3">{isEn ? 'Glossary' : 'Glossar'}</h2>
          <div className="flex flex-wrap gap-2">
            {guide.glossary.map((term) => (
              <span key={p(term)} className="bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-full">
                {p(term)}
              </span>
            ))}
          </div>
        </section>

        {/* CTA band */}
        <section className="bg-primary rounded-2xl p-6 text-white mb-12">
          <h2 className="text-xl font-semibold font-serif mb-2">{p(guide.ctaBand.title)}</h2>
          <p className="text-white/80 text-sm leading-relaxed mb-4">{p(guide.ctaBand.body)}</p>
          <Link href={`${prefix}/register`} className="inline-block bg-white text-primary font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white/90 transition-colors">
            {p(guide.ctaBand.linkLabel)}
          </Link>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">FAQ</h2>
          <div className="space-y-3">
            {guide.faq.map((faq) => (
              <div key={p(faq.q)} className="border border-slate-200 rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-2">{p(faq.q)}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{p(faq.a)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Author box */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 mb-12 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-soft border border-primary-border flex items-center justify-center text-primary font-semibold">DO</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">Daniel Ostner</p>
            <p className="text-xs text-slate-500">
              {isEn ? `From ${p(guide.bookChapter)} of the Enterprise AI Guide book` : `Aus ${p(guide.bookChapter)} des Enterprise-AI-Leitfaden-Buchs`}
            </p>
          </div>
          <a href={AMAZON_BOOK_URL} target="_blank" rel="noopener noreferrer" className="text-primary text-xs font-medium hover:underline whitespace-nowrap">
            {isEn ? 'View book →' : 'Buch ansehen →'}
          </a>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4">{isEn ? 'Related guides' : 'Verwandte Leitfäden'}</h2>
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
      </article>

      <footer className="border-t border-slate-200 py-6 text-center text-slate-500 text-xs">
        © 2026 AI Navigator · enterprise-ai.biz ·{' '}
        <Link href={`${prefix}/datenschutz`} className="hover:text-slate-700">{isEn ? 'Privacy' : 'Datenschutz'}</Link> ·{' '}
        <Link href={`${prefix}/impressum`} className="hover:text-slate-700">{isEn ? 'Imprint' : 'Impressum'}</Link>
      </footer>
    </div>
  )
}

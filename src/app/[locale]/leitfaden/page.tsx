import Link from 'next/link'
import type { Metadata } from 'next'
import { GUIDES, HUB_CATEGORIES, HUB_GLOSSARY, getGuide, type Bi } from '@/config/leitfaden-data'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isEn = locale === 'en'
  const prefix = isEn ? '/en' : ''
  const canonical = `${BASE}${prefix}/leitfaden`
  return {
    title: isEn
      ? 'The Enterprise AI Guide — AI Navigator'
      : 'Der Enterprise-AI-Leitfaden — AI Navigator',
    description: isEn
      ? 'Practical guides on AI readiness, governance, use-case prioritization, EU AI Act and reference architectures — grounded in real enterprise projects.'
      : 'Praxisnahe Leitfäden zu AI-Readiness, Governance, Use-Case-Priorisierung, EU AI Act und Referenzarchitekturen — aus echten Enterprise-Projekten.',
    alternates: {
      canonical,
      languages: {
        de: `${BASE}/leitfaden`,
        en: `${BASE}/en/leitfaden`,
        'x-default': `${BASE}/leitfaden`,
      },
    },
  }
}

function pick(locale: string, bi: Bi): string {
  return locale === 'en' ? bi.en : bi.de
}

export default async function LeitfadenHubPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const isEn = locale === 'en'
  const prefix = isEn ? '/en' : ''
  const p = (bi: Bi) => pick(locale, bi)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isEn ? 'Home' : 'Start', item: `${BASE}${prefix}` },
      { '@type': 'ListItem', position: 2, name: isEn ? 'Guide' : 'Leitfaden', item: `${BASE}${prefix}/leitfaden` },
    ],
  }
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: isEn ? 'The Enterprise AI Guide' : 'Der Enterprise-AI-Leitfaden',
    url: `${BASE}${prefix}/leitfaden`,
    hasPart: GUIDES.map((g) => ({
      '@type': 'Article',
      headline: p(g.title),
      url: `${BASE}${prefix}/leitfaden/${g.slug}`,
    })),
  }

  return (
    <div className="min-h-screen bg-ivory text-slate-900">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <nav className="border-b border-slate-200 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Link href={`${prefix}/`} className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-sm text-white">N</div>
          <span className="font-semibold">AI Navigator</span>
        </Link>
        <Link href={`${prefix}/register`} className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          {isEn ? 'Start free' : 'Kostenlos starten'}
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
        <div className="inline-block bg-primary-soft border border-primary-border text-primary tracking-widest text-xs font-semibold uppercase px-3 py-1 rounded-full mb-6">
          {isEn ? 'Guide' : 'Leitfaden'}
        </div>
        <h1 className="text-4xl font-semibold font-serif leading-tight mb-4">
          {isEn ? 'The Enterprise AI Guide' : 'Der Enterprise-AI-Leitfaden'}
        </h1>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
          {isEn
            ? 'Practical answers to the questions that decide whether an AI project succeeds — grounded in real enterprise projects, not theory.'
            : 'Praxisnahe Antworten auf die Fragen, die über Erfolg oder Scheitern eines AI-Projekts entscheiden — aus echten Enterprise-Projekten, nicht aus der Theorie.'}
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-20 space-y-12">
        {HUB_CATEGORIES.map((cat) => (
          <section key={p(cat.name)}>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xl font-semibold font-serif">{p(cat.name)}</h2>
              <span className="text-xs text-slate-500">{p(cat.count)}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {cat.slugs.map((slug) => {
                const guide = getGuide(slug)
                if (!guide) return null
                return (
                  <Link
                    key={slug}
                    href={`${prefix}/leitfaden/${slug}`}
                    className="block bg-white border border-slate-200 rounded-2xl p-5 hover:border-primary-border transition-colors"
                  >
                    <div className="text-xs text-primary font-medium uppercase tracking-wide mb-2">{p(guide.eyebrow)}</div>
                    <h3 className="font-semibold text-base mb-2 leading-snug">{p(guide.navLabel)}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">{p(guide.metaDescription)}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="border-t border-slate-200 bg-white py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-xl font-semibold font-serif mb-6 text-center">
            {isEn ? 'Glossary' : 'Glossar'}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {HUB_GLOSSARY.map((entry) => (
              <Link
                key={entry.slug + p(entry.term)}
                href={`${prefix}/leitfaden/${entry.slug}`}
                className="bg-primary-soft border border-primary-border text-primary text-sm font-medium px-4 py-2 rounded-full hover:bg-primary-border/40 transition-colors"
              >
                {p(entry.term)}
              </Link>
            ))}
          </div>
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

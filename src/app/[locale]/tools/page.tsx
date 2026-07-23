import Link from 'next/link'
import type { Metadata } from 'next'
import { TOOLS, type Bi } from '@/config/tools-data'
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
  const canonical = `${BASE}${prefix}/tools`
  return {
    title: isEn ? 'AI Tools — Enterprise AI Navigator' : 'KI-Tools — der Enterprise AI Navigator',
    description: isEn
      ? 'Seven free tools for enterprise AI: readiness assessment, use-case canvas, scoring, governance check, roadmap, EU AI Act compliance and reference architecture.'
      : 'Sieben Werkzeuge für Enterprise-KI: Readiness-Assessment, Use-Case-Canvas, Scoring, Governance-Check, Roadmap, EU-AI-Act-Compliance und Referenzarchitektur — kostenlos starten.',
    alternates: {
      canonical,
      languages: {
        de: `${BASE}/tools`,
        en: `${BASE}/en/tools`,
        'x-default': `${BASE}/tools`,
      },
    },
  }
}

function pick(locale: string, bi: Bi): string {
  return locale === 'en' ? bi.en : bi.de
}

export default async function ToolsHubPage({
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
      { '@type': 'ListItem', position: 2, name: isEn ? 'Tools' : 'Tools', item: `${BASE}${prefix}/tools` },
    ],
  }
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: isEn ? 'AI Tools' : 'KI-Tools',
    url: `${BASE}${prefix}/tools`,
    hasPart: TOOLS.map((tool) => ({
      '@type': 'SoftwareApplication',
      name: p(tool.title),
      applicationCategory: 'BusinessApplication',
      url: `${BASE}${prefix}/tools/${tool.slug}`,
    })),
  }

  return (
    <div className="min-h-screen bg-ivory text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <PublicNav locale={locale} />

      <div className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
        <div className="inline-block bg-primary-soft border border-primary-border text-primary tracking-widest text-xs font-semibold uppercase px-3 py-1 rounded-full mb-6">
          {isEn ? 'Tools' : 'Tools'}
        </div>
        <h1 className="text-4xl font-semibold font-serif leading-tight mb-4">
          {isEn ? 'Seven tools for enterprise AI' : 'Sieben Werkzeuge für Enterprise-KI'}
        </h1>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
          {isEn
            ? 'From readiness to reference architecture — each tool works on its own and builds on the previous. Start for free, no consulting required.'
            : 'Von der Readiness bis zur Referenzarchitektur — jedes Werkzeug funktioniert für sich und baut auf dem vorigen auf. Kostenlos starten, ohne Beratung.'}
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid sm:grid-cols-2 gap-4">
          {TOOLS.map((tool) => (
            <Link
              key={tool.slug}
              href={`${prefix}/tools/${tool.slug}`}
              className="block bg-white border border-slate-200 rounded-2xl p-5 hover:border-primary-border transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="w-9 h-9 rounded-lg bg-primary-soft border border-primary-border flex items-center justify-center text-primary" aria-hidden="true">
                  {tool.icon}
                </span>
                <div className="text-xs text-primary font-medium uppercase tracking-wide">{p(tool.eyebrow)}</div>
              </div>
              <h2 className="font-semibold text-base mb-2 leading-snug">{p(tool.navLabel)}</h2>
              <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">{p(tool.metaDescription)}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white py-14">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-xl font-semibold font-serif mb-3">
            {isEn ? 'Prefer to read first?' : 'Lieber erst lesen?'}
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-5">
            {isEn
              ? 'The Enterprise AI Guide explains the thinking behind every tool — grounded in real projects.'
              : 'Der Enterprise-AI-Leitfaden erklärt das Denken hinter jedem Werkzeug — aus echten Projekten.'}
          </p>
          <Link
            href={`${prefix}/leitfaden`}
            className="inline-block bg-primary-soft border border-primary-border text-primary text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-primary-border/40 transition-colors"
          >
            {isEn ? 'Open the guide →' : 'Zum Leitfaden →'}
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

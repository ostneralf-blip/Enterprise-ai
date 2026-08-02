import Link from 'next/link'
import type { Metadata } from 'next'
import { getSortedBlogPosts, type Bi } from '@/config/blog-data'
import { setRequestLocale } from 'next-intl/server'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isEn = locale === 'en'
  const prefix = isEn ? '/en' : ''
  const canonical = `${BASE}${prefix}/blog`
  return {
    title: isEn ? 'Blog' : 'Blog',
    description: isEn
      ? 'Notes on enterprise AI in practice: governance operating models, prioritization, EU AI Act and what actually holds initiatives back.'
      : 'Notizen zu Enterprise-KI aus der Praxis: Governance-Betriebsmodelle, Priorisierung, EU AI Act und woran Vorhaben tatsächlich hängen.',
    alternates: {
      canonical,
      languages: {
        de: `${BASE}/blog`,
        en: `${BASE}/en/blog`,
        'x-default': `${BASE}/blog`,
      },
    },
    openGraph: {
      type: 'website',
      locale: isEn ? 'en_GB' : 'de_DE',
      url: canonical,
    },
  }
}

function pick(locale: string, bi: Bi): string {
  return locale === 'en' ? bi.en : bi.de
}

export default async function BlogHubPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const isEn = locale === 'en'
  const prefix = isEn ? '/en' : ''
  const p = (bi: Bi) => pick(locale, bi)
  const posts = getSortedBlogPosts()

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(isEn ? 'en-GB' : 'de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isEn ? 'Home' : 'Start', item: `${BASE}${prefix}` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE}${prefix}/blog` },
    ],
  }
  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'AI Navigator Blog',
    url: `${BASE}${prefix}/blog`,
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: p(post.title),
      datePublished: post.publishedAt,
      url: `${BASE}${prefix}/blog/${post.slug}`,
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />

      <div className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
        <div className="inline-block bg-primary-soft border border-primary-border text-primary tracking-widest text-xs font-semibold uppercase px-3 py-1 rounded-full mb-6">
          Blog
        </div>
        <h1 className="text-4xl font-semibold font-serif leading-tight mb-4">
          {isEn ? 'Notes from enterprise AI practice' : 'Notizen aus der Enterprise-KI-Praxis'}
        </h1>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
          {isEn
            ? 'Shorter, dated pieces with a point of view. For the systematic reference works, see the guide.'
            : 'Kürzere, datierte Beiträge mit Standpunkt. Die systematischen Nachschlagewerke finden Sie im Leitfaden.'}
        </p>
        <Link href={`${prefix}/leitfaden`} className="inline-block mt-4 text-primary text-sm font-medium hover:underline">
          {isEn ? 'To the guide →' : 'Zum Leitfaden →'}
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-20">
        {posts.length === 0 ? (
          <p className="text-center text-slate-500 text-sm">
            {isEn ? 'No posts yet.' : 'Noch keine Beiträge.'}
          </p>
        ) : (
          <div className="space-y-5">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`${prefix}/blog/${post.slug}`}
                className="block bg-white border border-slate-200 rounded-2xl p-6 hover:border-primary-border transition-colors"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                  <span className="text-xs text-primary font-semibold uppercase tracking-wide">{p(post.category)}</span>
                  <span className="text-xs text-slate-500">
                    <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                    {' · '}
                    {isEn ? `${post.readingMinutes} min read` : `${post.readingMinutes} Min. Lesezeit`}
                  </span>
                </div>
                <h2 className="font-semibold text-lg mb-2 leading-snug">{p(post.title)}</h2>
                <p className="text-slate-600 text-sm leading-relaxed">{p(post.metaDescription)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

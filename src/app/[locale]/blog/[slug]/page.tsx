import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getBlogPost, getSortedBlogPosts, BLOG_AUTHOR, type Bi } from '@/config/blog-data'
import { getGuide, AMAZON_BOOK_URL } from '@/config/leitfaden-data'
import { getTool, TOOL_CTA_ANCHOR } from '@/config/tools-data'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'

// Vorrendern aller Beiträge in beiden Sprachen. Das ist hier möglich, weil das
// Eltern-Segment [locale] seit dem SEO-Sprint (02.08.2026) selbst
// generateStaticParams hat — genau die Voraussetzung, die in
// leitfaden/[slug]/page.tsx seinerzeit fehlte und dort zu Serverfehlern führte.
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getSortedBlogPosts().map((post) => ({ locale, slug: post.slug }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const post = getBlogPost(slug)
  if (!post) return {}
  const isEn = locale === 'en'
  const prefix = isEn ? '/en' : ''
  const canonical = `${BASE}${prefix}/blog/${slug}`
  const title = isEn ? post.title.en : post.title.de
  const description = isEn ? post.metaDescription.en : post.metaDescription.de
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        de: `${BASE}/blog/${slug}`,
        en: `${BASE}/en/blog/${slug}`,
        'x-default': `${BASE}/blog/${slug}`,
      },
    },
    openGraph: {
      type: 'article',
      locale: isEn ? 'en_GB' : 'de_DE',
      title,
      description,
      url: canonical,
      publishedTime: post.publishedAt,
      ...(post.updatedAt && { modifiedTime: post.updatedAt }),
      authors: [BLOG_AUTHOR.name],
    },
  }
}

function pick(locale: string, bi: Bi): string {
  return locale === 'en' ? bi.en : bi.de
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const post = getBlogPost(slug)
  if (!post) notFound()

  const isEn = locale === 'en'
  const prefix = isEn ? '/en' : ''
  const p = (bi: Bi) => pick(locale, bi)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(isEn ? 'en-GB' : 'de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

  const relatedGuides = (post.relatedGuideSlugs ?? [])
    .map((s) => getGuide(s))
    .filter((g): g is NonNullable<typeof g> => Boolean(g))

  // Interne Verlinkung: Abschluss-CTA führt auf die passende Tool-Landingpage mit dem
  // Kaufabsichts-Anker als Linktext — dieselbe Mechanik wie bei den Leitfäden.
  const ctaTool = post.ctaToolSlug ? getTool(post.ctaToolSlug) : undefined
  const ctaAnchor = post.ctaToolSlug ? TOOL_CTA_ANCHOR[post.ctaToolSlug] : undefined
  const ctaHref = ctaTool ? `${prefix}/tools/${ctaTool.slug}` : `${prefix}/register`

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isEn ? 'Home' : 'Start', item: `${BASE}${prefix}` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE}${prefix}/blog` },
      { '@type': 'ListItem', position: 3, name: p(post.title), item: `${BASE}${prefix}/blog/${slug}` },
    ],
  }
  const blogPostingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p(post.title),
    description: p(post.metaDescription),
    datePublished: post.publishedAt,
    ...(post.updatedAt && { dateModified: post.updatedAt }),
    inLanguage: isEn ? 'en' : 'de',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE}${prefix}/blog/${slug}` },
    author: { '@type': 'Person', name: BLOG_AUTHOR.name, url: AMAZON_BOOK_URL },
    publisher: {
      '@type': 'Organization',
      name: 'AI Navigator',
      logo: { '@type': 'ImageObject', url: `${BASE}/brand/app-icon/app-icon-512.png` },
    },
    image: `${BASE}/opengraph-image`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }} />

      <article className="max-w-3xl mx-auto px-6 py-12">
        <Link href={`${prefix}/blog`} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
          {isEn ? '← All posts' : '← Alle Beiträge'}
        </Link>

        <div className="text-xs text-primary font-semibold uppercase tracking-wide mb-3 mt-6">{p(post.eyebrow)}</div>
        <h1 className="text-3xl sm:text-4xl font-semibold font-serif leading-tight mb-3">{p(post.title)}</h1>
        <p className="text-xs text-slate-500 mb-6">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          {post.updatedAt && (
            <>
              {isEn ? ' · updated ' : ' · aktualisiert '}
              <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
            </>
          )}
          {' · '}
          {isEn ? `${post.readingMinutes} min read` : `${post.readingMinutes} Min. Lesezeit`}
          {' · '}
          {BLOG_AUTHOR.name}
        </p>

        {/* Anreißer */}
        <div className="bg-primary-soft border border-primary-border rounded-2xl p-5 mb-10">
          <p className="text-slate-800 leading-relaxed text-sm sm:text-base">{p(post.lead)}</p>
        </div>

        {post.sections.map((section) => (
          <section key={p(section.heading)} className="mb-12">
            <h2 className="text-2xl font-semibold font-serif mb-4">{p(section.heading)}</h2>
            {section.paragraphs.map((para) => (
              <p key={p(para)} className="text-slate-600 leading-relaxed mb-4">{p(para)}</p>
            ))}

            {section.bullets && (
              <ul className="space-y-3 mt-6">
                {section.bullets.map((bullet) => (
                  <li key={p(bullet)} className="flex gap-3 bg-white border border-slate-200 rounded-xl p-4">
                    <span className="text-primary font-semibold shrink-0" aria-hidden="true">•</span>
                    <p className="text-slate-600 text-sm leading-relaxed min-w-0">{p(bullet)}</p>
                  </li>
                ))}
              </ul>
            )}

            {section.callout && (
              <div className="bg-slate-800 text-white rounded-2xl p-5 mt-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-300 mb-2">{p(section.callout.tag)}</div>
                <p className="text-slate-200 text-sm leading-relaxed">{p(section.callout.body)}</p>
              </div>
            )}
          </section>
        ))}

        {/* CTA auf das passende Werkzeug */}
        <section className="bg-primary rounded-2xl p-6 text-white mb-12">
          <h2 className="text-xl font-semibold font-serif mb-2">
            {isEn ? 'Put this into practice' : 'In die Praxis bringen'}
          </h2>
          <p className="text-white/80 text-sm leading-relaxed mb-4">
            {ctaTool
              ? p(ctaTool.problemHook)
              : isEn
                ? 'Work through readiness, use cases, governance and roadmap in one structured path.'
                : 'Readiness, Use Cases, Governance und Roadmap in einem strukturierten Pfad durcharbeiten.'}
          </p>
          <Link
            href={ctaHref}
            className="inline-block bg-white text-primary font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white/90 transition-colors"
          >
            {ctaAnchor ? p(ctaAnchor) : isEn ? 'Start free' : 'Kostenlos starten'}
          </Link>
        </section>

        {/* Autorenkasten */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 mb-12 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-soft border border-primary-border flex items-center justify-center text-primary font-semibold shrink-0">
            DO
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">{BLOG_AUTHOR.name}</p>
            <p className="text-xs text-slate-500">{p(BLOG_AUTHOR.role)}</p>
          </div>
          <a
            href={AMAZON_BOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-xs font-medium hover:underline whitespace-nowrap"
          >
            {isEn ? 'View book →' : 'Buch ansehen →'}
          </a>
        </section>

        {/* Passende Leitfäden */}
        {relatedGuides.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4">
              {isEn ? 'Go deeper in the guide' : 'Vertiefung im Leitfaden'}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {relatedGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`${prefix}/leitfaden/${guide.slug}`}
                  className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-primary-border transition-colors"
                >
                  <h3 className="font-semibold text-sm mb-1 leading-snug">{p(guide.navLabel)}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{p(guide.metaDescription)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  )
}

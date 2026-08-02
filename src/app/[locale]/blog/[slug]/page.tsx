import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublishedPost, getPublishedSlugs, type BlogLocale } from '@/lib/blog'
import { getGuide, AMAZON_BOOK_URL } from '@/config/leitfaden-data'
import { getTool, TOOL_CTA_ANCHOR } from '@/config/tools-data'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { OG_IMAGES } from '@/lib/seo'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'

const BLOG_AUTHOR_NAME = 'Daniel Ostner'

// Siehe Kommentar im Hub: DB-Inhalte, aber cookielos gelesen und damit statisch.
export const revalidate = 300

// Nur veröffentlichte Beiträge vorrendern. Ein später freigegebener Beitrag ist
// nicht in dieser Liste — Next.js rendert ihn dann bei der ersten Anfrage on demand
// (dynamicParams bleibt bewusst auf dem Standard true).
export async function generateStaticParams() {
  const slugs = await getPublishedSlugs()
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const isEn = locale === 'en'
  const post = await getPublishedPost(slug, (isEn ? 'en' : 'de') as BlogLocale)
  if (!post) return {}
  const prefix = isEn ? '/en' : ''
  const canonical = `${BASE}${prefix}/blog/${slug}`
  return {
    title: post.title,
    description: post.metaDescription,
    alternates: {
      canonical,
      languages: {
        de: `${BASE}/blog/${slug}`,
        en: `${BASE}/en/blog/${slug}`,
        'x-default': `${BASE}/blog/${slug}`,
      },
    },
    openGraph: {
      images: OG_IMAGES,
      type: 'article',
      locale: isEn ? 'en_GB' : 'de_DE',
      title: post.title,
      description: post.metaDescription,
      url: canonical,
      publishedTime: post.publishedAt,
      ...(post.contentUpdatedAt && { modifiedTime: post.contentUpdatedAt }),
      authors: [BLOG_AUTHOR_NAME],
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const isEn = locale === 'en'
  const post = await getPublishedPost(slug, (isEn ? 'en' : 'de') as BlogLocale)
  // Greift auch für Entwürfe und Beiträge in Prüfung — die RLS-Policy gibt sie
  // gar nicht erst heraus, hier landet dann ein sauberes 404 statt einer Teilseite.
  if (!post) notFound()

  const prefix = isEn ? '/en' : ''

  const formatDate = (iso: string) =>
    iso
      ? new Date(iso).toLocaleDateString(isEn ? 'en-GB' : 'de-DE', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : ''

  const relatedGuides = post.relatedGuideSlugs
    .map((s) => getGuide(s))
    .filter((g): g is NonNullable<typeof g> => Boolean(g))

  const ctaTool = post.ctaToolSlug ? getTool(post.ctaToolSlug) : undefined
  const ctaAnchor = post.ctaToolSlug ? TOOL_CTA_ANCHOR[post.ctaToolSlug] : undefined
  const ctaHref = ctaTool ? `${prefix}/tools/${ctaTool.slug}` : `${prefix}/register`
  const pickBi = (bi: { de: string; en: string }) => (isEn ? bi.en : bi.de)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isEn ? 'Home' : 'Start', item: `${BASE}${prefix}` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE}${prefix}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${BASE}${prefix}/blog/${slug}` },
    ],
  }
  const blogPostingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.publishedAt,
    ...(post.contentUpdatedAt && { dateModified: post.contentUpdatedAt }),
    inLanguage: isEn ? 'en' : 'de',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE}${prefix}/blog/${slug}` },
    author: { '@type': 'Person', name: post.reviewedBy ?? BLOG_AUTHOR_NAME, url: AMAZON_BOOK_URL },
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

        <div className="text-xs text-primary font-semibold uppercase tracking-wide mb-3 mt-6">{post.eyebrow}</div>
        <h1 className="text-3xl sm:text-4xl font-semibold font-serif leading-tight mb-3">{post.title}</h1>
        <p className="text-xs text-slate-500 mb-6">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          {post.contentUpdatedAt && (
            <>
              {isEn ? ' · updated ' : ' · aktualisiert '}
              <time dateTime={post.contentUpdatedAt}>{formatDate(post.contentUpdatedAt)}</time>
            </>
          )}
          {' · '}
          {isEn ? `${post.readingMinutes} min read` : `${post.readingMinutes} Min. Lesezeit`}
          {' · '}
          {post.reviewedBy ?? BLOG_AUTHOR_NAME}
        </p>

        <div className="bg-primary-soft border border-primary-border rounded-2xl p-5 mb-10">
          <p className="text-slate-800 leading-relaxed text-sm sm:text-base">{post.lead}</p>
        </div>

        {post.sections.map((section, i) => (
          <section key={`${section.heading}-${i}`} className="mb-12">
            <h2 className="text-2xl font-semibold font-serif mb-4">{section.heading}</h2>
            {section.paragraphs.map((para, pi) => (
              <p key={pi} className="text-slate-600 leading-relaxed mb-4">{para}</p>
            ))}

            {section.bullets.length > 0 && (
              <ul className="space-y-3 mt-6">
                {section.bullets.map((bullet, bi) => (
                  <li key={bi} className="flex gap-3 bg-white border border-slate-200 rounded-xl p-4">
                    <span className="text-primary font-semibold shrink-0" aria-hidden="true">•</span>
                    <p className="text-slate-600 text-sm leading-relaxed min-w-0">{bullet}</p>
                  </li>
                ))}
              </ul>
            )}

            {section.callout && (
              <div className="bg-slate-800 text-white rounded-2xl p-5 mt-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-300 mb-2">{section.callout.tag}</div>
                <p className="text-slate-200 text-sm leading-relaxed">{section.callout.body}</p>
              </div>
            )}
          </section>
        ))}

        <section className="bg-primary rounded-2xl p-6 text-white mb-12">
          <h2 className="text-xl font-semibold font-serif mb-2">
            {isEn ? 'Put this into practice' : 'In die Praxis bringen'}
          </h2>
          <p className="text-white/80 text-sm leading-relaxed mb-4">
            {ctaTool
              ? pickBi(ctaTool.problemHook)
              : isEn
                ? 'Work through readiness, use cases, governance and roadmap in one structured path.'
                : 'Readiness, Use Cases, Governance und Roadmap in einem strukturierten Pfad durcharbeiten.'}
          </p>
          <Link
            href={ctaHref}
            className="inline-block bg-white text-primary font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white/90 transition-colors"
          >
            {ctaAnchor ? pickBi(ctaAnchor) : isEn ? 'Start free' : 'Kostenlos starten'}
          </Link>
        </section>

        {/* Autorenkasten mit Transparenzhinweis nach Art. 50 Abs. 4 EU AI Act.
            Der Hinweis steht bewusst hier und nicht im Beitragskopf: Die
            Kennzeichnungspflicht entfällt bei echter redaktioneller Prüfung — der
            Hinweis ist ein freiwilliges Transparenzsignal, keine Warnung, und soll
            die Autorität des Beitrags nicht untergraben. */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 mb-12 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-soft border border-primary-border flex items-center justify-center text-primary font-semibold shrink-0">
            DO
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">{post.reviewedBy ?? BLOG_AUTHOR_NAME}</p>
            <p className="text-xs text-slate-500">
              {isEn ? 'Author of the Enterprise AI Guide' : 'Autor des Enterprise-AI-Leitfadens'}
            </p>
            {post.aiAssisted && post.reviewedAt && (
              <p className="text-xs text-slate-500 mt-1">
                {isEn
                  ? `AI-assisted draft, editorially reviewed on ${formatDate(post.reviewedAt)}.`
                  : `KI-unterstützt entworfen, redaktionell geprüft am ${formatDate(post.reviewedAt)}.`}
              </p>
            )}
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
                  <h3 className="font-semibold text-sm mb-1 leading-snug">{pickBi(guide.navLabel)}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{pickBi(guide.metaDescription)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  )
}

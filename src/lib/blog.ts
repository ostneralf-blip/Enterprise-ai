import 'server-only'
import { createPublicClient } from '@/lib/supabase/server'

// Öffentliche Lese-Schicht für den Blog. Löst die frühere statische Datei
// src/config/blog-data.ts ab (02.08.2026), damit Beiträge im Admin-Panel angelegt,
// geprüft, freigegeben und deaktiviert werden können — Hintergrund ist der
// Freigabenachweis nach Art. 50 Abs. 4 EU AI Act.
//
// Bewusst über createPublicClient (Anon-Key, KEINE Cookies):
//   * ohne Cookies bleiben /blog und /blog/[slug] statisch vorgerendert
//   * die RLS-Policy `public_read_published` filtert Entwürfe serverseitig heraus —
//     ein Fehler hier kann keinen ungeprüften Beitrag veröffentlichen
// Der zusätzliche .eq('status','published') unten ist Absicht (doppelter Boden),
// nicht Redundanz aus Versehen.

export type BlogLocale = 'de' | 'en'

export interface BlogSection {
  heading: string
  paragraphs: string[]
  bullets: string[]
  callout: { tag: string; body: string } | null
}

/** Ein Beitrag, bereits auf eine Sprache aufgelöst. */
export interface BlogPost {
  slug: string
  publishedAt: string
  contentUpdatedAt: string | null
  readingMinutes: number
  aiAssisted: boolean
  reviewedBy: string | null
  reviewedAt: string | null
  ctaToolSlug: string | null
  relatedGuideSlugs: string[]
  category: string
  eyebrow: string
  title: string
  metaDescription: string
  lead: string
  sections: BlogSection[]
}

interface TranslationRow {
  category: string
  eyebrow: string
  title: string
  meta_description: string
  lead: string
}

interface SectionRow {
  position: number
  heading: string
  paragraphs: string[] | null
  bullets: string[] | null
  callout_tag: string | null
  callout_body: string | null
}

interface PostRow {
  slug: string
  published_at: string | null
  content_updated_at: string | null
  reading_minutes: number
  ai_assisted: boolean
  reviewed_by: string | null
  reviewed_at: string | null
  cta_tool_slug: string | null
  related_guide_slugs: string[] | null
  blog_post_translations: TranslationRow[] | null
  blog_post_sections: SectionRow[] | null
}

const SELECT = `
  slug, published_at, content_updated_at, reading_minutes, ai_assisted,
  reviewed_by, reviewed_at, cta_tool_slug, related_guide_slugs,
  blog_post_translations!inner (category, eyebrow, title, meta_description, lead),
  blog_post_sections (position, heading, paragraphs, bullets, callout_tag, callout_body)
`

function mapPost(row: PostRow): BlogPost | null {
  const translation = row.blog_post_translations?.[0]
  // Ein Beitrag ohne Übersetzung in der angeforderten Sprache wird ausgelassen statt
  // halb gerendert — sonst stünde eine Seite mit leerem Titel im Index.
  if (!translation) return null

  const sections = (row.blog_post_sections ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s) => ({
      heading: s.heading,
      paragraphs: s.paragraphs ?? [],
      bullets: s.bullets ?? [],
      callout: s.callout_tag && s.callout_body ? { tag: s.callout_tag, body: s.callout_body } : null,
    }))

  return {
    slug: row.slug,
    publishedAt: row.published_at ?? '',
    contentUpdatedAt: row.content_updated_at,
    readingMinutes: row.reading_minutes,
    aiAssisted: row.ai_assisted,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    ctaToolSlug: row.cta_tool_slug,
    relatedGuideSlugs: row.related_guide_slugs ?? [],
    category: translation.category,
    eyebrow: translation.eyebrow,
    title: translation.title,
    metaDescription: translation.meta_description,
    lead: translation.lead,
    sections,
  }
}

/** Veröffentlichte Beiträge einer Sprache, neueste zuerst. */
export async function getPublishedPosts(locale: BlogLocale): Promise<BlogPost[]> {
  const sb = await createPublicClient()
  const { data, error } = await sb
    .from('blog_posts')
    .select(SELECT)
    .eq('status', 'published')
    .eq('blog_post_translations.locale', locale)
    .eq('blog_post_sections.locale', locale)
    .order('published_at', { ascending: false })

  if (error || !data) return []
  return (data as unknown as PostRow[]).map(mapPost).filter((p): p is BlogPost => p !== null)
}

/** Ein veröffentlichter Beitrag, oder null (Entwurf, in Prüfung, archiviert, unbekannt). */
export async function getPublishedPost(slug: string, locale: BlogLocale): Promise<BlogPost | null> {
  const sb = await createPublicClient()
  const { data, error } = await sb
    .from('blog_posts')
    .select(SELECT)
    .eq('status', 'published')
    .eq('slug', slug)
    .eq('blog_post_translations.locale', locale)
    .eq('blog_post_sections.locale', locale)
    .maybeSingle()

  if (error || !data) return null
  return mapPost(data as unknown as PostRow)
}

/**
 * Nur die Slugs veröffentlichter Beiträge — für generateStaticParams und die Sitemap.
 * Sprachunabhängig, daher ohne Übersetzungs-Join.
 */
export async function getPublishedSlugs(): Promise<string[]> {
  const sb = await createPublicClient()
  const { data, error } = await sb
    .from('blog_posts')
    .select('slug')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error || !data) return []
  return data.map((r) => r.slug as string)
}

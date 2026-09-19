import { z } from 'zod'

// Eingabeschema für PUT /api/admin/blog — ausgelagert, damit die Regeln ohne
// Next.js und Datenbank testbar sind.
//
// Ein Beitrag muss NICHT zweisprachig sein: DE- und EN-Fassungen laufen in der
// Praxis oft als eigene Beiträge mit eigenem Slug (z. B. „…-dach" auf Deutsch).
// Die öffentliche Lese-Schicht (lib/blog.ts) filtert ohnehin pro Sprache. Regel:
// mindestens eine Sprache, und jede vorhandene Sprache ist vollständig — Kopfdaten
// UND jeder Abschnitt. Halb ausgefüllte Sprachen werden weiterhin abgelehnt.

export const BLOG_LOCALES = ['de', 'en'] as const
export type BlogPostLocale = (typeof BLOG_LOCALES)[number]

const LocaleText = z.object({
  category:         z.string().min(1).max(80),
  eyebrow:          z.string().min(1).max(120),
  title:            z.string().min(1).max(300),
  meta_description: z.string().min(1).max(500),
  lead:             z.string().min(1).max(2000),
})

const SectionText = z.object({
  heading:      z.string().min(1).max(300),
  paragraphs:   z.array(z.string().min(1).max(4000)).min(1).max(20),
  bullets:      z.array(z.string().min(1).max(2000)).max(20).default([]),
  callout_tag:  z.string().max(120).nullable().optional(),
  callout_body: z.string().max(4000).nullable().optional(),
})

const Section = z.object({ de: SectionText.optional(), en: SectionText.optional() })

export const PostSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'nur Kleinbuchstaben, Ziffern und Bindestriche').max(120),
    reading_minutes: z.number().int().min(1).max(120).default(5),
    ai_assisted: z.boolean().default(false),
    cta_tool_slug: z.string().max(120).nullable().optional(),
    related_guide_slugs: z.array(z.string().max(120)).max(10).default([]),
    content_updated_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    de: LocaleText.optional(),
    en: LocaleText.optional(),
    sections: z.array(Section).min(1).max(30),
  })
  .superRefine((post, ctx) => {
    const locales = BLOG_LOCALES.filter((l) => post[l])
    if (locales.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['de'], message: 'Mindestens eine Sprache (DE oder EN) ist erforderlich' })
      return
    }
    post.sections.forEach((section, i) => {
      for (const l of BLOG_LOCALES) {
        if (locales.includes(l) && !section[l]) {
          ctx.addIssue({ code: 'custom', path: ['sections', i, l], message: 'Abschnitt fehlt in dieser Sprache' })
        }
        if (!locales.includes(l) && section[l]) {
          ctx.addIssue({ code: 'custom', path: ['sections', i, l], message: 'Abschnitt ohne Titel/Anreißer in dieser Sprache' })
        }
      }
    })
  })

export type PostInput = z.infer<typeof PostSchema>

/** Die Sprachen, in denen der Beitrag vorliegt. */
export function postLocales(post: PostInput): BlogPostLocale[] {
  return BLOG_LOCALES.filter((l) => post[l])
}

/** Kurzfassung der Validierungsfehler für die Anzeige im Admin-Panel. */
export function formatPostIssues(issues: readonly z.core.$ZodIssue[]): string {
  return issues
    .slice(0, 5)
    .map((i) => `${i.path.join('.') || 'Beitrag'}: ${i.message}`)
    .join('; ')
}

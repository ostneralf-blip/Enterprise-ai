import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'
import { BLOG_STATUSES, computeStatusChange, BlogStatusError } from '@/lib/blog-status'
import { PostSchema, BLOG_LOCALES, postLocales, formatPostIssues } from '@/lib/blog-post-schema'

// Admin-CRUD für Blogbeiträge. Aufbau bewusst analog
// /api/admin/compliance/regulations (#245): requireAdmin + Admin-Client (RLS-Bypass
// nur nach harter Admin-Prüfung), DE und/oder EN in einem Payload, die API kapselt
// das locale-per-row-Modell der Tabellen. Einsprachige Beiträge sind erlaubt — die
// Regeln dafür stehen in lib/blog-post-schema.ts.
//
// Anders als dort gibt es hier einen Redaktionsstatus mit Freigabevermerk — die
// Regeln dafür stehen in lib/blog-status.ts, damit sie ohne Datenbank testbar sind.

const StatusSchema = z.object({
  slug: z.string().min(1).max(120),
  status: z.enum(BLOG_STATUSES),
  reviewed_by: z.string().max(120).nullable().optional(),
})

/**
 * Öffentliche Blog-Oberflächen neu erzeugen, damit eine Freigabe sofort sichtbar ist
 * und ein deaktivierter Beitrag sofort verschwindet — ohne auf das 5-Minuten-Fenster
 * der Zeit-Revalidierung zu warten. Die Startseite ist dabei, weil sie den neuesten
 * Beitrag anteasert, die Sitemap, weil sie nur freigegebene Beiträge listen darf.
 */
function revalidateBlogSurfaces() {
  revalidatePath('/[locale]/blog', 'page')
  revalidatePath('/[locale]/blog/[slug]', 'page')
  revalidatePath('/[locale]', 'page')
  revalidatePath('/sitemap.xml')
}

function handleError(e: unknown) {
  const msg = e instanceof Error ? e.message : 'UNKNOWN'
  if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Kein Admin-Zugriff' }, { status: 403 })
  if (e instanceof BlogStatusError) return NextResponse.json({ error: msg }, { status: 422 })
  console.error('[api/admin/blog]', e)
  return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
}

// ─── Liste (Admin sieht ALLE Status, nicht nur veröffentlichte) ──────────────
export async function GET() {
  try {
    await requireAdmin()
    const sb = await createAdminClient()
    const { data, error } = await sb
      .from('blog_posts')
      .select(`
        slug, status, published_at, content_updated_at, reading_minutes, ai_assisted,
        reviewed_by, reviewed_at, cta_tool_slug, related_guide_slugs, updated_at,
        blog_post_translations (locale, category, eyebrow, title, meta_description, lead),
        blog_post_sections (locale, position, heading, paragraphs, bullets, callout_tag, callout_body)
      `)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ posts: data ?? [] })
  } catch (e) {
    return handleError(e)
  }
}

// ─── Anlegen / Bearbeiten ───────────────────────────────────────────────────
export async function PUT(request: Request) {
  try {
    await requireAdmin()
    const parsed = PostSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: `Ungültige Eingabe — ${formatPostIssues(parsed.error.issues)}`, details: parsed.error.issues },
        { status: 422 }
      )
    }
    const p = parsed.data
    const locales = postLocales(p)
    const sb = await createAdminClient()

    // Der Beitrag selbst: Status und Freigabe werden hier NICHT angefasst — dafür
    // gibt es PATCH. Eine inhaltliche Bearbeitung darf keine Freigabe auslösen.
    const { data: post, error: postError } = await sb
      .from('blog_posts')
      .upsert(
        {
          slug: p.slug,
          reading_minutes: p.reading_minutes,
          ai_assisted: p.ai_assisted,
          cta_tool_slug: p.cta_tool_slug ?? null,
          related_guide_slugs: p.related_guide_slugs,
          content_updated_at: p.content_updated_at ?? null,
        },
        { onConflict: 'slug' }
      )
      .select('id')
      .single()
    if (postError) throw postError

    for (const locale of BLOG_LOCALES) {
      const text = p[locale]
      // Eine im Editor entfernte Sprache auch in der Datenbank entfernen — ihre
      // Abschnitte werden unten ohnehin ersetzt, ein verwaister Titel ohne Text
      // würde sonst als leerer Beitrag in dieser Sprache erscheinen.
      const { error } = text
        ? await sb
            .from('blog_post_translations')
            .upsert({ post_id: post.id, locale, ...text }, { onConflict: 'post_id,locale' })
        : await sb.from('blog_post_translations').delete().eq('post_id', post.id).eq('locale', locale)
      if (error) throw error
    }

    // Abschnitte vollständig ersetzen statt einzeln abzugleichen: Beim Löschen oder
    // Umsortieren im Editor wäre ein Teilabgleich fehleranfällig, und die Zahl der
    // Abschnitte ist klein.
    const { error: delError } = await sb.from('blog_post_sections').delete().eq('post_id', post.id)
    if (delError) throw delError

    const rows = p.sections.flatMap((section, position) =>
      locales.flatMap((locale) => {
        const s = section[locale]
        // Das Schema garantiert s für jede vorhandene Sprache; der Guard dient nur TS.
        if (!s) return []
        return [{
          post_id: post.id,
          locale,
          position,
          heading: s.heading,
          paragraphs: s.paragraphs,
          bullets: s.bullets,
          callout_tag: s.callout_tag ?? null,
          callout_body: s.callout_body ?? null,
        }]
      })
    )
    const { error: insError } = await sb.from('blog_post_sections').insert(rows)
    if (insError) throw insError

    revalidateBlogSurfaces()
    return NextResponse.json({ ok: true, slug: p.slug })
  } catch (e) {
    return handleError(e)
  }
}

// ─── Statuswechsel (Prüfung, Freigabe, Deaktivierung) ───────────────────────
export async function PATCH(request: Request) {
  try {
    await requireAdmin()
    const parsed = StatusSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Eingabe', details: parsed.error.issues }, { status: 422 })
    }
    const { slug, status, reviewed_by } = parsed.data
    const sb = await createAdminClient()

    const { data: existing, error: readError } = await sb
      .from('blog_posts')
      .select('published_at, reviewed_by, reviewed_at')
      .eq('slug', slug)
      .single()
    if (readError) throw readError

    const update = computeStatusChange({
      nextStatus: status,
      reviewedBy: reviewed_by,
      existingPublishedAt: existing.published_at,
      existingReviewedBy: existing.reviewed_by,
      existingReviewedAt: existing.reviewed_at,
      now: new Date(),
    })

    const { error } = await sb.from('blog_posts').update(update).eq('slug', slug)
    if (error) throw error

    revalidateBlogSurfaces()
    return NextResponse.json({ ok: true, ...update })
  } catch (e) {
    return handleError(e)
  }
}

// ─── Löschen ────────────────────────────────────────────────────────────────
export async function DELETE(request: Request) {
  try {
    await requireAdmin()
    const slug = new URL(request.url).searchParams.get('slug')
    if (!slug) return NextResponse.json({ error: 'slug fehlt' }, { status: 400 })

    const sb = await createAdminClient()
    // Übersetzungen und Abschnitte hängen per ON DELETE CASCADE dran.
    const { error } = await sb.from('blog_posts').delete().eq('slug', slug)
    if (error) throw error

    revalidateBlogSurfaces()
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}

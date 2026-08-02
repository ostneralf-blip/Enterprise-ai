import { BLOG_POSTS, BLOG_AUTHOR, getBlogPost, getSortedBlogPosts, type Bi } from '@/config/blog-data'
import { GUIDES } from '@/config/leitfaden-data'
import { TOOLS } from '@/config/tools-data'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Sammelt alle Bi-Felder eines Beitrags rekursiv ein, inklusive verschachtelter Abschnitte.
 *
 * `prose` unterscheidet Fließtext von kurzen Etiketten. Bei Etiketten (Kategorie,
 * Eyebrow, Callout-Tag) sind identische DE-/EN-Fassungen legitim — Fachbegriffe wie
 * „Governance" oder „Blog" heißen in beiden Sprachen gleich. Bei Fließtext wäre eine
 * identische Fassung dagegen ein vergessener Übersetzungsschritt.
 */
function collectBiFields(): { path: string; value: Bi; prose: boolean }[] {
  const out: { path: string; value: Bi; prose: boolean }[] = []
  for (const post of BLOG_POSTS) {
    const base = `BLOG_POSTS[${post.slug}]`
    out.push(
      { path: `${base}.category`, value: post.category, prose: false },
      { path: `${base}.eyebrow`, value: post.eyebrow, prose: false },
      { path: `${base}.title`, value: post.title, prose: true },
      { path: `${base}.metaDescription`, value: post.metaDescription, prose: true },
      { path: `${base}.lead`, value: post.lead, prose: true }
    )
    post.sections.forEach((section, si) => {
      out.push({ path: `${base}.sections[${si}].heading`, value: section.heading, prose: true })
      section.paragraphs.forEach((para, pi) =>
        out.push({ path: `${base}.sections[${si}].paragraphs[${pi}]`, value: para, prose: true })
      )
      section.bullets?.forEach((bullet, bi) =>
        out.push({ path: `${base}.sections[${si}].bullets[${bi}]`, value: bullet, prose: true })
      )
      if (section.callout) {
        out.push(
          { path: `${base}.sections[${si}].callout.tag`, value: section.callout.tag, prose: false },
          { path: `${base}.sections[${si}].callout.body`, value: section.callout.body, prose: true }
        )
      }
    })
  }
  return out
}

describe('Blog-Daten: Struktur', () => {
  it('enthält mindestens einen Beitrag', () => {
    expect(BLOG_POSTS.length).toBeGreaterThan(0)
  })

  it('Slugs sind eindeutig und URL-tauglich (kleingeschrieben, nur a-z, 0-9, Bindestrich)', () => {
    const slugs = BLOG_POSTS.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })

  it('Blog-Slugs kollidieren nicht mit Leitfaden-Slugs (getrennte Content-Silos)', () => {
    const guideSlugs = new Set(GUIDES.map((g) => g.slug))
    for (const post of BLOG_POSTS) {
      expect(guideSlugs.has(post.slug)).toBe(false)
    }
  })

  it('publishedAt/updatedAt sind gültige ISO-Daten, updatedAt liegt nicht vor publishedAt', () => {
    for (const post of BLOG_POSTS) {
      expect(post.publishedAt).toMatch(ISO_DATE)
      expect(Number.isNaN(Date.parse(post.publishedAt))).toBe(false)
      if (post.updatedAt) {
        expect(post.updatedAt).toMatch(ISO_DATE)
        expect(post.updatedAt >= post.publishedAt).toBe(true)
      }
    }
  })

  it('jeder Beitrag hat Abschnitte mit mindestens einem Absatz und eine positive Lesedauer', () => {
    for (const post of BLOG_POSTS) {
      expect(post.sections.length).toBeGreaterThan(0)
      expect(post.readingMinutes).toBeGreaterThan(0)
      for (const section of post.sections) {
        expect(section.paragraphs.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('Blog-Daten: Bilingualität (CLAUDE.md-Pflicht seit 09.07.2026)', () => {
  it('jedes Textfeld ist auf Deutsch UND Englisch gefüllt', () => {
    const missing = collectBiFields().filter(
      ({ value }) => !value?.de?.trim() || !value?.en?.trim()
    )
    expect(missing.map((m) => m.path)).toEqual([])
  })

  it('Fließtext ist tatsächlich übersetzt und nicht aus dem Deutschen kopiert', () => {
    const identical = collectBiFields().filter(
      ({ value, prose }) => prose && value.de.trim() === value.en.trim()
    )
    expect(identical.map((m) => m.path)).toEqual([])
  })

  it('Autorenrolle ist zweisprachig gepflegt', () => {
    expect(BLOG_AUTHOR.role.de.trim().length).toBeGreaterThan(0)
    expect(BLOG_AUTHOR.role.en.trim().length).toBeGreaterThan(0)
  })
})

describe('Blog-Daten: interne Verlinkung', () => {
  it('ctaToolSlug verweist auf ein existierendes Tool', () => {
    const toolSlugs = new Set(TOOLS.map((t) => t.slug))
    for (const post of BLOG_POSTS) {
      if (post.ctaToolSlug) {
        expect(toolSlugs.has(post.ctaToolSlug)).toBe(true)
      }
    }
  })

  it('relatedGuideSlugs verweisen auf existierende Leitfäden', () => {
    const guideSlugs = new Set(GUIDES.map((g) => g.slug))
    for (const post of BLOG_POSTS) {
      for (const slug of post.relatedGuideSlugs ?? []) {
        expect(guideSlugs.has(slug)).toBe(true)
      }
    }
  })
})

describe('Blog-Daten: Zugriffsfunktionen', () => {
  it('getBlogPost findet einen vorhandenen Beitrag und liefert undefined bei unbekanntem Slug', () => {
    expect(getBlogPost(BLOG_POSTS[0].slug)?.slug).toBe(BLOG_POSTS[0].slug)
    expect(getBlogPost('gibt-es-nicht')).toBeUndefined()
  })

  it('getSortedBlogPosts sortiert absteigend nach Datum, ohne das Original zu verändern', () => {
    const originalOrder = BLOG_POSTS.map((p) => p.slug)
    const sorted = getSortedBlogPosts()

    expect(sorted).toHaveLength(BLOG_POSTS.length)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].publishedAt >= sorted[i].publishedAt).toBe(true)
    }
    expect(BLOG_POSTS.map((p) => p.slug)).toEqual(originalOrder)
  })
})

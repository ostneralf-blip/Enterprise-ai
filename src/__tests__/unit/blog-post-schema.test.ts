import { PostSchema, postLocales, formatPostIssues } from '@/lib/blog-post-schema'

const text = (suffix: string) => ({
  category: `Kategorie ${suffix}`,
  eyebrow: `Blog · ${suffix}`,
  title: `Titel ${suffix}`,
  meta_description: `Beschreibung ${suffix}`,
  lead: `Anreißer ${suffix}`,
})
const section = (suffix: string) => ({
  heading: `Überschrift ${suffix}`,
  paragraphs: [`Absatz ${suffix}`],
  bullets: [],
  callout_tag: null,
  callout_body: null,
})
const base = { slug: 'mein-beitrag', reading_minutes: 6, ai_assisted: false, related_guide_slugs: [] }

describe('PostSchema', () => {
  it('akzeptiert einen zweisprachigen Beitrag', () => {
    const r = PostSchema.safeParse({
      ...base, de: text('de'), en: text('en'),
      sections: [{ de: section('de'), en: section('en') }],
    })
    expect(r.success).toBe(true)
  })

  it('akzeptiert einen rein deutschen Beitrag (Regression: Bearbeiten scheiterte mit „Ungültige Eingabe")', () => {
    const r = PostSchema.safeParse({ ...base, de: text('de'), sections: [{ de: section('de') }] })
    expect(r.success).toBe(true)
    if (r.success) expect(postLocales(r.data)).toEqual(['de'])
  })

  it('akzeptiert einen rein englischen Beitrag', () => {
    const r = PostSchema.safeParse({ ...base, en: text('en'), sections: [{ en: section('en') }] })
    expect(r.success).toBe(true)
    if (r.success) expect(postLocales(r.data)).toEqual(['en'])
  })

  it('lehnt einen Beitrag ohne jede Sprache ab', () => {
    const r = PostSchema.safeParse({ ...base, sections: [{}] })
    expect(r.success).toBe(false)
  })

  it('verlangt für jede vorhandene Sprache jeden Abschnitt', () => {
    const r = PostSchema.safeParse({
      ...base, de: text('de'), en: text('en'),
      sections: [{ de: section('de'), en: section('en') }, { de: section('de2') }],
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues.some(i => i.path.join('.') === 'sections.1.en')).toBe(true)
  })

  it('lehnt Abschnittstexte in einer Sprache ohne Kopfdaten ab', () => {
    const r = PostSchema.safeParse({ ...base, de: text('de'), sections: [{ de: section('de'), en: section('en') }] })
    expect(r.success).toBe(false)
  })

  it('lehnt eine halb ausgefüllte Sprache weiterhin ab', () => {
    const r = PostSchema.safeParse({
      ...base, de: text('de'), en: { ...text('en'), title: '' },
      sections: [{ de: section('de'), en: section('en') }],
    })
    expect(r.success).toBe(false)
  })
})

describe('formatPostIssues', () => {
  it('benennt die betroffenen Felder statt nur „Ungültige Eingabe"', () => {
    const r = PostSchema.safeParse({
      ...base, de: { ...text('de'), title: '' },
      sections: [{ de: section('de') }],
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(formatPostIssues(r.error.issues)).toContain('de.title')
  })
})

import { blogPostUrl, blogAlternateLanguages, toBlogLocales } from '@/lib/blog-alternates'

const BASE = 'https://enterprise-ai.biz'

describe('blogPostUrl', () => {
  it('setzt das /en-Präfix nur für Englisch', () => {
    expect(blogPostUrl(BASE, 'a', 'de')).toBe(`${BASE}/blog/a`)
    expect(blogPostUrl(BASE, 'a', 'en')).toBe(`${BASE}/en/blog/a`)
  })
})

describe('blogAlternateLanguages', () => {
  it('verweist bei zweisprachigen Beiträgen auf beide Fassungen, x-default auf Deutsch', () => {
    expect(blogAlternateLanguages(BASE, 'a', ['de', 'en'])).toEqual({
      de: `${BASE}/blog/a`,
      en: `${BASE}/en/blog/a`,
      'x-default': `${BASE}/blog/a`,
    })
  })

  it('verweist bei rein deutschen Beiträgen NICHT auf eine englische 404-Seite', () => {
    expect(blogAlternateLanguages(BASE, 'a-dach', ['de'])).toEqual({
      de: `${BASE}/blog/a-dach`,
      'x-default': `${BASE}/blog/a-dach`,
    })
  })

  it('lässt x-default bei rein englischen Beiträgen auf die englische Fassung zeigen', () => {
    expect(blogAlternateLanguages(BASE, 'a', ['en'])).toEqual({
      en: `${BASE}/en/blog/a`,
      'x-default': `${BASE}/en/blog/a`,
    })
  })

  it('liefert ohne Sprache keine Alternativen', () => {
    expect(blogAlternateLanguages(BASE, 'a', [])).toEqual({})
  })
})

describe('toBlogLocales', () => {
  it('filtert unbekannte Werte, entfernt Dubletten und sortiert DE vor EN', () => {
    expect(toBlogLocales(['en', 'fr', 'de', 'en', null])).toEqual(['de', 'en'])
  })
})
